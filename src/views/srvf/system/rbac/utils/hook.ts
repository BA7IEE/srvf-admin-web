import { bizErrorMessage } from "@/api/srvf-error";
import dayjs from "dayjs";
import { h, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { addDrawer } from "@/components/ReDrawer";
import { useSrvfList } from "@/srvf-kit";
import RoleForm, { type RoleFormModel } from "../form.vue";
import PermissionsDrawer from "../permissions-drawer.vue";
import {
  getRoles,
  reloadRbac,
  createRole,
  updateRole,
  deleteRole,
  roleBizErrorMessage,
  type RoleItem,
  type RoleListQuery
} from "@/api/srvf-role";

export function useRoles() {
  const formRef = ref();
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染表格 */
  const canRead = hasPerms("rbac.role.read");
  /** 重载缓存权限（改完角色/权限绑定后触发,否则不即时生效） */
  const canReload = hasPerms("rbac.config.reload");
  const canCreate = hasPerms("rbac.role.create");
  const canUpdate = hasPerms("rbac.role.update");
  const canDelete = hasPerms("rbac.role.delete");
  const canManagePermissions =
    hasPerms("rbac.role-permission.create") ||
    hasPerms("rbac.role-permission.delete");
  const hasAnyAction = canUpdate || canDelete || canManagePermissions;

  /** 权限点分配抽屉的内容组件 ref（beforeSure 经它调 save，见 openPermissionsDrawer） */
  const permsDrawerRef = ref();

  const {
    dataList,
    loading,
    pagination,
    onSearch,
    handleSizeChange,
    handleCurrentChange
  } = useSrvfList<RoleItem, RoleListQuery>({
    fetch: getRoles,
    buildParams: () => ({}),
    errorMessage: "加载角色列表失败",
    canRead
  });

  const columns: TableColumnList = [
    { label: "角色编码", prop: "code", minWidth: 160 },
    { label: "角色名称", prop: "displayName", minWidth: 140 },
    {
      label: "描述",
      prop: "description",
      minWidth: 200,
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
            width: 260,
            slot: "operation"
          }
        ]
      : [])
  ];

  /** 重载 RBAC 缓存(全量;改完绑定后即时生效) */
  function handleReload() {
    ElMessageBox.confirm(
      "确定重载 RBAC 权限缓存吗？改完角色/权限绑定后需重载才即时生效。",
      "使权限立即生效",
      {
        confirmButtonText: "确定重载",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await reloadRbac("all");
          message("缓存已重载", { type: "success" });
        } catch (error: any) {
          message(bizErrorMessage(error, "重载失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 新建 / 编辑角色（create：code+displayName+description；edit：code 只读） */
  function openDialog(title: "新建" | "编辑", row?: RoleItem) {
    const isEdit = title === "编辑";
    addDialog({
      title: `${title}角色`,
      width: "42%",
      draggable: true,
      fullscreen: deviceDetection(),
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        isEdit,
        formInline: {
          code: row?.code ?? "",
          displayName: row?.displayName ?? "",
          description: row?.description ?? ""
        } as RoleFormModel
      },
      contentRenderer: () => h(RoleForm, { ref: formRef, isEdit }),
      beforeSure: (done, { options, closeLoading }) => {
        const cur = options.props.formInline as RoleFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              await updateRole(row.id, {
                displayName: cur.displayName,
                description: cur.description
              });
              message("修改成功", { type: "success" });
            } else {
              await createRole({
                code: cur.code,
                displayName: cur.displayName,
                ...(cur.description ? { description: cur.description } : {})
              });
              message("新建成功", { type: "success" });
            }
            done();
            onSearch();
          } catch (error: any) {
            message(roleBizErrorMessage(error, "保存失败"), { type: "error" });
            closeLoading();
          }
        });
      }
    });
  }

  /** 软删角色（role_permissions / user_roles 不联动清理，见 srvf-role.ts deleteRole 注释） */
  function handleDelete(row: RoleItem) {
    ElMessageBox.confirm(
      `确定删除角色「${row.displayName}」（${row.code}）吗？删除后所有持有此角色的用户将立即失去其授予的权限。`,
      "删除角色",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await deleteRole(row.id);
          message("删除成功", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(roleBizErrorMessage(error, "删除失败"), { type: "error" });
        }
      })
      .catch(() => {});
  }

  /** 打开权限点分配抽屉；底部「确定」经 beforeSure 调内容组件 save() —
   *  成功 → done() 关闭 + onSearch 刷新角色列表(承接原 @saved="onSearch")；
   *  真错误 → closeLoading 保持打开待重试。 */
  function openPermissionsDrawer(row: RoleItem) {
    addDrawer({
      title: `权限点分配 — ${row.displayName} (${row.code})`,
      size: "640px",
      sureBtnLoading: true,
      contentRenderer: () =>
        h(PermissionsDrawer, { ref: permsDrawerRef, role: row }),
      beforeSure: (done, { closeLoading }) => {
        permsDrawerRef.value
          .save()
          .then(() => {
            done();
            onSearch();
          })
          .catch(() => closeLoading());
      }
    });
  }

  return {
    canRead,
    canReload,
    canCreate,
    canUpdate,
    canDelete,
    canManagePermissions,
    loading,
    columns,
    dataList,
    pagination,
    onSearch,
    handleReload,
    handleSizeChange,
    handleCurrentChange,
    openDialog,
    handleDelete,
    openPermissionsDrawer
  };
}
