import { http } from "@/utils/http";
import type { AccountStatus } from "@/api/srvf-user";

/** 后端统一成功信封（与 @/api/user 的 ApiEnvelope 同形；失败为 HTTP 4xx，axios reject） */
type Envelope<T> = { code: number; message: string; data: T };

/** 后端分页信封（PageResultDto） */
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type MemberStatus = "ACTIVE" | "INACTIVE";

/**
 * 队员（后端 `MemberResponseDto`）。字段以 `/api/docs-json` 为准，勿前端臆造。
 */
export type MemberItem = {
  id: string;
  /** 队员业务唯一编号 */
  memberNo: string;
  /** 称呼 / 显示名 */
  displayName: string;
  /** 等级字典 code（隐含 type code = member_grade），可空 */
  gradeCode: string | null;
  /** 在队 / 离队 */
  status: MemberStatus;
  /** 是否已开通登录账号（队员账号闭环；存在 live 关联 User 即 true，软删/解绑后回落 false） */
  hasAccount: boolean;
  /** 关联账号状态（无关联为 null） */
  accountStatus: AccountStatus | null;
  /** 关联账号 id（无关联为 null） */
  userId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MemberListQuery = {
  page?: number;
  pageSize?: number;
  memberNo?: string;
  gradeCode?: string;
  status?: MemberStatus;
  /** 模糊搜索（契约：跨字段命中 displayName + memberNo，contains + insensitive） */
  q?: string;
  /** 按是否已开通登录账号过滤（队员账号闭环；不传 = 不过滤） */
  hasAccount?: boolean;
};

export type MemberListResult = Envelope<PageResult<MemberItem>>;

/** 队员分页列表 `GET /api/admin/v1/members`（rbac: `member.read.record`） */
export const getMembers = (params?: MemberListQuery) => {
  return http.request<MemberListResult>("get", "/api/admin/v1/members", {
    params
  });
};

export type MemberDetailResult = Envelope<MemberItem>;

/**
 * 队员详情 `GET /api/admin/v1/members/{id}`（rbac: `member.read.record`）。
 * 返回 `MemberResponseDto`，与列表项同 shape（id / memberNo / displayName / gradeCode / status / 时间戳）。
 */
export const getMember = (id: string) =>
  http.request<MemberDetailResult>("get", `/api/admin/v1/members/${id}`);

/* ----------------------------- 队员 写操作 ----------------------------- */

/**
 * 创建队员入参（后端 `CreateMemberDto`；字段以 `/api/docs-json` 为准）。
 * 后端"不接收任何敏感字段"——仅以下三项。
 */
export type CreateMemberBody = {
  /** 业务唯一编号（必填；trim 后保存，保留大小写；字母 / 数字 / 连字符；长度 1-32） */
  memberNo: string;
  /** 称呼 / 显示名（必填；≤ 100） */
  displayName: string;
  /** 等级字典 code（可选；提供时须在 type=member_grade 字典中存在且 ACTIVE；≤ 64） */
  gradeCode?: string;
};

/**
 * 更新队员入参（后端 `UpdateMemberDto`）。
 * 后端 PATCH 白名单**仅** `displayName / gradeCode`；
 * `memberNo / status` 禁改（memberNo 改不了 → 编辑时置灰；status 走 /status 端点）。
 */
export type UpdateMemberBody = {
  displayName?: string;
  gradeCode?: string;
};

export type MemberMutationResult = Envelope<MemberItem>;

/** 创建队员 `POST /api/admin/v1/members`（rbac: `member.create.record`） */
export const createMember = (body: CreateMemberBody) =>
  http.request<MemberMutationResult>("post", "/api/admin/v1/members", {
    data: body
  });

/** 部分更新队员 `PATCH /api/admin/v1/members/{id}`（rbac: `member.update.record`） */
export const updateMember = (id: string, body: UpdateMemberBody) =>
  http.request<MemberMutationResult>("patch", `/api/admin/v1/members/${id}`, {
    data: body
  });

/**
 * 软删队员 `DELETE /api/admin/v1/members/{id}`（rbac: `member.delete.record`）。
 * 后端：有 active 部门归属 / 已绑定 user 则拒绝；非常规离队入口（离队应走 /status）。
 */
export const deleteMember = (id: string) =>
  http.request<Envelope<MemberItem | null>>(
    "delete",
    `/api/admin/v1/members/${id}`
  );

/**
 * 切换队员状态 `PATCH /api/admin/v1/members/{id}/status`（rbac: `member.update.status`）。
 * 入参后端 `UpdateMemberStatusDto`：`{ status: ACTIVE | INACTIVE }`；不自动解除部门归属。
 */
export const updateMemberStatus = (id: string, status: MemberStatus) =>
  http.request<MemberMutationResult>(
    "patch",
    `/api/admin/v1/members/${id}/status`,
    { data: { status } }
  );

/* ----------------------------- 队员账号闭环（开号/绑定/解绑/退号重开/启停） ----------------------------- */

/**
 * 开号 / 退号重开的返回体（后端 `GrantMemberAccountResponseDto`）。
 * `username` 从第 2 次开号起追加代际后缀（如 `M-0001-2`），不影响登录（登录只认手机号）——前端照原样显示。
 */
export type GrantMemberAccountResult = Envelope<{
  userId: string;
  username: string;
  phone: string;
  phoneVerifiedAt: string;
  role: "SUPER_ADMIN" | "ADMIN" | "USER";
  memberId: string;
}>;

/**
 * 开通登录账号 `POST /api/admin/v1/members/{id}/account`（rbac: `member.grant.account`，绑 ops-admin，
 * 与队员管理页其余写码〔biz-admin〕归属不同）。
 * 账号手机验证码登录（复用 login-sms），不设密码；队员已有绑定账号则后端拒绝。
 */
export const grantMemberAccount = (id: string, phone: string) =>
  http.request<GrantMemberAccountResult>(
    "post",
    `/api/admin/v1/members/${id}/account`,
    { data: { phone } }
  );

/**
 * 绑定既有悬空账号 `POST /api/admin/v1/members/{id}/account/bind`（rbac: `member.bind.account`，绑 ops-admin）。
 * `userId` 须是 live 且当前未绑定队员的账号；账号保留原登录方式（不强制手机号）。
 */
export const bindMemberAccount = (id: string, userId: string) =>
  http.request<MemberMutationResult>(
    "post",
    `/api/admin/v1/members/${id}/account/bind`,
    { data: { userId } }
  );

/**
 * 解绑账号 `POST /api/admin/v1/members/{id}/account/unbind`（rbac: `member.bind.account`）。
 * 只断链，账号回落为悬空 ACTIVE——不顺手停用/删除。
 */
export const unbindMemberAccount = (id: string) =>
  http.request<MemberMutationResult>(
    "post",
    `/api/admin/v1/members/${id}/account/unbind`
  );

/**
 * 退号重开 `POST /api/admin/v1/members/{id}/account/reopen`（rbac: `member.grant.account`）。
 * 软删旧号 + 用新手机号开新号，单事务原子；新手机号须与旧号不同（同号后端报 `PHONE_ALREADY_BOUND`）。
 */
export const reopenMemberAccount = (id: string, phone: string) =>
  http.request<GrantMemberAccountResult>(
    "post",
    `/api/admin/v1/members/${id}/account/reopen`,
    { data: { phone } }
  );

/**
 * 队员面启用 / 停用关联账号 `PATCH /api/admin/v1/members/{id}/account/status`（rbac: `user.update.status`，
 * 复用既有用户管理码）。禁止管理员对自己绑定的账号操作（后端 `CANNOT_OPERATE_SELF`）；
 * 置 DISABLED 时联动撤销该账号全部未过期 refresh token。
 */
export const updateMemberAccountStatus = (id: string, status: AccountStatus) =>
  http.request<MemberMutationResult>(
    "patch",
    `/api/admin/v1/members/${id}/account/status`,
    { data: { status } }
  );

/** 批量开号单条入参（后端 `BulkGrantAccountItemDto`） */
export type BulkGrantAccountItem = { memberId: string; phone: string };

/** 批量开号单条结果（后端 `BulkGrantAccountResultItemDto`）。userId/reason 恒回显两键，不适用为 null。 */
export type BulkGrantAccountResultItem = {
  memberId: string;
  status: "ok" | "blocked";
  userId: string | null;
  reason: string | null;
};

export type BulkGrantMemberAccountsResult = Envelope<{
  items: BulkGrantAccountResultItem[];
  summary: { total: number; ok: number; blocked: number };
}>;

/**
 * 批量开号 `POST /api/admin/v1/members/accounts/bulk-grant`（rbac: `member.grant.account`，复用，0 新码）。
 * 1-200 条；逐行 skip-on-error，单行失败不影响其余行。
 */
export const bulkGrantMemberAccounts = (items: BulkGrantAccountItem[]) =>
  http.request<BulkGrantMemberAccountsResult>(
    "post",
    "/api/admin/v1/members/accounts/bulk-grant",
    { data: { items } }
  );

/* ============================ 一键离队 ============================ */

/** 活动闭环状态（`closed` = 历史责任已闭环）。 */
export type MemberOffboardActivityClosure = { status: string };

/** 离队预检里的一条活动责任。 */
export type MemberOffboardActivityImpactItem = {
  activityId: string;
  title: string;
  statusCode: string;
  closure: MemberOffboardActivityClosure;
  /** 该队员在这个活动里的责任类型（契约闭集）。三个数组本身已按此分段，故一般不必逐行再显示。 */
  responsibilityType: "initiator" | "owner" | "collaborator";
};

/** 离队预检里的一条报名。 */
export type MemberOffboardRegistrationImpactItem = {
  activityId: string;
  title: string;
  statusCode: string;
  closure: MemberOffboardActivityClosure;
  registrationId: string;
  /** 契约闭集——只有这三态会进预检（cancelled/reject 不构成离队阻碍） */
  registrationStatus: "pending" | "waitlisted" | "pass";
  /** 是否已有签到或考勤记录等真实参与证据 */
  hasParticipationEvidence: boolean;
};

/**
 * 离队影响预检（后端 `MemberOffboardImpactResponseDto`）。
 *
 * ⚠️ 这是**真预演**不是静态清单：`canOffboard` 为 false 时后端会拒绝离队，
 * 原因在 `blockingReasons`（典型是仍有活动责任未移交 15037、或仍有当前/未来报名未清理 15038）。
 * 所以确认弹窗必须先看这个字段，不能一律给「确定离队」。
 */
export type MemberOffboardImpact = {
  /** 由该队员发起、仍是草稿的活动 */
  draftInitiatedActivities: MemberOffboardActivityImpactItem[];
  /** 该队员仍是负责人的活动 */
  activeOwnerActivities: MemberOffboardActivityImpactItem[];
  /**
   * 该队员仍是协办的活动。
   * **不阻断离队**——后端只对「草稿发起人」和「负责人」两类责任生成 blockingReason，
   * 协办纯属知情项（2026-08-01 对 `activity-member-offboard-impact.service.ts` 实测确认）。
   */
  activeCollaboratorActivities: MemberOffboardActivityImpactItem[];
  /** 当前或未来的报名 */
  futureRegistrations: MemberOffboardRegistrationImpactItem[];
  /** 已有参与证据的历史报名（仅供知情，不阻断） */
  historicalRegistrationsWithEvidence: MemberOffboardRegistrationImpactItem[];
  /** 能否离队 */
  canOffboard: boolean;
  /**
   * 不能离队的原因。⚠️ **返回的是机器 slug 不是人话**
   * （如 `registration-cleanup-required`），直接渲染会把内部标识甩给用户——
   * 一律经 {@link offboardBlockingReasonText} 转中文再显示。
   */
  blockingReasons: string[];
};

/**
 * 离队影响预检
 * `GET /api/admin/v1/members/{id}/offboard-impact`（rbac: `member.offboard.record`）。
 * 只读预演，不改任何数据。
 */
export const getMemberOffboardImpact = (id: string) =>
  http.request<Envelope<MemberOffboardImpact>>(
    "get",
    `/api/admin/v1/members/${id}/offboard-impact`
  );

/**
 * 离队阻断原因 slug → 人话（后端 `activity-member-offboard-impact.service.ts` 三条闭集，
 * 2026-08-01 实测核对）。每条都写清「卡在哪 + 该怎么解」，不然操作者只看到「不能离队」
 * 却不知道下一步做什么。
 *
 * 未知 slug 原样返回：后端加了新原因时宁可露出标识，也好过静默吞掉一条阻断原因。
 */
const OFFBOARD_BLOCKING_REASON_TEXT: Record<string, string> = {
  "draft-initiator-handoff-required":
    "还有由 TA 发起、仍是草稿的活动——请先把这些活动改由他人发起，或直接删除草稿。",
  "active-owner-handoff-required":
    "还有由 TA 负责的活动尚未结束——请先在活动里把负责人换成别人。",
  "registration-cleanup-required":
    "还有当前或未来活动的报名——请先取消这些报名，或等活动结束后再办离队。"
};

/** 把一条阻断 slug 转成人话；未知 slug 原样返回。 */
export const offboardBlockingReasonText = (reason: string) =>
  OFFBOARD_BLOCKING_REASON_TEXT[reason] ?? reason;

/**
 * 一键离队的执行结果（后端 `MemberOffboardResponseDto`）。
 * 每条腿都给独立计数——结果对话框要逐腿展示，不能只说「成功」。
 */
export type MemberOffboardResult = {
  member: MemberItem;
  /** 本次是否把队员从 ACTIVE 置为 INACTIVE（本来就已停用则 false） */
  memberDeactivated: boolean;
  /** 本次结束的在编归属条数 */
  membershipsEnded: number;
  /** 本次是否停用了关联登录账号（无关联 / 已停用则 false） */
  accountDisabled: boolean;
  /** 本次撤销的未过期登录凭证条数 */
  refreshTokensRevoked: number;
  linkedUserId: string | null;
  /** 不变式探针：正常应为 0，非 0 说明有任职没被收干净 */
  residualActivePositionAssignments: number;
  /** 同上，分管侧 */
  residualActiveSupervisions: number;
};

/**
 * 一键离队 `POST /api/admin/v1/members/{id}/offboard`
 * （rbac: `member.offboard.record`）。
 * 一次结束全部当前授权来源：归属 / 账号 / 任职 / 分管 / 直接角色绑定。
 * **幂等**——失败后可原样重试。
 */
export const offboardMember = (id: string) =>
  http.request<Envelope<MemberOffboardResult>>(
    "post",
    `/api/admin/v1/members/${id}/offboard`
  );

/**
 * 队员生涯参与累计（后端 `MemberParticipationSummaryDto`）
 * `GET /api/admin/v1/members/{memberId}/participation-summary`
 * （rbac: `attendance.read.sheet`）。
 *
 * 时长与贡献值都是**后端按已终审单据算好的**——前端不得自己把记录裸 SUM 一遍。
 */
export type MemberParticipationSummary = {
  memberId: string;
  /** 已终审单据内的生涯服务时长合计（字符串，前端不做数值运算） */
  totalServiceHours: string;
  /** 覆盖到的不同活动数 */
  activityCount: number;
  /** 已终审单据内的考勤记录数 */
  recordCount: number;
  /** 生涯累计贡献值（后端按封顶规则算） */
  contributionPoints: string;
};

export const getMemberParticipationSummary = (memberId: string) =>
  http.request<Envelope<MemberParticipationSummary>>(
    "get",
    `/api/admin/v1/members/${memberId}/participation-summary`
  );

/* ----------------------------- 离队域错误码 → 人话 ----------------------------- */

/**
 * 离队相关业务码 → 人话（码义取自后端 `biz-code.constant.ts`）。
 * 15037 / 15038 是预检里 `blockingReasons` 的两个典型成因，执行时也会以这两码拒。
 */
export function memberOffboardBizErrorMessage(
  error: unknown,
  fallback: string
): string {
  const data = (
    error as { response?: { data?: { code?: unknown; message?: string } } }
  )?.response?.data;
  const code = Number(data?.code);
  if (code === 15036)
    return "这个队员绑的登录账号不是普通用户（15036）：管理员账号要到「系统管理 → 用户账号」里处理，离队流程不动它";
  if (code === 15037)
    return "该队员还有未移交的活动责任（15037）：请先把他负责或协办的活动移交给别人，再来办离队";
  if (code === 15038)
    return "该队员还有当前或未来的活动报名（15038）：请先取消这些报名，再来办离队";
  return data?.message ?? fallback;
}
