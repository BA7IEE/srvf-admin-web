import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** 可见档(后端 visibilityCode 闭集,**去 public**,会员面专属)。 */
export type NotificationVisibility =
  | "member"
  | "formal_member"
  | "department"
  | "management";

/** 渠道(后端 channels 枚举;站内恒发,后端强制含 in-app)。 */
export type NotificationChannel = "in-app" | "wechat" | "sms";

/** 通知列表项(后端 `NotificationAdminListItemDto`;字段以 `/api/docs-json` 为准;列表不含 body)。 */
export type NotificationListItem = {
  id: string;
  title: string;
  notificationTypeCode: string;
  statusCode: string;
  visibilityCode: string;
  audienceType: string;
  sourceType: string;
  channels: string[];
  pinned: boolean;
  readCount: number;
  publishedAt: string | null;
  authorUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 通知详情(含 body + 可见部门;readCount 回显不自增)。 */
export type NotificationDetail = NotificationListItem & {
  body: string;
  visibleOrganizationIds: string[];
};

/** 新建通知入参(后端 `CreateNotificationDto`;create → draft)。 */
export type CreateNotificationBody = {
  title: string;
  body: string;
  notificationTypeCode: string;
  visibilityCode: NotificationVisibility;
  visibleOrganizationIds?: string[];
  pinned?: boolean;
  /** 不传 = 仅站内;后端强制含 in-app。短信仅声明可兜底,永不随 publish 自动发。 */
  channels?: NotificationChannel[];
};

/** 更新通知入参(draft/published 可改,archived 冻结 → 31030)。 */
export type UpdateNotificationBody = Partial<CreateNotificationBody>;

export type NotificationListQuery = {
  page?: number;
  pageSize?: number;
  statusCode?: string;
  notificationTypeCode?: string;
  visibilityCode?: string;
  pinned?: boolean;
};

/** 短信兜底结果(confirmed=false 仅预览 recipientCount,零发送)。 */
export type SendSmsResult = {
  confirmed: boolean;
  recipientCount: number;
  sent: number;
  failed: number;
  skipped: number;
};

/** 微信订阅模板配置项(后端 `WechatSubscribeTemplateDto`)。 */
export type WechatTemplate = {
  notificationTypeCode: string;
  templateId: string | null;
  enabled: boolean;
  remarks: string | null;
  updatedBy: string | null;
  updatedAt: string;
};

export type NotificationListResult = Envelope<PageResult<NotificationListItem>>;
export type NotificationDetailResult = Envelope<NotificationDetail>;

/** 通知分页列表 `GET /api/admin/v1/notifications`(rbac: `notification.read.record`;admin 见全部状态全可见档)。 */
export const getNotifications = (params?: NotificationListQuery) =>
  http.request<NotificationListResult>("get", "/api/admin/v1/notifications", {
    params
  });

/** 通知详情 `GET .../notifications/{id}`(rbac: `notification.read.record`;readCount 不自增)。 */
export const getNotification = (id: string) =>
  http.request<NotificationDetailResult>(
    "get",
    `/api/admin/v1/notifications/${id}`
  );

/** 新建通知草稿 `POST .../notifications`(rbac: `notification.create.record`;→ draft)。 */
export const createNotification = (body: CreateNotificationBody) =>
  http.request<NotificationDetailResult>(
    "post",
    "/api/admin/v1/notifications",
    {
      data: body
    }
  );

/** 更新通知 `PATCH .../notifications/{id}`(rbac: `notification.update.record`)。 */
export const updateNotification = (id: string, body: UpdateNotificationBody) =>
  http.request<NotificationDetailResult>(
    "patch",
    `/api/admin/v1/notifications/${id}`,
    { data: body }
  );

/** 软删通知 `DELETE .../notifications/{id}`(rbac: `notification.delete.record`;任意态)。 */
export const deleteNotification = (id: string) =>
  http.request<Envelope<null>>("delete", `/api/admin/v1/notifications/${id}`);

/** 发布 `POST .../notifications/{id}/publish`(rbac: `notification.publish.record`;draft → published)。 */
export const publishNotification = (id: string) =>
  http.request<NotificationDetailResult>(
    "post",
    `/api/admin/v1/notifications/${id}/publish`
  );

/** 撤回 `POST .../notifications/{id}/unpublish`(rbac: `notification.publish.record`;published → draft)。 */
export const unpublishNotification = (id: string) =>
  http.request<NotificationDetailResult>(
    "post",
    `/api/admin/v1/notifications/${id}/unpublish`
  );

/** 归档 `POST .../notifications/{id}/archive`(rbac: `notification.publish.record`;published → archived,终态)。 */
export const archiveNotification = (id: string) =>
  http.request<NotificationDetailResult>(
    "post",
    `/api/admin/v1/notifications/${id}/archive`
  );

/**
 * 短信兜底 `POST .../notifications/{id}/send-sms`(rbac: `notification.send.sms`)。
 * **计费二次确认**:先 `confirmed:false` 预览 recipientCount(零发送),用户确认后 `confirmed:true` 真发。
 * 前置:已发布 + channels 含 sms(否则 31013);通道未配 24030。
 */
export const sendNotificationSms = (id: string, confirmed: boolean) =>
  http.request<Envelope<SendSmsResult>>(
    "post",
    `/api/admin/v1/notifications/${id}/send-sms`,
    { data: { confirmed } }
  );

/** 列微信订阅模板配置 `GET .../notification-wechat-templates`(rbac: `notification.read.record`)。 */
export const getWechatTemplates = () =>
  http.request<Envelope<WechatTemplate[]>>(
    "get",
    "/api/admin/v1/notification-wechat-templates"
  );

/** 配置某类型微信模板 `PUT .../notification-wechat-templates/{typeCode}`(rbac: `notification.update.template`;upsert)。 */
export const putWechatTemplate = (
  typeCode: string,
  body: { templateId?: string; enabled?: boolean; remarks?: string }
) =>
  http.request<Envelope<WechatTemplate>>(
    "put",
    `/api/admin/v1/notification-wechat-templates/${typeCode}`,
    { data: body }
  );

/* ===================== 展示常量(状态机非字典驱动;notificationTypeCode 走 notification_type 字典) ===================== */

/** 通知状态码 → 中文(后端 draft/published/archived)。 */
export const NOTIFICATION_STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档"
};
export const NOTIFICATION_STATUS_TAG: Record<
  string,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  draft: "info",
  published: "success",
  archived: "warning"
};

/** 可见档 → 中文(4 选 1,去 public)。 */
export const VISIBILITY_LABEL: Record<string, string> = {
  member: "队员可见",
  formal_member: "正式队员可见",
  department: "指定部门可见",
  management: "管理层可见"
};
export const VISIBILITY_OPTIONS: {
  value: NotificationVisibility;
  label: string;
}[] = [
  { value: "member", label: "队员可见" },
  { value: "formal_member", label: "正式队员可见" },
  { value: "department", label: "指定部门可见" },
  { value: "management", label: "管理层可见" }
];

/** 渠道 → 中文。 */
export const CHANNEL_LABEL: Record<string, string> = {
  "in-app": "站内",
  wechat: "微信",
  sms: "短信"
};
export const CHANNEL_OPTIONS: { value: NotificationChannel; label: string }[] =
  [
    { value: "in-app", label: "站内(恒发)" },
    { value: "wechat", label: "微信订阅" },
    { value: "sms", label: "短信兜底" }
  ];
