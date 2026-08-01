import { http } from "@/utils/http";
import { bizErrorMessage } from "@/api/srvf-error";

type Envelope<T> = { code: number; message: string; data: T };

/**
 * 活动岗位（后端 `ActivityPositionResponseDto`）。字段以 live `/api/docs-json` 为准。
 *
 * ⚠️ 主键叫 `activityPositionId` 而**不是** `id`——路由参数、表单模型、行 key 一律用全称，
 * 别在前端简写回 `id`，否则和活动 / 报名的 id 混在一起时无从分辨。
 *
 * 术语纪律：这里的「岗位」是**活动岗位**（一次活动内的分工），与组织架构里的
 * 「职务」（position/任职）是两个概念，文案不得混用。
 */
export type ActivityPositionItem = {
  /** 活动岗位主键 */
  activityPositionId: string;
  /** 所属活动 id */
  activityId: string;
  /** 岗位名称（同一活动内 live 名称唯一） */
  name: string;
  /** 考勤角色字典 code（typeCode=attendance_role） */
  attendanceRoleCode: string;
  /** 名额上限（null = 不限名额） */
  capacity: number | null;
  /** 岗位开始时间（null = 沿用活动时间窗） */
  startAt: string | null;
  /** 岗位结束时间（null = 沿用活动时间窗） */
  endAt: string | null;
  /** 岗位性别限制字典 code（null = 不在活动之外追加限制） */
  genderRequirementCode: string | null;
  /** 岗位说明 */
  description: string | null;
  /** 显式排序值（升序） */
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * 新建岗位入参（后端 `CreateActivityPositionDto`）。
 * `startAt` / `endAt` 必须**同空同有**，且落在活动时间窗内——前端先给即时提示，
 * 最终仍由后端裁决。
 */
export type CreateActivityPositionBody = {
  /** 岗位名称（必填；同活动内唯一） */
  name: string;
  /** 考勤角色字典 code（必填；须为 active 字典项） */
  attendanceRoleCode: string;
  /** 名额上限（不传 / null = 不限名额） */
  capacity?: number | null;
  /** 岗位开始时间（须与 endAt 同空同有且在活动窗内） */
  startAt?: string | null;
  /** 岗位结束时间（同上） */
  endAt?: string | null;
  /** 性别限制字典 code（null = 不追加限制） */
  genderRequirementCode?: string | null;
  /** 岗位说明 */
  description?: string | null;
  /** 排序值（默认 0） */
  sortOrder?: number;
};

/** 部分更新岗位入参（后端 `UpdateActivityPositionDto`；全字段可选）。 */
export type UpdateActivityPositionBody = Partial<CreateActivityPositionBody>;

/**
 * 活动岗位列表 `GET /api/admin/v1/activities/{activityId}/positions`。
 * **`[auth]`-only（仅需登录，无 RBAC 读码）**，与活动列表 / 详情同口径，前端不另设码门。
 * 无分页，后端按 sortOrder / createdAt / id 升序返回。
 */
export const getActivityPositions = (activityId: string) =>
  http.request<Envelope<ActivityPositionItem[]>>(
    "get",
    `/api/admin/v1/activities/${activityId}/positions`
  );

/**
 * 新建活动岗位 `POST /api/admin/v1/activities/{activityId}/positions`
 * （rbac: **`activity.update.record`** —— 岗位写操作复用活动的更新码，没有独立岗位码）。
 */
export const createActivityPosition = (
  activityId: string,
  body: CreateActivityPositionBody
) =>
  http.request<Envelope<ActivityPositionItem>>(
    "post",
    `/api/admin/v1/activities/${activityId}/positions`,
    { data: body }
  );

/**
 * 部分更新活动岗位
 * `PATCH /api/admin/v1/activities/{activityId}/positions/{activityPositionId}`
 * （rbac: `activity.update.record`）。
 */
export const updateActivityPosition = (
  activityId: string,
  activityPositionId: string,
  body: UpdateActivityPositionBody
) =>
  http.request<Envelope<ActivityPositionItem>>(
    "patch",
    `/api/admin/v1/activities/${activityId}/positions/${activityPositionId}`,
    { data: body }
  );

/**
 * 软删活动岗位
 * `DELETE /api/admin/v1/activities/{activityId}/positions/{activityPositionId}`
 * （rbac: `activity.update.record`）。
 * 该岗位下仍有 pending / pass / waitlisted 报名时后端拒删（20031）。
 */
export const deleteActivityPosition = (
  activityId: string,
  activityPositionId: string
) =>
  http.request<Envelope<ActivityPositionItem | null>>(
    "delete",
    `/api/admin/v1/activities/${activityId}/positions/${activityPositionId}`
  );

/* ----------------------------- 岗位域错误码 → 人话 ----------------------------- */

/**
 * 活动岗位域业务码 → 人话（码义逐条取自后端 `biz-code.constant.ts`，禁臆造）。
 * 表单已对时段 / 名额做了即时提示，这里是「提示被绕过或后端另有判据」时的兜底，
 * 两处必须都在——前端提示不是权威，后端才是。
 */
export function activityPositionBizErrorMessage(
  error: unknown,
  fallback: string
): string {
  const data = (
    error as { response?: { data?: { code?: unknown; message?: string } } }
  )?.response?.data;
  const code = Number(data?.code);
  if (code === 20031)
    return "该岗位已有报名（20031）：待审核、已通过、候补中的报名都算；请先在报名页把这些报名转到别的岗位或取消，再来删除";
  if (code === 20002)
    return "这个岗位不存在或已被删除（20002）：列表可能不是最新的，请刷新后重试";
  if (code === 20003)
    return "这个活动里已经有同名岗位了（20003）：同一活动内岗位不能重名，请换个名字";
  if (code === 20017)
    return "岗位时段不合法（20017）：开始与结束要么都不填（沿用活动时间），要么都填，且必须落在活动时间窗之内";
  if (code === 20018)
    return "岗位名额配置不合法（20018）：限额至少为 1；不想限制人数就改选「不限名额」";
  return bizErrorMessage(error, fallback);
}
