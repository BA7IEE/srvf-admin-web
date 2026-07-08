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
import RoleForm, { type RoleFormModel } from "../role-form.vue";
import UserForm, { type UserFormModel } from "../user-form.vue";
import {
  getUserAccounts,
  createUser,
  updateUser,
  resetUserPassword,
  updateUserStatus,
  updateUserRole,
  clearUserPhone,
  clearUserWechat,
  deleteUserAccount,
  type UserAccountItem,
  type AccountRole,
  type AccountStatus
} from "@/api/srvf-user";

/**
 * 系统角色 code → 中文展示 + tag 颜色。
 * `role` 是 docs-json 固定枚举（SUPER_ADMIN / ADMIN / USER，描述无「字典」）→ 最小展示映射，
 * 非字典、非前端臆造（值取自契约 enum）；颜色为纯展示选择。未知 code 退化为原文 + info 灰。
 */
const ROLE_META: Record<
  string,
  { text: string; type: "primary" | "success" | "info" | "warning" | "danger" }
> = {
  SUPER_ADMIN: { text: "超级管理员", type: "danger" },
  ADMIN: { text: "管理员", type: "warning" },
  USER: { text: "普通用户", type: "info" }
};

export function useUserAccounts() {
  const router = useRouter();
  const dataList = ref<UserAccountItem[]>([]);
  const loading = ref(false);
  const formRef = ref();

  /** 列表筛选（均为契约既有参数：q 模糊 username+nickname+email+phone；role/status 精确枚举） */
  const searchForm = reactive({
    q: "",
    role: "" as "" | AccountRole,
    status: "" as "" | AccountStatus
  });
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染表格 */
  const canRead = hasPerms("user.read.account");
  const canCreate = hasPerms("user.create.account");
  const canUpdateAccount = hasPerms("user.update.account");
  const canResetPassword = hasPerms("user.reset.password");
  /** 生命周期写权限（行内按钮级显隐；role 仅 SUPER_ADMIN 短路可用） */
  const canUpdateStatus = hasPerms("user.update.status");
  const canUpdateRole = hasPerms("user.update.role");
  const canClearPhone = hasPerms("user.phone.clear");
  const canClearWechat = hasPerms("user.wechat.clear");
  const canDelete = hasPerms("user.delete.account");
  /** RBAC 角色绑定（全局，users/{userId}/roles；与上面 canUpdateRole 的系统角色单值枚举是两回事） */
  const canRbacRoleManage =
    hasPerms("rbac.user-role.read") ||
    hasPerms("rbac.user-role.create") ||
    hasPerms("rbac.user-role.delete");
  const hasAnyAction =
    canUpdateAccount ||
    canResetPassword ||
    canUpdateStatus ||
    canUpdateRole ||
    canClearPhone ||
    canClearWechat ||
    canDelete ||
    canRbacRoleManage;

  /** RBAC 角色绑定抽屉状态（由 index.vue 传给 rbac-roles-drawer.vue） */
  const rbacRolesDrawerVisible = ref(false);
  const activeUser = ref<UserAccountItem | null>(null);

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    { label: "用户名", prop: "username", minWidth: 140 },
    {
      label: "昵称",
      prop: "nickname",
      minWidth: 120,
      formatter: ({ nickname }) => nickname ?? "—"
    },
    { label: "系统角色", prop: "role", minWidth: 120, slot: "role" },
    { label: "状态", prop: "status", minWidth: 100, slot: "status" },
    {
      label: "所属队员",
      prop: "member",
      minWidth: 160,
      formatter: ({ member }) =>
        member ? `${member.displayName}（${member.memberNo}）` : "—"
    },
    {
      label: "最近登录",
      prop: "lastLoginAt",
      minWidth: 170,
      formatter: ({ lastLoginAt }) =>
        lastLoginAt ? dayjs(lastLoginAt).format("YYYY-MM-DD HH:mm:ss") : "—"
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
            width: 190,
            slot: "operation"
          }
        ]
      : [])
  ];

  /** 系统角色 code → 展示元数据（中文 + 颜色；未知 → 原 code + info 灰） */
  function roleMeta(code: string) {
    return ROLE_META[code] ?? { text: code, type: "info" as const };
  }

  async function onSearch() {
    if (!canRead) return;
    loading.value = true;
    try {
      const { code, data } = await getUserAccounts({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        ...(searchForm.q.trim() ? { q: searchForm.q.trim() } : {}),
        ...(searchForm.role ? { role: searchForm.role } : {}),
        ...(searchForm.status ? { status: searchForm.status } : {})
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "加载用户列表失败"), {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  /** 筛选条件变化：回到第一页重查 */
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

  /** 新建 / 编辑用户（create:username/password/email/nickname/role；edit:仅 email/nickname） */
  function openDialog(title: "新建" | "编辑", row?: UserAccountItem) {
    const isEdit = title === "编辑";
    addDialog({
      title: `${title}用户`,
      width: "42%",
      draggable: true,
      fullscreen: deviceDetection(),
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          username: row?.username ?? "",
          password: "",
          email: row?.email ?? "",
          nickname: row?.nickname ?? "",
          role: row?.role ?? "USER"
        } as UserFormModel
      },
      contentRenderer: () => h(UserForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const cur = options.props.formInline as UserFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              await updateUser(row.id, {
                email: cur.email,
                nickname: cur.nickname
              });
              message("修改成功", { type: "success" });
            } else {
              await createUser({
                username: cur.username,
                password: cur.password,
                ...(cur.email ? { email: cur.email } : {}),
                ...(cur.nickname ? { nickname: cur.nickname } : {}),
                role: cur.role
              });
              message("新建成功", { type: "success" });
            }
            done();
            onSearch();
          } catch (error: any) {
            message(bizErrorMessage(error, "保存失败"), {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /** 重置密码（PUT；prompt 输入新密码,长度等规则由后端裁决） */
  function handleResetPassword(row: UserAccountItem) {
    ElMessageBox.prompt(`为用户「${row.username}」设置新密码：`, "重置密码", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputType: "password",
      inputValidator: (val: string) => {
        if (!val || !val.trim()) return "请输入新密码";
        return true;
      }
    })
      .then(async ({ value }) => {
        try {
          await resetUserPassword(row.id, value);
          message("密码已重置", { type: "success" });
        } catch (error: any) {
          message(bizErrorMessage(error, "重置失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 启用 / 禁用（status ACTIVE↔DISABLED；后端拒绝弹其 message） */
  function handleToggleStatus(row: UserAccountItem) {
    const next = row.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const action = next === "ACTIVE" ? "启用" : "禁用";
    ElMessageBox.confirm(
      `确定要${action}用户「${row.username}」吗？`,
      "系统提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await updateUserStatus(row.id, { status: next });
          message(`${action}成功`, { type: "success" });
          onSearch();
        } catch (error: any) {
          message(bizErrorMessage(error, `${action}失败`), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 改角色（弹单选；仅 SUPER_ADMIN 可用,他者后端拒绝弹 message） */
  function openRoleDialog(row: UserAccountItem) {
    addDialog({
      title: `修改「${row.username}」的角色`,
      width: "32%",
      draggable: true,
      fullscreen: deviceDetection(),
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: { formInline: { role: row.role } as RoleFormModel },
      contentRenderer: () => h(RoleForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as RoleFormModel;
        (async () => {
          try {
            await updateUserRole(row.id, { role: curData.role });
            message("角色已更新", { type: "success" });
            done();
            onSearch();
          } catch (error: any) {
            message(bizErrorMessage(error, "角色更新失败"), {
              type: "error"
            });
            closeLoading();
          }
        })();
      }
    });
  }

  /** 清手机（幂等）；后端拒绝弹其 message */
  function handleClearPhone(row: UserAccountItem) {
    ElMessageBox.confirm(
      `确定清除用户「${row.username}」绑定的手机号吗？`,
      "清除手机号",
      { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
    )
      .then(async () => {
        try {
          await clearUserPhone(row.id);
          message("已清除", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(bizErrorMessage(error, "清除失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 清微信（幂等） */
  function handleClearWechat(row: UserAccountItem) {
    ElMessageBox.confirm(
      `确定清除用户「${row.username}」绑定的微信吗？`,
      "清除微信",
      { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
    )
      .then(async () => {
        try {
          await clearUserWechat(row.id);
          message("已清除", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(bizErrorMessage(error, "清除失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 软删用户（同时禁用） */
  function handleDelete(row: UserAccountItem) {
    ElMessageBox.confirm(
      `确定删除用户「${row.username}」吗？将软删并禁用该账号。`,
      "删除用户",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await deleteUserAccount(row.id);
          message("删除成功", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(bizErrorMessage(error, "删除失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 打开 RBAC 角色绑定抽屉（rbac-roles-drawer.vue 消费 activeUser + visible） */
  function openRbacRolesDrawer(row: UserAccountItem) {
    activeUser.value = row;
    rbacRolesDrawerVisible.value = true;
  }

  /**
   * 查看该用户的全部授权（含 scoped 绑定）：跳「角色绑定」页并按 principalId 精确预筛。
   * 权限管理员「他为什么能/不能做 X」的下钻入口——这里看全部绑定，再在该页用「权限诊断」查具体判定。
   * principalId 是契约支持的精确过滤参数；principalLabel 仅供目标页展示"正在查看谁"。
   */
  function goUserAuthz(row: UserAccountItem) {
    router.push({
      path: "/srvf/org-hr/role-bindings",
      query: {
        principalType: "USER",
        principalId: row.id,
        principalLabel: row.nickname
          ? `${row.nickname}（${row.username}）`
          : row.username
      }
    });
  }

  return {
    canRead,
    canCreate,
    canUpdateAccount,
    canResetPassword,
    canUpdateStatus,
    canUpdateRole,
    canClearPhone,
    canClearWechat,
    canDelete,
    canRbacRoleManage,
    loading,
    columns,
    dataList,
    pagination,
    searchForm,
    rbacRolesDrawerVisible,
    activeUser,
    roleMeta,
    onSearch,
    onFilterChange,
    goUserAuthz,
    openDialog,
    handleResetPassword,
    handleToggleStatus,
    openRoleDialog,
    handleClearPhone,
    handleClearWechat,
    handleDelete,
    handleSizeChange,
    handleCurrentChange,
    openRbacRolesDrawer
  };
}
