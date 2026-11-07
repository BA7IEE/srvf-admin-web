import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import * as reviewState from "../src/views/srvf/activities-domain/activities/simple/review-state.ts";

const draft = {
  activityId: "activity-a",
  organizationId: "organization-a",
  statusCode: "draft",
  review: { id: "review-a", status: "returned", requestType: "initial" }
};
const detail = () => ({
  activity: {
    id: "activity-a",
    organizationId: "organization-a",
    statusCode: "draft"
  },
  publishReview: {
    latestRequestId: "review-a",
    requestType: "initial",
    status: "returned",
    reviewNote: "请补全集合地点。\n保留原文及换行。",
    canDirectPublish: false
  }
});

test("a returned reason is read from the same managed activity and exact latest review", () => {
  assert.equal(typeof reviewState.readReturnedReviewNote, "function");
  assert.equal(
    reviewState.readReturnedReviewNote(draft, detail()),
    detail().publishReview.reviewNote
  );
});

test("another activity, organization, current state, review or request type cannot supply a reason", () => {
  for (const [area, key, value] of [
    ["activity", "id", "activity-b"],
    ["activity", "organizationId", "organization-b"],
    ["activity", "statusCode", "published"],
    ["publishReview", "latestRequestId", "review-b"],
    ["publishReview", "requestType", "change"],
    ["publishReview", "status", "approved"]
  ]) {
    const other = detail();
    other[area][key] = value;
    assert.throws(
      () => reviewState.readReturnedReviewNote(draft, other),
      /已变化|不一致/
    );
  }
});

test("missing or corrupt detail fails closed, while an explicit empty note is honest", () => {
  for (const value of [
    null,
    {},
    { activity: detail().activity },
    { publishReview: detail().publishReview }
  ])
    assert.throws(() => reviewState.readReturnedReviewNote(draft, value));
  for (const note of [null, "", " \n "]) {
    const value = detail();
    value.publishReview.reviewNote = note;
    assert.equal(reviewState.readReturnedReviewNote(draft, value), null);
  }
  for (const note of [undefined, 123, {}]) {
    const value = detail();
    value.publishReview.reviewNote = note;
    assert.throws(() => reviewState.readReturnedReviewNote(draft, value));
  }
});

test("a historical approved review is never a current activity publication fact", () => {
  assert.throws(() =>
    reviewState.readReturnedReviewNote(
      { ...draft, review: { ...draft.review, status: "approved" } },
      detail()
    )
  );
  const data = detail();
  data.activity.statusCode = "cancelled";
  assert.equal(
    reviewState.readReturnedReviewNote(
      { ...draft, statusCode: "cancelled" },
      data
    ),
    data.publishReview.reviewNote
  );
  assert.equal(
    reviewState.readReturnedReviewNote(draft, detail()),
    detail().publishReview.reviewNote
  );
});

test("note text remains text without silently trimming or interpreting markup", () => {
  const data = detail();
  data.publishReview.reviewNote = "  <img src=x onerror=alert(1)>\n原文  ";
  assert.equal(
    reviewState.readReturnedReviewNote(draft, data),
    data.publishReview.reviewNote
  );
});

test("pinned organizer source contract remains distinct from live integration evidence", () => {
  const raw = readFileSync(
    new URL("./fixtures/organizer-return-contract.txt", import.meta.url)
  );
  assert.equal(
    createHash("sha256").update(raw).digest("hex"),
    "085db008ac45469d0429053bf4a39e4cc34d3d7da65735950adc787deb161cfe"
  );
  assert(raw.includes("923c6c57673883d4b4834ea7e2ff0c8e18b5da5d"));
  assert(raw.includes("@Get(':activityId')"));
  assert(raw.includes("reviewNote: latest?.reviewNote ?? null"));
});
