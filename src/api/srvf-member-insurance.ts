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
 */
export const getMemberInsurances = (memberId: string) =>
  http.request<Envelope<MemberInsuranceItem[]>>(
    "get",
    `/api/admin/v1/members/${memberId}/insurances`
  );
