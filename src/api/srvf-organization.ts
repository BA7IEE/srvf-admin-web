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
