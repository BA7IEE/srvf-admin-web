import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** 活动考勤单据列表项（后端 `AttendanceSheetListItemDto`）。字段以 `/api/docs-json` 为准。 */
export type AttendanceSheetItem = {
  id: string;
  activityId: string;
  submitterUserId: string;
  submittedAt: string;
  statusCode: string;
  reviewedAt: string | null;
  version: number;
  createdAt: string;
};

export type AttendanceListQuery = {
  page?: number;
  pageSize?: number;
  statusCode?: string;
};
export type AttendanceListResult = Envelope<PageResult<AttendanceSheetItem>>;

/**
 * 某活动的考勤单据分页列表。
 * `GET /api/admin/v1/activities/{activityId}/attendance-sheets`（rbac: `attendance.read.sheet`）。
 * 考勤与活动强耦合,故须先选活动。
 */
export const getActivityAttendanceSheets = (
  activityId: string,
  params?: AttendanceListQuery
) =>
  http.request<AttendanceListResult>(
    "get",
    `/api/admin/v1/activities/${activityId}/attendance-sheets`,
    { params }
  );

/* --------------------- 考勤单据 两级审批 + 删除 写操作 --------------------- */
/* 写/删端点为扁平 `/api/admin/v1/attendance-sheets/{id}/...`（非活动嵌套）;     */
/* 路径 / DTO / RBAC 逐项以 `/api/docs-json` 为准（goal 的 `note` 系示意,实测   */
/* 一级通过=`reviewNote`、终审通过=`finalReviewNote`）。状态流转全交后端裁决。  */

/** 一级通过入参（后端 `ApproveAttendanceSheetDto`；字段以 `/api/docs-json` 为准）。 */
export type ApproveAttendanceSheetBody = {
  /** 审核备注（可选；≤ 500） */
  reviewNote?: string;
};

/** 一级驳回入参（后端 `RejectAttendanceSheetDto`）。 */
export type RejectAttendanceSheetBody = {
  /** 驳回理由（必填；≤ 500） */
  reviewNote: string;
};

/** 终审通过入参（后端 `FinalApproveAttendanceSheetDto`；沿 ApproveDto reviewNote 风格）。 */
export type FinalApproveAttendanceSheetBody = {
  /** 终审备注（可选；≤ 500） */
  finalReviewNote?: string;
};

/** 终审驳回入参（后端 `FinalRejectAttendanceSheetDto`）。 */
export type FinalRejectAttendanceSheetBody = {
  /** 终审驳回理由（必填；≤ 500） */
  finalReviewNote: string;
};

/**
 * 写操作返回单条考勤单据（简化详情）。
 * 200 body 契约未声明 schema，前端不消费返回值（成功后刷新列表），按既有约定回 `AttendanceSheetItem`。
 */
export type AttendanceSheetMutationResult = Envelope<AttendanceSheetItem>;

/**
 * 一级通过 `PATCH /api/admin/v1/attendance-sheets/{id}/approve`
 * （rbac: `attendance.approve.sheet`）。
 * pending → pending_final_review；R31 前置校验「所有 records.contributionPoints 必填」由后端裁决,
 * 失败弹其 message（前端不替它校验记录贡献值）。
 */
export const approveAttendanceSheet = (
  id: string,
  body: ApproveAttendanceSheetBody
) =>
  http.request<AttendanceSheetMutationResult>(
    "patch",
    `/api/admin/v1/attendance-sheets/${id}/approve`,
    { data: body }
  );

/**
 * 一级驳回 `PATCH /api/admin/v1/attendance-sheets/{id}/reject`
 * （rbac: `attendance.reject.sheet`）。
 * pending → rejected；`reviewNote` 必填；非法流转后端裁决 → 弹其 message。
 */
export const rejectAttendanceSheet = (
  id: string,
  body: RejectAttendanceSheetBody
) =>
  http.request<AttendanceSheetMutationResult>(
    "patch",
    `/api/admin/v1/attendance-sheets/${id}/reject`,
    { data: body }
  );

