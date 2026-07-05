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

/** 组织树节点（后端 `OrganizationTreeNodeDto`；递归 children） */
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
};
export type OrgTreeResult = Envelope<OrgTreeNode[]>;

/** 组织树 `GET /api/admin/v1/organizations/tree`（rbac: `org.read.node`） */
export const getOrgTree = () =>
  http.request<OrgTreeResult>("get", "/api/admin/v1/organizations/tree");

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
