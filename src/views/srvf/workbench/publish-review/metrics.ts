import type { FrozenFact } from "./snapshot";

type Row = Record<string, unknown>;
const row = (v: unknown): v is Row =>
  v !== null && typeof v === "object" && !Array.isArray(v);
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (row(value))
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map(k => JSON.stringify(k) + ":" + canonical(value[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
async function hash(domain: string, definition: unknown) {
  const bytes = new TextEncoder().encode(canonical({ domain, definition }));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), x =>
    x.toString(16).padStart(2, "0")
  ).join("");
}
const pointerKeys = [
  "id",
  "code",
  "version",
  "schemaVersion",
  "definitionHash"
];
const keysMatch = (a: Row, b: Row) => pointerKeys.every(k => a[k] === b[k]);
const configurationKeys: Record<string, string[]> = {
  boolean: ["unit"],
  non_negative_integer: ["unit", "minimum", "maximum"],
  non_negative_decimal: ["unit", "minimum", "maximum", "scale"],
  short_text: ["unit", "maxLength"],
  single_choice: ["unit", "options"]
};
const labels: Record<string, string> = {
  id: "版本标识",
  code: "代码",
  version: "版本",
  schemaVersion: "格式版本",
  definitionHash: "内容摘要",
  name: "名称",
  key: "项目代码",
  sortOrder: "顺序",
  required: "必填",
  kindCode: "类型",
  unit: "单位",
  minimum: "最小值",
  maximum: "最大值",
  scale: "小数位数",
  maxLength: "最大字数",
  options: "选项",
  label: "选项名称",
  metricDefinitionId: "指标版本标识",
  configuration: "指标规则"
};
function facts(value: Row): FrozenFact[] {
  return Object.entries(value).map(([key, v]) => {
    const label = labels[key] ?? key;
    if (Array.isArray(v))
      return {
        label,
        children: v.map((o, i) => ({
          label: String(i + 1),
          children: facts(o)
        }))
      };
    if (row(v)) return { label, children: facts(v) };
    return {
      label,
      value:
        v === null
          ? "无"
          : typeof v === "boolean"
            ? v
              ? "是"
              : "否"
            : String(v)
    };
  });
}
// Input documents come from the scoped review detail. A partial response cannot be used to approve.
async function verified(doc: unknown) {
  if (!row(doc) || !row(doc.definition) || !Array.isArray(doc.metrics))
    return false;
  const set = doc.definition;
  if (
    doc.schemaVersion !== 1 ||
    !["code", "version", "schemaVersion"].every(k => doc[k] === set[k]) ||
    typeof set.name !== "string" ||
    !Array.isArray(set.items) ||
    !set.items.length ||
    set.items.length > 100 ||
    set.items.length !== doc.metrics.length ||
    (await hash("activity-metric-set", set)) !== doc.definitionHash
  )
    return false;
  for (const item of set.items) {
    if (!row(item)) return false;
    const m = doc.metrics.find(x => row(x) && x.id === item.metricDefinitionId);
    if (
      !row(m) ||
      m.definitionHash !== item.definitionHash ||
      !row(m.definition)
    )
      return false;
    const d = m.definition,
      config = d.configuration;
    if (
      !row(config) ||
      d.schemaVersion !== 1 ||
      typeof d.name !== "string" ||
      typeof config.kindCode !== "string"
    )
      return false;
    if (!Object.hasOwn(configurationKeys, config.kindCode)) return false;
    const keys = configurationKeys[config.kindCode];
    if (
      !keys ||
      !keys.every(k => Object.hasOwn(config, k)) ||
      (await hash("activity-metric-definition", d)) !== m.definitionHash
    )
      return false;
  }
  return true;
}
export async function verifyMetricDocuments(docs: unknown): Promise<Row[]> {
  if (!Array.isArray(docs) || docs.length > 2 || !globalThis.crypto?.subtle)
    return [];
  const result: Row[] = [];
  for (const doc of docs)
    if (row(doc) && (await verified(doc))) result.push(doc);
  return result;
}
export function metricFacts(
  pointer: Row,
  docs: unknown
): FrozenFact[] | undefined {
  if (
    !Array.isArray(docs) ||
    Object.keys(pointer).length !== pointerKeys.length
  )
    return;
  const doc = docs.find(x => row(x) && keysMatch(pointer, x));
  if (!doc) return;
  const children: FrozenFact[] = facts({
    ...pointer,
    name: doc.definition.name
  });
  for (const item of doc.definition.items) {
    const m = doc.metrics.find((x: Row) => x.id === item.metricDefinitionId);
    children.push({
      label: m.definition.name,
      children: [...facts(item), ...facts(m.definition)]
    });
  }
  return children;
}
