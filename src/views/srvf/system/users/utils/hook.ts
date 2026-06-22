import dayjs from "dayjs";
import { ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { getUserAccounts, type UserAccountItem } from "@/api/srvf-user";

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
    roleMeta,
    onSearch,
    handleSizeChange,
    handleCurrentChange
  };
}
