import { http } from "@/utils/http";
import { activityBizErrorMessage } from "@/api/srvf-activity";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** 报名所选的活动岗位摘要（无岗位报名为 null）。 */
export type RegistrationActivityPosition = {
  activityPositionId: string;
  name: string;
};

/** 活动报名列表项（后端 `ActivityRegistrationListItemDto`）。字段以 `/api/docs-json` 为准。 */
export type RegistrationItem = {
  id: string;
  activityId: string;
  /** 报名所选岗位（存量报名 / 无岗位活动为 null） */
  activityPosition: RegistrationActivityPosition | null;
  memberId: string;
  memberNo: string | null;
  memberDisplayName: string | null;
  statusCode: string;
  /**
   * 候补排位：`statusCode=waitlisted` 时从 1 开始，其他状态为 null。
   * ⚠️ 候补是**后端自动递补**的——取消或扩容时自动上位。
   * 后端明令**不提供「候补直通」**，前端也不得造这样的按钮。
   */
  waitlistPosition: number | null;
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
  /**
   * 活动岗位 id。**活动配了岗位就必填**——不传后端返 21035。
   * 无岗位的活动不要传。
   */
  activityPositionId?: string;
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

/* ------------------------------- 批量审批 / 后悔药 ------------------------------- */

/** 后端单次批量审批的 id 上限（1~100，去重）。 */
export const REGISTRATION_BULK_MAX = 100;

/** 批量审批入参（后端 `BulkReviewRegistrationsDto`）。 */
export type BulkReviewRegistrationsBody = {
  /** 待逐条审批的报名 id（1~100；后端去重；每条独立事务） */
  ids: string[];
  /** 统一审核备注；批量驳回未传 / 空白时后端自动写入「批量驳回」 */
  reviewNote?: string;
};

/** 批量审批里失败的一条（后端 `BulkReviewFailureDto`）。 */
export type BulkReviewFailure = {
  id: string;
  /** 该条失败的 BizCode 数值 */
  code: number;
  /** 该条失败的安全业务提示 */
  message: string;
};

/**
 * 批量审批结果（后端 `BulkReviewRegistrationsResponseDto`）。
 *
 * ⚠️ **HTTP 200 不等于全部成功**——后端逐条独立事务、逐条判权，允许部分成功。
 * 调用方必须逐行展示 `failed`，不能拿到 200 就报「全部通过」。
 */
export type BulkReviewRegistrationsResult = {
  /** 审批成功的报名 id（保持请求顺序） */
  succeeded: string[];
  /** 逐条失败结果（保持请求顺序） */
  failed: BulkReviewFailure[];
};

/**
 * 批量审核通过
 * `PATCH /api/admin/v1/activities/{activityId}/registrations/bulk-approve`
 * （rbac: `activity-registration.approve.record`）。
 * 逐条独立事务 / 判权 / 名额校验 / 审计 / 通知；**部分成功**。
 */
export const bulkApproveRegistrations = (
  activityId: string,
  body: BulkReviewRegistrationsBody
) =>
  http.request<Envelope<BulkReviewRegistrationsResult>>(
    "patch",
    `/api/admin/v1/activities/${activityId}/registrations/bulk-approve`,
    { data: body }
  );

/**
 * 批量审核拒绝
 * `PATCH /api/admin/v1/activities/{activityId}/registrations/bulk-reject`
 * （rbac: `activity-registration.reject.record`）。
 * 同样逐条独立事务、**部分成功**；空备注后端默认写「批量驳回」。
 */
export const bulkRejectRegistrations = (
  activityId: string,
  body: BulkReviewRegistrationsBody
) =>
  http.request<Envelope<BulkReviewRegistrationsResult>>(
    "patch",
    `/api/admin/v1/activities/${activityId}/registrations/bulk-reject`,
    { data: body }
  );

/**
 * 撤销驳回、退回待审（审批后悔药）
 * `POST /api/admin/v1/activities/{activityId}/registrations/{id}/reopen`
 * （rbac: `activity-registration.reopen.record`）。
 * reject → pending，清空审核字段；**不发通知**。
 * 也用于解除被驳回队员的重新报名限制。
 */
export const reopenRegistration = (activityId: string, id: string) =>
  http.request<RegistrationMutationResult>(
    "post",
    `/api/admin/v1/activities/${activityId}/registrations/${id}/reopen`
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
  const code = Number(data?.code);
  if (code === 21030)
    return "这条报名刚被其他人处理过（21030），当前状态已经变了；列表已刷新，请按最新状态再决定";
  if (code === 21033)
    return "这条报名已经有考勤记录了，不能取消（21033）：如确需撤销，请先到「考勤」页签把对应的考勤记录删掉";
  if (code === 21035) return "这个活动按岗位报名，必须先选岗位（21035）";
  if (code === 17030)
    return "该队员已停用（17030）：停用的队员不能报名，也不能通过审核";
  return activityBizErrorMessage(error, fallback);
}

/**
 * 批量审批里单条失败的 BizCode → 人话（结果对话框逐行用）。
 * 与单条审批共用一套码义，这里只是换成不带「列表已刷新」这类整页话术的短句。
 */
export function bulkFailureText(failure: BulkReviewFailure): string {
  switch (failure.code) {
    case 21001:
      return "这条报名不存在（可能刚被删除）";
    case 21030:
      return "状态已变（可能已被他人处理）";
    case 21033:
      return "已有考勤记录";
    case 17030:
      return "队员已停用";
    case 20124:
      return "活动已取消 / 已完结 / 已结束，不能再通过";
    case 20126:
      return "活动还是草稿，需先发布";
    case 30100:
      return "没有该操作的权限";
    default:
      // 后端已给安全提示,拿不到映射时直出它比显示裸码强
      return failure.message || `失败（${failure.code}）`;
  }
}
