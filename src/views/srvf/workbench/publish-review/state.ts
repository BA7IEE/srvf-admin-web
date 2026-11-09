import type {
  PublishReview,
  ReviewAction,
  ReviewDecisionBody
} from "@/api/srvf-activity-publish-review";
import { frozenProjection, objectValue } from "./snapshot";
import { policyCoverageFor, type PolicyCoverage } from "./policy-binding";

export const readPermission = "activity-review.read.request";
export const actionPermission = {
  approve: "activity.publish.record",
  return: "activity-review.return.request"
};
export const statusLabels: Record<PublishReview["status"], string> = {
  pending: "待审核",
  approved: "审核已通过",
  returned: "已退回修改",
  withdrawn: "已撤回",
  cancelled: "已取消"
};
export type DecisionReceipt = Pick<
  PublishReview,
  | "id"
  | "activityId"
  | "requestType"
  | "requestVersion"
  | "status"
  | "reviewedByUserId"
  | "reviewedAt"
  | "reviewNote"
>;
export type PendingDecision = {
  version: 1;
  reviewId: string;
  activityId: string;
  requestType: PublishReview["requestType"];
  requestVersion: number;
  action: ReviewAction;
  body: ReviewDecisionBody;
  receipt?: DecisionReceipt;
  keyConflict?: boolean;
};
export function reviewRecord(value: unknown, reviewId: string): PublishReview {
  if (
    !objectValue(value) ||
    value.id !== reviewId ||
    typeof value.activityId !== "string" ||
    !value.activityId ||
    !["initial", "change"].includes(String(value.requestType)) ||
    !Object.hasOwn(statusLabels, String(value.status)) ||
    !Number.isInteger(value.requestVersion) ||
    Number(value.requestVersion) < 1 ||
    !objectValue(value.snapshot) ||
    typeof value.submittedByUserId !== "string" ||
    !value.submittedByUserId ||
    typeof value.directPublish !== "boolean" ||
    !Number.isInteger(value.baseRevision) ||
    Number(value.baseRevision) < 0 ||
    ![value.audienceTagCodes, value.audienceOrganizationIds].every(
      a =>
        a === null || (Array.isArray(a) && a.every(v => typeof v === "string"))
    )
  )
    throw Error("未取得本申请的有效审核内容，请重试。");
  return structuredClone(value) as PublishReview;
}
export function projectReview(
  review: PublishReview,
  coverage?: PolicyCoverage | null
) {
  const policies = policyCoverageFor(review, coverage);
  const result = frozenProjection(review.snapshot, policies?.facts);
  if (policies) result.issues.push(...policies.issues);
  if (
    review.snapshot.schemaVersion === 9 &&
    [review.snapshot, review.snapshot.base].some(
      value =>
        !objectValue(value) ||
        value.timePolicyPointers === null ||
        value.contributionPolicyPointers === null
    )
  )
    result.issues.push(
      "V9 初发必须完整核对时长和贡献政策，不能当作无政策申请通过。"
    );
  if (review.requestType !== "initial")
    result.issues.unshift(
      "变更申请尚未具备完整前后对照，本页可查看和退回，不能通过。"
    );
  if (
    (review.audienceTagCodes?.length ?? 0) ||
    (review.audienceOrganizationIds?.length ?? 0)
  )
    result.issues.push("申请含受众限定，本页尚未完整展示其影响，不能通过。");
  return result;
}
export function canDecide(
  review: PublishReview,
  userId: string,
  permissions: string[],
  action: ReviewAction,
  coverage?: PolicyCoverage | null
) {
  return (
    !!userId &&
    review.status === "pending" &&
    review.submittedByUserId !== userId &&
    permissions.includes(readPermission) &&
    permissions.includes(actionPermission[action]) &&
    (action === "return" || projectReview(review, coverage).issues.length === 0)
  );
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (objectValue(value))
    return `{${Object.keys(value)
      .sort()
      .map(k => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
/** Local confirmation comparison only; never sent as a new backend version/hash parameter. */
export function reviewToken(review: PublishReview) {
  return canonical({
    id: review.id,
    activityId: review.activityId,
    requestType: review.requestType,
    requestVersion: review.requestVersion,
    baseRevision: review.baseRevision,
    status: review.status,
    submittedByUserId: review.submittedByUserId,
    snapshot: review.snapshot,
    audienceTagCodes: review.audienceTagCodes,
    audienceOrganizationIds: review.audienceOrganizationIds
  });
}
export function decisionBody(
  action: ReviewAction,
  operationKey: string,
  reviewNote: string
): ReviewDecisionBody {
  if (
    typeof operationKey !== "string" ||
    operationKey.length < 8 ||
    operationKey.length > 128
  )
    throw Error("操作标识无效，未发送请求。");
  if (
    typeof reviewNote !== "string" ||
    reviewNote.length > 500 ||
    (action === "return" && !reviewNote.trim())
  )
    throw Error("请填写 1 至 500 字的退回原因；审核说明最多 500 字。");
  return Object.freeze(
    action === "approve"
      ? {
          operationKey,
          requiresInsuranceConfirmed: true,
          ...(reviewNote ? { reviewNote } : {})
        }
      : { operationKey, reviewNote }
  );
}
export function decisionReceipt(
  value: unknown,
  pending: PendingDecision
): DecisionReceipt {
  const review = reviewRecord(value, pending.reviewId);
  if (
    review.activityId !== pending.activityId ||
    review.requestType !== pending.requestType ||
    review.requestVersion !== pending.requestVersion ||
    review.status !==
      (pending.action === "approve" ? "approved" : "returned") ||
    typeof review.reviewedByUserId !== "string" ||
    !review.reviewedByUserId ||
    typeof review.reviewedAt !== "string" ||
    !Number.isFinite(Date.parse(review.reviewedAt))
  )
    throw Error("处理响应与原请求不匹配，仍保留原操作等待核对。");
  const {
    id,
    activityId,
    requestType,
    requestVersion,
    status,
    reviewedByUserId,
    reviewedAt,
    reviewNote
  } = review;
  return {
    id,
    activityId,
    requestType,
    requestVersion,
    status,
    reviewedByUserId,
    reviewedAt,
    reviewNote
  };
}
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function decisionJournal(
  storage: StorageLike,
  origin: string,
  userId: string,
  reviewId: string
) {
  const scope = [origin, userId, reviewId].map(encodeURIComponent).join(":");
  const key = `srvf:publish-decision:${scope}`;
  const archiveKey = `srvf:publish-decision:receipt:${scope}`;
  function validate(value: unknown): PendingDecision {
    if (
      !objectValue(value) ||
      value.version !== 1 ||
      value.reviewId !== reviewId ||
      typeof value.activityId !== "string" ||
      !value.activityId ||
      !["initial", "change"].includes(String(value.requestType)) ||
      !Number.isInteger(value.requestVersion) ||
      Number(value.requestVersion) < 1 ||
      !["approve", "return"].includes(String(value.action)) ||
      !objectValue(value.body)
    )
      throw Error(
        "本机处理记录不可读，请保留现场并联系管理员核对，不能另建决定。"
      );
    const body = value.body;
    const expected = decisionBody(
      value.action as ReviewAction,
      String(body.operationKey ?? ""),
      typeof body.reviewNote === "string" ? body.reviewNote : ""
    );
    if (canonical(expected) !== canonical(body))
      throw Error("本机处理记录不符合原请求，不能替换或自动升级。");
    if (value.receipt !== undefined) {
      const r = value.receipt;
      if (
        !objectValue(r) ||
        r.id !== reviewId ||
        r.activityId !== value.activityId ||
        r.requestType !== value.requestType ||
        r.requestVersion !== value.requestVersion ||
        r.status !== (value.action === "approve" ? "approved" : "returned") ||
        typeof r.reviewedByUserId !== "string" ||
        !r.reviewedByUserId ||
        typeof r.reviewedAt !== "string" ||
        !Number.isFinite(Date.parse(r.reviewedAt))
      )
        throw Error("本机成功回执不匹配，不能结束原处理记录。");
    }
    return JSON.parse(JSON.stringify(value)) as PendingDecision;
  }
  return {
    read(): PendingDecision | null {
      const value = storage.getItem(key);
      return value === null ? null : validate(JSON.parse(value));
    },
    write(value: PendingDecision) {
      storage.setItem(key, JSON.stringify(validate(value)));
    },
    lastReceipt(): PendingDecision | null {
      const value = storage.getItem(archiveKey);
      return value === null ? null : validate(JSON.parse(value));
    },
    complete(value: PendingDecision, receipt: DecisionReceipt) {
      const next = validate({ ...value, receipt });
      storage.setItem(key, JSON.stringify(next));
      storage.setItem(archiveKey, JSON.stringify(next));
      storage.removeItem(key);
    }
  };
}
export function decisionFailure(error: unknown) {
  const response =
    objectValue(error) && objectValue(error.response) ? error.response : null;
  const data = response && objectValue(response.data) ? response.data : null;
  const code = typeof data?.code === "number" ? data.code : null;
  const messages: Record<number, string> = {
    20143: "原操作键与服务器记录冲突，已停止重发，请联系管理员核对。",
    20144: "冻结基线已变化，需由组织者重新提审；换操作键不能修复这份申请。",
    20146: "不能审核本人提交的申请，请交由其他有权人员处理。",
    20033: "这份申请已不再待审，请刷新查看处理记录。",
    30100: "当前权限或组织范围不允许此操作。",
    40100: "登录已失效，请以原账号重新登录后核对。",
    20004: "审核记录不存在或已不可读取。",
    20022: "冻结内容无法解析，请联系管理员。",
    20145: "缺少可发布的有效场次，请由组织者修正后重提。"
  };
  return {
    code,
    message:
      code && messages[code]
        ? messages[code]
        : data && typeof data.message === "string"
          ? data.message
          : error instanceof Error
            ? error.message
            : "未取得可靠处理回执，请稍后原样核对。"
  };
}
