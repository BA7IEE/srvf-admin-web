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

export function useAttendances() {
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染 */
  const canRead = hasPerms("attendance.read.sheet");
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
    { label: "状态", prop: "statusCode", minWidth: 110 },
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
    loadActivities,
    onSearch,
    onActivityChange,
    handleSizeChange,
    handleCurrentChange
  };
}
