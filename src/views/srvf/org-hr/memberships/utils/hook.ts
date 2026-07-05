import dayjs from "dayjs";
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import {
  getMemberships,
  MEMBERSHIP_TYPE_LABEL,
  MEMBERSHIP_STATUS_LABEL,
  MEMBERSHIP_STATUS_TAG,
  type MembershipItem
} from "@/api/srvf-membership";

/**
 * 会籍总表（跨队员跨组织横扫,F4「D组」,只读）。
 * 默认只看在册：总表缺省 = 全部未软删含 ENDED 历史 → 显式 status=ACTIVE；
 * expand=member,organization 直接出队员/组织摘要,无需二次解析；
 * q 模糊命中队员 memberNo+displayName 与组织 name+code（组织过滤靠 q 已够用,
 * orgId 精确过滤场景在组织架构页「成员」面板承载）。
 */
export function useMembershipList() {
  const router = useRouter();
  const canRead = hasPerms("membership.list.record");

  const dataList = ref<MembershipItem[]>([]);
  const loading = ref(false);
  const statusFilter = ref<string>("ACTIVE");
  const typeFilter = ref<string>("");
  const keyword = ref<string>("");
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const statusOptions = [
    { value: "", label: "全部（含历史）" },
    ...Object.keys(MEMBERSHIP_STATUS_LABEL).map(code => ({
      value: code,
      label: MEMBERSHIP_STATUS_LABEL[code]
    }))
  ];
  const typeOptions = [
    { value: "", label: "全部类型" },
    ...Object.keys(MEMBERSHIP_TYPE_LABEL).map(code => ({
      value: code,
      label: MEMBERSHIP_TYPE_LABEL[code]
    }))
  ];

  const columns: TableColumnList = [
    {
      label: "队员",
      prop: "member",
      minWidth: 160,
      formatter: ({ member, memberId }) =>
        member ? `${member.displayName}（${member.memberNo}）` : memberId
    },
    {
      label: "组织",
      prop: "organization",
      minWidth: 180,
      formatter: ({ organization, organizationId }) =>
        organization?.name ?? organizationId
    },
    {
      label: "类型",
      prop: "membershipType",
      minWidth: 90,
      slot: "membershipType"
    },
    { label: "状态", prop: "status", minWidth: 90, slot: "status" },
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
    {
      label: "原因",
      prop: "reason",
      minWidth: 150,
      formatter: ({ reason }) => reason ?? "—"
    },
    { label: "操作", fixed: "right" as const, width: 120, slot: "operation" }
  ];

  function typeLabel(code: string) {
    return MEMBERSHIP_TYPE_LABEL[code] ?? code;
  }
  function statusMeta(code: string) {
    return {
      text: MEMBERSHIP_STATUS_LABEL[code] ?? code,
      type: MEMBERSHIP_STATUS_TAG[code] ?? ("info" as const)
    };
  }

  async function onSearch() {
    if (!canRead) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getMemberships({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        expand: "member,organization",
        ...(statusFilter.value ? { status: statusFilter.value } : {}),
        ...(typeFilter.value ? { membershipType: typeFilter.value } : {}),
        ...(keyword.value.trim() ? { q: keyword.value.trim() } : {})
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载会籍总表失败", {
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

  /** 跳队员档案（跨轴横扫 → 沿队员轴下钻） */
  function goMember(row: MembershipItem) {
    router.push(`/srvf/members-domain/members/${row.memberId}`);
  }
  /** 跳归属体检页 */
  function goConflicts() {
    router.push("/srvf/org-hr/membership-conflicts");
  }

  return {
    canRead,
    loading,
    statusFilter,
    statusOptions,
    typeFilter,
    typeOptions,
    keyword,
    columns,
    dataList,
    pagination,
    typeLabel,
    statusMeta,
    onSearch,
    onFilterChange,
    goMember,
    goConflicts,
    handleSizeChange,
    handleCurrentChange
  };
}
