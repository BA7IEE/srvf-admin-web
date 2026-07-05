import { ref } from "vue";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import {
  getMemberSupervisionScope,
  SCOPE_MODE_LABEL,
  type SupervisionScopeEntryItem
} from "@/api/srvf-supervision";
import { resolveLabels } from "@/api/srvf-meta";

/**
 * 队员 360「分管范围」tab（只读；该队员若是分管人,展示其分管的组织范围与
 * TREE 展开后的全部覆盖组织）。新建/撤销走「督导总表」页,本 tab 只陈列。
 */
export function useMemberSupervisionScope(externalMemberId: string) {
  const canRead = hasPerms("supervision-assignment.read.record");
  const dataList = ref<SupervisionScopeEntryItem[]>([]);
  const loading = ref(false);
  const orgLabelById = ref<Record<string, string>>({});

  const columns: TableColumnList = [
    {
      label: "被分管组织",
      prop: "organizationId",
      minWidth: 160,
      formatter: ({ organizationId }) => orgLabel(organizationId)
    },
    { label: "覆盖范围", prop: "scopeMode", minWidth: 110, slot: "scopeMode" },
    {
      label: "展开后覆盖组织数",
      prop: "expandedOrganizationIds",
      minWidth: 130,
      formatter: ({ expandedOrganizationIds }) =>
        `${expandedOrganizationIds.length} 个`
    }
  ];

  function scopeModeLabel(code: string) {
    return SCOPE_MODE_LABEL[code] ?? code;
  }
  function orgLabel(id: string) {
    return orgLabelById.value[id] ?? id;
  }
  function expandedLabels(entry: SupervisionScopeEntryItem) {
    return entry.expandedOrganizationIds.map(id => orgLabel(id)).join("、");
  }

  async function onSearch() {
    if (!canRead || !externalMemberId) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getMemberSupervisionScope(externalMemberId);
      if (code === 0) {
        dataList.value = data;
        const allIds = [
          ...new Set(
            data.flatMap(e => [e.organizationId, ...e.expandedOrganizationIds])
          )
        ];
        if (allIds.length) {
          try {
            const res = await resolveLabels({
              refs: allIds.map(id => ({ type: "organization" as const, id }))
            });
            if (res.code === 0) {
              const map: Record<string, string> = {};
              for (const id of allIds) {
                const hit = res.data.organization?.[id];
                if (hit) map[id] = hit.label;
              }
              orgLabelById.value = map;
            }
          } catch {
            // 解析失败不阻塞列表 → 回落显示原 id
          }
        }
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载分管范围失败", {
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
    scopeModeLabel,
    expandedLabels,
    onSearch
  };
}
