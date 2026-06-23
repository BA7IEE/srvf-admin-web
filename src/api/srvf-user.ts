import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type AccountRole = "SUPER_ADMIN" | "ADMIN" | "USER";
export type AccountStatus = "ACTIVE" | "DISABLED";

/** 系统用户账号（后端 UserResponseDto；与 @/api/user 的登录态无关） */
export type UserAccountItem = {
  id: string;
  username: string;
  email: string | null;
  nickname: string | null;
  avatarKey: string | null;
  role: AccountRole;
  status: AccountStatus;
  createdAt: string;
  lastLoginAt: string | null;
  updatedAt: string;
};

export type UserAccountListQuery = { page?: number; pageSize?: number };
export type UserAccountListResult = Envelope<PageResult<UserAccountItem>>;

/** 用户账号分页列表 `GET /api/admin/v1/users`（rbac: `user.read.account`） */
export const getUserAccounts = (params?: UserAccountListQuery) =>
  http.request<UserAccountListResult>("get", "/api/admin/v1/users", { params });

/* ----------------------------- 用户生命周期写操作 ----------------------------- */

export type UpdateUserStatusBody = { status: AccountStatus };
export type UpdateUserRoleBody = { role: AccountRole };
export type UserAccountMutationResult = Envelope<UserAccountItem>;

/** 启用/禁用用户 `PATCH /api/admin/v1/users/{id}/status`（rbac: `user.update.status`；只改 status） */
export const updateUserStatus = (id: string, body: UpdateUserStatusBody) =>
  http.request<UserAccountMutationResult>(
    "patch",
    `/api/admin/v1/users/${id}/status`,
    { data: body }
  );

/** 修改用户角色 `PATCH /api/admin/v1/users/{id}/role`（rbac: `user.update.role`；D1=A 仅 SUPER_ADMIN 短路可用） */
export const updateUserRole = (id: string, body: UpdateUserRoleBody) =>
  http.request<UserAccountMutationResult>(
    "patch",
    `/api/admin/v1/users/${id}/role`,
    { data: body }
  );

/** 清除用户绑定手机号 `DELETE /api/admin/v1/users/{id}/phone`（rbac: `user.phone.clear`；幂等,审计掩码） */
export const clearUserPhone = (id: string) =>
  http.request<Envelope<null>>("delete", `/api/admin/v1/users/${id}/phone`);

/** 清除用户绑定微信 openid `DELETE /api/admin/v1/users/{id}/wechat`（rbac: `user.wechat.clear`；幂等,审计掩码） */
export const clearUserWechat = (id: string) =>
  http.request<Envelope<null>>("delete", `/api/admin/v1/users/${id}/wechat`);

/** 软删除用户 `DELETE /api/admin/v1/users/{id}`（rbac: `user.delete.account`；同时置 deletedAt + status=DISABLED） */
export const deleteUserAccount = (id: string) =>
  http.request<Envelope<null>>("delete", `/api/admin/v1/users/${id}`);

/** 创建用户入参（`CreateUserDto`；SUPER_ADMIN 可建 ADMIN/USER,ADMIN 只能建 USER）。 */
export type CreateUserBody = {
  username: string;
  password: string;
  email?: string;
  nickname?: string;
  role?: AccountRole;
};
/** 改资料入参（`UpdateUserDto`；不含 username/密码/角色/状态——各有专用端点）。 */
export type UpdateUserBody = {
  email?: string;
  nickname?: string;
};

/** 创建用户 `POST /api/admin/v1/users`（rbac: `user.create.account`）。 */
export const createUser = (body: CreateUserBody) =>
  http.request<UserAccountMutationResult>("post", "/api/admin/v1/users", {
    data: body
  });

/** 修改用户资料 `PATCH /api/admin/v1/users/{id}`（rbac: `user.update.account`；仅 email/nickname/avatarKey）。 */
export const updateUser = (id: string, body: UpdateUserBody) =>
  http.request<UserAccountMutationResult>(
    "patch",
    `/api/admin/v1/users/${id}`,
    { data: body }
  );

/** 重置用户密码 `PUT /api/admin/v1/users/{id}/password`（rbac: `user.reset.password`）。 */
export const resetUserPassword = (id: string, newPassword: string) =>
  http.request<Envelope<null>>("put", `/api/admin/v1/users/${id}/password`, {
    data: { newPassword }
  });
