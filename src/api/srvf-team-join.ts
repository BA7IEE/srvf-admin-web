import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/* ============================ 入队轮 cycle ============================ */

/** 入队轮（后端 `TeamJoinCycleResponseDto`）。statusCode = open/closed。 */
export type TeamJoinCycle = {
  id: string;
  year: number;
  name: string;
  statusCode: string;
  /**
   * 本轮最终入队是否要求保险。
   *
   * ⚠️ **这个开关不是自己生效的**：只有后端的保险总闸（单一 enforcement gate）
   * 开启后它才真正校验；总闸关着时它只是**配置与回显**，不查保险也不产生凭据。
   * 所以界面上不能说成「开了就一定会拦」，得说清依赖总闸——否则运营会以为已经拦上了。
   */
  requiresInsurance: boolean;
  openedAt: string | null;
  closedAt: string | null;
  /**
   * 本轮开放候选部门（最多 64 项）。
   * **null / 空数组 = 全部 ACTIVE 部门**，不是「一个都不开放」——
   * 这个语义反直觉，界面要显式写出来。
   */
  openOrganizationIds: string[] | null;
  /** 每人可报候选部门数上限；null = 走后端默认 2。 */
  maxTargetOrgs: number | null;
  createdAt: string;
};
export type CreateTeamJoinCycleBody = {
  year: number;
  name: string;
  requiresInsurance?: boolean;
  openOrganizationIds?: string[];
  maxTargetOrgs?: number;
};
export type UpdateTeamJoinCycleBody = {
  statusCode?: string;
  name?: string;
  requiresInsurance?: boolean;
  openOrganizationIds?: string[];
  maxTargetOrgs?: number;
};

/** 开放部门数量上限（后端 `@ArrayMaxSize(64)`）。 */
export const TJ_MAX_OPEN_ORGS = 64;
/** 每人可报部门数的取值范围（后端默认 2）。 */
export const TJ_MAX_TARGET_ORGS_RANGE = { min: 1, max: 2, default: 2 };

export type TjCycleListResult = Envelope<PageResult<TeamJoinCycle>>;
export type TjCycleResult = Envelope<TeamJoinCycle>;

/** 入队轮分页列表 `GET /api/admin/v1/team-join/cycles`（rbac: `team-join-cycle.read.record`）。 */
export const getTeamJoinCycles = (params?: {
  page?: number;
  pageSize?: number;
}) =>
  http.request<TjCycleListResult>("get", "/api/admin/v1/team-join/cycles", {
    params
  });

/** 入队轮详情 `GET .../team-join/cycles/{id}`（rbac: `team-join-cycle.read.record`）。 */
export const getTeamJoinCycle = (id: string) =>
  http.request<TjCycleResult>("get", `/api/admin/v1/team-join/cycles/${id}`);

/** 创建入队轮 `POST .../team-join/cycles`（rbac: `team-join-cycle.create.record`；默认 closed）。 */
export const createTeamJoinCycle = (body: CreateTeamJoinCycleBody) =>
  http.request<TjCycleResult>("post", "/api/admin/v1/team-join/cycles", {
    data: body
  });

/** 更新入队轮 `PATCH .../team-join/cycles/{id}`（rbac: `team-join-cycle.update.record`；开/关轮、轮次名）。 */
export const updateTeamJoinCycle = (
  id: string,
  body: UpdateTeamJoinCycleBody
) =>
  http.request<TjCycleResult>("patch", `/api/admin/v1/team-join/cycles/${id}`, {
    data: body
  });

/* ============================ 入队申请 application ============================ */

/** 单 gate 实况（后端 `GateStatusDto`）。 */
export type GateStatus = {
  code: string;
  professional: boolean;
  marked: boolean;
  passed: boolean | null;
  satisfied: boolean;
  completionDate: string | null;
  extendedUntil: string | null;
};

/** 入队申请（后端 `TeamJoinApplicationAdminDto`；含 gates 实况 + 实时贡献值汇总）。 */
export type TeamJoinApplication = {
  id: string;
  cycleId: string;
  memberId: string;
  memberNo: string | null;
  memberDisplayName: string | null;
  statusCode: string;
  targetOrganizationIds: string[];
  selectedOrganizationId: string | null;
  gates: GateStatus[];
  generalGatesSatisfied: boolean;
  contributionPoints: string | null;
  contributionSatisfied: boolean | null;
  evaluationNote: string | null;
  evaluatedAt: string | null;
  evaluationExtendedUntil: string | null;
  eliminationStage: string | null;
  joinedAt: string | null;
  createdAt: string;
};

export type TjApplicationListQuery = {
  page?: number;
  pageSize?: number;
  cycleId?: string;
  statusCode?: string;
};
export type TjApplicationListResult = Envelope<PageResult<TeamJoinApplication>>;
export type TjApplicationResult = Envelope<TeamJoinApplication>;

/** 入队申请分页列表 `GET .../team-join/applications`（rbac: `team-join-application.read.record`；按 cycleId/statusCode 过滤；贡献值列表不算）。 */
export const getTeamJoinApplications = (params?: TjApplicationListQuery) =>
  http.request<TjApplicationListResult>(
    "get",
    "/api/admin/v1/team-join/applications",
    { params }
  );

