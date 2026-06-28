import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** 队保单（后端 `TeamInsurancePolicyResponseDto`）。一张保单 = 一条;字段以 `/api/docs-json` 为准。 */
export type TeamInsurancePolicy = {
  id: string;
  insurerName: string;
  policyNumber: string;
  coverageStart: string;
  coverageEnd: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 创建队保单入参（起保 ≤ 到期否则 26010）。 */
export type CreatePolicyBody = {
  insurerName: string;
  policyNumber: string;
  coverageStart: string;
  coverageEnd: string;
  note?: string;
};
/** 部分更新（note 传空串清空）。 */
export type UpdatePolicyBody = Partial<CreatePolicyBody>;

/** 覆盖名单项（后端 `TeamInsuranceCoverageResponseDto`；含队员编号/姓名摘要）。 */
export type CoverageMember = {
  id: string;
  policyId: string;
  memberId: string;
  memberNo: string;
  memberDisplayName: string;
  createdAt: string;
};

export type PolicyListResult = Envelope<PageResult<TeamInsurancePolicy>>;
export type PolicyResult = Envelope<TeamInsurancePolicy>;
export type CoverageListResult = Envelope<PageResult<CoverageMember>>;
export type CoverageResult = Envelope<CoverageMember>;
export type AddAllActiveResult = Envelope<{ addedCount: number }>;

/** 队保单分页列表 `GET /api/admin/v1/team-insurance-policies`（rbac: `team-insurance-policy.read.record`）。 */
export const getTeamInsurancePolicies = (params?: {
  page?: number;
  pageSize?: number;
}) =>
  http.request<PolicyListResult>(
    "get",
    "/api/admin/v1/team-insurance-policies",
    { params }
  );

/** 创建队保单 `POST .../team-insurance-policies`（rbac: `team-insurance-policy.create.record`）。 */
export const createTeamInsurancePolicy = (body: CreatePolicyBody) =>
  http.request<PolicyResult>("post", "/api/admin/v1/team-insurance-policies", {
    data: body
  });

/** 部分更新队保单 `PATCH .../team-insurance-policies/{id}`（rbac: `team-insurance-policy.update.record`）。 */
export const updateTeamInsurancePolicy = (id: string, body: UpdatePolicyBody) =>
  http.request<PolicyResult>(
    "patch",
    `/api/admin/v1/team-insurance-policies/${id}`,
    { data: body }
  );

/** 软删队保单 `DELETE .../team-insurance-policies/{id}`（rbac: `team-insurance-policy.delete.record`；不级联覆盖行）。 */
export const deleteTeamInsurancePolicy = (id: string) =>
  http.request<PolicyResult>(
    "delete",
    `/api/admin/v1/team-insurance-policies/${id}`
  );

/** 保单覆盖名单分页 `GET .../team-insurance-policies/{id}/members`（rbac: `team-insurance-policy.read.record`）。 */
export const getCoverageMembers = (
  policyId: string,
  params?: { page?: number; pageSize?: number }
) =>
  http.request<CoverageListResult>(
    "get",
    `/api/admin/v1/team-insurance-policies/${policyId}/members`,
    { params }
  );

/** 覆盖名单单加队员 `POST .../{id}/members`（rbac: `team-insurance-policy.add.member`；重复→26004）。 */
export const addCoverageMember = (policyId: string, memberId: string) =>
  http.request<CoverageResult>(
    "post",
    `/api/admin/v1/team-insurance-policies/${policyId}/members`,
    { data: { memberId } }
  );

/** 全体在册一键加 `POST .../{id}/members/add-all-active`（rbac: `team-insurance-policy.add.member`；仅 ACTIVE,幂等）。 */
export const addAllActiveCoverage = (policyId: string) =>
  http.request<AddAllActiveResult>(
    "post",
    `/api/admin/v1/team-insurance-policies/${policyId}/members/add-all-active`
  );

/** 覆盖名单移除队员 `DELETE .../{id}/members/{memberId}`（rbac: `team-insurance-policy.remove.member`；不在名单→26003）。 */
export const removeCoverageMember = (policyId: string, memberId: string) =>
  http.request<CoverageResult>(
    "delete",
    `/api/admin/v1/team-insurance-policies/${policyId}/members/${memberId}`
  );
