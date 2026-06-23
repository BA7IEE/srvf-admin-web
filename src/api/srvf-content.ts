import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** 内容附件（后端 `ContentAttachmentDto`；MVP 只读展示,上传走 signed-URL 链路后续接线）。 */
export type ContentAttachment = {
  id: string;
  kind?: string;
  url?: string | null;
  fileName?: string | null;
};

/** 内容列表项（后端 `ContentAdminListItemDto`）。字段以 `/api/docs-json` 为准。 */
export type ContentListItem = {
  id: string;
  title: string;
  summary: string | null;
  contentTypeCode: string;
  statusCode: string;
  visibilityCode: string;
  tags: string[];
  coverImageUrl: string | null;
  pinned: boolean;
  viewCount: number;
  publishedAt: string | null;
  authorUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 内容详情（后端 `ContentAdminDetailDto`；含 body + 可见部门 + 附件签名 URL）。 */
export type ContentDetail = ContentListItem & {
  body: string;
  visibleOrganizationIds: string[];
  coverAttachmentId: string | null;
  attachments: ContentAttachment[];
};

export type ContentVisibility =
  | "public"
  | "member"
  | "formal_member"
  | "department"
  | "management";

/** 新建内容入参（后端 `CreateContentDto`；create → draft）。 */
export type CreateContentBody = {
  title: string;
  summary?: string;
  body: string;
  contentTypeCode: string;
  visibilityCode: ContentVisibility;
  visibleOrganizationIds?: string[];
  tags?: string[];
  pinned?: boolean;
};

/** 更新内容入参（后端 `UpdateContentDto`；draft/published 可改,archived 冻结 → 29030）。 */
export type UpdateContentBody = Partial<CreateContentBody>;

export type ContentListQuery = {
  page?: number;
  pageSize?: number;
  statusCode?: string;
  contentTypeCode?: string;
  visibilityCode?: string;
  keyword?: string;
  tags?: string;
  pinned?: boolean;
};

export type ContentListResult = Envelope<PageResult<ContentListItem>>;
export type ContentDetailResult = Envelope<ContentDetail>;

/** 内容分页列表 `GET /api/admin/v1/contents`（rbac: `content.read.record`；admin 见全部状态全可见档）。 */
export const getContents = (params?: ContentListQuery) =>
  http.request<ContentListResult>("get", "/api/admin/v1/contents", { params });

/** 内容详情 `GET .../contents/{id}`（rbac: `content.read.record`；viewCount 不自增）。 */
export const getContent = (id: string) =>
  http.request<ContentDetailResult>("get", `/api/admin/v1/contents/${id}`);

/** 新建内容草稿 `POST .../contents`（rbac: `content.create.record`；→ draft）。 */
export const createContent = (body: CreateContentBody) =>
  http.request<ContentDetailResult>("post", "/api/admin/v1/contents", {
    data: body
  });

/** 更新内容 `PATCH .../contents/{id}`（rbac: `content.update.record`）。 */
export const updateContent = (id: string, body: UpdateContentBody) =>
  http.request<ContentDetailResult>("patch", `/api/admin/v1/contents/${id}`, {
    data: body
  });

/** 软删内容 `DELETE .../contents/{id}`（rbac: `content.delete.record`；任意态）。 */
export const deleteContent = (id: string) =>
  http.request<Envelope<null>>("delete", `/api/admin/v1/contents/${id}`);

/** 发布 `POST .../contents/{id}/publish`（rbac: `content.publish.record`；draft → published）。 */
export const publishContent = (id: string) =>
  http.request<ContentDetailResult>(
    "post",
    `/api/admin/v1/contents/${id}/publish`
  );

/** 撤回 `POST .../contents/{id}/unpublish`（rbac: `content.publish.record`；published → draft）。 */
export const unpublishContent = (id: string) =>
  http.request<ContentDetailResult>(
    "post",
    `/api/admin/v1/contents/${id}/unpublish`
  );

/** 归档 `POST .../contents/{id}/archive`（rbac: `content.publish.record`；published → archived,终态不可逆）。 */
export const archiveContent = (id: string) =>
  http.request<ContentDetailResult>(
    "post",
    `/api/admin/v1/contents/${id}/archive`
  );

/* ===================== 展示常量(状态非字典驱动;contentTypeCode 走 content_type 字典) ===================== */

/** 内容状态码 → 中文（后端 draft/published/archived）。 */
export const CONTENT_STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档"
};
export const CONTENT_STATUS_TAG: Record<
  string,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  draft: "info",
  published: "success",
  archived: "warning"
};

/** 可见性档位 → 中文（后端 visibilityCode 枚举闭集）。 */
export const VISIBILITY_LABEL: Record<string, string> = {
  public: "公开",
  member: "队员可见",
  formal_member: "正式队员可见",
  department: "指定部门可见",
  management: "管理层可见"
};
export const VISIBILITY_OPTIONS: { value: ContentVisibility; label: string }[] =
  [
    { value: "public", label: "公开" },
    { value: "member", label: "队员可见" },
    { value: "formal_member", label: "正式队员可见" },
    { value: "department", label: "指定部门可见" },
    { value: "management", label: "管理层可见" }
  ];
