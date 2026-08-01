import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * 后端单次创建考勤单的 records 上限（`ArrayMaxSize(200)`）。
 * 草稿超过这个数必须**分批建多张单据**，交接文档明令「不能静默截断」。
 */
export const ATTENDANCE_RECORDS_MAX_PER_SHEET = 200;

/* ============================ GPS 打卡证据 ============================ */

/** 打卡证据里的队员摘要。 */
export type CheckInMember = {
  id: string;
  memberNo: string;
  displayName: string;
};

/**
 * GPS 打卡证据（后端 `AdminActivityCheckInListItemDto`）。
 *
 * ⚠️ **这是「安全复核视图」**：后端**有意不返回**原始经纬度与定位精度，
 * 只给「离活动坐标多少米」这个派生距离。看不到坐标是设计，不是字段缺失——
 * 界面上要说清楚，否则会有人一直找定位在哪。
 */
export type ActivityCheckInItem = {
  id: string;
  activityId: string;
  /** 打卡所属报名 id */
  registrationId: string;
  member: CheckInMember;
  checkInAt: string;
  /** 首次签退时间；没签退为 null */
  checkOutAt: string | null;
  /** 签到点到活动坐标的距离（米；Decimal 字符串，前端不做数值运算） */
  checkInDistance: string | null;
  /** 签退点到活动坐标的距离（米；同上） */
  checkOutDistance: string | null;
  /** 签到时活动坐标是否完整有效并完成了围栏计算 */
  geoVerified: boolean;
  /** 签到时的未舍入距离是否严格大于当时配置的半径 */
  outOfRange: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * 活动 GPS 打卡证据分页 `GET /api/admin/v1/activities/{activityId}/check-ins`
 * （rbac: `attendance.read.sheet`）。
 */
export const getActivityCheckIns = (
  activityId: string,
  params?: { page?: number; pageSize?: number }
) =>
  http.request<Envelope<PageResult<ActivityCheckInItem>>>(
    "get",
    `/api/admin/v1/activities/${activityId}/check-ins`,
    { params }
  );

/* ============================ 考勤草稿 ============================ */

/**
 * 草稿里的一条考勤记录（后端 `AttendanceSheetDraftRecordDto`）。
 * 字段与提交用的 `AttendanceRecordInputDto` 基本同形，可直接编辑后提交。
 */
export type AttendanceDraftRecord = {
  memberId: string;
  /**
   * 考勤角色 code。岗位报名会自动带上该岗位绑定的角色，无岗位报名才是 `member`。
   * ⚠️ 后端提交时按这个 roleCode 命中贡献规则——**别把它重写回 `member`，也别前端自算贡献**。
   */
  roleCode: string;
  checkInAt: string;
  /** 忘签退时：岗位报名回退岗位结束时间，无岗位回退活动结束时间 */
  checkOutAt: string;
  /** 服务时长（小时；JSON number，最多两位小数） */
  serviceHours: number;
  /** 草稿固定为 `present`，提交前可改成迟到 / 早退 */
  attendanceStatusCode: string;
  registrationId: string;
};

/**
 * 草稿证据告警（后端 `AttendanceSheetDraftFlagDto`）。
 * 与 records 通过 `registrationId + memberId` 稳定关联。
 */
export type AttendanceDraftFlag = {
  registrationId: string;
  memberId: string;
  /** 缺首次签退，签退时间是回退值不是真实打卡 */
  noCheckOut: boolean;
  /** 签到距离超出当时配置的围栏半径 */
  outOfRange: boolean;
  /** 活动坐标缺失或非法，没做成围栏校验 */
  unverified: boolean;
};

/**
 * 当前仍审核通过、但一条打卡证据都没有的报名（后端 `AttendanceSheetDraftAbsentRegistrationDto`）。
 * ⚠️ 只用于提示,**不得伪造成考勤记录**——没打卡就是没打卡,要补录得人工确认后另行录入。
 */
export type AttendanceDraftAbsentRegistration = {
  registrationId: string;
  memberId: string;
  memberNo: string;
  displayName: string;
};

/** 考勤提交草稿（后端 `AttendanceSheetDraftDto`；只读不落库）。 */
export type AttendanceSheetDraft = {
  activityId: string;
  records: AttendanceDraftRecord[];
  flags: AttendanceDraftFlag[];
  absentRegistrations: AttendanceDraftAbsentRegistration[];
};

/**
 * 由打卡记录生成考勤提交草稿
 * `GET /api/admin/v1/activities/{activityId}/attendance-sheet-draft`
 * （rbac: `attendance.read.sheet`）。
 *
 * **只读不落库**：拿到后在前端本地结合 flags 编辑 records，再走既有
 * `POST .../attendance-sheets` 提交。读得到草稿 ≠ 能提交——提交另需
 * `attendance.create.sheet`，两个按钮分别门控。
 */
export const getAttendanceSheetDraft = (activityId: string) =>
  http.request<Envelope<AttendanceSheetDraft>>(
    "get",
    `/api/admin/v1/activities/${activityId}/attendance-sheet-draft`
  );

/* ----------------------------- 证据告警 → 人话 ----------------------------- */

/** 一条告警的人话描述（用于草稿行的黄标与证据表的标签）。 */
export type CheckInFlagNote = { key: string; text: string; tip: string };

/**
 * 把三个布尔告警翻成人话。
 * 不直出 `noCheckOut` / `outOfRange` / `unverified` 这种字段名——
 * 看考勤的人不该被要求认识后端字段。
 */
export function describeDraftFlags(
  flag?: AttendanceDraftFlag | null
): CheckInFlagNote[] {
  if (!flag) return [];
  const notes: CheckInFlagNote[] = [];
  if (flag.noCheckOut)
    notes.push({
      key: "noCheckOut",
      text: "忘签退",
      tip: "这个人没有签退记录，签退时间是按岗位或活动的结束时间自动补的，不是真实打卡时间——提交前请确认时长是否合理"
    });
  if (flag.outOfRange)
    notes.push({
      key: "outOfRange",
      text: "不在活动范围",
      tip: "签到时距离活动地点超出了当时设定的范围，需要人工判断是否算数"
    });
  if (flag.unverified)
    notes.push({
      key: "unverified",
      text: "未校验位置",
      tip: "签到时活动没有有效坐标，系统没能做范围校验——不代表这个人没到，只是这条打卡缺少位置佐证"
    });
  return notes;
}

/** 证据表行的告警（与草稿同口径，但证据表只有两个布尔可判）。 */
export function describeCheckInFlags(
  row: ActivityCheckInItem
): CheckInFlagNote[] {
  const notes: CheckInFlagNote[] = [];
  if (!row.checkOutAt)
    notes.push({
      key: "noCheckOut",
      text: "忘签退",
      tip: "只有签到没有签退"
    });
  if (row.outOfRange)
    notes.push({
      key: "outOfRange",
      text: "不在活动范围",
      tip: "签到距离超出了当时设定的范围"
    });
  if (!row.geoVerified)
    notes.push({
      key: "unverified",
      text: "未校验位置",
      tip: "签到时活动没有有效坐标，未能做范围校验"
    });
  return notes;
}
