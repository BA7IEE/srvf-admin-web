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
  /**
   * 是否非大陆证件（后端 v0.42 起由旧字段名改名而来；旧名不留文内，保 goal 探针「旧名清零」幂等）。
   * 语义是「证件类型不是大陆身份证，身份需人工核验」，**不等于国籍**——
   * 文案一律用「非大陆证件」，不要写回「外籍」。
   */
  isNonMainlandDocument: boolean;
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
  /**
   * 是否非大陆证件（后端 v0.42 起由旧字段名改名而来；旧名不留文内，保 goal 探针「旧名清零」幂等）。
   * 语义是「证件类型不是大陆身份证，身份需人工核验」，**不等于国籍**——
   * 文案一律用「非大陆证件」，不要写回「外籍」。
   */
  isNonMainlandDocument: boolean;
  genderCode: string | null;
  ageGroup: string | null;
  cityDistrict: string | null;
  verifyOutcome: string | null;
  /**
   * 复核风险级（契约闭集 normal/high/system）——人工队列三栏分流用。
   *
   * ⚠️ **纪律：这是后台内部分诊标签，申请人侧永不暴露。**
   * 任何对外出参（公开进度查询 / 通知短信 / 导出给申请人的材料）都不得带上它，
   * 也不要在给申请人看的文案里转述「你被标为高风险」——这是我们内部排队用的，
   * 不是对申请人的结论。
   */
  riskLevel: string | null;
  /**
   * 后台人工原因分类（契约闭集四值）——同上，内部标签，不对申请人暴露。
   * 空值表示这条不是人工队列里的。
   */
  manualReviewReason: string | null;
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
  /** 人工队列三栏分流（S4b 是 v0.31 就有的能力，前端一直没接）。 */
  riskLevel?: RiskLevel;
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
  /** 仅这三项可手标——redCross/bsafe 由证书申报审核派生，手传 40000（待 P7-4） */
  thresholdCode: (typeof MANUAL_THRESHOLD_CODES)[number];
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

/**
 * 证件照 signed-URL 三图（后端 `IdCardImageUrlResponseDto`）。
 *
 * `url` 恒有；后两张**仅身份证鉴伪版且已入库**才非空，否则 null——
 * 所以切换器要按有无动态显示，不能恒摆三个页签让人点到空图。
 * 三图共用同一个 `expiresAt`。
 */
export type IdCardImageUrl = {
  /** 原图 */
  url: string;
  /** 三图同一过期时刻 */
  expiresAt: string;
  /** 主体框裁剪图（鉴伪版才有） */
  cropImageUrl: string | null;
  /** 头像裁剪图（鉴伪版才有） */
  portraitImageUrl: string | null;
};
/**
 * 取证件照三图短 TTL signed-URL
 * `GET .../applications/{id}/id-card-image-url`（L3，读图记审计）。
 *
 * ⚠️ rbac 是 **`recruitment-application.read.sensitive`**，不是列表那个 `read.record`
 * ——2026-08-01 对 live 契约核实，此前本文件注释写错成读码。按钮必须按敏感码显隐，
 * 否则只有读码的人会看到按钮、点了吃 403。
 */
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
/** 门槛完成分布单项（后端 `RecruitmentStatsThresholdItemDto`；name 是后端已给的中文展示名,不需前端二次查表）。 */
export type RecruitmentStatsThresholdItem = {
  code: string;
  name: string;
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
  /**
   * 已自助撤销数（v0.44 F6 终态）。
   * **独立计数，不进任何待处理桶**——撤销不是待办也不是淘汰，
   * 所以工作台上单独一格显示，不要加进「待处理」的任何一项里。
   */
  withdrawnCount: number;
};

/** 工作台聚合 stats `GET .../cycles/{id}/stats`（rbac: `recruitment-application.read.record`）。 */
export const getCycleStats = (cycleId: string) =>
  http.request<Envelope<RecruitmentCycleStats>>(
    "get",
    `/api/admin/v1/recruitment/cycles/${cycleId}/stats`
  );

/**
 * 发号预检的跳过原因 → 人话（与 live `PromotePrecheckRowDto.skipReason` 逐值对齐）。
 *
 * v0.40 H5 手机通道上线后这套值整体换过一轮:`missing-openid` 停用,
 * 改为 `missing-login-channel`(微信与手机都没有),并新增两个手机相关值。
 * 无微信但有已验证手机的申请人**现在可以直接发号**(建 SMS 登录通道账号),
 * 不再是跳过项。
 */
export const PROMOTE_SKIP_REASON_LABEL: Record<string, string> = {
  "openid-already-bound": "微信号已被其他账号占用",
  "phone-already-bound": "手机号已被其他账号占用",
  "missing-login-channel": "没有微信也没有已验证手机，无法建登录账号",
  "duplicate-openid-in-batch": "同一微信号在本批里重复出现",
  "duplicate-phone-in-batch": "同一手机号在本批里重复出现",
  "missing-derived-field": "缺生日或性别等派生信息，需先补录",
  "incomplete-data": "报名资料不完整，需先补录"
};

