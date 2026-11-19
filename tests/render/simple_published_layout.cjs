// Isolated server Chromium scenarios for the published Simple activity, with two ordinary accounts.
const assert = require("node:assert/strict");
const button = p =>
  p.getByRole("button", { name: "提交活动变更审核", exact: true });
const capacity = p => p.getByRole("textbox", { name: "申请的人数上限" });
const submitted = (post, p) =>
  post(p, "/change-reviews", () => button(p).click(), 200, 0);
const empty = () => ({ create: [], update: [], cancel: [] });
async function positive({
  p,
  reviewer,
  id,
  open,
  post,
  decide,
  rejectAs,
  origin
}) {
  const base = await open(id);
  const path = "/api/app/v1/my/managed-activities/" + id + "/change-reviews";
  for (const [patch, code] of [
    [{ startAt: base.endAt }, 20015],
    [{ location: "" }, 40000],
    [
      { startAt: new Date(Date.parse(base.startAt) + 60000).toISOString() },
      20134
    ]
  ]) {
    await rejectAs(
      "lab",
      path,
      {
        operationKey: crypto.randomUUID(),
        confirmation: true,
        activityPatch: patch,
        sessions: empty(),
        positions: empty()
      },
      400,
      code
    );
    assert.equal((await open(id)).draftHash, base.draftHash);
  }
  const location = p.getByRole("textbox", { name: "申请的地点文字" });
  await location.fill(" ");
  assert(await button(p).isDisabled());
  await location.fill("T41 东侧训练区");
  const start = p.getByLabel("申请的开始时间"),
    end = p.getByLabel("申请的结束时间");
  await start.fill("2026-12-03T10:00");
  assert(await button(p).isDisabled());
  await end.fill("2026-12-03T12:00");
  await capacity(p).fill("0");
  assert(await button(p).isDisabled());
  await capacity(p).fill("12");
  const result = await submitted(post, p);
  const s = result.data.snapshot;
  const expected = {
    startAt: "2026-12-03T02:00:00.000Z",
    endAt: "2026-12-03T04:00:00.000Z",
    location: "T41 东侧训练区",
    capacity: 12
  };
  assert.deepEqual(result.r.request().postDataJSON().activityPatch, expected);
  assert.equal(result.data.status, "pending");
  assert.equal((await open(id)).startAt, base.startAt);
  assert.deepEqual(s.activityPlaces, s.base.activityPlaces);
  assert.equal(s.sessions[0].locationText, expected.location);
  const detail = "**/api/admin/v1/activity-publish-reviews/" + result.data.id;
  let approvalRequests = 0;
  const count = r => {
    if (r.method() === "POST" && r.url().endsWith("/approve"))
      approvalRequests++;
  };
  reviewer.on("request", count);
  await reviewer.route(detail, async route => {
    const response = await route.fetch(),
      body = await response.json();
    body.data.snapshot.activityPlaces[0].addressText += " 未核对";
    await route.fulfill({ response, json: body });
  });
  await reviewer.goto(
    origin + "/#/srvf/workbench/publish-reviews/" + result.data.id
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
  assert.equal(approvalRequests, 0);
  await reviewer.unroute(detail);
  reviewer.off("request", count);
  await reviewer.reload();
  await decide(reviewer, result.data.id, true, {
    inspect: async page => {
      const section = page.locator(".el-collapse-item.is-active").filter({
        has: page.getByRole("button", { name: "本次变更", exact: true })
      });
      for (const [label, value] of [
        ["原开始时间", "2026-12-01 09:00（北京时间）"],
        ["申请的新开始时间", "2026-12-03 10:00（北京时间）"],
        ["原结束时间", "2026-12-01 11:00（北京时间）"],
        ["申请的新结束时间", "2026-12-03 12:00（北京时间）"],
        ["原地点文字", base.location],
        ["申请的新地点文字", expected.location],
        ["申请的新场次地点文字", expected.location],
        ["原人数上限", String(base.instance.capacity ?? "不限人数")],
        ["申请的新人数上限", "12"],
        ["申请的新场次人数上限", "12"],
        ["申请的新岗位人数上限", "12"]
      ]) {
        const fact = section.locator(".frozen-fact").filter({
          has: page.getByText(label, { exact: true })
        });
        assert.equal(await fact.locator("dd").innerText(), value);
      }
      await section
        .getByText("申请的新场次签到开放", { exact: true })
        .waitFor();
    }
  });
  const saved = await open(id);
  for (const key of ["startAt", "endAt", "location"])
    assert.equal(saved[key], expected[key]);
  for (const layer of [saved.instance, saved.session, saved.position])
    assert.equal(layer.capacity, 12);
  assert.equal(saved.session.startAt, saved.startAt);
  assert.equal(saved.session.endAt, saved.endAt);
  assert.deepEqual(saved.places, base.places);
  assert.equal(await location.inputValue(), expected.location);
  await p
    .locator(".el-descriptions")
    .getByText(expected.location, { exact: true })
    .waitFor();
  await p
    .locator(".el-descriptions")
    .getByText("地点安排（地址及可见范围）", { exact: true })
    .waitFor();
  console.log(
    "PASS joint approval, layer readback, original place records and negative controls; activity=" +
      id
  );
  await capacity(p).fill("");
  const unlimited = await submitted(post, p);
  assert.equal(unlimited.data.snapshot.activity.capacity, null);
  await decide(reviewer, unlimited.data.id, true, {
    inspect: async page => {
      await page.getByText("申请的新岗位人数上限", { exact: true }).waitFor();
      await page.getByText("不限人数", { exact: true }).first().waitFor();
    }
  });
  const unlimitedRead = await open(id);
  for (const layer of [
    unlimitedRead.instance,
    unlimitedRead.session,
    unlimitedRead.position
  ])
    assert.equal(layer.capacity, null);
  console.log("PASS unlimited approved and read on three layers");
}
async function occupied({ p, reviewer, id, open, post, decide }) {
  const before = await open(id);
  assert.equal(before.instance.capacity, null);
  await capacity(p).fill("1");
  const receipt = await submitted(post, p);
  assert.equal(receipt.data.status, "pending");
  await decide(reviewer, receipt.data.id, true, {
    status: 409,
    code: 20147,
    inspect: async page => {
      await page.getByText("申请的新人数上限", { exact: true }).waitFor();
    }
  });
  const after = await open(id);
  assert.equal(after.review.status, "pending");
  assert.equal(after.review.id, receipt.data.id);
  for (const key of [
    "title",
    "location",
    "startAt",
    "endAt",
    "instance",
    "session",
    "position",
    "places"
  ])
    assert.deepEqual(after[key], before[key]);
  console.log(
    "PASS occupied capacity rejected; pending review retained; three layers unchanged"
  );
}
module.exports = { positive, occupied };
