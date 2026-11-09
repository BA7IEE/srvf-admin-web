import type { FrozenFact } from "./snapshot";

/** Definition grammar only: fixed ea4a3579 time/contribution-policy-definition.ts.
 * This module does not define a remote response or choose an effective policy. */
const categories: Record<string, string> = {
  volunteer_service: "志愿服务",
  training: "培训",
  organization: "组织活动",
  non_creditable: "不计入时长"
};
const evidenceLabels: Record<string, string> = {
  punch_event: "签到签退记录",
  service_segment: "服务时段",
  attachment: "附件"
};
function fail(label: string): never {
  throw Error(`${label}缺失、格式未知或包含未支持规则，无法完整展示。`);
}
function record(
  value: unknown,
  keys: string[],
  label: string
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(label);
  const row = value as Record<string, unknown>;
  if (
    Object.keys(row).length !== keys.length ||
    keys.some(k => !Object.hasOwn(row, k))
  )
    fail(label);
  return row;
}
function text(value: unknown, label: string, max = 64): string {
  if (
    typeof value !== "string" ||
    !value ||
    value.length > max ||
    value.trim() !== value ||
    /[\u0000-\u001f\u007f-\u009f]/u.test(value)
  )
    fail(label);
  return value;
}
function bool(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") fail(label);
  return value;
}
function integer(
  value: unknown,
  label: string,
  min = 0,
  max = Number.MAX_SAFE_INTEGER
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  )
    fail(label);
  return value;
}
function array(value: unknown, label: string, max: number, min = 0): unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max)
    fail(label);
  return value;
}
function category(value: unknown): string {
  if (typeof value !== "string" || !Object.hasOwn(categories, value))
    fail("时长分类");
  return `${categories[value]}（${value}）`;
}
function noDuplicates(values: string[], label: string) {
  if (new Set(values).size !== values.length) fail(label);
}
function specialInterval(value: unknown, label: string): FrozenFact {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(label);
  const mode = (value as Record<string, unknown>).mode;
  if (mode === "category") {
    const row = record(value, ["mode", "category"], label);
    return { label, value: `按指定分类：${category(row.category)}` };
  }
  record(value, ["mode"], label);
  if (mode === "exclude") return { label, value: "不计入" };
  if (mode === "manual") return { label, value: "人工认定" };
  return fail(label);
}
export function timePolicyFacts(value: unknown): FrozenFact[] {
  const row = record(
    value,
    [
      "defaultCategory",
      "roleMappings",
      "allowSplit",
      "specialIntervals",
      "rounding",
      "evidence",
      "manualAdjustment"
    ],
    "时长政策定义"
  );
  const roles = array(row.roleMappings, "身份分类映射", 64).map(value => {
    const role = record(
      value,
      ["attendanceRoleCode", "category"],
      "身份分类映射"
    );
    return {
      code: text(role.attendanceRoleCode, "考勤身份"),
      category: category(role.category)
    };
  });
  noDuplicates(
    roles.map(r => r.code),
    "重复考勤身份"
  );
  const intervals = record(
    row.specialIntervals,
    ["preparation", "duty", "travel"],
    "特殊时段"
  );
  const rounding = record(row.rounding, ["mode", "quantumSeconds"], "舍入规则");
  if (rounding.mode !== "floor") fail("舍入方向");
  const quantum = integer(rounding.quantumSeconds, "舍入单位", 1, 3600);
  const evidence = record(
    row.evidence,
    ["requiredSources", "requireManualRecognition"],
    "证据要求"
  );
  const sources = array(evidence.requiredSources, "证据来源", 3).map(value => {
    if (typeof value !== "string" || !Object.hasOwn(evidenceLabels, value))
      fail("证据来源");
    return value;
  });
  noDuplicates(sources, "重复证据来源");
  const requireManual = bool(evidence.requireManualRecognition, "人工认定要求");
  const adjustment = row.manualAdjustment;
  if (
    !adjustment ||
    typeof adjustment !== "object" ||
    Array.isArray(adjustment)
  )
    fail("人工调整");
  const enabled = bool(
    (adjustment as Record<string, unknown>).enabled,
    "人工调整开关"
  );
  let manualFacts: FrozenFact[];
  if (enabled) {
    const a = record(
      adjustment,
      ["enabled", "reasonRequired", "evidenceRequired"],
      "人工调整"
    );
    if (a.reasonRequired !== true) fail("调整原因要求");
    manualFacts = [
      { label: "是否允许", value: "允许" },
      { label: "调整原因", value: "必须填写" },
      {
        label: "调整证据",
        value: bool(a.evidenceRequired, "调整证据要求")
          ? "必须提供"
          : "不强制提供"
      }
    ];
  } else {
    record(adjustment, ["enabled"], "人工调整");
    const hasManual = Object.values(intervals).some(
      v =>
        v !== null &&
        typeof v === "object" &&
        (v as Record<string, unknown>).mode === "manual"
    );
    if (requireManual || hasManual) fail("人工认定与调整配置");
    manualFacts = [{ label: "是否允许", value: "不允许" }];
  }
  return [
    { label: "默认时长分类", value: category(row.defaultCategory) },
    {
      label: "身份分类映射",
      children: roles.length
        ? roles.map(r => ({ label: `考勤身份 ${r.code}`, value: r.category }))
        : [{ label: "映射", value: "无单独映射，使用默认分类" }]
    },
    {
      label: "允许拆分",
      value: bool(row.allowSplit, "拆分规则") ? "允许" : "不允许"
    },
    {
      label: "特殊时段",
      children: [
        specialInterval(intervals.preparation, "准备时段"),
        specialInterval(intervals.duty, "值勤时段"),
        specialInterval(intervals.travel, "路途时段")
      ]
    },
    { label: "舍入规则", value: `按 ${quantum} 秒向下取整` },
    {
      label: "证据要求",
      children: [
        {
          label: "必须提供的来源",
          value: sources.length
            ? sources.map(s => evidenceLabels[s]).join("、")
            : "无强制来源"
        },
        { label: "需要人工认定", value: requireManual ? "是" : "否" }
      ]
    },
    { label: "人工调整", children: manualFacts }
  ];
}
function contributionResult(value: unknown): {
  points: string;
  explanation: string;
} {
  const row = record(
    value,
    ["recognizedPoints", "explanationCode"],
    "贡献结果"
  );
  if (
    typeof row.recognizedPoints !== "string" ||
    !/^(?:0|[1-9][0-9]{0,2})\.[0-9]{2}$/u.test(row.recognizedPoints)
  )
    fail("贡献积分");
  const explanation = text(row.explanationCode, "解释码");
  if (!/^[a-z][a-z0-9_.-]{0,63}$/u.test(explanation)) fail("解释码");
  return { points: row.recognizedPoints, explanation };
}
function resultFacts(result: {
  points: string;
  explanation: string;
}): FrozenFact[] {
  return [
    { label: "认定积分", value: result.points },
    { label: "解释码", value: result.explanation }
  ];
}
export function contributionPolicyFacts(value: unknown): FrozenFact[] {
  const row = record(value, ["defaultResult", "roleRules"], "贡献政策定义");
  const fallback = contributionResult(row.defaultResult);
  const roleCodes: string[] = [];
  const roles = array(row.roleRules, "贡献身份规则", 64).map(value => {
    const role = record(
      value,
      ["attendanceRoleCode", "categoryRules"],
      "贡献身份规则"
    );
    const code = text(role.attendanceRoleCode, "考勤身份");
    roleCodes.push(code);
    const categoryCodes: string[] = [];
    const rules = array(role.categoryRules, "时长分类规则", 4).map(value => {
      const rule = record(
        value,
        ["timeCategoryCode", "durationBands"],
        "时长分类规则"
      );
      const label = category(rule.timeCategoryCode);
      categoryCodes.push(String(rule.timeCategoryCode));
      const bands = array(rule.durationBands, "时长档位", 16, 1);
      let previous = -1;
      const facts = bands.map((value, index) => {
        const band = record(
          value,
          ["maxSecondsInclusive", "recognizedPoints", "explanationCode"],
          "时长档位"
        );
        const maximum =
          band.maxSecondsInclusive === null
            ? null
            : integer(band.maxSecondsInclusive, "时长档位上限");
        if (
          (maximum === null) !== (index === bands.length - 1) ||
          (maximum !== null && maximum <= previous)
        )
          fail("时长档位边界");
        const boundary =
          maximum === null
            ? previous < 0
              ? "全部时长，无上限"
              : `超过 ${previous} 秒，无上限`
            : previous < 0
              ? `不超过 ${maximum} 秒（含上限）`
              : `超过 ${previous} 秒，且不超过 ${maximum} 秒（含上限）`;
        if (maximum !== null) previous = maximum;
        return {
          label: boundary,
          children: resultFacts(
            contributionResult({
              recognizedPoints: band.recognizedPoints,
              explanationCode: band.explanationCode
            })
          )
        };
      });
      return { label, children: facts };
    });
    noDuplicates(categoryCodes, "重复时长分类");
    return {
      label: `考勤身份 ${code}`,
      children: rules.length
        ? rules
        : [{ label: "分类规则", value: "无单独分类规则，使用默认结果" }]
    };
  });
  noDuplicates(roleCodes, "重复贡献身份");
  return [
    { label: "默认结果", children: resultFacts(fallback) },
    {
      label: "身份和时长规则",
      children: roles.length
        ? roles
        : [{ label: "身份规则", value: "无单独身份规则，使用默认结果" }]
    }
  ];
}
