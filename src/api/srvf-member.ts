import { http } from "@/utils/http";

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
  createdAt: string;
  updatedAt: string;
};

export type MemberListQuery = {
  page?: number;
  pageSize?: number;
  memberNo?: string;
  gradeCode?: string;
  status?: MemberStatus;
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
