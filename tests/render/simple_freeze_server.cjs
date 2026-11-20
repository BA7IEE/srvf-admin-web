// Server acceptance against an isolated same-origin stack with synthetic accounts.
// FIXTURE_PASSWORD_FILE points to the generated read-only test secret, never a browser profile.
const { chromium } = require("playwright-core");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const origin = "http://localhost:8080";
const list = origin + "/#/srvf/activities-domain/activities";
const password = fs
  .readFileSync(process.env.FIXTURE_PASSWORD_FILE, "utf8")
  .trim();
const noMetrics = ["not_required", "text_change_race"].includes(
  process.env.SCENARIO
);
const paired = process.env.SCENARIO === "text_change_race";
const description = "T38 参与者请携带训练记录本";
const originalDescription = "T38 由草稿发起人保存的说明";
const layout = ["published_layout", "occupied_layout"].includes(
  process.env.SCENARIO
);
const title = layout
  ? "T41 单场次变更"
  : noMetrics
    ? "T37 无需指标"
    : "T37 指标训练";
async function login(browser, actor) {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);
  p.on("response", async r => {
    const path = new URL(r.url()).pathname;
    if (!path.startsWith("/api/")) return;
    try {
      const b = await r.json();
      console.log(
        JSON.stringify({
          actor,
          path,
          status: r.status(),
          code: b.code,
          reqId: r.headers()["x-request-id"] || b.requestId
        })
      );
    } catch {}
  });
  await p.goto(origin);
  await p.getByPlaceholder("账号").fill(actor);
  await p.locator("input[type=password]").fill(password);
  await Promise.all([
    p.waitForURL(u => !u.hash.startsWith("#/login")),
    p.getByRole("button", { name: /登.*录/ }).click()
  ]);
  return p;
}
async function post(p, suffix, click, status, code) {
  const [r] = await Promise.all([
    p.waitForResponse(
      r =>
        r.request().method() === "POST" &&
        new URL(r.url()).pathname.endsWith(suffix)
    ),
    click()
  ]);
  const data = await r.json();
  assert.equal(r.status(), status);
  assert.equal(data.code, code);
  return { r, data: data.data };
}
async function create(p, legacy) {
  await p.goto(list);
  await p.getByRole("button", { name: "筹备单场次活动" }).click();
  const item = t =>
    p
      .locator(".el-form-item")
      .filter({ has: p.locator("label", { hasText: t }) });
  async function select(t, name) {
    await item(t).locator(".el-select").click();
    await p.getByRole("option", { name }).first().click();
  }
  await select("承办组织", /Lab team/);
  await select(
    "活动模板版本",
    legacy ? /T37 未配置/ : noMetrics ? /T34 单场次/ : /T36 指标/
  );
  for (const [key, v] of [
    ["活动标题", legacy ? "T37 未配置活动" : title],
    ["开始时间", "2026-12-01 09:00"],
    ["结束时间", "2026-12-01 11:00"],
    ["活动地点", "T37 场地"]
  ]) {
    const el = item(key).locator("input").first();
    await el.fill(v);
    await el.press("Tab");
  }
  await select("地点对谁可见", "录取后可见");
  return (
    await post(
      p,
      "/from-template",
      () => p.getByRole("button", { name: "创建草稿并核对场次" }).click(),
      201,
      0
    )
  ).data.activityId;
}
async function submit(p, id, legacy) {
  await p.getByRole("button", { name: "核对并提交审核" }).click();
  await p.locator("label.el-checkbox").filter({ hasText: "我已核对" }).click();
  const result = await post(
    p,
    "/publish-reviews",
    () => p.getByRole("button", { name: "确认提交发布审核" }).click(),
    legacy ? 400 : 200,
    legacy ? 20174 : 0
  );
  assert.match(
    result.r.request().postDataJSON().expectedDraftHash,
    /^[a-f0-9]{64}$/
  );
  if (!legacy) assert.equal(result.data.status, "pending");
  return result.data?.id;
}
// Allow an ordinary draft save to commit between the browser's final GET and POST.
// The held request is forwarded unchanged. The editor uses the initiator's normal App session.
async function concurrentEdit(browser, page, id) {
  const editor = await browser.newPage();
  await editor.goto(origin);
  await page.getByRole("button", { name: "核对并提交审核" }).click();
  await page
    .locator("label.el-checkbox")
    .filter({ hasText: "我已核对" })
    .click();
  const endpoint = "**/api/admin/v1/activities/" + id + "/publish-reviews";
  let release;
  const held = new Promise(resolve => {
    release = resolve;
  });
  await page.route(endpoint, async route => {
    await held;
    await route.continue();
  });
  const outgoing = page.waitForRequest(
    r => r.method() === "POST" && r.url().endsWith("/publish-reviews")
  );
  const result = page.waitForResponse(
    r => r.request().method() === "POST" && r.url().endsWith("/publish-reviews")
  );
  await page.getByRole("button", { name: "确认提交发布审核" }).click();
  const request = await outgoing;
  const confirmed = request.postDataJSON().expectedDraftHash;
  assert.match(confirmed, /^[a-f0-9]{64}$/);
  try {
    // The second browser context signs in independently and calls the published
    // managed PATCH. Only status, business code and request ID leave the page.
    const saved = await editor.evaluate(
      async ({ id, password, description }) => {
        const response = await fetch("/api/auth/v1/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "lab", password })
        });
        const login = await response.json();
        if (response.status !== 200 || login.code !== 0)
          throw Error("editor login failed");
        const edited = await fetch(
          "/api/app/v1/my/managed-activities/" + encodeURIComponent(id),
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + login.data.accessToken
            },
            body: JSON.stringify({ description })
          }
        );
        const body = await edited.json();
        return {
          status: edited.status,
          code: body.code,
          reqId: edited.headers.get("x-request-id")
        };
      },
      { id, password, description: originalDescription }
    );
    console.log(
      JSON.stringify({
        actor: "lab-editor",
        path: "/api/app/v1/my/managed-activities/" + id,
        ...saved
      })
    );
    assert.equal(saved.status, 200);
    assert.equal(saved.code, 0);
  } finally {
    release();
    await editor.close();
  }
  const rejected = await result;
  assert.equal(rejected.status(), 409);
  assert.equal((await rejected.json()).code, 20255);
  await page
    .getByText(/本次尝试遇到草稿版本变化/)
    .first()
    .waitFor();
  console.log(
    "PASS confirmed browser POST rejected after committed browser edit"
  );
  await page.unroute(endpoint);
  // A fresh login independently reads and confirms the saved version.
  const fresh = await login(browser, "lab");
  await fresh.goto(list + "/" + id + "/simple-draft");
  return { fresh, confirmed };
}
async function decide(p, id, change, { inspect, status = 200, code = 0 } = {}) {
  const route = origin + "/#/srvf/workbench/publish-reviews/" + id;
  await p.goto(route);
  const button = p.getByRole("button", {
    name: change ? "通过活动变更" : "通过并发布",
    exact: true
  });
  await button.waitFor();
  await p.getByText("本页支持的冻结内容已列在下方", { exact: false }).waitFor();
  if (!noMetrics) {
    const metric = p
      .getByRole("button", { name: "指标集合", exact: true })
      .first();
    await metric.click();
    await p
      .locator(".el-collapse-item.is-active")
      .getByText("T36 完成", { exact: true })
      .first()
      .waitFor({ state: "visible" });
  }
  if (change && !inspect) {
    await p
      .getByText("申请的新标题", { exact: true })
      .first()
      .waitFor({ state: "visible" });
  }
  if (change && paired) {
    const section = p.locator(".el-collapse-item.is-active").filter({
      has: p.getByRole("button", { name: "本次变更", exact: true })
    });
    for (const value of [
      title,
      title + " 修订",
      originalDescription,
      description
    ]) {
      await section.getByText(value, { exact: true }).waitFor();
    }
    console.log(
      "PASS reviewer saw both original and proposed values for both fields"
    );
  }
  if (inspect) await inspect(p);
  const approved = await post(
    p,
    "/approve",
    async () => {
      await button.click();
      await p
        .locator("label.el-checkbox")
        .filter({ hasText: "我已核对" })
        .click();
      await p
        .getByRole("button", {
          name: change ? "确认通过活动变更" : "确认通过并发布",
          exact: true
        })
        .click();
    },
    status,
    code
  );
  if (status === 200) assert.equal(approved.data.status, "approved");
}
// Independent password login for contract negatives. Only status, business code and reqId leave this function.
async function rejectAs(actor, path, body, status, code) {
  const login = await fetch(origin + "/api/auth/v1/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: actor, password })
  });
  const session = await login.json();
  assert.equal(session.code, 0);
  const r = await fetch(origin + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + session.data.accessToken
    },
    body: JSON.stringify(body)
  });
  const value = await r.json();
  console.log(
    JSON.stringify({
      actor,
      path,
      status: r.status,
      code: value.code,
      reqId: r.headers.get("x-request-id")
    })
  );
  assert.equal(r.status, status);
  assert.equal(value.code, code);
}
async function run() {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE
  });
  try {
    let p = await login(b, "lab");
    if (layout) {
      const reviewer = await login(b, "reviewer");
      const check = require("./simple_published_layout.cjs");
      const open = async id => {
        const read = p.waitForResponse(
          r =>
            r.request().method() === "GET" &&
            r.url().endsWith("/" + id + "/simple-draft")
        );
        if (p.url() === list + "/" + id + "/simple-draft") await p.reload();
        else await p.goto(list + "/" + id + "/simple-draft");
        const response = await read,
          json = await response.json();
        assert.equal(response.status(), 200);
        assert.equal(json.code, 0);
        return json.data;
      };
      if (process.env.SCENARIO === "occupied_layout") {
        assert(process.env.ACTIVITY_ID);
        await check.occupied({
          p,
          reviewer,
          id: process.env.ACTIVITY_ID,
          open,
          post,
          decide
        });
      } else {
        const id = process.env.ACTIVITY_ID || (await create(p, false));
        if (!process.env.ACTIVITY_ID) {
          const initial = await submit(p, id, false);
          await decide(reviewer, initial, false);
        }
        await check.positive({
          p,
          reviewer,
          id,
          open,
          post,
          decide,
          rejectAs,
          origin
        });
      }
      return;
    }
    const legacy = process.env.SCENARIO === "unconfigured";
    const id = process.env.ACTIVITY_ID || (await create(p, legacy));
    if (process.env.ACTIVITY_ID)
      await p.goto(list + "/" + id + "/simple-draft");
    let staleHash;
    if (paired) {
      const race = await concurrentEdit(b, p, id);
      p = race.fresh;
      staleHash = race.confirmed;
    }
    if (!process.env.REVIEW_ID && !paired) {
      await rejectAs(
        "lab",
        "/api/admin/v1/activities/" + id + "/publish-reviews",
        {
          operationKey: "version-" + id,
          confirmation: true,
          expectedDraftHash: "0".repeat(64)
        },
        409,
        20255
      );
    }
    const nextRequest = paired
      ? p.waitForRequest(
          r => r.method() === "POST" && r.url().endsWith("/publish-reviews")
        )
      : null;
    const initial = process.env.REVIEW_ID || (await submit(p, id, legacy));
    if (nextRequest)
      assert.notEqual(
        (await nextRequest).postDataJSON().expectedDraftHash,
        staleHash
      );
    if (legacy) {
      console.log("PASS unconfigured refused");
      return;
    }
    const reviewer = await login(b, "reviewer");
    if (!process.env.PUBLISHED) {
      if (!noMetrics) {
        const detail = "**/api/admin/v1/activity-publish-reviews/" + initial;
        let approvedDuringPartial = 0;
        const count = r => {
          if (r.method() === "POST" && r.url().endsWith("/approve"))
            approvedDuringPartial++;
        };
        reviewer.on("request", count);
        await reviewer.route(detail, async route => {
          const response = await route.fetch();
          const body = await response.json();
          assert(body.data.frozenMetricSets?.[0].metrics.length);
          body.data.frozenMetricSets[0].metrics = [];
          await route.fulfill({ response, json: body });
        });
        await reviewer.goto(
          origin + "/#/srvf/workbench/publish-reviews/" + initial
        );
        await reviewer
          .getByText(/缺少与冻结指针一致的完整指标集/)
          .first()
          .waitFor();
        assert(
          await reviewer
            .getByRole("button", { name: "通过并发布", exact: true })
            .isDisabled()
        );
        assert.equal(approvedDuringPartial, 0);
        console.log(
          "PASS incomplete metric detail disabled; zero approve requests"
        );
        await reviewer.unroute(detail);
        reviewer.off("request", count);
        await reviewer.reload();
      }
      await decide(reviewer, initial, false);
    }
    await p.goto(list + "/" + id + "/simple-draft");
    await p.getByRole("button", { name: "刷新状态", exact: true }).click();
    let change = process.env.CHANGE_ID;
    if (!change) {
      await p
        .getByRole("textbox", { name: "申请的新标题" })
        .fill(title + " 修订");
      if (paired)
        await p
          .getByRole("textbox", { name: "申请的新活动说明" })
          .fill(description);
      const submitted = await post(
        p,
        "/change-reviews",
        () => p.getByRole("button", { name: "提交活动变更审核" }).click(),
        200,
        0
      );
      assert.equal(submitted.data.status, "pending");
      change = submitted.data.id;
      if (paired) {
        assert.deepEqual(submitted.r.request().postDataJSON().activityPatch, {
          title: title + " 修订",
          description
        });
        const facts = submitted.data.snapshot;
        assert.equal(facts.base.activity.description, originalDescription);
        assert.equal(facts.activity.description, description);
        assert.equal(facts.base.activity.title, title);
        assert.equal(facts.activity.title, title + " 修订");
        console.log(
          "PASS two changes in one frozen proposal; original and target matched"
        );
      }
    }
    if (paired) {
      // An extra frozen difference outside the text form must block approval.
      const detail = "**/api/admin/v1/activity-publish-reviews/" + change;
      let sends = 0;
      const observe = r => {
        if (r.method() === "POST" && r.url().endsWith("/approve")) sends++;
      };
      reviewer.on("request", observe);
      await reviewer.route(detail, async route => {
        const response = await route.fetch();
        const data = await response.json();
        const activity = data.data.snapshot.activity;
        activity.capacity = (activity.capacity ?? 0) + 1;
        await route.fulfill({ response, json: data });
      });
      await reviewer.goto(
        origin + "/#/srvf/workbench/publish-reviews/" + change
      );
      await reviewer
        .getByText(/申请差异未完整核对/)
        .first()
        .waitFor();
      assert(
        await reviewer
          .getByRole("button", { name: "通过活动变更", exact: true })
          .isDisabled()
      );
      assert.equal(sends, 0);
      console.log(
        "PASS unsupported third field blocked; zero approve requests"
      );
      await reviewer.unroute(detail);
      reviewer.off("request", observe);
      await reviewer.reload();
    }
    await decide(reviewer, change, true);
    await rejectAs(
      "reviewer",
      "/api/app/v1/my/managed-activities/" + id + "/change-reviews",
      {
        operationKey: "unauthorized-" + id,
        confirmation: true,
        activityPatch: { title: "禁止代提" },
        sessions: { create: [], update: [], cancel: [] },
        positions: { create: [], update: [], cancel: [] }
      },
      404,
      20001
    );
    await p.reload();
    await p
      .getByText(title + " 修订", { exact: true })
      .first()
      .waitFor();
    if (paired) {
      await p.getByText(description, { exact: true }).first().waitFor();
      console.log("PASS title and description both read back after approval");
    }
    console.log(
      "PASS " +
        (noMetrics ? "not_required" : "required") +
        " initial and title change approved; persisted title read from page"
    );
  } finally {
    await b.close();
  }
}
run().catch(e => {
  console.error(e.name, String(e.message).slice(0, 320));
  process.exitCode = 1;
});
