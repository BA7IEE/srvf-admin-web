import { http } from "@/utils/http";

/** 后端统一成功信封（失败为 HTTP 4xx，axios reject） */
type Envelope<T> = { code: number; message: string; data: T };

/**
 * 队员自购保险列表项（后端 `MemberInsuranceAdminResponseDto`）。
 * 字段以 live `/api/docs-json` 为准，勿前端臆造。
 * 本资源**无状态 / 类型字典 code**——有效性唯一依据 = `coverageEnd`（覆盖含当日，
 * 后端字段描述原文），故无需 srvfDict 翻译。
 */
export type MemberInsuranceItem = {
  /** 保险记录 id（cuid） */
  id: string;
  /** 队员 id */
  memberId: string;
  /** 保险公司 */
  insurerName: string;
  /** 保单号 */
  policyNumber: string;
  /** 起保日期（ISO 8601；可空 = 未填写，不参与起保校验） */
  coverageStart: string | null;
  /** 到期日期（ISO 8601；有效性唯一依据，覆盖含当日） */
  coverageEnd: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
};

/**
 * 某队员的自购保险列表（**无分页**，按 coverageEnd DESC，软删过滤）。
 * `GET /api/admin/v1/members/{memberId}/insurances`（rbac: `member-insurance.read.other`）。
 * admin 侧**只读**；本人侧（小程序）的增删改走 `app/v1/me/insurances`，admin 后台不调（踩坑 6）。
 *
 * **本仓已无消费方**——保险 tab 自 v0.64 起改用统一概览 `getMemberInsuranceOverview`
 * （自购 + 队内两段一次取齐）。此函数刻意保留：它是这条端点唯一的封装，
 * 「只要自购一段、不要队内段」的场景（如导出/对账）还会用到，删了得重新对一遍契约。
 */
export const getMemberInsurances = (memberId: string) =>
  http.request<Envelope<MemberInsuranceItem[]>>(
    "get",
    `/api/admin/v1/members/${memberId}/insurances`
  );

/* ============================ 统一保险概览（tab 主源） ============================ */

/** 相对 `asOfDate` 的日期状态（**后端算好直接用，前端不要拿 coverageEnd 自己判**）。 */
export type InsuranceDateStatus = "upcoming" | "active" | "expired";

/** 概览汇总（后端 `MemberInsuranceOverviewSummaryDto`）。 */
export type MemberInsuranceOverviewSummary = {
  /** 日期有效的个人自购数（含 pending / verified / rejected） */
  dateActiveSelfPurchasedCount: number;
  /** 日期有效**且审核事实完整**的个人自购数 */
  confirmedActiveSelfPurchasedCount: number;
  /** 日期有效的队内统一覆盖数 */
  dateActiveTeamProvidedCount: number;
  /**
   * 是否存在系统已确认的当前保险来源（确认自购 或 有效团队覆盖，任一即可）。
   * ⚠️ 后端字段描述原文：**不等价于具体活动或入队资格**——
   * 界面上必须写清这一句，否则会被当成「这人可以报名了」的判定依据。
   */
  hasConfirmedCoverage: boolean;
  /** 已确认来源里最晚的到期日；无已确认来源时为 null */
  confirmedCoverageThrough: string | null;
};

/** 个人自购一行（后端 `MemberInsuranceOverviewSelfItemDto`）。 */
export type MemberInsuranceOverviewSelfItem = {
  id: string;
  insurerName: string;
  policyNumber: string;
  coverageStart: string | null;
  /** 到期日期（包含当日） */
  coverageEnd: string;
  /** 审核状态：pending / verified / rejected */
  reviewStatusCode: string;
  /** 乐观并发版本号——审核时必须原样回传 */
  version: number;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  dateStatus: InsuranceDateStatus;
};

/**
 * 队内统一覆盖一行（后端 `MemberInsuranceOverviewTeamItemDto`）。
 *
 * ⚠️ 这是**安全投影**：没有保单号、没有备注、也没有任何审核动作。
 * 少这些字段是设计而不是遗漏——保单明细在「队员 → 队保单」页看。
 */
