import { http } from "@/utils/http";

export type Envelope<T> = { code: number; message: string; data: T };

/**
 * 工作台 / 首页摘要。后端按 block 做权限裁剪：缺权限时省略对应 key，响应仍为 200。
 * 前端必须按实际存在的 block 渲染，不把缺失 block 当作 0。
 */
/**
 * 工作台待办汇总（后端 `DashboardSummaryResponseDto`）。
 *
 * ⚠️ **每一块都是可选的**：没有对应读码时后端**整块省略**（不是返回 0）。
 * 所以渲染必须按「块在不在」判断——把缺失当 0 画出来，会让无权的人以为
 * 「没有待办」，那是最坏的一种错。块内个别字段同理（见 `pendingFirstReview`）。
 *
 * `activityPublishReviews` 块（活动发布审核待办）属 P6 冻结区，后端虽已返，
 * 但前端暂不渲染——线上后端未部署该能力时画出来就是误导。
 */
export type DashboardSummary = {
  registrations?: {
    /** 待审报名数（registration_status=pending，按授权组织范围统计） */
    pending: number;
    /** 候补中报名数（registration_status=waitlisted） */
    waitlisted: number;
  };
  attendanceSheets?: {
    /** 待一级审核考勤单数（attendance_sheet_status=pending） */
    pending: number;
    /**
     * 一级审核授权范围内的待审数。
     * **无 `attendance.approve.sheet` 动作权限时后端省略此字段**——
     * 缺失 ≠ 0，缺失时整行不渲染。
     */
    pendingFirstReview?: number;
    /** 待终审考勤单数（attendance_sheet_status=pending_final_review） */
    pendingFinalReview: number;
  };
  activities?: {
    /** 进行中活动数（activity_status=published） */
    published: number;
    /** 待人工完结活动数（published 且结束时间已过） */
    pendingCompletion: number;
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

/**
 * `resolveLabels` 的薄封装：单类型批量解析，只返回命中的 `id → label`。
 * 未命中的 id 不进结果（保持各页现有"未命中回退原 id"的口径，回退逻辑留在调用方）。
 * 请求失败时静默返回空表，不抛出（对齐现有调用点普遍的"解析失败不阻塞列表"策略）。
 */
export async function resolveLabelMap(
  type: ResolvableRefType,
  ids: string[]
): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const uniqueIds = [...new Set(ids)];
  if (!uniqueIds.length) return map;
  try {
    const { code, data } = await resolveLabels({
      refs: uniqueIds.map(id => ({ type, id }))
    });
    if (code === 0) {
      for (const id of uniqueIds) {
        const hit = data[type]?.[id];
        if (hit) map[id] = hit.label;
      }
    }
  } catch {
    // 解析失败不阻塞调用方 → 回落显示原 id
  }
  return map;
}

/* ============================================================================
 * 参与月报（meta/participation-overview）
 * ========================================================================== */

/** 时长四桶分布（后端 `DurationHistogramDto`，固定四桶不可配）。 */
export type DurationHistogram = {
  /** [0,2) 小时 */
  under2Hours: number;
  /** [2,4) 小时 */
  from2To4Hours: number;
  /** [4,8) 小时 */
  from4To8Hours: number;
  /** [8,∞) 小时 */
  atLeast8Hours: number;
};

/** 四桶的展示顺序与中文（供图例与表头共用，避免两处各写一份）。 */
export const DURATION_BUCKETS = [
  { key: "under2Hours", label: "2 小时内" },
  { key: "from2To4Hours", label: "2–4 小时" },
  { key: "from4To8Hours", label: "4–8 小时" },
  { key: "atLeast8Hours", label: "8 小时以上" }
] as const;

/** 参与月报的一个月（后端 `ParticipationOverviewMonthDto`）。 */
export type ParticipationOverviewMonth = {
  /** 按活动开始时间的 UTC 月份（YYYY-MM） */
  month: string;
  activityCount: number;
  completedActivityCount: number;
  /** 参与人次 = 逐活动 distinct 到场人数之和（同一人参加两个活动算两次） */
  participationCount: number;
  totalServiceHours: string;
  /** 加权到场率 0–1，**只统计已完结活动** */
  averageAttendanceRate: number;
  /** 缺席率 0–1，**只统计已完结活动** */
  noShowRate: number;
  durationHistogram: DurationHistogram;
};

export type ParticipationOverviewQuery = {
  dateFrom?: string;
  dateTo?: string;
  organizationId?: string;
  includeDescendants?: boolean;
  activityTypeCode?: string;
};

/**
 * 参与度月度总览 `GET /api/admin/v1/meta/participation-overview`。
 *
 * 端点本身是 `[auth]`，但**数据范围由两项读权限的可见组织范围求交**决定
 * （`attendance.read.sheet` ∩ `activity-registration.read.record`，
 * 2026-08-01 读后端 `participation-overview-query.service.ts` 核实）。
 * 求交后无可见范围 → 返回**空数组而非报错**，所以前端要按
 * {@link canViewParticipationOverview} 决定入口显隐，别让无权的人点进一张空表
 * 还以为是「这个月没人参加活动」。
 */
export const getParticipationOverview = (params?: ParticipationOverviewQuery) =>
  http.request<Envelope<{ months: ParticipationOverviewMonth[] }>>(
    "get",
    "/api/admin/v1/meta/participation-overview",
    { params }
  );
