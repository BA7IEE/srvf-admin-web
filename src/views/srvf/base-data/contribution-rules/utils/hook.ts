import { ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import {
  getContributionRules,
  type ContributionRuleItem
} from "@/api/srvf-contribution-rule";

export function useContributionRules() {
  const dataList = ref<ContributionRuleItem[]>([]);
  const loading = ref(false);
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染表格 */
  const canRead = hasPerms("contribution.read.rule");

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    { label: "活动类型", prop: "activityTypeCode", minWidth: 140 },
    { label: "考勤角色", prop: "attendanceRoleCode", minWidth: 130 },
    {
      label: "时长阈值",
      prop: "durationThreshold",
      minWidth: 110,
      formatter: ({ durationThreshold }) => durationThreshold ?? "—"
    },
    { label: "阈下分", prop: "pointsBelow", minWidth: 90 },
    {
      label: "阈上分",
      prop: "pointsAbove",
      minWidth: 90,
      formatter: ({ pointsAbove }) => pointsAbove ?? "—"
    },
    { label: "状态", prop: "status", minWidth: 100, slot: "status" }
  ];

  async function onSearch() {
    if (!canRead) return;
    loading.value = true;
    try {
      const { code, data } = await getContributionRules({
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
      message(error?.response?.data?.message ?? "加载贡献值规则失败", {
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
