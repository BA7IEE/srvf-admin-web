import { http } from "@/utils/http";
import type { ApiEnvelope } from "@/api/user";

const base = "/api/admin/v1/activities";

// These options are scoped to the current formal member, not a global catalogue.
export const getSimpleOrganizations = () =>
  http.request<ApiEnvelope<AdminSimpleOrganizationOptionDto[]>>(
    "get",
    `${base}/organization-options`
  );

export const getSimpleTemplates = (organizationId: string, page = 1) =>
  http.request<
    ApiEnvelope<{
      items: AdminSimpleTemplateVersionOptionDto[];
      total: number;
      page: number;
      pageSize: number;
    }>
  >("get", `${base}/template-version-options`, {
    params: { organizationId, page, pageSize: 20 }
  });

export const createSimpleActivity = (data: AdminCreateSimpleActivityDto) =>
  http.request<ApiEnvelope<AdminSimpleActivityCreationResultDto>>(
    "post",
    `${base}/from-template`,
    { data }
  );

export const getSimpleDraft = (id: string) =>
  http.request<ApiEnvelope<AdminSimpleDraftResponseDto>>(
    "get",
    `${base}/${encodeURIComponent(id)}/simple-draft`
  );

export const saveSimpleDraft = (id: string, data: AdminSaveSimpleActivityDto) =>
  http.request<ApiEnvelope<AdminSimpleDraftResponseDto>>(
    "put",
    `${base}/${encodeURIComponent(id)}/simple-draft`,
    { data }
  );

export const submitSimpleActivityReview = (
  id: string,
  data: ConfirmedSimpleReviewBody
) =>
  http.request<ApiEnvelope<ActivityPublishReviewResponseDto>>(
    "post",
    `${base}/${encodeURIComponent(id)}/publish-reviews`,
    { data }
  );

/** The live schema is boolean; the server additionally requires true. */
export type AdminSubmitSimpleActivityReviewDto = {
  operationKey: string;
  confirmation: boolean;
  /** Candidate 93ed4091 only; omission is server-side legacy compatibility. */
  expectedDraftHash?: string;
};

/** New UI calls cannot silently fall back to the legacy unversioned contract. */
export type ConfirmedSimpleReviewBody = {
  operationKey: string;
  confirmation: true;
  expectedDraftHash: string;
};

export type ActivityPublishReviewResponseDto = {
  id: string;
  activityId: string;
  requestType: "initial" | "change";
  requestVersion: number;
  baseRevision: number;
  status: "pending" | "approved" | "returned" | "withdrawn" | "cancelled";
  snapshot: Record<string, unknown>;
  directPublish: boolean;
  audienceTagCodes?: string[] | null;
  audienceOrganizationIds?: string[] | null;
  submittedByUserId: string;
  submittedAt: string;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  activityTitle: string;
  organizationId: string;
  initiatorMemberId: string | null;
  changeDiff?: Record<string, unknown>;
  affectedMemberCount?: number;
};

/** Live export from API 15421e9 (2026-11-06), subset SHA-256:
 * 48ff27edc0fea03ffe4c30cc2a5c617a600bb5cc093e43034076b6a8ad25c858.
 * DTO nullability follows the verified export; review can be null.
 */
export type AdminCreateSimpleActivityDto = {
  /** 本次活动标题 */
  title: string;
  /** 本人具备发起资格的组织 ID */
  organizationId: string;
  /** 本次开始时间 */
  startAt: string;
  /** 本次结束时间 */
  endAt: string;
  /** 文字地点；有明确地点快照时以服务端最终主地点为准 */
  location: string;
  /** 精确模板版本 ID，不接受族 ID 或自动取最新 */
  templateVersionId: string;
  /** 同内容重试复用的创建幂等键 */
  operationKey: string;
  /** 仅确认模板容量，必须等值；不是实例覆盖 */
  confirmedCapacity?: number | null;
  /** 缺省文字地点的明确可见性 */
  defaultPlaceVisibilityCode: "public" | "accepted" | "staff" | "command";
  /** 可选封闭实例参数；缺省保留模板默认和旧 Quick hash */
  instance?: AdminSimpleActivityInstanceDto;
  /** 活动及唯一场次使用同一份类型化地点，省略复制文字地点 */
  places?: Array<AdminSimpleActivityPlaceDto>;
};

