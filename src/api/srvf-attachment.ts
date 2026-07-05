import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * 通用附件库（后端 `AttachmentsController`，5 路径）：跨业务对象的附件管理面，
 * 与内容封面/正文附件专用子资源（`contents/{id}/attachments/*`，见 `srvf-content.ts`）
 * 是同一张 Attachment 表的两个入口——内容页走专用子资源，本文件是通用横切入口。
 * ownerType 取值走后端 `attachment_type_configs` 白名单动态配置（见 `srvf-attachment-config.ts`
 * 的 `getTypeConfigs`），不在前端硬编码枚举。字段以 `/api/docs-json` 为准。
 */

export type AttachmentAccessLevel = "PUBLIC" | "INTERNAL" | "SENSITIVE";

/** 附件（后端 `AttachmentResponseDto`）。accessUrl = 签名短链，Provider 不可用时降级 null。 */
export type Attachment = {
  id: string;
  key: string;
  originalName: string;
  mime: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  ownerType: string;
  ownerId: string;
  description: string | null;
  accessLevel: AttachmentAccessLevel | null;
  tags: string[];
  originalUploaderName: string | null;
  expireAt: string | null;
  createdAt: string;
  updatedAt: string;
  accessUrl: string | null;
};

export type AttachmentListQuery = {
  page?: number;
  pageSize?: number;
  ownerType?: string;
  ownerId?: string;
  uploadedBy?: string;
  mime?: string;
  accessLevel?: AttachmentAccessLevel;
};

export type AttachmentByOwnerQuery = {
  ownerType: string;
  ownerId: string;
  page?: number;
  pageSize?: number;
};

/** 更新附件元数据入参（后端 `UpdateAttachmentDto`；仅这 4 个字段可改）。 */
export type UpdateAttachmentBody = {
  description?: string | null;
  accessLevel?: AttachmentAccessLevel;
  tags?: string[];
  expireAt?: string | null;
};

export type GenerateUploadUrlBody = {
  ownerType: string;
  ownerId: string;
  originalName: string;
  mime: string;
  sizeBytes: number;
};

/** signed upload URL 响应（后端 `UploadUrlResponseDto`）。 */
export type UploadUrlResponse = {
  key: string;
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
  uploadMethod: "PUT" | "POST";
  expiresAt: string;
  uploadToken: string;
};

export type ConfirmUploadBody = {
  uploadToken: string;
  checksum?: string;
};

export const ACCESS_LEVEL_LABEL: Record<AttachmentAccessLevel, string> = {
  PUBLIC: "公开",
  INTERNAL: "内部",
  SENSITIVE: "敏感"
};
export const ACCESS_LEVEL_TAG: Record<
  AttachmentAccessLevel,
  "success" | "warning" | "danger"
> = {
  PUBLIC: "success",
  INTERNAL: "warning",
  SENSITIVE: "danger"
};

/** 列出附件 `GET /api/admin/v1/attachments`（分页 + 可选过滤；total 按可见数量返）。`[rbac: attachment.view.*]` */
export const getAttachments = (params?: AttachmentListQuery) =>
  http.request<Envelope<PageResult<Attachment>>>(
    "get",
    "/api/admin/v1/attachments",
    { params }
  );

/** 按 ownerType+ownerId 列出某业务对象全部附件（业务模块常用入口，两参必填）。`[rbac: attachment.view.*]` */
export const getAttachmentsByOwner = (params: AttachmentByOwnerQuery) =>
  http.request<Envelope<PageResult<Attachment>>>(
    "get",
    "/api/admin/v1/attachments/by-owner",
    { params }
  );

/** 附件详情 `GET .../attachments/{id}`（不存在/无权统一 13001，防信息泄漏）。`[rbac: attachment.view.*]` */
export const getAttachment = (id: string) =>
  http.request<Envelope<Attachment>>("get", `/api/admin/v1/attachments/${id}`);

/** 更新附件元数据 `PATCH .../attachments/{id}`。`[rbac: attachment.update.*]` */
export const updateAttachment = (id: string, body: UpdateAttachmentBody) =>
  http.request<Envelope<Attachment>>(
    "patch",
    `/api/admin/v1/attachments/${id}`,
    { data: body }
  );

/** 物理删除附件 `DELETE .../attachments/{id}`——不查跨表引用，删除后其它记录（如内容封面）可能出现悬空引用。`[rbac: attachment.delete.*]` */
export const deleteAttachment = (id: string) =>
  http.request<Envelope<unknown>>("delete", `/api/admin/v1/attachments/${id}`);

/** 申请 signed upload URL（模式 B；不落库不审计）。`[rbac: attachment.upload.*]` */
export const generateUploadUrl = (body: GenerateUploadUrlBody) =>
  http.request<Envelope<UploadUrlResponse>>(
    "post",
    "/api/admin/v1/attachments/upload-url",
    { data: body }
  );

/** 确认上传完成（验 uploadToken + headObject + size 一致 → 落库 + audit）。`[rbac: attachment.upload.*]` */
export const confirmUpload = (body: ConfirmUploadBody) =>
  http.request<Envelope<Attachment>>(
    "post",
    "/api/admin/v1/attachments/confirm-upload",
    { data: body }
  );

/**
 * 附件上传编排（三步：upload-url → 直传存储 → confirm-upload）。
 * 直传用原生 `fetch`（presigned URL，不带 auth 头，故不走 `@/utils/http`）。
 * 镜像 `srvf-content.ts` 的 `uploadContentAttachment`，通用版多传 ownerType/ownerId。
 */
export async function uploadAttachment(
  ownerType: string,
  ownerId: string,
  file: File
): Promise<Attachment> {
  const { code, data } = await generateUploadUrl({
    ownerType,
    ownerId,
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
  const confirmed = await confirmUpload({ uploadToken: data.uploadToken });
  if (confirmed.code !== 0) throw new Error("确认上传失败");
  return confirmed.data;
}
