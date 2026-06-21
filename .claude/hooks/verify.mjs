#!/usr/bin/env node
// SRVF AI harness · Stop verifier
// Makes 02-ai-rules.md §13.3.8 mechanical: when code under src/ changed this
// session, run `pnpm typecheck` before the agent finishes. eslint is already
// enforced at commit by husky + lint-staged; typecheck (vue-tsc) is the session gap.
// Fails OPEN on tooling errors so it never bricks a session.
//
// Structured for testability: the pure decision helpers and the injectable
// `runVerify` core are exported, and the Stop-hook side effects run only when
// this file is executed directly (see the invokedDirectly() guard at the bottom).
// That lets .claude/hooks/harness.test.mjs import and drive every branch without
// a real git repo or toolchain. Deployed behavior is identical.
import process from "node:process";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

// §13.3.8 + R2-b: a session "touched code" when a changed path under src/ carries a
// TS/Vue/JS extension, including the .cts / .mts / .cjs / .mjs module variants.
export const CODE_RE = /^src\/.*\.(ts|tsx|vue|js|jsx|cts|mts|cjs|mjs)$/;

// Decide whether `git status --porcelain` output touched gated code under src/.
export function classifyCodeChange(porcelain) {
  return String(porcelain || "")
    .split("\n")
    .map((l) => l.slice(3).trim())
    .some((p) => CODE_RE.test(p));
}

// R2-a: only a genuine vue-tsc run prints `error TS<n>` diagnostics. If those are
// absent (or the process was killed / timed out), the failure is a tooling error —
// pnpm or vue-tsc missing, node_modules absent, timeout — not a type error, so we
// fail OPEN. Returns { failOpen, out } where `out` is the combined stdout+stderr.
export function decideTypecheckFailure(e) {
  const out = `${(e && e.stdout) || ""}\n${(e && e.stderr) || ""}`.trim();
  const killed = !!(e && (e.killed || e.signal));
  const hasTypeErrors = /error TS\d+/i.test(out);
  return { failOpen: killed || !hasTypeErrors, out };
}

export const FAIL_OPEN_MESSAGE =
  "SRVF harness: skipped the typecheck gate — `pnpm typecheck` could not run to " +
  "completion (toolchain missing or timed out). Fail-open per 13-ai-harness.md §13A.3.\n";

export function blockedMessage(out) {
  return (
    "Stop blocked by SRVF harness: `pnpm typecheck` failed (02-ai-rules.md §13.3.8). " +
    "Fix the type errors below before finishing. If they are pre-existing and unrelated to this " +
    "task, a human can skip by removing the Stop hook in .claude/settings.json.\n\n" +
    out.slice(-4000)
  );
}

// Injectable core. Returns the Stop-hook exit code: 0 = allow stop, 2 = block.
// `getStatus`, `runTypecheck` and `stderr` are injected so tests can exercise
// every branch without a real git repo or toolchain.
export function runVerify({ input, getStatus, runTypecheck, stderr }) {
  if (input && input.stop_hook_active) return 0; // avoid Stop loops
  let changed = "";
  try {
    changed = getStatus();
  } catch {
    return 0; // not a git context / git unavailable -> don't block
  }
  if (!classifyCodeChange(changed)) return 0;
  try {
    runTypecheck();
    return 0; // typecheck passed
  } catch (e) {
    const { failOpen, out } = decideTypecheckFailure(e);
    if (failOpen) {
      stderr(FAIL_OPEN_MESSAGE);
      return 0;
    }
    stderr(blockedMessage(out));
    return 2;
  }
}

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    setTimeout(() => resolve(data), 2000);
  });
}

async function main() {
  try {
    const input = JSON.parse((await readStdin()) || "{}");
    const code = runVerify({
      input,
      getStatus: () => execSync("git status --porcelain", { encoding: "utf8" }),
      runTypecheck: () =>
        execSync("pnpm typecheck", { encoding: "utf8", stdio: "pipe", timeout: 300000 }),
      stderr: (m) => process.stderr.write(m)
    });
    process.exit(code);
  } catch {
    process.exit(0);
  }
}

// Run the Stop-hook side effects only when executed directly (node verify.mjs),
// never on import. realpath fallback covers symlinked invocations.
function invokedDirectly() {
  const entry = process.argv[1];
  if (!entry) return false;
  const self = fileURLToPath(import.meta.url);
  if (entry === self) return true;
  try {
    return realpathSync(entry) === realpathSync(self);
  } catch {
    return false;
  }
}

if (invokedDirectly()) main();
