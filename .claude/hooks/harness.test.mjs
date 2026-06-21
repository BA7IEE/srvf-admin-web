#!/usr/bin/env node
// SRVF AI harness · regression self-test (C)
// Run: `node .claude/hooks/harness.test.mjs`  (exit 0 = all green, 1 = a failure).
//
// Locks in the behavior of guard.mjs (PreToolUse) and verify.mjs (Stop) so a future
// edit that silently weakens a rule fails here instead of in production. guard is
// driven black-box (real subprocess + crafted stdin); verify is driven both through
// its exported pure helpers and end-to-end against a throwaway git repo with a fake
// `pnpm` on PATH.
//
// NOTE: every trigger token below is assembled from fragments (e.g. "@ts-" + "ignore",
// "import.meta.env.VITE_" + "API ...") on purpose. guard.mjs scans .mjs content for
// those very patterns, so writing them contiguously here would make guard block this
// test file. The fragments reconstruct the real token at runtime for the subprocess.
import process from "node:process";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, chmodSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  runVerify,
  classifyCodeChange,
  decideTypecheckFailure
} from "./verify.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GUARD = path.join(HERE, "guard.mjs");
const VERIFY = path.join(HERE, "verify.mjs");

// ---- runtime-reconstructed trigger tokens (never written contiguously) ----------
const TS_IGNORE = "@ts-" + "ignore";
const TS_NOCHECK = "@ts-" + "nocheck";
const TS_EXPECT = "@ts-" + "expect-error";
const ESLINT_OFF = "eslint-" + "disable";
const SUPPRESSIONS = [TS_IGNORE, TS_NOCHECK, TS_EXPECT, ESLINT_OFF];
const VITE_FALLBACK = "const u = import.meta.env.VITE_" + "API || 'x';";

// ---- tiny assertion harness ------------------------------------------------------
let pass = 0;
let fail = 0;
const failures = [];
function check(name, cond) {
  if (cond) {
    pass++;
  } else {
    fail++;
    failures.push(name);
    console.log("  FAIL -", name);
  }
}

// ---- guard.mjs black-box driver --------------------------------------------------
function runGuard(toolName, toolInput) {
  const out = execFileSync("node", [GUARD], {
    input: JSON.stringify({ tool_name: toolName, tool_input: toolInput }),
    encoding: "utf8"
  });
  if (!out.trim()) return { decision: "allow" };
  try {
    const j = JSON.parse(out);
    return {
      decision: j.hookSpecificOutput.permissionDecision,
      reason: j.hookSpecificOutput.permissionDecisionReason
    };
  } catch {
    return { decision: "allow", reason: out };
  }
}
const bash = (command) => runGuard("Bash", { command });
const edit = (file_path, new_string) => runGuard("Edit", { file_path, new_string });
const write = (file_path, content) => runGuard("Write", { file_path, content });

// ---- verify.mjs end-to-end driver (real entrypoint, isolated git repo) -----------
const temps = [];
function mkTemp(prefix) {
  const d = mkdtempSync(path.join(tmpdir(), prefix));
  temps.push(d);
  return d;
}
function gitRepo(files) {
  const repo = mkTemp("srvf-h-repo-");
  execFileSync("git", ["init", "-q"], { cwd: repo });
  for (const [rel, body] of Object.entries(files)) {
    const abs = path.join(repo, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, body);
  }
  // Stage so `git status --porcelain` lists each file by path; an entirely
  // untracked directory would otherwise collapse to a bare "src/" entry and the
  // src-change classifier (which keys off the file extension) would miss it.
  execFileSync("git", ["add", "-A"], { cwd: repo });
  return repo;
}
function pnpmShim(body) {
  const dir = mkTemp("srvf-h-bin-");
  const f = path.join(dir, "pnpm");
  writeFileSync(f, body);
  chmodSync(f, 0o755);
  return dir;
}
function runVerifyProcess({ input, cwd, extraPath }) {
  const env = { ...process.env };
  if (extraPath) env.PATH = extraPath + path.delimiter + env.PATH;
  try {
    execFileSync("node", [VERIFY], {
      input: JSON.stringify(input || {}),
      cwd,
      env,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"] // capture the hook's own stderr instead of inheriting it
    });
    return 0;
  } catch (e) {
    return typeof e.status === "number" ? e.status : -1;
  }
}

