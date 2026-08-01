import { http } from "@/utils/http";

/** 后端统一成功信封（失败为 HTTP 4xx，axios reject） */
type Envelope<T> = { code: number; message: string; data: T };

/**
 * 队员证书（后端 `CertificateResponseDto`）。字段以 live `/api/docs-json` 为准，勿前端臆造。
 *
 * ⚠️ **证书标准库上线后的模型变化**：证书的类别 / 等级 **不再存在证书行上**——
 * 旧的 `certTypeCode` / `certSubTypeCode` 已从契约移除，改由 `standardId` 关联的
 * 「证书标准」唯一决定。一切分类展示从标准取，不再读证书行上的类型码。
 */
export type CertificateItem = {
  id: string;
  memberId: string;
  /** 证书标准 id（分类 / 等级的唯一权威；经 `certificate-standards/options` 换名称） */
  standardId: string | null;
  /** 录入 / 审核时锁定的认定规则 id */
  recognitionPolicyId: string | null;
  /** 认可机构 id（FREE_TEXT 规则下为 null，机构名见 `issuingOrg`） */
  recognitionIssuerId: string | null;
  /** 颁发机构名称快照（认定规则解析后的结果） */
  issuingOrg: string;
  /**
   * 证书编号**掩码**（恒返，形如 `SZ****01`；无编号为 null）。
   * 列表 / 详情展示一律用它。**绝不可拿它回写**——见 `UpdateCertificateBody`。
   */
  certNumberMasked: string | null;
  /**
   * 证书编号**明文**：仅在持 `certificate.read.sensitive` 且通过该证书 scoped 判权时返回，
   * 否则恒 null。编辑表单只能用它回填；为 null 时该输入必须禁用。
   */
  certNumberFull: string | null;
  /** 颁发日期（ISO 8601） */
  issuedAt: string;
  /** 到期日（null = 终身有效） */
  expiredAt: string | null;
  /** 核验状态字典 code（四态闭集 pending / verified / expired / rejected） */
  certStatusCode: string;
  /** 核验人 Member.id（无 `certificate.read.sensitive` 时恒 null） */
  verifiedBy: string | null;
  /** 核验时间 */
  verifiedAt: string | null;
  /** 核验备注（无 `certificate.read.sensitive` 时恒 null） */
  verifyNote: string | null;
  /** 是否存在证据图（只给布尔；取图走 evidence-urls 端点，本轮不做） */
  evidenceAvailable: boolean;
  /** 来源：ADMIN = 管理端录入 / RECRUITMENT = 招新发号搬运 */
  sourceCode: string | null;
  /** 替代关系：被替代的旧证书 id */
  supersededByCertId: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 证书状态 code → tag 颜色（仅展示色；状态码来自后端字典，前端不臆造） */
export const CERT_STATUS_TAG: Record<
  string,
  "success" | "warning" | "danger" | "info"
> = {
  verified: "success",
  pending: "warning",
  rejected: "danger",
  expired: "info"
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
 * 新增证书入参（后端 `CreateCertificateDto`）。必填 `standardId` + `issuedAt`。
 *
 * 机构三选一由所选标准的**生效认定规则** `issuerPolicy` 决定，传错字段后端直接拒：
 * - `ALLOWLIST` → `recognitionIssuerId` 必填，**不得**传 `issuingOrg`
 * - `FIXED`     → 两者都不传（后端选唯一机构）
 * - `FREE_TEXT` → `issuingOrg` 必填，**不得**传 `recognitionIssuerId`
 *
 * 到期日由 `validityMode` 决定：`PERMANENT` 必须空 / `FIXED_MONTHS` **客户端不得传**（后端算）/
 * `EXPLICIT_REQUIRED` 必填 / `EXPLICIT_OPTIONAL` 可空即终身。
 *
 * 日期是**纯日期 `YYYY-MM-DD`**，不接受时分秒与时区（按北京日历日入库）。
 */
export type CreateCertificateBody = {
  /** 证书标准 id（必填；须为 ACTIVE 且 CREDENTIAL；来源 `certificate-standards/options`） */
  standardId: string;
  /** 颁发日期（纯日期 YYYY-MM-DD；不得晚于今天；必填） */
  issuedAt: string;
  /** 认可机构 id（ALLOWLIST 必填；FIXED 可不传；FREE_TEXT 不得传） */
  recognitionIssuerId?: string;
  /** 自由机构名（仅 FREE_TEXT 规则必填；FIXED / ALLOWLIST 不得传） */
  issuingOrg?: string;
  /** 证书编号（中敏感；按 certNumberMode：REQUIRED 必填 / OPTIONAL 可空 / NONE 不填） */
  certNumber?: string;
  /** 最后有效日（纯日期 YYYY-MM-DD；按 validityMode，见上） */
  expiredAt?: string;
};

/**
 * 部分更新证书入参（后端 `UpdateCertificateDto`；全字段 optional）。
 * 后端**禁止**改 id / memberId / certStatusCode / verifiedBy / verifiedAt / verifyNote /
 * isInternal / supersededByCertId / expireNotifyDueAt，故前端只提交资料字段。
 *
 * ⚠️ **三态语义,踩错就是删数据**：本 DTO 的可空字段区分「不传」与「显式 null」——
 * **不传 = 保持原值；传 null = 真的清空**。所以表单必须做到「用户没改的字段不发 key」，
 * 不能像别处那样把整张表单原样提交，否则用户没碰过的机构 / 编号 / 到期日会被清成 null。
 * （`issuedAt` 库内 NOT NULL，**不接受 null**；`standardId` 仅 pending 态可改，非 pending → 18033。）
 *
 * ⚠️ **编号防掩码回写**：读响应给的是 `certNumberMasked`（`SZ****01`）。
 * 编辑只能用 `certNumberFull` 回填；无 `certificate.read.sensitive` 时它恒 null，
 * 此时该字段必须禁用且**绝不提交**——否则掩码串会覆盖真实编号。
 */
export type UpdateCertificateBody = {
  standardId?: string;
  /** 传 null = 清空 */
  recognitionIssuerId?: string | null;
  /** 传 null = 清空 */
  issuingOrg?: string | null;
  /** 传 null = 清空（OPTIONAL 编号规则下可改回无编号） */
  certNumber?: string | null;
  /** 纯日期 YYYY-MM-DD；不接受 null */
  issuedAt?: string;
  /** 不传 = 保持原值；传 null = 清成终身有效 */
  expiredAt?: string | null;
};

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

/* --------------------------- 证书标准选择器（建证 / 编辑用） --------------------------- */

/** 认可机构选项（`CertificateStandardOptionIssuerDto`；提交用 id，不用机构文字）。 */
export type CertificateStandardIssuer = { id: string; name: string };

/**
 * 标准当前生效的认定规则摘要（`CertificateStandardOptionPolicyDto`）。
 * 表单的机构字段形态、到期日必填性、编号必填性**全由它决定**，不要前端另定规则。
 */
export type CertificateStandardPolicy = {
  id: string;
  version: number;
  /** FIXED = 后端自动选唯一机构 / ALLOWLIST = 必须从 issuers 选 / FREE_TEXT = 自由填写 */
  issuerPolicy: "FIXED" | "ALLOWLIST" | "FREE_TEXT";
  /** PERMANENT 到期日必须空 / FIXED_MONTHS 后端算（客户端不得传）/ EXPLICIT_REQUIRED 必填 / EXPLICIT_OPTIONAL 可空即终身 */
  validityMode:
    | "PERMANENT"
    | "FIXED_MONTHS"
    | "EXPLICIT_REQUIRED"
    | "EXPLICIT_OPTIONAL";
  /** 仅 FIXED_MONTHS 有值（1-600） */
  validityMonths: number | null;
  /** 编号规则 */
  certNumberMode: "REQUIRED" | "OPTIONAL" | "NONE";
  /** 认可机构选项（FREE_TEXT 时为空数组） */
  issuers: CertificateStandardIssuer[];
};

/** 证书标准选项（`CertificateStandardOptionItemDto`）。 */
export type CertificateStandardOption = {
  id: string;
  code: string;
  name: string;
  /** 类别字典 code */
  categoryCode: string;
  /** 等级字典 code */
  levelCode: string | null;
  /** 是否本会颁发 */
  isInternal: boolean;
  /**
   * 当前是否可用于认定 = 存在 ACTIVE 认定规则。
   * false 代表「**已收录、待认定**」——这是正常态不是错误，但后台不得据此直接建证 / 通过。
   */
  currentlyRecognized: boolean;
  /** 当前 ACTIVE 认定规则摘要；`currentlyRecognized=false` 时为 null */
  currentPolicy: CertificateStandardPolicy | null;
};

/**
 * 证书标准选择器 `GET /api/admin/v1/certificate-standards/options`。
 * 只返 CREDENTIAL（证书族 FAMILY 不可持有）。建证 / 编辑下拉一律传 `recognizedOnly=true`
 * ——只有存在 ACTIVE 认定规则的标准才建得出证书。
 * `limit` 后端上限 200（默认 50）。
 */
export const getCertificateStandardOptions = (params?: {
  recognizedOnly?: boolean;
  categoryCode?: string;
  q?: string;
  limit?: number;
}) =>
  http.request<Envelope<{ items: CertificateStandardOption[] }>>(
    "get",
    "/api/admin/v1/certificate-standards/options",
    { params }
  );

/* --------------------------- 资质核验（只读判定） --------------------------- */

/** 资质判定结果（后端 `QualificationFlagResponseDto`）。 */
export type QualificationFlagResult = Envelope<{
  memberId: string;
  criterionType: CertificateCriterionType;
  criterionCode: string;
  /** 已核验 + 未过期 + 未软删 = true */
  qualified: boolean;
  /** 命中的证书 id（不具备资质时为 null） */
  matchedCertificateId: string | null;
  /** 命中证书的最后有效日（null = 终身有效，或不具备资质） */
  expiredAt: string | null;
}>;

/** 判据级别：按证书大类，还是按具体证书标准。 */
export type CertificateCriterionType = "category" | "standard";

/**
 * 资质判定 `GET /api/admin/v1/members/{memberId}/certificates/qualification-flag`
 * （rbac: `certificate.read.record`）。
 *
 * ⚠️ 入参已从单个 `certTypeCode` 换成 **`criterionType` + `criterionCode` 两参**：
 * - `criterionType=category` → `criterionCode` 是 `cert_type` 字典 code
 * - `criterionType=standard` → `criterionCode` 是**证书标准的 code**（稳定 code，不是 cuid）
 *
 * code 写错时后端报 18010 / 18002（「判据不存在」），**这与「查到了但不合格」是两回事**——
 * 调用方文案必须严格分开，不能把配置错误显示成「该队员不具备资质」。
 */
export const getQualificationFlag = (
  memberId: string,
  criterionType: CertificateCriterionType,
  criterionCode: string
) =>
  http.request<QualificationFlagResult>(
    "get",
    `/api/admin/v1/members/${memberId}/certificates/qualification-flag`,
    { params: { criterionType, criterionCode } }
  );

/**
 * 资质判定失败的专用文案。
 * 18010 / 18002 = **判据本身不存在**（大类 code 或标准 code 填错 / 已下线），
 * 属于配置问题，绝不能显示成「不具备资质」——那会让人以为队员缺证。
 */
export function qualificationErrorMessage(
  error: unknown,
  fallback: string
): string {
  const data = (
    error as { response?: { data?: { code?: unknown; message?: string } } }
  )?.response?.data;
  const code = Number(data?.code);
  if (code === 18010 || code === 18002)
    return `查不到这个判据（${code}）：大类或证书标准的 code 可能填错了或已下线——这不代表该队员不具备资质，请先核对判据配置`;
  return data?.message ?? fallback;
}
