import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type SupervisionScopeMode = "EXACT" | "TREE";
export type SupervisionStatus = "ACTIVE" | "ENDED" | "REVOKED";

/** scope 模式 → 中文（契约闭集 enum；与职务正交,不要求 supervisor 持职务）。 */
export const SCOPE_MODE_LABEL: Record<string, string> = {
  EXACT: "仅该节点",
  TREE: "含全部下级"
};

/** 分管状态 → 中文（契约闭集 enum）。 */
export const SUPERVISION_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "生效中",
  ENDED: "已结束",
  REVOKED: "已撤销"
};

export const SUPERVISION_STATUS_TAG: Record<
  string,
  "success" | "info" | "warning" | "danger"
> = {
  ACTIVE: "success",
  ENDED: "info",
  REVOKED: "danger"
};

/** expand=supervisor 时出现的分管人摘要（后端 `SupervisionExpandedSupervisorDto`）。 */
export type SupervisionExpandedSupervisor = {
  id: string;
  memberNo: string;
  displayName: string;
  gradeCode: string | null;
};

/** expand=organization 时出现的组织摘要（后端 `SupervisionExpandedOrganizationDto`）。 */
export type SupervisionExpandedOrganization = {
  id: string;
  name: string;
  code: string | null;
  nodeTypeCode: string;
};

/** 分管记录（后端 `SupervisionAssignmentResponseDto`；字段以 `/api/docs-json` 为准）。 */
export type SupervisionAssignmentItem = {
  id: string;
  supervisorMemberId: string;
  organizationId: string;
  scopeMode: SupervisionScopeMode;
  status: SupervisionStatus;
  startedAt: string;
  endedAt: string | null;
  appointedByUserId: string | null;
  revokedByUserId: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  /** 仅分页总表 `?expand` 含 supervisor 时出现 */
  supervisor?: SupervisionExpandedSupervisor;
  /** 仅分页总表 `?expand` 含 organization 时出现 */
  organization?: SupervisionExpandedOrganization;
};

/** 列出当前在任分管（数组,无分页,status=ACTIVE）`GET /api/admin/v1/supervision-assignments`（rbac: `supervision-assignment.read.record`）。 */
export const getSupervisionAssignments = () =>
  http.request<Envelope<SupervisionAssignmentItem[]>>(
    "get",
    "/api/admin/v1/supervision-assignments"
  );

/**
 * 分页总表查询入参。status 缺省 = 全部未软删含 REVOKED 历史
 * （与角色绑定总表"缺省仅生效"的口径相反 —— 与 memberships/position-assignments
 * 总表同一套"缺省含历史"惯例）。expand 白名单 supervisor,organization。
 */
export type SupervisionListQuery = {
  page?: number;
  pageSize?: number;
  supervisorMemberId?: string;
  organizationId?: string;
  includeDescendants?: boolean;
  scopeMode?: SupervisionScopeMode;
  status?: SupervisionStatus;
  q?: string;
  expand?: string;
};

/**
 * 分管分页总表（v0.36 新增）
 * `GET /api/admin/v1/supervision-assignments/page`（rbac: `supervision-assignment.read.record`）。
 */
export const getSupervisionAssignmentsPage = (params?: SupervisionListQuery) =>
  http.request<Envelope<PageResult<SupervisionAssignmentItem>>>(
    "get",
    "/api/admin/v1/supervision-assignments/page",
    { params }
  );

/** 单条分管详情 `GET /api/admin/v1/supervision-assignments/{id}`（rbac: `supervision-assignment.read.record`）。 */
export const getSupervisionAssignment = (id: string) =>
  http.request<Envelope<SupervisionAssignmentItem>>(
    "get",
    `/api/admin/v1/supervision-assignments/${id}`
  );

/** 建分管入参（后端 `CreateSupervisionAssignmentDto`；分管人队员必须 active，不要求持职务）。 */
export type CreateSupervisionAssignmentBody = {
  supervisorMemberId: string;
  organizationId: string;
  /** 默认 TREE；EXACT 仅该节点 */
  scopeMode?: SupervisionScopeMode;
  startedAt: string;
  endedAt?: string;
  note?: string;
};

