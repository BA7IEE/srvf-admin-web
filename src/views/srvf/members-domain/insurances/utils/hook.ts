import dayjs from "dayjs";
import { h, ref, computed } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import {
  getMemberInsuranceOverview,
  reviewMemberInsurance,
  memberInsuranceBizErrorMessage,
  INSURANCE_REVIEW_STATUS_LABEL,
  INSURANCE_REVIEW_STATUS_TAG,
  INSURANCE_DATE_STATUS_LABEL,
  INSURANCE_DATE_STATUS_TAG,
  type MemberInsuranceOverview,
  type MemberInsuranceOverviewSelfItem,
  type MemberInsuranceOverviewTeamItem,
  type InsuranceDateStatus
} from "@/api/srvf-member-insurance";

/**
 * 队员保险（队员 360「保险」tab）。
 *
 * 主数据源是**统一保险概览**：上半「个人自购」可审核，下半「队内统一覆盖」只读。
 * 旧的自购列表端点仍保留在 api 层供兼容，但不再作为本 tab 的数据源。
 *
 * @param externalMemberId 保险隶属队员 id（必传，来自队员作战室路由参数）。
 *   作战室是唯一消费方（不开独立保险菜单页 / 不放队员下拉），故固定该队员、无页内下拉。
 */
export function useMemberInsurances(externalMemberId: string) {
  const canRead = hasPerms("member-insurance.read.other");
  /** 审核码与读码分开：能看不等于能审 */
  const canReview = hasPerms("member-insurance.review.record");

  const loading = ref(false);
  const overview = ref<MemberInsuranceOverview | null>(null);
  /** 保险隶属队员 id：由作战室经路由参数注入并固定 */
  const memberId = ref<string>(externalMemberId);
  /** 正在审核的那一行（按钮 loading 用） */
  const reviewingId = ref("");

  const selfPurchased = computed<MemberInsuranceOverviewSelfItem[]>(
    () => overview.value?.selfPurchased ?? []
  );
  const teamProvided = computed<MemberInsuranceOverviewTeamItem[]>(
    () => overview.value?.teamProvided ?? []
  );
  const summary = computed(() => overview.value?.summary ?? null);
  /** 概览的口径日（北京日）——徽标要写清是「按哪天算的」 */
  const asOfDate = computed(() =>
    overview.value?.asOfDate
      ? dayjs(overview.value.asOfDate).format("YYYY-MM-DD")
      : ""
  );

  /** 日期状态展示元数据：**直接用后端派生的 dateStatus**，前端不拿到期日自算。 */
  function dateStatusMeta(code: InsuranceDateStatus) {
    return {
      text: INSURANCE_DATE_STATUS_LABEL[code] ?? code,
      type: INSURANCE_DATE_STATUS_TAG[code] ?? ("info" as const)
    };
  }

  /** 审核状态展示元数据（契约三态闭集）。 */
  function reviewStatusMeta(code: string) {
    return {
      text: INSURANCE_REVIEW_STATUS_LABEL[code] ?? code,
      type: INSURANCE_REVIEW_STATUS_TAG[code] ?? ("info" as const)
    };
  }

  /** 只有待核验的行才给审核按钮——其余状态后端也只会返 26012 */
  function canReviewRow(row: MemberInsuranceOverviewSelfItem) {
    return canReview && row.reviewStatusCode === "pending";
  }

  const selfColumns: TableColumnList = [
    { label: "保险公司", prop: "insurerName", minWidth: 160 },
    { label: "保单号", prop: "policyNumber", minWidth: 150 },
    {
      label: "起保日期",
      prop: "coverageStart",
      minWidth: 120,
      formatter: ({ coverageStart }) =>
        coverageStart ? dayjs(coverageStart).format("YYYY-MM-DD") : "—"
    },
    {
      label: "到期日期",
      prop: "coverageEnd",
      minWidth: 120,
      formatter: ({ coverageEnd }) =>
        coverageEnd ? dayjs(coverageEnd).format("YYYY-MM-DD") : "—"
    },
    {
      label: "日期状态",
      prop: "dateStatus",
      minWidth: 110,
      slot: "dateStatus"
    },
    {
      label: "审核状态",
      prop: "reviewStatusCode",
      minWidth: 110,
      slot: "reviewStatus"
    },
    ...(canReview
      ? [
          {
            label: "操作",
            fixed: "right" as const,
            width: 170,
            slot: "operation"
          }
        ]
      : [])
  ];

  const teamColumns: TableColumnList = [
    { label: "承保公司", prop: "insurerName", minWidth: 180 },
    {
      label: "起保日期",
      prop: "coverageStart",
      minWidth: 120,
      formatter: ({ coverageStart }) =>
        coverageStart ? dayjs(coverageStart).format("YYYY-MM-DD") : "—"
    },
    {
      label: "到期日期",
      prop: "coverageEnd",
      minWidth: 120,
      formatter: ({ coverageEnd }) =>
        coverageEnd ? dayjs(coverageEnd).format("YYYY-MM-DD") : "—"
    },
    {
      label: "日期状态",
      prop: "dateStatus",
      minWidth: 110,
      slot: "dateStatus"
    },
    {
      label: "加入名单时间",
      prop: "coverageAddedAt",
      minWidth: 160,
      formatter: ({ coverageAddedAt }) =>
        coverageAddedAt
          ? dayjs(coverageAddedAt).format("YYYY-MM-DD HH:mm")
          : "—"
    }
  ];

  async function onSearch() {
    if (!canRead || !memberId.value) {
      overview.value = null;
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getMemberInsuranceOverview(memberId.value);
      if (code === 0) overview.value = data;
    } catch (error: any) {
      message(memberInsuranceBizErrorMessage(error, "加载保险概览失败"), {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  /**
   * 审核一条自购保险。
   *
   * body 恒 `{decision, expectedVersion}`——**契约里没有审核备注字段**，
   * 所以不要做备注输入框骗用户填了会存。
   *
   * `expectedVersion` 传本地这一行读到的 `version`；别人先改过就会 26011，
   * 此时刷新整块概览让操作者看最新状态再决定，绝不静默重试覆盖。
   */
  async function handleReview(
    row: MemberInsuranceOverviewSelfItem,
    decision: "verified" | "rejected"
  ) {
    if (!canReviewRow(row) || !memberId.value) return;
    const actionText = decision === "verified" ? "核验通过" : "驳回";
    try {
      await ElMessageBox.confirm(
        h("div", { class: "leading-6" }, [
          h(
            "p",
            `确定${actionText}「${row.insurerName} · ${row.policyNumber}」这条保险吗？`
          ),
          h(
            "p",
            { class: "mt-2 text-xs" },
            decision === "verified"
              ? "核验通过后，这条保险会计入该队员「已确认的保险来源」。"
              : "驳回后这条保险不计入已确认来源；队员可以在小程序里修改后重新提交。"
          ),
          h(
            "p",
            { class: "mt-1 text-xs" },
            "系统不提供审核备注——这是接口约定，如需说明请另行沟通。"
          )
        ]),
        `${actionText}保险`,
        {
          confirmButtonText: `确定${actionText}`,
          cancelButtonText: "返回",
          type: decision === "verified" ? "info" : "warning"
        }
      );
    } catch {
      return;
    }

    reviewingId.value = row.id;
    try {
      await reviewMemberInsurance(memberId.value, row.id, {
        decision,
        expectedVersion: row.version
      });
      message(`已${actionText}`, { type: "success" });
      // 成功后重拉概览：版本号与汇总(已确认来源/最晚到期日)都会变
      await onSearch();
    } catch (error: any) {
      message(memberInsuranceBizErrorMessage(error, `${actionText}失败`), {
        type: "error",
        duration: 6000
      });
      // 26011 版本冲突与 26012 重复审核都要求「看最新状态再决定」,故一律重拉
      await onSearch();
    } finally {
      reviewingId.value = "";
    }
  }

  return {
    canRead,
    canReview,
    loading,
    overview,
    summary,
    asOfDate,
    selfPurchased,
    teamProvided,
    selfColumns,
    teamColumns,
    reviewingId,
    dateStatusMeta,
    reviewStatusMeta,
    canReviewRow,
    handleReview,
    onSearch
  };
}
