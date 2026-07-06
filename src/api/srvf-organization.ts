import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type OrgStatus = "ACTIVE" | "INACTIVE";

/** 组织节点（后端 OrganizationResponseDto；字段以 /api/docs-json 为准） */
export type OrganizationItem = {
  id: string;
  name: string;
  code: string | null;
  parentId: string | null;
  nodeTypeCode: string;
  sortOrder: number;
  status: OrgStatus;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationListQuery = {
  page?: number;
  pageSize?: number;
  parentId?: string;
  nodeTypeCode?: string;
  status?: OrgStatus;
};
export type OrganizationListResult = Envelope<PageResult<OrganizationItem>>;

/** 组织节点分页列表 `GET /api/admin/v1/organizations`（rbac: `org.read.node`） */
export const getOrganizations = (params?: OrganizationListQuery) =>
  http.request<OrganizationListResult>("get", "/api/admin/v1/organizations", {
    params
  });

/**
 * 组织树节点（后端 `OrganizationTreeNodeDto`；递归 children）。
 * directMembershipCount/subtreeMembershipCount 是可选的展示态字段——本端点
 * 本身不返回，由 hook 侧合并 `tree-with-summary` 的结果后按 id 回填。
 */
export type OrgTreeNode = {
  id: string;
  name: string;
  code: string | null;
  parentId: string | null;
  nodeTypeCode: string;
  sortOrder: number;
  status: OrgStatus;
  createdAt: string;
  updatedAt: string;
  children: OrgTreeNode[];
  /** 直属本节点的 ACTIVE 归属条数（仅合并 tree-with-summary 后才有值） */
  directMembershipCount?: number;
  /** 本节点+全部后代的 ACTIVE 归属条数合计（仅合并 tree-with-summary 后才有值） */
  subtreeMembershipCount?: number;
};
export type OrgTreeResult = Envelope<OrgTreeNode[]>;

/** 组织树 `GET /api/admin/v1/organizations/tree`（rbac: `org.read.node`） */
export const getOrgTree = () =>
  http.request<OrgTreeResult>("get", "/api/admin/v1/organizations/tree");

/**
 * 组织树 + 归属计数节点（后端 `OrganizationTreeWithSummaryNodeDto`）。
 * ⚠️ 与 `OrgTreeNode` 不是同一个 DTO——缺 parentId/sortOrder/createdAt/updatedAt，
 * 只多了两个计数字段。hook 侧按 id 把计数合并进 `getOrgTree()` 的结果展示，
 * 不整体替换数据源（避免丢 sortOrder 等既有列需要的字段）。
 */
export type OrgTreeSummaryNode = {
  id: string;
  name: string;
  code: string | null;
  nodeTypeCode: string;
  status: OrgStatus;
  directMembershipCount: number;
  subtreeMembershipCount: number;
  children: OrgTreeSummaryNode[];
};
export type OrgTreeSummaryResult = Envelope<OrgTreeSummaryNode[]>;

/**
 * 组织树 + 每节点归属计数 `GET /api/admin/v1/organizations/tree-with-summary`
 * （rbac: `org.read.node`）。directMembershipCount 直属 / subtreeMembershipCount
 * 含后代，均为 ACTIVE 归属条数，纯展示读。
 */
export const getOrgTreeWithSummary = () =>
  http.request<OrgTreeSummaryResult>(
    "get",
    "/api/admin/v1/organizations/tree-with-summary"
  );

/** 组织树极简投影项（后端 `OrganizationTreeOptionItemDto`；表单级联选择器用）。 */
export type OrgTreeOptionItem = {
  id: string;
  label: string;
  code: string | null;
  children: OrgTreeOptionItem[];
};
export type OrgTreeOptionsResult = Envelope<OrgTreeOptionItem[]>;

/**
 * 组织树极简投影 `GET /api/admin/v1/organizations/tree-options`（rbac: `org.read.node`）。
 * id/label/code/children，专为表单级联选择器设计（如"移动到..."的目标父级选择）。
 */
export const getOrgTreeOptions = (params?: { status?: OrgStatus }) =>
  http.request<OrgTreeOptionsResult>(
    "get",
    "/api/admin/v1/organizations/tree-options",
    { params }
  );

/**
 * 重挂组织节点父级入参（后端 `MoveOrganizationDto`）。
 */
export type MoveOrganizationBody = { parentId: string };

/**
 * 重挂组织节点父级 `POST /api/admin/v1/organizations/{id}/move`（rbac: `org.move.node`）。
 * 禁改根节点父级；目标父级=自身或自身后代（会成环）后端拒绝；事务内重算 closure 表。
 */
export const moveOrganization = (id: string, body: MoveOrganizationBody) =>
  http.request<OrganizationMutationResult>(
    "post",
    `/api/admin/v1/organizations/${id}/move`,
    { data: body }
  );

/** 创建组织节点入参（后端 `CreateOrganizationDto`） */
export type CreateOrganizationBody = {
  /** 节点名（≤ 100） */
  name: string;
  /** 组织缩写（可选；大写字母 / 数字 / 连字符；全局唯一含软删历史占用） */
  code?: string;
  /** 父级 id（可选；不传 = 创建根节点；第一阶段单根上限 1，由后端强制） */
  parentId?: string;
  /** 节点类别字典 code（必须在 type=node_type 字典中存在且 ACTIVE） */
  nodeTypeCode: string;
  /** 排序权重（默认 0） */
  sortOrder?: number;
};

/** 更新组织节点入参（后端 `UpdateOrganizationDto`；不含 parentId — 禁止改父级） */
export type UpdateOrganizationBody = {
  name?: string;
  code?: string;
  sortOrder?: number;
  nodeTypeCode?: string;
};

export type OrganizationMutationResult = Envelope<OrganizationItem>;

/** 创建组织节点 `POST /api/admin/v1/organizations`（rbac: `org.create.node`） */
export const createOrganization = (body: CreateOrganizationBody) =>
  http.request<OrganizationMutationResult>(
    "post",
    "/api/admin/v1/organizations",
    { data: body }
  );

/** 更新组织节点 `PATCH /api/admin/v1/organizations/{id}`（rbac: `org.update.node`） */
export const updateOrganization = (id: string, body: UpdateOrganizationBody) =>
  http.request<OrganizationMutationResult>(
    "patch",
    `/api/admin/v1/organizations/${id}`,
    { data: body }
  );

/** 软删组织节点 `DELETE /api/admin/v1/organizations/{id}`（rbac: `org.delete.node`） */
export const deleteOrganization = (id: string) =>
  http.request<Envelope<OrganizationItem | null>>(
    "delete",
    `/api/admin/v1/organizations/${id}`
  );

/** 启停组织节点 `PATCH /api/admin/v1/organizations/{id}/status`（rbac: `org.update.node`） */
export const updateOrganizationStatus = (id: string, status: OrgStatus) =>
  http.request<OrganizationMutationResult>(
    "patch",
    `/api/admin/v1/organizations/${id}/status`,
    { data: { status } }
  );

/** 选择器项（后端 `OrgOptionItemDto`）。 */
export type OrgOptionItem = {
  id: string;
  label: string;
  code: string | null;
  nodeTypeCode: string;
  parentId: string | null;
};

/**
 * 组织选择器投影 `GET /api/admin/v1/organizations/options`（rbac: `org.read.node`）。
 * q 模糊命中 name+code；limit ≤100（后端硬校验,超出 400,同 members/options/positions/options）。
 */
export const getOrgOptions = (params?: {
  q?: string;
  nodeTypeCode?: string;
  status?: OrgStatus;
  limit?: number;
}) =>
  http.request<Envelope<{ items: OrgOptionItem[] }>>(
    "get",
    "/api/admin/v1/organizations/options",
    { params }
  );

/** 组织轴队员选择器投影项（后端 `MemberOptionItemDto`；同 members/options 复用同一投影）。 */
export type OrgScopedMemberOptionItem = {
  id: string;
  label: string;
  memberNo: string;
  gradeCode: string | null;
};

/**
 * 组织轴队员下拉 `GET /api/admin/v1/organizations/{orgId}/members/options`
 * （rbac: `member.read.record`）。该组织 ±（可选）后代范围内的可选队员；
 * 组织不存在后端拒绝弹 11001。用于"从组织侧给某组织添加成员"场景。
 */
export const getOrgScopedMemberOptions = (
  orgId: string,
  params?: { q?: string; includeDescendants?: boolean; limit?: number }
) =>
  http.request<Envelope<{ items: OrgScopedMemberOptionItem[] }>>(
    "get",
    `/api/admin/v1/organizations/${orgId}/members/options`,
    { params }
  );
