import { http } from "@/utils/http";

/** 后端统一成功信封（失败为 HTTP 4xx，axios reject） */
type Envelope<T> = { code: number; message: string; data: T };

/**
 * 队员证书列表项（后端 `CertificateListItemDto`）。字段以 `/api/docs-json` 为准，勿前端臆造。
 * `certStatusCode` / `certTypeCode` 等是后端字典 code（如 pending / verified / expired / rejected），
 * 状态机由后端维护，前端不复刻枚举。
 */
export type CertificateItem = {
  id: string;
  memberId: string;
  certTypeCode: string;
  certSubTypeCode: string | null;
  issuingOrg: string;
  issuedAt: string;
  expiredAt: string | null;
  certStatusCode: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * 某队员的证书列表（**无分页**，按 certStatusCode ASC / createdAt DESC）。
 * `GET /api/admin/v1/members/{memberId}/certificates`（rbac: `certificate.read.record`）。
 * 后端没有平铺证书端点，证书隶属队员，故须先选队员。
 */
export const getMemberCertificates = (memberId: string) =>
  http.request<Envelope<CertificateItem[]>>(
    "get",
    `/api/admin/v1/members/${memberId}/certificates`
  );
