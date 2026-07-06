import dayjs from "dayjs";
import { h, ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import PermissionForm, { type PermissionFormModel } from "../form.vue";
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  permissionBizErrorMessage,
  type PermissionItem
} from "@/api/srvf-permission";

export function usePermissions() {
  const dataList = ref<PermissionItem[]>([]);
  const loading = ref(false);
  const formRef = ref();
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染表格 */
  const canRead = hasPerms("rbac.permission.read");
  const canCreate = hasPerms("rbac.permission.create");
  const canUpdate = hasPerms("rbac.permission.update");
  const canDelete = hasPerms("rbac.permission.delete");
  const hasAnyAction = canUpdate || canDelete;

  const filterForm = reactive<{ module: string; resourceType: string }>({
    module: "",
    resourceType: ""
  });

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    { label: "权限点 code", prop: "code", minWidth: 220 },
    { label: "模块", prop: "module", minWidth: 100 },
    { label: "动作", prop: "action", minWidth: 100 },
    { label: "资源类型", prop: "resourceType", minWidth: 100 },
    {
      label: "描述",
      prop: "description",
      minWidth: 180,
      formatter: ({ description }) => description ?? "—"
    },
    {
      label: "创建时间",
      prop: "createdAt",
      minWidth: 170,
      formatter: ({ createdAt }) =>
        dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss")
    },
    ...(hasAnyAction
      ? [
          {
            label: "操作",
            fixed: "right" as const,
            width: 200,
            slot: "operation"
          }
        ]
      : [])
  ];

  async function onSearch() {
    if (!canRead) return;
    loading.value = true;
    try {
      const { code, data } = await getPermissions({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        ...(filterForm.module ? { module: filterForm.module } : {}),
        ...(filterForm.resourceType
          ? { resourceType: filterForm.resourceType }
          : {})
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载权限点列表失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  function handleFilterReset() {
    filterForm.module = "";
    filterForm.resourceType = "";
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

  /** 新建 / 编辑权限点（create：code+module+action+resourceType+description；edit：仅 description） */
  function openDialog(title: "新建" | "编辑", row?: PermissionItem) {
    const isEdit = title === "编辑";
    addDialog({
      title: `${title}权限点`,
      width: "48%",
      draggable: true,
      fullscreen: deviceDetection(),
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        isEdit,
        formInline: {
          code: row?.code ?? "",
          module: row?.module ?? "",
          action: row?.action ?? "",
          resourceType: row?.resourceType ?? "",
          description: row?.description ?? ""
        } as PermissionFormModel
      },
      contentRenderer: () => h(PermissionForm, { ref: formRef, isEdit }),
      beforeSure: (done, { options, closeLoading }) => {
        const cur = options.props.formInline as PermissionFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              await updatePermission(row.id, {
                description: cur.description
              });
              message("修改成功", { type: "success" });
            } else {
              await createPermission({
                code: cur.code,
                module: cur.module,
                action: cur.action,
                resourceType: cur.resourceType,
                ...(cur.description ? { description: cur.description } : {})
              });
              message("新建成功", { type: "success" });
            }
            done();
            onSearch();
          } catch (error: any) {
            message(permissionBizErrorMessage(error, "保存失败"), {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /** 物理删除权限点（不可逆；RolePermission 外键级联清理，见 srvf-permission.ts deletePermission 注释） */
  function handleDelete(row: PermissionItem) {
    ElMessageBox.confirm(
      `确定删除权限点「${row.code}」吗？此操作不可逆，所有已绑定此权限点的角色将立即失去它。`,
      "删除权限点",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await deletePermission(row.id);
          message("删除成功", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(permissionBizErrorMessage(error, "删除失败"), {
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
    columns,
    dataList,
    pagination,
    filterForm,
    onSearch,
    handleFilterReset,
    handleSizeChange,
    handleCurrentChange,
    openDialog,
    handleDelete
  };
}
