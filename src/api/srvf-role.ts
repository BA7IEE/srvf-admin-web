import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** RBAC 角色（后端 RbacRoleResponseDto；字段以 /api/docs-json 为准） */
export type RoleItem = {
  id: string;
  code: string;
  displayName: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RoleListQuery = { page?: number; pageSize?: number; code?: string };
export type RoleListResult = Envelope<PageResult<RoleItem>>;

/** 角色分页列表 `GET /api/system/v1/roles`（rbac: `rbac.role.read`） */
export const getRoles = (params?: RoleListQuery) =>
  http.request<RoleListResult>("get", "/api/system/v1/roles", { params });
