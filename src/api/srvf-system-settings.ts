import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/* ============================================================================
 * 系统设置 — 四个单例(storage / sms / wechat / realname)
 * 共性:GET 返单例(不存在 data=null;凭证一律不回显,只给 credentialStatus/credentialConfigured)。
 * PATCH upsert 改**非凭证**字段(传凭证字段会被后端拒绝)。
 * 凭证只能经 reset-credentials(**仅 SUPER_ADMIN**,AES 加密落库,响应不回显)。
 * ========================================================================== */

type SettingsBase = {
  id: string;
  providerType: string;
  enabled: boolean;
  credentialStatus: string;
  credentialConfigured: boolean;
  remarks: string | null;
  updatedBy: string | null;
  updatedAt: string;
  createdAt: string;
};

/* ---------- 存储设置 ---------- */
export type StorageSettings = SettingsBase & {
  bucket: string | null;
  region: string | null;
  envPrefix: string | null;
  uploadUrlTtlSeconds: number;
  downloadUrlTtlSeconds: number;
  lifecycleDays: number;
  enableSignedUrl: boolean;
  enableVersioning: boolean;
  corsAllowedOrigins: string[] | null;
  maxObjectSizeBytes: number | null;
  allowedMimePolicyMode: string;
};
export type UpdateStorageSettingsBody = {
  providerType?: string;
  enabled?: boolean;
  bucket?: string;
  region?: string;
  envPrefix?: string;
  uploadUrlTtlSeconds?: number;
  downloadUrlTtlSeconds?: number;
  lifecycleDays?: number;
  enableSignedUrl?: boolean;
  enableVersioning?: boolean;
  remarks?: string;
};
export const getStorageSettings = () =>
  http.request<Envelope<StorageSettings | null>>(
    "get",
    "/api/system/v1/storage-settings"
  );
export const updateStorageSettings = (body: UpdateStorageSettingsBody) =>
  http.request<Envelope<StorageSettings>>(
    "patch",
    "/api/system/v1/storage-settings",
    { data: body }
  );
export const resetStorageCredentials = (body: {
  secretId: string;
  secretKey: string;
}) =>
  http.request<Envelope<StorageSettings>>(
    "post",
    "/api/system/v1/storage-settings/reset-credentials",
    { data: body }
  );

/* ---------- 短信设置 ---------- */
export type SmsSettings = SettingsBase & {
  sdkAppId: string | null;
  signName: string | null;
  region: string | null;
  templateIdVerifyCode: string | null;
  templateIdBirthday: string | null;
};
export type UpdateSmsSettingsBody = {
  providerType?: string;
  enabled?: boolean;
  sdkAppId?: string;
  signName?: string;
  region?: string;
  templateIdVerifyCode?: string;
  templateIdBirthday?: string;
  remarks?: string;
};
export const getSmsSettings = () =>
  http.request<Envelope<SmsSettings | null>>(
    "get",
    "/api/system/v1/sms-settings"
  );
export const updateSmsSettings = (body: UpdateSmsSettingsBody) =>
  http.request<Envelope<SmsSettings>>("patch", "/api/system/v1/sms-settings", {
    data: body
  });
export const resetSmsCredentials = (body: {
  secretId: string;
  secretKey: string;
}) =>
  http.request<Envelope<SmsSettings>>(
    "post",
    "/api/system/v1/sms-settings/reset-credentials",
    { data: body }
  );

/* ---------- 微信设置 ---------- */
export type WechatSettings = SettingsBase & { appId: string | null };
export type UpdateWechatSettingsBody = {
  providerType?: string;
  enabled?: boolean;
  appId?: string;
  remarks?: string;
};
export const getWechatSettings = () =>
  http.request<Envelope<WechatSettings | null>>(
    "get",
    "/api/system/v1/wechat-settings"
  );
export const updateWechatSettings = (body: UpdateWechatSettingsBody) =>
  http.request<Envelope<WechatSettings>>(
    "patch",
    "/api/system/v1/wechat-settings",
    { data: body }
  );
export const resetWechatCredentials = (body: { appSecret: string }) =>
  http.request<Envelope<WechatSettings>>(
    "post",
    "/api/system/v1/wechat-settings/reset-credentials",
    { data: body }
  );

/* ---------- 实名核验设置 ---------- */
export type RealnameSettings = SettingsBase & { region: string | null };
export type UpdateRealnameSettingsBody = {
  providerType?: string;
  enabled?: boolean;
  region?: string;
  remarks?: string;
};
export const getRealnameSettings = () =>
  http.request<Envelope<RealnameSettings | null>>(
    "get",
    "/api/system/v1/realname-settings"
  );
export const updateRealnameSettings = (body: UpdateRealnameSettingsBody) =>
  http.request<Envelope<RealnameSettings>>(
    "patch",
    "/api/system/v1/realname-settings",
    { data: body }
  );
export const resetRealnameCredentials = (body: {
  secretId: string;
  secretKey: string;
}) =>
  http.request<Envelope<RealnameSettings>>(
    "post",
    "/api/system/v1/realname-settings/reset-credentials",
    { data: body }
  );

/* ============================ 短信日志(只读) ============================ */

/** 短信发送日志（后端 `SmsSendLogResponseDto`；手机号掩码 138****1234）。 */
export type SmsSendLog = {
  id: string;
  phone: string;
  templateKey: string;
  providerType: string;
  status: string;
  providerMsgId: string | null;
  errCode: string | null;
  errMsg: string | null;
  codeId: string | null;
  createdAt: string;
};
export type SmsSendLogListQuery = {
  page?: number;
  pageSize?: number;
  status?: string;
  phone?: string;
};
export const getSmsSendLogs = (params?: SmsSendLogListQuery) =>
  http.request<Envelope<PageResult<SmsSendLog>>>(
    "get",
    "/api/system/v1/sms-send-logs",
    { params }
  );

/** 发送状态 code → tag 展示色(冗余键做历史数据兜底,未知码回退 info) */
export const SMS_STATUS_TAG: Record<
  string,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  SENT: "success",
  SUCCESS: "success",
  FAILED: "danger",
  PENDING: "warning"
};

/** 发送状态 → 中文(契约 v0.37.0 已固化 enum ['SENT','FAILED'];未知码回退原文) */
export const SMS_STATUS_LABEL: Record<string, string> = {
  SENT: "已发送",
  SUCCESS: "已发送",
  FAILED: "发送失败",
  PENDING: "发送中"
};