export type PromotePrecheckRow = {
  applicationId: string;
  realName: string | null;
  willIssue: boolean;
  skipReason: string | null;
  proposedMemberNo: string | null;
  /**
   * 是否非大陆证件（后端 v0.42 起由旧字段名改名而来；旧名不留文内，保 goal 探针「旧名清零」幂等）。
   * 语义是「证件类型不是大陆身份证，身份需人工核验」，**不等于国籍**——
   * 文案一律用「非大陆证件」，不要写回「外籍」。
   */
  isNonMainlandDocument: boolean;
  documentTypeCode: string;
  missingOpenid: boolean;
  openidAlreadyBound: boolean;
  duplicateOpenidInBatch: boolean;
  /** 手机号已被其他账号占用（v0.40 H5 手机通道新增） */
  phoneAlreadyBound: boolean;
  /** 同一手机号在本批里重复（v0.40 H5 手机通道新增） */
  duplicatePhoneInBatch: boolean;
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
  | "rejected"
  | "withdrawn";

export const EXPORT_FILTER_LABEL: Record<ExportApplicationsFilter, string> = {
  all: "全部",
  manual: "待人工",
  verified: "已初审",
  "threshold-incomplete": "门槛未完成",
  "pending-evaluation": "待评定",
  publicity: "公示中",
  promoted: "已发号",
  rejected: "已淘汰",
  withdrawn: "已撤销报名"
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
  promoted: "已发永久编号",
  /** 申请人自助撤销（v0.44 F6）——是**终态但非淘汰**，不写淘汰阶段，也不进任何待处理桶 */
  withdrawn: "已撤销报名"
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
  promoted: "success",
  withdrawn: "info"
};

/**
 * 五项入队门槛（展示顺序）。
 * 注意：**只有前三项可以手工标记**，见 {@link MANUAL_THRESHOLD_CODES}。
 */
export const THRESHOLD_CODES = [
  "patrol1",
  "patrol2",
  "training",
  "redCross",
  "bsafe"
] as const;

/**
 * 可**手工**标记的门槛（后端 `MarkThresholdDto` 的 enum，2026-08-01 实测核对）。
 *
 * ⚠️ 契约已收紧：急救资质（redCross）与 BSAFE **改成了证书申报审核结论的派生投影**，
 * 手工传这两个 code 后端直接以 40000「门槛 code 非法」拒绝（实测证实）。
 * 所以界面上这两项只读展示，不给开关——给了也是白点。
 *
 * 驱动这两项的「招新证书申报审核」面**待 P7-4**（证书标准库解冻后一步到位建，
 * 不按已被移除的 v0.42 契约重复建设）。在那之前这两项只能看不能改。
 */
export const MANUAL_THRESHOLD_CODES = [
  "patrol1",
  "patrol2",
  "training"
] as const;
export const THRESHOLD_LABEL: Record<string, string> = {
  patrol1: "巡山①",
  patrol2: "巡山②",
  training: "培训",
  redCross: "红十字",
  bsafe: "BSAFE"
};

/* ============================================================================
 * P4-1 · 人工队列三栏 + 改资料 + 单人建档
 * ========================================================================== */

/** 复核风险级（契约闭集；列表可按此过滤，构成人工队列三栏）。 */
export type RiskLevel = "normal" | "high" | "system";

/**
 * 三栏文案。用「系统异常」而不是后端的 `system`——
 * 这一栏是 OCR/核验通道自己出错，不是申请人有问题，文案上要能区分开。
 */
export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  normal: "普通",
  high: "高风险",
  system: "系统异常"
};

export const RISK_LEVEL_TAG: Record<
  RiskLevel,
  "success" | "danger" | "warning"
> = {
  normal: "success",
  high: "danger",
  system: "warning"
};

/**
 * 后台人工原因分类（契约闭集四值）。
 * 每条都说清「是什么情况」，光看 code 名不知道该怎么处理。
 */
export const MANUAL_REVIEW_REASON_LABEL: Record<string, string> = {
  ocr_mismatch_confirmed: "OCR 与填写不符（已确认）",
  forgery_suspected: "疑似伪造证件",
  system_ocr_error: "OCR 系统异常",
  special_document: "特殊证件类型"
};

/** 人工原因四值（做分组筛下拉用，顺序即展示顺序）。 */
export const MANUAL_REVIEW_REASONS = [
  "ocr_mismatch_confirmed",
  "forgery_suspected",
  "system_ocr_error",
  "special_document"
] as const;

