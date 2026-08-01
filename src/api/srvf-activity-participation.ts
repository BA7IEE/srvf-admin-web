import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/* ============================ 活动评价 ============================ */

/** 五星分布的一桶（后端固定返 1~5 五桶，**零桶也显式返回**，前端不必自己补齐）。 */
export type ActivityFeedbackRatingBucket = {
  rating: number;
  count: number;
};

/** 活动评价汇总（后端 `AdminActivityFeedbackSummaryDto`）。 */
export type ActivityFeedbackSummary = {
  /** 未软删评价数 */
  count: number;
  /** 平均星级；**无评价时为 null**（不是 0——0 分和「还没人评」是两回事） */
  avgRating: number | null;
  /** 固定 1~5 星五桶分布 */
  ratingDistribution: ActivityFeedbackRatingBucket[];
  /**
   * 评价率 = 评价人数 / (当前 approved 考勤 distinct member ∪ 已提交评价 member) 去重数。
   * 0~1 四位小数；分母为 0 时为 0。
   * 注意分母**不是**报名人数,而是「实际到过场的人 ∪ 评过的人」。
   */
  feedbackRate: number;
};

/** 活动评价列表项（后端 `AdminActivityFeedbackListItemDto`；实名，无匿名口径）。 */
export type ActivityFeedbackItem = {
  memberNo: string;
  displayName: string;
  /** 1~5 星 */
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * 活动评价汇总 `GET /api/admin/v1/activities/{activityId}/feedback-summary`
 * （rbac: `attendance.read.sheet`——评价读权限挂在考勤读码下，没有独立评价码）。
 */
export const getActivityFeedbackSummary = (activityId: string) =>
  http.request<Envelope<ActivityFeedbackSummary>>(
    "get",
    `/api/admin/v1/activities/${activityId}/feedback-summary`
  );

/**
 * 活动评价分页列表 `GET /api/admin/v1/activities/{activityId}/feedbacks`
 * （rbac: `attendance.read.sheet`）。只读——管理端不提供改 / 删评价的入口。
 */
export const getActivityFeedbacks = (
  activityId: string,
  params?: { page?: number; pageSize?: number }
) =>
  http.request<Envelope<PageResult<ActivityFeedbackItem>>>(
    "get",
    `/api/admin/v1/activities/${activityId}/feedbacks`,
    { params }
  );

/* ============================ 参与合计 / 核对 ============================ */

/** 按报名状态统计（后端 `ActivityRegistrationCountsDto`；五分项之和恒等于 total）。 */
export type ActivityRegistrationCounts = {
  total: number;
  pending: number;
  pass: number;
  reject: number;
  cancelled: number;
  waitlisted: number;
};

/** approved 记录按时长分的固定四桶（后端 `DurationHistogramDto`）。 */
export type DurationHistogram = {
  under2Hours: number;
  from2To4Hours: number;
  from4To8Hours: number;
  atLeast8Hours: number;
};

/**
 * 活动参与合计（后端 `ActivityParticipationSummaryDto`）。
 * 端点是 `[auth]`，但后端要求**同时持**考勤读与报名读两项权限，缺一即拒。
 */
export type ActivityParticipationSummary = {
  activityId: string;
  activityStatusCode: string;
  registrationCounts: ActivityRegistrationCounts;
  /** 有任意未软删考勤记录的 distinct 队员数 */
  attendeeCount: number;
  /** pass 报名且有考勤记录的人数 */
  registeredAttendeeCount: number;
  /** 无任何报名但有考勤记录的「临时参加」人数 */
  temporaryAttendeeCount: number;
  /** **仅 completed 活动**统计 pass 报名且零考勤记录的人数；其他状态恒 0 */
  noShowCount: number;
  /** 到场率 = 有记录的 pass 人数 / pass 人数，0~1 四位小数 */
  attendanceRate: number;
  /** approved 单据内 serviceHours 合计（字符串，后端按 Decimal 返回，前端不做数值运算） */
  totalServiceHours: string;
  /** approved 单据内 contributionPoints 原始合计（同上，字符串） */
  totalContributionPoints: string;
  durationHistogram: DurationHistogram;
  /** 评价数与两位平均星级（avgRating 无评价时为 null） */
  feedback: { count: number; avgRating: number | null };
};

/** 核对结果：报名侧只有到场 / 缺席两种，临时参加单列一类。 */
export type ReconciliationOutcome = "attended" | "no-show" | "temporary";

/** 核对名单里的一行（报名侧与临时侧字段一致，仅 registrationId 有无之差）。 */
export type ActivityReconciliationParticipant = {
  /** 仅 pass 报名侧有；临时参加没有报名记录故无此字段 */
  registrationId?: string;
  memberId: string;
  memberNo: string;
  displayName: string;
  outcome: ReconciliationOutcome;
  /** 该活动全部未软删考勤记录数（**不论单据状态**） */
  recordCount: number;
  /** 其中已终审（approved 单据）的记录数 */
  approvedRecordCount: number;
  /** approved 单据内 serviceHours 小计（字符串） */
  totalServiceHours: string;
};

/**
 * 活动报名 × 实到核对（后端 `ActivityReconciliationDto`）。
 *
 * ⚠️ **仅 completed 活动可调用**，其他状态后端直接拒——所以入口本身要按状态显隐，
 * 不是「调了再看错误」。
 */
export type ActivityReconciliation = {
  activityId: string;
  activityStatusCode: string;
  /** pass 报名人数 */
  passRegistrationCount: number;
  /** pass 报名且有任意状态考勤记录的人数 */
  attendedCount: number;
  /** pass 报名且零未软删考勤记录的人数 */
  noShowCount: number;
  /** pass 报名逐人核对结果 */
  registeredParticipants: ActivityReconciliationParticipant[];
  /** 无任何未软删报名、却有考勤记录的「临时参加」名单 */
  temporaryParticipants: ActivityReconciliationParticipant[];
};

/**
 * 活动参与合计 `GET /api/admin/v1/activities/{activityId}/participation-summary`。
 * 端点标 `[auth]`，但后端要求同时持 `attendance.read.sheet` 与
 * `activity-registration.read.record`，缺一即 403——故前端按这两码取交集做显隐。
 */
export const getActivityParticipationSummary = (activityId: string) =>
  http.request<Envelope<ActivityParticipationSummary>>(
    "get",
    `/api/admin/v1/activities/${activityId}/participation-summary`
  );

/**
 * 活动报名×实到核对 `GET /api/admin/v1/activities/{activityId}/reconciliation`。
 * 权限同上；**仅 completed 活动**可调用。
 */
export const getActivityReconciliation = (activityId: string) =>
  http.request<Envelope<ActivityReconciliation>>(
    "get",
    `/api/admin/v1/activities/${activityId}/reconciliation`
  );
