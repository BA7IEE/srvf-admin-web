import dayjs from "dayjs";
import { ref } from "vue";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { getPositionOptions } from "@/api/srvf-position";
import {
  getMemberPositionAssignments,
  ASSIGNMENT_STATUS_LABEL,
  ASSIGNMENT_STATUS_TAG,
  type PositionAssignmentItem
} from "@/api/srvf-position-assignment";
import { resolveLabels } from "@/api/srvf-meta";

/**
 * 队员 360「任职」tab（队员轴,ACTIVE+ENDED+REVOKED 全量,只读）。
 * 任命/撤销发生在组织轴（组织架构页「在任职务」面板），本 tab 仅陈列历史,不承载写操作
 * （后端 handoff 原文：任职是组织轴+队员轴双轴子资源,命/撤销在组织轴）。
 * @param externalMemberId 队员 id（必传,来自队员档案路由参数）。
 */
export function useMemberPositionAssignments(externalMemberId: string) {
  const canRead = hasPerms("position-assignment.read.record");
  const dataList = ref<PositionAssignmentItem[]>([]);
  const loading = ref(false);
  const positionNameById = ref<Record<string, string>>({});
  const orgLabelById = ref<Record<string, string>>({});

  const columns: TableColumnList = [
    { label: "职务", prop: "positionId", minWidth: 110, slot: "position" },
    {
      label: "组织",
      prop: "organizationId",
      minWidth: 160,
      slot: "organization"
    },
    { label: "状态", prop: "status", minWidth: 90, slot: "status" },
    { label: "兼任", prop: "isConcurrent", minWidth: 70, slot: "isConcurrent" },
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
    }
  ];

  function positionLabel(id: string) {
    return positionNameById.value[id] ?? id;
  }
  function orgLabel(id: string) {
    return orgLabelById.value[id] ?? id;
  }
  function statusMeta(code: string) {
    return {
      text: ASSIGNMENT_STATUS_LABEL[code] ?? code,
      type: ASSIGNMENT_STATUS_TAG[code] ?? ("info" as const)
    };
  }

  async function onSearch() {
    if (!canRead || !externalMemberId) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } =
        await getMemberPositionAssignments(externalMemberId);
      if (code === 0) {
        dataList.value = data;
        try {
          const [posRes, orgIds] = await Promise.all([
            getPositionOptions({ limit: 100 }),
            Promise.resolve([...new Set(data.map(a => a.organizationId))])
          ]);
          if (posRes.code === 0) {
            const map: Record<string, string> = {};
            for (const it of posRes.data.items) map[it.id] = it.label;
            positionNameById.value = map;
          }
          if (orgIds.length) {
            const res = await resolveLabels({
              refs: orgIds.map(id => ({ type: "organization" as const, id }))
            });
            if (res.code === 0) {
              const map: Record<string, string> = {};
              for (const id of orgIds) {
                const hit = res.data.organization?.[id];
                if (hit) map[id] = hit.label;
              }
              orgLabelById.value = map;
            }
          }
        } catch {
          // 名称解析失败不阻塞列表 → 回落显示原 id
        }
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载任职历史失败", {
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
    positionLabel,
    orgLabel,
    statusMeta,
    onSearch
  };
}
