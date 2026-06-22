import dayjs from "dayjs";
import { ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { getActivities } from "@/api/srvf-activity";
import {
  getActivityRegistrations,
  type RegistrationItem
} from "@/api/srvf-registration";

export function useRegistrations() {
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染 */
  const canRead = hasPerms("activity-registration.read.record");
  const dataList = ref<RegistrationItem[]>([]);
  const loading = ref(false);
  /** 报名隶属活动：先选活动，再查其报名 */
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
    {
      label: "队员",
      prop: "memberDisplayName",
      minWidth: 140,
      formatter: ({ memberDisplayName, memberNo, memberId }) =>
        memberDisplayName ?? memberNo ?? memberId
    },
    {
      label: "队员编号",
      prop: "memberNo",
      minWidth: 140,
      formatter: ({ memberNo }) => memberNo ?? "—"
    },
    { label: "状态", prop: "statusCode", minWidth: 110 },
    {
      label: "报名时间",
      prop: "registeredAt",
      minWidth: 170,
      formatter: ({ registeredAt }) =>
        registeredAt ? dayjs(registeredAt).format("YYYY-MM-DD HH:mm:ss") : "—"
    },
    {
      label: "审核时间",
      prop: "reviewedAt",
      minWidth: 170,
      formatter: ({ reviewedAt }) =>
        reviewedAt ? dayjs(reviewedAt).format("YYYY-MM-DD HH:mm:ss") : "—"
    },
    {
      label: "取消时间",
      prop: "cancelledAt",
      minWidth: 170,
      formatter: ({ cancelledAt }) =>
        cancelledAt ? dayjs(cancelledAt).format("YYYY-MM-DD HH:mm:ss") : "—"
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
      const { code, data } = await getActivityRegistrations(activityId.value, {
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
      message(error?.response?.data?.message ?? "加载报名记录失败", {
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
