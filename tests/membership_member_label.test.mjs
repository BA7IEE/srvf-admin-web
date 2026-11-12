import assert from "node:assert/strict";
import { test } from "node:test";
import { formatMembershipMember } from "../src/views/srvf/org-hr/memberships/utils/member-label.ts";

test("uses the member label supplied by the membership API", () => {
  const member = {
    id: "member-1",
    memberNo: "QA-1",
    realName: "测试队员",
    nickname: "小队员",
    label: "QA-1 · 测试队员(小队员)",
    gradeCode: null
  };
  assert.equal(
    formatMembershipMember({ memberId: "member-1", member }),
    "QA-1 · 测试队员(小队员)"
  );
});

test("falls back to the member ID when the expansion is absent", () => {
  assert.equal(formatMembershipMember({ memberId: "member-1" }), "member-1");
});
