import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createMemberSaveGate,
  createMemberPayload,
  memberFieldError,
  saveMemberForm,
  updateMemberPayload
} from "../src/views/srvf/members-domain/members/member-form-state.ts";

test("repeated submissions during validation or save perform one write", async () => {
  const run = createMemberSaveGate();
  let resumeValidation;
  let resumeWrite;
  let writes = 0;
  const validation = new Promise(resolve => {
    resumeValidation = resolve;
  });
  const write = new Promise(resolve => {
    resumeWrite = resolve;
  });
  const first = run(async confirm => {
    await validation;
    writes++;
    await write;
    confirm();
  });
  assert.equal(
    await run(async () => {
      writes++;
    }),
    false
  );
  resumeValidation();
  await Promise.resolve();
  assert.equal(writes, 1);
  assert.equal(
    await run(async () => {
      writes++;
    }),
    false
  );
  resumeWrite();
  assert.equal(await first, true);
  assert.equal(
    await run(async () => {
      writes++;
    }),
    false
  );
  assert.equal(writes, 1);
});

test("the save gate releases after a validation or request error", async () => {
  const run = createMemberSaveGate();
  await assert.rejects(
    run(async () => {
      throw new Error("synthetic failure");
    })
  );
  assert.equal(await run(async () => {}), true);
});

const form = () => ({
  isEdit: false,
  memberNo: "QA-123",
  realName: "合成队员",
  nickname: "",
  memberSinceDate: "2020-02-29",
  memberOriginCode: "manual",
  gradeCode: ""
});

test("a valid create sends the four required contract fields once", async () => {
  const sent = [];
  const result = await saveMemberForm(form(), undefined, {
    create: async body => {
      sent.push(body);
      return {
        code: 0,
        message: "ok",
        data: { id: "member-1", memberNo: body.memberNo }
      };
    },
    update: async () => assert.fail("create must not update")
  });
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(sent, [
    {
      memberNo: "QA-123",
      realName: "合成队员",
      memberSinceDate: "2020-02-29",
      memberOriginCode: "manual"
    }
  ]);
  assert.equal("displayName" in sent[0], false);
});

test("every required create field blocks a request when missing", async () => {
  for (const [field, expected] of [
    ["memberNo", /编号/],
    ["realName", /真实姓名/],
    ["memberSinceDate", /发号日/],
    ["memberOriginCode", /来源代码/]
  ]) {
    const value = { ...form(), [field]: "" };
    const result = await saveMemberForm(value, undefined, {
      create: async () => assert.fail(`missing ${field} must not send`),
      update: async () => assert.fail("must not update")
    });
    assert.equal(result.ok, false);
    assert.match(result.message, expected);
  }
});

test("create validates format, length, whitespace and actual calendar days", () => {
  assert.match(memberFieldError("memberNo", " M-1"), /编号/);
  assert.match(memberFieldError("memberNo", "x".repeat(33)), /编号/);
  assert.match(memberFieldError("realName", "  "), /真实姓名/);
  assert.match(memberFieldError("realName", "甲".repeat(65)), /64/);
  assert.match(memberFieldError("memberSinceDate", "2021-02-29"), /有效/);
  assert.match(memberFieldError("memberOriginCode", null), /来源/);
  assert.match(memberFieldError("nickname", "  "), /空白/);
  assert.equal(memberFieldError("memberSinceDate", "2020-02-29"), "");
});

test("optional fields are explicit and origin is not treated as a closed enum", () => {
  const result = createMemberPayload({
    ...form(),
    nickname: "小队员",
    gradeCode: "fixture-grade",
    memberOriginCode: "custom-source"
  });
  assert.equal(result.ok, true);
  assert.equal(result.body.nickname, "小队员");
  assert.equal(result.body.gradeCode, "fixture-grade");
  assert.equal(result.body.memberOriginCode, "custom-source");
});

test("edit uses the update whitelist and explicitly clears a changed nickname", () => {
  const original = { id: "member-1", nickname: "原昵称", gradeCode: "grade-a" };
  const edited = {
    ...form(),
    isEdit: true,
    nickname: "",
    gradeCode: "grade-a"
  };
  assert.deepEqual(updateMemberPayload(edited, original), {
    ok: true,
    body: { realName: "合成队员", nickname: null }
  });
  assert.match(
    updateMemberPayload({ ...edited, gradeCode: "" }, original).message,
    /不支持清空等级/
  );
});

test("edit performs one PATCH with no immutable identity fields", async () => {
  const original = { id: "member-1", nickname: "原昵称", gradeCode: "grade-a" };
  const sent = [];
  const result = await saveMemberForm(
    { ...form(), isEdit: true, nickname: "", gradeCode: "grade-a" },
    original,
    {
      create: async () => assert.fail("edit must not create"),
      update: async (id, body) => {
        sent.push({ id, body });
        return { code: 0, message: "ok", data: { id } };
      }
    }
  );
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(sent, [
    {
      id: "member-1",
      body: { realName: "合成队员", nickname: null }
    }
  ]);
});

test("nonzero responses and uncertain network writes do not become success or retry", async () => {
  let calls = 0;
  const ports = {
    create: async () => {
      calls++;
      return { code: 15001, message: "编号已被占用" };
    },
    update: async () => assert.fail("must not update")
  };
  assert.deepEqual(await saveMemberForm(form(), undefined, ports), {
    ok: false,
    message: "编号已被占用"
  });
  assert.equal(calls, 1);
  ports.create = async () => {
    calls++;
    throw new Error("offline");
  };
  const uncertain = await saveMemberForm(form(), undefined, ports);
  assert.equal(uncertain.ok, false);
  assert.match(uncertain.message, /结果未确认.*先按编号查询/);
  assert.equal(calls, 2);
  ports.create = async () => {
    calls++;
    throw { response: { status: 403 } };
  };
  assert.match(
    (await saveMemberForm(form(), undefined, ports)).message,
    /没有权限/
  );
  ports.create = async () => {
    calls++;
    throw { response: { status: 503 } };
  };
  assert.match(
    (await saveMemberForm(form(), undefined, ports)).message,
    /结果未确认.*服务异常/
  );
  assert.equal(calls, 4);
});

test("a malformed or unrelated success response cannot confirm creation", async () => {
  for (const data of [null, {}, { id: "member-1", memberNo: "other" }]) {
    let calls = 0;
    const result = await saveMemberForm(form(), undefined, {
      create: async () => {
        calls++;
        return { code: 0, message: "ok", data };
      },
      update: async () => assert.fail("must not update")
    });
    assert.equal(result.ok, false);
    assert.match(result.message, /无法核对.*按编号查询/);
    assert.equal(calls, 1);
  }
});

test("receipt matching uses the submitted number even if the form later changes", async () => {
  const input = form();
  let reply;
  const pending = saveMemberForm(input, undefined, {
    create: () =>
      new Promise(resolve => {
        reply = resolve;
      }),
    update: async () => assert.fail("must not update")
  });
  input.memberNo = "QA-456";
  reply({
    code: 0,
    message: "ok",
    data: { id: "member-1", memberNo: "QA-123" }
  });
  assert.deepEqual(await pending, { ok: true });
});
