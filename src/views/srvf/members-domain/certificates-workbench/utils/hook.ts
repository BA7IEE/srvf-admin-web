import { ref, computed, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { useSrvfList } from "@/srvf-kit";
import { bizErrorMessage } from "@/api/srvf-error";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import { getOrgOptions, type OrgOptionItem } from "@/api/srvf-organization";
import {
  getCertificateWorkbench,
  getCertificateWorkbenchStats,
  verifyMemberCertificate,
  rejectMemberCertificate,
  getCertificateStandardOptions,
  CERT_STATUS_TAG,
  type CertificateWorkbenchItem,
  type CertificateWorkbenchQuery,
  type CertificateWorkbenchStats
} from "@/api/srvf-certificate";

/** 来源 code → 人话（后端两值闭集 ADMIN / RECRUITMENT） */
const SOURCE_LABEL: Record<string, string> = {
  ADMIN: "管理端录入",
  RECRUITMENT: "招新发号"
};

/** 六卡定义（顺序即展示顺序；key 对齐后端 stats 字段名，不前端换算） */
export const STATS_CARDS: Array<{
  key: keyof CertificateWorkbenchStats;
  label: string;
  hint: string;
}> = [
  { key: "pending", label: "待核验", hint: "等着人工核验的证书" },
  { key: "verified", label: "已核验有效", hint: "核验通过且未过期" },
  { key: "expired", label: "已过期", hint: "含「已核验但过了到期日」的" },
  { key: "rejected", label: "已驳回", hint: "核验没通过的" },
  {
    key: "expiringWithin60Days",
    label: "60 天内到期",
    hint: "该提醒本人去换证了"
  },
  { key: "permanent", label: "终身有效", hint: "没有到期日的" }
];

export function useCertificateWorkbench() {
  const router = useRouter();

  /* -------------------------------- 权限 -------------------------------- */
  const canRead = hasPerms("certificate.read.record");
  const canVerify = hasPerms("certificate.verify.record");
  const canReject = hasPerms("certificate.reject.record");
  const canReadMember = hasPerms("member.read.record");

  const dict = useSrvfDictStoreHook();

  /* ------------------------------- 筛选表单 ------------------------------- */
  const searchForm = reactive({
    q: "",
    organizationId: "",
    includeDescendants: true,
    standardCode: "",
    categoryCode: "",
    levelCode: "",
    certStatusCode: "" as "" | "pending" | "verified" | "expired" | "rejected",
    sourceCode: "" as "" | "ADMIN" | "RECRUITMENT",
    /** 发证日区间 [from, to] */
    issuedRange: null as [string, string] | null,
    /** 到期日区间 [from, to]；终身有效不匹配任何区间 */
    expiresRange: null as [string, string] | null
  });

  /**
   * 列表与统计共用的筛选参数。两端必须**完全一致**，否则六卡和表格会各说各话
   * （后端也是按同一套非分页过滤各自计算的）。
   */
  function buildFilterParams(): Omit<
    CertificateWorkbenchQuery,
    "page" | "pageSize"
  > {
    const f = searchForm;
    return {
      q: f.q.trim() || undefined,
      // 没选组织时不传 includeDescendants，避免后端把它当独立条件解释
      ...(f.organizationId
        ? {
            organizationId: f.organizationId,
            includeDescendants: f.includeDescendants
          }
        : {}),
      standardCode: f.standardCode || undefined,
      categoryCode: f.categoryCode || undefined,
      levelCode: f.levelCode || undefined,
      certStatusCode: f.certStatusCode || undefined,
      sourceCode: f.sourceCode || undefined,
      issuedFrom: f.issuedRange?.[0] || undefined,
      issuedTo: f.issuedRange?.[1] || undefined,
      expiresFrom: f.expiresRange?.[0] || undefined,
      expiresTo: f.expiresRange?.[1] || undefined
    };
  }

  /* ------------------------------ 筛选下拉数据 ----------------------------- */
  const orgOptions = ref<OrgOptionItem[]>([]);
  const orgSelectOptions = computed(() =>
    orgOptions.value.map(o => ({ label: o.label, value: o.id }))
  );
  const standardOptions = ref<Array<{ label: string; value: string }>>([]);
  const categoryOptions = computed(() => dict.options("cert_type"));
  const levelOptions = computed(() => dict.options("cert_sub_type"));

  /** 筛选下拉拉不到不影响主表，静默降级为「该维度不可筛」 */
  async function loadFilterOptions() {
    try {
      const { code, data } = await getOrgOptions({
        status: "ACTIVE",
        limit: 100
      });
      if (code === 0) orgOptions.value = data.items;
    } catch {
      orgOptions.value = [];
    }
    try {
      // 筛选用途要能选到「已收录待认定」的标准，故不传 recognizedOnly
      const { code, data } = await getCertificateStandardOptions({
        limit: 200
      });
      if (code === 0) {
        standardOptions.value = data.items.map(i => ({
          label: `${i.name}（${i.code}）`,
          value: i.code
        }));
      }
    } catch {
      standardOptions.value = [];
    }
  }

  /* -------------------------------- 列表 -------------------------------- */
  const {
    dataList,
    loading,
    pagination,
    onSearch,
    onFilterChange,
    handleSizeChange,
    handleCurrentChange
  } = useSrvfList<CertificateWorkbenchItem, CertificateWorkbenchQuery>({
    fetch: getCertificateWorkbench,
    buildParams: buildFilterParams,
    errorMessage: "加载证书列表失败",
    canRead
  });

  /* ------------------------------- 六卡统计 ------------------------------- */
  /**
   * `null` = 这块数据拿不到（无权 / 后端不可达），此时**整块卡片不渲染**。
   * 不能退化成显示 6 个 0——「块级权限缺失 ≠ 0」，渲染 0 会被读成「全队一张证都没有」。
   */
  const stats = ref<CertificateWorkbenchStats | null>(null);
  const statsLoading = ref(false);

  async function fetchStats() {
    if (!canRead) return;
    statsLoading.value = true;
    try {
      const { code, data } =
        await getCertificateWorkbenchStats(buildFilterParams());
      stats.value = code === 0 ? data : null;
    } catch {
      // 静默：列表已有自己的报错，这里再弹一次是噪音；卡片整块隐藏即可
      stats.value = null;
    } finally {
      statsLoading.value = false;
    }
  }

  /** 筛选变化：列表回第一页 + 统计同步重算（两者共用同一套筛选参数） */
  function onFilterApply() {
    onFilterChange();
    fetchStats();
  }

  /** 刷新：列表与统计一起重拉（翻页不动统计——统计本来就是非分页的全量口径） */
  function onRefresh() {
    onSearch();
    fetchStats();
  }

  function onReset() {
    searchForm.q = "";
    searchForm.organizationId = "";
    searchForm.includeDescendants = true;
    searchForm.standardCode = "";
    searchForm.categoryCode = "";
    searchForm.levelCode = "";
    searchForm.certStatusCode = "";
    searchForm.sourceCode = "";
    searchForm.issuedRange = null;
    searchForm.expiresRange = null;
    onFilterApply();
  }

  /** 点六卡按状态快筛（终身有效 / 60 天内到期不是状态，不做快筛，只作为读数） */
  function filterByStatus(
    code: "pending" | "verified" | "expired" | "rejected"
  ) {
    searchForm.certStatusCode =
      searchForm.certStatusCode === code
        ? ""
        : (code as typeof searchForm.certStatusCode);
    onFilterApply();
  }

  /* ------------------------------- 展示映射 ------------------------------- */
  /** 状态标签文案取后端 `cert_status` 字典（含 expired = 已失效），前端只定颜色 */
  const certStatusLabels = computed<Record<string, string>>(
    () => dict.byType["cert_status"] ?? {}
  );

  function categoryLabel(code?: string | null) {
    return dict.label("cert_type", code);
  }

  function levelLabel(code?: string | null) {
    return dict.label("cert_sub_type", code);
  }

  function sourceLabel(code?: string | null) {
    if (!code) return "—";
    return SOURCE_LABEL[code] ?? code;
  }

  /** 证书的人话标识（弹窗里指代这一张证用） */
  function certSubject(row: CertificateWorkbenchItem) {
    return `${row.member.displayName} 的「${row.standard.name}」`;
  }

  const columns: TableColumnList = [
    { label: "队员", minWidth: 150, slot: "member" },
    { label: "证书标准", minWidth: 200, slot: "standard" },
    {
      label: "类别 / 等级",
      minWidth: 130,
      formatter: ({ standard }: CertificateWorkbenchItem) =>
        standard.levelCode
          ? `${categoryLabel(standard.categoryCode)} / ${levelLabel(standard.levelCode)}`
          : categoryLabel(standard.categoryCode)
    },
    { label: "状态", minWidth: 100, slot: "status" },
    {
      label: "来源",
      minWidth: 110,
      formatter: ({ sourceCode }: CertificateWorkbenchItem) =>
        sourceLabel(sourceCode)
    },
    {
      label: "发证机构",
      minWidth: 150,
      formatter: ({ issuingOrg }: CertificateWorkbenchItem) => issuingOrg || "—"
    },
    {
      label: "发证日",
      prop: "issuedAt",
      minWidth: 110,
      // 后端返完整 ISO 时刻（日期语义存在 UTC 零点），直出会变成一串时间戳
      formatter: ({ issuedAt }: CertificateWorkbenchItem) =>
        issuedAt ? dayjs(issuedAt).format("YYYY-MM-DD") : "—"
    },
    {
      label: "到期日",
      minWidth: 110,
      formatter: ({ expiredAt }: CertificateWorkbenchItem) =>
        expiredAt ? dayjs(expiredAt).format("YYYY-MM-DD") : "终身有效"
    },
    { label: "操作", fixed: "right" as const, width: 190, slot: "operation" }
  ];

  /* ------------------------------- 行内动作 ------------------------------- */
  /** 跳队员档案的证书 tab（沿轴下钻，不在本页做证书的增删改） */
  function openMemberCertificates(row: CertificateWorkbenchItem) {
    router.push({
      path: `/srvf/members-domain/members/${row.member.id}`,
      query: { tab: "certificates" }
    });
  }

  /** 核验通过（复用队员轴端点；本页只是换了个入口，写侧契约完全一致） */
  function handleVerify(row: CertificateWorkbenchItem) {
    ElMessageBox.prompt(
      `确定核验通过${certSubject(row)}吗？可填写核验备注（可空）。`,
      "核验通过",
      {
        confirmButtonText: "确定通过",
        cancelButtonText: "返回",
        type: "info",
        inputType: "textarea",
        inputPlaceholder: "核验备注（可空；≤ 500）",
        inputValidator: (val: string) =>
          val && val.length > 500 ? "核验备注不能超过 500 字" : true
      }
    )
      .then(async ({ value }) => {
        try {
          await verifyMemberCertificate(
            row.member.id,
            row.id,
            value ? { verifyNote: value } : {}
          );
          // 已过期的证也能核验通过——结果落 expired 而不是 verified，文案要说清楚。
          // 用 dayjs 按「天」比：expiredAt 是完整 ISO 时刻，跟纯日期串直接比大小会踩格式坑。
          message(
            row.expiredAt && dayjs(row.expiredAt).isBefore(dayjs(), "day")
              ? "核验通过，但该证书已过期"
              : "已核验通过",
            { type: "success" }
          );
          onRefresh();
        } catch (error: any) {
          message(bizErrorMessage(error, "核验通过失败"), { type: "error" });
        }
      })
      .catch(() => {});
  }

  /** 核验驳回（驳回原因必填，后端 RejectCertificateDto 要求） */
  function handleReject(row: CertificateWorkbenchItem) {
    ElMessageBox.prompt(
      `确定驳回${certSubject(row)}吗？请填写驳回原因（必填）。`,
      "核验驳回",
      {
        confirmButtonText: "确定驳回",
        cancelButtonText: "返回",
        type: "warning",
        inputType: "textarea",
        inputPlaceholder: "驳回原因（必填；≤ 500）",
        inputValidator: (val: string) => {
          if (!val || !val.trim()) return "驳回原因为必填项";
          if (val.length > 500) return "驳回原因不能超过 500 字";
          return true;
        }
      }
    )
      .then(async ({ value }) => {
        try {
          await rejectMemberCertificate(row.member.id, row.id, {
            verifyNote: value
          });
          message("已驳回", { type: "success" });
          onRefresh();
        } catch (error: any) {
          message(bizErrorMessage(error, "核验驳回失败"), { type: "error" });
        }
      })
      .catch(() => {});
  }

  onMounted(async () => {
    if (!canRead) return;
    dict.ensureTypes(["cert_status", "cert_type", "cert_sub_type"]);
    await loadFilterOptions();
    onSearch();
    fetchStats();
  });

  return {
    // 权限
    canRead,
    canVerify,
    canReject,
    canReadMember,
    // 筛选
    searchForm,
    orgSelectOptions,
    standardOptions,
    categoryOptions,
    levelOptions,
    onFilterApply,
    onReset,
    // 列表
    columns,
    dataList,
    loading,
    pagination,
    onRefresh,
    handleSizeChange,
    handleCurrentChange,
    // 统计
    stats,
    statsLoading,
    filterByStatus,
    // 展示
    certStatusLabels,
    CERT_STATUS_TAG,
    categoryLabel,
    levelLabel,
    sourceLabel,
    // 动作
    openMemberCertificates,
    handleVerify,
    handleReject
  };
}
