#!/usr/bin/env node
// SRVF AI harness · drift doctor (B)
// Run: `node .claude/hooks/harness-doctor.mjs`
//
// Two independent checks, so the harness cannot silently go stale (13A.5):
//   [1] Structural: every ❌/⚠️ row of 02-ai-rules.md §13.1 must still be covered by
//       BOTH an Edit and a Write deny/ask glob in .claude/settings.json. No coverage,
//       or only one of the Edit/Write pair, is real drift (a guard removed or half-
//       removed) -> non-zero exit. Extra settings entries beyond the matrix are
//       reported as INFO (additive protection is never drift).
//   [2] Advisory: compare the frozen backend baseline recorded in
//       srvf-api-contract-readiness.md against the live ../srvf-nest-api version.
//       A lag only WARNs (re-verify the §6 checklist before PR-4) — it never flips
//       the exit code, because the freeze is meant to lag the live backend.
//
// Path inputs can be overridden via env (SRVF_DOCTOR_SETTINGS / _RULES / _READINESS
// / _NESTAPI) so the logic is testable against fixtures.
import process from "node:process";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", ".."); // .claude/hooks -> project root
const SETTINGS = process.env.SRVF_DOCTOR_SETTINGS || path.join(ROOT, ".claude", "settings.json");
const RULES = process.env.SRVF_DOCTOR_RULES || path.join(ROOT, "docs", "pure-admin", "02-ai-rules.md");
const READINESS =
  process.env.SRVF_DOCTOR_READINESS || path.join(ROOT, "docs", "srvf-api-contract-readiness.md");

// ---- glob helpers ----------------------------------------------------------------
// Single left-to-right pass so `**` -> `.*` and a lone `*` -> `[^/]*` without any
// placeholder substitution (an earlier placeholder version smuggled a stray byte in).
function globToRe(glob) {
  let re = "^";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        re += ".*";
        i++;
      } else {
        re += "[^/]*";
      }
    } else if (/[.+^${}()|[\]\\]/.test(c)) {
      re += "\\" + c;
    } else {
      re += c;
    }
  }
  return new RegExp(re + "$");
}
function covers(glob, p) {
  const re = globToRe(glob);
  return re.test(p) || re.test(p.replace(/\/+$/, ""));
}
const dirname = (p) => {
  const i = p.replace(/\/+$/, "").lastIndexOf("/");
  return i >= 0 ? p.replace(/\/+$/, "").slice(0, i) : "";
};

// ---- parse settings.json ---------------------------------------------------------
function loadSettings() {
  const json = JSON.parse(readFileSync(SETTINGS, "utf8"));
  const perm = json.permissions || {};
  const parse = (arr, bucket) =>
    (arr || [])
      .map((s) => {
        const m = String(s).match(/^(Edit|Write|Read)\((?:\.\/)?(.*)\)$/);
        return m ? { bucket, tool: m[1], glob: m[2], raw: s, used: false } : null;
      })
      .filter(Boolean);
  return [...parse(perm.deny, "deny"), ...parse(perm.ask, "ask")];
}

// ---- parse §13.1 matrix ----------------------------------------------------------
const ROOT_TOKENS = ["src/", "mock/", "public/", "docs/", "build/", ".husky/"];
function isRootConfig(item) {
  if (item.includes("/")) return false;
  return /\.(json|ya?ml)$/.test(item) || /\.config\.[cm]?[jt]s$/.test(item) || item.startsWith(".");
}
function isAbsolute(item) {
  return ROOT_TOKENS.some((t) => item.startsWith(t)) || item.startsWith(".env") || isRootConfig(item);
}

