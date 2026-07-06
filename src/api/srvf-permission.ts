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

/* ------------------------------ 权限点 CRUD ------------------------------ */

/** 创建权限点入参（后端 `CreatePermissionDto`）。code/module/action/resourceType 定死后不可再改。 */
export type CreatePermissionBody = {
  /** 格式 <module>.<action>.<resourceType>[.<scope>]（D2 v1.2；kebab-case 3-4 段，scope 可选）；格式错 30008 */
  code: string;
  module: string;
  action: string;
  resourceType: string;
  description?: string;
};
/** 编辑权限点入参（后端 `UpdatePermissionDto`；仅 description，其余字段不可改） */
export type UpdatePermissionBody = { description?: string };
export type PermissionMutationResult = Envelope<PermissionItem>;

/** 创建权限点 `POST /api/system/v1/permissions`（rbac: `rbac.permission.create`） */
export const createPermission = (body: CreatePermissionBody) =>
  http.request<PermissionMutationResult>("post", "/api/system/v1/permissions", {
    data: body
  });

/** 编辑权限点 `PATCH /api/system/v1/permissions/{id}`（rbac: `rbac.permission.update`） */
export const updatePermission = (id: string, body: UpdatePermissionBody) =>
  http.request<PermissionMutationResult>(
    "patch",
    `/api/system/v1/permissions/${id}`,
    { data: body }
  );

/**
 * 物理删除权限点 `DELETE /api/system/v1/permissions/{id}`（rbac: `rbac.permission.delete`）。
 * D4 v1.0：真删非软删；RolePermission 外键级联自动清理——删除后所有绑定此权限点的
 * 角色会立即失去它，且这一步不可逆（无法像角色软删那样"看不到但底表还在"）。
 */
export const deletePermission = (id: string) =>
  http.request<Envelope<null>>("delete", `/api/system/v1/permissions/${id}`);

/** 权限点相关业务码专用文案；其余码回落后端 message，再回落调用方兜底文案。 */
export function permissionBizErrorMessage(
  error: unknown,
  fallback: string
): string {
  const data = (
    error as { response?: { data?: { code?: unknown; message?: string } } }
  )?.response?.data;
  const code = Number(data?.code);
  if (code === 30008)
    return "权限点编码格式错误：应为 <module>.<action>.<resourceType>[.<scope>]（30008）";
  return data?.message ?? fallback;
}
