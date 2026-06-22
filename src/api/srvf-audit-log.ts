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
