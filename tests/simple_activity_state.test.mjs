import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  beijingInput, beijingIso, timeProblem, fieldsFromDraft, saveBody,
  matchesTarget, recoveryStore, canEditTextPlace, reviewLabel
} from "../src/views/srvf/activities-domain/activities/simple/state.ts";

const draft = {
  activityId: "activity-fixture", title: "测试活动", organizationId: "organization-fixture",
  startAt: "2026-12-01T01:00:00.123Z", endAt: "2026-12-01T03:00:00.123Z",
  location: "主地点", draftHash: "a".repeat(64),
  instance: { capacity: 10, registrationDeadline: null, description: null, registrationNotes: "准备水" },
  places: [
    { roleCode: "primary", visibilityCode: "accepted", inline: { name: "主地点", addressText: "主地点", checkInEligible: false } },
    { roleCode: "meeting", visibilityCode: "staff", inline: { name: "集合", addressText: "集合地址", checkInEligible: true, radiusMeters: 30, coordinate: { longitude: 112, latitude: 23, coordinateSystemCode: "gcj02" }, instruction: "保留说明" } }
  ]
};

test("Beijing timestamps round-trip independently of machine timezone, retaining milliseconds", () => {
  assert.equal(beijingInput(draft.startAt), "2026-12-01T09:00:00.123");
  assert.equal(beijingIso(beijingInput(draft.startAt)), draft.startAt);
  assert.match(timeProblem("2026-12-01T23:00:00", "2026-12-02T01:00:00"), /同一天/);
  assert.match(timeProblem("2026-12-01T10:00:00", "2026-12-01T09:00:00"), /晚于/);
  assert.match(timeProblem("2026-12-01T09:00:00", "2026-12-01T10:00:00", "2026-12-01T11:00:00"), /截止/);
});

test("complete save preserves nullable instance fields, secondary places and coordinate metadata", () => {
  const fields = fieldsFromDraft(draft);
  fields.location = "新的文字地址"; fields.capacity = null;
  const body = saveBody(draft, fields);
  assert.equal(body.expectedDraftHash, draft.draftHash);
  assert.deepEqual(body.instance, { capacity: null, registrationDeadline: null, description: null, registrationNotes: "准备水" });
  assert.deepEqual(body.places[1], draft.places[1]);
  assert.equal(body.places[0].inline.addressText, fields.location);
  assert.equal(draft.places[0].inline.addressText, "主地点");
  assert(!("allocationModeCode" in body));
});

test("mapped primary locations cannot silently retain stale coordinates after a text edit", () => {
  const mapped = structuredClone(draft);
  mapped.places[0].inline.coordinate = { longitude: 112, latitude: 23, coordinateSystemCode: "gcj02" };
  assert.equal(canEditTextPlace(mapped), false);
  const fields = fieldsFromDraft(mapped); fields.location = "另一城市";
  const body = saveBody(mapped, fields);
  assert.equal(body.location, mapped.location);
  assert.deepEqual(body.places, mapped.places);
});

test("uncertain save compares the entire target including hidden place facts", () => {
  const target = saveBody(draft, fieldsFromDraft(draft));
  assert(matchesTarget(draft, target));
  const changed = structuredClone(draft);
  changed.places[1].inline.radiusMeters = 40;
  assert.equal(matchesTarget(changed, target), false);
  assert.equal(matchesTarget({ ...draft, instance: { ...draft.instance, registrationNotes: "其他编辑" } }, target), false);
  assert.equal(reviewLabel(null), "尚未提交审核");
});

class MemoryStorage {
  values = new Map();
  get length() { return this.values.size; }
  key(i) { return [...this.values.keys()][i] ?? null; }
  getItem(k) { return this.values.get(k) ?? null; }
  setItem(k,v) { this.values.set(k,String(v)); }
  removeItem(k) { this.values.delete(k); }
}
test("recovery is account/origin scoped and separate items survive multi-tab writes", () => {
  const local = new MemoryStorage(), session = new MemoryStorage();
  const a = recoveryStore(local, session, "https://test.invalid", "user-a");
  const tab = recoveryStore(local, session, "https://test.invalid", "user-a");
  const b = recoveryStore(local, session, "https://test.invalid", "user-b");
  a.remember("activity-one"); tab.remember("activity-two");
  assert.deepEqual(new Set(a.recent()), new Set(["activity-one", "activity-two"]));
  assert.deepEqual(b.recent(), []);
  assert.deepEqual(recoveryStore(local, session, "https://other.invalid", "user-a").recent(), []);
  const record = { body: { operationKey: "same-key", templateVersionId: "version-id", title: "原内容" } };
  a.putPending(record);
  assert.deepEqual(tab.pending(), record); assert.equal(b.pending(), null);
  a.forget("activity-one"); assert.deepEqual(a.recent(), ["activity-two"]);
  a.clearPending(); assert.equal(a.pending(), null);
  assert([...local.values.values()].every(value => /^\d+$/.test(value)));
});

test("relayed live subset has the exact digest and all recursive references resolve", () => {
  const raw = readFileSync(new URL("./fixtures/simple-activity.live.openapi.json", import.meta.url));
  assert.equal(raw.length, 37896);
  assert.equal(createHash("sha256").update(raw).digest("hex"), "48ff27edc0fea03ffe4c30cc2a5c617a600bb5cc093e43034076b6a8ad25c858");
  const doc = JSON.parse(raw);
  assert.equal(Object.keys(doc.paths).length, 5);
  assert.equal(Object.values(doc.paths).reduce((n, ops) => n + Object.keys(ops).length, 0), 6);
  assert.equal(Object.keys(doc.components.schemas).length, 18);
  function check(value) {
    if (!value || typeof value !== "object") return;
    if (value.$ref) {
      assert(value.$ref.startsWith("#/"));
      let target = doc;
      for (const segment of value.$ref.slice(2).split("/")) target = target[segment.replaceAll("~1", "/").replaceAll("~0", "~")];
      assert(target);
    }
    Object.values(value).forEach(check);
  }
  check(doc);
  assert.equal(doc.components.schemas.AdminSimpleDraftResponseDto.properties.review.nullable, true);
  assert.deepEqual(doc.components.schemas.AdminSimpleDraftResponseDto.properties.allocationModeCode.enum, ["first_come"]);
});
