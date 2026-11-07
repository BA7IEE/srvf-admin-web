import type {
  ActivityPublishReviewResponseDto,
  AdminSimpleDraftResponseDto,
  AdminSubmitSimpleActivityReviewDto,
  ConfirmedSimpleReviewBody
} from "@/api/srvf-simple-activity";

export type ReviewReceipt = Pick<
  ActivityPublishReviewResponseDto,
  "id" | "status" | "requestVersion" | "submittedAt"
>;
export type PendingReview = {
  body: AdminSubmitSimpleActivityReviewDto;
  receipt?: ReviewReceipt;
  keyConflict?: boolean;
};

export function validDraftHash(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

export class ReviewDataError extends Error {}

export function isVersionedReviewBody(
  body: AdminSubmitSimpleActivityReviewDto
): body is ConfirmedSimpleReviewBody {
  return body.confirmation === true && validDraftHash(body.expectedDraftHash);
}

/** One complete successful GET/PUT response, never a mixture of read sources. */
export function reviewDraft(
  data: AdminSimpleDraftResponseDto,
  activityId: string
) {
  if (data.activityId !== activityId || !validDraftHash(data.draftHash))
    throw new ReviewDataError("未取得本活动有效的草稿版本，请重新读取后核对。");
  return structuredClone(data);
}

export function confirmedReviewBody(
  draft: AdminSimpleDraftResponseDto,
  activityId: string,
  operationKey: string
): ConfirmedSimpleReviewBody {
  if (draft.activityId !== activityId || !validDraftHash(draft.draftHash))
    throw new ReviewDataError("无法提交未核对的草稿版本。");
  return Object.freeze({
    operationKey,
    confirmation: true,
    expectedDraftHash: draft.draftHash
  });
}

/** Only locally observable conditions; policy/identity/snapshot validation stays server-side. */
export function reviewIssues(
  draft: AdminSimpleDraftResponseDto,
  now = Date.now()
) {
  const issues: string[] = [];
  if (!validDraftHash(draft.draftHash))
    issues.push("未取得有效的草稿版本，请重新读取后核对。");
  if (draft.statusCode !== "draft")
    issues.push("活动已不在草稿阶段，请刷新后按当前状态处理。");
  if (draft.review?.status === "pending")
    issues.push("已有发布审核正在处理，请等待审核结果。");
  if (!draft.editable)
    issues.push("当前草稿不可编辑，请核实审核状态和模板有效性。");
  if (!draft.title.trim() || !draft.location.trim())
    issues.push("请先完善活动标题和地点，再保存草稿。");
  const start = Date.parse(draft.startAt),
    end = Date.parse(draft.endAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end)
    issues.push("开始和结束时间无效，请修改并保存草稿。");
  else if (end <= now) issues.push("活动结束时间已过，请修改并保存草稿。");
  const deadline = draft.instance.registrationDeadline;
  if (deadline) {
    const at = Date.parse(deadline);
    if (!Number.isFinite(at) || at > end)
      issues.push("报名截止时间无效或晚于活动结束，请修改并保存。");
    else if (at < now) issues.push("报名截止时间已过，请修改并保存草稿。");
  }
  return issues;
}

export function reviewFailure(error: unknown) {
  const response = (
    error as { response?: { status?: number; data?: { code?: number } } }
  )?.response;
  if (!response?.status || response.status >= 500) return "uncertain";
  if (response.status === 409) {
    if (response.data?.code === 20143) return "key-conflict";
    if (response.data?.code === 20032) return "pending";
    if (response.data?.code === 20255) return "stale";
    if (response.data?.code === 20256) return "professional";
  }
  return "rejected";
}

/** No raw proposal snapshots or tokens: same-tab, account/activity-scoped recovery only. */
export function reviewRecoveryStore(
  session: Storage,
  origin: string,
  userId: string,
  activityId: string
) {
  const key = `srvf:simple-review:v1:${encodeURIComponent(origin)}:admin-v1:${encodeURIComponent(userId)}:${encodeURIComponent(activityId)}`;
  return {
    read(): PendingReview | null {
      const raw = session.getItem(key);
      if (!raw) return null;
      const value: PendingReview = JSON.parse(raw);
      const b = value?.body;
      if (
        !b ||
        ![
          "confirmation,operationKey",
          "confirmation,expectedDraftHash,operationKey"
        ].includes(Object.keys(b).sort().join(",")) ||
        (Object.hasOwn(b, "expectedDraftHash") &&
          !validDraftHash(b.expectedDraftHash)) ||
        typeof b.operationKey !== "string" ||
        b.operationKey.length < 8 ||
        b.operationKey.length > 128 ||
        b.confirmation !== true ||
        (value.receipt !== undefined &&
          (!value.receipt ||
            typeof value.receipt.id !== "string" ||
            !Number.isInteger(value.receipt.requestVersion) ||
            value.receipt.requestVersion < 1 ||
            !Number.isFinite(Date.parse(value.receipt.submittedAt)) ||
            ![
              "pending",
              "approved",
              "returned",
              "withdrawn",
              "cancelled"
            ].includes(value.receipt.status))) ||
        (value.keyConflict !== undefined &&
          typeof value.keyConflict !== "boolean")
      )
        throw new Error(
          "本标签页的提审恢复记录无法读取，请保留页面并联系管理员核对。"
        );
      return value;
    },
    write(value: PendingReview) {
      session.setItem(key, JSON.stringify(value));
    },
    archiveReceipt(value: PendingReview) {
      if (!value.receipt) throw new Error("缺少可关联的提审回执。");
      const receiptKey = key.replace(
        "srvf:simple-review:",
        "srvf:simple-review-receipt:"
      );
      session.setItem(
        `${receiptKey}:${encodeURIComponent(value.body.operationKey)}`,
        JSON.stringify(value)
      );
    },
    clear() {
      session.removeItem(key);
    }
  };
}
