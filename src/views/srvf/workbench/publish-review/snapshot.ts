/** Read-only coverage of ea4a3579 proposal fields. Unknown/complex facts never disappear into approval. */
import type { PolicyFacts } from "./policy-binding";
export type FrozenFact = {
  label: string;
  value?: string;
  children?: FrozenFact[];
};
type Shape = string | { [key: string]: Shape } | Shape[];
const activity: Shape = {
  title: "活动标题|s",
  activityTypeCode: "活动类型|s",
  allocationModeCode: "名额分配|s",
  organizationId: "承办组织标识|s",
  startAt: "开始时间|s",
  endAt: "结束时间|s",
  location: "主地点|s",
  description: "活动说明|s?",
  capacity: "人数上限|n?",
  genderRequirementCode: "性别要求|s?",
  registrationDeadline: "报名截止|s?",
  registrationNotes: "参与准备|s?",
  isPublicRegistration: "公开报名|b",
  requiresInsurance: "需要保险|b",
  registrationSchema: "旧报名定义|none",
  coverImageUrl: "历史封面|none",
  galleryImageUrls: "历史相册|none",
  content: "活动内容定义|none",
  locationLongitude: "经度|s?",
  locationLatitude: "纬度|s?",
  registrationModeCode: "报名方式|s?",
  visibilityCode: "可见范围|s?",
  defaultCheckInRadiusMeters: "默认签到半径（米）|n?",
  defaultLocationRequired: "默认要求定位|b?",
  archiveWaitingDays: "归档等待（天）|n"
};
const position: Shape = {
  positionId: "岗位标识|s?",
  clientRef: "岗位临时引用|s?",
  code: "岗位代码|s",
  name: "岗位名称|s",
  attendanceRoleCode: "考勤身份|s",
  capacity: "人数上限|n?",
  startAt: "岗位开始|s?",
  endAt: "岗位结束|s?",
  genderRequirementCode: "性别要求|s?",
  qualificationRuleSetId: "资格规则引用|none",
  locationRequired: "要求定位|b?",
  radiusMeters: "定位半径（米）|n?",
  leaderMemberId: "负责人标识|s?",
  description: "岗位说明|s?",
  equipmentNotes: "装备准备|s?",
  sortOrder: "排序|n",
  cancelled: "已取消|b"
};
const session: Shape = {
  sessionId: "场次标识|s?",
  clientRef: "场次临时引用|s?",
  code: "场次代码|s",
  name: "场次名称|s",
  startAt: "场次开始|s",
  endAt: "场次结束|s",
  locationText: "场次地点|s",
  meetingPoint: "集合点|s?",
  executionPoint: "执行点|s?",
  evacuationPoint: "撤离点|s?",
  longitude: "经度|s?",
  latitude: "纬度|s?",
  capacity: "人数上限|n?",
  checkInOpenAt: "签到开放|s",
  checkInCloseAt: "签到截止|s",
  checkOutOpenAt: "签退开放|s",
  checkOutCloseAt: "签退截止|s",
  preparationStartAt: "准备开始|s?",
  locationRequired: "要求定位|b",
  radiusMeters: "定位半径（米）|n?",
  locationPolicySourceCode: "定位规则来源|s",
  accuracyWarningMeters: "定位误差提示阈值（米）|n",
  lateGraceMinutes: "迟到宽限（分钟）|n",
  earlyLeaveThresholdMinutes: "早退阈值（分钟）|n",
  statusCode: "场次状态|s",
  sortOrder: "排序|n",
  positions: [position]
};
const resolved = (value: string): Shape => ({
  value: `最终值|${value}`,
  source: "取值来源|s"
});
const resolvedSession: Shape = {
  sessionId: "场次标识|s?",
  code: "场次代码|s",
  statusCode: "场次状态|s",
  locationRequired: "要求定位|b",
  radiusMeters: "定位半径（米）|n?",
  locationPolicySourceCode: "定位规则来源|s",
  checkInOpenAt: "签到开放|s",
  checkInCloseAt: "签到截止|s",
  checkOutOpenAt: "签退开放|s",
  checkOutCloseAt: "签退截止|s",
  lateGraceMinutes: "迟到宽限（分钟）|n",
  earlyLeaveThresholdMinutes: "早退阈值（分钟）|n",
  resolution: {
    locationRequired: resolved("b"),
    radiusMeters: resolved("n?"),
    checkInOpenAt: resolved("s"),
    checkInCloseAt: resolved("s"),
    checkOutOpenAt: resolved("s"),
    checkOutCloseAt: resolved("s"),
    lateGraceMinutes: resolved("n"),
    earlyLeaveThresholdMinutes: resolved("n")
  },
  positions: [
    {
      positionId: "岗位标识|s?",
      code: "岗位代码|s",
      cancelled: "已取消|b",
      locationRequired: "要求定位|b",
      radiusMeters: "定位半径（米）|n?",
      locationPolicySourceCode: "定位规则来源|s",
      resolution: {
        locationRequired: resolved("b"),
        radiusMeters: resolved("n?")
      }
    }
  ]
};
const place: Shape = {
  id: "地点标识|s",
  sessionId: "所属场次|s?",
  roleCode: "地点用途|s",
  name: "地点名称|s",
  addressText: "地址|s",
  instruction: "地点说明|s?",
  longitude: "经度|s?",
  latitude: "纬度|s?",
  coordinateSystemCode: "坐标系|s?",
  providerCode: "地图来源|s?",
  providerPlaceId: "地图地点标识|s?",
  visibilityCode: "可见范围|s",
  checkInEligible: "可用于签到|b",
  radiusMeters: "签到半径（米）|n?",
  sourcePresetId: "来源预设标识|s?",
  workflowRevision: "地点修订|n"
};
const resolution: Shape = {
  templateVersionId: "解析模板版本标识|s?",
  activity: {
    registrationModeCode: resolved("s"),
    locationRequired: resolved("b"),
    checkInRadiusMeters: resolved("n"),
    archiveWaitingDays: resolved("n")
  },
  sessions: [resolvedSession]
};
const target: Record<string, Shape> = {
  templateVersionId: "解析模板版本标识|s?",
  resolvedConfig: resolution,
  activity,
  sessions: [session],
  registrationForm: "报名表单|none",
  qualificationRuleSets: { ruleSets: "资格规则|empty" },
  categoryCode: "活动类别|s?",
  plannedSemanticAssignments: "语义分类|empty",
  selectedTemplateVersionId: "原选择模板版本标识|s?",
  activityPlaces: [place],
  contentVisibilitySummary: {
    visibilityCode: "可见范围|s?",
    isPublicRegistration: "公开报名|b"
  },
  metricRequirementCode: "指标要求|s?",
  metricSelectionRevision: "指标选择修订|n",
  metricSetPointer: "指标集合|none",
  timePolicyPointers: "时长政策|time",
  contributionPolicyPointers: "贡献政策|contribution"
};
const labels: Record<string, string> = {
  activity: "活动事实",
  sessions: "场次与岗位",
  positions: "岗位",
  resolvedConfig: "冻结的解析规则及来源",
  resolution: "解析来源",
  base: "提审时的冻结原基线（不是当前草稿）",
  activityPlaces: "地点使用安排",
  qualificationRuleSets: "资格规则",
  contentVisibilitySummary: "内容可见性",
  registrationModeCode: "报名方式",
  locationRequired: "定位要求",
  checkInRadiusMeters: "签到半径",
  archiveWaitingDays: "归档等待",
  radiusMeters: "定位半径",
  checkInOpenAt: "签到开放",
  checkInCloseAt: "签到截止",
  checkOutOpenAt: "签退开放",
  checkOutCloseAt: "签退截止",
  lateGraceMinutes: "迟到宽限",
  earlyLeaveThresholdMinutes: "早退阈值"
};
export const frozenValueLabels: Record<string, string> = {
  first_come: "先到先得",
  qualification_rank: "资格排序",
  lottery: "抽签",
  template: "模板",
  activity: "活动设置",
  "system-default": "系统默认",
  session: "场次设置",
  position: "岗位设置",
  not_required: "不要求",
  required: "要求",
  scheduled: "已排期",
  cancelled: "已取消",
  training: "培训",
  volunteer: "志愿服务",
  public: "公开",
  accepted: "已录取人员",
  staff: "工作人员",
  command: "指挥人员",
  primary: "主地点",
  meeting: "集合点",
  execution: "执行点",
  evacuation: "撤离点",
  parking: "停车点",
  other: "其他"
};
export function objectValue(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function render(
  value: unknown,
  shape: Shape,
  key: string,
  path: string,
  issues: string[],
  policies?: PolicyFacts
): FrozenFact {
  const label =
    typeof shape === "string" ? shape.split("|")[0] : (labels[key] ?? key);
  const invalid = (why: string): FrozenFact => {
    issues.push(`${path}：${why}`);
    return { label, value: why };
  };
  if (typeof shape === "string") {
    const type = shape.split("|")[1];
    if (value === undefined) return invalid("缺少冻结字段");
    if (type === "time" || type === "contribution") {
      if (value === null) return { label, value: "未设置" };
      const side = path.startsWith("冻结申请.base.") ? "base" : "target";
      const facts = policies?.[side][type];
      return facts?.length
        ? { label, children: facts }
        : invalid("引用政策尚未完整核对，不能通过");
    }
    if (type === "none")
      return value === null
        ? { label, value: "未设置" }
        : invalid("含未支持的专业内容，未完整展开");
    if (type === "empty")
      return Array.isArray(value) && value.length === 0
        ? { label, value: "无" }
        : invalid("含未支持的专业内容，未完整展开");
    if (value === null && type.endsWith("?")) return { label, value: "未设置" };
    if (
      (type.startsWith("s") && typeof value !== "string") ||
      (type.startsWith("n") &&
        (typeof value !== "number" || !Number.isFinite(value))) ||
      (type.startsWith("b") && typeof value !== "boolean")
    )
      return invalid("冻结字段类型不受支持");
    const text =
      typeof value === "boolean" ? (value ? "是" : "否") : String(value);
    const date =
      typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)
        ? Date.parse(value)
        : NaN;
    if (Number.isFinite(date))
      return {
        label,
        value:
          new Intl.DateTimeFormat("zh-CN", {
            timeZone: "Asia/Shanghai",
            dateStyle: "medium",
            timeStyle: "short",
            hour12: false
          }).format(date) + "（北京时间）"
      };
    return {
      label,
      value: frozenValueLabels[text]
        ? `${frozenValueLabels[text]}（${text}）`
        : text || "空文本"
    };
  }
  if (Array.isArray(shape)) {
    if (!Array.isArray(value)) return invalid("缺少有效冻结集合");
    return {
      label,
      children: value.length
        ? value.map((entry, i) => ({
            ...render(
              entry,
              shape[0],
              key,
              `${path}[${i + 1}]`,
              issues,
              policies
            ),
            label: `第 ${i + 1} 项`
          }))
        : [{ label: "内容", value: "无" }]
    };
  }
  if (!objectValue(value)) return invalid("缺少有效冻结内容");
  const children = Object.entries(shape).map(([name, child]) =>
    render(value[name], child, name, `${path}.${name}`, issues, policies)
  );
  for (const name of Object.keys(value))
    if (!Object.hasOwn(shape, name))
      children.push(invalid(`未支持字段 ${name}，未完整展开`));
  return { label, children };
}
export function frozenProjection(
  snapshot: Record<string, unknown>,
  policies?: PolicyFacts
) {
  const issues: string[] = [];
  const version = snapshot.schemaVersion;
  if (![7, 8, 9].includes(Number(version)) || typeof version !== "number") {
    issues.push("本页仅支持 V7–V9 冻结内容的完整核对。");
    return {
      issues,
      sections: [
        {
          label: "冻结内容格式",
          value:
            "历史或未知格式尚未展开，不能在本页通过；可按权限写明原因退回。"
        }
      ]
    };
  }
  const schema: Record<string, Shape> = {
    schemaVersion: "冻结内容格式版本|n",
    baseWorkflowRevision: "冻结基线修订|n",
    baseSnapshotHash: "冻结基线校验值|s",
    snapshotHash: "冻结申请校验值|s",
    base: target,
    ...target
  };
  // Flags differ by persisted schema version; their presence is not a trusted simple-source marker.
  if (version === 7 || version === 9 || "metricSelectionExplicit" in snapshot)
    schema.metricSelectionExplicit = "显式选择指标|b";
  if (
    version === 8 ||
    version === 9 ||
    "timePolicySelectionExplicit" in snapshot
  )
    schema.timePolicySelectionExplicit = "显式选择时长政策|b";
  if (version === 9 || "contributionPolicySelectionExplicit" in snapshot)
    schema.contributionPolicySelectionExplicit = "显式选择贡献政策|b";
  const result = render(
    snapshot,
    schema,
    "snapshot",
    "冻结申请",
    issues,
    policies
  );
  // Put the actual target first; technical identities and the original baseline remain inspectable.
  const sections = result.children ?? [];
  const order = ["活动事实", "场次与岗位", "地点使用安排"];
  const rank = (label: string) =>
    order.includes(label) ? order.indexOf(label) : order.length;
  sections.sort((a, b) => rank(a.label) - rank(b.label));
  return { sections, issues };
}
