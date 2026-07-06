import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** RBAC 权限点（后端 `PermissionResponseDto`；字段以 /api/docs-json 为准） */
export type PermissionItem = {
  id: string;
  /** 格式 `<module>.<action>.<resourceType>[.<scope>]`（D2 v1.2，3-4 段点分隔） */
  code: string;
  module: string;
  action: string;
  resourceType: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PermissionListQuery = {
  page?: number;
  pageSize?: number;
  /** 精确匹配 */
  module?: string;
  /** 精确匹配 */
  resourceType?: string;
};
export type PermissionListResult = Envelope<PageResult<PermissionItem>>;

/**
 * 权限点分页列表 `GET /api/system/v1/permissions`（rbac: `rbac.permission.read`）。
 * pageSize 后端硬上限 100（同 positions/roles 的 options 端点坑，传更大会 400）。
 */
export const getPermissions = (params?: PermissionListQuery) =>
  http.request<PermissionListResult>("get", "/api/system/v1/permissions", {
    params
  });
