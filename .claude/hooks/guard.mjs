#!/usr/bin/env node
// SRVF AI harness · PreToolUse guard
// Enforces the prohibitions in CLAUDE.md / docs/pure-admin/02-ai-rules.md that
// file-path deny rules cannot express (Bash command patterns + edited content).
// Fails OPEN on any internal error — the static permissions.deny rules in
// .claude/settings.json remain the hard backstop for protected files.
import process from "node:process";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    setTimeout(() => resolve(data), 2000); // never hang if no stdin
  });
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason
      }
    })
  );
  process.exit(0);
}

function checkBash(cmd) {
  const c = cmd.toLowerCase();
  // §13.2.1 — dependency mutation is human-only
  if (/\bpnpm\s+(add|remove|rm|update|up)\b/.test(c) || /\bpnpm\s+clean:cache\b/.test(c)) {
    deny(
      "Blocked: dependency mutation (pnpm add/remove/update/clean:cache). Per CLAUDE.md §4 + 02-ai-rules.md §13.2.1, AI must not change dependencies — propose it in the PR for a human to run."
    );
  }
  // R1-a: installing/adding a *specific package* is human-only. Match `<pm> add|install|i`
  // with a non-flag token after any flags, so flag-first forms (`npm i -D pkg`) are caught too.
  // Bare `pnpm install`, `pnpm install --frozen-lockfile`, `pnpm dlx`, `npm ci` stay allowed.
  if (/\b(npm|yarn|bun|pnpm)\s+(add|install|i)\b(\s+-{1,2}[^\s]+)*\s+[^-\s|;&]/.test(c)) {
    deny(
      "Blocked: installing/adding a package (npm/yarn/bun/pnpm add|install <pkg>) is human-only (02-ai-rules.md §13.2.1). Bare `pnpm install` / `pnpm install --frozen-lockfile` (lockfile restore) is fine; to add a dependency, propose it in the PR for a human to run."
    );
  }
  if (/\brm\b[^|;&\n]*pnpm-lock\.yaml/.test(c)) {
    deny("Blocked: removing pnpm-lock.yaml (02-ai-rules.md §13.2.1).");
  }
  // §13.3.12 — never bypass husky / commitlint. R1-b: also catch `-n` (short for
  // --no-verify) inside a short-flag cluster, scoped to `git commit` so `echo -n` is safe.
  if (
    /--no-verify\b/.test(c) ||
    /\bhusky=0\b/.test(c) ||
    /\bgit\s+commit\b[^|;&\n]*\s-[a-z]*n[a-z]*\b/.test(c)
  ) {
    deny(
      "Blocked: husky/commitlint bypass (--no-verify / HUSKY=0). Per CLAUDE.md §4 + 02-ai-rules.md §13.3.12, fix the lint/type error instead of bypassing the commit hook."
    );
  }
}

function checkEdit(tool, ti) {
  // R1-c: the checks below are source-code rules. Only scan code files so that
  // editing docs / markdown / json that merely mention these tokens is not blocked.
  // R2-b: also cover the .cts / .mts TypeScript module variants (.cjs / .mjs already in).
  const fp = String(ti.file_path || "");
  if (!/\.(ts|tsx|vue|js|jsx|cts|mts|cjs|mjs)$/.test(fp)) return;
  let added = "";
  if (tool === "Write") added = String(ti.content || "");
  else if (tool === "Edit") added = String(ti.new_string || "");
  else if (tool === "MultiEdit")
    added = (Array.isArray(ti.edits) ? ti.edits : []).map((e) => (e && e.new_string) || "").join("\n");

  // §13.3.5 & §13.3.8 — block TS/lint suppression pragmas. R1-e extends the set to the
  // expect-error variant. Tokens are assembled from fragments below (never written
  // contiguously) so this self-scanning .mjs guard stays editable in future (no self-block).
  const SUPPRESS_TOKENS = [
    "@ts-" + "ignore",
    "@ts-" + "nocheck",
    "@ts-" + "expect-error",
    "eslint-" + "disable"
  ];
  if (new RegExp(SUPPRESS_TOKENS.join("|")).test(added)) {
    deny(
      "Blocked: suppression comment (" +
        SUPPRESS_TOKENS.join(" / ") +
        "). Per CLAUDE.md §4 + 02-ai-rules.md §13.3.5 & §13.3.8, fix the real type/lint error. " +
        "If it is a genuine false positive, output an assessment for a human to decide."
    );
  }
  // §13.3.13 — no hardcoded VITE_* fallback in source
  if (/import\.meta\.env\.VITE_[A-Z0-9_]+\s*(\|\||\?\?)/.test(added)) {
    deny(
      'Blocked: hardcoded fallback for an import.meta.env.VITE_* value. Per CLAUDE.md §4 + 02-ai-rules.md §13.3.13, config defaults belong in .env / platform-config.json (human-owned), not as `|| "default"` in source.'
    );
  }
}

(async () => {
  try {
    const input = JSON.parse((await readStdin()) || "{}");
    const tool = input.tool_name || "";
    const ti = input.tool_input || {};
    if (tool === "Bash") checkBash(String(ti.command || ""));
    else if (tool === "Edit" || tool === "Write" || tool === "MultiEdit") checkEdit(tool, ti);
  } catch {
    // fail open — static deny rules remain the hard backstop
  }
  process.exit(0);
})();
