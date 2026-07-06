import { bizErrorMessage } from "@/api/srvf-error";
import dayjs from "dayjs";
import { ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { getAuditLogs, type AuditLogItem } from "@/api/srvf-audit-log";

export function useAuditLogs() {
  const dataList = ref<AuditLogItem[]>([]);
  const loading = ref(false);
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染表格 */
  const canRead = hasPerms("audit-log.read.entry");

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    {
      label: "时间",
      prop: "createdAt",
      minWidth: 170,
      formatter: ({ createdAt }) =>
        dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss")
    },
    { label: "事件", prop: "event", minWidth: 160 },
    { label: "资源类型", prop: "resourceType", minWidth: 140 },
    {
      label: "资源 ID",
      prop: "resourceId",
      minWidth: 160,
      formatter: ({ resourceId }) => resourceId ?? "—"
    },
    {
      label: "操作者角色",
      prop: "actorRoleSnap",
      minWidth: 120,
      formatter: ({ actorRoleSnap }) => actorRoleSnap ?? "—"
    },
    { label: "结果", prop: "success", minWidth: 90, slot: "success" },
    { label: "操作", fixed: "right" as const, width: 100, slot: "operation" }
  ];

  /** 详情抽屉（点开单条,重拉 GET .../{id}，与列表内存态各自独立） */
  const detailVisible = ref(false);
  const detailId = ref("");
  function openDetail(row: AuditLogItem) {
    detailId.value = row.id;
    detailVisible.value = true;
  }

  async function onSearch() {
    if (!canRead) return;
    loading.value = true;
    try {
      const { code, data } = await getAuditLogs({
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
      message(bizErrorMessage(error, "加载审计日志失败"), {
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
    handleCurrentChange,
    detailVisible,
    detailId,
    openDetail
  };
}
