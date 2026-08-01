import dayjs from "dayjs";
import { ref, computed } from "vue";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { bizErrorMessage } from "@/api/srvf-error";
import {
  getActivityFeedbackSummary,
  getActivityFeedbacks,
  type ActivityFeedbackSummary,
  type ActivityFeedbackItem
} from "@/api/srvf-activity-participation";

/**
 * 活动评价（作战室「评价」tab 用）。
 *
 * 纯只读——管理端不提供改 / 删评价的入口，评价是队员在小程序里写的。
 *
 * @param externalActivityId 活动 id（必传，来自作战室路由参数）。
 */
export function useActivityFeedbacks(externalActivityId: string) {
  /** 评价读权限挂在考勤读码下，后端没有独立的评价读码 */
  const canRead = hasPerms("attendance.read.sheet");

  const activityId = ref<string>(externalActivityId);
  const loading = ref(false);
  const summaryLoading = ref(false);
  const summary = ref<ActivityFeedbackSummary | null>(null);
  const dataList = ref<ActivityFeedbackItem[]>([]);
  const pagination = ref({ total: 0, pageSize: 10, currentPage: 1 });

  /**
   * 五星分布条的渲染数据：倒序（5 星在上，符合看评价的习惯），
   * 并算出每桶占比。后端固定返五桶（含零桶），故不必自己补齐缺档。
   */
  const ratingBars = computed(() => {
    const dist = summary.value?.ratingDistribution ?? [];
    const total = summary.value?.count ?? 0;
    return [...dist]
      .sort((a, b) => b.rating - a.rating)
      .map(b => ({
        rating: b.rating,
        count: b.count,
        percent: total > 0 ? Math.round((b.count / total) * 100) : 0
      }));
  });

  /** 评价率显示成百分比；后端给的是 0~1 四位小数 */
  const feedbackRatePercent = computed(() =>
    summary.value ? Math.round(summary.value.feedbackRate * 100) : 0
  );

  const columns: TableColumnList = [
    {
      label: "队员",
      prop: "displayName",
      minWidth: 160,
      formatter: ({ displayName, memberNo }) => `${displayName}（${memberNo}）`
    },
    { label: "星级", prop: "rating", minWidth: 140, slot: "rating" },
    {
      label: "评语",
      prop: "comment",
      minWidth: 260,
      formatter: ({ comment }) => comment || "—"
    },
    {
      label: "评价时间",
      prop: "createdAt",
      minWidth: 160,
      formatter: ({ createdAt }) =>
        createdAt ? dayjs(createdAt).format("YYYY-MM-DD HH:mm") : "—"
    }
  ];

  async function fetchSummary() {
    if (!canRead || !activityId.value) return;
    summaryLoading.value = true;
    try {
      const { code, data } = await getActivityFeedbackSummary(activityId.value);
      if (code === 0) summary.value = data;
    } catch (error: any) {
      message(bizErrorMessage(error, "加载评价汇总失败"), { type: "error" });
    } finally {
      summaryLoading.value = false;
    }
  }

  async function onSearch() {
    if (!canRead || !activityId.value) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getActivityFeedbacks(activityId.value, {
        page: pagination.value.currentPage,
        pageSize: pagination.value.pageSize
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.value.total = data.total;
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "加载评价列表失败"), { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  /** 汇总与列表一起刷（两个端点各自独立，任一失败不影响另一个） */
  async function refresh() {
    await Promise.allSettled([fetchSummary(), onSearch()]);
  }

  function handleSizeChange(val: number) {
    pagination.value.pageSize = val;
    pagination.value.currentPage = 1;
    onSearch();
  }
  function handleCurrentChange(val: number) {
    pagination.value.currentPage = val;
    onSearch();
  }

  return {
    canRead,
    loading,
    summaryLoading,
    summary,
    ratingBars,
    feedbackRatePercent,
    columns,
    dataList,
    pagination,
    refresh,
    onSearch,
    handleSizeChange,
    handleCurrentChange
  };
}