// Reconstruct one concrete path per item in a matrix cell. The table uses " / " as
// the list separator and abbreviates trailing items: a bare filename shares the
// previous item's directory (`user.ts / permission.ts`), while a `dir/*` item is a
// sibling one level up (`dict/* / tenant/*`). Root-level config files reset to root.
function cellPaths(cell) {
  const items = cell
    .replace(/`/g, "")
    .split(/\s+\/\s+|\s*[、,]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  let baseDir = "";
  const out = [];
  for (const item of items) {
    if (item.includes("<") || /[一-鿿]/.test(item)) continue; // placeholder / prose
    let p;
    if (isAbsolute(item)) {
      p = item;
      baseDir = dirname(item);
    } else if (item.includes("/")) {
      const up = dirname(baseDir); // one level up from the previous sibling dir
      p = up ? `${up}/${item}` : item;
      baseDir = dirname(p);
    } else {
      p = baseDir ? `${baseDir}/${item}` : item;
    }
    out.push({ raw: item, path: p });
  }
  return out;
}
function loadMatrixSpecs() {
  const text = readFileSync(RULES, "utf8");
  const start = text.indexOf("### 13.1");
  const end = text.indexOf("### 13.2", start + 1);
  const block = text.slice(start, end < 0 ? undefined : end);
  const specs = [];
  for (const line of block.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 4) continue;
    const col1 = cells[1];
    const verdict = cells[2];
    if (/^-+$/.test(col1) || col1 === "文件 / 目录") continue; // separator / header
    let symbol = null;
    if (verdict.includes("❌")) symbol = "deny";
    else if (verdict.includes("⚠️")) symbol = "ask";
    else continue; // ✅ rows are not protected
    for (const { raw, path: p } of cellPaths(col1)) specs.push({ raw, path: p, symbol });
  }
  return specs;
}

// ---- version helpers -------------------------------------------------------------
function frozenBaseline() {
  if (!existsSync(READINESS)) return null;
  const m = readFileSync(READINESS, "utf8").match(/srvf-nest-api\s+v?(\d+\.\d+\.\d+)/i);
  return m ? m[1] : null;
}
function liveBackendVersion() {
  const candidates = [];
  if (process.env.SRVF_DOCTOR_NESTAPI) candidates.push(process.env.SRVF_DOCTOR_NESTAPI);
  candidates.push(path.resolve(ROOT, "..", "srvf-nest-api", "package.json"));
  try {
    const commonDir = execSync("git rev-parse --path-format=absolute --git-common-dir", {
      cwd: ROOT,
      encoding: "utf8"
    }).trim();
    candidates.push(path.resolve(path.dirname(commonDir), "..", "srvf-nest-api", "package.json"));
  } catch {
    /* not a git context — rely on the relative candidate only */
  }
  for (const c of candidates) {
    if (c && existsSync(c)) {
      try {
        return { version: JSON.parse(readFileSync(c, "utf8")).version, at: c };
      } catch {
        /* unreadable — keep looking */
      }
    }
  }
  return null;
}
function cmpSemver(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) < (pb[i] || 0) ? -1 : 1;
  }
  return 0;
}

// ---- run -------------------------------------------------------------------------
function extraReason(glob, tool) {
  if (/^src\/api\/user\.ts$|^src\/views\/login/.test(glob)) return "login/token guard (CLAUDE.md §4)";
  if (glob.startsWith(".claude/") || /13-ai-harness/.test(glob)) return "harness self-protection (A)";
  if (tool === "Read") return "read-noise reduction";
  if (glob === "postcss.config.js") return "engineering config";
  return "additive — verify intent";
}

function main() {
  const settings = loadSettings();
  const editable = settings.filter((e) => e.tool !== "Read");
  const specs = loadMatrixSpecs();
  const missing = [];

  console.log("SRVF harness-doctor\n");
  console.log("[1] §13.1 matrix ↔ settings.json coverage");
  // Rows whose protection is enforced dynamically by guard.mjs rather than by a static
  // deny/ask glob. They are intentionally absent from settings.json, so the Edit+Write
  // coverage rule below would otherwise misreport them as drift.
  const GUARD_ENFORCED = new Set(["public/platform-config.json"]);
  for (const spec of specs) {
    if (GUARD_ENFORCED.has(spec.path)) {
      console.log(`  ok    ${spec.symbol.padEnd(4)} ${spec.path}  ← guard.mjs (改值 allow / 增删字段 deny)`);
      continue;
    }
    // A ❌/⚠️ path needs BOTH Edit and Write blocked. One tool alone leaves a hole
    // (e.g. Edit-deny removed but Write-deny kept => the file is editable again), so a
    // partial pair is drift, not "ok".
    const covering = editable.filter((e) => covers(e.glob, spec.path));
    const hasEdit = covering.some((e) => e.tool === "Edit");
    const hasWrite = covering.some((e) => e.tool === "Write");
    if (!hasEdit && !hasWrite) {
      missing.push(spec);
      console.log(`  MISS  ${spec.symbol.padEnd(4)} ${spec.path}  (no deny/ask glob covers it)`);
    } else if (!hasEdit || !hasWrite) {
      const have = hasEdit ? "Edit" : "Write";
      const gap = hasEdit ? "Write" : "Edit";
      missing.push(spec);
      for (const e of covering) e.used = true; // the present twin is intentional, not an extra
      console.log(`  MISS  ${spec.symbol.padEnd(4)} ${spec.path}  (only ${have} covered; ${gap} deny/ask missing)`);
    } else {
      // both twins present — mark every covering entry used so a protected path never
      // resurfaces as a false "extra"; prefer an exact same-bucket match for display.
      for (const e of covering) e.used = true;
      let best = covering[0];
      for (const e of covering) {
        const exact = !e.glob.includes("*") && e.glob === spec.path;
        if (exact && (best.glob.includes("*") || best.bucket !== spec.symbol)) best = e;
      }
      const via = best.bucket !== spec.symbol ? `  [via ${best.bucket}]` : "";
      console.log(`  ok    ${spec.symbol.padEnd(4)} ${spec.path}  ← ${best.bucket} ${best.glob}${via}`);
    }
  }

  const extras = [];
  const seen = new Set();
  for (const e of settings) {
    if (e.tool !== "Read" && e.used) continue;
    const key = `${e.bucket}:${e.glob}`;
    if (seen.has(key)) continue;
    seen.add(key);
    extras.push(e);
  }
  if (extras.length) {
    console.log("\n  extra settings entries (beyond §13.1 — additive, not drift):");
    for (const e of extras) {
      console.log(`    INFO  ${e.bucket}  ${e.glob}  · ${extraReason(e.glob, e.tool)}`);
    }
  }

  console.log("\n[2] backend contract freeze (srvf-nest-api)");
  const baseline = frozenBaseline();
  const live = liveBackendVersion();
  if (!baseline) {
    console.log("  no frozen baseline recorded in readiness doc yet — cannot compare.");
  } else if (!live) {
    console.log(`  frozen baseline v${baseline}; live ../srvf-nest-api not found — cannot verify.`);
  } else {
    const c = cmpSemver(baseline, live.version);
    if (c < 0) {
      console.log(
        `  WARN  frozen baseline v${baseline} < live v${live.version} — backend advanced; re-verify the ` +
          "§6 readiness checklist against the current contract before restarting PR-4."
      );
    } else if (c > 0) {
      console.log(`  WARN  frozen baseline v${baseline} > live v${live.version} — unexpected; check the sibling repo.`);
    } else {
      console.log(`  frozen baseline v${baseline} == live v${live.version} — in sync.`);
    }
  }

  const drift = missing.length > 0;
  console.log(
    `\nResult: ${drift ? `STRUCTURAL DRIFT — ${missing.length} uncovered §13.1 row(s)` : "no structural drift"} (exit ${drift ? 1 : 0})`
  );
  process.exit(drift ? 1 : 0);
}

main();
