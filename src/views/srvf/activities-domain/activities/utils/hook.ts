import dayjs from "dayjs";
import { ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import { getActivities, type ActivityItem } from "@/api/srvf-activity";

export function useActivities() {
  const dataList = ref<ActivityItem[]>([]);
  const loading = ref(false);
  // 活动端点是 [auth]-only、无 RBAC 读码 → 不设 hasPerms 码门;
  // 可见性由后端按角色强制（USER 只见 published/completed）。
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    { label: "标题", prop: "title", minWidth: 180 },
    { label: "类型", prop: "activityTypeCode", minWidth: 130 },
    { label: "地点", prop: "location", minWidth: 140 },
    {
      label: "开始时间",
      prop: "startAt",
      minWidth: 160,
      formatter: ({ startAt }) =>
        startAt ? dayjs(startAt).format("YYYY-MM-DD HH:mm") : "—"
    },
    { label: "状态", prop: "statusCode", minWidth: 110 },
    {
      label: "公开报名",
      prop: "isPublicRegistration",
      minWidth: 100,
      slot: "isPublicRegistration"
    }
  ];

  async function onSearch() {
    loading.value = true;
    try {
      const { code, data } = await getActivities({
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
      message(error?.response?.data?.message ?? "加载活动列表失败", {
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
    loading,
    columns,
    dataList,
    pagination,
    onSearch,
    handleSizeChange,
    handleCurrentChange
  };
}
