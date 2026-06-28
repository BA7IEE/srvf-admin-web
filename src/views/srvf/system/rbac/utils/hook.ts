import dayjs from "dayjs";
import { ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { getRoles, reloadRbac, type RoleItem } from "@/api/srvf-role";

export function useRoles() {
  const dataList = ref<RoleItem[]>([]);
  const loading = ref(false);
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染表格 */
  const canRead = hasPerms("rbac.role.read");
  /** 重载缓存权限（改完角色/权限绑定后触发,否则不即时生效） */
  const canReload = hasPerms("rbac.config.reload");

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
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
    }
  ];

  async function onSearch() {
    if (!canRead) return;
    loading.value = true;
    try {
      const { code, data } = await getRoles({
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
      message(error?.response?.data?.message ?? "加载角色列表失败", {
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

  /** 重载 RBAC 缓存(全量;改完绑定后即时生效) */
  function handleReload() {
    ElMessageBox.confirm(
      "确定重载 RBAC 权限缓存吗？改完角色/权限绑定后需重载才即时生效。",
      "重载权限缓存",
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
          message(error?.response?.data?.message ?? "重载失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  return {
    canRead,
    canReload,
    loading,
    columns,
    dataList,
    pagination,
    onSearch,
    handleReload,
    handleSizeChange,
    handleCurrentChange
  };
}
