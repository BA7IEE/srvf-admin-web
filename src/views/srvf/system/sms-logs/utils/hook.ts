import dayjs from "dayjs";
import { ref } from "vue";
import { hasPerms } from "@/utils/auth";
import { useSrvfList } from "@/srvf-kit";
import {
  getSmsSendLogs,
  SMS_STATUS_TAG,
  SMS_STATUS_LABEL,
  type SmsSendLog,
  type SmsSendLogListQuery
} from "@/api/srvf-system-settings";

export function useSmsLogs() {
  const canRead = hasPerms("sms-send-log.read.list");
  const phone = ref<string>("");

  const {
    dataList,
    loading,
    pagination,
    onSearch,
    onFilterChange,
    handleSizeChange,
    handleCurrentChange
  } = useSrvfList<SmsSendLog, SmsSendLogListQuery>({
    fetch: getSmsSendLogs,
    buildParams: () => ({
      ...(phone.value ? { phone: phone.value } : {})
    }),
    errorMessage: "加载短信日志失败",
    canRead
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
    return SMS_STATUS_TAG[code] ?? ("info" as const);
  }

  function statusLabel(code: string) {
    return SMS_STATUS_LABEL[code] ?? code;
  }

  return {
    canRead,
    loading,
    phone,
    columns,
    dataList,
    pagination,
    statusTag,
    statusLabel,
    onSearch,
    onFilterChange,
    handleSizeChange,
    handleCurrentChange
  };
}
