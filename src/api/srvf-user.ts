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
