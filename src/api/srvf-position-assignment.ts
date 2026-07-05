import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** 任职状态 → 中文（契约闭集 enum：ACTIVE/ENDED/REVOKED）。 */
export const ASSIGNMENT_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "在任",
  ENDED: "已结束",
  REVOKED: "已撤销"
};

export const ASSIGNMENT_STATUS_TAG: Record<
  string,
  "success" | "info" | "warning" | "danger" | "primary"
> = {
  ACTIVE: "success",
  ENDED: "info",
  REVOKED: "danger"
};

/** expand=member 时出现的队员摘要（后端 `PositionAssignmentExpandedMemberDto`）。 */
export type AssignmentExpandedMember = {
  id: string;
  memberNo: string;
  displayName: string;
  gradeCode: string | null;
};

/** expand=position 时出现的职务摘要（后端 `PositionAssignmentExpandedPositionDto`）。 */
export type AssignmentExpandedPosition = {
  id: string;
  code: string;
  name: string;
  categoryCode: string;
};

/** expand=organization 时出现的组织摘要（后端 `PositionAssignmentExpandedOrganizationDto`）。 */
export type AssignmentExpandedOrganization = {
  id: string;
  name: string;
  code: string | null;
  nodeTypeCode: string;
};

/**
 * 任职记录（后端 `PositionAssignmentResponseDto`；字段以 `/api/docs-json` 为准）。
 * member/position/organization 仅**全局总表**端点 `?expand=` 含对应项时才出现；
 * 组织轴/队员轴端点恒不展开（响应形状与既有端点一致,后端原文）。
 */
export type PositionAssignmentItem = {
  id: string;
  organizationId: string;
  positionId: string;
  memberId: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  appointedByUserId: string | null;
  revokedByUserId: string | null;
  appointmentSource: string | null;
  isConcurrent: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  member?: AssignmentExpandedMember;
  position?: AssignmentExpandedPosition;
  organization?: AssignmentExpandedOrganization;
};

/**
 * 组织轴：该组织的在任职务（**恒 status=ACTIVE**,后端固定语义,无 status 参数）
 * `GET /api/admin/v1/organizations/{orgId}/position-assignments`（rbac: `position-assignment.read.record`）。
 */
export const getOrgPositionAssignments = (orgId: string) =>
  http.request<Envelope<PositionAssignmentItem[]>>(
    "get",
    `/api/admin/v1/organizations/${orgId}/position-assignments`
  );

/** 任命入参（后端 `CreatePositionAssignmentDto`；organizationId 取自路径,不在 body 里）。 */
export type CreatePositionAssignmentBody = {
  positionId: string;
  memberId: string;
  /** ISO 8601 日期 */
  startedAt: string;
  endedAt?: string;
  isConcurrent?: boolean;
  /** 自由短串,如 manual / import / announcement-2026 */
  appointmentSource?: string;
  note?: string;
};

/**
 * 任命（校验职务适配/单人独占/兼任/归属要求/任期,5 项由后端裁决）
 * `POST /api/admin/v1/organizations/{orgId}/position-assignments`（rbac: `position-assignment.create.record`）。
 */
export const createPositionAssignment = (
  orgId: string,
  body: CreatePositionAssignmentBody
) =>
  http.request<Envelope<PositionAssignmentItem>>(
    "post",
    `/api/admin/v1/organizations/${orgId}/position-assignments`,
    { data: body }
  );

/**
 * 队员轴：该队员的任职历史（ACTIVE+ENDED+REVOKED 全量;任命/撤销在组织轴,本端点只读）
 * `GET /api/admin/v1/members/{memberId}/position-assignments`（rbac: `position-assignment.read.record`）。
 */
export const getMemberPositionAssignments = (memberId: string) =>
  http.request<Envelope<PositionAssignmentItem[]>>(
    "get",
    `/api/admin/v1/members/${memberId}/position-assignments`
  );