/** 入队申请详情 `GET .../team-join/applications/{id}`（rbac: `team-join-application.read.record`；含各 gate 实况 + 实时贡献值汇总）。 */
export const getTeamJoinApplication = (id: string) =>
  http.request<TjApplicationResult>(
    "get",
    `/api/admin/v1/team-join/applications/${id}`
  );

/** 标 gate 入参（后端 `MarkGateDto`；completionDate 北京日历日 YYYY-MM-DD；extendedUntil 仅 dept-assessment 延长期）。 */
export type MarkGateBody = {
  gateCode: string;
  passed: boolean;
  completionDate: string;
  extendedUntil?: string;
};
/** 标 gate `PATCH .../applications/{id}/gates`（rbac: `team-join-application.mark.gate`；幂等；仅 joining/pending_evaluation；末次 8 通用全过 + 贡献值≥5 自动→待综合评估）。 */
export const markGate = (id: string, body: MarkGateBody) =>
  http.request<TjApplicationResult>(
    "patch",
    `/api/admin/v1/team-join/applications/${id}/gates`,
    { data: body }
  );

/** 综合评估入参（后端 `EvaluateTeamJoinApplicationDto`）。 */
export type EvaluateTjBody = {
  approved: boolean;
  note?: string;
  evaluationExtendedUntil?: string;
};
/** 综合评估/淘汰 `POST .../applications/{id}/evaluate`（rbac: `team-join-application.evaluate.assessment`；pending_evaluation 通过→待入队/不通过→未通过）。 */
export const evaluateTeamJoinApplication = (id: string, body: EvaluateTjBody) =>
  http.request<TjApplicationResult>(
    "post",
    `/api/admin/v1/team-join/applications/${id}/evaluate`,
    { data: body }
  );

/** 一键入队入参（后端 `JoinTeamJoinApplicationDto`；从候选部门选定单一 organizationId）。 */
export type JoinTeamBody = { organizationId: string };
/** 一键入队 `POST .../applications/{id}/join`（rbac: `team-join-application.join.member`；approved 态 → 单事务设部门+级别 level-1 → joined；专业队需对应 gate 过）。 */
export const joinTeam = (id: string, body: JoinTeamBody) =>
  http.request<TjApplicationResult>(
    "post",
    `/api/admin/v1/team-join/applications/${id}/join`,
    { data: body }
  );

/* ===================== 展示常量(镜像后端 team-join.constants;状态/gate 非字典驱动) ===================== */

export const TJ_CYCLE_STATUS_LABEL: Record<string, string> = {
  open: "开放中",
  closed: "已关闭"
};

/** 入队申请状态码 → 中文（后端 APP_STATUS_*）。 */
export const TJ_APP_STATUS_LABEL: Record<string, string> = {
  joining: "考核中",
  pending_evaluation: "待综合评定",
  approved: "综合评定通过(待入队)",
  joined: "已入队",
  rejected: "已拒"
};
export const TJ_APP_STATUS_TAG: Record<
  string,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  joining: "warning",
  pending_evaluation: "warning",
  approved: "primary",
  joined: "success",
  rejected: "danger"
};

/** gate 码（后端 GENERAL_GATE_CODES 8 + SPECIALTY 4）+ 中文。 */
export const GENERAL_GATE_CODES = [
  "fitness",
  "first-aid-training",
  "military",
  "psych",
  "interview",
  "dept-assessment",
  "entry-exam",
  "intermediate-outdoor"
] as const;
export const SPECIALTY_GATE_CODES = [
  "team-water",
  "team-urban",
  "team-mountain",
  "team-high"
] as const;
export const GATE_CODES = [...GENERAL_GATE_CODES, ...SPECIALTY_GATE_CODES];
export const GATE_LABEL: Record<string, string> = {
  fitness: "基础体能",
  "first-aid-training": "初级救援培训",
  military: "军训(2天2夜)",
  psych: "心理测试",
  interview: "部门面试",
  "dept-assessment": "部门考核",
  "entry-exam": "入队普考",
  "intermediate-outdoor": "中级户外资质",
  "team-water": "水域救援队",
  "team-urban": "城市搜救队",
  "team-mountain": "山地救援队",
  "team-high": "高空救援队"
};

/**
 * 入队域错误码人话（三段式）。
 *
 * `26031` 是**最终入队**这一步才会撞上的保险闸：这个人在入队当天没有任何被认可的
 * 保险来源（本人自购且已核验 / 队内统一保单覆盖）。文案要说清「查的是入队日那天」，
 * 否则会有人去补一份明天才起保的保单然后纳闷为什么还是不行。
 */
export function teamJoinBizErrorMessage(
  error: unknown,
  fallback: string
): string {
  const data = (
    error as { response?: { data?: { code?: unknown; message?: string } } }
  )?.response?.data;
  const code = Number(data?.code);
  if (code === 26031)
    return "这个人在入队当天没有有效保险（26031）：需要本人自购并已核验通过、或已被队内统一保单覆盖，且保障期要覆盖入队当天。请先到队员档案的保险页签确认，再回来办入队";
  if (code === 28242)
    return "选的部门不在本轮开放清单里，或超过了本轮允许的部门数（28242）：请改选本轮开放的部门，数量也要在上限内";
  return data?.message ?? fallback;
}
