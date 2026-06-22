import dayjs from "dayjs";
import { ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { getActivities } from "@/api/srvf-activity";
import {
  getActivityAttendanceSheets,
  type AttendanceSheetItem
} from "@/api/srvf-attendance";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

/**
 * 考勤单据审核状态 code → tag 颜色（仅展示色；文案查 attendance_sheet_status 字典，前端不臆造）。
 * code 取自契约 attendance_sheet_status 5 态闭集（approved 语义为终审通过）。
 */
const STATUS_TAG_TYPE: Record<
  string,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  pending: "warning",
  pending_final_review: "warning",
  approved: "success",
  rejected: "danger",
  final_rejected: "danger"
};

export function useAttendances() {
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染 */
  const canRead = hasPerms("attendance.read.sheet");
  /** 共享字典标签解析器：考勤审核状态 code → 中文（attendance_sheet_status 字典） */
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["attendance_sheet_status"]);
  const dataList = ref<AttendanceSheetItem[]>([]);
  const loading = ref(false);
  /** 考勤隶属活动：先选活动，再查其考勤单据 */
  const activityId = ref<string>("");
  const activityOptions = ref<Array<{ label: string; value: string }>>([]);
  const activityLoading = ref(false);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    { label: "提交人 ID", prop: "submitterUserId", minWidth: 200 },
    { label: "状态", prop: "statusCode", minWidth: 110, slot: "statusCode" },
    { label: "版本", prop: "version", minWidth: 80 },
    {
      label: "提交时间",
      prop: "submittedAt",
      minWidth: 170,
      formatter: ({ submittedAt }) =>
        submittedAt ? dayjs(submittedAt).format("YYYY-MM-DD HH:mm:ss") : "—"
    },
    {
      label: "审核时间",
      prop: "reviewedAt",
      minWidth: 170,
      formatter: ({ reviewedAt }) =>
        reviewedAt ? dayjs(reviewedAt).format("YYYY-MM-DD HH:mm:ss") : "—"
    },
    {
      label: "创建时间",
      prop: "createdAt",
      minWidth: 170,
      formatter: ({ createdAt }) =>
        createdAt ? dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss") : "—"
    }
  ];

  /** 状态 code → 展示元数据：文案查 attendance_sheet_status 字典，颜色按 code 给展示色（未知 → 原 code + info 灰） */
  function statusMeta(code: string) {
    return {
      text: dict.label("attendance_sheet_status", code),
      type: STATUS_TAG_TYPE[code] ?? ("info" as const)
    };
  }

  /** 活动下拉（数据源 getActivities；首页 50 条 + filterable 检索） */
  async function loadActivities() {
    if (!canRead) return;
    activityLoading.value = true;
    try {
      const { code, data } = await getActivities({ page: 1, pageSize: 50 });
      if (code === 0) {
        activityOptions.value = data.items.map(a => ({
          label: a.title,
          value: a.id
        }));
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载活动失败", {
        type: "error"
      });
    } finally {
      activityLoading.value = false;
    }
  }

  async function onSearch() {
    if (!canRead || !activityId.value) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getActivityAttendanceSheets(
        activityId.value,
        { page: pagination.currentPage, pageSize: pagination.pageSize }
      );
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载考勤单据失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  function onActivityChange() {
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
    columns,
    dataList,
    activityId,
    activityOptions,
    activityLoading,
    pagination,
    statusMeta,
    loadActivities,
    onSearch,
    onActivityChange,
    handleSizeChange,
    handleCurrentChange
  };
}
