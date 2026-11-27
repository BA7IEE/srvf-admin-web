import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolvePostLoginPath,
  sanitizeInternalTarget,
  takePostLoginTarget,
  rememberPostLoginTarget,
  clearPostLoginTarget,
  POST_LOGIN_TARGET_KEY
} from "../src/views/login/utils/pathAfterLogin.ts";

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

test("unauthenticated deep link is restored after login even if the current route is still /login", () => {
  assert.equal(
    resolvePostLoginPath(
      "/login?redirect=/srvf/org-hr/memberships",
      "/welcome",
      "/srvf/org-hr/memberships"
    ),
    "/srvf/org-hr/memberships"
  );
  assert.equal(
    resolvePostLoginPath("/login", "/welcome", "/srvf/org-hr/memberships"),
    "/srvf/org-hr/memberships"
  );
});

test("preserved deep link wins over a later current business hash only when it is a safe internal target", () => {
  assert.equal(
    resolvePostLoginPath(
      "/srvf/base-data/organizations",
      "/welcome",
      "/srvf/org-hr/memberships"
    ),
    "/srvf/org-hr/memberships"
  );
});

test("unsafe or empty preserved targets are ignored and do not leave the app", () => {
  assert.equal(sanitizeInternalTarget("//evil.example"), undefined);
  assert.equal(sanitizeInternalTarget("https://evil.example/phish"), undefined);
  assert.equal(sanitizeInternalTarget("/login"), undefined);
  assert.equal(sanitizeInternalTarget("/"), undefined);
  assert.equal(
    resolvePostLoginPath("/login", "/welcome", "//evil.example"),
    "/welcome"
  );
  assert.equal(
    resolvePostLoginPath("/login", "/welcome", "https://evil.example/phish"),
    "/welcome"
  );
  assert.equal(
    resolvePostLoginPath(
      "/srvf/org-hr/memberships",
      "/welcome",
      "//evil.example"
    ),
    "/srvf/org-hr/memberships"
  );
});

test("takePostLoginTarget prefers the login redirect query then sessionStorage, and consumes the store", () => {
  const memory = new Map();
  globalThis.sessionStorage = {
    getItem: key => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => memory.set(key, String(value)),
    removeItem: key => memory.delete(key)
  };
  try {
    rememberPostLoginTarget("/srvf/base-data/organizations");
    assert.equal(memory.get(POST_LOGIN_TARGET_KEY), "/srvf/base-data/organizations");
    assert.equal(
      takePostLoginTarget("/srvf/org-hr/memberships"),
      "/srvf/org-hr/memberships"
    );
    assert.equal(memory.has(POST_LOGIN_TARGET_KEY), false);
    rememberPostLoginTarget("/srvf/base-data/organizations");
    assert.equal(takePostLoginTarget("/login"), "/srvf/base-data/organizations");
    assert.equal(memory.has(POST_LOGIN_TARGET_KEY), false);
    clearPostLoginTarget();
  } finally {
    delete globalThis.sessionStorage;
  }
});