export type AdminSaveSimpleActivityDto = {
  /** 本次活动标题 */
  title: string;
  /** 本人具备发起资格的组织 ID */
  organizationId: string;
  /** 本次开始时间 */
  startAt: string;
  /** 本次结束时间 */
  endAt: string;
  /** 文字地点；有明确地点快照时以服务端最终主地点为准 */
  location: string;
  /** 最近一次读取所得完整草稿并发指纹，不是授权凭据 */
  expectedDraftHash: string;
  /** 完整目标实例参数；不接受局部补丁 */
  instance: AdminSimpleActivityInstanceDto;
  /** 完整目标地点，保留现有用途结构 */
  places: Array<AdminSimpleActivityPlaceDto>;
};

export type AdminSimpleActivityCreationResultDto = {
  /** 创建所得活动 ID */
  activityId: string;
  /** 首次创建时间 */
  createdAt: string;
  /** 首次创建时状态，不代表当前发布状态 */
  createdStatusCode: "draft";
  /** 是否复用同一成功创建命令 */
  replayed: boolean;
};

export type AdminSimpleActivityInstanceDto = {
  /** 本次实例人数，null 明确不限；不修改模板容量 */
  capacity: number | null;
  /** 本次报名截止；null 明确不限 */
  registrationDeadline: string | null;
  /** 本次活动说明；null 清空 */
  description: string | null;
  /** 本次参与准备；null 清空 */
  registrationNotes: string | null;
};

export type AdminSimpleActivityPlaceDto = {
  /** 地点用途；恰有一个 primary，每种用途至多一个 */
  roleCode:
    | "primary"
    | "meeting"
    | "execution"
    | "evacuation"
    | "parking"
    | "other";
  /** 明确可见性 */
  visibilityCode: "public" | "accepted" | "staff" | "command";
  /** 精确预设 ID，与 inline 恰选一个 */
  presetId?: string;
  /** 完整本地地点，与 presetId 恰选一个 */
  inline?: AdminSimpleInlinePlaceDto;
};

export type AdminSimpleDraftResponseDto = {
  /** 活动 ID */
  activityId: string;
  /** 服务端活动标题 */
  title: string;
  /** 承办组织 ID */
  organizationId: string;
  /** 原活动类型 */
  activityTypeCode: string;
  /** 首版固定先到先得 */
  allocationModeCode: "first_come";
  /** 活动开始 */
  startAt: string;
  /** 活动结束 */
  endAt: string;
  /** 最终主地点文字 */
  location: string;
  /** 最终实例事实 */
  instance: AdminSimpleActivityInstanceDto;
  /** 实际活动状态 */
  statusCode: string;
  /** 最新审核；null 尚无审核 */
  review: AdminSimpleDraftReviewDto | null;
  /** 仅当前草稿无待审且模板仍可选时为 true，操作仍重新鉴权 */
  editable: boolean;
  /** 本次读取的完整并发指纹 */
  draftHash: string;
  /** 原精确模板版本 ID */
  selectedTemplateVersionId: string;
  /** 原精确模板定义摘要 */
  definitionHash: string;
  /** 唯一场次最终事实 */
  session: AdminSimpleDraftSessionDto;
  /** 唯一默认岗位最终事实 */
  position: AdminSimpleDraftPositionDto;
  /** 同样应用于活动和唯一场次的完整本地地点；读取以 inline 返回 */
  places: Array<AdminSimpleActivityPlaceDto>;
  /** 原时长/贡献政策的有权安全摘要，不是政策写入口 */
  policies: Array<AdminSimpleDraftPolicyDto>;
};

export type AdminSimpleDraftPolicyDto = {
  /** 政策种类 */
  kind: "time" | "contribution";
  /** 选定层级 */
  layerCode: "activity" | "session" | "position" | "template";
  /** 原政策选择模式，不接受通过草稿命令修改 */
  mode: string;
  /** 政策名称 */
  name: string | null;
  /** 精确版本号 */
  version: number | null;
  /** 政策覆盖起点 */
  effectiveFrom: string | null;
  /** 政策覆盖终点 */
  effectiveUntil: string | null;
};

