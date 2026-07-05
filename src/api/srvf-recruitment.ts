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

/* ===================== 工作台聚合 / 发号预检 / 批量标门槛 / 导出 ===================== */

export type RecruitmentStatsToday = {
  newApplications: number;
  tempNoIssued: number;
  manualProcessed: number;
};
export type RecruitmentStatsPending = {
  manualTotal: number;
  manualNormal: number;
  manualHigh: number;
  manualSystem: number;
  pendingEvaluation: number;
  pendingIssuance: number;
};
export type RecruitmentStatsThresholdItem = {
  thresholdCode: string;
  completedCount: number;
};
export type RecruitmentStatsThreshold = {
  tracking: number;
  byThreshold: RecruitmentStatsThresholdItem[];
};
export type RecruitmentStatsEvaluation = {
  pending: number;
  passed: number;
  eliminated: number;
};
export type RecruitmentStatsIssuance = {
  inPublicity: number;
  oneClickIssuable: number;
  needManualBuild: number;
  promoted: number;
};

/** 招新工作台聚合 stats（后端 `RecruitmentCycleStatsDto`；纯读零写,五组同源业务态计数）。 */
export type RecruitmentCycleStats = {
  cycleId: string;
  cycleYear: number;
  today: RecruitmentStatsToday;
  pending: RecruitmentStatsPending;
  threshold: RecruitmentStatsThreshold;
  evaluation: RecruitmentStatsEvaluation;
  issuance: RecruitmentStatsIssuance;
};

/** 工作台聚合 stats `GET .../cycles/{id}/stats`（rbac: `recruitment-application.read.record`）。 */
export const getCycleStats = (cycleId: string) =>
  http.request<Envelope<RecruitmentCycleStats>>(
    "get",
    `/api/admin/v1/recruitment/cycles/${cycleId}/stats`
  );

/** 六类跳过原因（后端 §8.2；与 `PromotePrecheckRowDto.skipReason` 同源）。 */
export const PROMOTE_SKIP_REASON_LABEL: Record<string, string> = {
  "foreign-manual-build": "外籍需手动建档",
  "openid-already-bound": "openid 已被既有账号占用",
  "missing-openid": "缺 openid,无法建账号",
  "duplicate-openid-in-batch": "openid 本批重复",
  "missing-derived-fields": "缺派生字段(生日/性别等)",
  "special-document": "特殊证件类型需手动建档"
};

export type PromotePrecheckRow = {
  applicationId: string;
  realName: string | null;
  willIssue: boolean;
  skipReason: string | null;
  proposedMemberNo: string | null;
  isForeigner: boolean;
  documentTypeCode: string;
  missingOpenid: boolean;
  openidAlreadyBound: boolean;
  duplicateOpenidInBatch: boolean;
  missingPhone: boolean;
  missingBirthDate: boolean;
  missingGender: boolean;
};

/** 一键发号前预检结果（后端 `PromotePrecheckResultDto`；纯读,与实发结构性同源）。 */
export type PromotePrecheckResult = {
  cycleId: string;
  cycleYear: number;
  rows: PromotePrecheckRow[];
  promotableCount: number;
  skipCount: number;
  total: number;
};

/**
 * 一键发号前预检 `GET .../cycles/{id}/promote-precheck`（rbac: `recruitment-application.promote.member`）。
 * 纯读零写,「预检=实发」结构性保证——UI 应在真正调 `promoteRecruitmentCycle` 前
 * 先调此端点展示逐行可发/跳过原因,而非直接弹通用确认框。
 */
export const getPromotePrecheck = (cycleId: string) =>
  http.request<Envelope<PromotePrecheckResult>>(
    "get",
    `/api/admin/v1/recruitment/cycles/${cycleId}/promote-precheck`
  );

/** 批量标门槛匹配项（后端 `BatchMarkThresholdMatchDto`；tempNo 最精确,或 phone+realName 组合）。 */
export type BatchMarkThresholdMatch = {
  tempNo?: string;
  phone?: string;
  realName?: string;
};

/** 批量标门槛入参（后端 `BatchMarkThresholdDto`）。 */
export type BatchMarkThresholdBody = {
  /** 强烈建议限定轮次去歧义;缺省跨全部未软删报名匹配 */
  cycleId?: string;
  thresholdCode: "patrol1" | "patrol2" | "training" | "redCross" | "bsafe";
  completed: boolean;
  matches: BatchMarkThresholdMatch[];
};

export type BatchMarkThresholdRowResult = {
  index: number;
  status: "marked" | "unmatched" | "failed";
  applicationId: string | null;
  matchedBy: string | null;
  unmatchedReason: "no-match" | "ambiguous" | "insufficient-key" | null;
  errorCode: number | null;
  statusCode: string | null;
  thresholdsComplete: boolean | null;
};

export type BatchMarkThresholdResult = {
  results: BatchMarkThresholdRowResult[];
  total: number;
  marked: number;
  unmatched: number;
  failed: number;
  autoAdvanced: number;
};

/**
 * 批量标门槛 `POST /api/admin/v1/recruitment/applications/batch-mark-threshold`
 * （rbac: `recruitment-application.mark.threshold`）。逐行复用单行 markThreshold,
 * 逐行幂等 + 逐行容错(某行匹配不上/状态非法不整批回滚)。
 */
export const batchMarkThreshold = (body: BatchMarkThresholdBody) =>
  http.request<Envelope<BatchMarkThresholdResult>>(
    "post",
    "/api/admin/v1/recruitment/applications/batch-mark-threshold",
    { data: body }
  );

export type ExportApplicationsFilter =
  | "all"
  | "manual"
  | "verified"
  | "threshold-incomplete"
  | "pending-evaluation"
  | "publicity"
  | "promoted"
  | "rejected";

export const EXPORT_FILTER_LABEL: Record<ExportApplicationsFilter, string> = {
  all: "全部",
  manual: "待人工",
  verified: "已初审",
  "threshold-incomplete": "门槛未完成",
  "pending-evaluation": "待评定",
  publicity: "公示中",
  promoted: "已发号",
  rejected: "已淘汰"
};

/**
 * 批量导出 CSV `POST /api/admin/v1/recruitment/applications/export`
 * （rbac: `recruitment-application.read.record`；持 `read.sensitive` 出明文列,
 * 否则脱敏列;读操作记审计）。响应是 `text/csv` 文件流,非 JSON envelope,
 * 故走 `responseType: "blob"`,调用方负责触发浏览器下载。
 */
export const exportApplications = (body: {
  cycleId?: string;
  filter?: ExportApplicationsFilter;
}) =>
  http.request<Blob>(
    "post",
    "/api/admin/v1/recruitment/applications/export",
    { data: body },
    { responseType: "blob" }
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
