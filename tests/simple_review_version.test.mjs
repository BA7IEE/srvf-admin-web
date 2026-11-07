import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import * as review from "../src/views/srvf/activities-domain/activities/simple/review-state.ts";

const hash = "a".repeat(64);
const draft = { activityId: "activity-a", draftHash: hash, definitionHash: "b".repeat(64),
  title: "已保存的合成活动", location: "合成地点", statusCode: "draft", editable: true,
  review: null, startAt: "2099-01-01T01:00:00Z", endAt: "2099-01-01T03:00:00Z",
  instance: { registrationDeadline: null } };
class Memory {
  values = new Map();
  getItem(k) { return this.values.get(k) ?? null; }
  setItem(k,v) { this.values.set(k,v); }
  removeItem(k) { this.values.delete(k); }
}
test("version conflicts and professional rejection are different 409 outcomes", () => {
  assert.equal(review.reviewFailure({response:{status:409,data:{code:20255}}}), "stale");
  assert.equal(review.reviewFailure({response:{status:409,data:{code:20256}}}), "professional");
  assert.equal(review.reviewFailure({response:{status:400,data:{code:20255}}}), "rejected");
});
test("a missing or malformed draftHash cannot be confirmed using definitionHash instead", () => {
  for (const invalid of [undefined, null, "", "A".repeat(64), 12, "z".repeat(64)]) {
    assert(review.reviewIssues({...draft,draftHash:invalid},Date.parse("2098-01-01")).some(x=>x.includes("版本")));
  }
});
test("recovery round-trips the exact three-field body and never upgrades legacy records", () => {
  const memory = new Memory();
  const store = review.reviewRecoveryStore(memory,"https://fixture.invalid","user-a","activity-a");
  const body = {operationKey:"version-review-0001",confirmation:true,expectedDraftHash:hash};
  store.write({body});
  assert.deepEqual(store.read().body,body);
  store.write({body:{operationKey:"legacy-review-0001",confirmation:true}});
  assert.deepEqual(store.read().body,{operationKey:"legacy-review-0001",confirmation:true});
});
test("candidate source contract is preserved separately from the deployed live evidence", () => {
  const raw = readFileSync(new URL("./fixtures/simple-review.candidate-contract.md",import.meta.url));
  assert.equal(raw.length,47286);
  assert.equal(createHash("sha256").update(raw).digest("hex"),"15e496b0965aa94bba22e63b259879db403a402bccbb4e9c9d9c1229742b9e25");
  const live = JSON.parse(readFileSync(new URL("./fixtures/simple-activity.live.openapi.json",import.meta.url)));
  assert.equal(live.components.schemas.AdminSubmitSimpleActivityReviewDto.properties.expectedDraftHash,undefined);
});
test("confirmation binds one displayed response, not a definition hash or a later mutated candidate", () => {
  const shown = review.reviewDraft(draft,"activity-a");
  const body = review.confirmedReviewBody(shown,"activity-a","version-review-0002");
  shown.draftHash = "c".repeat(64);
  assert.deepEqual(body,{operationKey:"version-review-0002",confirmation:true,expectedDraftHash:hash});
  assert(Object.isFrozen(body));
  assert.throws(()=>review.confirmedReviewBody(draft,"activity-b","version-review-0002"));
  assert.throws(()=>review.reviewDraft({...draft,activityId:"activity-b"},"activity-a"));
  assert.throws(()=>review.reviewDraft({...draft,draftHash:null},"activity-a"));
  assert.equal(draft.draftHash,hash);
});
test("stored malformed versioned records fail closed instead of becoming legacy payloads", () => {
  const store = review.reviewRecoveryStore(new Memory(),"https://fixture.invalid","user-a","activity-a");
  for (const value of [null,"", "A".repeat(64), "invalid", 1]) {
    store.write({body:{operationKey:"version-review-0001",confirmation:true,expectedDraftHash:value}});
    assert.throws(()=>store.read());
  }
  assert.equal(review.isVersionedReviewBody({operationKey:"legacy-review-0001",confirmation:true}),false);
});
test("a confirmed receipt retains its exact operation association without retaining a snapshot", () => {
  const memory=new Memory();
  const store=review.reviewRecoveryStore(memory,"https://fixture.invalid","user-a","activity-a");
  const value={body:{operationKey:"version-review-0001",confirmation:true,expectedDraftHash:hash},
    receipt:{id:"receipt-1",status:"pending",requestVersion:1,submittedAt:"2099-01-01T00:00:00Z"}};
  store.write(value); store.archiveReceipt(value); store.clear();
  assert.equal(store.read(),null);
  const saved=[...memory.values.entries()].filter(([key])=>key.startsWith("srvf:simple-review-receipt:"));
  assert.equal(saved.length,1); assert.deepEqual(JSON.parse(saved[0][1]),value);
});
