import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/* ============================ 附件类型配置(type) ============================ */
export type AttachmentTypeConfig = {
  id: string;
  code: string;
  displayName: string;
  description: string | null;
  ownerTable: string;
  defaultMaxSizeBytes: number | null;
  defaultMimeWhitelist: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
};
export type CreateTypeConfigBody = {
  code: string;
  displayName: string;
  description?: string;
  ownerTable: string;
  defaultMaxSizeBytes?: number;
  defaultMimeWhitelist?: string[];
};
export type UpdateTypeConfigBody = {
  displayName?: string;
  description?: string;
  ownerTable?: string;
  defaultMaxSizeBytes?: number;
  defaultMimeWhitelist?: string[];
};

/** rbac: attachment-config.read.type */
export const getTypeConfigs = (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}) =>
  http.request<Envelope<PageResult<AttachmentTypeConfig>>>(
    "get",
    "/api/system/v1/attachment-type-configs",
    { params }
  );
/** rbac: attachment-config.create.type */
export const createTypeConfig = (body: CreateTypeConfigBody) =>
  http.request<Envelope<AttachmentTypeConfig>>(
    "post",
    "/api/system/v1/attachment-type-configs",
    { data: body }
  );
/** rbac: attachment-config.update.type */
export const updateTypeConfig = (id: string, body: UpdateTypeConfigBody) =>
  http.request<Envelope<AttachmentTypeConfig>>(
    "patch",
    `/api/system/v1/attachment-type-configs/${id}`,
    { data: body }
  );
export const updateTypeConfigStatus = (id: string, status: string) =>
  http.request<Envelope<AttachmentTypeConfig>>(
    "patch",
    `/api/system/v1/attachment-type-configs/${id}/status`,
    { data: { status } }
  );
/** rbac: attachment-config.delete.type */
export const deleteTypeConfig = (id: string) =>
  http.request<Envelope<AttachmentTypeConfig>>(
    "delete",
    `/api/system/v1/attachment-type-configs/${id}`
  );

/* ============================ 附件 MIME 配置(mime) ============================ */
export type AttachmentMimeConfig = {
  id: string;
  typeConfigId: string;
  mime: string;
  status: string;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
};
export type CreateMimeConfigBody = {
  typeConfigId: string;
  mime: string;
  remark?: string;
};

/** rbac: attachment-config.read.mime */
export const getMimeConfigs = (params?: {
  page?: number;
  pageSize?: number;
  typeConfigId?: string;
  status?: string;
}) =>
  http.request<Envelope<PageResult<AttachmentMimeConfig>>>(
    "get",
    "/api/system/v1/attachment-mime-configs",
    { params }
  );
/** rbac: attachment-config.create.mime */
export const createMimeConfig = (body: CreateMimeConfigBody) =>
  http.request<Envelope<AttachmentMimeConfig>>(
    "post",
    "/api/system/v1/attachment-mime-configs",
    { data: body }
  );
export const updateMimeConfigStatus = (id: string, status: string) =>
  http.request<Envelope<AttachmentMimeConfig>>(
    "patch",
    `/api/system/v1/attachment-mime-configs/${id}/status`,
    { data: { status } }
  );
/** rbac: attachment-config.delete.mime */
export const deleteMimeConfig = (id: string) =>
  http.request<Envelope<AttachmentMimeConfig>>(
    "delete",
    `/api/system/v1/attachment-mime-configs/${id}`
  );

/* ======================= 附件尺寸限制配置(size-limit) ======================= */
export type AttachmentSizeLimitConfig = {
  id: string;
  typeConfigId: string;
  maxSizeBytes: number;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
};
export type CreateSizeLimitConfigBody = {
  typeConfigId: string;
  maxSizeBytes: number;
  remark?: string;
};
export type UpdateSizeLimitConfigBody = {
  maxSizeBytes?: number;
  remark?: string;
};

/** rbac: attachment-config.read.size-limit */
export const getSizeLimitConfigs = (params?: {
  page?: number;
  pageSize?: number;
  typeConfigId?: string;
}) =>
  http.request<Envelope<PageResult<AttachmentSizeLimitConfig>>>(
    "get",
    "/api/system/v1/attachment-size-limit-configs",
    { params }
  );
/** rbac: attachment-config.create.size-limit */
export const createSizeLimitConfig = (body: CreateSizeLimitConfigBody) =>
  http.request<Envelope<AttachmentSizeLimitConfig>>(
    "post",
    "/api/system/v1/attachment-size-limit-configs",
    { data: body }
  );
/** rbac: attachment-config.update.size-limit */
export const updateSizeLimitConfig = (
  id: string,
  body: UpdateSizeLimitConfigBody
) =>
  http.request<Envelope<AttachmentSizeLimitConfig>>(
    "patch",
    `/api/system/v1/attachment-size-limit-configs/${id}`,
    { data: body }
  );
/** rbac: attachment-config.delete.size-limit */
export const deleteSizeLimitConfig = (id: string) =>
  http.request<Envelope<AttachmentSizeLimitConfig>>(
    "delete",
    `/api/system/v1/attachment-size-limit-configs/${id}`
  );
