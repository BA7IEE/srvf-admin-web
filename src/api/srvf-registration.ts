import { http } from "@/utils/http";

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
