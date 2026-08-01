import { http } from "@/utils/http";
import { bizErrorMessage } from "@/api/srvf-error";

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
  /**
   * 按当前时间派生的阶段(后端算,前端直读不自算)。
   * 与 `statusCode` 是**两根轴**:`statusCode` 是生命周期(draft/published/completed/cancelled),
   * `phase` 只讲时间(活动还没开始 / 正在进行 / 已经结束)。判断「该提醒去完结了」用 `phase === "ended"`。
   */
  phase: "upcoming" | "ongoing" | "ended";
  isPublicRegistration: boolean;
  requiresInsurance: boolean;
  coverImageUrl: string | null;
  locationLongitude: string | null;
  locationLatitude: string | null;
  createdAt: string;
  updatedAt: string;
  /** 报名人数（仅 includeStats=true 时返回） */
  registrationCount?: number;
  /** 考勤单数（仅 includeStats=true 时返回） */
  attendanceSheetCount?: number;
};

export type ActivityListQuery = {
  page?: number;
  pageSize?: number;
  statusCode?: string;
  activityTypeCode?: string;
  organizationId?: string;
  isPublicRegistration?: boolean;
  q?: string;
  /** 起始时间过滤（ISO 8601，含） */
  dateFrom?: string;
  /** 截止时间过滤（ISO 8601，含） */
  dateTo?: string;
  includeDescendants?: boolean;
  /** true 时列表项附带 registrationCount / attendanceSheetCount */
  includeStats?: boolean;
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
 * 发布活动入参（后端 `PublishActivityDto`）。
 * 后端 v0.50 起 **body 必填**，且 `requiresInsuranceConfirmed` 只接受 `true`——
 * 缺失 / false 一律 400。语义是「操作者已当面核对过本活动的保险要求」，
 * 因此调用侧必须由人在弹窗里显式勾选后才传，**不得写死默认值绕过核对**。
 */
export type PublishActivityBody = {
  /** 确认已核对本活动保险要求；只能为 true */
  requiresInsuranceConfirmed: true;
};

/**
 * 发布活动 `PATCH /api/admin/v1/activities/{id}/publish`（rbac: `activity.publish.record`）。
 * body 必填 `{requiresInsuranceConfirmed:true}`（v0.50 起；不传 = 400）。
 * draft → published；非 draft → 后端 20030「活动当前状态不允许此操作」。
 * 发布时后端复检 `endAt > now` 与报名截止未过。
 */
export const publishActivity = (id: string, body: PublishActivityBody) =>
  http.request<ActivityMutationResult>(
    "patch",
    `/api/admin/v1/activities/${id}/publish`,
    { data: body }
  );

/**
 * 完结活动 `POST /api/admin/v1/activities/{id}/complete`（rbac: `activity.complete.record`）。
 * **无 body**。published → completed，且这是 v0.50 起的**唯一完结通路**——
 * 考勤提交不再推进活动状态，没有这个按钮活动会永远停在「已发布」，
 * 参与核对 / 评价率等一切 completed 依赖功能都够不到。
 * 完结后仍可补录考勤，但不可新报名 / 审批通过。
 *
 * ⚠️ **两个前置条件，缺一个都返 20030**（本地实测 2026-08-01 确认；
 * 状态机注释与 handoff 都只写了第一条，第二条只存在于 service 实现里）：
 * 1. `statusCode === "published"`；
 * 2. `phase === "ended"`——活动时间必须已经结束。
 * 所以按钮的显示条件必须**两条都满足**，否则就是个点了必报错的死按钮。
 */
export const completeActivity = (id: string) =>
  http.request<ActivityMutationResult>(
    "post",
    `/api/admin/v1/activities/${id}/complete`
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

/* ----------------------------- 活动域错误码 → 人话 ----------------------------- */

/**
 * 活动域业务码 → 人话文案（三段式:出了什么事 / 为什么 / 怎么办）。
 * 码义来源 = 后端 handoff `admin-web.md` §2.1 与 live `/api/docs-json`，禁臆造。
 * 与 `bizErrorMessage` 链式组合：`activityBizErrorMessage(error, "发布失败")`。
 */
export function activityBizErrorMessage(
  error: unknown,
  fallback: string
): string {
  const data = (
    error as { response?: { data?: { code?: unknown; message?: string } } }
  )?.response?.data;
  const code = Number(data?.code);
  if (code === 20030)
    return "活动当前状态不允许这个操作（20030）：可能已被他人发布/取消/完结，请刷新后按最新状态重试";
  if (code === 20122)
    return "活动已取消（20122）：不能再新增或修改考勤记录；如需清理，请到考勤面处理既有单据";
  if (code === 20124)
    return "活动已取消、已完结或已结束（20124）：不能再通过报名；仍可驳回或取消残留的待审报名";
  if (code === 20126) return "活动还是草稿（20126）：先发布活动，才能审批报名";
  return bizErrorMessage(error, fallback);
}
