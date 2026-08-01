import { ref, computed } from "vue";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { bizErrorMessage } from "@/api/srvf-error";
import {
  getActivityParticipationSummary,
  getActivityReconciliation,
  type ActivityParticipationSummary,
  type ActivityReconciliation,
  type ActivityReconciliationParticipant
} from "@/api/srvf-activity-participation";

/**
 * 活动参与核对（作战室「参与核对」tab 用）。
 *
 * 两个端点都标 `[auth]`，但后端要求**同时持**考勤读与报名读两项权限，
 * 缺一即拒——故这里按两码取交集做显隐，而不是只判其中一个。
 *
 * 核对本身**仅 completed 活动**可调用，入口按活动状态显隐（不是调了再看错误）。
 *
 * @param externalActivityId 活动 id（必传，来自作战室路由参数）。
 */
export function useActivityReconciliation(externalActivityId: string) {
  const canRead =
    hasPerms("attendance.read.sheet") &&
    hasPerms("activity-registration.read.record");

  const activityId = ref<string>(externalActivityId);
  /** 活动状态由作战室注入：只有 completed 才拉核对 */
  const activityStatusCode = ref("");
  function setActivityStatus(code?: string) {
    activityStatusCode.value = code ?? "";
  }
  const isCompleted = computed(() => activityStatusCode.value === "completed");

  const loading = ref(false);
  const summary = ref<ActivityParticipationSummary | null>(null);
  const reconciliation = ref<ActivityReconciliation | null>(null);

  /** 到场率显示成百分比；后端给的是 0~1 四位小数 */
  const attendanceRatePercent = computed(() =>
    summary.value ? Math.round(summary.value.attendanceRate * 100) : 0
  );

  /**
   * 名单合并成一张表：报名侧（到场 / 缺席）+ 临时参加。
   * 临时参加是「没报名却有考勤记录」的人——这类人不在报名名单里，
   * 单独摆一张表容易被忽略，合并后用「核对结果」列区分。
   */
  const participants = computed<ActivityReconciliationParticipant[]>(() => {
    const r = reconciliation.value;
    if (!r) return [];
    return [...r.registeredParticipants, ...r.temporaryParticipants];
  });

  /** 核对结果 → 展示元数据（术语用蓝图 §13 表内词） */
  const OUTCOME_META: Record<
    string,
    { text: string; type: "success" | "danger" | "warning" }
  > = {
    attended: { text: "到场", type: "success" },
    "no-show": { text: "未到场", type: "danger" },
    temporary: { text: "临时参加", type: "warning" }
  };
  function outcomeMeta(code: string) {
    return OUTCOME_META[code] ?? { text: code, type: "warning" as const };
  }

  const columns: TableColumnList = [
    {
      label: "队员",
      prop: "displayName",
      minWidth: 170,
      formatter: ({ displayName, memberNo }) => `${displayName}（${memberNo}）`
    },
    { label: "核对结果", prop: "outcome", minWidth: 110, slot: "outcome" },
    {
      // 不论单据处于什么状态,只要有记录就算到过场——与「已终审记录数」分开看
      label: "考勤记录数",
      prop: "recordCount",
      minWidth: 110
    },
    {
      label: "已终审记录数",
      prop: "approvedRecordCount",
      minWidth: 120
    },
    {
      label: "生效时长",
      prop: "totalServiceHours",
      minWidth: 110,
      formatter: ({ totalServiceHours }) =>
        totalServiceHours ? `${totalServiceHours} 小时` : "—"
    }
  ];

  async function onSearch() {
    if (!canRead || !activityId.value) {
      summary.value = null;
      reconciliation.value = null;
      return;
    }
    loading.value = true;
    try {
      // 汇总任何状态都能看；核对只有 completed 能调,非 completed 不发这个请求
      const tasks: Promise<void>[] = [
        getActivityParticipationSummary(activityId.value)
          .then(({ code, data }) => {
            if (code === 0) summary.value = data;
          })
          .catch((error: any) => {
            message(bizErrorMessage(error, "加载参与合计失败"), {
              type: "error"
            });
          })
      ];
      if (isCompleted.value) {
        tasks.push(
          getActivityReconciliation(activityId.value)
            .then(({ code, data }) => {
              if (code === 0) reconciliation.value = data;
            })
            .catch((error: any) => {
              message(bizErrorMessage(error, "加载参与核对失败"), {
                type: "error"
              });
            })
        );
      } else {
        reconciliation.value = null;
      }
      await Promise.allSettled(tasks);
    } finally {
      loading.value = false;
    }
  }

  return {
    canRead,
    isCompleted,
    setActivityStatus,
    loading,
    summary,
    reconciliation,
    participants,
    attendanceRatePercent,
    outcomeMeta,
    columns,
    onSearch
  };
}
