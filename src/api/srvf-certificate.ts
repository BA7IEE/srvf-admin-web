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

/* ----------------------------- 证书 写操作 ----------------------------- */

/**
 * 新增证书入参（后端 `CreateCertificateDto`；字段以 `/api/docs-json` 为准）。
 * 必填 `certTypeCode`(≤64) / `issuingOrg`(≤128) / `issuedAt`(ISO 8601)；
 * 可选 `certSubTypeCode`(≤64) / `certNumber`(≤128) / `expiredAt`(ISO 8601；NULL = 终身有效)。
 * 后端默认 `certStatusCode=pending` / `isInternal=false`（前端不提交这两项）。
 */
export type CreateCertificateBody = {
  /** 证书大类字典 code（必填；≤ 64；typeCode=cert_type） */
  certTypeCode: string;
  /** 颁发机构（自由文本；必填；≤ 128） */
  issuingOrg: string;
  /** 颁发日期（ISO 8601；后端规范化为 00:00:00.000Z；必填） */
  issuedAt: string;
  /** 证书子类型 / 等级字典 code（可选；≤ 64；typeCode=cert_sub_type） */
  certSubTypeCode?: string;
  /** 证书编号（中敏感；可选；≤ 128） */
  certNumber?: string;
  /** 到期日（ISO 8601；可选；不传 = 终身有效） */
  expiredAt?: string;
};

/**
 * 部分更新证书入参（后端 `UpdateCertificateDto`；全字段 optional）。
 * 后端**禁止**改 id / memberId / certStatusCode / verifiedBy / verifiedAt / verifyNote /
 * isInternal / supersededByCertId / expireNotifyDueAt，故前端只提交资料字段。
 */
export type UpdateCertificateBody = Partial<CreateCertificateBody>;

/** 写操作返回单条证书（200 body 契约未声明 schema，前端不消费返回值，按既有约定回 `CertificateItem`）。 */
export type CertificateMutationResult = Envelope<CertificateItem>;

/**
 * 新增证书 `POST /api/admin/v1/members/{memberId}/certificates`（rbac: `certificate.create.record`）。
 * 默认 certStatusCode=pending / isInternal=false；队员不存在 404 / 字典 code 非法等 → 弹其 message。
 */
export const createMemberCertificate = (
  memberId: string,
  body: CreateCertificateBody
) =>
  http.request<CertificateMutationResult>(
    "post",
    `/api/admin/v1/members/${memberId}/certificates`,
    { data: body }
  );

/**
 * 部分更新证书 `PATCH /api/admin/v1/members/{memberId}/certificates/{id}`（rbac: `certificate.update.record`）。
 * 仅资料字段；后端拒绝系统字段或非法值时 → 弹其 message。
 */
export const updateMemberCertificate = (
  memberId: string,
  id: string,
  body: UpdateCertificateBody
) =>
  http.request<CertificateMutationResult>(
    "patch",
    `/api/admin/v1/members/${memberId}/certificates/${id}`,
    { data: body }
  );

/**
 * 软删证书 `DELETE /api/admin/v1/members/{memberId}/certificates/{id}`（rbac: `certificate.delete.record`）。
 * 写 deletedAt，不物理删除。
 */
export const deleteMemberCertificate = (memberId: string, id: string) =>
  http.request<Envelope<CertificateItem | null>>(
    "delete",
    `/api/admin/v1/members/${memberId}/certificates/${id}`
  );

/* --------------------------- 证书 核验 写操作 --------------------------- */

/** 核验通过入参（后端 `VerifyCertificateDto`；不接收 issuedAt / expiredAt / 系统字段）。 */
export type VerifyCertificateBody = {
  /** 核验备注（可选；≤ 500） */
  verifyNote?: string;
};

/** 核验拒绝入参（后端 `RejectCertificateDto`）。 */
export type RejectCertificateBody = {
  /** 拒绝原因（必填；≤ 500） */
  verifyNote: string;
};

/**
 * 核验通过 `PATCH /api/admin/v1/members/{memberId}/certificates/{id}/verify`
 * （rbac: `certificate.verify.record`）。
 * pending → verified；`verifyNote` 可选；非 pending 等非法流转后端拒绝 → 弹其 message。
 */
export const verifyMemberCertificate = (
  memberId: string,
  id: string,
  body: VerifyCertificateBody
) =>
  http.request<CertificateMutationResult>(
    "patch",
    `/api/admin/v1/members/${memberId}/certificates/${id}/verify`,
    { data: body }
  );

/**
 * 核验拒绝 `PATCH /api/admin/v1/members/{memberId}/certificates/{id}/reject`
 * （rbac: `certificate.reject.record`）。
 * pending → rejected；`verifyNote` 必填；非法流转后端拒绝 → 弹其 message。
 */
export const rejectMemberCertificate = (
  memberId: string,
  id: string,
  body: RejectCertificateBody
) =>
  http.request<CertificateMutationResult>(
    "patch",
    `/api/admin/v1/members/${memberId}/certificates/${id}/reject`,
    { data: body }
  );

/* --------------------------- 资质核验（只读判定） --------------------------- */

/** 资质判定结果（后端 `QualificationFlagResponseDto`）。 */
export type QualificationFlagResult = Envelope<{
  memberId: string;
  certTypeCode: string;
  /** 已核验 + 未过期 + 未软删 = true；不满足任一条件 = false（草案 §9.3 / Q-S9） */
  qualified: boolean;
}>;

/**
 * 资质判定 `GET /api/admin/v1/members/{memberId}/certificates/qualification-flag`
 * （rbac: `certificate.read.record`，与证书列表同码）。查询队员在某证书大类下
 * 是否具备资质：只返布尔 + 回显查询参数，不返回具体证书记录明细。
 */
export const getQualificationFlag = (memberId: string, certTypeCode: string) =>
  http.request<QualificationFlagResult>(
    "get",
    `/api/admin/v1/members/${memberId}/certificates/qualification-flag`,
    { params: { certTypeCode } }
  );
