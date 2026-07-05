import { ref } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import {
  getCycleStats,
  getPromotePrecheck,
  promoteRecruitmentCycle,
  batchMarkThreshold,
  exportApplications,
  PROMOTE_SKIP_REASON_LABEL,
  THRESHOLD_CODES,
  THRESHOLD_LABEL,
  EXPORT_FILTER_LABEL,
  type RecruitmentCycleStats,
  type PromotePrecheckResult,
  type BatchMarkThresholdMatch,
  type BatchMarkThresholdResult,
  type ExportApplicationsFilter
} from "@/api/srvf-recruitment";

/** 从 axios blob 错误响应里取出后端真实 message（responseType:'blob' 时错误体也被序列化成 Blob）。 */
async function blobErrorMessage(error: any, fallback: string) {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);
      return parsed?.message ?? fallback;
    } catch {
      return fallback;
    }
  }
  return data?.message ?? fallback;
}

/**
 * 招新工作台补件：stats 聚合卡片 + 一键发号预检 + 批量标门槛 + 导出。
 * 与 applications/utils/hook.ts（单条报名 CRUD）职责分开——本 hook 承载
 * 跨条目/工作台级操作，供招新作战室 cockpit.vue 引入。
 * @param cycleId 招新轮次 id（来自路由参数）。
 */
export function useRecruitmentTools(cycleId: string) {
  const canReadStats = hasPerms("recruitment-application.read.record");
  const canPromote = hasPerms("recruitment-application.promote.member");
  const canMarkThreshold = hasPerms("recruitment-application.mark.threshold");
  const canExport = hasPerms("recruitment-application.read.record");

  /* -------------------- 工作台 stats -------------------- */
  const stats = ref<RecruitmentCycleStats | null>(null);
  const statsLoading = ref(false);

  async function loadStats() {
    if (!canReadStats || !cycleId) return;
    statsLoading.value = true;
    try {
      const { code, data } = await getCycleStats(cycleId);
      if (code === 0) stats.value = data;
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载工作台数据失败", {
        type: "error"
      });
    } finally {
      statsLoading.value = false;
    }
  }

  function thresholdItemLabel(code: string) {
    return THRESHOLD_LABEL[code] ?? code;
  }

  /* -------------------- 一键发号预检 -------------------- */
  const precheckVisible = ref(false);
  const precheckLoading = ref(false);
  const precheckData = ref<PromotePrecheckResult | null>(null);

  async function openPrecheck() {
    if (!canPromote) return;
    precheckVisible.value = true;
    precheckLoading.value = true;
    precheckData.value = null;
    try {
      const { code, data } = await getPromotePrecheck(cycleId);
      if (code === 0) precheckData.value = data;
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载发号预检失败", {
        type: "error"
      });
    } finally {
      precheckLoading.value = false;
    }
  }

  function skipReasonLabel(code: string | null) {
    if (!code) return "—";
    return PROMOTE_SKIP_REASON_LABEL[code] ?? code;
  }

  /** 预检确认后才真正发号（复用既有 promoteRecruitmentCycle；由外部传回调刷新轮次/报名列表）。 */
  async function confirmPromote(onDone: () => void) {
    if (!precheckData.value) return;
    try {
      const { code, data } = await promoteRecruitmentCycle(cycleId);
      if (code === 0) {
        precheckVisible.value = false;
        ElMessageBox.alert(
          `已发号 ${data.promotedCount} 人；跳过 ${data.skippedCount} 人（外籍/需手动建档）。`,
          "发号结果",
          { confirmButtonText: "知道了", type: "success" }
        );
        onDone();
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "一键发号失败", {
        type: "error"
      });
    }
  }

  /* -------------------- 批量标门槛 -------------------- */
  const batchMarkVisible = ref(false);
  const batchMarkSubmitting = ref(false);
  const batchMarkResult = ref<BatchMarkThresholdResult | null>(null);
  const batchMarkThresholdCode = ref<(typeof THRESHOLD_CODES)[number]>(
    THRESHOLD_CODES[0]
  );
  const batchMarkCompleted = ref(true);
  /** 每行一条，逗号分隔"手机,姓名"或纯"临时编号"；前端解析,不引入 xlsx 依赖(§4.2 红线)。 */
  const batchMarkRawText = ref("");

  function openBatchMark() {
    if (!canMarkThreshold) return;
    batchMarkVisible.value = true;
    batchMarkResult.value = null;
    batchMarkRawText.value = "";
    batchMarkThresholdCode.value = THRESHOLD_CODES[0];
    batchMarkCompleted.value = true;
  }

  /** 解析文本域：一行一条，"T2601001" 或 "13800001111,张三"（逗号/顿号/空白均可分隔）。 */
  function parseMatches(): BatchMarkThresholdMatch[] {
    return batchMarkRawText.value
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line
          .split(/[,，、\s]+/)
          .map(p => p.trim())
          .filter(Boolean);
        if (parts.length >= 2) {
          return { phone: parts[0], realName: parts[1] };
        }
        return { tempNo: parts[0] };
      });
  }

  async function submitBatchMark() {
    const matches = parseMatches();
    if (!matches.length) {
      message("请至少输入一行匹配数据", { type: "warning" });
      return;
    }
    batchMarkSubmitting.value = true;
    try {
      const { code, data } = await batchMarkThreshold({
        cycleId,
        thresholdCode: batchMarkThresholdCode.value,
        completed: batchMarkCompleted.value,
        matches
      });
      if (code === 0) {
        batchMarkResult.value = data;
        message(
          `已标记 ${data.marked} / 共 ${data.total} 条（不匹配 ${data.unmatched}，失败 ${data.failed}）`,
          { type: data.failed || data.unmatched ? "warning" : "success" }
        );
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "批量标门槛失败", {
        type: "error"
      });
    } finally {
      batchMarkSubmitting.value = false;
    }
  }

  /* -------------------- 导出 -------------------- */
  const exportLoading = ref(false);
  const exportFilterOptions = Object.entries(EXPORT_FILTER_LABEL).map(
    ([value, label]) => ({ value: value as ExportApplicationsFilter, label })
  );

  async function handleExport(filter: ExportApplicationsFilter) {
    if (!canExport) return;
    exportLoading.value = true;
    try {
      const blob = await exportApplications({ cycleId, filter });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recruitment-applications-${cycleId}-${filter}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      message("导出成功", { type: "success" });
    } catch (error: any) {
      message(await blobErrorMessage(error, "导出失败"), { type: "error" });
    } finally {
      exportLoading.value = false;
    }
  }

  return {
    canReadStats,
    canPromote,
    canMarkThreshold,
    canExport,
    stats,
    statsLoading,
    loadStats,
    thresholdItemLabel,
    precheckVisible,
    precheckLoading,
    precheckData,
    openPrecheck,
    skipReasonLabel,
    confirmPromote,
    batchMarkVisible,
    batchMarkSubmitting,
    batchMarkResult,
    batchMarkThresholdCode,
    batchMarkCompleted,
    batchMarkRawText,
    THRESHOLD_CODES,
    THRESHOLD_LABEL,
    openBatchMark,
    submitBatchMark,
    exportLoading,
    exportFilterOptions,
    handleExport
  };
}
