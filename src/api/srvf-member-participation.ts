import { http } from "@/utils/http";
// AdminRegistrationListItemDto 同形:报名项 + activity 上下文。队员 360 报名履历与审批工作台横扫
// 复用同一后端 DTO,故共用该类型(单一真相;声明在 srvf-approval,此处引用)。
import type { AdminRegistrationItem } from "./srvf-approval";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type { AdminRegistrationItem };

/**
 * 队员考勤记录项（后端 `AdminMemberAttendanceRecordDto`）。
 * **仅 approved sheet 内 records**（已生效记录,镜像 app `/me` 口径）。字段以 `/api/docs-json` 为准。
 * 注:`roleCode` / `attendanceStatusCode` 为后端字典码,暂无确认的字典类型名,前端按原码展示(不臆造类型名)。
 */
export type MemberAttendanceRecord = {
  id: string;
  sheetId: string;
  activityId: string;
  /** 记录所属活动标题（可空） */
  activityTitle: string | null;
  memberId: string;
  /** 出勤角色码 */
  roleCode: string;
  checkInAt: string;
  checkOutAt: string;
  /** 服务时长（小时,decimal 字符串） */
  serviceHours: string;
  /** 出勤状态码 */
  attendanceStatusCode: string;
  note: string | null;
  registrationId: string | null;
  /** 该条记录贡献值（decimal 字符串,可空；**总分勿在前端裸 SUM**,走 contribution-summary 的 capped 值） */
  contributionPoints: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * 队员贡献值生涯累计 capped 总分（后端 `MemberContributionSummaryDto`）。
 * 后端实时算（复用 team-join 封顶核,approved sheet + 北京日封顶 1.5,生涯无 cutoff）。
 * **`contributionPoints` 已封顶,前端直接展示,别再加/再算**(踩坑表 #4)。
 */
export type MemberContributionSummary = {
  memberId: string;
  contributionPoints: string;
};

export type MemberRegistrationListQuery = {
  page?: number;
  pageSize?: number;
  statusCode?: string;
};
export type MemberAttendanceRecordListQuery = {
  page?: number;
  pageSize?: number;
};

export type MemberRegistrationListResult = Envelope<
  PageResult<AdminRegistrationItem>
>;
export type MemberAttendanceRecordListResult = Envelope<
  PageResult<MemberAttendanceRecord>
>;
export type MemberContributionSummaryResult =
  Envelope<MemberContributionSummary>;

/**
 * 某队员报名履历（队员 360 跨轴只读）。
 * `GET /api/admin/v1/members/{memberId}/registrations`（rbac: `activity-registration.read.record`）。
 * 分页 + 可选 statusCode；item 自带 activity 上下文；不存在/软删 → `MEMBER_NOT_FOUND`。
 */
export const getMemberRegistrations = (
  memberId: string,
  params?: MemberRegistrationListQuery
) =>
  http.request<MemberRegistrationListResult>(
    "get",
    `/api/admin/v1/members/${memberId}/registrations`,
    { params }
  );

/**
 * 某队员考勤记录（队员 360 跨轴只读）。
 * `GET /api/admin/v1/members/{memberId}/attendance-records`（rbac: `attendance.read.sheet`）。
 * 分页;**仅 approved sheet 内 records**;item 自带 activity 上下文;不存在/软删 → `MEMBER_NOT_FOUND`。
 */
export const getMemberAttendanceRecords = (
  memberId: string,
  params?: MemberAttendanceRecordListQuery
) =>
  http.request<MemberAttendanceRecordListResult>(
    "get",
    `/api/admin/v1/members/${memberId}/attendance-records`,
    { params }
  );

/**
 * 某队员贡献值生涯累计 capped 总分（队员 360 跨轴只读）。
 * `GET /api/admin/v1/members/{memberId}/contribution-summary`（rbac: `attendance.read.sheet`）。
 * 返 capped 总分,**直接展示别再算**;不存在/软删 → `MEMBER_NOT_FOUND`。
 */
export const getMemberContributionSummary = (memberId: string) =>
  http.request<MemberContributionSummaryResult>(
    "get",
    `/api/admin/v1/members/${memberId}/contribution-summary`
  );
