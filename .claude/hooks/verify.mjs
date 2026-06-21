#!/usr/bin/env node
// SRVF AI harness · Stop verifier
// Makes 02-ai-rules.md §13.3.8 mechanical: when code under src/ changed this
// session, run `pnpm typecheck` before the agent finishes. eslint is already
// enforced at commit by husky + lint-staged; typecheck (vue-tsc) is the session gap.
// Fails OPEN on tooling errors so it never bricks a session.
import process from "node:process";
import { execSync } from "node:child_process";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    setTimeout(() => resolve(data), 2000);
  });
}

(async () => {
  try {
    const input = JSON.parse((await readStdin()) || "{}");
    if (input.stop_hook_active) process.exit(0); // avoid Stop loops

    let changed = "";
    try {
      changed = execSync("git status --porcelain", { encoding: "utf8" });
    } catch {
      process.exit(0); // not a git context / git unavailable -> don't block
    }
    const codeChanged = changed
      .split("\n")
      .map((l) => l.slice(3).trim())
      .some((p) => /^src\/.*\.(ts|tsx|vue|js|jsx)$/.test(p));
    if (!codeChanged) process.exit(0);

    try {
      execSync("pnpm typecheck", { encoding: "utf8", stdio: "pipe", timeout: 300000 });
      process.exit(0); // typecheck passed
    } catch (e) {
      const out = `${(e && e.stdout) || ""}\n${(e && e.stderr) || ""}`.trim();
      process.stderr.write(
        "Stop blocked by SRVF harness: `pnpm typecheck` failed (02-ai-rules.md §13.3.8). " +
          "Fix the type errors below before finishing. If they are pre-existing and unrelated to this " +
          "task, a human can skip by removing the Stop hook in .claude/settings.json.\n\n" +
          out.slice(-4000)
      );
      process.exit(2);
    }
  } catch {
    process.exit(0);
  }
})();
