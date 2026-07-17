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
const DOCTOR = path.join(HERE, "harness-doctor.mjs");

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

// ---- harness-doctor.mjs fixture driver (B drift detection) -----------------------
// Drive the doctor against throwaway §13.1 + settings fixtures via its SRVF_DOCTOR_*
// env overrides, so the §13.1<->settings coverage logic is regression-locked.
const DOCTOR_RULES = [
  "### 13.1 matrix",
  "",
  "| 文件 / 目录 | AI 可改？ | 备注 |",
  "| --- | --- | --- |",
  "| `src/utils/auth.ts` | ❌ | token |",
  "",
  "### 13.2 next",
  ""
].join("\n");
function runDoctor(denyList) {
  const dir = mkTemp("srvf-h-doc-");
  const sPath = path.join(dir, "settings.json");
  const rPath = path.join(dir, "rules.md");
  writeFileSync(sPath, JSON.stringify({ permissions: { deny: denyList } }));
  writeFileSync(rPath, DOCTOR_RULES);
  const env = { ...process.env, SRVF_DOCTOR_SETTINGS: sPath, SRVF_DOCTOR_RULES: rPath };
  try {
    execFileSync("node", [DOCTOR], { env, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
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

  // ===== guard: public/platform-config.json value-vs-field rule (§13.1) ===========
  const pcFixture = (obj) => {
    const f = path.join(mkTemp("srvf-h-pc-"), "public", "platform-config.json");
    mkdirSync(path.dirname(f), { recursive: true });
    writeFileSync(f, JSON.stringify(obj, null, 2));
    return f;
  };
  const pcWrite = (obj, content) => runGuard("Write", { file_path: pcFixture(obj), content });
  const pcEdit = (obj, old_string, new_string) =>
    runGuard("Edit", { file_path: pcFixture(obj), old_string, new_string });
  check(
    "guard allows: platform-config value-only Write",
    pcWrite({ A: 1, EpThemeColor: "#409EFF" }, JSON.stringify({ A: 1, EpThemeColor: "#C4001B" }, null, 2)).decision === "allow"
  );
  check(
    "guard allows: platform-config value-only Edit",
    pcEdit({ A: 1, EpThemeColor: "#409EFF" }, '"#409EFF"', '"#C4001B"').decision === "allow"
  );
  check("guard denies: platform-config add field", pcWrite({ A: 1 }, JSON.stringify({ A: 1, B: 2 }, null, 2)).decision === "deny");
  check("guard denies: platform-config remove field", pcWrite({ A: 1, B: 2 }, JSON.stringify({ A: 1 }, null, 2)).decision === "deny");
  check("guard asks: platform-config malformed result", pcWrite({ A: 1 }, "{ not json").decision === "ask");

  // ===== guard: package.json scripts-vs-dependency-area rule (13A.10) =============
  const pkgFixture = (obj) => {
    const f = path.join(mkTemp("srvf-h-pkg-"), "package.json");
    writeFileSync(f, JSON.stringify(obj, null, 2));
    return f;
  };
  const pkgWrite = (obj, next) =>
    runGuard("Write", { file_path: pkgFixture(obj), content: JSON.stringify(next, null, 2) });
  const pkgBase = {
    name: "x",
    version: "1.0.0",
    scripts: { dev: "vite" },
    dependencies: { vue: "^3.0.0" },
    engines: { node: ">=20" }
  };
  check(
    "guard allows: package.json scripts-only Write",
    pkgWrite(pkgBase, { ...pkgBase, scripts: { dev: "vite", probe: "node -v" } }).decision === "allow"
  );
  check(
    "guard allows: package.json scripts-only Edit",
    runGuard("Edit", {
      file_path: pkgFixture(pkgBase),
      old_string: '"dev": "vite"',
      new_string: '"dev": "vite --host"'
    }).decision === "allow"
  );
  check(
    "guard denies: package.json add dependency",
    pkgWrite(pkgBase, { ...pkgBase, dependencies: { vue: "^3.0.0", axios: "^1.0.0" } }).decision === "deny"
  );
  check(
    "guard denies: package.json engines change",
    pkgWrite(pkgBase, { ...pkgBase, engines: { node: ">=22" } }).decision === "deny"
  );
  check(
    "guard denies: package.json pnpm-field add",
    pkgWrite(pkgBase, { ...pkgBase, pnpm: { overrides: {} } }).decision === "deny"
  );
  check(
    "guard asks: package.json non-scripts field change",
    pkgWrite(pkgBase, { ...pkgBase, version: "1.0.1" }).decision === "ask"
  );
  check(
    "guard asks: package.json malformed result",
    runGuard("Write", { file_path: pkgFixture(pkgBase), content: "{ not json" }).decision === "ask"
  );

  // ===== guard: R4 hardening — replace_all fidelity, MultiEdit, side doors (13A.11) =====
  const spanBase = {
    name: "x",
    scripts: { dev: "vite" },
    devDependencies: { vite: "^5.0.0", "vite-plugin-a": "^1.0.0" }
  };
  check(
    "guard denies: package.json replace_all Edit spanning scripts+deps",
    runGuard("Edit", {
      file_path: pkgFixture(spanBase),
      old_string: "vite",
      new_string: "vitex",
      replace_all: true
    }).decision === "deny"
  );
  check(
    "guard allows: package.json replace_all Edit confined to scripts",
    runGuard("Edit", {
      file_path: pkgFixture({
        name: "x",
        scripts: { dev: "vite --a", probe: "vite --b" },
        dependencies: { vue: "^3.0.0" }
      }),
      old_string: "--",
      new_string: "~~",
      replace_all: true
    }).decision === "allow"
  );
  check(
    "guard denies: package.json MultiEdit adding a dependency",
    runGuard("MultiEdit", {
      file_path: pkgFixture(pkgBase),
      edits: [{ old_string: '"vue": "^3.0.0"', new_string: '"vue": "^3.0.0",\n    "axios": "^1.0.0"' }]
    }).decision === "deny"
  );
  check(
    "guard allows: package.json MultiEdit scripts-only",
    runGuard("MultiEdit", {
      file_path: pkgFixture(pkgBase),
      edits: [{ old_string: '"dev": "vite"', new_string: '"dev": "vite --host"' }]
    }).decision === "allow"
  );
  check(
    "guard asks: package.json Edit old_string not found (unverifiable)",
    runGuard("Edit", {
      file_path: pkgFixture(pkgBase),
      old_string: "no-such-string",
      new_string: "x"
    }).decision === "ask"
  );
  check(
    "guard denies: package.json devDependencies change",
    pkgWrite({ ...pkgBase, devDependencies: { a: "1" } }, { ...pkgBase, devDependencies: { a: "2" } }).decision ===
      "deny"
  );
  check(
    "guard denies: package.json protected-key deletion (engines removed)",
    (() => {
      const noEngines = { ...pkgBase };
      delete noEngines.engines;
      return pkgWrite(pkgBase, noEngines).decision === "deny";
    })()
  );
  check(
    "guard denies: package.json mixed scripts+dependencies Write",
    pkgWrite(pkgBase, { ...pkgBase, scripts: { dev: "vite2" }, dependencies: { vue: "^4.0.0" } }).decision === "deny"
  );
  check(
    "guard denies: platform-config replace_all edit renaming a field",
    runGuard("Edit", {
      file_path: pcFixture({ A: "k", k: 1 }),
      old_string: '"k"',
      new_string: '"z"',
      replace_all: true
    }).decision === "deny"
  );
  check(
    "guard asks: platform-config Edit old_string not found (unverifiable)",
    runGuard("Edit", { file_path: pcFixture({ A: 1 }), old_string: "zzz", new_string: "y" }).decision === "ask"
  );
  check("guard denies: pnpm -C dir add (flagged bypass)", bash("pnpm -C . add axios").decision === "deny");
  check("guard denies: pnpm --filter add (flagged bypass)", bash("pnpm --filter web add axios").decision === "deny");
  check("guard denies: npm pkg set dependency field", bash("npm pkg set dependencies.express=^4.0.0").decision === "deny");
  check("guard denies: pnpm pkg delete devDependency", bash("pnpm pkg delete devDependencies.vite").decision === "deny");
  check("guard allows: npm pkg set scripts field", bash("npm pkg set scripts.probe=node").decision === "allow");
  check("guard asks: npm pkg set non-scripts field", bash("npm pkg set version=2.0.0").decision === "ask");
  check("guard denies: sed -i on package.json", bash("sed -i '' -e s/vite/x/ package.json").decision === "deny");
  check("guard denies: redirection into package.json", bash("echo hi > package.json").decision === "deny");
  check("guard allows: pnpm run add-user (not a dep mutation)", bash("pnpm run add-user").decision === "allow");
  check("guard allows: git add package.json", bash("git add package.json").decision === "allow");

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

  // ===== doctor: §13.1 coverage needs BOTH Edit and Write (B, pair-level) =========
  check("doctor: full Edit+Write pair -> no drift (0)", runDoctor(["Edit(./src/utils/auth.ts)", "Write(./src/utils/auth.ts)"]) === 0);
  check("doctor: covering glob pair -> no drift (0)", runDoctor(["Edit(./src/utils/**)", "Write(./src/utils/**)"]) === 0);
  check("doctor: no coverage -> drift (1)", runDoctor([]) === 1);
  check("doctor: only Write (Edit half-removed) -> drift (1)", runDoctor(["Write(./src/utils/auth.ts)"]) === 1);
  check("doctor: only Edit (Write half-removed) -> drift (1)", runDoctor(["Edit(./src/utils/auth.ts)"]) === 1);

  // ===== doctor [3]: task-vs-resource flatten smell (heuristic, WARN-only) =========
  function viewsFixture(files) {
    const dir = mkTemp("srvf-h-views-");
    for (const [rel, body] of Object.entries(files)) {
      const abs = path.join(dir, rel);
      mkdirSync(path.dirname(abs), { recursive: true });
      writeFileSync(abs, body);
    }
    return dir;
  }
  // Clean rules+settings pair (no structural drift) so we isolate the [3] behavior;
  // SRVF_DOCTOR_VIEWS points the scan at a throwaway views tree.
  function runDoctorViews(viewsDir) {
    const dir = mkTemp("srvf-h-docv-");
    const sPath = path.join(dir, "settings.json");
    const rPath = path.join(dir, "rules.md");
    writeFileSync(sPath, JSON.stringify({ permissions: { deny: ["Edit(./src/utils/auth.ts)", "Write(./src/utils/auth.ts)"] } }));
    writeFileSync(rPath, DOCTOR_RULES);
    const env = { ...process.env, SRVF_DOCTOR_SETTINGS: sPath, SRVF_DOCTOR_RULES: rPath, SRVF_DOCTOR_VIEWS: viewsDir };
    try {
      const out = execFileSync("node", [DOCTOR], { env, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
      return { code: 0, out };
    } catch (e) {
      return { code: typeof e.status === "number" ? e.status : -1, out: String(e.stdout || "") };
    }
  }
  const smelly = runDoctorViews(viewsFixture({ "act/index.vue": "<el-select v-model=x/>\n<el-empty description='请先选择一个活动'/>\n" }));
  check("doctor[3]: flatten smell detected (WARN + filename)", /WARN/.test(smelly.out) && /act\/index\.vue/.test(smelly.out));
  check("doctor[3]: smell is WARN-only, never flips exit (0)", smelly.code === 0);
  const cleanV = runDoctorViews(viewsFixture({ "list/index.vue": "<el-select v-model=status/> <!-- status filter, no parent picker -->\n" }));
  check("doctor[3]: legit el-select filter (no 请先选择) not flagged", /none — no/.test(cleanV.out) && cleanV.code === 0);
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