try {
  // ===== guard: dependency mutation / installs are human-only (§13.2.1) ===========
  check("guard denies: pnpm add <pkg>", bash("pnpm add left-pad").decision === "deny");
  check("guard denies: npm i -D <pkg>", bash("npm i -D left-pad").decision === "deny");
  check("guard denies: yarn add <pkg>", bash("yarn add react").decision === "deny");
  check("guard denies: bun add <pkg>", bash("bun add zod").decision === "deny");
  check("guard denies: pnpm remove <pkg>", bash("pnpm remove vue").decision === "deny");
  check("guard denies: rm pnpm-lock.yaml", bash("rm pnpm-lock.yaml").decision === "deny");

  // ===== guard: husky / commitlint bypass (§13.3.12) ==============================
  check("guard denies: --no-verify", bash("git commit --no-verify -m x").decision === "deny");
  check("guard denies: git commit -n (short bypass)", bash("git commit -n -m x").decision === "deny");
  check("guard denies: HUSKY=0 commit", bash("HUSKY=0 git commit -m x").decision === "deny");

  // ===== guard: allow-list (bare install / frozen / dlx / ci / safe -n) ===========
  check("guard allows: bare pnpm install", bash("pnpm install").decision === "allow");
  check(
    "guard allows: pnpm install --frozen-lockfile",
    bash("pnpm install --frozen-lockfile").decision === "allow"
  );
  check("guard allows: pnpm dlx", bash("pnpm dlx tsx run.ts").decision === "allow");
  check("guard allows: npm ci", bash("npm ci").decision === "allow");
  check("guard allows: echo -n (not a git commit)", bash("echo -n hi").decision === "allow");
  check("guard allows: pnpm typecheck", bash("pnpm typecheck").decision === "allow");

  // ===== guard: suppression pragmas in code files (§13.3.5/.8, incl R1-e) =========
  for (const tok of SUPPRESSIONS) {
    check("guard denies suppression pragma -> " + tok, edit("src/x.ts", "let a=1 // " + tok).decision === "deny");
  }
  check("guard denies suppression pragma in .cts (R2-b)", edit("src/x.cts", "x // " + TS_IGNORE).decision === "deny");
  check("guard allows suppression token in a .md doc", edit("notes.md", "mentions " + TS_IGNORE).decision === "allow");

  // ===== guard: hardcoded VITE_* fallback in source (§13.3.13) ====================
  check("guard denies: hardcoded VITE_* fallback", write("src/cfg.ts", VITE_FALLBACK).decision === "deny");

  // ===== guard: clean code passes ================================================
  check("guard allows: clean code edit", edit("src/x.ts", "export const ok = 1;").decision === "allow");

  // ===== verify: exported pure helpers (deterministic, no toolchain) ==============
  check("classifyCodeChange: src/.mts true", classifyCodeChange("?? src/x.mts") === true);
  check("classifyCodeChange: src/.cts true", classifyCodeChange(" M src/x.cts") === true);
  check("classifyCodeChange: src/.cjs true", classifyCodeChange(" M src/x.cjs") === true);
  check("classifyCodeChange: src/.mjs true", classifyCodeChange(" A src/x.mjs") === true);
  check("classifyCodeChange: docs/.md false", classifyCodeChange(" M docs/x.md") === false);
  check("classifyCodeChange: empty false", classifyCodeChange("") === false);

  check("decideTypecheckFailure: error TS -> not failOpen", decideTypecheckFailure({ stdout: "a error TS1234 b" }).failOpen === false);
  check("decideTypecheckFailure: no TS marker -> failOpen", decideTypecheckFailure({ stdout: "pnpm ERR! boom" }).failOpen === true);
  check("decideTypecheckFailure: killed -> failOpen", decideTypecheckFailure({ killed: true, stdout: "error TS1" }).failOpen === true);

  const noop = () => {};
  let msg = "";
  const cap = (m) => {
    msg = m;
  };
  check(
    "runVerify: stop_hook_active short-circuits to 0",
    runVerify({ input: { stop_hook_active: true }, getStatus: () => { throw new Error("must not run"); }, runTypecheck: noop, stderr: noop }) === 0
  );
  check(
    "runVerify: git unavailable -> 0",
    runVerify({ input: {}, getStatus: () => { throw new Error("not a repo"); }, runTypecheck: noop, stderr: noop }) === 0
  );
  check(
    "runVerify: no code change -> 0",
    runVerify({ input: {}, getStatus: () => "?? docs/readme.md", runTypecheck: () => { throw new Error("must not run"); }, stderr: noop }) === 0
  );
  check(
    "runVerify: clean typecheck -> 0",
    runVerify({ input: {}, getStatus: () => " M src/a.ts", runTypecheck: () => "ok", stderr: noop }) === 0
  );
  msg = "";
  check(
    "runVerify: tool-missing failure fails open -> 0",
    runVerify({ input: {}, getStatus: () => " M src/a.ts", runTypecheck: () => { throw { stdout: "command not found", stderr: "" }; }, stderr: cap }) === 0 &&
      /Fail-open/.test(msg)
  );
  msg = "";
  check(
    "runVerify: real error TS -> 2",
    runVerify({ input: {}, getStatus: () => " M src/a.ts", runTypecheck: () => { throw { stdout: "x(1,1): error TS2304: bad", stderr: "" }; }, stderr: cap }) === 2 &&
      /Stop blocked/.test(msg)
  );

  // ===== verify: end-to-end against the real Stop-hook entrypoint =================
  check(
    "verify (e2e): stop_hook_active -> exit 0",
    runVerifyProcess({ input: { stop_hook_active: true }, cwd: mkTemp("srvf-h-") }) === 0
  );
  check(
    "verify (e2e): non-src change -> exit 0",
    runVerifyProcess({ input: {}, cwd: gitRepo({ "README.md": "# hi\n" }) }) === 0
  );
  check(
    "verify (e2e): src change + toolchain missing fails open -> exit 0",
    runVerifyProcess({
      input: {},
      cwd: gitRepo({ "src/probe.ts": "export const x = 1;\n" }),
      extraPath: pnpmShim("#!/bin/sh\necho 'sh: pnpm: command not found' 1>&2\nexit 127\n")
    }) === 0
  );
  check(
    "verify (e2e): src change + real error TS -> exit 2",
    runVerifyProcess({
      input: {},
      cwd: gitRepo({ "src/probe.ts": "export const x = 1;\n" }),
      extraPath: pnpmShim("#!/bin/sh\necho 'src/probe.ts(1,5): error TS2304: nope'\nexit 1\n")
    }) === 2
  );
} finally {
  for (const d of temps) {
    try {
      rmSync(d, { recursive: true, force: true });
    } catch {
      /* best-effort cleanup */
    }
  }
}

console.log(`\n${fail ? "FAIL" : "PASS"}: ${pass} passed, ${fail} failed`);
if (fail) console.log("failed: " + failures.join(" | "));
process.exit(fail ? 1 : 0);
