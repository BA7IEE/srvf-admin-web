import assert from "node:assert/strict";
import { test } from "node:test";
import { resolvePostLoginPath } from "../src/views/login/utils/pathAfterLogin.ts";

test("login still lands on the top menu when the user is on /login", () => {
  assert.equal(resolvePostLoginPath("/login", "/welcome"), "/welcome");
  assert.equal(resolvePostLoginPath("/", "/welcome"), "/welcome");
  assert.equal(resolvePostLoginPath("", "/welcome"), "/welcome");
  assert.equal(resolvePostLoginPath(undefined, "/welcome"), "/welcome");
});

test("login does not clobber a business hash already opened after the login request", () => {
  assert.equal(
    resolvePostLoginPath("/srvf/org-hr/memberships", "/welcome"),
    "/srvf/org-hr/memberships"
  );
  assert.equal(
    resolvePostLoginPath("/srvf/base-data/organizations", "/welcome"),
    "/srvf/base-data/organizations"
  );
  assert.equal(
    resolvePostLoginPath("/srvf/org-hr/memberships?tab=active", "/welcome"),
    "/srvf/org-hr/memberships?tab=active"
  );
});
