import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type PrincipalType =
  | "USER"
  | "MEMBER"
  | "POSITION_ASSIGNMENT"
  | "SYSTEM";
export type ScopeType =
  | "GLOBAL"
  | "ORGANIZATION"
  | "ORGANIZATION_TREE"
  | "ACTIVITY"
  | "RESOURCE"
  | "SELF";
export type BindingStatus = "ACTIVE" | "ENDED" | "SUSPENDED";

/** 主体类型 → 中文（契约闭集 enum）。 */
export const PRINCIPAL_TYPE_LABEL: Record<string, string> = {
  USER: "用户",
  MEMBER: "队员",
  POSITION_ASSIGNMENT: "任职",
  SYSTEM: "系统"
};

/** scope 类型 → 中文（契约闭集 enum）。 */
export const SCOPE_TYPE_LABEL: Record<string, string> = {
  GLOBAL: "全局",
  ORGANIZATION: "指定组织",
  ORGANIZATION_TREE: "组织+下级",
  ACTIVITY: "指定活动",
  RESOURCE: "指定资源",
  SELF: "仅自己"
};

/** 绑定状态 → 中文（契约闭集 enum）。 */
export const BINDING_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "生效中",
  ENDED: "已结束",
  SUSPENDED: "已暂停"
};

export const BINDING_STATUS_TAG: Record<
  string,
  "success" | "info" | "warning" | "danger"
> = {
  ACTIVE: "success",
  ENDED: "info",
  SUSPENDED: "warning"
};

/** expand=role 时出现的角色摘要（后端 `RoleBindingExpandedRoleDto`）。 */
export type RoleBindingExpandedRole = {
  id: string;
  code: string;
  displayName: string;
};

/**
 * expand=principal 时出现的主体摘要（后端 `RoleBindingExpandedPrincipalDto`）。
 * 按 type 取不同字段：USER 用 username/nickname；MEMBER/POSITION_ASSIGNMENT 用
 * memberNo/displayName；POSITION_ASSIGNMENT 额外带 organizationId/positionId/memberId。
 */
export type RoleBindingExpandedPrincipal = {
  type: PrincipalType;
  id: string;
  username?: string;
  nickname?: string | null;
  memberNo?: string;
  displayName?: string;
  organizationId?: string;
  positionId?: string;
  memberId?: string;
};

/** 角色绑定（后端 `RoleBindingResponseDto`；字段以 `/api/docs-json` 为准）。 */
export type RoleBindingItem = {
  id: string;
  principalType: PrincipalType;
  principalId: string | null;
  roleId: string;
  scopeType: ScopeType;
  scopeOrgId: string | null;
  scopeActivityId: string | null;
  scopeResourceType: string | null;
  scopeResourceId: string | null;
  status: BindingStatus;
  startedAt: string;
  endedAt: string | null;
  createdByUserId: string | null;
  note: string | null;
  /**
   * 当前 scope 是否失效（后端 v0.61 起恒返）。
   * 仅 `ORGANIZATION` / `ORGANIZATION_TREE` 可能为 true——绑定所指的组织被停用、
   * 软删或已不存在。此时这条绑定**不再产生任何权限**，且「恢复生效 / 延长任期」
   * 都救不回来（要么先把组织恢复，要么改绑到别的组织），故界面上要禁掉这些入口。
   */
  scopeInactive: boolean;
  createdAt: string;
  updatedAt: string;
  /** 仅分页总表 `?expand` 含 role 时出现 */
  role?: RoleBindingExpandedRole;
  /** 仅分页总表 `?expand` 含 principal 时出现 */
  principal?: RoleBindingExpandedPrincipal;
};

/**
 * 分页总表查询入参。status 缺省 = 仅当前生效（与 memberships/position-assignments
 * 总表"缺省含历史"的口径相反 —— 传 `includeExpired: true` 才看到 ENDED/SUSPENDED 历史）。
 * expand 白名单 role,principal。
 */
export type RoleBindingListQuery = {
  page?: number;
  pageSize?: number;
  principalType?: PrincipalType;
  principalId?: string;
  roleId?: string;
  scopeType?: ScopeType;
  status?: BindingStatus;
  scopeOrgId?: string;
  roleCode?: string;
  principalQ?: string;
  includeExpired?: boolean;
  q?: string;
  expand?: string;
};

