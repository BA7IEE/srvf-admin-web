#!/usr/bin/env node
// SRVF AI harness · PreToolUse guard
// Enforces the prohibitions in AGENTS.md / docs/pure-admin/02-ai-rules.md that
// file-path deny rules cannot express (Bash command patterns + edited content).
// Fails OPEN on any internal error — the static permissions.deny rules in
// .claude/settings.json remain the hard backstop for protected files.
import process from "node:process";
import { readFileSync } from "node:fs";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    setTimeout(() => resolve(data), 2000); // never hang if no stdin
  });
}

function decide(decision, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: decision,
        permissionDecisionReason: reason
      }
    })
  );
  process.exit(0);
}
function deny(reason) {
  decide("deny", reason);
}

function checkBash(cmd) {
  const c = cmd.toLowerCase();
  // §13.2.1 — dependency mutation is human-only
  if (/\bpnpm\s+(add|remove|rm|update|up)\b/.test(c) || /\bpnpm\s+clean:cache\b/.test(c)) {
    deny(
      "Blocked: dependency mutation (pnpm add/remove/update/clean:cache). Per AGENTS.md §1 + 02-ai-rules.md §13.2.1, AI must not change dependencies — propose it in the PR for a human to run."
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
      "Blocked: husky/commitlint bypass (--no-verify / HUSKY=0). Per AGENTS.md §1 + 02-ai-rules.md §13.3.12, fix the lint/type error instead of bypassing the commit hook."
    );
  }
  // R4-b (13A.11): flag-tolerant dependency mutation — `pnpm -C dir add x`,
  // `pnpm --filter web add x`, `npm --prefix dir install x` slip past the
  // adjacent-subcommand regexes above. Flags (each optionally followed by one
  // separate value token) may sit between the binary and the subcommand.
  // `pnpm run add-user` stays clean: `run` is not a flag, so the group never starts.
  if (
    /\b(npm|yarn|bun|pnpm)\s+(?:-{1,2}[^\s|;&]+(?:\s+[^-\s|;&][^\s|;&]*)?\s+)+(add|remove|rm|update|up|install|i)\b/.test(
      c
    )
  ) {
    deny(
      "Blocked: dependency mutation via flagged package-manager invocation (e.g. `pnpm -C dir add` / `pnpm --filter x add`). Per AGENTS.md §1 + 02-ai-rules.md §13.2.1, dependency changes are human-only."
    );
  }
  // R4-c (13A.11): `npm|pnpm pkg set/delete` writes package.json fields directly.
  // Parity with the Edit-path rule: scripts.* => allow, protected roots => deny,
  // anything else => ask (safe floor).
  const pkgCmd = c.match(/\b(?:npm|pnpm|yarn|bun)\b[^|;&\n]*?\bpkg\s+(?:set|delete)\b([^|;&\n]*)/);
  if (pkgCmd) {
    const args = String(pkgCmd[1] || "");
    if (
      /(^|[\s"'])(dependencies|devdependencies|peerdependencies|optionaldependencies|bundleddependencies|engines|pnpm|overrides|resolutions|packagemanager)([.=\s"'[]|$)/.test(
        args
      )
    ) {
      deny(
        "Blocked: `pkg set/delete` on a package.json dependency-area field. Per AGENTS.md §1 + 02-ai-rules.md §13.2.1, these fields are human-only."
      );
    }
    const toks = args.trim().split(/\s+/).filter((t) => t && !t.startsWith("-"));
    if (toks.length && toks.every((t) => /^["']?scripts[.[]/.test(t))) {
      decide(
        "allow",
        "Allowed: `pkg set/delete` limited to scripts.* — parity with the Edit-path scripts-only rule (13-ai-harness §13A.11)."
      );
    }
    decide(
      "ask",
      "package.json `pkg set/delete` outside scripts — deferring to a human (safe floor, 13-ai-harness §13A.11)."
    );
  }
  // R4-d (13A.11): raw-write side doors into package.json. Use the Edit tool so the
  // scripts-vs-dependency gate can inspect the change.
  if (/\bsed\b[^|;&\n]*\s-[a-z]*i[^|;&\n]*package\.json/.test(c) || />>?\s*(?:[^\s|;&]*\/)?package\.json\b/.test(c)) {
    deny(
      "Blocked: raw write to package.json (sed -i / shell redirection). Edit it with the Edit tool so the scripts-vs-dependency gate applies (02-ai-rules.md §13.1 / 13-ai-harness §13A.11)."
    );
  }
}

// §13.1 — public/platform-config.json: AI may change VALUES, never the field set.
// The guard reads the on-disk file, reconstructs the post-edit JSON, and compares the
// top-level key set: unchanged => allow (value-only); added/removed => deny; can't tell
// (read/parse error) => ask (safe floor). This replaces the file's static ask rule.
function applyEdits(text, tool, ti) {
  if (tool === "Write") return String(ti.content || "");
  // R4-a: honor replace_all — the real Edit/MultiEdit replaces EVERY occurrence when
  // the flag is set; simulating only the first occurrence let a cross-area edit look
  // "scripts-only" (reviewed & reproduced 2026-07-18, 13A.11). String#replace(All)
  // with a function replacement treats new text literally ($ is not special).
  const applyOne = (t, e) => {
    const oldS = String((e && e.old_string) ?? "");
    const newS = String((e && e.new_string) ?? "");
    if (!oldS) return t; // the real Edit rejects empty old_string — never simulate insertion
    return e && e.replace_all ? t.replaceAll(oldS, () => newS) : t.replace(oldS, () => newS);
  };
  if (tool === "Edit") return applyOne(text, ti);
  if (tool === "MultiEdit") {
    let t = text;
    for (const e of Array.isArray(ti.edits) ? ti.edits : []) t = applyOne(t, e);
    return t;
  }
  return text;
}
// R4-a: when an old_string is absent from the on-disk text, the simulation cannot
// reproduce the real edit — the caller must fall to the ask safe floor instead of
// letting "before === after" read as a harmless no-op. MultiEdit is checked
// sequentially so a later edit may legitimately match text produced by an earlier one.
function editsUnverifiable(text, tool, ti) {
  if (tool === "Edit") {
    const oldS = String(ti.old_string ?? "");
    return !!oldS && !text.includes(oldS);
  }
  if (tool === "MultiEdit") {
    let t = text;
    for (const e of Array.isArray(ti.edits) ? ti.edits : []) {
      const oldS = String((e && e.old_string) ?? "");
      if (oldS && !t.includes(oldS)) return true;
      t = applyEdits(t, "Edit", e);
    }
  }
  return false;
}
function checkPlatformConfig(tool, ti) {
  const fp = String(ti.file_path || "");
  if (!/(^|\/)public\/platform-config\.json$/.test(fp)) return;
  try {
    const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const abs = fp.startsWith("/") ? fp : `${root}/${fp.replace(/^\.\//, "")}`;
    const text = readFileSync(abs, "utf8");
    if (editsUnverifiable(text, tool, ti)) {
      decide(
        "ask",
        "public/platform-config.json: edit could not be reproduced against the on-disk file (old_string not found) — deferring to a human (safe floor, 13A.11)."
      );
    }
    const before = Object.keys(JSON.parse(text)).sort();
    const after = Object.keys(JSON.parse(applyEdits(text, tool, ti))).sort();
    if (JSON.stringify(before) === JSON.stringify(after)) {
      decide(
        "allow",
        "Allowed: public/platform-config.json value-only change (top-level fields unchanged) — 02-ai-rules.md §13.1「改值可」. Adding/removing a field stays human-only."
      );
    }
    deny(
      "Blocked: public/platform-config.json field add/remove is human-only (02-ai-rules.md §13.1「改值可 / 增删字段不可」). Change existing values, not the config shape."
    );
  } catch {
    decide(
      "ask",
      "public/platform-config.json: could not verify this is a value-only change (read/parse error) — deferring to a human (safe floor)."
    );
  }
}

// §13.2.1 + 13A.10 — package.json: scripts-only edits are routine; the dependency
// area stays human-only. Same three-state pattern as checkPlatformConfig: read the
// on-disk file, rebuild the post-edit JSON, diff which top-level keys changed.
// Only `scripts` changed => allow; any protected field changed => deny; anything
// else (name/version/… or unparseable) => ask (safe floor). Replaces the static ask.
const PKG_PROTECTED = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
  "bundledDependencies",
  "engines",
  "pnpm",
  "overrides",
  "resolutions",
  "packageManager"
];
function checkPackageJson(tool, ti) {
  const fp = String(ti.file_path || "");
  if (!/(^|\/)package\.json$/.test(fp)) return;
  try {
    const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const abs = fp.startsWith("/") ? fp : `${root}/${fp.replace(/^\.\//, "")}`;
    const text = readFileSync(abs, "utf8");
    if (editsUnverifiable(text, tool, ti)) {
      decide(
        "ask",
        "package.json: edit could not be reproduced against the on-disk file (old_string not found) — deferring to a human (safe floor, 13A.11)."
      );
    }
    const before = JSON.parse(text);
    const after = JSON.parse(applyEdits(text, tool, ti));
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const changed = [...keys].filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
    const hit = changed.filter((k) => PKG_PROTECTED.includes(k));
    if (hit.length) {
      deny(
        "Blocked: package.json dependency-area change (" +
          hit.join(", ") +
          "). Per AGENTS.md §1 + 02-ai-rules.md §13.2.1, dependency/engines/pnpm fields are human-only — propose the change in the PR for a human to run."
      );
    }
    if (changed.length && changed.every((k) => k === "scripts")) {
      decide(
        "allow",
        "Allowed: package.json scripts-only change (dependency area untouched) — 02-ai-rules.md §13.1 / 13-ai-harness §13A.10. Dependency/engines/pnpm changes stay human-only."
      );
    }
    if (!changed.length) {
      decide("allow", "Allowed: package.json edit leaves the parsed content unchanged (formatting-only).");
    }
    decide(
      "ask",
      "package.json: change outside scripts (" +
        changed.join(", ") +
        ") — deferring to a human (safe floor, 13-ai-harness §13A.10)."
    );
  } catch {
    decide(
      "ask",
      "package.json: could not verify this is a scripts-only change (read/parse error) — deferring to a human (safe floor)."
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
        "). Per AGENTS.md §1 + 02-ai-rules.md §13.3.5 & §13.3.8, fix the real type/lint error. " +
        "If it is a genuine false positive, output an assessment for a human to decide."
    );
  }
  // §13.3.13 — no hardcoded VITE_* fallback in source
  if (/import\.meta\.env\.VITE_[A-Z0-9_]+\s*(\|\||\?\?)/.test(added)) {
    deny(
      'Blocked: hardcoded fallback for an import.meta.env.VITE_* value. Per AGENTS.md §1 + 02-ai-rules.md §13.3.13, config defaults belong in .env / platform-config.json (human-owned), not as `|| "default"` in source.'
    );
  }
}

(async () => {
  try {
    const input = JSON.parse((await readStdin()) || "{}");
    const tool = input.tool_name || "";
    const ti = input.tool_input || {};
    if (tool === "Bash") checkBash(String(ti.command || ""));
    else if (tool === "Edit" || tool === "Write" || tool === "MultiEdit") {
      checkPlatformConfig(tool, ti); // §13.1: value-only allow / field-change deny / unsure ask
      checkPackageJson(tool, ti); // §13A.10: scripts-only allow / dependency-area deny / else ask
      checkEdit(tool, ti);
    }
  } catch {
    // fail open — static deny rules remain the hard backstop
  }
  process.exit(0);
})();
