import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };

/**
 * 公告导入（announcement-import）：后端 PR11 一次性上线初始化 / 批量换届工具（`ImportOrganizationRowDto` 等）。
 * 结构化行数组由运营/AI 线下从《任命公告》文本解析产出，本工具只做双锚（memberNo/组织 code）落库编排，
 * 复用 organizations/position-assignments/supervision-assignments 同一套校验代码——不是常规菜单页，
 * 后端 handoff 明确「平时不用，不建议加进导航树」，本页仅通过直接 URL 访问。字段以 `/api/docs-json` 为准。
 */

export type ImportOrganizationRow = {
  code?: string;
  parentCode?: string;
  name?: string;
  establishmentStatusCode?: "formal" | "provisional";
  groupFunctionCode?: string;
  sortOrder?: number;
};

export type ImportPositionRow = {
  memberNo?: string;
  displayName?: string;
  orgCode?: string;
  positionCode?: string;
  startedAt?: string;
  endedAt?: string;
  isConcurrent?: boolean;
  note?: string;
  appointmentSource?: string;
};

export type ImportSupervisionRow = {
  supervisorMemberNo?: string;
  displayName?: string;
  orgCode?: string;
  scopeMode?: "EXACT" | "TREE";
  startedAt?: string;
  endedAt?: string;
  note?: string;
};

export type AnnouncementImportRequest = {
  organizations?: ImportOrganizationRow[];
  positions?: ImportPositionRow[];
  supervisions?: ImportSupervisionRow[];
};

export type ImportRowStatus =
  | "ok"
  | "blocked"
  | "already-exists"
  | "needs-manual";

export const IMPORT_ROW_STATUS_LABEL: Record<ImportRowStatus, string> = {
  ok: "可创建",
  blocked: "受阻",
  "already-exists": "已存在(跳过)",
  "needs-manual": "待人工确认"
};

export const IMPORT_ROW_STATUS_TAG: Record<
  ImportRowStatus,
  "success" | "danger" | "info" | "warning"
> = {
  ok: "success",
  blocked: "danger",
  "already-exists": "info",
  "needs-manual": "warning"
};

export type ImportRowIssue = {
  bizCode: number | null;
  message: string;
};

export type ImportOrganizationRowResult = {
  row: ImportOrganizationRow;
  status: ImportRowStatus;
  reasons: ImportRowIssue[];
  organizationId: string | null;
};

export type ImportPositionRowResult = {
  row: ImportPositionRow;
  status: ImportRowStatus;
  reasons: ImportRowIssue[];
  suggestedMemberNo: string | null;
  positionAssignmentId: string | null;
};

export type ImportSupervisionRowResult = {
  row: ImportSupervisionRow;
  status: ImportRowStatus;
  reasons: ImportRowIssue[];
  suggestedMemberNo: string | null;
  supervisionAssignmentId: string | null;
};

export type ImportSummary = {
  total: number;
  ok: number;
  blocked: number;
  alreadyExists: number;
  needsManual: number;
};

export type AnnouncementImportResult = {
  organizations: ImportOrganizationRowResult[];
  positions: ImportPositionRowResult[];
  supervisions: ImportSupervisionRowResult[];
  summary: ImportSummary;
};

/** 预览（零写入,逐行回显 ok/blocked/already-exists/needs-manual）。`[rbac: announcement-import.preview.record]` */
export const previewAnnouncementImport = (body: AnnouncementImportRequest) =>
  http.request<Envelope<AnnouncementImportResult>>(
    "post",
    "/api/admin/v1/announcement-import/preview",
    { data: body }
  );

/** 执行（逐行落库,幂等可重跑,单行失败不影响其它行）。`[rbac: announcement-import.execute.record]` */
export const executeAnnouncementImport = (body: AnnouncementImportRequest) =>
  http.request<Envelope<AnnouncementImportResult>>(
    "post",
    "/api/admin/v1/announcement-import/execute",
    { data: body }
  );
