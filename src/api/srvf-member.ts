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
