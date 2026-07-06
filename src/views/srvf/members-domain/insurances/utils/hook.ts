import { bizErrorMessage } from "@/api/srvf-error";
import dayjs from "dayjs";
import { ref } from "vue";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import {
  getMemberInsurances,
  type MemberInsuranceItem
} from "@/api/srvf-member-insurance";

/**
 * 队员自购保险（**只读**）。
 *
 * @param externalMemberId 保险隶属队员 id（必传，来自队员作战室路由参数）。
 *   作战室是唯一消费方（不开独立保险菜单页 / 不放队员下拉），故固定该队员、无页内下拉。
 *
 * admin 侧契约只有 GET（增删改在小程序本人侧 `app/v1/me/insurances`），故本 hook **无任何写操作**。
 */
export function useMemberInsurances(externalMemberId: string) {
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染 */
  const canRead = hasPerms("member-insurance.read.other");
  const dataList = ref<MemberInsuranceItem[]>([]);
  const loading = ref(false);
  /** 保险隶属队员 id：由作战室经路由参数注入并固定 */
  const memberId = ref<string>(externalMemberId);

  const columns: TableColumnList = [
    { label: "保险公司", prop: "insurerName", minWidth: 180 },
    { label: "保单号", prop: "policyNumber", minWidth: 160 },
    {
      label: "起保日期",
      prop: "coverageStart",
      minWidth: 130,
      formatter: ({ coverageStart }) =>
        coverageStart ? dayjs(coverageStart).format("YYYY-MM-DD") : "—"
    },
    {
      label: "到期日期",
      prop: "coverageEnd",
      minWidth: 130,
      formatter: ({ coverageEnd }) =>
        coverageEnd ? dayjs(coverageEnd).format("YYYY-MM-DD") : "—"
    },
    // 纯展示派生列（无 prop，仅 slot）：有效性，见 isActive 注释。
    { label: "有效性", minWidth: 100, slot: "validity" }
  ];

  /**
   * 有效性展示标签：**纯前端展示色**，依据 = `coverageEnd` 含当日（后端字段描述原文
   * "到期日期(有效性唯一依据;覆盖含当日)"）。覆盖到期日整天 → 有效至该日 23:59:59。
   * 不复刻写校验、不臆造状态枚举（红线 4）。
   */
  function isActive(row: MemberInsuranceItem): boolean {
    return !dayjs(row.coverageEnd).endOf("day").isBefore(dayjs());
  }

  /** 拉某队员保险（无 canRead / 无 memberId → 空表，不请求） */
  async function onSearch() {
    if (!canRead || !memberId.value) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getMemberInsurances(memberId.value);
      if (code === 0) dataList.value = data;
    } catch (error: any) {
      message(bizErrorMessage(error, "加载保险失败"), {
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
    isActive,
    onSearch
  };
}
