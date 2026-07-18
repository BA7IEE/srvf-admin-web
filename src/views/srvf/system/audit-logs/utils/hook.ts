import dayjs from "dayjs";
import { h } from "vue";
import { hasPerms } from "@/utils/auth";
import { useSrvfList } from "@/srvf-kit";
import { addDrawer } from "@/components/ReDrawer";
import DetailDrawer from "../detail-drawer.vue";
import {
  getAuditLogs,
  type AuditLogItem,
  type AuditLogListQuery
} from "@/api/srvf-audit-log";

export function useAuditLogs() {
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染表格 */
  const canRead = hasPerms("audit-log.read.entry");

  const {
    dataList,
    loading,
    pagination,
    onSearch,
    handleSizeChange,
    handleCurrentChange
  } = useSrvfList<AuditLogItem, AuditLogListQuery>({
    fetch: getAuditLogs,
    buildParams: () => ({}),
    errorMessage: "加载审计日志失败",
    canRead
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
  function openDetail(row: AuditLogItem) {
    addDrawer({
      title: "审计记录详情",
      size: "560px",
      hideFooter: true,
      contentRenderer: () => h(DetailDrawer, { id: row.id })
    });
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
    openDetail
  };
}
