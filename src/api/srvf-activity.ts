import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** 活动列表项（后端 `ActivityListItemDto`）。字段以 `/api/docs-json` 为准，勿前端臆造。 */
export type ActivityItem = {
  id: string;
  title: string;
  activityTypeCode: string;
  organizationId: string;
  startAt: string;
  endAt: string;
  location: string;
  description: string | null;
  capacity: number | null;
  genderRequirementCode: string | null;
  registrationDeadline: string | null;
  statusCode: string;
  isPublicRegistration: boolean;
  requiresInsurance: boolean;
  coverImageUrl: string | null;
  locationLongitude: string | null;
  locationLatitude: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ActivityListQuery = {
  page?: number;
  pageSize?: number;
  statusCode?: string;
  activityTypeCode?: string;
  organizationId?: string;
  isPublicRegistration?: boolean;
};
export type ActivityListResult = Envelope<PageResult<ActivityItem>>;

/**
 * 活动分页列表 `GET /api/admin/v1/activities`。
 * 该端点是 **`[auth]`-only（仅需登录，无 RBAC 读码）**;可见性由后端按角色强制
 * （USER 只见 published/completed，忽略入参 statusCode）。前端不另设 hasPerms 码门。
 */
export const getActivities = (params?: ActivityListQuery) =>
  http.request<ActivityListResult>("get", "/api/admin/v1/activities", {
    params
  });

/** 选择器项（后端 `ActivityOptionItemDto`）。 */
export type ActivityOptionItem = {
  id: string;
  label: string;
  startAt: string;
  statusCode: string;
};

/**
 * 活动选择器投影 `GET /api/admin/v1/activities/options`（`[auth]`-only,USER 强制只见
 * published/completed）。q 模糊命中 title；limit ≤100（后端硬校验,同 members/positions/organizations
 * 的 options 端点）。
 */
export const getActivityOptions = (params?: {
  q?: string;
  statusCode?: string;
  organizationId?: string;
  limit?: number;
}) =>
  http.request<Envelope<{ items: ActivityOptionItem[] }>>(
    "get",
    "/api/admin/v1/activities/options",
    { params }
  );

/**
 * 活动详情（后端 `ActivityResponseDto`，列表项的超集）。字段以 `/api/docs-json` 为准，勿前端臆造。
 * 在列表项基础上多出：报名补充说明 + 发布/取消审计字段 + 报名表/相册/正文 Json（本轮头部仅用基础字段）。
 */
export type ActivityDetail = ActivityItem & {
  /** 报名补充说明（可空；≤ 500） */
  registrationNotes: string | null;
  /** 发布人 User.id（发布前为 null） */
  publishedBy: string | null;
  /** 发布时间（发布前为 null） */
  publishedAt: string | null;
  /** 取消人 User.id（取消前为 null） */
  cancelledBy: string | null;
  /** 取消时间（取消前为 null） */
  cancelledAt: string | null;
  /** 取消原因（取消前为 null） */
  cancelReason: string | null;
  /** 报名表自定义字段 schema（Json；后端不做嵌套校验） */
  registrationSchema: Record<string, unknown> | null;
  /** 相册图片 URL 数组（Json） */
  galleryImageUrls: string[] | null;
  /** 正文内容（Json；前端约定结构，后端不解析） */
  content: Record<string, unknown> | null;
};
export type ActivityDetailResult = Envelope<ActivityDetail>;

/**
 * 活动详情 `GET /api/admin/v1/activities/{id}`。
 * 与列表同为 **`[auth]`-only（仅需登录，无 RBAC 读码）**;可见性由后端按角色强制
 * （Q-A7：USER 仅可见 published/completed，其余 → 404）。前端不另设 hasPerms 码门。
 */
export const getActivity = (id: string) =>
  http.request<ActivityDetailResult>("get", `/api/admin/v1/activities/${id}`);

/* ----------------------------- 活动 写操作 ----------------------------- */

/**
 * 创建活动入参（后端 `CreateActivityDto`；字段以 `/api/docs-json` 为准）。
 * 仅含本轮范围内的「必填 + 简单可选」字段；复杂字段
 * （registrationSchema / content / galleryImageUrls / coverImageUrl / 经纬度）
 * 本轮**不做**，不放进表单也不提交。后端创建后 initial statusCode=draft。
 */
export type CreateActivityBody = {
  /** 活动标题（必填；≤ 200） */
  title: string;
  /** 活动类型字典 code（必填；≤ 64；typeCode=activity_type） */
  activityTypeCode: string;
  /** 承办组织节点 Organization.id（必填；≤ 64；不允许根节点） */
  organizationId: string;
  /** 开始时间（必填；ISO 8601） */
  startAt: string;
  /** 结束时间（必填；ISO 8601；必须晚于 startAt） */
  endAt: string;
  /** 活动地点（必填；≤ 200） */
  location: string;
  /** 短说明（可选；≤ 500） */
  description?: string;
  /** 名额上限（可选；不传 = 不限名额；≥ 1） */
  capacity?: number;
  /** 性别限制字典 code（可选；≤ 64；typeCode=gender_requirement） */
  genderRequirementCode?: string;
  /** 报名截止时间（可选；ISO 8601） */
  registrationDeadline?: string;
  /** 报名补充说明（可选；≤ 500） */
  registrationNotes?: string;
  /** 是否公开报名（可选；后端默认 true） */
  isPublicRegistration?: boolean;
  /** 是否要求保险（可选；后端默认 false） */
  requiresInsurance?: boolean;
};

/**
 * 更新活动入参（后端 `UpdateActivityDto`；全部可选 PATCH 语义）。
 * 与创建同一字段子集，复杂字段本轮同样不做；后端：cancelled 状态拒改、
 * 禁改 statusCode / publishedBy/At / cancelledBy/At/Reason（前端不提交这些）。
 */
export type UpdateActivityBody = Partial<CreateActivityBody>;

/** 取消活动入参（后端 `CancelActivityDto`；cancelReason 可选 ≤ 500）。 */
export type CancelActivityBody = {
  /** 取消原因（可选；≤ 500） */
  cancelReason?: string;
};

export type ActivityMutationResult = Envelope<ActivityItem>;

/** 创建活动 `POST /api/admin/v1/activities`（rbac: `activity.create.record`） */
export const createActivity = (body: CreateActivityBody) =>
  http.request<ActivityMutationResult>("post", "/api/admin/v1/activities", {
    data: body
  });

/** 部分更新活动 `PATCH /api/admin/v1/activities/{id}`（rbac: `activity.update.record`） */
export const updateActivity = (id: string, body: UpdateActivityBody) =>
  http.request<ActivityMutationResult>(
    "patch",
    `/api/admin/v1/activities/${id}`,
    { data: body }
  );

/**
 * 软删活动 `DELETE /api/admin/v1/activities/{id}`（rbac: `activity.delete.record`）。
 * 后端写 deletedAt；删除 ≠ 取消，cancelled 仍允许软删。
 */
export const deleteActivity = (id: string) =>
  http.request<Envelope<ActivityItem | null>>(
    "delete",
    `/api/admin/v1/activities/${id}`
  );

/**
 * 发布活动 `PATCH /api/admin/v1/activities/{id}/publish`（rbac: `activity.publish.record`）。
 * 无 body；draft → published；非 draft → 后端 20030「活动当前状态不允许此操作」。
 */
export const publishActivity = (id: string) =>
  http.request<ActivityMutationResult>(
    "patch",
    `/api/admin/v1/activities/${id}/publish`
  );

/**
 * 取消活动 `PATCH /api/admin/v1/activities/{id}/cancel`（rbac: `activity.cancel.record`）。
 * body=CancelActivityDto；* → cancelled；已 cancelled → 后端 20030。
 */
export const cancelActivity = (id: string, body: CancelActivityBody) =>
  http.request<ActivityMutationResult>(
    "patch",
    `/api/admin/v1/activities/${id}/cancel`,
    { data: body }
  );
