import { bizErrorMessage } from "@/api/srvf-error";
import dayjs from "dayjs";
import { ref, reactive, computed } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import {
  getMemberRegistrations,
  getMemberAttendanceRecords,
  getMemberContributionSummary,
  type AdminRegistrationItem,
  type MemberAttendanceRecord,
  type MemberContributionSummary
} from "@/api/srvf-member-participation";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

/** 报名状态 code → tag 颜色（契约 registration_status 闭集；文案查字典）。 */
const REG_STATUS_TAG: Record<
  string,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  pending: "warning",
  pass: "success",
  reject: "danger",
  cancelled: "info"
};

/* ============================================================================
 * 队员 360 · 活动履历（某队员跨活动报名,只读;沿队员轴下钻）
 * ========================================================================== */
export function useMemberRegistrations(memberId: string) {
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["registration_status"]);

  const canRead = hasPerms("activity-registration.read.record");
  const dataList = ref<AdminRegistrationItem[]>([]);
  const loading = ref(false);
  /** statusCode 过滤（默认空 = 全部履历） */
  const statusFilter = ref<string>("");
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const statusOptions = computed(() => [
    { value: "", label: "全部状态" },
    ...Object.keys(REG_STATUS_TAG).map(code => ({
      value: code,
      label: dict.label("registration_status", code)
    }))
  ]);

  const columns: TableColumnList = [
    {
      label: "活动",
      prop: "activityTitle",
      minWidth: 200,
      formatter: ({ activityTitle, activityId }) => activityTitle ?? activityId
    },
    { label: "状态", prop: "statusCode", minWidth: 110, slot: "statusCode" },
    {
      label: "报名时间",
      prop: "registeredAt",
      minWidth: 165,
      formatter: ({ registeredAt }) =>
        registeredAt ? dayjs(registeredAt).format("YYYY-MM-DD HH:mm") : "—"
    },
    {
      label: "审核时间",
      prop: "reviewedAt",
      minWidth: 165,
      formatter: ({ reviewedAt }) =>
        reviewedAt ? dayjs(reviewedAt).format("YYYY-MM-DD HH:mm") : "—"
    }
  ];

  function statusMeta(code: string) {
    return {
      text: dict.label("registration_status", code),
      type: REG_STATUS_TAG[code] ?? ("info" as const)
    };
  }

  async function onSearch() {
    if (!canRead || !memberId) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getMemberRegistrations(memberId, {
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        ...(statusFilter.value ? { statusCode: statusFilter.value } : {})
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "加载活动履历失败"), {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  function onFilterChange() {
    pagination.currentPage = 1;
    onSearch();
  }
  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }
  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  return {
    canRead,
    loading,
    statusFilter,
    statusOptions,
    columns,
    dataList,
    pagination,
    statusMeta,
    onSearch,
    onFilterChange,
    handleSizeChange,
    handleCurrentChange
  };
}

/* ============================================================================
 * 队员 360 · 考勤记录（仅 approved sheet 内 records,只读）
 * ========================================================================== */
export function useMemberAttendanceRecords(memberId: string) {
  const canRead = hasPerms("attendance.read.sheet");
  const dataList = ref<MemberAttendanceRecord[]>([]);
  const loading = ref(false);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    {
      label: "活动",
      prop: "activityTitle",
      minWidth: 200,
      formatter: ({ activityTitle, activityId }) => activityTitle ?? activityId
    },
    {
      label: "角色",
      prop: "roleCode",
      minWidth: 110,
      formatter: ({ roleCode }) => roleCode || "—"
    },
    {
      label: "签到",
      prop: "checkInAt",
      minWidth: 165,
      formatter: ({ checkInAt }) =>
        checkInAt ? dayjs(checkInAt).format("YYYY-MM-DD HH:mm") : "—"
    },
    {
      label: "签退",
      prop: "checkOutAt",
      minWidth: 165,
      formatter: ({ checkOutAt }) =>
        checkOutAt ? dayjs(checkOutAt).format("YYYY-MM-DD HH:mm") : "—"
    },
    {
      label: "服务时长(h)",
      prop: "serviceHours",
      minWidth: 110,
      formatter: ({ serviceHours }) => serviceHours ?? "—"
    },
    {
      label: "出勤状态",
      prop: "attendanceStatusCode",
      minWidth: 110,
      formatter: ({ attendanceStatusCode }) => attendanceStatusCode || "—"
    },
    {
      label: "贡献值",
      prop: "contributionPoints",
      minWidth: 100,
      formatter: ({ contributionPoints }) => contributionPoints ?? "—"
    }
  ];

  async function onSearch() {
    if (!canRead || !memberId) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getMemberAttendanceRecords(memberId, {
        page: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "加载考勤记录失败"), {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }
  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  return {
    canRead,
    loading,
    columns,
    dataList,
    pagination,
    onSearch,
    handleSizeChange,
    handleCurrentChange
  };
}

/* ============================================================================
 * 队员 360 · 贡献值（生涯累计 capped 总分,只读单值;直接展示别再算）
 * ========================================================================== */
export function useMemberContribution(memberId: string) {
  const canRead = hasPerms("attendance.read.sheet");
  const loading = ref(false);
  const summary = ref<MemberContributionSummary | null>(null);

  async function onSearch() {
    if (!canRead || !memberId) {
      summary.value = null;
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getMemberContributionSummary(memberId);
      if (code === 0) summary.value = data;
    } catch (error: any) {
      message(bizErrorMessage(error, "加载贡献值失败"), {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  return {
    canRead,
    loading,
    summary,
    onSearch
  };
}
