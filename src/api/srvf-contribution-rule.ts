import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ContributionRuleStatus = "ACTIVE" | "INACTIVE";

/** 贡献值规则（后端 ContributionRuleResponseDto；字段以 /api/docs-json 为准） */
export type ContributionRuleItem = {
  id: string;
  activityTypeCode: string;
  attendanceRoleCode: string;
  durationThreshold: number | null;
  pointsBelow: number;
  pointsAbove: number | null;
  dailyCap: number | null;
  status: ContributionRuleStatus;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string | null;
  updatedByUserId: string | null;
};

export type ContributionRuleListQuery = {
  page?: number;
  pageSize?: number;
  activityTypeCode?: string;
  attendanceRoleCode?: string;
  status?: ContributionRuleStatus;
};
export type ContributionRuleListResult = Envelope<
  PageResult<ContributionRuleItem>
>;

/** 贡献值规则分页列表 `GET /api/system/v1/contribution-rules`（rbac: `contribution.read.rule`） */
export const getContributionRules = (params?: ContributionRuleListQuery) =>
  http.request<ContributionRuleListResult>(
    "get",
    "/api/system/v1/contribution-rules",
    { params }
  );

/**
 * 创建贡献值规则入参（后端 `CreateContributionRuleDto`；字段以 `/api/docs-json` 为准）。
 */
export type CreateContributionRuleBody = {
  /** 活动类型字典 code（必填；typeCode=activity_type） */
  activityTypeCode: string;
  /** 考勤角色字典 code（必填；typeCode=attendance_role） */
  attendanceRoleCode: string;
  /** 时长档位阈值（小时；省略 / 显式 null = 无档位） */
  durationThreshold?: number | null;
  /** ≤ 阈值（或无档位）的预填分值（必填；≥ 0） */
  pointsBelow: number;
  /** > 阈值的预填分值（省略 / 显式 null；非 null 时要求 durationThreshold 非 null 且 > pointsBelow） */
  pointsAbove?: number | null;
  /** 每日上限（省略 / 显式 null） */
  dailyCap?: number | null;
  /** 规则状态（省略默认 ACTIVE） */
  status?: ContributionRuleStatus;
  /** 运营备注（≤ 500） */
  remark?: string;
};

/**
 * 更新贡献值规则入参（后端 `UpdateContributionRuleDto`）。
 * 后端 PATCH 白名单**仅** `pointsBelow / pointsAbove / dailyCap / status / remark`；
 * `activityTypeCode / attendanceRoleCode / durationThreshold` 禁改（传入会被 ValidationPipe 拦截抛 40000）。
 */
export type UpdateContributionRuleBody = {
  pointsBelow?: number;
  pointsAbove?: number | null;
  dailyCap?: number | null;
  status?: ContributionRuleStatus;
  remark?: string | null;
};

export type ContributionRuleMutationResult = Envelope<ContributionRuleItem>;

/** 创建贡献值规则 `POST /api/system/v1/contribution-rules`（rbac: `contribution.create.rule`） */
export const createContributionRule = (body: CreateContributionRuleBody) =>
  http.request<ContributionRuleMutationResult>(
    "post",
    "/api/system/v1/contribution-rules",
    { data: body }
  );

/** 部分更新贡献值规则 `PATCH /api/system/v1/contribution-rules/{id}`（rbac: `contribution.update.rule`） */
export const updateContributionRule = (
  id: string,
  body: UpdateContributionRuleBody
) =>
  http.request<ContributionRuleMutationResult>(
    "patch",
    `/api/system/v1/contribution-rules/${id}`,
    { data: body }
  );

/** 软删贡献值规则 `DELETE /api/system/v1/contribution-rules/{id}`（rbac: `contribution.delete.rule`） */
export const deleteContributionRule = (id: string) =>
  http.request<Envelope<ContributionRuleItem | null>>(
    "delete",
    `/api/system/v1/contribution-rules/${id}`
  );
