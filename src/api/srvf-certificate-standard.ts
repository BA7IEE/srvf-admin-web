import { http } from "@/utils/http";
import { bizErrorMessage } from "./srvf-error";

/** 后端统一成功信封（失败为 HTTP 4xx，axios reject） */
type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * 证书标准库（P7-2 配置面）。字段全部对齐 live `/api/docs-json`（2026-08-02 后端 v0.65.0 实测），
 * 勿凭蓝图或记忆写字段名。
 *
 * 背景模型：证书的类别 / 等级 / 内部属性**不在证书行上**，由 `standardId → CertificateStandard`
 * 唯一决定；「按什么规则认定」由版本化的 `RecognitionPolicy` 锁定。一张证书在建证 / 审核当时
 * 锁定的规则版本就是它终身的依据（D-CERT-008），后续换版本不影响历史证书。
 *
 * ⚠️ **`code` 是全库唯一一个不可挽回的字段**：创建后永不可改，且 unique **含软删行**——
 * 软删一个标准**不会**释放它的 code。所以建标准表单必须做原样重输确认（见 code-confirm.vue）。
 */

/* ------------------------------ 证书标准 ------------------------------ */

/** FAMILY = 仅目录分组（不可被认定 / 不可持有）；CREDENTIAL = 可持有的具体证书标准 */
export type CertificateStandardKind = "FAMILY" | "CREDENTIAL";

/** DRAFT 可改身份字段 / ACTIVE 可用于认定与建证 / INACTIVE 不出现在新建选项 */
export type CertificateStandardStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

