import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { reviewIssues, reviewFailure, reviewRecoveryStore } from "../src/views/srvf/activities-domain/activities/simple/review-state.ts";

const now = Date.parse("2099-01-01T00:00:00Z");
const draft = {
  draftHash: "a".repeat(64),
  title: "合成培训", location: "合成场地", statusCode: "draft", editable: true,
  review: null, startAt: "2099-01-02T01:00:00Z", endAt: "2099-01-02T03:00:00Z",
  instance: { registrationDeadline: null }
};
test("preflight observes saved state and valid time boundaries without inventing content requirements", () => {
  assert.deepEqual(reviewIssues(draft, now), []);
  assert(reviewIssues({...draft, review: {status: "pending"}}, now).some(x => x.includes("已有发布审核")));
  assert(reviewIssues({...draft, statusCode: "published"}, now).some(x => x.includes("不在草稿")));
  assert(reviewIssues({...draft, editable: false}, now).some(x => x.includes("模板")));
  assert(reviewIssues({...draft, endAt: "2098-01-01T00:00:00Z", startAt: "2097-01-01T00:00:00Z"}, now).some(x => x.includes("结束时间已过")));
  assert(reviewIssues({...draft, instance: {registrationDeadline: "2098-12-31T00:00:00Z"}}, now).some(x => x.includes("截止时间已过")));
  assert.deepEqual(reviewIssues({...draft, instance: {registrationDeadline: new Date(now).toISOString()}}, now), []);
});
test("network/server failures remain uncertain; pending and key conflict are distinct", () => {
  assert.equal(reviewFailure(new Error("network")), "uncertain");
  assert.equal(reviewFailure({response: {status: 503}}), "uncertain");
  assert.equal(reviewFailure({response: {status: 409, data: {code: 20032}}}), "pending");
  assert.equal(reviewFailure({response: {status: 409, data: {code: 20143}}}), "key-conflict");
  for (const status of [401, 403, 404])
    assert.equal(reviewFailure({response: {status}}), "rejected");
});
class Memory {
  values = new Map();
  getItem(k) { return this.values.get(k) ?? null; }
  setItem(k,v) { this.values.set(k,v); }
  removeItem(k) { this.values.delete(k); }
}
test("review recovery preserves the exact body across refresh and is isolated by account/activity/origin", () => {
  const storage = new Memory();
  const a = reviewRecoveryStore(storage, "https://fixture.invalid", "user-a", "activity-a");
  const attempt = {body: {operationKey: "review-operation-0001", confirmation: true}};
  a.write(attempt);
  assert.deepEqual(reviewRecoveryStore(storage, "https://fixture.invalid", "user-a", "activity-a").read(), attempt);
  for (const args of [["https://fixture.invalid","user-b","activity-a"], ["https://fixture.invalid","user-a","activity-b"], ["https://different.invalid","user-a","activity-a"]])
    assert.equal(reviewRecoveryStore(storage, ...args).read(), null);
  a.write({...attempt, receipt: {id: "review-fixture", status: "pending", requestVersion: 1, submittedAt: "2099-01-01T00:00:00Z"}});
  assert.equal(a.read().receipt.status, "pending");
  a.clear(); assert.equal(a.read(), null);
});
test("corrupt requests cannot silently replace a lost operation key", () => {
  const storage = new Memory();
  const a = reviewRecoveryStore(storage, "https://fixture.invalid", "a", "x");
  a.write({body: {operationKey: "review-operation-0001", confirmation: false}});
  assert.throws(() => a.read());
  a.write({body: {operationKey: "short", confirmation: true}});
  assert.throws(() => a.read());
  a.write({body: {operationKey: "review-operation-0001", confirmation: true, expectedDraftHash: "invented"}});
  assert.throws(() => a.read());
});
test("historical deployed evidence remains the original two-field boolean-confirmation contract", () => {
  const doc = JSON.parse(readFileSync(new URL("./fixtures/simple-activity.live.openapi.json", import.meta.url), "utf8"));
  const dto = doc.components.schemas.AdminSubmitSimpleActivityReviewDto;
  assert.deepEqual(Object.keys(dto.properties).sort(), ["confirmation", "operationKey"]);
  assert.equal(dto.properties.confirmation.type, "boolean");
  assert.equal(dto.properties.confirmation.enum, undefined);
  const op = doc.paths["/api/admin/v1/activities/{id}/publish-reviews"].post;
  assert(op.responses["200"]);
  assert.deepEqual(doc.components.schemas.ActivityPublishReviewResponseDto.properties.status.enum, ["pending", "approved", "returned", "withdrawn", "cancelled"]);
});
