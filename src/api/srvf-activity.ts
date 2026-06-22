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
