import dayjs from "dayjs";
import { ref } from "vue";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import {
  getMemberMemberships,
  MEMBERSHIP_TYPE_LABEL,
  MEMBERSHIP_STATUS_LABEL,
  MEMBERSHIP_STATUS_TAG,
  type MembershipItem
} from "@/api/srvf-membership";
import { resolveLabels } from "@/api/srvf-meta";

/**
 * 队员 360「组织归属」tab（memberships 多归属,只读）。
 * 队员轴端点返回数组、不展开组织 → 组织名用 `resolveLabels` 批量解析
 * （无权限/软删的 id 会被后端静默省略 → 回落显示原 id）。
 * @param externalMemberId 队员 id（必传,来自队员档案路由参数）。
 */
export function useMemberMemberships(externalMemberId: string) {
  const canRead = hasPerms("membership.list.record");
  const dataList = ref<MembershipItem[]>([]);
  const loading = ref(false);
  /** organizationId → 组织名（resolveLabels 解析结果缓存） */
  const orgLabels = ref<Record<string, string>>({});

  const columns: TableColumnList = [
    {
      label: "组织",
      prop: "organizationId",
      minWidth: 180,
      slot: "organization"
    },
    {
      label: "类型",
      prop: "membershipType",
      minWidth: 90,
      slot: "membershipType"
    },
    { label: "状态", prop: "status", minWidth: 90, slot: "status" },
    {
      label: "起始",
      prop: "startedAt",
      minWidth: 110,
      formatter: ({ startedAt }) =>
        startedAt ? dayjs(startedAt).format("YYYY-MM-DD") : "—"
    },
    {
      label: "结束",
      prop: "endedAt",
      minWidth: 110,
      formatter: ({ endedAt }) =>
        endedAt ? dayjs(endedAt).format("YYYY-MM-DD") : "—"
    },
    {
      label: "原因",
      prop: "reason",
      minWidth: 160,
      formatter: ({ reason }) => reason ?? "—"
    }
  ];

  function orgLabel(organizationId: string) {
    return orgLabels.value[organizationId] ?? organizationId;
  }
  function typeLabel(code: string) {
    return MEMBERSHIP_TYPE_LABEL[code] ?? code;
  }
  function statusMeta(code: string) {
    return {
      text: MEMBERSHIP_STATUS_LABEL[code] ?? code,
      type: MEMBERSHIP_STATUS_TAG[code] ?? ("info" as const)
    };
  }

  async function onSearch() {
    if (!canRead || !externalMemberId) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getMemberMemberships(externalMemberId);
      if (code === 0) {
        dataList.value = data;
        const orgIds = [...new Set(data.map(m => m.organizationId))];
        if (orgIds.length) {
          try {
            const res = await resolveLabels({
              refs: orgIds.map(id => ({ type: "organization" as const, id }))
            });
            if (res.code === 0) {
              const map: Record<string, string> = {};
              for (const id of orgIds) {
                const hit = res.data.organization?.[id];
                if (hit) map[id] = hit.label;
              }
              orgLabels.value = map;
            }
          } catch {
            // 解析失败不阻塞列表 → 回落显示原 id
          }
        }
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载组织归属失败", {
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
    orgLabel,
    typeLabel,
    statusMeta,
    onSearch
  };
}
