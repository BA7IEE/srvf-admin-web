import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * 归属类型 → 中文（契约闭集 enum：PRIMARY/SECONDARY/TEMPORARY/SUPPORT；
 * 语义沿后端 handoff「主/兼/临时/支援」，PRIMARY 至多一条 active,其余可并存多条）。
 */
export const MEMBERSHIP_TYPE_LABEL: Record<string, string> = {
  PRIMARY: "主属",
  SECONDARY: "兼属",
  TEMPORARY: "临时",
  SUPPORT: "支援"
};

/** 归属状态 → 中文（契约闭集 enum：ACTIVE/ENDED/SUSPENDED）。 */
export const MEMBERSHIP_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "在册",
  ENDED: "已结束",
  SUSPENDED: "已暂停"
};

export const MEMBERSHIP_STATUS_TAG: Record<
  string,
  "success" | "info" | "warning" | "danger" | "primary"
> = {
  ACTIVE: "success",
  ENDED: "info",
  SUSPENDED: "warning"
};

/** 冲突类型 → 中文（契约闭集 enum；语义沿后端 handoff「多主/悬空/停用组织」体检口径）。 */
export const MEMBERSHIP_CONFLICT_TYPE_LABEL: Record<string, string> = {
  multiple_active_primary: "多条在册主属（应至多一条）",
  dangling_member: "悬空归属：队员侧缺失",
  dangling_organization: "悬空归属：组织侧缺失",
  inactive_organization: "归属挂在已停用组织"
};

/** expand=member 时出现的队员摘要（后端 `MembershipExpandedMemberDto`）。 */
export type MembershipExpandedMember = {
  id: string;
  memberNo: string;
  displayName: string;
  gradeCode: string | null;
};

/** expand=organization 时出现的组织摘要（后端 `MembershipExpandedOrganizationDto`）。 */
export type MembershipExpandedOrganization = {
  id: string;
  name: string;
  code: string | null;
  nodeTypeCode: string;
};

/** 会籍记录（后端 `MembershipResponseDto`；字段以 `/api/docs-json` 为准）。 */
export type MembershipItem = {
  id: string;
  memberId: string;
  organizationId: string;
  membershipType: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  reason: string | null;
  createdByUserId: string | null;
  endedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  /** 仅 expand 含 member 时出现（队员轴端点不展开） */
  member?: MembershipExpandedMember;
  /** 仅 expand 含 organization 时出现（队员轴端点不展开） */
  organization?: MembershipExpandedOrganization;
};

/** 体检冲突项（后端 `MembershipConflictItemDto`）。 */
export type MembershipConflictItem = {
  type: string;
  memberId: string | null;
  organizationId: string | null;
  membershipIds: string[];
};

/**
 * 总表查询入参。status 缺省 = 全部未软删（含 ENDED 历史）——默认视图应显式传 ACTIVE；
 * q 模糊命中队员 memberNo+displayName 与组织 name+code；expand 白名单 member,organization。
 */
export type MembershipListQuery = {
  page?: number;
  pageSize?: number;
  memberId?: string;
  organizationId?: string;
  includeDescendants?: boolean;
  membershipType?: string;
  status?: string;
  q?: string;
  expand?: string;
};

/**
 * 会籍总表（跨队员跨组织横扫,F4「D组」）
 * `GET /api/admin/v1/memberships`（rbac: `membership.list.record`）。
 */
export const getMemberships = (params?: MembershipListQuery) =>
  http.request<Envelope<PageResult<MembershipItem>>>(
    "get",
    "/api/admin/v1/memberships",
    { params }
  );

/** 会籍详情 `GET /api/admin/v1/memberships/{id}`（rbac: `membership.list.record`）。 */
export const getMembership = (id: string) =>
  http.request<Envelope<MembershipItem>>(
    "get",
    `/api/admin/v1/memberships/${id}`
  );

/**
 * 归属数据体检（多主/悬空/停用组织;无分页,organizationId 可选限域）
 * `GET /api/admin/v1/memberships/conflicts`（rbac: `membership.list.record`）。
 */
export const getMembershipConflicts = (params?: {
  organizationId?: string;
  includeDescendants?: boolean;
}) =>
  http.request<Envelope<{ items: MembershipConflictItem[]; total: number }>>(
    "get",
    "/api/admin/v1/memberships/conflicts",
    { params }
  );