/**
 * 终审通过 `PATCH /api/admin/v1/attendance-sheets/{id}/final-approve`
 * （rbac: `attendance.final-approve.sheet`）。
 * pending_final_review → approved；贡献值正式生效并触发 attendance.recorded；非法流转后端裁决 → 弹其 message。
 */
export const finalApproveAttendanceSheet = (
  id: string,
  body: FinalApproveAttendanceSheetBody
) =>
  http.request<AttendanceSheetMutationResult>(
    "patch",
    `/api/admin/v1/attendance-sheets/${id}/final-approve`,
    { data: body }
  );

/**
 * 终审驳回 `PATCH /api/admin/v1/attendance-sheets/{id}/final-reject`
 * （rbac: `attendance.final-reject.sheet`）。
 * pending_final_review → final_rejected；`finalReviewNote` 必填；records 跟随软删；非法流转后端裁决 → 弹其 message。
 */
export const finalRejectAttendanceSheet = (
  id: string,
  body: FinalRejectAttendanceSheetBody
) =>
  http.request<AttendanceSheetMutationResult>(
    "patch",
    `/api/admin/v1/attendance-sheets/${id}/final-reject`,
    { data: body }
  );

/**
 * 软删考勤单据 `DELETE /api/admin/v1/attendance-sheets/{id}`
 * （rbac: `attendance.delete.sheet`）。
 * 仅 pending 可删（事务内级联软删 records）；approved/rejected/pending_final_review/final_rejected 由后端拒绝 → 弹其 message。
 */
export const deleteAttendanceSheet = (id: string) =>
  http.request<AttendanceSheetMutationResult>(
    "delete",
    `/api/admin/v1/attendance-sheets/${id}`
  );

/* ----------------------- 考勤审核完整视图（review-detail） ----------------------- */
/* 为审核页量身做：活动摘要 + 单据详情 + records[含 member 嵌套]。字段以 /api/docs-json 为准。 */

/** 活动摘要（后端 `AttendanceSheetActivitySummaryDto`）。 */
export type AttendanceReviewActivitySummary = {
  id: string;
  title: string;
  activityTypeCode: string;
  organizationId: string;
  startAt: string;
  endAt: string;
  location: string;
  statusCode: string;
};

/** 单据详情（后端 `AttendanceSheetResponseDto`；比列表项多两级审核留痕字段）。 */
export type AttendanceSheetResponse = {
  id: string;
  activityId: string;
  submitterUserId: string;
  submittedAt: string;
  statusCode: string;
  reviewerUserId: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  finalReviewerUserId: string | null;
  finalReviewedAt: string | null;
  finalReviewNote: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

/** 记录内嵌队员摘要（后端 inline object,字段未在 schema 显式声明,按展示需要松类型 + 防御取值）。 */
export type AttendanceReviewMember = {
  id?: string;
  memberNo?: string | null;
  displayName?: string | null;
} | null;

/** 考勤记录（后端 `AttendanceRecordResponseDto`；含 member 嵌套）。 */
export type AttendanceReviewRecord = {
  id: string;
  sheetId: string;
  memberId: string;
  member: AttendanceReviewMember;
  roleCode: string;
  checkInAt: string;
  checkOutAt: string;
  serviceHours: string;
  attendanceStatusCode: string;
  note: string | null;
  registrationId: string | null;
  contributionPoints: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 审核完整视图（后端 `AttendanceSheetReviewDetailDto`）。 */
export type AttendanceSheetReviewDetail = {
  activity: AttendanceReviewActivitySummary;
  sheet: AttendanceSheetResponse;
  records: AttendanceReviewRecord[];
};
export type AttendanceSheetReviewDetailResult =
  Envelope<AttendanceSheetReviewDetail>;

/**
 * 考勤单据审核完整视图 `GET /api/admin/v1/attendance-sheets/{id}/review-detail`
 * （rbac: `attendance.read.sheet`）。审核前看清单据内 records（队员/角色/时长/贡献值）再裁决。
 */
export const getAttendanceSheetReviewDetail = (id: string) =>
  http.request<AttendanceSheetReviewDetailResult>(
    "get",
    `/api/admin/v1/attendance-sheets/${id}/review-detail`
  );
