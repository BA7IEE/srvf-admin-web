import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };

/**
 * 判权原因（authz 11 值稳定枚举 ∪ `state_forbidden`——后者仅
 * action-state/batch 独有：判权放行但资源当前状态不允许该动作）。
 */
export const AUTHZ_REASON_LABEL: Record<string, string> = {
  super_admin_pass: "超级管理员放行",
  matched: "命中授权",
  no_permission: "无该权限码",
  out_of_scope: "超出授权 scope 范围",
  out_of_supervised_scope: "超出分管范围",
  expired_grant: "授权已过期",
  inactive_org: "所属组织已停用",
  self_approval_forbidden: "禁止自审（提交人=审核人）",
  same_reviewer_forbidden: "禁止同一审核人二次审核",
  sensitive_denied: "敏感信息访问被拒绝",
  resource_not_found: "资源不存在或已软删",
  state_forbidden: "权限允许，但资源当前状态不支持该操作"
};

/** 资源类型（explain / explain-batch / action-state 共用的 11 类白名单）。 */
export type ExplainResourceType =
  | "activity"
  | "attendance_sheet"
  | "attendance_record"
  | "activity_registration"
  | "member"
  | "member_profile"
  | "certificate"
  | "team_join_application"
  | "recruitment_application"
  | "notification"
  | "attachment";

export const RESOURCE_TYPE_LABEL: Record<ExplainResourceType, string> = {
  activity: "活动",
  attendance_sheet: "考勤单",
  attendance_record: "考勤记录",
  activity_registration: "报名",
  member: "队员",
  member_profile: "队员档案",
  certificate: "证书",
  team_join_application: "入队申请",
  recruitment_application: "招新申请",
  notification: "通知",
  attachment: "附件"
};

export type ExplainResourceRef = {
  type: ExplainResourceType;
  id: string;
};

export type ExplainAuthzBody = {
  /** 目标用户 id（被解释判权的人，非调用者）；不存在/已软删 → 10001 */
  userId: string;
  /** action 权限码，格式 `<module>.<action>.<resource_type>[.<scope>]` */
  action: string;
  /** 可选资源引用；缺省 = 无 ref 退化路径（等价 rbac.can 全局判定） */
  resourceRef?: ExplainResourceRef;
};

export type MatchedGrant = {
  source: string;
  bindingId?: string;
  positionAssignmentId?: string;
  supervisionAssignmentId?: string;
  roleCode?: string;
  scopeType: string;
  scopeId?: string;
};

export type ResolvedResource = {
  resourceType: string;
  resourceId: string;
  organizationId: string | null;
  organizationPath: string[] | null;
  ownerMemberId: string | null;
  ownerUserId: string | null;
  activityId: string | null;
  statusCode: string | null;
  sensitivityLevel: string | null;
  extra?: Record<string, unknown>;
};

export type AuthzDecision = {
  allow: boolean;
  reason: string;
  matchedGrant?: MatchedGrant;
  resource?: ResolvedResource;
};

export type ExplainAuthzResult = {
  targetUser: {
    id: string;
    username: string;
    role: string;
    status: string;
    memberId: string | null;
  };
  decision: AuthzDecision;
};

/**
 * 权限解释（诊断读）：目标用户对 action(+可选 resourceRef) 的 allow/deny + reason
 * + matchedGrant；**deny 是 200 数据，不是异常**。
 * `POST /api/admin/v1/authz/explain`（rbac: `authz.explain.decision`）。
 */
export const explainAuthz = (body: ExplainAuthzBody) =>
  http.request<Envelope<ExplainAuthzResult>>(
    "post",
    "/api/admin/v1/authz/explain",
    { data: body }
  );

export type ExplainBatchItem = ExplainAuthzBody;
export type ExplainBatchResultItem = ExplainAuthzBody & {
  decision: AuthzDecision;
};

/**
 * 批量权限解释（诊断读，≤200 项）：逐条返 allow/deny + reason + matchedGrant，
 * 与单条 explain 同一套 11 值枚举；deny 是 200 数据非错误。
 * `POST /api/admin/v1/authz/explain-batch`（rbac: `authz.explain-batch.decision`）。
 * 本轮先封装 API；批量诊断更适合供页面内部消费（如列表批量渲染按钮态），
 * 不做独立的人工批量输入 UI（蓝图 §7：诊断是排查工具，单条才是核心场景）。
 */
export const explainAuthzBatch = (items: ExplainBatchItem[]) =>
  http.request<Envelope<{ items: ExplainBatchResultItem[] }>>(
    "post",
    "/api/admin/v1/authz/explain-batch",
    { data: { items } }
  );

export type ActionStateItem = {
  action: string;
  resourceType: ExplainResourceType;
  resourceId: string;
  /** 调用方自定义关联键，可选透传回显，不参与判权/去重 */
  key?: string;
};

export type ActionStateResultItem = ActionStateItem & {
  allowed: boolean;
  reason: string;
};

/**
 * 批量业务态闸（诊断读，调用者本人视角）：对一组 action×资源 返回
 * allowed + reason（authz 11 值 ∪ `state_forbidden`）；items 回显顺序=请求顺序；
 * deny 是 200 数据非错误。`POST /api/admin/v1/authz/action-state/batch`
 * （rbac: `authz.action-state.decision`）。
 * 本轮先封装 API，供未来列表页按钮态批量渲染消费（如工作台/总表的操作列）。
 */
export const actionStateBatch = (items: ActionStateItem[]) =>
  http.request<Envelope<{ items: ActionStateResultItem[] }>>(
    "post",
    "/api/admin/v1/authz/action-state/batch",
    { data: { items } }
  );
