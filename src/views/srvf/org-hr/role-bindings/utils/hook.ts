import dayjs from "dayjs";
import { h, ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { getRoles, type RoleItem } from "@/api/srvf-role";
import { getUserAccounts, type UserAccountItem } from "@/api/srvf-user";
import {
  getMemberOptions,
  getPositionAssignments,
  type MemberOptionItem,
  type PositionAssignmentItem
} from "@/api/srvf-position-assignment";
import { getOrgOptions, type OrgOptionItem } from "@/api/srvf-organization";
import {
  getActivityOptions,
  type ActivityOptionItem
} from "@/api/srvf-activity";
import {
  getRoleBindingsPage,
  createRoleBinding,
  updateRoleBinding,
  deleteRoleBinding,
  previewRoleBinding,
  PRINCIPAL_TYPE_LABEL,
  SCOPE_TYPE_LABEL,
  BINDING_STATUS_LABEL,
  BINDING_STATUS_TAG,
  type RoleBindingItem,
  type PrincipalType,
  type ScopeType,
  type BindingStatus
} from "@/api/srvf-role-binding";
import RoleBindingForm, { type RoleBindingFormModel } from "../form.vue";

/** 任职选择器候选项形状（principalType=POSITION_ASSIGNMENT 时的下拉,标签自拼"队员-职务@组织"）。 */
type PositionAssignmentOption = { id: string; label: string };

/**
 * 角色绑定（主体 → 角色 @ scope 的实际授予，是 scoped-authz 判权的数据源；
 * 与「角色权限」页(system/rbac，角色→权限码静态定义)是两个不同心智，见蓝图 §7）。
 */
export function useRoleBindings() {
  const canRead = hasPerms("role-binding.read.record");
  const canCreate = hasPerms("role-binding.create.record");
  const canUpdate = hasPerms("role-binding.update.record");
  const canDelete = hasPerms("role-binding.delete.record");

  const dataList = ref<RoleBindingItem[]>([]);
  const loading = ref(false);
  const principalTypeFilter = ref<"" | PrincipalType>("");
  const scopeTypeFilter = ref<"" | ScopeType>("");
  const statusFilter = ref<"" | BindingStatus>("");
  const includeExpired = ref(false);
  const keyword = ref("");
  const formRef = ref();
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const principalTypeOptions = [
    { value: "", label: "全部主体类型" },
    ...Object.keys(PRINCIPAL_TYPE_LABEL).map(code => ({
      value: code,
      label: PRINCIPAL_TYPE_LABEL[code]
    }))
  ];
  const scopeTypeOptions = [
    { value: "", label: "全部 scope" },
    ...Object.keys(SCOPE_TYPE_LABEL).map(code => ({
      value: code,
      label: SCOPE_TYPE_LABEL[code]
    }))
  ];
  const statusOptions = [
    { value: "", label: "全部状态" },
    ...Object.keys(BINDING_STATUS_LABEL).map(code => ({
      value: code,
      label: BINDING_STATUS_LABEL[code]
    }))
  ];

  /** 表单用下拉候选（各自懒加载一次;失败则对应选择器为空,不阻塞页面其余功能） */
  const roleOptions = ref<RoleItem[]>([]);
  const userOptions = ref<UserAccountItem[]>([]);
  const memberOptions = ref<MemberOptionItem[]>([]);
  const positionAssignmentOptions = ref<PositionAssignmentOption[]>([]);
  const orgOptions = ref<OrgOptionItem[]>([]);
  const activityOptions = ref<ActivityOptionItem[]>([]);
  let formOptionsResolved = false;

  async function ensureFormOptions() {
    if (formOptionsResolved) return;
    formOptionsResolved = true;
    const tasks: Array<Promise<void>> = [
      getRoles({ pageSize: 100 })
        .then(({ code, data }) => {
          if (code === 0) roleOptions.value = data.items;
        })
        .catch(() => {}),
      getUserAccounts({ pageSize: 100 })
        .then(({ code, data }) => {
          if (code === 0) userOptions.value = data.items;
        })
        .catch(() => {}),
      getMemberOptions({ limit: 100 })
        .then(({ code, data }) => {
          if (code === 0) memberOptions.value = data.items;
        })
        .catch(() => {}),
      getPositionAssignments({
        status: "ACTIVE",
        pageSize: 100,
        expand: "member,position,organization"
      })
        .then(({ code, data }) => {
          if (code === 0) {
            positionAssignmentOptions.value = data.items.map(
              (it: PositionAssignmentItem) => ({
                id: it.id,
                label: `${it.member?.displayName ?? it.memberId} · ${it.position?.name ?? it.positionId} @ ${it.organization?.name ?? it.organizationId}`
              })
            );
          }
        })
        .catch(() => {}),
      getOrgOptions({ limit: 100 })
        .then(({ code, data }) => {
          if (code === 0) orgOptions.value = data.items;
        })
        .catch(() => {}),
      getActivityOptions({ limit: 100 })
        .then(({ code, data }) => {
          if (code === 0) activityOptions.value = data.items;
        })
        .catch(() => {})
    ];
    await Promise.allSettled(tasks);
  }

  const columns: TableColumnList = [
    {
      label: "主体",
      prop: "principal",
      minWidth: 160,
      formatter: ({ principal, principalType, principalId }) => {
        if (!principal) return principalId ?? "—";
        if (principal.type === "USER")
          return `${principal.username}${principal.nickname ? `（${principal.nickname}）` : ""}`;
        if (principal.type === "MEMBER")
          return `${principal.displayName}（${principal.memberNo}）`;
        if (principal.type === "POSITION_ASSIGNMENT")
          return `${principal.displayName}（任职）`;
        return `${PRINCIPAL_TYPE_LABEL[principalType] ?? principalType}`;
      }
    },
    {
      label: "角色",
      prop: "role",
      minWidth: 130,
      formatter: ({ role, roleId }) => role?.displayName ?? roleId
    },
    { label: "Scope", prop: "scopeType", minWidth: 110, slot: "scopeType" },
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

  function scopeTypeLabel(code: string) {
    return SCOPE_TYPE_LABEL[code] ?? code;
  }
  function statusMeta(code: string) {
    return {
      text: BINDING_STATUS_LABEL[code] ?? code,
      type: BINDING_STATUS_TAG[code] ?? ("info" as const)
    };
  }

  async function onSearch() {
    if (!canRead) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getRoleBindingsPage({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        expand: "role,principal",
        ...(principalTypeFilter.value
          ? { principalType: principalTypeFilter.value }
          : {}),
        ...(scopeTypeFilter.value ? { scopeType: scopeTypeFilter.value } : {}),
        ...(statusFilter.value ? { status: statusFilter.value } : {}),
        ...(includeExpired.value ? { includeExpired: true } : {}),
        ...(keyword.value.trim() ? { q: keyword.value.trim() } : {})
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载角色绑定失败", {
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

  /** 新建：预检不通过时把 conflicts 写回同一份 ReDialog options.props（P1-C 同款两段式）。 */
  async function openCreateDialog() {
    await ensureFormOptions();
    const initial: RoleBindingFormModel = {
      principalType: "MEMBER",
      principalId: "",
      roleId: "",
      scopeType: "GLOBAL",
      scopeOrgId: "",
      scopeActivityId: "",
      scopeResourceType: "",
      scopeResourceId: "",
      startedAt: dayjs().format("YYYY-MM-DD"),
      endedAt: "",
      note: ""
    };
    addDialog({
      title: "新建角色绑定",
      width: "56%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: initial,
        roleOptions: roleOptions.value,
        userOptions: userOptions.value,
        memberOptions: memberOptions.value,
        positionAssignmentOptions: positionAssignmentOptions.value,
        orgOptions: orgOptions.value,
        activityOptions: activityOptions.value,
        conflicts: []
      },
      contentRenderer: () => h(RoleBindingForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as RoleBindingFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          const body = {
            principalType: curData.principalType,
            ...(curData.principalId
              ? { principalId: curData.principalId }
              : {}),
            roleId: curData.roleId,
            scopeType: curData.scopeType,
            ...(curData.scopeOrgId ? { scopeOrgId: curData.scopeOrgId } : {}),
            ...(curData.scopeActivityId
              ? { scopeActivityId: curData.scopeActivityId }
              : {}),
            ...(curData.scopeResourceType
              ? { scopeResourceType: curData.scopeResourceType }
              : {}),
            ...(curData.scopeResourceId
              ? { scopeResourceId: curData.scopeResourceId }
              : {}),
            ...(curData.startedAt ? { startedAt: curData.startedAt } : {}),
            ...(curData.endedAt ? { endedAt: curData.endedAt } : {}),
            ...(curData.note ? { note: curData.note } : {})
          };
          try {
            const preview = await previewRoleBinding(body);
            if (preview.code === 0 && !preview.data.valid) {
              options.props.conflicts = preview.data.conflicts;
              closeLoading();
              return;
            }
          } catch (error: any) {
            message(error?.response?.data?.message ?? "预检失败", {
              type: "error"
            });
            closeLoading();
            return;
          }
          try {
            await createRoleBinding(body);
            message("新建成功", { type: "success" });
            done();
            onSearch();
          } catch (error: any) {
            message(error?.response?.data?.message ?? "新建失败", {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /** 编辑：仅状态/任期/备注可改。 */
  function openEditDialog(row: RoleBindingItem) {
    ElMessageBox.prompt(
      "修改备注（可空；状态/任期请用下方按钮操作）",
      `编辑绑定 · ${row.role?.displayName ?? row.roleId}`,
      {
        confirmButtonText: "保存",
        cancelButtonText: "取消",
        inputValue: row.note ?? "",
        inputType: "textarea"
      }
    )
      .then(async ({ value }) => {
        try {
          await updateRoleBinding(row.id, { note: value || undefined });
          message("修改成功", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? "修改失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 暂停/恢复（status 在 ACTIVE/SUSPENDED 间切换）。 */
  function handleToggleSuspend(row: RoleBindingItem) {
    const next: BindingStatus =
      row.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    const action = next === "SUSPENDED" ? "暂停" : "恢复";
    ElMessageBox.confirm(`确定${action}该角色绑定吗？`, "系统提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        try {
          await updateRoleBinding(row.id, { status: next });
          message(`${action}成功`, { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? `${action}失败`, {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 软删（status→ENDED，保历史）。 */
  function handleDelete(row: RoleBindingItem) {
    ElMessageBox.confirm(
      `确定删除「${row.role?.displayName ?? row.roleId}」这条角色绑定吗？记录将标记结束,保留历史。`,
      "删除角色绑定",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await deleteRoleBinding(row.id);
          message("删除成功", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? "删除失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    loading,
    principalTypeFilter,
    principalTypeOptions,
    scopeTypeFilter,
    scopeTypeOptions,
    statusFilter,
    statusOptions,
    includeExpired,
    keyword,
    columns,
    dataList,
    pagination,
    scopeTypeLabel,
    statusMeta,
    onSearch,
    onFilterChange,
    openCreateDialog,
    openEditDialog,
    handleToggleSuspend,
    handleDelete,
    handleSizeChange,
    handleCurrentChange
  };
}
