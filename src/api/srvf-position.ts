import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type PolicyStatus = "ACTIVE" | "INACTIVE";
export type PositionCategory = "LEADER" | "DEPUTY" | "STAFF";

/** 职务定义（后端 PositionResponseDto；字段以 /api/docs-json 为准） */
export type PositionItem = {
  id: string;
  code: string;
  name: string;
  categoryCode: PositionCategory;
  rank: number;
  isLeadership: boolean;
  allowMultiple: boolean;
  allowConcurrent: boolean;
  sortOrder: number;
  status: PolicyStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PositionListQuery = {
  page?: number;
  pageSize?: number;
  categoryCode?: PositionCategory;
  status?: PolicyStatus;
};
export type PositionListResult = Envelope<PageResult<PositionItem>>;

/** 职务定义分页列表 `GET /api/admin/v1/positions`（rbac: `position.read.definition`） */
export const getPositions = (params?: PositionListQuery) =>
  http.request<PositionListResult>("get", "/api/admin/v1/positions", {
    params
  });

export type CreatePositionBody = {
  code: string;
  name: string;
  categoryCode: PositionCategory;
  rank?: number;
  isLeadership?: boolean;
  allowMultiple?: boolean;
  allowConcurrent?: boolean;
  sortOrder?: number;
  status?: PolicyStatus;
  description?: string;
};

/** 更新职务定义；后端 PATCH 白名单不含 code，code 创建后不可改。 */
export type UpdatePositionBody = {
  name?: string;
  categoryCode?: PositionCategory;
  rank?: number;
  isLeadership?: boolean;
  allowMultiple?: boolean;
  allowConcurrent?: boolean;
  sortOrder?: number;
  status?: PolicyStatus;
  description?: string | null;
};

export type PositionMutationResult = Envelope<PositionItem>;

/** 创建职务定义 `POST /api/admin/v1/positions`（rbac: `position.create.definition`） */
export const createPosition = (body: CreatePositionBody) =>
  http.request<PositionMutationResult>("post", "/api/admin/v1/positions", {
    data: body
  });

/** 更新职务定义 `PATCH /api/admin/v1/positions/{id}`（rbac: `position.update.definition`） */
export const updatePosition = (id: string, body: UpdatePositionBody) =>
  http.request<PositionMutationResult>(
    "patch",
    `/api/admin/v1/positions/${id}`,
    { data: body }
  );

/** 软删职务定义 `DELETE /api/admin/v1/positions/{id}`（rbac: `position.delete.definition`；被职务规则引用时后端拒绝） */
export const deletePosition = (id: string) =>
  http.request<void>("delete", `/api/admin/v1/positions/${id}`);

/** 职务规则（后端 PositionRuleResponseDto；字段以 /api/docs-json 为准） */
export type PositionRuleItem = {
  id: string;
  nodeTypeCode: string;
  positionId: string;
  required: boolean;
  minCount: number | null;
  maxCount: number | null;
  requireMembership: boolean;
  allowConcurrent: boolean;
  status: PolicyStatus;
  createdAt: string;
  updatedAt: string;
};

export type PositionRuleListQuery = {
  page?: number;
  pageSize?: number;
  nodeTypeCode?: string;
  positionId?: string;
  status?: PolicyStatus;
};
export type PositionRuleListResult = Envelope<PageResult<PositionRuleItem>>;

/** 职务规则分页列表 `GET /api/admin/v1/position-rules`（rbac: `position-rule.read.record`） */
export const getPositionRules = (params?: PositionRuleListQuery) =>
  http.request<PositionRuleListResult>("get", "/api/admin/v1/position-rules", {
    params
  });

export type CreatePositionRuleBody = {
  nodeTypeCode: string;
  positionId: string;
  required?: boolean;
  minCount?: number | null;
  maxCount?: number | null;
  requireMembership?: boolean;
  allowConcurrent?: boolean;
  status?: PolicyStatus;
};

/** 更新职务规则；后端 PATCH 白名单不含 nodeTypeCode / positionId，唯一键创建后不可改。 */
export type UpdatePositionRuleBody = {
  required?: boolean;
  minCount?: number | null;
  maxCount?: number | null;
  requireMembership?: boolean;
  allowConcurrent?: boolean;
  status?: PolicyStatus;
};

export type PositionRuleMutationResult = Envelope<PositionRuleItem>;

/** 创建职务规则 `POST /api/admin/v1/position-rules`（rbac: `position-rule.create.record`） */
export const createPositionRule = (body: CreatePositionRuleBody) =>
  http.request<PositionRuleMutationResult>(
    "post",
    "/api/admin/v1/position-rules",
    { data: body }
  );

/** 更新职务规则 `PATCH /api/admin/v1/position-rules/{id}`（rbac: `position-rule.update.record`） */
export const updatePositionRule = (id: string, body: UpdatePositionRuleBody) =>
  http.request<PositionRuleMutationResult>(
    "patch",
    `/api/admin/v1/position-rules/${id}`,
    { data: body }
  );

/** 软删职务规则 `DELETE /api/admin/v1/position-rules/{id}`（rbac: `position-rule.delete.record`） */
export const deletePositionRule = (id: string) =>
  http.request<void>("delete", `/api/admin/v1/position-rules/${id}`);

/* -------- 职务选择器（v0.36 F1 新增;fork 打包早于此,移植时补) -------- */

/** 选择器项（后端 `PositionOptionItemDto`） */
export type PositionOptionItem = {
  id: string;
  label: string;
  categoryCode: PositionCategory;
};

/**
 * 职务选择器 `GET /api/admin/v1/positions/options`
 * （rbac: `position.read.definition`;categoryCode/status/q/limit 过滤,表单下拉与 id→名称映射用）。
 * ⚠️ limit 后端校验上限 100（超出 400「limit must not be greater than 100」,docs-json 未标注——live 实测 2026-07-06）。
 */
export const getPositionOptions = (params?: {
  categoryCode?: PositionCategory;
  status?: PolicyStatus;
  q?: string;
  limit?: number;
}) =>
  http.request<Envelope<{ items: PositionOptionItem[] }>>(
    "get",
    "/api/admin/v1/positions/options",
    { params }
  );

/** 职务类别 → 中文（契约闭集 enum：LEADER/DEPUTY/STAFF;文案沿 fork） */
export const POSITION_CATEGORY_LABEL: Record<string, string> = {
  LEADER: "正职",
  DEPUTY: "副职",
  STAFF: "干事"
};
