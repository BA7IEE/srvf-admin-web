import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/* ============================ 招新轮次 cycle ============================ */

/** 招新轮次（后端 `RecruitmentCycleResponseDto`）。statusCode = open/closed。字段以 `/api/docs-json` 为准。 */
export type RecruitmentCycle = {
  id: string;
  year: number;
  name: string;
  statusCode: string;
  capacity: number | null;
  issuedCount: number;
  meetingInfo: string | null;
  qqGroup: string | null;
  notifyTemplate: string | null;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
};

/** 创建轮次入参（`CreateRecruitmentCycleDto`；默认 closed,需显式开轮）。 */
export type CreateCycleBody = {
  year: number;
  name: string;
  capacity?: number;
};

/** 更新轮次入参（`UpdateRecruitmentCycleDto`；开/关轮 = 改 statusCode；开 open 要求当前无其它 open 轮）。 */
export type UpdateCycleBody = {
  statusCode?: string;
  capacity?: number;
  meetingInfo?: string;
  qqGroup?: string;
  notifyTemplate?: string;
};

export type CycleListResult = Envelope<PageResult<RecruitmentCycle>>;
export type CycleResult = Envelope<RecruitmentCycle>;

/** 招新轮次分页列表 `GET /api/admin/v1/recruitment/cycles`（rbac: `recruitment-cycle.read.record`）。 */
export const getRecruitmentCycles = (params?: {
  page?: number;
  pageSize?: number;
}) =>
  http.request<CycleListResult>("get", "/api/admin/v1/recruitment/cycles", {
    params
  });

/** 招新轮次详情 `GET .../recruitment/cycles/{id}`（rbac: `recruitment-cycle.read.record`）。 */
export const getRecruitmentCycle = (id: string) =>
  http.request<CycleResult>("get", `/api/admin/v1/recruitment/cycles/${id}`);

/** 创建招新轮次 `POST .../recruitment/cycles`（rbac: `recruitment-cycle.create.record`）。 */
export const createRecruitmentCycle = (body: CreateCycleBody) =>
  http.request<CycleResult>("post", "/api/admin/v1/recruitment/cycles", {
    data: body
  });

/** 更新招新轮次 `PATCH .../recruitment/cycles/{id}`（rbac: `recruitment-cycle.update.record`）。 */
export const updateRecruitmentCycle = (id: string, body: UpdateCycleBody) =>
  http.request<CycleResult>("patch", `/api/admin/v1/recruitment/cycles/${id}`, {
    data: body
  });

/* ----------------------- 一键发号 / 公示名单（轮次级） ----------------------- */

export type PromotedItem = {
  applicationId?: string;
  memberNo?: string;
  realName?: string | null;
};
export type PromoteSkippedItem = {
  applicationId?: string;
  realName?: string | null;
  reason?: string;
};
/** 一键发号结果（`PromoteResultDto`）。 */
export type PromoteResult = {
  cycleId: string;
  promotedCount: number;
  skippedCount: number;
  promoted: PromotedItem[];
  skipped: PromoteSkippedItem[];
};

/**
 * 公示结束一键发号 `POST .../recruitment/cycles/{id}/promote`
 * （rbac: `recruitment-application.promote.member`）。
 * 对公示报名按拼音序批量发永久编号 + 建 User+Member（单事务原子/幂等；外籍 skip+report 不 block；空集零发）。
 */
export const promoteRecruitmentCycle = (id: string) =>
  http.request<Envelope<PromoteResult>>(
    "post",
    `/api/admin/v1/recruitment/cycles/${id}/promote`
  );

export type PublicityListItem = {
  applicationId: string;
  realName: string | null;
  proposedMemberNo: string | null;
  isForeigner: boolean;
  needsManualBuild: boolean;
};
/** 公示名单（`PublicityListResponseDto`）。 */
export type PublicityList = {
  cycleId: string;
  cycleYear: number;
  items: PublicityListItem[];
  promotableCount: number;
  manualBuildCount: number;
};

/** 公示名单 `GET .../recruitment/cycles/{id}/publicity-list`（rbac: `recruitment-application.read.record`；姓名+拟发编号,拼音序,零敏感）。 */
export const getPublicityList = (id: string) =>
  http.request<Envelope<PublicityList>>(
    "get",
    `/api/admin/v1/recruitment/cycles/${id}/publicity-list`
  );

/* ============================ 招新报名 application ============================ */

/** 门槛标记（后端 inline object,键为 THRESHOLD_CODES,值 boolean；松类型防御取值）。 */
export type ThresholdMarks = Record<string, boolean> | null;

/** 招新报名（后端 `RecruitmentApplicationAdminDto`）。列表掩码身份证/手机,详情全显（读 PII 记审计）。 */
export type RecruitmentApplication = {
  id: string;
  cycleId: string;
  statusCode: string;
  tempNo: string | null;
  realName: string | null;
  idCardNumber: string | null;
  phone: string | null;
  documentTypeCode: string;
  isForeigner: boolean;
  genderCode: string | null;
  ageGroup: string | null;
  cityDistrict: string | null;
  verifyOutcome: string | null;
  eliminationStage: string | null;
  hasIdCardImage: boolean;
  thresholdMarks: ThresholdMarks;
  thresholdsComplete: boolean;
  evaluationNote: string | null;
  promotedMemberId: string | null;
  needsManualBuild: boolean;
  createdAt: string;
};

