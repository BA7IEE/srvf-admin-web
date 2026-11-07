import type {
  PublishReview,
  ReferencedPolicyVersion
} from "@/api/srvf-activity-publish-review";
import type { FrozenFact } from "./snapshot";
import { timePolicyFacts, contributionPolicyFacts } from "./policy-rules";

type Kind = "time" | "contribution";
type Row = Record<string, unknown>;
type Scope = {
  layerCode: string;
  sessionId: string | null;
  positionId: string | null;
};
export type PolicyFacts = {
  base: { time: FrozenFact[]; contribution: FrozenFact[] };
  target: { time: FrozenFact[]; contribution: FrozenFact[] };
};
export type PolicyVersionView = ReferencedPolicyVersion & {
  kind: Kind;
  uses: string[];
};
export type PolicyCoverage = {
  reviewId: string;
  activityId: string;
  snapshotHash: string;
  versions: PolicyVersionView[];
  facts: PolicyFacts;
  issues: string[];
};
const trusted = new WeakMap<
  PolicyCoverage,
  { snapshot: string; token: string }
>();
const hash = (v: unknown) => typeof v === "string" && /^[0-9a-f]{64}$/u.test(v);
const object = (v: unknown): v is Row =>
  !!v && typeof v === "object" && !Array.isArray(v);
function fail(): never {
  throw Error(
    "引用政策与当前冻结申请不完整或不一致，不能通过。请重新读取，仍失败时联系管理员核对。"
  );
}
function row(v: unknown, keys: string[]): Row {
  if (
    !object(v) ||
    Object.keys(v).length !== keys.length ||
    keys.some(k => !Object.hasOwn(v, k))
  )
    fail();
  return v;
}
function text(v: unknown): string {
  if (typeof v !== "string" || !v) fail();
  return v;
}
function integer(v: unknown): number {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 1) fail();
  return v;
}
function date(v: unknown): string {
  const t = text(v);
  if (!Number.isFinite(Date.parse(t))) fail();
  return new Date(t).toISOString();
}
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (object(v))
    return `{${Object.keys(v)
      .sort()
      .map(k => `${JSON.stringify(k)}:${canonical(v[k])}`)
      .join(",")}}`;
  return JSON.stringify(v);
}
function freeze<T>(v: T): T {
  if (v && typeof v === "object") {
    for (const x of Object.values(v)) freeze(x);
    Object.freeze(v);
  }
  return v;
}
function scope(v: unknown): Scope {
  const x = row(v, ["layerCode", "sessionId", "positionId"]);
  if (
    !["template", "activity", "session", "position"].includes(
      String(x.layerCode)
    )
  )
    fail();
  if (
    (x.sessionId !== null && typeof x.sessionId !== "string") ||
    (x.positionId !== null && typeof x.positionId !== "string")
  )
    fail();
  const s = x as Scope;
  if (
    (["template", "activity"].includes(s.layerCode) &&
      (s.sessionId !== null || s.positionId !== null)) ||
    (s.layerCode === "session" && (!s.sessionId || s.positionId !== null)) ||
    (s.layerCode === "position" && (!s.sessionId || !s.positionId))
  )
    fail();
  return s;
}
function scopeKey(s: Scope) {
  const encode = (v: string | null) =>
    v === null
      ? "-"
      : btoa(String.fromCharCode(...new TextEncoder().encode(v)));
  return `${s.layerCode}:${encode(s.sessionId)}:${encode(s.positionId)}`;
}
function pointer(v: unknown, kind: Kind) {
  const p = row(
    v,
    kind === "time"
      ? ["policyId", "versionId", "definitionHash"]
      : ["policyId", "versionId", "definitionHash", "evaluatorVersion"]
  );
  text(p.policyId);
  text(p.versionId);
  if (
    !hash(p.definitionHash) ||
    (kind === "contribution" && p.evaluatorVersion !== 1)
  )
    fail();
  return p;
}
function pointerKey(p: Row) {
  return canonical([p.policyId, p.versionId, p.definitionHash]);
}
function snapshotKey(review: PublishReview) {
  return canonical({
    id: review.id,
    activityId: review.activityId,
    requestType: review.requestType,
    requestVersion: review.requestVersion,
    baseRevision: review.baseRevision,
    snapshot: review.snapshot
  });
}
export function policyToken(value: PolicyCoverage | null) {
  return value ? (trusted.get(value)?.token ?? "untrusted") : "none";
}
export function policyCoverageFor(
  review: PublishReview,
  value?: PolicyCoverage | null
) {
  return value && trusted.get(value)?.snapshot === snapshotKey(review)
    ? value
    : null;
}
export function needsReferencedPolicies(review: PublishReview) {
  const parts = [review.snapshot, review.snapshot.base];
  return parts.some(
    x =>
      object(x) &&
      [x.timePolicyPointers, x.contributionPolicyPointers].some(
        v => v !== undefined && v !== null
      )
  );
}

