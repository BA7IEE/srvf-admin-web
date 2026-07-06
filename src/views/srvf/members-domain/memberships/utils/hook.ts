import { bizErrorMessage } from "@/api/srvf-error";
import dayjs from "dayjs";
import { h, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import MembershipForm, { type MembershipFormModel } from "../form.vue";
import TransferForm, { type TransferFormModel } from "../transfer-form.vue";
import {
  getMemberMemberships,
  createMemberMembership,
  updateMemberMembership,
  endMemberMembership,
  transferMembership,
  membershipBizErrorMessage,
  MEMBERSHIP_TYPE_LABEL,
  MEMBERSHIP_STATUS_LABEL,
  MEMBERSHIP_STATUS_TAG,
  type MembershipItem
} from "@/api/srvf-membership";
import { getOrgOptions, type OrgOptionItem } from "@/api/srvf-organization";
import { resolveLabels } from "@/api/srvf-meta";

/**
 * 队员 360「组织归属」tab（memberships 多归属,只读）。
 * 队员轴端点返回数组、不展开组织 → 组织名用 `resolveLabels` 批量解析
 * （无权限/软删的 id 会被后端静默省略 → 回落显示原 id）。
 * @param externalMemberId 队员 id（必传,来自队员档案路由参数）。
 */
export function useMemberMemberships(externalMemberId: string) {
  const canRead = hasPerms("membership.list.record");
  /** 新增/编辑：create 走 POST members/{id}/memberships，edit 走 PATCH .../{id}（同一 rbac 码） */
  const canSet = hasPerms("membership.set.record");
  /** 结束归属：DELETE .../{id}（status→ENDED，非物删） */
  const canEnd = hasPerms("membership.end.record");
  /** 迁移：POST memberships/transfer（单事务：结束源+新建目标） */
  const canTransfer = hasPerms("membership.transfer.record");
  const hasAnyAction = canSet || canEnd || canTransfer;

  const dataList = ref<MembershipItem[]>([]);
  const loading = ref(false);
  const formRef = ref();
  const transferFormRef = ref();
  /** organizationId → 组织名（resolveLabels 解析结果缓存） */
  const orgLabels = ref<Record<string, string>>({});
  /** 组织下拉（getOrgOptions 投影；首次打开新增/迁移弹窗时懒加载,之后复用缓存） */
  const orgOptionsCache = ref<OrgOptionItem[]>([]);

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
    },
    ...(hasAnyAction
      ? [
          {
            label: "操作",
            fixed: "right" as const,
            width: 220,
            slot: "operation"
          }
        ]
      : [])
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
      message(bizErrorMessage(error, "加载组织归属失败"), {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  /** 懒加载组织下拉（首次打开新增/迁移弹窗时拉一次,同一队员详情页内复用缓存） */
  async function ensureOrgOptions() {
    if (orgOptionsCache.value.length) return;
    try {
      const { code, data } = await getOrgOptions({ limit: 100 });
      if (code === 0) orgOptionsCache.value = data.items;
    } catch {
      // 拉取失败时新增/迁移弹窗的下拉会是空列表,不阻塞弹窗本身打开
    }
  }
  function orgOptionsFor(excludeId?: string) {
    return orgOptionsCache.value
      .filter(o => o.id !== excludeId)
      .map(o => ({
        label: `${o.label}${o.code ? `（${o.code}）` : ""}`,
        value: o.id
      }));
  }

  /** 新增 / 编辑归属（create：组织+类型+原因；edit：仅类型/任期/原因，组织只读展示） */
  async function openDialog(title: "新增" | "编辑", row?: MembershipItem) {
    if (!externalMemberId) return;
    const isEdit = title === "编辑";
    await ensureOrgOptions();
    addDialog({
      title: `${title}组织归属`,
      width: "46%",
      draggable: true,
      fullscreen: deviceDetection(),
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          organizationId: row?.organizationId ?? "",
          organizationLabel: row ? orgLabel(row.organizationId) : "",
          membershipType: row?.membershipType ?? "PRIMARY",
          startedAt: "",
          endedAt: "",
          reason: row?.reason ?? ""
        } as MembershipFormModel,
        orgOptions: orgOptionsFor()
      },
      contentRenderer: () => h(MembershipForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const cur = options.props.formInline as MembershipFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              await updateMemberMembership(externalMemberId, row.id, {
                membershipType: cur.membershipType,
                ...(cur.startedAt ? { startedAt: cur.startedAt } : {}),
                ...(cur.endedAt ? { endedAt: cur.endedAt } : {}),
                ...(cur.reason ? { reason: cur.reason } : {})
              });
              message("修改成功", { type: "success" });
            } else {
              await createMemberMembership(externalMemberId, {
                organizationId: cur.organizationId,
                membershipType: cur.membershipType,
                ...(cur.reason ? { reason: cur.reason } : {})
              });
              message("新增成功", { type: "success" });
            }
            done();
            onSearch();
          } catch (error: any) {
            message(membershipBizErrorMessage(error, "保存失败"), {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /** 结束归属（status→ENDED，留痕不物删；无需表单，确认即执行） */
  function handleEnd(row: MembershipItem) {
    if (!externalMemberId) return;
    ElMessageBox.confirm(
      `确定结束在「${orgLabel(row.organizationId)}」的${typeLabel(row.membershipType)}归属吗？`,
      "结束归属",
      {
        confirmButtonText: "确定结束",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await endMemberMembership(externalMemberId, row.id);
          message("已结束", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(membershipBizErrorMessage(error, "结束失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 归属迁移（单事务：结束源+目标新建同类型归属；只需选目标组织+填原因） */
  async function openTransferDialog(row: MembershipItem) {
    if (!externalMemberId) return;
    await ensureOrgOptions();
    addDialog({
      title: "迁移组织归属",
      width: "42%",
      draggable: true,
      fullscreen: deviceDetection(),
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          fromOrganizationLabel: orgLabel(row.organizationId),
          membershipTypeLabel: typeLabel(row.membershipType),
          toOrganizationId: "",
          reason: ""
        } as TransferFormModel,
        orgOptions: orgOptionsFor(row.organizationId)
      },
      contentRenderer: () => h(TransferForm, { ref: transferFormRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const cur = options.props.formInline as TransferFormModel;
        transferFormRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            await transferMembership({
              memberId: externalMemberId,
              fromOrganizationId: row.organizationId,
              toOrganizationId: cur.toOrganizationId,
              membershipType: row.membershipType,
              ...(cur.reason ? { reason: cur.reason } : {})
            });
            message("迁移成功", { type: "success" });
            done();
            onSearch();
          } catch (error: any) {
            message(membershipBizErrorMessage(error, "迁移失败"), {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  return {
    canRead,
    canSet,
    canEnd,
    canTransfer,
    loading,
    columns,
    dataList,
    orgLabel,
    typeLabel,
    statusMeta,
    onSearch,
    openDialog,
    handleEnd,
    openTransferDialog
  };
}