/**
 * 角色绑定分页总表 `GET /api/admin/v1/role-bindings/page`（rbac: `role-binding.read.record`）。
 * v0.36 F3 新增,替代早期数组端点 `GET /role-bindings`（仍保留,见 `getRoleBindingsLegacy`）。
 */
export const getRoleBindingsPage = (params?: RoleBindingListQuery) =>
  http.request<Envelope<PageResult<RoleBindingItem>>>(
    "get",
    "/api/admin/v1/role-bindings/page",
    { params }
  );

/**
 * 角色绑定数组列表（早期端点,无分页;仅 principalType/principalId/roleId/scopeType/status
 * 5 项过滤,不支持 expand）`GET /api/admin/v1/role-bindings`（rbac: 同上）。
 * 本仓页面统一用 `getRoleBindingsPage`,保留此函数供将来按主体查全量场景使用。
 */
export const getRoleBindingsLegacy = (params?: {
  principalType?: PrincipalType;
  principalId?: string;
  roleId?: string;
  scopeType?: ScopeType;
  status?: BindingStatus;
}) =>
  http.request<Envelope<RoleBindingItem[]>>(
    "get",
    "/api/admin/v1/role-bindings",
    { params }
  );

/** 新建入参（后端 `CreateRoleBindingDto`）。scope 字段 / principalId 是否必填由 scopeType / principalType 决定，前端不作强校验假设，一律照后端裁决。 */
export type CreateRoleBindingBody = {
  principalType: PrincipalType;
  principalId?: string;
  roleId: string;
  scopeType: ScopeType;
  scopeOrgId?: string;
  scopeActivityId?: string;
  scopeResourceType?: string;
  scopeResourceId?: string;
  startedAt?: string;
  endedAt?: string;
  note?: string;
};

/** 更新入参（后端 `UpdateRoleBindingDto`；不可改 principal/role/scope，仅状态/任期/备注）。 */
export type UpdateRoleBindingBody = {
  status?: BindingStatus;
  startedAt?: string;
  endedAt?: string;
  note?: string;
};

export type RoleBindingPreviewConflict = {
  bizCode: number | null;
  message: string;
};

export type RoleBindingPreviewResult = {
  valid: boolean;
  conflicts: RoleBindingPreviewConflict[];
  resolvedScope: {
    scopeType: ScopeType;
    scopeOrgId: string | null;
    scopeActivityId: string | null;
    scopeResourceType: string | null;
    scopeResourceId: string | null;
  };
};

/**
 * 预检待建角色绑定（dry-run，与 create 同参同校验，零写入；query 而非 body，
 * 与 position-assignments/preview 走 POST body 不同——两个域各自的端点形状,均已对 live 契约核实）
 * `GET /api/admin/v1/role-bindings/preview`（rbac: `role-binding.read.record`，读码非创建码）。
 */
export const previewRoleBinding = (params: CreateRoleBindingBody) =>
  http.request<Envelope<RoleBindingPreviewResult>>(
    "get",
    "/api/admin/v1/role-bindings/preview",
    { params }
  );

/** 新建角色绑定 `POST /api/admin/v1/role-bindings`（rbac: `role-binding.create.record`）。 */
export const createRoleBinding = (body: CreateRoleBindingBody) =>
  http.request<Envelope<RoleBindingItem>>(
    "post",
    "/api/admin/v1/role-bindings",
    { data: body }
  );

/** 更新角色绑定 `PATCH /api/admin/v1/role-bindings/{id}`（rbac: `role-binding.update.record`）。 */
export const updateRoleBinding = (id: string, body: UpdateRoleBindingBody) =>
  http.request<Envelope<RoleBindingItem>>(
    "patch",
    `/api/admin/v1/role-bindings/${id}`,
    { data: body }
  );

/** 软删角色绑定（status=ENDED + endedAt + deletedAt,保历史）`DELETE /api/admin/v1/role-bindings/{id}`（rbac: `role-binding.delete.record`）。 */
export const deleteRoleBinding = (id: string) =>
  http.request<Envelope<RoleBindingItem>>(
    "delete",
    `/api/admin/v1/role-bindings/${id}`
  );

export type RoleBindingBatchOutcome = "ok" | "blocked" | "already-exists";

export type RoleBindingBatchItemResult = {
  index: number;
  outcome: RoleBindingBatchOutcome;
  bindingId: string | null;
  bizCode: number | null;
  message: string | null;
};