/** All base+target explicit/resolved pointers, including overridden selections, must match. */
export function bindReferencedPolicies(
  review: PublishReview,
  input: unknown
): PolicyCoverage {
  const data = row(input, [
    "reviewId",
    "activityId",
    "snapshotSchemaVersion",
    "snapshotHash",
    "timePolicies",
    "contributionPolicies"
  ]);
  if (
    data.reviewId !== review.id ||
    data.activityId !== review.activityId ||
    data.snapshotSchemaVersion !== review.snapshot.schemaVersion ||
    data.snapshotHash !== review.snapshot.snapshotHash ||
    !hash(data.snapshotHash)
  )
    fail();
  const versions: PolicyVersionView[] = [];
  const byKind: {
    time: Map<string, PolicyVersionView>;
    contribution: Map<string, PolicyVersionView>;
  } = { time: new Map(), contribution: new Map() };
  for (const kind of ["time", "contribution"] as const) {
    const list =
      data[kind === "time" ? "timePolicies" : "contributionPolicies"];
    if (!Array.isArray(list)) fail();
    const ids = new Set<string>();
    for (const value of list) {
      const p = row(value, [
        "policyId",
        "versionId",
        "version",
        "schemaVersion",
        "evaluatorVersion",
        "definitionHash",
        "effectiveFrom",
        "effectiveUntil",
        "definition"
      ]);
      text(p.policyId);
      const id = text(p.versionId);
      integer(p.version);
      if (
        ids.has(id) ||
        p.schemaVersion !== 1 ||
        p.evaluatorVersion !== 1 ||
        !hash(p.definitionHash)
      )
        fail();
      ids.add(id);
      const from = date(p.effectiveFrom),
        until = p.effectiveUntil === null ? null : date(p.effectiveUntil);
      if (until !== null && until <= from) fail();
      (kind === "time" ? timePolicyFacts : contributionPolicyFacts)(
        p.definition
      );
      const version = {
        ...JSON.parse(JSON.stringify(p)),
        effectiveFrom: from,
        effectiveUntil: until,
        kind,
        uses: []
      } as PolicyVersionView;
      byKind[kind].set(pointerKey(p), version);
      versions.push(version);
    }
  }
  const issues: string[] = [];
  const facts: PolicyFacts = {
    base: { time: [], contribution: [] },
    target: { time: [], contribution: [] }
  };
  for (const side of ["base", "target"] as const) {
    const target = side === "base" ? review.snapshot.base : review.snapshot;
    if (!object(target) || !Array.isArray(target.sessions)) fail();
    const sessions = target.sessions;
    if (
      sessions.length !== 1 ||
      !object(sessions[0]) ||
      !Array.isArray(sessions[0].positions) ||
      sessions[0].positions.length !== 1 ||
      !object(sessions[0].positions[0]) ||
      sessions[0].statusCode !== "scheduled" ||
      sessions[0].positions[0].cancelled !== false ||
      !object(target.activity) ||
      target.activity.allocationModeCode !== "first_come"
    )
      issues.push("本轮政策审批仅支持单场次、单岗位、先到先得的初发安排。");
    const label = (s: Scope) => {
      if (s.layerCode === "template") return "模板默认";
      if (s.layerCode === "activity") return "活动";
      const found = sessions.find(
        x =>
          object(x) &&
          (x.sessionId === s.sessionId || x.clientRef === s.sessionId)
      );
      if (!object(found)) fail();
      if (s.layerCode === "session") return `场次「${String(found.name)}」`;
      if (!Array.isArray(found.positions)) fail();
      const p = found.positions.find(
        x =>
          object(x) &&
          (x.positionId === s.positionId || x.clientRef === s.positionId)
      );
      if (!object(p)) fail();
      return `岗位「${String(p.name)}」`;
    };
    const prefix = side === "base" ? "原基线" : "目标";
    for (const kind of ["time", "contribution"] as const) {
      const raw =
        target[
          kind === "time" ? "timePolicyPointers" : "contributionPolicyPointers"
        ];
      if (raw === null) continue;
      const env = row(raw, [
        "schemaVersion",
        "selectionRevision",
        "proposalSelectionHash",
        "selection",
        "resolved",
        "referenceKinds"
      ]);
      if (env.schemaVersion !== 1 || !hash(env.proposalSelectionHash)) fail();
      integer(env.selectionRevision);
      const selection = row(env.selection, ["schemaVersion", "items"]);
      if (
        selection.schemaVersion !== 1 ||
        !object(selection.items) ||
        !Array.isArray(env.resolved) ||
        !object(env.referenceKinds)
      )
        fail();
      const refs = new Map<string, Scope>();
      const selected: FrozenFact[] = [];
      const resolved: FrozenFact[] = [];
      const lookup = (p: Row, use: string) => {
        const v = byKind[kind].get(pointerKey(p));
        if (
          !v ||
          (kind === "contribution" && p.evaluatorVersion !== v.evaluatorVersion)
        )
          fail();
        if (!v.uses.includes(use)) v.uses.push(use);
        return v;
      };
      const name = (v: PolicyVersionView) =>
        `政策 ${v.policyId} · 版本 ${v.version} · 版本标识 ${v.versionId}`;
      const items = Object.entries(selection.items);
      for (const [key, value] of items) {
        const item = row(value, ["scope", "selection"]),
          s = scope(item.scope);
        if (key !== scopeKey(s)) fail();
        refs.set(key, s);
        const chosen = row(item.selection, ["mode", "pointer"]);
        let display = "沿用上层设置";
        if (chosen.mode === "explicit") {
          display = name(
            lookup(
              pointer(chosen.pointer, kind),
              `${prefix}·${label(s)}·显式选择`
            )
          );
        } else if (chosen.mode !== "inherit" || chosen.pointer !== null) fail();
        selected.push({
          label: label(s),
          value: `${chosen.mode === "explicit" ? "明确选择" : "继承"}：${display}`
        });
        if (
          (kind === "time" &&
            !(
              (s.layerCode === "template" && chosen.mode === "explicit") ||
              (s.layerCode === "activity" && chosen.mode === "inherit")
            )) ||
          (kind === "contribution" &&
            !(s.layerCode === "activity" && chosen.mode === "inherit"))
        )
          issues.push("存在活动、场次或岗位政策覆盖，本轮不支持通过。");
      }
      if (
        (kind === "time" &&
          (items.length !== 2 ||
            !Object.values(selection.items).some(
              x =>
                object(x) && object(x.scope) && x.scope.layerCode === "template"
            ))) ||
        (kind === "contribution" && items.length !== 1)
      )
        issues.push("本轮仅支持完整的模板默认政策继承。");
      const resolvedKeys = new Set<string>();
      for (const value of env.resolved) {
        const x = row(
          value,
          kind === "time"
            ? [
                "scope",
                "pointer",
                "evaluatorVersion",
                "sourceScope",
                "effectiveFrom",
                "effectiveUntil"
              ]
            : [
                "scope",
                "pointer",
                "sourceLayerCode",
                "effectiveFrom",
                "effectiveUntil"
              ]
        );
        const s = scope(x.scope),
          key = scopeKey(s);
        if (
          resolvedKeys.has(key) ||
          s.layerCode === "template" ||
          (kind === "contribution" && s.layerCode === "session")
        )
          fail();
        resolvedKeys.add(key);
        refs.set(key, s);
        const v = lookup(
            pointer(x.pointer, kind),
            `${prefix}·${label(s)}·实际采用`
          ),
          from = date(x.effectiveFrom),
          until = x.effectiveUntil === null ? null : date(x.effectiveUntil);
        if (until !== null && until <= from) fail();
        let source: string;
        if (kind === "time") {
          const src = scope(x.sourceScope);
          source = label(src);
          if (
            x.evaluatorVersion !== 1 ||
            v.effectiveFrom > from ||
            (v.effectiveUntil !== null &&
              (until === null || v.effectiveUntil < until))
          )
            fail();
          if (src.layerCode !== "template")
            issues.push("时长政策含非模板默认来源，本轮不支持通过。");
          const chosen = selection.items[scopeKey(src)];
          if (
            !object(chosen) ||
            !object(chosen.selection) ||
            chosen.selection.mode !== "explicit" ||
            pointerKey(pointer(chosen.selection.pointer, kind)) !==
              pointerKey(x.pointer as Row)
          )
            fail();
        } else {
          if (
            !["template", "activity", "position"].includes(
              String(x.sourceLayerCode)
            )
          )
            fail();
          source = (
            {
              template: "模板默认",
              activity: "活动设置",
              position: "岗位设置"
            } as Record<string, string>
          )[String(x.sourceLayerCode)];
          if (
            from !== date(v.effectiveFrom) ||
            until !==
              (v.effectiveUntil === null ? null : date(v.effectiveUntil))
          )
            fail();
          if (x.sourceLayerCode !== "template")
            issues.push("贡献政策含非模板默认来源，本轮不支持通过。");
        }
        resolved.push({
          label: label(s),
          children: [
            { label: "实际采用", value: name(v) },
            { label: "来源", value: source },
            {
              label: kind === "time" ? "冻结适用时段" : "引用版本生效时段",
              value: `${from} 至 ${until ?? "无结束限制"}`
            }
          ]
        });
      }
      const expectedScopes = [
        { layerCode: "activity", sessionId: null, positionId: null } as Scope
      ];
      for (const item of sessions) {
        if (!object(item) || !Array.isArray(item.positions)) fail();
        const sid = text(item.sessionId ?? item.clientRef);
        if (kind === "time")
          expectedScopes.push({
            layerCode: "session",
            sessionId: sid,
            positionId: null
          });
        for (const pos of item.positions) {
          if (!object(pos)) fail();
          expectedScopes.push({
            layerCode: "position",
            sessionId: sid,
            positionId: text(pos.positionId ?? pos.clientRef)
          });
        }
      }
      if (
        canonical([...resolvedKeys].sort()) !==
        canonical(expectedScopes.map(scopeKey).sort())
      )
        fail();
      if (
        kind === "contribution" &&
        new Set(
          env.resolved.map(x =>
            object(x) && object(x.pointer) ? pointerKey(x.pointer) : "invalid"
          )
        ).size !== 1
      )
        issues.push("模板含岗位贡献政策覆盖，本轮不支持通过。");
      if (
        canonical(Object.keys(env.referenceKinds).sort()) !==
        canonical([...refs.keys()].sort())
      )
        fail();
      const refFacts: FrozenFact[] = [];
      for (const [key, s] of refs) {
        const r = row(env.referenceKinds[key], [
          "sessionRefKind",
          "positionRefKind"
        ]);
        if (
          r.sessionRefKind !== (s.sessionId === null ? null : "id") ||
          r.positionRefKind !== (s.positionId === null ? null : "id")
        )
          fail();
        refFacts.push({ label: label(s), value: "已对应冻结内容中的固定标识" });
      }
      facts[side][kind] = [
        { label: "政策选择修订", value: String(env.selectionRevision) },
        { label: "选择内容校验值", value: String(env.proposalSelectionHash) },
        { label: "选择与继承", children: selected },
        { label: "实际采用的版本及来源", children: resolved },
        { label: "场次岗位引用对应", children: refFacts }
      ];
    }
  }
  if (versions.some(v => !v.uses.length)) fail();
  if (review.requestType !== "initial" || review.snapshot.schemaVersion !== 9)
    issues.push("本轮政策通过仅支持正常 V5 模板的 V9 初发申请。");
  if (
    object(review.snapshot.base) &&
    ["timePolicyPointers", "contributionPolicyPointers"].some(
      k =>
        canonical(review.snapshot.base && (review.snapshot.base as Row)[k]) !==
        canonical(review.snapshot[k])
    )
  )
    issues.push("冻结基线与目标政策不同，本轮不支持通过。");
  const coverage = freeze({
    reviewId: review.id,
    activityId: review.activityId,
    snapshotHash: String(data.snapshotHash),
    versions,
    facts,
    issues: [...new Set(issues)]
  });
  trusted.set(coverage, {
    snapshot: snapshotKey(review),
    token: canonical(data)
  });
  return coverage;
}
