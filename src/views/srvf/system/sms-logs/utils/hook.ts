import dayjs from "dayjs";
import { ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { getSmsSendLogs, type SmsSendLog } from "@/api/srvf-system-settings";

/** 发送状态 code → tag 展示色(status 文案直接显示原码,枚举未在契约固化,不臆造) */
const STATUS_TAG: Record<
  string,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  SENT: "success",
  SUCCESS: "success",
  FAILED: "danger",
  PENDING: "warning"
};

export function useSmsLogs() {
  const canRead = hasPerms("sms-send-log.read.list");
  const dataList = ref<SmsSendLog[]>([]);
  const loading = ref(false);
  const phone = ref<string>("");
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    { label: "手机号", prop: "phone", minWidth: 140 },
    { label: "模板", prop: "templateKey", minWidth: 160 },
    { label: "通道", prop: "providerType", minWidth: 110 },
    { label: "状态", prop: "status", minWidth: 100, slot: "status" },
    {
      label: "错误",
      prop: "errMsg",
      minWidth: 180,
      formatter: ({ errMsg, errCode }) => errMsg ?? errCode ?? "—"
    },
    {
      label: "时间",
      prop: "createdAt",
      minWidth: 170,
      formatter: ({ createdAt }) =>
        createdAt ? dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss") : "—"
    }
  ];

  function statusTag(code: string) {
    return STATUS_TAG[code] ?? ("info" as const);
  }

  async function onSearch() {
    if (!canRead) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getSmsSendLogs({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        ...(phone.value ? { phone: phone.value } : {})
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载短信日志失败", {
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

  return {
    canRead,
    loading,
    phone,
    columns,
    dataList,
    pagination,
    statusTag,
    onSearch,
    onFilterChange,
    handleSizeChange,
    handleCurrentChange
  };
}
