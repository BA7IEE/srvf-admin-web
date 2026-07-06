import { bizErrorMessage } from "@/api/srvf-error";
import dayjs from "dayjs";
import { h, ref, reactive } from "vue";
import { useRouter } from "vue-router";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import {
  getPositionOptions,
  type PositionOptionItem
} from "@/api/srvf-position";
import { getOrgOptions, type OrgOptionItem } from "@/api/srvf-organization";
import {
  getPositionAssignments,
  revokePositionAssignment,
  getPositionAssignmentHistory,
  ASSIGNMENT_STATUS_LABEL,
  ASSIGNMENT_STATUS_TAG,
  type PositionAssignmentItem
} from "@/api/srvf-position-assignment";
import AssignmentHistory from "../assignment-history.vue";

/**
 * 全局任职总表（跨组织跨队员横扫,只读+撤销;expand=member,position,organization
 * 直接出摘要,无需二次 resolveLabels）。任命创建入口在组织架构页「在任职务」面板
 * （需要先锚定所属组织,总表不做创建）。
 */
export function usePositionAssignmentList() {
  const router = useRouter();
  const canRead = hasPerms("position-assignment.read.record");
  const canRevoke = hasPerms("position-assignment.revoke.record");
  const canHistory = hasPerms("position-assignment.read.history");

  const dataList = ref<PositionAssignmentItem[]>([]);
  const loading = ref(false);
  const statusFilter = ref<string>("ACTIVE");
  const positionFilter = ref<string>("");
  const orgFilter = ref<string>("");
  const includeDescendants = ref(false);
  const keyword = ref<string>("");
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const statusOptions = [
    { value: "", label: "全部（含历史）" },
    ...Object.keys(ASSIGNMENT_STATUS_LABEL).map(code => ({
      value: code,
      label: ASSIGNMENT_STATUS_LABEL[code]
    }))
  ];

  /** 职务/组织过滤下拉（options 端点;limit 后端硬校验≤100） */
  const positionOptions = ref<PositionOptionItem[]>([]);
  const orgOptions = ref<OrgOptionItem[]>([]);
  let filtersResolved = false;
  async function ensureFilterOptions() {
    if (filtersResolved) return;
    filtersResolved = true;
    try {
      const [posRes, orgRes] = await Promise.all([
        getPositionOptions({ limit: 100 }),
        getOrgOptions({ limit: 100 })
      ]);
      if (posRes.code === 0) positionOptions.value = posRes.data.items;
      if (orgRes.code === 0) orgOptions.value = orgRes.data.items;
    } catch {
      // 无读权限 → 过滤下拉为空,不阻塞总表本身
    }
  }

  const columns: TableColumnList = [
    {
      label: "队员",
      prop: "member",
      minWidth: 150,
      formatter: ({ member, memberId }) =>
        member ? `${member.displayName}（${member.memberNo}）` : memberId
    },
    {
      label: "组织",
      prop: "organization",
      minWidth: 160,
      formatter: ({ organization, organizationId }) =>
        organization?.name ?? organizationId
    },
    {
      label: "职务",
      prop: "position",
      minWidth: 110,
      formatter: ({ position, positionId }) => position?.name ?? positionId
    },
    { label: "状态", prop: "status", minWidth: 90, slot: "status" },
    { label: "兼任", prop: "isConcurrent", minWidth: 70, slot: "isConcurrent" },
    {
      label: "起始",
      prop: "startedAt",
      minWidth: 110,
      formatter: ({ startedAt }) =>
        startedAt ? dayjs(startedAt).format("YYYY-MM-DD") : "—"
    },
    {
      label: "结束",
      prop: "endedAt",
      minWidth: 110,
      formatter: ({ endedAt }) =>
        endedAt ? dayjs(endedAt).format("YYYY-MM-DD") : "—"
    },
    { label: "操作", fixed: "right" as const, width: 200, slot: "operation" }
  ];

  function statusMeta(code: string) {
    return {
      text: ASSIGNMENT_STATUS_LABEL[code] ?? code,
      type: ASSIGNMENT_STATUS_TAG[code] ?? ("info" as const)
    };
  }

  async function onSearch() {
    if (!canRead) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      await ensureFilterOptions();
      const { code, data } = await getPositionAssignments({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        expand: "member,position,organization",
        ...(statusFilter.value ? { status: statusFilter.value } : {}),
        ...(positionFilter.value ? { positionId: positionFilter.value } : {}),
        ...(orgFilter.value
          ? {
              organizationId: orgFilter.value,
              ...(includeDescendants.value ? { includeDescendants: true } : {})
            }
          : {}),
        ...(keyword.value.trim() ? { q: keyword.value.trim() } : {})
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "加载任职总表失败"), {
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

  function rowSubject(row: PositionAssignmentItem) {
    return row.member
      ? `${row.member.displayName}（${row.member.memberNo}）`
      : row.memberId;
  }
  function rowPosition(row: PositionAssignmentItem) {
    return row.position?.name ?? row.positionId;
  }

  function handleRevoke(row: PositionAssignmentItem) {
    ElMessageBox.confirm(
      `确定撤销「${rowSubject(row)}」的「${rowPosition(row)}」职务吗？`,
      "撤销任职",
      {
        confirmButtonText: "确定撤销",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await revokePositionAssignment(row.id);
          message("撤销成功", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(bizErrorMessage(error, "撤销失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  function openHistory(row: PositionAssignmentItem) {
    const historyItems = ref<PositionAssignmentItem[]>([]);
    const historyLoading = ref(true);
    addDialog({
      title: `任职历史 · ${rowSubject(row)} / ${rowPosition(row)}`,
      width: "44%",
      draggable: true,
      hideFooter: true,
      contentRenderer: () =>
        h(AssignmentHistory, {
          items: historyItems.value,
          loading: historyLoading.value
        })
    });
    getPositionAssignmentHistory(row.id)
      .then(({ code, data }) => {
        if (code === 0) historyItems.value = data;
      })
      .catch((error: any) => {
        message(bizErrorMessage(error, "加载历史失败"), {
          type: "error"
        });
      })
      .finally(() => {
        historyLoading.value = false;
      });
  }

  /** 跳队员档案（跨轴横扫 → 沿队员轴下钻） */
  function goMember(row: PositionAssignmentItem) {
    router.push(`/srvf/members-domain/members/${row.memberId}`);
  }

  return {
    canRead,
    canRevoke,
    canHistory,
    loading,
    statusFilter,
    statusOptions,
    positionFilter,
    positionOptions,
    orgFilter,
    orgOptions,
    includeDescendants,
    keyword,
    columns,
    dataList,
    pagination,
    statusMeta,
    onSearch,
    onFilterChange,
    handleRevoke,
    openHistory,
    goMember,
    handleSizeChange,
    handleCurrentChange
  };
}