/** 改分管入参（后端 `UpdateSupervisionAssignmentDto`；不可改 supervisor/organization）。 */
export type UpdateSupervisionAssignmentBody = {
  scopeMode?: SupervisionScopeMode;
  startedAt?: string;
  endedAt?: string;
  note?: string;
};

/** 建分管 `POST /api/admin/v1/supervision-assignments`（rbac: `supervision-assignment.create.record`）。 */
export const createSupervisionAssignment = (
  body: CreateSupervisionAssignmentBody
) =>
  http.request<Envelope<SupervisionAssignmentItem>>(
    "post",
    "/api/admin/v1/supervision-assignments",
    { data: body }
  );

/** 改分管 `PATCH /api/admin/v1/supervision-assignments/{id}`（rbac: `supervision-assignment.update.record`）。 */
export const updateSupervisionAssignment = (
  id: string,
  body: UpdateSupervisionAssignmentBody
) =>
  http.request<Envelope<SupervisionAssignmentItem>>(
    "patch",
    `/api/admin/v1/supervision-assignments/${id}`,
    { data: body }
  );

/** 撤销分管（status=REVOKED + 撤销人 + endedAt；无请求体）`POST /api/admin/v1/supervision-assignments/{id}/revoke`（rbac: `supervision-assignment.revoke.record`）。 */
export const revokeSupervisionAssignment = (id: string) =>
  http.request<Envelope<SupervisionAssignmentItem>>(
    "post",
    `/api/admin/v1/supervision-assignments/${id}/revoke`
  );

export type CoveragePreviewBody = {
  organizationId: string;
  scopeMode?: SupervisionScopeMode;
};

export type CoveragePreviewResult = {
  organizationId: string;
  scopeMode: SupervisionScopeMode;
  expandedOrganizationIds: string[];
};

/**
 * 覆盖范围预演（v0.36 新增；⚠️ 这是**展示型**预演，不是校验型预检——
 * 纯粹回答"如果按这个 scopeMode 建，会覆盖哪些组织"，不返回 valid/violations，
 * 与角色绑定/任职域的两段式「预检→创建」阻塞流程不同，前端不应把它当拦截步骤，
 * 只作为提交前的信息性提示）
 * `POST /api/admin/v1/supervision-assignments/coverage-preview`（rbac: `supervision-assignment.read.record`）。
 */
export const previewSupervisionCoverage = (body: CoveragePreviewBody) =>
  http.request<Envelope<CoveragePreviewResult>>(
    "post",
    "/api/admin/v1/supervision-assignments/coverage-preview",
    { data: body }
  );

export type OrganizationSupervisorCoverage = "DIRECT" | "INHERITED";

export type OrganizationSupervisorItem = {
  coverage: OrganizationSupervisorCoverage;
  supervisionAssignment: SupervisionAssignmentItem;
};

/**
 * 某组织被谁分管（直接分管 + 祖先 TREE 继承覆盖，标 coverage；展示读，非判权）
 * `GET /api/admin/v1/organizations/{orgId}/supervisors`（rbac: `supervision-assignment.read.record`）。
 */
export const getOrganizationSupervisors = (orgId: string) =>
  http.request<Envelope<OrganizationSupervisorItem[]>>(
    "get",
    `/api/admin/v1/organizations/${orgId}/supervisors`
  );

export type SupervisionScopeEntryItem = {
  supervisionAssignmentId: string;
  organizationId: string;
  scopeMode: SupervisionScopeMode;
  expandedOrganizationIds: string[];
};

/**
 * 某分管人的分管范围（TREE 经 closure 展开含全部后代 / EXACT 仅该节点；展示读，非判权）
 * `GET /api/admin/v1/members/{memberId}/supervision-scope`（rbac: `supervision-assignment.read.record`）。
 */
export const getMemberSupervisionScope = (memberId: string) =>
  http.request<Envelope<SupervisionScopeEntryItem[]>>(
    "get",
    `/api/admin/v1/members/${memberId}/supervision-scope`
  );