export type AdminSimpleDraftPositionDto = {
  /** 唯一默认岗位 ID */
  id: string;
  /** 稳定岗位编码 */
  code: string;
  /** 岗位名称 */
  name: string;
  /** 现有 attendance role 字典编码 */
  attendanceRoleCode: string;
  /** 本次容量；null 不限 */
  capacity: number | null;
  /** 显式开始；null 继承场次 */
  startAt: string | null;
  /** 显式结束；null 继承场次 */
  endAt: string | null;
};

export type AdminSimpleDraftReviewDto = {
  /** 最新审核 ID */
  id: string;
  /** 真实审核状态 */
  status: "pending" | "approved" | "returned" | "withdrawn" | "cancelled";
  /** 审核类型 */
  requestType: "initial" | "change";
};

export type AdminSimpleDraftSessionDto = {
  /** 唯一场次 ID */
  id: string;
  /** 稳定场次编码 */
  code: string;
  /** 场次名称 */
  name: string;
  /** 场次开始 */
  startAt: string;
  /** 场次结束 */
  endAt: string;
  /** 本次容量；null 不限 */
  capacity: number | null;
  /** 签到开放 */
  checkInOpenAt: string;
  /** 签到关闭 */
  checkInCloseAt: string;
  /** 签退开放 */
  checkOutOpenAt: string;
  /** 签退关闭 */
  checkOutCloseAt: string;
  /** 准备时间 */
  preparationStartAt: string | null;
};

export type AdminSimpleInlinePlaceDto = {
  /** 地点名称 */
  name: string;
  /** 地点文字，同步活动和唯一场次 */
  addressText: string;
  /** 有界地点说明 */
  instruction?: string;
  /** 明确坐标，省略为纯文字地点 */
  coordinate?: AdminSimplePlaceCoordinateDto;
  /** 地图来源标识 */
  providerCode?: string;
  /** 地图来源内部地点标识 */
  providerPlaceId?: string;
  /** 签到候选地点，不自动启用定位策略 */
  checkInEligible: boolean;
  /** 签到候选半径（米） */
  radiusMeters?: number;
};

export type AdminSimpleOrganizationOptionDto = {
  /** 有权发起组织 ID */
  organizationId: string;
  /** 组织名称 */
  name: string;
  /** 组织路径文字 */
  pathLabel: string;
  /** 发起资格来源 */
  source: "membership" | "cross-org-grant";
  /** 有效任职种类；跨组织授权时可空 */
  membershipType: "PRIMARY" | "SECONDARY" | "TEMPORARY" | "SUPPORT" | null;
};

export type AdminSimplePlaceCoordinateDto = {
  /** 声明坐标系中的经度 */
  longitude: number;
  /** 声明坐标系中的纬度 */
  latitude: number;
  /** 明确坐标系，不自动转换 */
  coordinateSystemCode: "wgs84" | "gcj02" | "bd09";
};

export type AdminSimpleTemplateVersionOptionDto = {
  /** 精确模板版本 ID */
  id: string;
  /** 模板稳定编码 */
  code: string;
  /** 模板版本名称 */
  name: string;
  /** 显式版本号 */
  version: number;
  /** 定义 schema 版本 */
  schemaVersion: 1 | 2 | 3 | 4 | 5;
  /** 精确版本 hash */
  definitionHash: string;
  /** 当前可新选版本 */
  statusCode: "active";
  /** 活动类型码 */
  activityTypeCode: string;
  /** 模板族安全摘要 */
  family: AdminSimpleTemplateFamilyOptionDto;
  /** 有效期元数据起点 */
  effectiveFrom: string;
  /** 有效期元数据终点 */
  effectiveTo: string | null;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
};

export type AdminSimpleTemplateFamilyOptionDto = {
  /** 全局模板族 ID */
  id: string;
  /** 模板族稳定编码 */
  code: string;
  /** 模板族名称 */
  name: string;
  /** 模板分类码 */
  categoryCode: string;
};
