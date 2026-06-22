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
