import { ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import { bizErrorMessage } from "@/api/srvf-error";

/** 后端分页信封 PageResultDto 的形状（各 src/api/srvf-*.ts 里重复声明的 PageResult<T>） */
export interface SrvfListPageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 各域 *ListQuery 类型里 page/pageSize 惯例声明为可选（后端不传时有默认值） */
export interface SrvfListFetchParams {
  page?: number;
  pageSize?: number;
}

export interface UseSrvfListOptions<T, P extends SrvfListFetchParams> {
  /** 列表请求函数（page/pageSize 由本组合式注入，调用方只需在 buildParams 里给筛选参数） */
  fetch: (params: P) => Promise<{ code: number; data: SrvfListPageResult<T> }>;
  /** 组装筛选参数（每次 onSearch 都会重新调用，读最新的 searchForm 等响应式值） */
  buildParams: () => Omit<P, "page" | "pageSize">;
  /** 加载失败的兜底提示文案，如「加载队员列表失败」 */
  errorMessage: string;
  /** 读权限门；传 false 时 onSearch 直接 no-op（不发请求，不清空已有数据） */
  canRead?: boolean;
}

/**
 * 收敛「分页 + loading + 筛选变化回第一页 + 分页器换页/换页大小」这套在 ~30 个列表页
 * hook 里逐份重写的样板。columns / 弹窗 / 行内操作等业务逻辑仍留在各页自己的 hook 里，
 * 本组合式只管数据怎么取、页码怎么变。
 */
export function useSrvfList<
  T,
  P extends SrvfListFetchParams = SrvfListFetchParams
>(options: UseSrvfListOptions<T, P>) {
  const dataList = ref<T[]>([]);
  const loading = ref(false);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  async function onSearch() {
    if (options.canRead === false) return;
    loading.value = true;
    try {
      const { code, data } = await options.fetch({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        ...options.buildParams()
      } as P);
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(bizErrorMessage(error, options.errorMessage), { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  /** 筛选条件变化：回到第一页重查（列表页搜索框/下拉的 @change、@keyup.enter 统一接这个） */
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

  return {
    dataList,
    loading,
    pagination,
    onSearch,
    onFilterChange,
    handleSizeChange,
    handleCurrentChange
  };
}
