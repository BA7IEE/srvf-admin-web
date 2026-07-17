#!/usr/bin/env node
// SRVF AI harness · readtax(恒读层字符预算守护 · Harness 2.0-FE 2026-07-17)
// 恒读层 = 每会话开工必读的 AGENTS.md / CLAUDE.md。预算以字符数计(String.length,
// 工具无关);超限 = exit 1,由 .husky/pre-commit 调用拦下提交,防恒读层再发胖。
// 调整预算 = 改本文件常量 = 有 diff 可审。手动跑:node .claude/hooks/readtax.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const BUDGETS = [
  { file: "AGENTS.md", maxChars: 12000 },
  { file: "CLAUDE.md", maxChars: 2000 }
];

let failed = false;
for (const { file, maxChars } of BUDGETS) {
  const chars = readFileSync(path.join(ROOT, file), "utf8").length;
  const over = chars > maxChars;
  if (over) failed = true;
  console.log(`${file}: ${chars} / ${maxChars} 字符 — ${over ? "OVER" : "OK"}`);
}
if (failed) {
  console.error("✗ readtax:恒读层超预算——瘦身或(经拍板)调本文件预算,不得静默放行");
  process.exit(1);
}
console.log("✓ readtax 守护通过");