/** 证书标准（后端 `CertificateStandardResponseDto`） */
export type CertificateStandard = {
  id: string;
  /** 标准 code（长期稳定标识，创建后不可改不可复用） */
  code: string;
  name: string;
  /** 说明（≤500） */
  description: string | null;
  kind: CertificateStandardKind;
  /** 类别字典 code（`cert_type`） */
  categoryCode: string;
  /** 等级 / 子类型字典 code（`cert_sub_type`） */
  levelCode: string | null;
  /** 父级标准 id（必为 FAMILY，且与父级 categoryCode 一致） */
  parentId: string | null;
  /** 是否本会颁发 */
  isInternal: boolean;
  status: CertificateStandardStatus;
  /** 排序权重（越小越前） */
  sortOrder: number;
  /**
   * 首次启用时刻。**非 null = 这个标准曾经 ACTIVE 过**，此后身份字段永久锁死
   * （即便现在又切回 DRAFT/INACTIVE 也改不了，18033）——身份字段可编辑性判定看它，不只看 status。
   */
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CertificateStandardListQuery = {
  page?: number;
  pageSize?: number;
  kind?: CertificateStandardKind;
  categoryCode?: string;
  levelCode?: string;
  status?: CertificateStandardStatus;
  /** 按父级过滤（取某 FAMILY 的直接子节点） */
  parentId?: string;
  /** 模糊搜 name / code */
  q?: string;
};

/**
 * 列出证书标准 `GET /api/admin/v1/certificate-standards`
 * （rbac: `certificate-standard.read.record`）。
 */
export const getCertificateStandards = (
  params?: CertificateStandardListQuery
) =>
  http.request<Envelope<PageResult<CertificateStandard>>>(
    "get",
    "/api/admin/v1/certificate-standards",
    { params }
  );

/**
 * 新建证书标准入参（后端 `CreateCertificateStandardDto`）。
 *
 * ⚠️ **可选字段要么给真值，要么整条省掉——不要传显式 `null`**：`levelCode` / `parentId` /
 * `isInternal` / `sortOrder` 在建标准这一步传 `null` 会被契约层拒成 400
 * （后端 `docs/ops/certificate-standard-library-initialization.md` §二）。
 * 改标准（PATCH）不同，那里 `levelCode` / `parentId` / `description` 传 null 是合法的清空动作。
 */
export type CreateCertificateStandardBody = {
  /** 标准 code（小写字母 / 数字 / 下划线 / 中横线，≤64；**创建后不可改不可复用**） */
  code: string;
  /** 标准名称（≤128） */
  name: string;
  kind: CertificateStandardKind;
  /** 类别字典 code（必须是 ACTIVE 的 `cert_type` 条目） */
  categoryCode: string;
  /** 说明（≤500） */
  description?: string;
  /** 等级字典 code（非空时必须是 ACTIVE 的 `cert_sub_type` 条目） */
  levelCode?: string;
  /** 父级标准 id（必为 FAMILY 且同 categoryCode） */
  parentId?: string;
  /** 是否本会颁发（默认 false） */
  isInternal?: boolean;
  /** 排序权重（默认 0） */
  sortOrder?: number;
};

/**
 * 新建证书标准 `POST /api/admin/v1/certificate-standards`
 * （rbac: `certificate-standard.create.record`）。**初始恒 DRAFT**，不能用于建证。
 */
export const createCertificateStandard = (
  body: CreateCertificateStandardBody
) =>
  http.request<Envelope<CertificateStandard>>(
    "post",
    "/api/admin/v1/certificate-standards",
    { data: body }
  );

/**
 * 修改证书标准入参（后端 `UpdateCertificateStandardDto`；全字段 optional）。
 *
 * 分两组，可改性不同：
 * - **文案组** `name` / `description` / `sortOrder`：任何状态都可改；
 * - **身份组** `kind` / `categoryCode` / `levelCode` / `parentId` / `isInternal`：
 *   **仅当该标准仍是 DRAFT 且从未启用过**（`activatedAt === null`）才可改；
 *   首次切 ACTIVE 之后永久拒绝（18033），哪怕后来又切回 INACTIVE。
 *
 * `code` 不在本 DTO 里——它永不可改。
 */
export type UpdateCertificateStandardBody = {
  name?: string;
  /** 传 null = 清空说明 */
  description?: string | null;
  sortOrder?: number;
  kind?: CertificateStandardKind;
  categoryCode?: string;
  /** 传 null = 清空等级 */
  levelCode?: string | null;
  /** 传 null = 从树上摘到根 */
  parentId?: string | null;
  isInternal?: boolean;
};

/**
 * 修改证书标准 `PATCH /api/admin/v1/certificate-standards/{id}`
 * （rbac: `certificate-standard.update.record`）。
 */
export const updateCertificateStandard = (
  id: string,
  body: UpdateCertificateStandardBody
) =>
  http.request<Envelope<CertificateStandard>>(
    "patch",
    `/api/admin/v1/certificate-standards/${id}`,
    { data: body }
  );

/**
 * 软删证书标准 `DELETE /api/admin/v1/certificate-standards/{id}`
 * （rbac: `certificate-standard.delete.record`）。
 * 被子节点 / 认定规则 / 申报 / 证书引用时禁删（18032）。
 * ⚠️ 软删**不释放 code**——删掉不等于那个 code 能重新用。
 */
export const deleteCertificateStandard = (id: string) =>
  http.request<Envelope<null>>(
    "delete",
    `/api/admin/v1/certificate-standards/${id}`
  );

/**
 * 证书标准状态迁移 `PATCH /api/admin/v1/certificate-standards/{id}/status`
 * （rbac: `certificate-standard.update.record`）。
 * 允许 DRAFT→ACTIVE / ACTIVE→INACTIVE / INACTIVE→ACTIVE；**不接受回退到 DRAFT**。
 * 恢复 ACTIVE 前后端会重校验字典与父级（可能报 18010 / 18011 / 18012 / 18019）。
 */
export const updateCertificateStandardStatus = (
  id: string,
  status: "ACTIVE" | "INACTIVE"
) =>
  http.request<Envelope<CertificateStandard>>(
    "patch",
    `/api/admin/v1/certificate-standards/${id}/status`,
    { data: { status } }
  );

/* ------------------------------ 认定规则 ------------------------------ */

/** DRAFT 可编辑 / ACTIVE 生效且只读 / RETIRED 已退役且只读 */
export type RecognitionPolicyStatus = "DRAFT" | "ACTIVE" | "RETIRED";

/**
 * 机构策略：
 * - `FIXED` 恰好 1 个机构（建证时可不传，后端选唯一）
 * - `ALLOWLIST` ≥1 个（建证时必须传 `recognitionIssuerId`）
 * - `FREE_TEXT` 0 个（建证时填自由文本 `issuingOrg`）
 */
export type IssuerPolicy = "FIXED" | "ALLOWLIST" | "FREE_TEXT";

/**
 * 有效期模式：
 * - `PERMANENT` 到期日必须空
 * - `FIXED_MONTHS` 后端按自然月算（客户端不得传到期日）
 * - `EXPLICIT_REQUIRED` 建证时必填到期日
 * - `EXPLICIT_OPTIONAL` 可空即终身
 */
export type ValidityMode =
  | "PERMANENT"
  | "FIXED_MONTHS"
  | "EXPLICIT_REQUIRED"
  | "EXPLICIT_OPTIONAL";

/** 编号规则 */
export type CertNumberMode = "REQUIRED" | "OPTIONAL" | "NONE";

/** 认可机构（后端 `CertificateRecognitionIssuerResponseDto`） */
export type RecognitionIssuer = {
  id: string;
  /** 机构名称（canonical） */
  name: string;
  sortOrder: number;
};

/** 认定规则（后端 `CertificateRecognitionPolicyResponseDto`） */
export type RecognitionPolicy = {
  id: string;
  standardId: string;
  /** 版本号（同标准内递增，服务端在行锁内分配） */
  version: number;
  status: RecognitionPolicyStatus;
  issuerPolicy: IssuerPolicy;
  validityMode: ValidityMode;
  /** 仅 FIXED_MONTHS 有值（1-600）；其余模式恒 null */
  validityMonths: number | null;
  certNumberMode: CertNumberMode;
  activatedAt: string | null;
  retiredAt: string | null;
  /** 认可机构集合（随 DRAFT 整体替换；FREE_TEXT 时为空数组） */
  issuers: RecognitionIssuer[];
  createdAt: string;
  updatedAt: string;
};

/**
 * 列出某标准的全部认定规则版本
 * `GET /api/admin/v1/certificate-standards/{standardId}/recognition-policies`
 * （rbac: `certificate-recognition-policy.read.record`）。
 * **无分页**，version DESC，含 DRAFT / ACTIVE / RETIRED。
 */
export const getRecognitionPolicies = (standardId: string) =>
  http.request<Envelope<{ items: RecognitionPolicy[] }>>(
    "get",
    `/api/admin/v1/certificate-standards/${standardId}/recognition-policies`
  );

/** 认可机构入参（后端 `CertificateRecognitionIssuerInputDto`；提交只给名字，id 由后端分配） */
export type RecognitionIssuerInput = {
  /** 机构名称（≤128） */
  name: string;
  /** 排序权重（默认按数组顺序） */
  sortOrder?: number;
};

/**
 * 新建认定规则入参（后端 `CreateCertificateRecognitionPolicyDto`）。
 *
 * ⚠️ `validityMonths` **仅** FIXED_MONTHS 允许且必填（1-600）；其余模式传值即 18015。
 * ⚠️ `issuers` 数量受 `issuerPolicy` 约束：FIXED 恰好 1 / ALLOWLIST ≥1 / FREE_TEXT 必须空，
 * 同名去重后仍重复即 18013。
 */
export type CreateRecognitionPolicyBody = {
  issuerPolicy: IssuerPolicy;
  validityMode: ValidityMode;
  validityMonths?: number;
  certNumberMode: CertNumberMode;
  issuers: RecognitionIssuerInput[];
};

/**
 * 新建认定规则版本
 * `POST /api/admin/v1/certificate-standards/{standardId}/recognition-policies`
 * （rbac: `certificate-recognition-policy.create.record`）。**恒 DRAFT**，version 由服务端分配。
 */
export const createRecognitionPolicy = (
  standardId: string,
  body: CreateRecognitionPolicyBody
) =>
  http.request<Envelope<RecognitionPolicy>>(
    "post",
    `/api/admin/v1/certificate-standards/${standardId}/recognition-policies`,
    { data: body }
  );

/**
 * 修改 DRAFT 认定规则入参（后端 `UpdateCertificateRecognitionPolicyDto`；全字段 optional）。
 *
 * ⚠️ `issuers` **传即整体替换**，不做增量 merge；不传则保持不动。
 * 所以机构清单编辑必须整组提交（表单里就是整块编辑的那一组）。
 */
export type UpdateRecognitionPolicyBody = {
  issuerPolicy?: IssuerPolicy;
  validityMode?: ValidityMode;
  /** 仅 FIXED_MONTHS；本 DTO 不接受 null（「清空」由不传表达） */
  validityMonths?: number;
  certNumberMode?: CertNumberMode;
  issuers?: RecognitionIssuerInput[];
};

/**
 * 修改认定规则 `PATCH /api/admin/v1/certificate-recognition-policies/{id}`
 * （rbac: `certificate-recognition-policy.update.record`）。
 * **仅 DRAFT 可改**，ACTIVE / RETIRED 恒 18036。
 */
export const updateRecognitionPolicy = (
  id: string,
  body: UpdateRecognitionPolicyBody
) =>
  http.request<Envelope<RecognitionPolicy>>(
    "patch",
    `/api/admin/v1/certificate-recognition-policies/${id}`,
    { data: body }
  );

/**
 * 软删认定规则 `DELETE /api/admin/v1/certificate-recognition-policies/{id}`
 * （rbac: `certificate-recognition-policy.delete.record`）。
 * **仅 DRAFT 可删**，ACTIVE / RETIRED 恒 18036。
 */
export const deleteRecognitionPolicy = (id: string) =>
  http.request<Envelope<null>>(
    "delete",
    `/api/admin/v1/certificate-recognition-policies/${id}`
  );

/**
 * 激活认定规则 `PATCH /api/admin/v1/certificate-recognition-policies/{id}/status`
 * （rbac: `certificate-recognition-policy.update.record`）。
 *
 * **只接受 `ACTIVE`**：激活本版并**原子退役**该标准当前生效版。
 * 不接受 DRAFT（已激活 / 退役的规则永不可回，D-CERT-007），也不接受 RETIRED。
 * 已锁定旧版本的历史证书不受影响（D-CERT-008）。
 */
export const activateRecognitionPolicy = (id: string) =>
  http.request<Envelope<RecognitionPolicy>>(
    "patch",
    `/api/admin/v1/certificate-recognition-policies/${id}/status`,
    { data: { status: "ACTIVE" } }
  );

/* ------------------------------ 错误码翻译 ------------------------------ */

/**
 * 证书标准库域错误码 → 人话三段式（出了什么事 / 为什么 / 怎么办）。
 *
 * 码义来源：live `/api/docs-json` 各端点 responses（18002~18040），
 * 加上后端 `docs/ops/certificate-standard-library-initialization.md` 明文记载但未进 spec 的
 * 18033 / 18035 两码。均为后端权威文档，非前端臆造。
 */
export function certificateStandardBizErrorMessage(
  error: unknown,
  fallback: string
): string {
  const data = (
    error as { response?: { data?: { code?: unknown; message?: string } } }
  )?.response?.data;
  const code = Number(data?.code);

  switch (code) {
    case 18002:
      return "找不到这个证书标准（18002）：它可能刚被别人删除了。请刷新列表后重试";
    case 18003:
      return "这个 code 已经被占用了（18003）：证书标准的 code 全库唯一，而且**软删的标准也仍然占着它**。请换一个 code——同名标准可以有，同 code 不行";
    case 18004:
      return "找不到这条认定规则（18004）：它可能刚被别人删除了。请刷新右侧版本列表后重试";
    case 18010:
      return "证书大类填错了（18010）：所选类别在字典里不存在或已停用。请到 设置中心 → 字典管理 的「证书大类」（cert_type）确认后再选";
    case 18011:
      return "证书等级填错了（18011）：所选等级在字典里不存在或已停用。请到 设置中心 → 字典管理 的「证书等级 / 子类型」（cert_sub_type）确认后再选，或留空不设等级";
    case 18012:
      return "这是一个目录节点（18012）：FAMILY 只用来分组，本身不能被认定、也不能持有证书。请改用 CREDENTIAL 类型的标准";
    case 18013:
      return "认可机构配置不符合规则（18013）：FIXED 要恰好 1 个机构、ALLOWLIST 至少 1 个、FREE_TEXT 必须一个都不填，且机构名不能重复。请按所选机构策略调整清单";
    case 18015:
      return "有效期配置不符合规则（18015）：只有「固定月数」才填月数（1-600），其余三种模式都不能填。请检查有效期模式与月数是否配套";
    case 18019:
      return "父级标准不合法（18019）：父级必须是 FAMILY 目录节点、且类别与子节点一致，也不能形成循环。请换一个父级或不挂树";
    case 18031:
      return "证书标准还没启用（18031）：只有 ACTIVE 的标准才能激活认定规则。请先把左侧标准启用，再回来激活规则";
    case 18032:
      return "这个标准已经被引用，不能删除（18032）：它下面还挂着子标准、认定规则、证书申报或已建的证书。请先处理这些引用，或改用「停用」把它从新建选项里撤下";
    case 18033:
      return "身份字段已经锁死了（18033）：标准一旦启用过，类型 / 类别 / 等级 / 父级 / 是否本会颁发就永久不可改（即使现在是停用态）。只有名称、说明、排序还能修正";
    case 18034:
      return "当前状态不允许这个操作（18034）：证书标准只走 DRAFT→启用→停用→启用，启用过就回不到草稿。请刷新后按最新状态重试";
    case 18035:
      return "这个标准还没有生效的认定规则（18035）：标准本身「已收录」，但还缺一条 ACTIVE 认定规则才能用于建证。请在右侧新建规则并激活它";
    case 18036:
      return "生效或已退役的规则不能改（18036）：认定规则一旦激活就只读，这是刻意的——改认可范围属于规则变更，应该留下版本痕迹。请新建一个版本再激活";
    case 18037:
      return "规则当前状态不允许这个操作（18037）：只有 DRAFT 版本能被激活，已激活 / 已退役的版本不可回退。请刷新后按最新状态重试";
    case 18039:
      return "版本号刚被别人占用了（18039）：有人同时在给这个标准新建规则版本。请刷新右侧列表后重新提交";
    case 18040:
      return "这个标准刚被别人配好了生效规则（18040）：请刷新右侧版本列表，确认最新的生效版本后再决定是否激活本版";
    default:
      return bizErrorMessage(error, fallback);
  }
}
