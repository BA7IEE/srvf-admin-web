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
