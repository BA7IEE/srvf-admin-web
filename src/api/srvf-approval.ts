import { http } from "@/utils/http";
import type { RegistrationItem } from "./srvf-registration";
import type { AttendanceSheetItem } from "./srvf-attendance";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * 跨活动报名横扫列表项（后端 `AdminRegistrationListItemDto`）。
 * = 活动嵌套报名项（`RegistrationItem`）+ 跨轴 activity 上下文 `activityTitle`。
 * 字段以 `/api/docs-json` 为准。
 */
export type AdminRegistrationItem = RegistrationItem & {
  /** 报名所属活动标题（横扫脱离 `:activityId` 路径段,故 item 自带活动上下文；可空） */
  activityTitle: string | null;
};

/**
 * 跨活动考勤单据横扫列表项（后端 `AdminAttendanceSheetListItemDto`）。
 * = 活动嵌套考勤单据项（`AttendanceSheetItem`）+ 跨轴 activity 上下文 `activityTitle`。
 */
export type AdminAttendanceSheetItem = AttendanceSheetItem & {
  /** 单据所属活动标题（可空） */
  activityTitle: string | null;
};

/**
 * 横扫查询入参：分页 + 可选 `statusCode`（沿既有嵌套列表口径,**非草拟期 `status`**）。
 * 省略 `statusCode` = 全部状态。
 */
export type CrossAxisQuery = {
  page?: number;
  pageSize?: number;
  statusCode?: string;
};

export type AdminRegistrationListResult = Envelope<
  PageResult<AdminRegistrationItem>
>;
export type AdminAttendanceSheetListResult = Envelope<
  PageResult<AdminAttendanceSheetItem>
>;

/**
 * 跨活动报名横扫（审批工作台）。
 * `GET /api/admin/v1/registrations`（rbac: `activity-registration.read.record`）。
 * 脱离 `:activityId` 路径段,跨所有活动按 `statusCode` 横扫；item 自带 activity 上下文。
 * 写操作（通过/拒绝/代取消）复用 `@/api/srvf-registration`（每行带 `activityId`,无需固定活动）。
 */
export const getAllRegistrations = (params?: CrossAxisQuery) =>
  http.request<AdminRegistrationListResult>(
    "get",
    "/api/admin/v1/registrations",
    { params }
  );

/**
 * 跨活动考勤单据横扫（审批工作台）。
 * `GET /api/admin/v1/attendance-sheets`（rbac: `attendance.read.sheet`）。
 * 脱离 `:activityId` 路径段；item 自带 activity 上下文。
 * 写操作（两级审批）复用 `@/api/srvf-attendance`（写端点本就扁平,仅需 sheet id）。
 */
export const getAllAttendanceSheets = (params?: CrossAxisQuery) =>
  http.request<AdminAttendanceSheetListResult>(
    "get",
    "/api/admin/v1/attendance-sheets",
    { params }
  );