/**
 * 队员轴：该队员的归属列表（数组不分页、不展开 → 组织名用 `resolveLabels` 批量解析）
 * `GET /api/admin/v1/members/{memberId}/memberships`（rbac: `membership.list.record`）。
 */
export const getMemberMemberships = (memberId: string) =>
  http.request<Envelope<MembershipItem[]>>(
    "get",
    `/api/admin/v1/members/${memberId}/memberships`
  );

/**
 * 组织轴：该组织的成员归属。
 * ⚠️ handoff 踩坑 #9：status 缺省**三态混返**（含 ENDED/SUSPENDED 全部历史），
 * 组织成员面板只看现有人员必须显式传 `status=ACTIVE`。
 * `GET /api/admin/v1/organizations/{orgId}/memberships`（rbac: `membership.list.record`）。
 */
export const getOrganizationMemberships = (
  orgId: string,
  params?: Omit<MembershipListQuery, "memberId" | "organizationId">
) =>
  http.request<Envelope<PageResult<MembershipItem>>>(
    "get",
    `/api/admin/v1/organizations/${orgId}/memberships`,
    { params }
  );

/* ----------------------------- 归属 写操作（新增/编辑/结束/迁移） ----------------------------- */

/** 新增队员归属入参（后端 `CreateMembershipDto`；PRIMARY 至多一条 active，其余可并存多条）。 */
export type CreateMembershipBody = {
  organizationId: string;
  membershipType: string;
  reason?: string;
};
/** 编辑归属入参（后端 `UpdateMembershipDto`；不改 status，仅类型/任期/原因）。 */
export type UpdateMembershipBody = {
  membershipType?: string;
  startedAt?: string;
  endedAt?: string;
  reason?: string;
};
export type MembershipMutationResult = Envelope<MembershipItem>;

/**
 * 新增队员归属 `POST /api/admin/v1/members/{memberId}/memberships`
 * （rbac: `membership.set.record`）。
 */
export const createMemberMembership = (
  memberId: string,
  body: CreateMembershipBody
) =>
  http.request<MembershipMutationResult>(
    "post",
    `/api/admin/v1/members/${memberId}/memberships`,
    { data: body }
  );

/**
 * 编辑归属（类型/任期/原因，不改 status）
 * `PATCH /api/admin/v1/members/{memberId}/memberships/{id}`（rbac: `membership.set.record`）。
 */
export const updateMemberMembership = (
  memberId: string,
  id: string,
  body: UpdateMembershipBody
) =>
  http.request<MembershipMutationResult>(
    "patch",
    `/api/admin/v1/members/${memberId}/memberships/${id}`,
    { data: body }
  );

/**
 * 结束队员归属（status→ENDED + endedAt，留痕不物删）
 * `DELETE /api/admin/v1/members/{memberId}/memberships/{id}`（rbac: `membership.end.record`）。
 */
export const endMemberMembership = (memberId: string, id: string) =>
  http.request<MembershipMutationResult>(
    "delete",
    `/api/admin/v1/members/${memberId}/memberships/${id}`
  );

/**
 * 归属迁移入参（后端 `TransferMembershipDto`）。单事务：结束源组织对应类型的
 * ACTIVE 归属 + 在目标组织建同类型新归属；源=目标后端拒 400；目标撞唯一 17004。
 */
export type TransferMembershipBody = {
  memberId: string;
  fromOrganizationId: string;
  toOrganizationId: string;
  membershipType: string;
  reason?: string;
};

/**
 * 归属迁移 `POST /api/admin/v1/memberships/transfer`（rbac: `membership.transfer.record`）。
 */
export const transferMembership = (body: TransferMembershipBody) =>
  http.request<Envelope<null>>("post", "/api/admin/v1/memberships/transfer", {
    data: body
  });

/** 归属相关业务码专用文案；其余码回落后端 message，再回落调用方兜底文案。 */
export function membershipBizErrorMessage(
  error: unknown,
  fallback: string
): string {
  const data = (
    error as { response?: { data?: { code?: unknown; message?: string } } }
  )?.response?.data;
  const code = Number(data?.code);
  if (code === 17004)
    return "目标组织已存在同类型的在册归属，无法迁移（17004）";
  return data?.message ?? fallback;
}
