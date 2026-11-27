import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = relative =>
  readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const prefix = "src/views/srvf/members-domain/members/";
const required = [
  "memberNo",
  "realName",
  "memberSinceDate",
  "memberOriginCode"
];

test("member creation submits the four required fields from the form", () => {
  const hook = source(prefix + "utils/hook.ts");
  const payload = hook.match(/await createMember\(\{([\s\S]*?)\n\s*\}\)/)?.[1];
  assert.ok(payload, "new member submit must call createMember");
  for (const name of required) {
    assert.match(
      payload,
      new RegExp("\\b" + name + ":\\s*curData\\." + name + "\\b")
    );
  }
  assert.doesNotMatch(payload, /\bdisplayName:/);
  assert.match(
    payload,
    /curData\.gradeCode\s*\?\s*\{ gradeCode: curData\.gradeCode \}/
  );
});

test("new member fields require explicit values and edit does not send creation fields", () => {
  const form = source(prefix + "form.vue");
  for (const name of required) {
    assert.match(form, new RegExp('prop="' + name + '"'));
    assert.match(form, new RegExp('v-model="newFormInline\\.' + name + '"'));
    assert.match(form, new RegExp(name + ":\\s*\\[\\s*\\{\\s*required: true"));
  }
  assert.match(form, /value-format="YYYY-MM-DD"/);
  const hook = source(prefix + "utils/hook.ts");
  const patch = hook.match(
    /await updateMember\(row\.id, \{([\s\S]*?)\n\s*\}\)/
  )?.[1];
  assert.ok(patch);
  for (const name of required)
    assert.doesNotMatch(patch, new RegExp("\\b" + name + "\\b"));
});
