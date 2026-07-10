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
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
};
export type CreateTeamJoinCycleBody = { year: number; name: string };
export type UpdateTeamJoinCycleBody = { statusCode?: string; name?: string };

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