export type MemberInsuranceOverviewTeamItem = {
  coverageId: string;
  policyId: string;
  insurerName: string;
  coverageStart: string;
  /** 到期日期（包含当日） */
  coverageEnd: string;
  /** 该队员加入本保单覆盖名单的时间 */
  coverageAddedAt: string;
  dateStatus: InsuranceDateStatus;
};

/** 队员统一保险概览（后端 `MemberInsuranceOverviewResponseDto`）。 */
export type MemberInsuranceOverview = {
  memberId: string;
  /** 本次派生状态所用的北京日 */
  asOfDate: string;
  summary: MemberInsuranceOverviewSummary;
  selfPurchased: MemberInsuranceOverviewSelfItem[];
  teamProvided: MemberInsuranceOverviewTeamItem[];
};

/**
 * 队员统一保险概览
 * `GET /api/admin/v1/members/{memberId}/insurances/overview`
 * （rbac: `member-insurance.read.other`）。
 *
 * 这是队员 360「保险」tab 的**主数据源**：个人自购（可审核）+ 队内统一覆盖（只读投影）。
 */
export const getMemberInsuranceOverview = (memberId: string) =>
  http.request<Envelope<MemberInsuranceOverview>>(
    "get",
    `/api/admin/v1/members/${memberId}/insurances/overview`
  );

/**
 * 自购保险审核入参（后端 `ReviewMemberInsuranceDto`）。
 *
 * ⚠️ **只有这两个字段，没有审核备注**——这是契约如此，不是前端省事。
 * `expectedVersion` 必填：传客户端最后读到的 `version`，冲突时后端返 26011。
 */
export type ReviewMemberInsuranceBody = {
  decision: "verified" | "rejected";
  expectedVersion: number;
};

/**
 * 记录队员自购保险审核结论
 * `POST /api/admin/v1/members/{memberId}/insurances/{insuranceId}/review`
 * （rbac: `member-insurance.review.record`）。**仅 pending 可审**。
 */
export const reviewMemberInsurance = (
  memberId: string,
  insuranceId: string,
  body: ReviewMemberInsuranceBody
) =>
  http.request<Envelope<MemberInsuranceOverviewSelfItem>>(
    "post",
    `/api/admin/v1/members/${memberId}/insurances/${insuranceId}/review`,
    { data: body }
  );

/* ----------------------------- 保险域错误码 → 人话 ----------------------------- */

/** 审核状态 code → 中文（契约三态闭集，前端不臆造）。 */
export const INSURANCE_REVIEW_STATUS_LABEL: Record<string, string> = {
  pending: "待核验",
  verified: "已核验",
  rejected: "已驳回"
};

export const INSURANCE_REVIEW_STATUS_TAG: Record<
  string,
  "success" | "warning" | "danger" | "info"
> = {
  pending: "warning",
  verified: "success",
  rejected: "danger"
};

/** 日期状态 code → 中文（后端派生，直接用）。 */
export const INSURANCE_DATE_STATUS_LABEL: Record<InsuranceDateStatus, string> =
  {
    upcoming: "未生效",
    active: "生效中",
    expired: "已过期"
  };

export const INSURANCE_DATE_STATUS_TAG: Record<
  InsuranceDateStatus,
  "success" | "warning" | "info"
> = {
  upcoming: "warning",
  active: "success",
  expired: "info"
};

/**
 * 保险域业务码 → 人话（码义取自后端 `biz-code.constant.ts`）。
 * - 26011 版本冲突：别人刚改过这条记录，本地拿的 version 过期了
 * - 26012 状态不允许重复审核：这条已经审过了
 */
export function memberInsuranceBizErrorMessage(
  error: unknown,
  fallback: string
): string {
  const data = (
    error as { response?: { data?: { code?: unknown; message?: string } } }
  )?.response?.data;
  const code = Number(data?.code);
  if (code === 26011)
    return "这条保险信息刚被其他人更新过（26011）：已为你刷新到最新状态，请核对后再决定";
  if (code === 26012)
    return "这条保险已经审核过了（26012）：不能重复审核；列表已刷新，请查看最新结论";
  return data?.message ?? fallback;
}
