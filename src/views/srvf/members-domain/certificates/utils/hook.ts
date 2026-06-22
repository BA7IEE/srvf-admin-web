import dayjs from "dayjs";
import { ref } from "vue";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { getMembers } from "@/api/srvf-member";
import {
  getMemberCertificates,
  type CertificateItem
} from "@/api/srvf-certificate";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

export function useCertificates() {
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染 */
  const canRead = hasPerms("certificate.read.record");
  /** 共享字典标签解析器：证书类型 / 核验状态 code → 中文（cert_type / cert_status 字典） */
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["cert_type", "cert_status"]);
  const dataList = ref<CertificateItem[]>([]);
  const loading = ref(false);
  /** 证书隶属队员：先选队员，再查其证书（后端无平铺端点，列表无分页） */
  const memberId = ref<string>("");
  const memberOptions = ref<Array<{ label: string; value: string }>>([]);
  const memberLoading = ref(false);

  const columns: TableColumnList = [
    {
      label: "证书类型",
      prop: "certTypeCode",
      minWidth: 140,
      formatter: ({ certTypeCode }) => dict.label("cert_type", certTypeCode)
    },
    { label: "发证机构", prop: "issuingOrg", minWidth: 160 },
    {
      label: "状态",
      prop: "certStatusCode",
      minWidth: 110,
      slot: "certStatusCode"
    },
    {
      label: "发证日期",
      prop: "issuedAt",
      minWidth: 130,
      formatter: ({ issuedAt }) =>
        issuedAt ? dayjs(issuedAt).format("YYYY-MM-DD") : "—"
    },
    {
      label: "有效期至",
      prop: "expiredAt",
      minWidth: 130,
      formatter: ({ expiredAt }) =>
        expiredAt ? dayjs(expiredAt).format("YYYY-MM-DD") : "—"
    },
    {
      label: "内部/外部",
      prop: "isInternal",
      minWidth: 100,
      slot: "isInternal"
    }
  ];

  /** 证书状态 code → tag 颜色（仅展示色；状态码来自后端字典，前端不臆造） */
  function certStatusTagType(
    code: string
  ): "success" | "warning" | "danger" | "info" {
    const map: Record<string, "success" | "warning" | "danger" | "info"> = {
      verified: "success",
      pending: "warning",
      rejected: "danger",
      expired: "info"
    };
    return map[code] ?? "info";
  }

  /** 队员下拉（数据源同队员页 getMembers；首页 50 条 + 前端 filterable 检索） */
  async function loadMembers() {
    if (!canRead) return;
    memberLoading.value = true;
    try {
      const { code, data } = await getMembers({ page: 1, pageSize: 50 });
      if (code === 0) {
        memberOptions.value = data.items.map(m => ({
          label: `${m.displayName}（${m.memberNo}）`,
          value: m.id
        }));
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载队员失败", {
        type: "error"
      });
    } finally {
      memberLoading.value = false;
    }
  }

  async function onSearch() {
    if (!canRead || !memberId.value) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getMemberCertificates(memberId.value);
      if (code === 0) dataList.value = data;
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载证书失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  return {
    canRead,
    loading,
    columns,
    dataList,
    memberId,
    memberOptions,
    memberLoading,
    certStatusTagType,
    dict,
    loadMembers,
    onSearch
  };
}
