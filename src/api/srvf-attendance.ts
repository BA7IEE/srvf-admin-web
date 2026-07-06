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

/* --------------------------- 考勤单据 提交 / 编辑 --------------------------- */

/** 单条考勤记录入参（后端 `AttendanceRecordInputDto`）。 */
export type AttendanceRecordInputBody = {
  memberId: string;
  /** 考勤角色字典 code（typeCode=attendance_role；7 项闭集） */
  roleCode: string;
  checkInAt: string;
  /** 必须晚于 checkInAt */
  checkOutAt: string;
  /** 服务时长(小时)；不传由后端按签退-签到自动算 */
  serviceHours?: number;
  /** 考勤明细状态字典 code（typeCode=attendance_status） */
  attendanceStatusCode: string;
  note?: string;
  /** 关联报名 ActivityRegistration.id（可空） */
  registrationId?: string;
  /** 贡献值；不传由后端按 ContributionRule 预填。approve 前所有 records 必填（R31） */
  contributionPoints?: number;
};

/** 提交考勤单据入参（后端 `CreateAttendanceSheetDto`）。 */
export type CreateAttendanceSheetBody = {
  records: AttendanceRecordInputBody[];
};

/** 编辑 pending 单据入参（后端 `UpdateAttendanceSheetDto`；传则整组替换旧 records）。 */
export type UpdateAttendanceSheetBody = {
  records: AttendanceRecordInputBody[];
};

/**
 * 提交考勤单据 `POST /api/admin/v1/activities/{activityId}/attendance-sheets`
 * （rbac: `attendance.create.sheet`）。事务内一次性 create Sheet + N records；
 * 初始 statusCode=pending，version=1；活动 cancelled 时后端拒绝。
 */
export const submitAttendanceSheet = (
  activityId: string,
  body: CreateAttendanceSheetBody
) =>
  http.request<AttendanceSheetMutationResult>(
    "post",
    `/api/admin/v1/activities/${activityId}/attendance-sheets`,
    { data: body }
  );

/**
 * 编辑 pending 单据 `PATCH /api/admin/v1/attendance-sheets/{id}`
 * （rbac: `attendance.update.sheet`）。后端生成 previousSnapshot + version+1；
 * 旧 records 软删 + 新 records 创建；非 pending 状态后端拒绝 → 弹其 message。
 */
export const updateAttendanceSheet = (
  id: string,
  body: UpdateAttendanceSheetBody
) =>
  http.request<AttendanceSheetMutationResult>(
    "patch",
    `/api/admin/v1/attendance-sheets/${id}`,
    { data: body }
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

/**
 * 考勤终审失败的专用文案（后端 handoff 踩坑 #8：22074/22075 必须独立提示，
 * 不得混入通用"权限不足"）。码源 = 后端 BizCode（v0.35 摘码微刀落地）：
 * - 22074 自审拒：提交人 == 终审人（SUPER_ADMIN 也拒）
 * - 22075 同人拒：一级审核人 == 终审人（后端 env `ATTENDANCE_ALLOW_SAME_REVIEWER` 可放开）
 * - 30100 判权失败：2026-07-03 起 biz-admin 不再天然持终审权，仅 SUPER_ADMIN 或
 *   「考勤终审员」scoped 角色绑定可终审
 * 其余码回落后端 message，再回落调用方兜底文案。
 */
export function finalReviewErrorMessage(
  error: unknown,
  fallback: string
): string {
  const data = (
    error as { response?: { data?: { code?: unknown; message?: string } } }
  )?.response?.data;
  const code = Number(data?.code);
  if (code === 22074)
    return "不能终审自己提交的考勤单（自审限制 22074），请转交其他有终审权的人处理";
  if (code === 22075)
    return "一级审核人与终审人不能是同一人（22075），请由另一位终审人处理";
  if (code === 30100)
    return "当前账号没有考勤终审权（30100）：终审权仅来自 SUPER_ADMIN 或「考勤终审员」角色绑定";
  return data?.message ?? fallback;
}
