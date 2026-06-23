import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** 内容附件（后端 `ContentAttachmentDto`；详情内展示）。url = 过可见级的签名 URL（可空）。 */
export type ContentAttachment = {
  id: string;
  kind: string;
  mime: string;
  originalName: string;
  size: number;
  url: string | null;
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

/* ===================== 封面/附件上传(signed-URL 三步;需存储 provider 就绪) ===================== */

export type ContentUploadUrlBody = {
  kind: "image" | "file";
  originalName: string;
  mime: string;
  sizeBytes: number;
};
export type ContentUploadUrl = {
  key: string;
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
  uploadMethod: "PUT" | "POST";
  expiresAt: string;
  uploadToken: string;
};
/** 附件完整响应（后端 `AttachmentResponseDto`）。 */
export type ContentAttachmentFull = {
  id: string;
  key: string;
  originalName: string;
  mime: string;
  size: number;
  ownerType: string;
  ownerId: string;
  accessUrl: string | null;
};

/** 取附件上传 URL `POST .../contents/{id}/attachments/upload-url`（rbac: `attachment.upload.*`）。 */
export const getContentUploadUrl = (id: string, body: ContentUploadUrlBody) =>
  http.request<Envelope<ContentUploadUrl>>(
    "post",
    `/api/admin/v1/contents/${id}/attachments/upload-url`,
    { data: body }
  );

/** 确认附件上传 `POST .../contents/{id}/attachments/confirm`（`[auth]` + token）。 */
export const confirmContentUpload = (
  id: string,
  body: { uploadToken: string; etag?: string; checksum?: string }
) =>
  http.request<Envelope<ContentAttachmentFull>>(
    "post",
    `/api/admin/v1/contents/${id}/attachments/confirm`,
    { data: body }
  );

/** 删内容附件 `DELETE .../contents/{id}/attachments/{attachmentId}`（rbac: `attachment.delete.*`）。 */
export const deleteContentAttachment = (id: string, attachmentId: string) =>
  http.request<Envelope<unknown>>(
    "delete",
    `/api/admin/v1/contents/${id}/attachments/${attachmentId}`
  );

/** 设/清封面 `PUT .../contents/{id}/cover`（rbac: `content.update.record`；attachmentId=本文章 content-image 附件）。 */
export const setContentCover = (id: string, attachmentId: string) =>
  http.request<ContentDetailResult>(
    "put",
    `/api/admin/v1/contents/${id}/cover`,
    { data: { attachmentId } }
  );

/**
 * 附件上传编排(三步:upload-url → 直传存储 → confirm)。
 * 存储直传用原生 `fetch`(presigned URL,不带 auth 头,故不走 @/utils/http)。
 * 注:依赖存储 provider(LOCAL/COS)就绪 + 直传端 CORS;需联机验证。
 */
export async function uploadContentAttachment(
  contentId: string,
  file: File
): Promise<ContentAttachmentFull> {
  const kind: "image" | "file" = file.type.startsWith("image/")
    ? "image"
    : "file";
  const { code, data } = await getContentUploadUrl(contentId, {
    kind,
    originalName: file.name,
    mime: file.type || "application/octet-stream",
    sizeBytes: file.size
  });
  if (code !== 0) throw new Error("获取上传地址失败");
  const res = await fetch(data.uploadUrl, {
    method: data.uploadMethod,
    headers: data.uploadHeaders,
    body: file
  });
  if (!res.ok) throw new Error(`直传存储失败(${res.status})`);
  const etag = res.headers.get("etag") ?? undefined;
  const confirmed = await confirmContentUpload(contentId, {
    uploadToken: data.uploadToken,
    ...(etag ? { etag } : {})
  });
  if (confirmed.code !== 0) throw new Error("确认上传失败");
  return confirmed.data;
}
