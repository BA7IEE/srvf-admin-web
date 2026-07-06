import { bizErrorMessage } from "@/api/srvf-error";
import dayjs from "dayjs";
import { h, ref, reactive } from "vue";
import { useRouter } from "vue-router";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { getMemberOptions } from "@/api/srvf-position-assignment";
import { getOrgOptions, type OrgOptionItem } from "@/api/srvf-organization";
import { resolveLabels } from "@/api/srvf-meta";
import {
  getSupervisionAssignmentsPage,
  createSupervisionAssignment,
  revokeSupervisionAssignment,
  previewSupervisionCoverage,
  SCOPE_MODE_LABEL,
  SUPERVISION_STATUS_LABEL,
  SUPERVISION_STATUS_TAG,
  type SupervisionAssignmentItem,
  type SupervisionScopeMode,
  type SupervisionStatus
} from "@/api/srvf-supervision";
import type { MemberOptionItem } from "@/api/srvf-position-assignment";
import SupervisionForm, { type SupervisionFormModel } from "../form.vue";

/**
 * 督导（分管）总表：跨组织跨队员横扫，与职务正交（不要求分管人持职务）。
 * `coverage-preview` 是展示型预演，不是校验型预检——直接建，无二段式阻塞流程。
 */
export function useSupervisionAssignments() {
  const router = useRouter();
  const canRead = hasPerms("supervision-assignment.read.record");
  const canCreate = hasPerms("supervision-assignment.create.record");
  const canRevoke = hasPerms("supervision-assignment.revoke.record");

  const dataList = ref<SupervisionAssignmentItem[]>([]);
  const loading = ref(false);
  const scopeModeFilter = ref<"" | SupervisionScopeMode>("");
  const statusFilter = ref<"" | SupervisionStatus>("ACTIVE");
  const keyword = ref("");
  const formRef = ref();
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const scopeModeOptions = [
    { value: "", label: "全部覆盖范围" },
    ...Object.keys(SCOPE_MODE_LABEL).map(code => ({
      value: code,
      label: SCOPE_MODE_LABEL[code]
    }))
  ];
  const statusOptions = [
    { value: "", label: "全部（含历史）" },
    ...Object.keys(SUPERVISION_STATUS_LABEL).map(code => ({
      value: code,
      label: SUPERVISION_STATUS_LABEL[code]
    }))
  ];

  const memberOptions = ref<MemberOptionItem[]>([]);
  const orgOptions = ref<OrgOptionItem[]>([]);
  let formOptionsResolved = false;
  async function ensureFormOptions() {
    if (formOptionsResolved) return;
    formOptionsResolved = true;
    await Promise.allSettled([
      getMemberOptions({ limit: 100 })
        .then(({ code, data }) => {
          if (code === 0) memberOptions.value = data.items;
        })
        .catch(() => {}),
      getOrgOptions({ limit: 100 })
        .then(({ code, data }) => {
          if (code === 0) orgOptions.value = data.items;
        })
        .catch(() => {})
    ]);
  }

  const columns: TableColumnList = [
    {
      label: "分管人",
      prop: "supervisor",
      minWidth: 150,
      formatter: ({ supervisor, supervisorMemberId }) =>
        supervisor
          ? `${supervisor.displayName}（${supervisor.memberNo}）`
          : supervisorMemberId
    },
    {
      label: "被分管组织",
      prop: "organization",
      minWidth: 160,
      formatter: ({ organization, organizationId }) =>
        organization?.name ?? organizationId
    },
    { label: "覆盖范围", prop: "scopeMode", minWidth: 110, slot: "scopeMode" },
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
    { label: "操作", fixed: "right" as const, width: 160, slot: "operation" }
  ];

  function scopeModeLabel(code: string) {
    return SCOPE_MODE_LABEL[code] ?? code;
  }
  function statusMeta(code: string) {
    return {
      text: SUPERVISION_STATUS_LABEL[code] ?? code,
      type: SUPERVISION_STATUS_TAG[code] ?? ("info" as const)
    };
  }

  async function onSearch() {
    if (!canRead) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getSupervisionAssignmentsPage({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        expand: "supervisor,organization",
        ...(scopeModeFilter.value ? { scopeMode: scopeModeFilter.value } : {}),
        ...(statusFilter.value ? { status: statusFilter.value } : {}),
        ...(keyword.value.trim() ? { q: keyword.value.trim() } : {})
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "加载督导总表失败"), {
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

  /** 新建：coverage-preview 是展示型,写回同一份 options.props,不阻塞提交。 */
  async function openCreateDialog() {
    await ensureFormOptions();
    const initial: SupervisionFormModel = {
      supervisorMemberId: "",
      organizationId: "",
      scopeMode: "TREE",
      startedAt: dayjs().format("YYYY-MM-DD"),
      endedAt: "",
      note: ""
    };
    async function refreshCoveragePreview(options: any) {
      const cur = options.props.formInline as SupervisionFormModel;
      if (!cur.organizationId) {
        options.props.coveragePreview = null;
        return;
      }
      options.props.coverageLoading = true;
      try {
        const { code, data } = await previewSupervisionCoverage({
          organizationId: cur.organizationId,
          scopeMode: cur.scopeMode
        });
        if (code === 0) {
          const ids = data.expandedOrganizationIds;
          const res = await resolveLabels({
            refs: ids.map(id => ({ type: "organization" as const, id }))
          });
          options.props.coveragePreview =
            res.code === 0
              ? ids.map(id => res.data.organization?.[id]?.label ?? id)
              : ids;
        }
      } catch {
        // 预演失败不阻塞表单填写,仅不显示覆盖范围提示
        options.props.coveragePreview = null;
      } finally {
        options.props.coverageLoading = false;
      }
    }
    addDialog({
      title: "新建分管",
      width: "52%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: initial,
        memberOptions: memberOptions.value,
        orgOptions: orgOptions.value,
        coveragePreview: null,
        coverageLoading: false
      },
      contentRenderer: ({ options }) =>
        h(SupervisionForm, {
          ref: formRef,
          onPreviewCoverage: () => refreshCoveragePreview(options)
        }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as SupervisionFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            await createSupervisionAssignment({
              supervisorMemberId: curData.supervisorMemberId,
              organizationId: curData.organizationId,
              scopeMode: curData.scopeMode,
              startedAt: curData.startedAt,
              ...(curData.endedAt ? { endedAt: curData.endedAt } : {}),
              ...(curData.note ? { note: curData.note } : {})
            });
            message("新建成功", { type: "success" });
            done();
            onSearch();
          } catch (error: any) {
            message(bizErrorMessage(error, "新建失败"), {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  function rowSubject(row: SupervisionAssignmentItem) {
    return row.supervisor
      ? `${row.supervisor.displayName}（${row.supervisor.memberNo}）`
      : row.supervisorMemberId;
  }
  function rowOrg(row: SupervisionAssignmentItem) {
    return row.organization?.name ?? row.organizationId;
  }

  function handleRevoke(row: SupervisionAssignmentItem) {
    ElMessageBox.confirm(
      `确定撤销「${rowSubject(row)}」对「${rowOrg(row)}」（${scopeModeLabel(row.scopeMode)}）的分管吗？`,
      "撤销分管",
      {
        confirmButtonText: "确定撤销",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await revokeSupervisionAssignment(row.id);
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

  function goMember(row: SupervisionAssignmentItem) {
    router.push(`/srvf/members-domain/members/${row.supervisorMemberId}`);
  }

  return {
    canRead,
    canCreate,
    canRevoke,
    loading,
    scopeModeFilter,
    scopeModeOptions,
    statusFilter,
    statusOptions,
    keyword,
    columns,
    dataList,
    pagination,
    scopeModeLabel,
    statusMeta,
    onSearch,
    onFilterChange,
    openCreateDialog,
    handleRevoke,
    goMember,
    handleSizeChange,
    handleCurrentChange
  };
}