export type RoleBindingBatchResult = {
  items: RoleBindingBatchItemResult[];
  summary: {
    total: number;
    ok: number;
    blocked: number;
    alreadyExists: number;
  };
};

/**
 * 批量建角色绑定（≤200 条，逐条 ok/blocked/already-exists；already-exists=幂等 skip，
 * 重跑同批不报错）`POST /api/admin/v1/role-bindings/batch`（rbac: `role-binding.create.record`）。
 * v0.36 新增；本轮 API 先行封装，批量建的选人 UI 留待有具体消费场景（如"给某职务全体在任
 * 绑 xxx 角色"）再建，见蓝图 Phase 1-D 说明。
 */
export const batchCreateRoleBindings = (items: CreateRoleBindingBody[]) =>
  http.request<Envelope<RoleBindingBatchResult>>(
    "post",
    "/api/admin/v1/role-bindings/batch",
    { data: { items } }
  );

/* ----------------------- 绑定是否「当前真的在生效」 ----------------------- */

/**
 * 绑定的生效态（展示用）。
 *
 * 后端只认**在期且范围有效**的绑定产权限，但列表里 `status=ACTIVE` 的行可能因为
 * 任期没到、任期已过、或范围组织被停用而**其实一点权限都不产生**。
 * 只看 `status` 会让人以为「显示 ACTIVE 就是生效中」，排查授权问题时极容易被误导，
 * 故这里把这三种「名义 ACTIVE、实际不生效」的情况显式算出来。
 */
export type RoleBindingEffectiveState =
  | "effective"
  | "scope-inactive"
  | "not-started"
  | "expired"
  | "suspended"
  | "ended";

/**
 * 判定一条绑定当前是否真的在产生权限。
 * 优先级：显式状态 > 范围失效 > 任期未到 / 已过。
 * `now` 可注入便于测试；默认取当前时刻。
 */
export function roleBindingEffectiveState(
  row: Pick<
    RoleBindingItem,
    "status" | "startedAt" | "endedAt" | "scopeInactive"
  >,
  now: Date = new Date()
): RoleBindingEffectiveState {
  if (row.status === "ENDED") return "ended";
  if (row.status === "SUSPENDED") return "suspended";
  if (row.scopeInactive) return "scope-inactive";
  if (row.startedAt && new Date(row.startedAt).getTime() > now.getTime())
    return "not-started";
  if (row.endedAt && new Date(row.endedAt).getTime() < now.getTime())
    return "expired";
  return "effective";
}

/** 生效态 → 界面文案与 tag 色（`effective` 不额外加标，避免正常行被噪音淹没）。 */
export const ROLE_BINDING_EFFECTIVE_META: Record<
  RoleBindingEffectiveState,
  { text: string; type: "success" | "info" | "warning" | "danger" } | null
> = {
  effective: null,
  "scope-inactive": { text: "范围已失效", type: "info" },
  "not-started": { text: "未生效", type: "warning" },
  expired: { text: "已过期", type: "info" },
  suspended: { text: "已挂起", type: "warning" },
  ended: { text: "已结束", type: "info" }
};

/* ----------------------------- 角色绑定域错误码 → 人话 ----------------------------- */

/**
 * 角色绑定 / 授权域错误码 → 人话（码义取自后端 `biz-code.constant.ts`，禁臆造）。
 * 与 `roleBizErrorMessage` 分工：那边管角色本体与用户-角色关系，这边管绑定与范围组织。
 */
export function roleBindingBizErrorMessage(
  error: unknown,
  fallback: string
): string {
  const data = (
    error as { response?: { data?: { code?: unknown; message?: string } } }
  )?.response?.data;
  const code = Number(data?.code);
  if (code === 30101)
    return "系统必须保留至少一名在岗的运营管理员（30101）：请先给别人补上这个角色，再来撤销这一条";
  if (code === 30102)
    return "无权分配或撤销该角色（30102）：只能操作不高于自己级别的角色，请找更高权限的人处理";
  if (code === 30103)
    return "该权限点仅超级管理员可分配（30103）：控制面保留码不开放给普通管理员";
  if (code === 11001)
    return "选中的组织节点不存在（11001）：可能刚被删除，请刷新组织树后重选";
  if (code === 17031)
    return "该组织节点已停用（17031）：停用的组织不能作为授权范围，请先启用它或改选其它组织";
  return data?.message ?? fallback;
}