export type ApplicationListQuery = {
  page?: number;
  pageSize?: number;
  cycleId?: string;
  statusCode?: string;
};
export type ApplicationListResult = Envelope<
  PageResult<RecruitmentApplication>
>;
export type ApplicationResult = Envelope<RecruitmentApplication>;

/** 招新报名分页列表 `GET .../recruitment/applications`（rbac: `recruitment-application.read.record`；按 cycleId/statusCode 过滤；列表掩码）。 */
export const getRecruitmentApplications = (params?: ApplicationListQuery) =>
  http.request<ApplicationListResult>(
    "get",
    "/api/admin/v1/recruitment/applications",
    { params }
  );

/** 招新报名详情 `GET .../recruitment/applications/{id}`（rbac: `recruitment-application.read.record`；PII 全显,读记审计）。 */
export const getRecruitmentApplication = (id: string) =>
  http.request<ApplicationResult>(
    "get",
    `/api/admin/v1/recruitment/applications/${id}`
  );

/** 标/清门槛入参（`MarkThresholdDto`）。 */
export type MarkThresholdBody = {
  thresholdCode: "patrol1" | "patrol2" | "training" | "redCross" | "bsafe";
  completed: boolean;
};
/** 标/清门槛 `PATCH .../applications/{id}/thresholds`（rbac: `recruitment-application.mark.threshold`；幂等；仅 verified/pending_evaluation；末次完成自动→待综合评定）。 */
export const markThreshold = (id: string, body: MarkThresholdBody) =>
  http.request<ApplicationResult>(
    "patch",
    `/api/admin/v1/recruitment/applications/${id}/thresholds`,
    { data: body }
  );

/** 综合评定/淘汰入参（`EvaluateRecruitmentApplicationDto`）。 */
export type EvaluateBody = { approved: boolean; note?: string };
/** 综合评定/淘汰 `POST .../applications/{id}/evaluate`（rbac: `recruitment-application.evaluate.assessment`；仅 pending_evaluation；通过→公示,不通过→未通过）。 */
export const evaluateApplication = (id: string, body: EvaluateBody) =>
  http.request<ApplicationResult>(
    "post",
    `/api/admin/v1/recruitment/applications/${id}/evaluate`,
    { data: body }
  );

/** 人工 resolve 入参（`ResolveRecruitmentApplicationDto`）。 */
export type ResolveBody = { approved: boolean; reviewNote?: string };
/** 人工 resolve `POST .../applications/{id}/resolve`（rbac: `recruitment-application.resolve.manual`；manual_review/pending_verification 卡死态；approved→发临时编号受容量限）。 */
export const resolveApplication = (id: string, body: ResolveBody) =>
  http.request<ApplicationResult>(
    "post",
    `/api/admin/v1/recruitment/applications/${id}/resolve`,
    { data: body }
  );

export type IdCardImageUrl = { url: string; expiresAt: string };
/** 取证件照短 TTL signed-URL `GET .../applications/{id}/id-card-image-url`（rbac: `recruitment-application.read.record`；L3,读图记审计）。 */
export const getIdCardImageUrl = (id: string) =>
  http.request<Envelope<IdCardImageUrl>>(
    "get",
    `/api/admin/v1/recruitment/applications/${id}/id-card-image-url`
  );

/* ===================== 展示常量(镜像后端 recruitment.constants;状态非字典驱动) ===================== */

/** 轮次状态码 → 中文（后端 CYCLE_STATUS_*）。 */
export const CYCLE_STATUS_LABEL: Record<string, string> = {
  open: "开放中",
  closed: "已关闭"
};

/** 报名状态码 → 中文（后端 APP_STATUS_*；含历史兼容 pending_verification / 卡死态 mismatch）。 */
export const APP_STATUS_LABEL: Record<string, string> = {
  pending_verification: "待核验",
  verified: "已核验(临时编号)",
  manual_review: "人工待核",
  mismatch: "核验不匹配",
  rejected: "未通过",
  pending_evaluation: "待综合评定",
  publicity: "公示中",
  promoted: "已发永久编号"
};

/** 报名状态码 → tag 展示色。 */
export const APP_STATUS_TAG: Record<
  string,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  pending_verification: "info",
  verified: "primary",
  manual_review: "warning",
  mismatch: "danger",
  rejected: "danger",
  pending_evaluation: "warning",
  publicity: "primary",
  promoted: "success"
};

/** 门槛码（后端 THRESHOLD_CODES）+ 中文。 */
export const THRESHOLD_CODES = [
  "patrol1",
  "patrol2",
  "training",
  "redCross",
  "bsafe"
] as const;
export const THRESHOLD_LABEL: Record<string, string> = {
  patrol1: "巡山①",
  patrol2: "巡山②",
  training: "培训",
  redCross: "红十字",
  bsafe: "BSAFE"
};