/**
 * 全局分页任职总表查询入参。
 * status 缺省 = 全部未软删含 REVOKED 历史（总表口径,与组织轴「仅 ACTIVE」刻意不同）；
 * expand 白名单 member,position,organization。
 */
export type PositionAssignmentListQuery = {
  page?: number;
  pageSize?: number;
  organizationId?: string;
  includeDescendants?: boolean;
  memberId?: string;
  positionId?: string;
  status?: string;
  q?: string;
  expand?: string;
};

/**
 * 全局分页任职总表（跨组织跨队员横扫）
 * `GET /api/admin/v1/position-assignments`（rbac: `position-assignment.read.record`）。
 */
export const getPositionAssignments = (params?: PositionAssignmentListQuery) =>
  http.request<Envelope<PageResult<PositionAssignmentItem>>>(
    "get",
    "/api/admin/v1/position-assignments",
    { params }
  );

/** 任职详情 `GET /api/admin/v1/position-assignments/{id}`（rbac: `position-assignment.read.record`）。 */
export const getPositionAssignment = (id: string) =>
  http.request<Envelope<PositionAssignmentItem>>(
    "get",
    `/api/admin/v1/position-assignments/${id}`
  );

/**
 * 历史链（以 :id 锚定的人-组织-职务三元组全量历史,含该三元组下所有 ACTIVE/ENDED/REVOKED 记录）
 * `GET /api/admin/v1/position-assignments/{id}/history`（rbac: `position-assignment.read.history`）。
 */
export const getPositionAssignmentHistory = (id: string) =>
  http.request<Envelope<PositionAssignmentItem[]>>(
    "get",
    `/api/admin/v1/position-assignments/${id}/history`
  );

/** 撤销（status → REVOKED + 撤销人 + endedAt;无请求体） */
export const revokePositionAssignment = (id: string) =>
  http.request<Envelope<PositionAssignmentItem>>(
    "post",
    `/api/admin/v1/position-assignments/${id}/revoke`
  );

/** 预检入参（后端 `PreviewPositionAssignmentDto`；比 create 多一个 organizationId,因预检是扁平端点）。 */
export type PreviewPositionAssignmentBody = {
  organizationId: string;
  positionId: string;
  memberId: string;
  startedAt: string;
  endedAt?: string;
  isConcurrent?: boolean;
  appointmentSource?: string;
  note?: string;
};

export type PositionAssignmentViolation = {
  bizCode: number;
  /** 后端已给中文可读文案,前端直接展示,不需要按 bizCode 二次翻译 */
  message: string;
};

export type PositionAssignmentPreviewResult = {
  valid: boolean;
  violations: PositionAssignmentViolation[];
};

/**
 * 预检任命（dry-run:任期+存在性+任命 5 校验逐项收集 violations,零写入;
 * ⚠️ 权限码是**读**码而非创建码——预检本身不算写操作）
 * `POST /api/admin/v1/position-assignments/preview`（rbac: `position-assignment.read.record`）。
 */
export const previewPositionAssignment = (
  body: PreviewPositionAssignmentBody
) =>
  http.request<Envelope<PositionAssignmentPreviewResult>>(
    "post",
    "/api/admin/v1/position-assignments/preview",
    { data: body }
  );

/** 队员选择器项（复用 `MemberOptionsResponseDto` 形状；单独声明避免与 srvf-member.ts 产生循环依赖）。 */
export type MemberOptionItem = {
  id: string;
  label: string;
  memberNo: string;
  gradeCode: string | null;
};

/**
 * 队员选择器投影 `GET /api/admin/v1/members/options`（rbac: `member.read.record`）。
 * q 模糊命中 displayName+memberNo；limit ≤100（后端硬校验,超出 400）。
 */
export const getMemberOptions = (params?: {
  q?: string;
  organizationId?: string;
  includeDescendants?: boolean;
  limit?: number;
}) =>
  http.request<Envelope<{ items: MemberOptionItem[] }>>(
    "get",
    "/api/admin/v1/members/options",
    { params }
  );
