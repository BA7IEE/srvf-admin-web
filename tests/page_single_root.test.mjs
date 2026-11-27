import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { parse } = require("vue/compiler-sfc");

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const routeDir = join(root, "src/router/modules");
const importPattern = /import\(\s*["']@\/(views\/[^"']+\.vue)["']\s*\)/g;

function routeViewFiles() {
  const files = new Set();
  for (const name of readdirSync(routeDir)) {
    if (!name.endsWith(".ts")) continue;
    const source = readFileSync(join(routeDir, name), "utf8");
    for (const match of source.matchAll(importPattern)) {
      files.add(join(root, "src", match[1]));
    }
  }
  return [...files].sort();
}

function isVIf(node) {
  return (
    node.type === 1 &&
    node.props.some(
      prop => prop.type === 7 && ["if", "else-if", "else"].includes(prop.name)
    )
  );
}

function isVElseBranch(node) {
  return (
    node.type === 1 &&
    node.props.some(
      prop => prop.type === 7 && ["else-if", "else"].includes(prop.name)
    )
  );
}

function countRoots(children) {
  const roots = [];
  for (const node of children) {
    if (node.type === 3) continue;
    if (node.type === 2 && node.content.trim() === "") continue;
    if (isVElseBranch(node) && roots.length && roots.at(-1).vIfChain) {
      continue;
    }
    roots.push({ vIfChain: isVIf(node) });
  }
  return roots.length;
}

test("every route-level page template has exactly one root element", () => {
  const files = routeViewFiles();
  assert.ok(files.length > 0, "no route view imports found");

  const offenders = [];
  for (const file of files) {
    const { descriptor, errors } = parse(readFileSync(file, "utf8"), {
      filename: file
    });
    assert.equal(errors.length, 0, `${file} failed to parse: ${errors}`);
    if (!descriptor.template) continue;
    const roots = countRoots(descriptor.template.ast.children);
    if (roots !== 1) {
      offenders.push(`${file.slice(root.length + 1)} (${roots} roots)`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    "multi-root route pages break <Transition mode=\"out-in\"> in lay-content, " +
      "wrap the template content in a single <div>:\n  " +
      offenders.join("\n  ")
  );
});
