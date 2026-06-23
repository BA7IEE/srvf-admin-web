import dayjs from "dayjs";
import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import {
  getRecruitmentApplications,
  getRecruitmentApplication,
  markThreshold,
  evaluateApplication,
  resolveApplication,
  getIdCardImageUrl,
  APP_STATUS_LABEL,
  APP_STATUS_TAG,
  THRESHOLD_CODES,
  type RecruitmentApplication,
  type MarkThresholdBody
} from "@/api/srvf-recruitment";

/** 可标门槛态(后端:仅 verified/pending_evaluation) */
const THRESHOLD_EDITABLE_STATUS = ["verified", "pending_evaluation"];
/** 可综合评定态(后端:仅 pending_evaluation) */
const EVALUATE_STATUS = ["pending_evaluation"];
/** 可人工 resolve 态(后端:manual_review / pending_verification / mismatch 卡死态) */
const RESOLVE_STATUS = ["manual_review", "pending_verification", "mismatch"];

/**
 * @param cycleId 招新轮次 id（来自招新作战室路由参数）。报名按 cycleId 过滤,无页内轮次下拉。
 */
export function useRecruitmentApplications(cycleId: string) {
  const router = useRouter();

  const canRead = hasPerms("recruitment-application.read.record");
  const canMarkThreshold = hasPerms("recruitment-application.mark.threshold");
  const canEvaluate = hasPerms("recruitment-application.evaluate.assessment");
  const canResolve = hasPerms("recruitment-application.resolve.manual");

  const dataList = ref<RecruitmentApplication[]>([]);
  const loading = ref(false);
  /** statusCode 过滤（默认空 = 全部该轮报名） */
  const statusFilter = ref<string>("");
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  /** 详情 drawer（全 PII + 门槛开关）；详情走 getRecruitmentApplication(全显,读记审计) */
  const detailVisible = ref(false);
  const detailLoading = ref(false);
  const detailData = ref<RecruitmentApplication | null>(null);

  const statusOptions = computed(() => [
    { value: "", label: "全部状态" },
    ...Object.keys(APP_STATUS_LABEL).map(code => ({
      value: code,
      label: APP_STATUS_LABEL[code]
    }))
  ]);

  const columns: TableColumnList = [
    {
      label: "临时编号",
      prop: "tempNo",
      minWidth: 130,
      formatter: ({ tempNo }) => tempNo ?? "—"
    },
    {
      label: "姓名",
      prop: "realName",
      minWidth: 120,
      formatter: ({ realName }) => realName ?? "—"
    },
    {
      label: "外籍",
      prop: "isForeigner",
      minWidth: 80,
      formatter: ({ isForeigner }) => (isForeigner ? "是" : "否")
    },
    { label: "状态", prop: "statusCode", minWidth: 120, slot: "statusCode" },
    {
      label: "门槛",
      prop: "thresholdsComplete",
      minWidth: 90,
      formatter: ({ thresholdMarks, thresholdsComplete }) => {
        const done = thresholdMarks
          ? Object.values(thresholdMarks).filter(Boolean).length
          : 0;
        return thresholdsComplete
          ? "已齐"
          : `${done}/${THRESHOLD_CODES.length}`;
      }
    },
    {
      label: "报名时间",
      prop: "createdAt",
      minWidth: 165,
      formatter: ({ createdAt }) =>
        createdAt ? dayjs(createdAt).format("YYYY-MM-DD HH:mm") : "—"
    },
    { label: "操作", fixed: "right" as const, width: 320, slot: "operation" }
  ];

  function statusMeta(code: string) {
    return {
      text: APP_STATUS_LABEL[code] ?? code,
      type: APP_STATUS_TAG[code] ?? ("info" as const)
    };
  }

  /** 行主语:姓名 → 临时编号 → id（列表姓名为掩码,够用于确认文案） */
  function rowSubject(row: RecruitmentApplication) {
    return row.realName ?? row.tempNo ?? row.id;
  }

  /** 行内动作可见性（状态门 + RBAC 码；状态机最终由后端裁决,非法转弹其 message） */
  function canDoThreshold(row: RecruitmentApplication) {
    return (
      canMarkThreshold && THRESHOLD_EDITABLE_STATUS.includes(row.statusCode)
    );
  }
  function canDoEvaluate(row: RecruitmentApplication) {
    return canEvaluate && EVALUATE_STATUS.includes(row.statusCode);
  }
  function canDoResolve(row: RecruitmentApplication) {
    return canResolve && RESOLVE_STATUS.includes(row.statusCode);
  }

  async function onSearch() {
    if (!canRead || !cycleId) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getRecruitmentApplications({
        cycleId,
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        ...(statusFilter.value ? { statusCode: statusFilter.value } : {})
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载报名列表失败", {
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

  /** 查看详情（drawer 内全 PII + 门槛开关）；走详情端点拿全显字段（读 PII 后端记审计） */
  async function openDetail(row: RecruitmentApplication) {
    detailVisible.value = true;
    detailLoading.value = true;
    detailData.value = null;
    try {
      const { code, data } = await getRecruitmentApplication(row.id);
      if (code === 0) detailData.value = data;
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载报名详情失败", {
        type: "error"
      });
    } finally {
      detailLoading.value = false;
    }
  }

  /** 标/清门槛（操作当前 drawer 内报名；成功后重拉详情 + 刷新列表,反映自动推进） */
  async function handleMarkThreshold(
    code: MarkThresholdBody["thresholdCode"],
    completed: boolean
  ) {
    const app = detailData.value;
    if (!app) return;
    try {
      const res = await markThreshold(app.id, {
        thresholdCode: code,
        completed
      });
      if (res.code === 0) {
        detailData.value = res.data;
        message(completed ? "已标记完成" : "已清除", { type: "success" });
        onSearch();
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "门槛标记失败", {
        type: "error"
      });
    }
  }

  /** 综合评定（pending_evaluation；通过→公示 / 淘汰→未通过；note 淘汰必填） */
  function handleEvaluate(row: RecruitmentApplication, approved: boolean) {
    const title = approved ? "评定通过" : "评定淘汰";
    ElMessageBox.prompt(
      approved
        ? `确定评定通过「${rowSubject(row)}」吗？通过后进入公示。可填写评定备注（可空）。`
        : `确定淘汰「${rowSubject(row)}」吗？请填写淘汰理由（必填）。`,
      title,
      {
        confirmButtonText: `确定${title}`,
        cancelButtonText: "返回",
        type: approved ? "info" : "warning",
        inputType: "textarea",
        inputPlaceholder: approved
          ? "评定备注（可空；≤ 500）"
          : "淘汰理由（必填；≤ 500）",
        inputValidator: (val: string) => {
          if (!approved && (!val || !val.trim())) return "淘汰理由为必填项";
          if (val && val.length > 500) return "不能超过 500 字";
          return true;
        }
      }
    )
      .then(async ({ value }) => {
        try {
          await evaluateApplication(row.id, {
            approved,
            ...(value ? { note: value } : {})
          });
          message(approved ? "已评定通过" : "已淘汰", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? `${title}失败`, {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 人工 resolve（卡死态；approved→verified 发临时编号〔受容量限〕/ 驳回→未通过） */
  function handleResolve(row: RecruitmentApplication, approved: boolean) {
    const title = approved ? "通过(发临时编号)" : "驳回";
    ElMessageBox.prompt(
      approved
        ? `确定人工通过「${rowSubject(row)}」并发临时编号吗？受轮次容量限。可填写备注（可空）。`
        : `确定驳回「${rowSubject(row)}」吗？请填写理由（必填）。`,
      `人工${title}`,
      {
        confirmButtonText: "确定",
        cancelButtonText: "返回",
        type: approved ? "info" : "warning",
        inputType: "textarea",
        inputPlaceholder: approved
          ? "备注（可空；≤ 500）"
          : "驳回理由（必填；≤ 500）",
        inputValidator: (val: string) => {
          if (!approved && (!val || !val.trim())) return "驳回理由为必填项";
          if (val && val.length > 500) return "不能超过 500 字";
          return true;
        }
      }
    )
      .then(async ({ value }) => {
        try {
          await resolveApplication(row.id, {
            approved,
            ...(value ? { reviewNote: value } : {})
          });
          message("处理成功", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? "处理失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 取证件照短 TTL signed-URL,新标签打开（L3;读图后端记审计） */
  async function openIdCardImage(row: RecruitmentApplication) {
    try {
      const { code, data } = await getIdCardImageUrl(row.id);
      if (code === 0 && data?.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "取证件照失败", {
        type: "error"
      });
    }
  }

  /** 已发号者 → 跳队员作战室查看建好的 Member */
  function goMember(row: RecruitmentApplication) {
    if (row.promotedMemberId) {
      router.push(`/srvf/members-domain/members/${row.promotedMemberId}`);
    }
  }

  return {
    canRead,
    canMarkThreshold,
    canEvaluate,
    canResolve,
    loading,
    statusFilter,
    statusOptions,
    columns,
    dataList,
    pagination,
    statusMeta,
    detailVisible,
    detailLoading,
    detailData,
    onSearch,
    onFilterChange,
    canDoThreshold,
    canDoEvaluate,
    canDoResolve,
    openDetail,
    handleMarkThreshold,
    handleEvaluate,
    handleResolve,
    openIdCardImage,
    goMember,
    handleSizeChange,
    handleCurrentChange
  };
}
