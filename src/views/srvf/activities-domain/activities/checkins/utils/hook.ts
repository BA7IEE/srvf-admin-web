import dayjs from "dayjs";
import { ref, computed } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { bizErrorMessage } from "@/api/srvf-error";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import { fetchAllPages } from "@/srvf-kit";
import {
  getActivityCheckIns,
  getAttendanceSheetDraft,
  describeDraftFlags,
  describeCheckInFlags,
  ATTENDANCE_RECORDS_MAX_PER_SHEET,
  type ActivityCheckInItem,
  type AttendanceDraftRecord,
  type AttendanceDraftFlag,
  type AttendanceDraftAbsentRegistration
} from "@/api/srvf-activity-checkin";
import { submitAttendanceSheet } from "@/api/srvf-attendance";

/** 草稿编辑器里的一行：草稿记录 + 展示用的队员名与告警 */
export type DraftEditableRow = AttendanceDraftRecord & {
  displayName: string;
  memberNo: string;
  flags: ReturnType<typeof describeDraftFlags>;
};

/**
 * 活动 GPS 打卡证据 + 考勤草稿（作战室「GPS 打卡」tab 用）。
 *
 * 两条 GET 都只要 `attendance.read.sheet`；**真正提交另需 `attendance.create.sheet`**
 * ——读得到草稿不等于能提交，两个按钮分别门控。
 *
 * @param externalActivityId 活动 id（必传，来自作战室路由参数）。
 */
