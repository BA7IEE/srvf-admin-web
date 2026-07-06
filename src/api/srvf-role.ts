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

/* -------------------------- 用户 ↔ RBAC角色 绑定（全局） -------------------------- */
/* 与队员360/system.users 的"系统角色"(role:SUPER_ADMIN|ADMIN|USER 单值枚举，走           */
/* PATCH users/{id}/role)是两回事——这里是多值的 RBAC 角色绑定，`GET/POST` +              */
/* `DELETE .../{roleId}` 走 `users/{userId}/roles` 子资源。后端 handoff §2.6：           */
/* 本端点只做 principalType=USER + scopeType=GLOBAL 的绑定，与「角色绑定」页(role-       */
/* bindings)同一张底表、GLOBAL 绑定互相可见；旧判权服务 RbacService 只读 GLOBAL 绑定，   */
/* 覆盖几乎全部业务面，是让一个用户"真正拿到某个 RBAC 角色权限"最直接的路径。            */

/** 用户已绑定的 RBAC 角色（后端 `UserRoleResponseDto`） */
export type UserRoleItem = {
  id: string;
  roleId: string;
  roleCode: string;
  roleDisplayName: string;
  createdAt: string;
  createdByUserId: string | null;
};
export type UserRolesResult = Envelope<UserRoleItem[]>;

/**
 * 查用户已绑定的 RBAC 角色 `GET /api/system/v1/users/{userId}/roles`
 * （rbac: `rbac.user-role.read`）。已排除软删角色。
 */
export const getUserRbacRoles = (userId: string) =>
  http.request<UserRolesResult>("get", `/api/system/v1/users/${userId}/roles`);

export type AssignUserRoleMutationResult = Envelope<null>;

/**
 * 给用户绑定 RBAC 角色 `POST /api/system/v1/users/{userId}/roles`
 * （rbac: `rbac.user-role.create`）。入参 `roleCode`（非 id）。
 * Q7 角色分级：SUPER_ADMIN 可绑任意角色；持 `ops-admin` 者只能绑非 ops-admin 角色，
 * 否则后端拒绝弹 30102；重复绑定弹 30006。
 */
export const assignUserRbacRole = (userId: string, roleCode: string) =>
  http.request<AssignUserRoleMutationResult>(
    "post",
    `/api/system/v1/users/${userId}/roles`,
    { data: { roleCode } }
  );

/**
 * 撤销用户的某个 RBAC 角色 `DELETE /api/system/v1/users/{userId}/roles/{roleId}`
 * （rbac: `rbac.user-role.delete`）。路径 `roleId` 是 `RbacRole.id`（非 code）。
 * Q7 分级判定同上；撤销 `ops-admin` 时后端有"全局最后一个 ops-admin 保护"，
 * 撤到只剩一个会拒绝弹 30101；关系不存在弹 30007。
 */
export const revokeUserRbacRole = (userId: string, roleId: string) =>
  http.request<Envelope<null>>(
    "delete",
    `/api/system/v1/users/${userId}/roles/${roleId}`
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
  if (code === 30006) return "该用户已拥有此角色，无需重复绑定（30006）";
  if (code === 30007) return "该用户并未拥有此角色，无法撤销（30007）";
  if (code === 30008)
    return "权限点编码格式错误：应为 <module>.<action>.<resourceType>（30008）";
  if (code === 30009)
    return "角色编码格式错误：应为 kebab-case，3-32 位小写字母/数字/连字符（30009）";
  if (code === 30011) return "该角色并未拥有此权限点，无法撤销（30011）";
  if (code === 30101)
    return "系统必须保留至少一个 ops-admin，无法撤销最后一位持有者的此角色（30101）";
  if (code === 30102)
    return "分级权限不足：您当前的角色级别无法绑定/撤销此角色（30102）";
  if (code === 30103)
    return "该权限点为 SUPER_ADMIN 专属保留码，当前账号无法分配（30103）";
  return data?.message ?? fallback;
}
