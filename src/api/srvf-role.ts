import { http } from "@/utils/http";
import type { PermissionItem } from "./srvf-permission";

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

/**
 * 重载 RBAC 缓存 `POST /api/system/v1/rbac/reload`（rbac: `rbac.config.reload`）。
 * 改完角色/权限绑定后需触发缓存失效,否则不即时生效。scope 默认 all(全量)。
 */
export const reloadRbac = (scope: "all" | "user" | "role" = "all") =>
  http.request<Envelope<unknown>>("post", "/api/system/v1/rbac/reload", {
    data: { scope }
  });

/* ------------------------------- 角色 CRUD ------------------------------- */

/** 角色详情（后端 `RbacRoleDetailResponseDto`；比列表项多内嵌已分配的 `permissions[]`） */
export type RoleDetail = RoleItem & { permissions: PermissionItem[] };
export type RoleDetailResult = Envelope<RoleDetail>;

/**
 * 角色详情 `GET /api/system/v1/roles/{id}`（rbac: `rbac.role.read`）。
 * 含已分配 permissions[]；不存在返 30003、已软删返 30005。
 */
export const getRole = (id: string) =>
  http.request<RoleDetailResult>("get", `/api/system/v1/roles/${id}`);

/** 创建角色入参（后端 `CreateRbacRoleDto`）。code 定死后不可再改。 */
export type CreateRoleBody = {
  /** kebab-case，3-32 字符，首字母小写+[a-z0-9-]；格式错 30009，撞已软删历史唯一 30004 */
  code: string;
  displayName: string;
  description?: string;
};
/** 编辑角色入参（后端 `UpdateRbacRoleDto`；仅 displayName/description，code 不可改） */
export type UpdateRoleBody = { displayName?: string; description?: string };
export type RoleMutationResult = Envelope<RoleItem>;

/** 创建角色 `POST /api/system/v1/roles`（rbac: `rbac.role.create`） */
export const createRole = (body: CreateRoleBody) =>
  http.request<RoleMutationResult>("post", "/api/system/v1/roles", {
    data: body
  });

/** 编辑角色 `PATCH /api/system/v1/roles/{id}`（rbac: `rbac.role.update`） */
export const updateRole = (id: string, body: UpdateRoleBody) =>
  http.request<RoleMutationResult>("patch", `/api/system/v1/roles/${id}`, {
    data: body
  });

/**
 * 软删角色 `DELETE /api/system/v1/roles/{id}`（rbac: `rbac.role.delete`）。
 * 仅置 deletedAt；user_roles / role_permissions 不联动清理(handoff §2.6)——
 * 已持有该角色的用户会从"查用户角色"等读接口里静默看不到它(读接口排除已软删角色)，
 * 但底表关联行本身不会被删除，属后端既有设计，不是前端可控范围。
 */
export const deleteRole = (id: string) =>
  http.request<Envelope<null>>("delete", `/api/system/v1/roles/${id}`);

/** 角色选择器投影项（后端 `RoleOptionItemDto`） */
export type RoleOptionItem = { id: string; label: string; code: string };
export type RoleOptionsResult = Envelope<{ items: RoleOptionItem[] }>;
export type RoleOptionsQuery = { q?: string; limit?: number };

/**
 * 角色选择器投影 `GET /api/system/v1/roles/options`（rbac: `rbac.role.read`）。
 * q 模糊 code+displayName；limit ≤ 100，默认 20（同 positions/options 的后端硬上限坑，
 * 传 >100 会 400，见 memory）。
 */
export const getRoleOptions = (params?: RoleOptionsQuery) =>
  http.request<RoleOptionsResult>("get", "/api/system/v1/roles/options", {
    params
  });

/* -------------------------- 角色 ↔ 权限点 绑定 -------------------------- */

/**
 * 批量给角色加权限点 `POST /api/system/v1/roles/{id}/permissions`
 * （rbac: `rbac.role-permission.create`）。入参 `permissionCodes[]`（非 id）；
 * 幂等——已存在的 (roleId, permissionId) 静默跳过；SA-only 保留码仅 SUPER_ADMIN
 * 可分配，否则后端拒绝弹 30103。
 */
export const assignRolePermissions = (id: string, permissionCodes: string[]) =>
  http.request<Envelope<null>>(
    "post",
    `/api/system/v1/roles/${id}/permissions`,
    { data: { permissionCodes } }
  );

/**
 * 撤销角色的某个权限点 `DELETE /api/system/v1/roles/{id}/permissions/{permissionId}`
 * （rbac: `rbac.role-permission.delete`）。路径 `permissionId` 是 `Permission.id`
 * （非 code）；关系不存在后端拒绝弹 30011。
 */
export const revokeRolePermission = (id: string, permissionId: string) =>
  http.request<Envelope<null>>(
    "delete",
    `/api/system/v1/roles/${id}/permissions/${permissionId}`
  );

/**
 * RBAC 治理相关业务码的专用文案（后端 handoff + `/api/docs-json` 摘码；
 * 其余码回落后端 message，再回落调用方兜底文案）。
 */
export function roleBizErrorMessage(error: unknown, fallback: string): string {
  const data = (
    error as { response?: { data?: { code?: unknown; message?: string } } }
  )?.response?.data;
  const code = Number(data?.code);
  if (code === 30003) return "角色不存在或已被删除（30003）";
  if (code === 30004)
    return "角色编码与已删除的历史角色冲突，请换一个编码（30004）";
  if (code === 30005) return "该角色已被软删除（30005）";
  if (code === 30008)
    return "权限点编码格式错误：应为 <module>.<action>.<resourceType>（30008）";
  if (code === 30009)
    return "角色编码格式错误：应为 kebab-case，3-32 位小写字母/数字/连字符（30009）";
  if (code === 30011) return "该角色并未拥有此权限点，无法撤销（30011）";
  if (code === 30103)
    return "该权限点为 SUPER_ADMIN 专属保留码，当前账号无法分配（30103）";
  return data?.message ?? fallback;
}
