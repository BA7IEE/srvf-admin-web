import { http } from "@/utils/http";
import { activityBizErrorMessage } from "@/api/srvf-activity";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** 活动报名列表项（后端 `ActivityRegistrationListItemDto`）。字段以 `/api/docs-json` 为准。 */
export type RegistrationItem = {
  id: string;
  activityId: string;
  memberId: string;
  memberNo: string | null;
  memberDisplayName: string | null;
  statusCode: string;
  registeredAt: string;
  reviewedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

export type RegistrationListQuery = {
  page?: number;
  pageSize?: number;
  statusCode?: string;
};
export type RegistrationListResult = Envelope<PageResult<RegistrationItem>>;

/**
 * 某活动的报名分页列表（含已取消 / 已拒绝）。
 * `GET /api/admin/v1/activities/{activityId}/registrations`（rbac: `activity-registration.read.record`）。
 * 报名与活动强耦合,故须先选活动。
 */
export const getActivityRegistrations = (
  activityId: string,
  params?: RegistrationListQuery
) =>
  http.request<RegistrationListResult>(
    "get",
    `/api/admin/v1/activities/${activityId}/registrations`,
    { params }
  );

/* --------------------------- 报名 审批 写操作 --------------------------- */

/** 审核通过入参（后端 `ApproveRegistrationDto`；字段以 `/api/docs-json` 为准）。 */
export type ApproveRegistrationBody = {
  /** 审核备注（可选；≤ 500） */
  reviewNote?: string;
};

/** 审核拒绝入参（后端 `RejectRegistrationDto`）。 */
export type RejectRegistrationBody = {
  /** 拒绝理由（必填；≤ 500） */
  reviewNote: string;
};

/** 代取消入参（后端 `CancelRegistrationDto`）。 */
export type CancelRegistrationBody = {
  /** 取消原因（可选；≤ 500） */
  cancelReason?: string;
};

/**
 * 写操作返回单条报名（与 `ActivityMutationResult` 同形）。
 * 200 body 契约未声明 schema，前端不消费返回值（成功后刷新列表），按既有约定回 `RegistrationItem`。
 */
export type RegistrationMutationResult = Envelope<RegistrationItem>;

/**
 * 审核通过 `PATCH /api/admin/v1/activities/{activityId}/registrations/{id}/approve`
 * （rbac: `activity-registration.approve.record`）。
 * pending → pass（含 capacity 复核）；非法流转后端返 21030,名额已满另有码 → 弹其 message。
 */
export const approveRegistration = (
  activityId: string,
  id: string,
  body: ApproveRegistrationBody
) =>
  http.request<RegistrationMutationResult>(
    "patch",
    `/api/admin/v1/activities/${activityId}/registrations/${id}/approve`,
    { data: body }
  );

/**
 * 审核拒绝 `PATCH /api/admin/v1/activities/{activityId}/registrations/{id}/reject`
 * （rbac: `activity-registration.reject.record`）。
 * pending → reject；`reviewNote` 必填；非法流转后端返 21030 → 弹其 message。
 */
export const rejectRegistration = (
  activityId: string,
  id: string,
  body: RejectRegistrationBody
) =>
  http.request<RegistrationMutationResult>(
    "patch",
    `/api/admin/v1/activities/${activityId}/registrations/${id}/reject`,
    { data: body }
  );

/**
 * 管理员代取消 `PATCH /api/admin/v1/activities/{activityId}/registrations/{id}/cancel`
 * （rbac: `activity-registration.cancel.record`）。
 * pending|pass → cancelled（释放名额）；非法流转后端返 21030 → 弹其 message。
 */
export const cancelRegistration = (
  activityId: string,
  id: string,
  body: CancelRegistrationBody
) =>
  http.request<RegistrationMutationResult>(
    "patch",
    `/api/admin/v1/activities/${activityId}/registrations/${id}/cancel`,
    { data: body }
  );

/* ----------------------------- 代报名 写操作 ----------------------------- */

/**
 * ADMIN 代报名入参（后端 `CreateRegistrationDto`；字段以 `/api/docs-json` 为准）。
 * 本轮仅 `memberId`（必填）；`extras`（扩展 Json,后端不做嵌套校验）本轮**不做**,不放进表单也不提交。
 */
export type CreateRegistrationBody = {
  /** 目标队员 Member.id（必填；8–64） */
  memberId: string;
};

/**
 * ADMIN 代报名 `POST /api/admin/v1/activities/{activityId}/registrations`
 * （rbac: `activity-registration.create.record`）。
 * 后端校验 capacity + 公开报名 + 未重复；活动不存在 404 / 未开放报名 409 / 队员不存在 404 等 → 弹其 message。
 */
export const createRegistration = (
  activityId: string,
  body: CreateRegistrationBody
) =>
  http.request<RegistrationMutationResult>(
    "post",
    `/api/admin/v1/activities/${activityId}/registrations`,
    { data: body }
  );

/* ------------------------------- 报名名单 CSV 导出 ------------------------------- */

/** 导出范围（后端 Q-A6：默认 `pass`,可选 `all`；XLSX 不支持 → 后端 400）。 */
export type RegistrationExportScope = "pass" | "all";

/**
 * 报名名单 CSV 导出 `GET /api/admin/v1/activities/{activityId}/registrations/export`
 * （rbac: `activity-registration.read.record`）。
 * 返 CSV 文本(`responseType: blob`,响应拦截透传 `response.data` 为 Blob,不触 auth http 主线)。
 * 省略 scope = 后端默认 pass（仅通过名单）；scope=all = 全部状态。
 */
export const exportRegistrations = (
  activityId: string,
  scope?: RegistrationExportScope
) =>
  http.request<Blob>(
    "get",
    `/api/admin/v1/activities/${activityId}/registrations/export`,
    { params: scope ? { scope } : {}, responseType: "blob" }
  );

/* ----------------------------- 报名审核错误码 → 人话 ----------------------------- */

/**
 * 报名审核失败的专用文案。码源 = 后端 `biz-code.constant.ts` + handoff §2.1：
 * - 21030 `ACTIVITY_REGISTRATION_STATUS_INVALID`：报名状态不允许——v0.44 起并发审批
 *   只有一个赢家，输家就落在这里（UX 十条第 5 条：说「已被他人处理」并刷新，不静默重试）
 * - 20126 / 20124：活动本身不允许再通过报名（草稿 / 已取消·已完结·已结束）——
 *   由 `activityBizErrorMessage` 统一翻译，两处文案不各写一份
 */
export function registrationReviewErrorMessage(
  error: unknown,
  fallback: string
): string {
  const data = (
    error as { response?: { data?: { code?: unknown; message?: string } } }
  )?.response?.data;
  if (Number(data?.code) === 21030)
    return "这条报名刚被其他人处理过（21030），当前状态已经变了；列表已刷新，请按最新状态再决定";
  return activityBizErrorMessage(error, fallback);
}
