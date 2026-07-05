import { http } from "@/utils/http";

export type Envelope<T> = { code: number; message: string; data: T };

/**
 * 工作台 / 首页摘要。后端按 block 做权限裁剪：缺权限时省略对应 key，响应仍为 200。
 * 前端必须按实际存在的 block 渲染，不把缺失 block 当作 0。
 */
export type DashboardSummary = {
  registrations?: {
    /** 全局待审报名数（registration_status=pending） */
    pending: number;
  };
  attendanceSheets?: {
    /** 待一级审核考勤单数（attendance_sheet_status=pending） */
    pending: number;
    /** 待终审考勤单数（attendance_sheet_status=pending_final_review） */
    pendingFinalReview: number;
  };
  activities?: {
    /** 进行中活动数（activity_status=published） */
    published: number;
  };
};

export type ResolvableRefType =
  | "member"
  | "user"
  | "organization"
  | "role"
  | "position"
  | "activity";

export type ResolveLabelsParams = {
  refs: Array<{
    type: ResolvableRefType;
    id: string;
  }>;
};

export type ResolvedLabel = {
  label: string;
  [key: string]: unknown;
};

/**
 * `{[type]: {[id]: { label, ... }}}`。无权限 / 不存在 / 软删的 id 会被后端静默省略。
 */
export type ResolveLabelsData = Partial<
  Record<ResolvableRefType, Record<string, ResolvedLabel>>
>;

/** 工作台 / 首页待办汇总 `GET /api/admin/v1/meta/dashboard-summary`。 */
export const getDashboardSummary = () =>
  http.request<Envelope<DashboardSummary>>(
    "get",
    "/api/admin/v1/meta/dashboard-summary"
  );

/** 批量 id → label 解析 `POST /api/admin/v1/meta/resolve-labels`。 */
export const resolveLabels = (data: ResolveLabelsParams) =>
  http.request<Envelope<ResolveLabelsData>>(
    "post",
    "/api/admin/v1/meta/resolve-labels",
    { data }
  );
