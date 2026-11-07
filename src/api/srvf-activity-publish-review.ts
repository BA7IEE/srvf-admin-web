import { http } from "@/utils/http";
import type { ApiEnvelope } from "./user";

/** Fixed ea4a3579 source contract; tests/fixtures/publish-review-contract.txt provenance. */
export type PublishReviewStatus =
  | "pending"
  | "approved"
  | "returned"
  | "withdrawn"
  | "cancelled";
export type PublishReview = {
  id: string;
  activityId: string;
  requestType: "initial" | "change";
  requestVersion: number;
  baseRevision: number;
  status: PublishReviewStatus;
  snapshot: Record<string, unknown>;
  directPublish: boolean;
  audienceTagCodes: string[] | null;
  audienceOrganizationIds: string[] | null;
  submittedByUserId: string;
  submittedAt: string;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  /** These three fields describe the current Activity association, not the frozen proposal. */
  activityTitle: string;
  organizationId: string;
  initiatorMemberId: string | null;
  changeDiff?: Record<string, unknown>;
  affectedMemberCount?: number;
};
export type ReviewAction = "approve" | "return";
export type ApproveReviewBody = {
  operationKey: string;
  requiresInsuranceConfirmed: true;
  reviewNote?: string;
};
export type ReturnReviewBody = { operationKey: string; reviewNote: string };
export type ReviewDecisionBody = ApproveReviewBody | ReturnReviewBody;
export type PublishReviewPage = {
  items: PublishReview[];
  total: number;
  page: number;
  pageSize: number;
};
export type ReferencedPolicyVersion = {
  policyId: string;
  versionId: string;
  version: number;
  schemaVersion: 1;
  evaluatorVersion: 1;
  definitionHash: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  definition: unknown;
};
export type ReferencedReviewPolicies = {
  reviewId: string;
  activityId: string;
  snapshotSchemaVersion: number;
  snapshotHash: string;
  timePolicies: ReferencedPolicyVersion[];
  contributionPolicies: ReferencedPolicyVersion[];
};

const root = "/api/admin/v1/activity-publish-reviews";
export const getPendingPublishReviews = (page = 1) =>
  http.request<ApiEnvelope<PublishReviewPage>>("get", root, {
    params: { status: "pending", page, pageSize: 20 }
  });
export const getPublishReview = (reviewId: string) =>
  http.request<ApiEnvelope<PublishReview>>(
    "get",
    `${root}/${encodeURIComponent(reviewId)}`
  );
/** Review-scoped immutable definitions; no catalogue IDs, body, or query. Candidate contract v1. */
export const getReferencedReviewPolicies = (reviewId: string) =>
  http.request<ApiEnvelope<ReferencedReviewPolicies>>(
    "get",
    `${root}/${encodeURIComponent(reviewId)}/referenced-policies`
  );
/** No organizer confirmation/hash fields. The server binds this immutable review. */
export const decidePublishReview = (
  reviewId: string,
  action: ReviewAction,
  data: ReviewDecisionBody
) =>
  http.request<ApiEnvelope<PublishReview>>(
    "post",
    `${root}/${encodeURIComponent(reviewId)}/${action}`,
    { data }
  );
