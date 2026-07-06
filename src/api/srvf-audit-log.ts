import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ActorRole = "SUPER_ADMIN" | "ADMIN" | "USER";

/** 审计记录（后端 AuditLogResponseDto；字段以 /api/docs-json 为准） */
export type AuditLogItem = {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorRoleSnap: ActorRole | null;
  resourceType: string;
  resourceId: string | null;
  event: string;
  context: unknown;
  success: boolean;
};

export type AuditLogListQuery = {
  page?: number;
  pageSize?: number;
  resourceType?: string;
  resourceId?: string;
  event?: string;
  actorUserId?: string;
  startDate?: string;
  endDate?: string;
};
export type AuditLogListResult = Envelope<PageResult<AuditLogItem>>;

/** 审计记录分页列表 `GET /api/system/v1/audit-logs`（rbac: `audit-log.read.entry`） */
export const getAuditLogs = (params?: AuditLogListQuery) =>
  http.request<AuditLogListResult>("get", "/api/system/v1/audit-logs", {
    params
  });

/**
 * 审计上下文（后端 `AuditContextDto`；requestId 必填，其余 5 项可选/可空）。
 * before/after 是打码后的资源快照（create 无 before；软删无 after）。
 */
export type AuditLogContext = {
  requestId: string;
  ip?: string | null;
  ua?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  extra?: Record<string, unknown> | null;
};

/** 审计记录详情（列表 items[] 与本详情同一个 `AuditLogResponseDto`,仅本端点额外做单条可见性校验）。 */
export type AuditLogDetail = AuditLogItem & { context: AuditLogContext };

/**
 * 审计记录详情 `GET /api/system/v1/audit-logs/{id}`（rbac: `audit-log.read.entry`）。
 * ADMIN 越级查 SUPER_ADMIN 操作记录 → 403/14101；不存在 → 404/14001（消息均已够清楚,不另映射）。
 * 列表已带同款 `context` 字段，本端点用于"点开某一行单独复核"场景（重新拉一次而非复用列表内存态）。
 */
export const getAuditLogDetail = (id: string) =>
  http.request<Envelope<AuditLogDetail>>(
    "get",
    `/api/system/v1/audit-logs/${id}`
  );
