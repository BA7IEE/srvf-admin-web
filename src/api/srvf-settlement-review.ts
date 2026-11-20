import { http } from "@/utils/http";

// Candidate API: backend #1431 (504833240), not the deployed contract.
type Envelope<T> = { code: number; message: string; data: T };
type Page<T> = { items: T[]; total: number; page: number; pageSize: number };
export type ReviewStage = "first" | "final";
export type ReviewAction = "approve" | "return";
export type SettlementStatus = "submitted" | "returned" | "approved" | "voided";
export type SettlementQuery = {
  page: number;
  pageSize: number;
  q?: string;
  activityId?: string;
  statusCode?: SettlementStatus;
  reviewStage?: ReviewStage;
  organizationId?: string;
  includeDescendants?: boolean;
  dateFrom?: string;
  dateTo?: string;
  expand?: "activity";
};

export type SettlementListItem = {
  settlementVersionId: string;
  activityId: string;
  activityTitle: string;
  version: number;
  statusCode: string;
  reviewStage: ReviewStage | null;
  submittedAt: string | null;
  postingBatchStatusCode: string | null;
  submittedBy: { username: string; nickname: string | null } | null;
  activity?: {
    id: string;
    title: string;
    startAt: string;
    organizationId: string;
  };
};

type FrozenResult = {
  id: string;
  member: { label: string };
  session: { name: string };
  resultCode: string;
  lateFlag: boolean;
  earlyLeaveFlag: boolean;
  hasAdjustment: boolean;
  timeResultState: "legacy" | "ready" | "pending";
  calculatedServiceHours: string;
  recognizedServiceHours: string;
  timeBuckets:
    | {
        categoryCode: string;
        calculatedSeconds: number | null;
        recognizedSeconds: number;
      }[]
    | null;
  contributionResultState: "legacy" | "ready" | "pending";
  calculatedContributionPoints: string;
  recognizedContributionPoints: string;
  nativeCalculatedContributionPoints: string | null;
  nativeRecognizedContributionPoints: string | null;
};

type ReviewEvidence = {
  evidenceSealId: string;
  evidenceRevision: number;
  populationRevision: number;
  workflowRevision: number;
  contentHash: string;
};

export type SettlementDetail = {
  version: ReviewEvidence & {
    id: string;
    version: number;
    statusCode: string;
    returnReason: string | null;
  };
  results: Page<FrozenResult> | null;
  diff: {
    addedItemCount: number;
    removedItemCount: number;
    changedItemCount: number;
  };
  gaps: { gapCode: string; count: number }[];
  sealRevisions: {
    id: string;
    sealRevision: number;
    statusCode: string;
    manualReviewPendingCount: number;
  }[];
};
export type ReviewCommand = ReviewEvidence & {
  operationKey: string;
  note?: string;
};

const base = "/api/admin/v1/attendance-settlements";
export const listSettlements = (params: SettlementQuery) =>
  http.request<Envelope<Page<SettlementListItem>>>("get", base, { params });

export const getSettlementDetail = (
  id: string,
  page: number,
  pageSize: number
) =>
  http.request<Envelope<SettlementDetail>>(
    "get",
    `${base}/${encodeURIComponent(id)}/review-detail`,
    { params: { page, pageSize } }
  );

export const reviewSettlement = (
  id: string,
  stage: ReviewStage,
  action: ReviewAction,
  data: ReviewCommand
) =>
  http.request<
    Envelope<{
      settlementVersionId: string;
      stageCode: ReviewStage;
      actionCode: ReviewAction;
    }>
  >("post", `${base}/${encodeURIComponent(id)}/${stage}-${action}`, { data });