/**
 * admin 改报名资料入参（后端 `UpdateRecruitmentApplicationDto`，R1 白名单）。
 *
 * 两类字段的可改条件完全不同，别混着发：
 * - **非身份字段**（detailedAddress / cityDistrict / sourceChannel /
 *   emergencyContacts / profileExtra）恒可改。
 * - **身份字段**（realName / idCardNumber / birthDate / genderCode）只在
 *   `manual_review` 态**或**非大陆证件记录上可改；已 verified 的大陆记录 → `28045`。
 *
 * 另有两条派生权威纪律（传错不是「不生效」而是直接报错）：
 * - 大陆记录的 `birthDate` / `genderCode` **恒由证件号派生**，直接传 → `40000`。
 *   所以大陆记录的这两个输入框必须禁用，不能只是「不填」。
 * - 大陆改 `idCardNumber` 会触发校验位 + 年龄复检（`28010`）+ 重新派生生日性别 +
 *   同轮去重（`28003`）——表单要提前告诉操作者「改号会连带改生日与性别」。
 *
 * `phone` / `openid` **不在白名单**：换绑走申请人自助双验通道，admin 直改会绕过
 * 验证链、破坏 H5 身份锚，所以这里没有这两个字段，也不要加。
 */
export type UpdateApplicationBody = {
  realName?: string;
  idCardNumber?: string;
  birthDate?: string;
  genderCode?: "male" | "female";
  detailedAddress?: string;
  cityDistrict?: string;
  sourceChannel?: string;
  emergencyContacts?: unknown[];
  profileExtra?: Record<string, unknown>;
};

/**
 * admin 改报名资料 `PATCH .../recruitment/applications/{id}`
 * （rbac: `recruitment-application.update.record`）。
 *
 * 后端对 `statusCode + sensitivePurgedAt IS NULL` 走 CAS 写入，命中不为 1 即 `28041`
 * ——也就是说「保存失败」可能是这条刚被发号或刚被留存清理清过，重试无用，要重新拉详情。
 */
export const updateRecruitmentApplication = (
  id: string,
  body: UpdateApplicationBody
) =>
  http.request<ApplicationResult>(
    "patch",
    `/api/admin/v1/recruitment/applications/${id}`,
    { data: body }
  );

/** 单人建档结果（后端 `PromoteSingleResultDto`）。 */
export type PromoteSingleResult = {
  applicationId: string;
  /** 新建 Member id */
  memberId: string;
  /** 永久编号 {YY}{NNN}，与批量发号共享同一原子号段、连续无空洞 */
  memberNo: string;
  realName: string | null;
  /**
   * 登录通道（锚点择优的结果）：openid 未被占用 → 微信；
   * openid 缺/被占且 phone 未占用 → 手机。**这条要回显**——
   * openid 被占时被迫走手机通道，不说清楚没人知道这个人该怎么登录。
   */
  loginChannel: "wechat" | "phone";
};

/**
 * 单人手动建档 `POST .../recruitment/applications/{id}/promote-single`
 * （rbac: `recruitment-application.promote.single`）。
 *
 * 批量发号跳过的行由此收尾。仅 `publicity` 态可建，其他态（含已 promoted 重跑）
 * → `28041` 幂等零重复，不会建出第二个号。
 */
export const promoteSingleApplication = (id: string) =>
  http.request<Envelope<PromoteSingleResult>>(
    "post",
    `/api/admin/v1/recruitment/applications/${id}/promote-single`
  );

/**
 * 招新域错误码人话（三段式：出了什么事 / 为什么 / 怎么办）。
 *
 * 这些码全部对 live `/api/docs-json` 与后端 CHANGELOG 逐条核实过。注意 `28045` 与
 * `40000` 是**两回事**：前者是「这条记录不让你改身份字段」，后者是「大陆记录的生日性别
 * 根本不接受直传」——混成一句会让操作者以为换个记录就能改。
 */
export function recruitmentBizErrorMessage(
  error: unknown,
  fallback: string
): string {
  const data = (
    error as { response?: { data?: { code?: unknown; message?: string } } }
  )?.response?.data;
  const code = Number(data?.code);
  if (code === 28041)
    return "这条报名的状态已经变了（28041）：可能刚被发号，或留存清理已清过敏感信息，此时不能再改。请关掉重新打开这条报名看最新状态";
  if (code === 28003)
    return "同一轮里已经有人用这个证件号报名了（28003）：请核对证件号是否输错，或先处理那条重复报名";
  if (code === 28010)
    return "改完证件号后年龄不在报名范围内（28010）：报名要求 18~60 周岁，请核对证件号是否输错";
  if (code === 28042)
    return "编号或登录账号撞车了（28042）：这次建档已整体回滚、没有留下半个号，请刷新后重试";
  if (code === 28045)
    return "这条记录已经通过证件核验，身份字段不可修改（28045）：姓名、证件号、生日、性别只能在人工复核态或非大陆证件记录上改。确需更正请走人工复核";
  if (code === 28046)
    return "这个人没有可用的登录方式（28046）：微信和手机号都已被别的账号占用，建了号也登不进来。请先让申请人自助换绑微信或手机，再来建档";
  if (code === 28047)
    return "资料还不齐，建不了档（28047）：非大陆证件的记录需要先补齐姓名、出生日期和性别，请先用「修改资料」补录";
  if (code === 19010)
    return "紧急联系人的关系填得不对（19010）：请从关系下拉里选一个，不要手输";
  return data?.message ?? fallback;
}
