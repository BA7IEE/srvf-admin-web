import { ref } from "vue";
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import {
  getMembershipConflicts,
  MEMBERSHIP_CONFLICT_TYPE_LABEL,
  type MembershipConflictItem
} from "@/api/srvf-membership";
import { resolveLabels } from "@/api/srvf-meta";

/** 冲突行 = 契约冲突项 + resolveLabels 解析出的展示名（解析不到回落原 id） */
export type ConflictRow = MembershipConflictItem & {
  memberLabel: string | null;
  organizationLabel: string | null;
};

/**
 * 归属数据体检（多主/悬空/停用组织,只读;无分页,全库扫描）。
 * memberId/organizationId 用 `resolveLabels` 批量解析展示名——
 * 悬空类冲突的 id 本就指向缺失对象,解析不到属预期,回落显示原 id。
 */
export function useMembershipConflicts() {
  const router = useRouter();
  const canRead = hasPerms("membership.list.record");
  const dataList = ref<ConflictRow[]>([]);
  const loading = ref(false);
  const total = ref(0);

  const columns: TableColumnList = [
    { label: "冲突类型", prop: "type", minWidth: 220, slot: "type" },
    {
      label: "队员",
      prop: "memberLabel",
      minWidth: 160,
      formatter: ({ memberLabel, memberId }) => memberLabel ?? memberId ?? "—"
    },
    {
      label: "组织",
      prop: "organizationLabel",
      minWidth: 160,
      formatter: ({ organizationLabel, organizationId }) =>
        organizationLabel ?? organizationId ?? "—"
    },
    {
      label: "涉及会籍",
      prop: "membershipIds",
      minWidth: 100,
      formatter: ({ membershipIds }) => `${membershipIds.length} 条`
    },
    { label: "操作", fixed: "right" as const, width: 120, slot: "operation" }
  ];

  function typeLabel(code: string) {
    return MEMBERSHIP_CONFLICT_TYPE_LABEL[code] ?? code;
  }

  async function onSearch() {
    if (!canRead) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getMembershipConflicts();
      if (code !== 0) return;
      total.value = data.total;
      const rows: ConflictRow[] = data.items.map(item => ({
        ...item,
        memberLabel: null,
        organizationLabel: null
      }));
      const memberIds = [
        ...new Set(rows.map(r => r.memberId).filter(Boolean))
      ] as string[];
      const orgIds = [
        ...new Set(rows.map(r => r.organizationId).filter(Boolean))
      ] as string[];
      if (memberIds.length || orgIds.length) {
        try {
          const res = await resolveLabels({
            refs: [
              ...memberIds.map(id => ({ type: "member" as const, id })),
              ...orgIds.map(id => ({ type: "organization" as const, id }))
            ]
          });
          if (res.code === 0) {
            for (const r of rows) {
              if (r.memberId)
                r.memberLabel = res.data.member?.[r.memberId]?.label ?? null;
              if (r.organizationId)
                r.organizationLabel =
                  res.data.organization?.[r.organizationId]?.label ?? null;
            }
          }
        } catch {
          // 解析失败不阻塞体检结果 → 回落显示原 id
        }
      }
      dataList.value = rows;
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载归属体检失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  /** 跳队员档案（有队员上下文的冲突项） */
  function goMember(row: ConflictRow) {
    if (row.memberId)
      router.push(`/srvf/members-domain/members/${row.memberId}`);
  }

  return {
    canRead,
    loading,
    total,
    columns,
    dataList,
    typeLabel,
    onSearch,
    goMember
  };
}
