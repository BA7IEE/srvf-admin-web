import dayjs from "dayjs";
import { ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { getUserAccounts, type UserAccountItem } from "@/api/srvf-user";

export function useUserAccounts() {
  const dataList = ref<UserAccountItem[]>([]);
  const loading = ref(false);
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染表格 */
  const canRead = hasPerms("user.read.account");

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
    }
  ];

  async function onSearch() {
    if (!canRead) return;
    loading.value = true;
    try {
      const { code, data } = await getUserAccounts({
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
      message(error?.response?.data?.message ?? "加载用户列表失败", {
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
    handleCurrentChange
  };
}