export function useActivityCheckIns(externalActivityId: string) {
  const canRead = hasPerms("attendance.read.sheet");
  const canSubmit = hasPerms("attendance.create.sheet");

  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["attendance_role", "attendance_status"]);

  const activityId = ref<string>(externalActivityId);

  /** 活动状态与阶段由作战室注入：已取消的活动不给生成 / 提交入口（审批入口不受影响） */
  const activityStatusCode = ref("");
  const activityPhase = ref("");
  function setActivityStatus(code?: string, phase?: string) {
    activityStatusCode.value = code ?? "";
    activityPhase.value = phase ?? "";
  }
  const isCancelled = computed(() => activityStatusCode.value === "cancelled");

  /**
   * 活动还没结束就生成草稿的坑：忘签退的人，草稿会拿「活动结束时间」当签退时间补上，
   * 而那个时刻还没到——提交时后端按「签退不得晚于当前时间」直接拒掉整张单。
   * 实测确认过这条(2026-08-01)，所以提前说清楚，别让人提交完才发现。
   */
  const activityNotEndedYet = computed(
    () => activityPhase.value !== "" && activityPhase.value !== "ended"
  );
  /** 能否动草稿：有创建码 + 活动没被取消 */
  const canUseDraft = computed(() => canSubmit && !isCancelled.value);

  /* ----------------------------- 上半：打卡证据 ----------------------------- */
  const loading = ref(false);
  const dataList = ref<ActivityCheckInItem[]>([]);
  const pagination = ref({ total: 0, pageSize: 10, currentPage: 1 });

  const columns: TableColumnList = [
    {
      label: "队员",
      prop: "member",
      minWidth: 170,
      formatter: ({ member }) =>
        member ? `${member.displayName}（${member.memberNo}）` : "—"
    },
    {
      label: "签到时间",
      prop: "checkInAt",
      minWidth: 160,
      formatter: ({ checkInAt }) =>
        checkInAt ? dayjs(checkInAt).format("YYYY-MM-DD HH:mm") : "—"
    },
    {
      label: "签退时间",
      prop: "checkOutAt",
      minWidth: 160,
      formatter: ({ checkOutAt }) =>
        checkOutAt ? dayjs(checkOutAt).format("YYYY-MM-DD HH:mm") : "未签退"
    },
    {
      // 只给距离不给坐标是后端的安全设计,页头已说明
      label: "签到距离",
      prop: "checkInDistance",
      minWidth: 110,
      formatter: ({ checkInDistance }) =>
        checkInDistance ? `${checkInDistance} 米` : "—"
    },
    {
      label: "签退距离",
      prop: "checkOutDistance",
      minWidth: 110,
      formatter: ({ checkOutDistance }) =>
        checkOutDistance ? `${checkOutDistance} 米` : "—"
    },
    { label: "情况", prop: "flags", minWidth: 220, slot: "flags" }
  ];

  function rowFlags(row: ActivityCheckInItem) {
    return describeCheckInFlags(row);
  }

  async function onSearch() {
    if (!canRead || !activityId.value) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getActivityCheckIns(activityId.value, {
        page: pagination.value.currentPage,
        pageSize: pagination.value.pageSize
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.value.total = data.total;
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "加载打卡记录失败"), { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  function handleSizeChange(val: number) {
    pagination.value.pageSize = val;
    pagination.value.currentPage = 1;
    onSearch();
  }
  function handleCurrentChange(val: number) {
    pagination.value.currentPage = val;
    onSearch();
  }

  /* ----------------------------- 下半：考勤草稿 ----------------------------- */
  const draftLoading = ref(false);
  const draftVisible = ref(false);
  const draftRows = ref<DraftEditableRow[]>([]);
  const absentRegistrations = ref<AttendanceDraftAbsentRegistration[]>([]);
  const submitting = ref(false);

  /** 草稿会被拆成几张单据（后端单张上限 200 条） */
  const sheetCount = computed(() =>
    Math.ceil(draftRows.value.length / ATTENDANCE_RECORDS_MAX_PER_SHEET)
  );
  const willSplit = computed(() => sheetCount.value > 1);

  const roleOptions = computed(() => dict.options("attendance_role"));
  const statusOptions = computed(() => dict.options("attendance_status"));

  /**
   * 拉草稿。records 里只有 memberId，没有队员名——用同一活动的打卡证据
   * 按 registrationId 补上展示名，纯展示层拼接，不改任何提交字段。
   */
  async function generateDraft() {
    if (!canUseDraft.value || !activityId.value) return;
    draftLoading.value = true;
    try {
      const { code, data } = await getAttendanceSheetDraft(activityId.value);
      if (code !== 0) return;

      // 取全量打卡证据做 registrationId → 队员名 的映射（草稿每条都源自一次打卡）。
      // 必须翻页拉:后端 pageSize 硬上限 100,一次性要 200 会被 400 拒掉,
      // 那样整张草稿的队员名都会退化成 id 尾段。
      const nameByRegistration = new Map<
        string,
        { displayName: string; memberNo: string }
      >();
      try {
        const { items } = await fetchAllPages<ActivityCheckInItem>(
          (page, pageSize) =>
            getActivityCheckIns(activityId.value, { page, pageSize })
        );
        for (const it of items) {
          nameByRegistration.set(it.registrationId, {
            displayName: it.member.displayName,
            memberNo: it.member.memberNo
          });
        }
      } catch {
        // 拿不到名字不影响提交，草稿仍可用（列里退化显示队员 id 尾段）
      }

      const flagOf = (r: AttendanceDraftRecord): AttendanceDraftFlag | null =>
        data.flags.find(
          f =>
            f.registrationId === r.registrationId && f.memberId === r.memberId
        ) ?? null;

      draftRows.value = data.records.map(r => {
        const who = nameByRegistration.get(r.registrationId);
        return {
          ...r,
          displayName: who?.displayName ?? `队员 ${r.memberId.slice(-6)}`,
          memberNo: who?.memberNo ?? "—",
          flags: describeDraftFlags(flagOf(r))
        };
      });
      absentRegistrations.value = data.absentRegistrations;
      draftVisible.value = true;

      if (draftRows.value.length === 0) {
        message(
          "这个活动还没有任何打卡记录，生成不出考勤草稿；如需补录请直接新建考勤单",
          { type: "warning", duration: 6000 }
        );
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "生成考勤草稿失败"), { type: "error" });
    } finally {
      draftLoading.value = false;
    }
  }

  /** 放弃草稿（本地状态，未落库，直接丢弃即可） */
  function discardDraft() {
    draftVisible.value = false;
    draftRows.value = [];
    absentRegistrations.value = [];
  }

  /** 移除草稿里的某一行（比如判定这个人其实没到场） */
  function removeDraftRow(index: number) {
    draftRows.value.splice(index, 1);
  }

  /**
   * 提交草稿。
   *
   * 超过 200 条按后端 `ArrayMaxSize(200)` **分批建多张单据**——交接文档明令
   * 「不能静默截断」，所以这里既要分批，也要在确认框里说清会拆成几张。
   * 任一批失败就停下并报告已成功几张，不假装整体成功。
   */
  async function submitDraft() {
    if (!canUseDraft.value || !activityId.value) return;
    if (draftRows.value.length === 0) {
      message("草稿里没有任何记录，不能提交", { type: "warning" });
      return;
    }

    const total = draftRows.value.length;
    const batches: AttendanceDraftRecord[][] = [];
    for (let i = 0; i < total; i += ATTENDANCE_RECORDS_MAX_PER_SHEET) {
      batches.push(
        draftRows.value
          .slice(i, i + ATTENDANCE_RECORDS_MAX_PER_SHEET)
          .map(row => ({
            memberId: row.memberId,
            roleCode: row.roleCode,
            checkInAt: row.checkInAt,
            checkOutAt: row.checkOutAt,
            serviceHours: row.serviceHours,
            attendanceStatusCode: row.attendanceStatusCode,
            registrationId: row.registrationId
          }))
      );
    }

    const confirmText =
      batches.length > 1
        ? `共 ${total} 条考勤记录，超过单张考勤单 ${ATTENDANCE_RECORDS_MAX_PER_SHEET} 条的上限，将拆成 ${batches.length} 张单据分别提交。提交后进入待一级审核。`
        : `共 ${total} 条考勤记录，将创建 1 张考勤单，提交后进入待一级审核。`;

    try {
      await ElMessageBox.confirm(confirmText, "提交考勤", {
        confirmButtonText: "确定提交",
        cancelButtonText: "再看看",
        type: "warning"
      });
    } catch {
      return;
    }

    submitting.value = true;
    let done = 0;
    try {
      for (const records of batches) {
        await submitAttendanceSheet(activityId.value, { records });
        done += 1;
      }
      message(
        batches.length > 1
          ? `已提交 ${batches.length} 张考勤单，共 ${total} 条记录`
          : "考勤单已提交，等待一级审核",
        { type: "success" }
      );
      discardDraft();
    } catch (error: any) {
      // 分批场景下要说清「已经成功了几张」,否则用户不知道该不该重来
      const prefix =
        batches.length > 1 && done > 0
          ? `已成功提交 ${done} 张、剩余 ${batches.length - done} 张未提交：`
          : "";
      message(prefix + bizErrorMessage(error, "提交考勤失败"), {
        type: "error",
        duration: 8000
      });
    } finally {
      submitting.value = false;
    }
  }

  return {
    canRead,
    canSubmit,
    canUseDraft,
    isCancelled,
    activityNotEndedYet,
    setActivityStatus,
    // 证据表
    loading,
    columns,
    dataList,
    pagination,
    rowFlags,
    onSearch,
    handleSizeChange,
    handleCurrentChange,
    // 草稿
    draftLoading,
    draftVisible,
    draftRows,
    absentRegistrations,
    sheetCount,
    willSplit,
    roleOptions,
    statusOptions,
    submitting,
    generateDraft,
    discardDraft,
    removeDraftRow,
    submitDraft
  };
}
