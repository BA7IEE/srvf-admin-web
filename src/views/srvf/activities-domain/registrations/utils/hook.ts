import { bizErrorMessage } from "@/api/srvf-error";
import dayjs from "dayjs";
import { h, ref, reactive, computed } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { deviceDetection, downloadByData } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import RegistrationForm, {
  type RegistrationFormModel,
  type MemberOption
} from "../form.vue";
import { getMembers } from "@/api/srvf-member";
import {
  getActivityRegistrations,
  approveRegistration,
  rejectRegistration,
  cancelRegistration,
  createRegistration,
  exportRegistrations,
  registrationReviewErrorMessage,
  bulkApproveRegistrations,
  bulkRejectRegistrations,
  reopenRegistration,
  bulkFailureText,
  REGISTRATION_BULK_MAX,
  type RegistrationItem,
  type RegistrationExportScope,
  type BulkReviewRegistrationsResult
} from "@/api/srvf-registration";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import { getActivityPositions } from "@/api/srvf-activity-position";

/**
 * 报名状态 code → tag 颜色（仅展示色；文案查 registration_status 字典，前端不臆造）。
 * code 取自契约 registration_status 闭集（pending / pass / reject / cancelled / waitlisted）。
 */
const STATUS_TAG_TYPE: Record<
  string,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  pending: "warning",
  pass: "success",
  reject: "danger",
  cancelled: "info",
  // v0.53 新增态:满员时新报名直接落这里,由后端自动递补
  waitlisted: "primary"
};

/**
 * @param externalActivityId 报名隶属活动 id（必传，来自活动作战室路由参数）。
 *   作战室是唯一消费方（独立报名菜单页已退役），故固定该活动、无页内活动下拉。
 */
export function useRegistrations(externalActivityId: string) {
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染 */
  const canRead = hasPerms("activity-registration.read.record");
  /**
   * 写权限（后端真实 RBAC 码）；行内按钮级显隐（SUPER_ADMIN 拥有全部码故全部可见）。
   * 状态机交后端：approve/reject 仅 pending 显示、cancel 在 pending|pass 显示（基本显隐,
   * 非前端复刻流转规则；后端拒绝时弹其 message）。
   */
  const canApprove = hasPerms("activity-registration.approve.record");
  const canReject = hasPerms("activity-registration.reject.record");
  const canCancel = hasPerms("activity-registration.cancel.record");
  /** 后悔药码：把已驳回的报名退回待审（与 approve/reject 是不同的码，单独门控） */
  const canReopen = hasPerms("activity-registration.reopen.record");
  const hasAnyRowAction = canApprove || canReject || canCancel || canReopen;
  /** 批量审批可用性：任一批量动作有码即渲染多选列 */
  const canBulk = canApprove || canReject;
  /** 代报名权限（工具栏按钮级显隐；需先选中活动才可代报名） */
  const canCreate = hasPerms("activity-registration.create.record");
  /** 共享字典标签解析器：报名状态 code → 中文（registration_status 字典） */
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["registration_status"]);
  const dataList = ref<RegistrationItem[]>([]);
  const loading = ref(false);
  /** 报名隶属活动 id：由作战室经路由参数注入并固定。保留 ref 形态，审批/代取消/代报名 handler 仍走 activityId.value 不改。 */
  const activityId = ref<string>(externalActivityId);
  /** 代报名队员下拉（懒加载;空数组 = 表单退化为文本输入 id） */
  const memberOptions = ref<MemberOption[]>([]);
  let memberOptionsResolved = false;
  const formRef = ref();
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    // 有批量码才给多选列;没有批量动作时多勾选纯属噪音
    ...(canBulk
      ? [{ type: "selection" as const, align: "left" as const, width: 44 }]
      : []),
    {
      label: "队员",
      prop: "memberDisplayName",
      minWidth: 140,
      formatter: ({ memberDisplayName, memberNo, memberId }) =>
        memberDisplayName ?? memberNo ?? memberId
    },
    {
      label: "队员编号",
      prop: "memberNo",
      minWidth: 140,
      formatter: ({ memberNo }) => memberNo ?? "—"
    },
    {
      // 无岗位活动恒 null,显示破折号即可;有岗位时这是审批的关键上下文
      label: "岗位",
      prop: "activityPosition",
      minWidth: 120,
      formatter: ({ activityPosition }) => activityPosition?.name ?? "—"
    },
    { label: "状态", prop: "statusCode", minWidth: 110, slot: "statusCode" },
    {
      // 候补位次只有候补态才有;其余状态后端返 null,显示破折号
      label: "候补位次",
      prop: "waitlistPosition",
      minWidth: 100,
      formatter: ({ waitlistPosition }) =>
        waitlistPosition == null ? "—" : `第 ${waitlistPosition} 位`
    },
    {
      label: "报名时间",
      prop: "registeredAt",
      minWidth: 170,
      formatter: ({ registeredAt }) =>
        registeredAt ? dayjs(registeredAt).format("YYYY-MM-DD HH:mm:ss") : "—"
    },
    {
      label: "审核时间",
      prop: "reviewedAt",
      minWidth: 170,
      formatter: ({ reviewedAt }) =>
        reviewedAt ? dayjs(reviewedAt).format("YYYY-MM-DD HH:mm:ss") : "—"
    },
    {
      label: "取消时间",
      prop: "cancelledAt",
      minWidth: 170,
      formatter: ({ cancelledAt }) =>
        cancelledAt ? dayjs(cancelledAt).format("YYYY-MM-DD HH:mm:ss") : "—"
    },
    ...(hasAnyRowAction
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

  /** 状态 code → 展示元数据：文案查 registration_status 字典，颜色按 code 给展示色（未知 → 原 code + info 灰） */
  function statusMeta(code: string) {
    return {
      text: dict.label("registration_status", code),
      type: STATUS_TAG_TYPE[code] ?? ("info" as const)
    };
  }

  async function onSearch() {
    if (!canRead || !activityId.value) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getActivityRegistrations(activityId.value, {
        page: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "加载报名记录失败"), {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  /** 该活动的岗位下拉（懒加载；空 = 这个活动没配岗位，代报名就不出岗位项） */
  const positionOptions = ref<{ label: string; value: string }[]>([]);
  let positionOptionsResolved = false;
  async function ensurePositionOptions() {
    if (positionOptionsResolved || !activityId.value) return;
    positionOptionsResolved = true;
    try {
      const { code, data } = await getActivityPositions(activityId.value);
      if (code === 0) {
        positionOptions.value = data.map(p => ({
          label: p.name,
          value: p.activityPositionId
        }));
      }
    } catch {
      // 拉不到岗位就当没配岗位：表单不出岗位项，真必填时后端会用 21035 拦下
    }
  }

  /* ----------------------------- 批量审批 ----------------------------- */

  /** 表格多选到的行（清空时机：每次批量动作完成后 + 列表刷新） */
  const selectedRows = ref<RegistrationItem[]>([]);
  const bulkSubmitting = ref(false);
  function onSelectionChange(rows: RegistrationItem[]) {
    selectedRows.value = rows;
  }
  /** 只有待审核的报名才谈得上批量通过 / 驳回,其余状态选了也是白选 */
  const selectedPendingIds = computed(() =>
    selectedRows.value.filter(r => r.statusCode === "pending").map(r => r.id)
  );

  /**
   * 批量审批结果对话框：**逐行**展示成功与失败。
   *
   * 后端逐条独立事务、允许部分成功，HTTP 200 不代表全过——
   * 只弹一句「操作成功」是错的，会让人以为整批都通过了。
   */
  function showBulkResult(
    action: "通过" | "驳回",
    result: BulkReviewRegistrationsResult,
    nameById: Map<string, string>
  ) {
    const okCount = result.succeeded.length;
    const failCount = result.failed.length;
    ElMessageBox.alert(
      h("div", { class: "leading-6" }, [
        h(
          "p",
          `批量${action}完成：成功 ${okCount} 条${failCount ? `，失败 ${failCount} 条` : ""}。`
        ),
        failCount
          ? h("div", { class: "mt-2" }, [
              h("p", { class: "font-medium" }, "以下这些没有成功："),
              h(
                "ul",
                { class: "mt-1 pl-4 list-disc text-xs" },
                result.failed.map(f =>
                  h(
                    "li",
                    `${nameById.get(f.id) ?? f.id}：${bulkFailureText(f)}`
                  )
                )
              ),
              h(
                "p",
                { class: "mt-2 text-xs" },
                "失败的这几条状态没变，处理完原因后可以重新选中再试一次。"
              )
            ])
          : null
      ]),
      `批量${action}结果`,
      { confirmButtonText: "知道了", type: failCount ? "warning" : "success" }
    ).catch(() => {});
  }

  /** 批量通过 / 批量驳回共用流程（差别只在端点、确认文案与备注默认值） */
  async function runBulkReview(action: "通过" | "驳回") {
    if (!activityId.value) return;
    const ids = selectedPendingIds.value;
    if (ids.length === 0) {
      message("请先勾选待审核的报名（其他状态不能批量审批）", {
        type: "warning"
      });
      return;
    }
    if (ids.length > REGISTRATION_BULK_MAX) {
      message(
        `一次最多处理 ${REGISTRATION_BULK_MAX} 条，当前选了 ${ids.length} 条，请分批操作`,
        { type: "warning" }
      );
      return;
    }

    let reviewNote = "";
    try {
      const r = await ElMessageBox.prompt(
        `确定批量${action}选中的 ${ids.length} 条报名吗？${
          action === "驳回"
            ? "可填写统一驳回理由（留空后端默认写「批量驳回」）。"
            : "可填写统一审核备注（可空）。"
        }`,
        `批量${action}`,
        {
          confirmButtonText: `确定${action}`,
          cancelButtonText: "返回",
          type: "warning",
          inputType: "textarea",
          inputPlaceholder:
            action === "驳回"
              ? "统一驳回理由（可空；≤ 500）"
              : "统一审核备注（可空；≤ 500）",
          inputValidator: (val: string) => {
            if (val && val.length > 500) return "备注不能超过 500 字";
            return true;
          }
        }
      );
      reviewNote = r.value ?? "";
    } catch {
      return;
    }

    const nameById = new Map(
      selectedRows.value.map(r => [r.id, rowSubject(r)] as const)
    );
    bulkSubmitting.value = true;
    try {
      const body = { ids, ...(reviewNote ? { reviewNote } : {}) };
      const { code, data } =
        action === "通过"
          ? await bulkApproveRegistrations(activityId.value, body)
          : await bulkRejectRegistrations(activityId.value, body);
      if (code === 0) showBulkResult(action, data, nameById);
    } catch (error: any) {
      message(registrationReviewErrorMessage(error, `批量${action}失败`), {
        type: "error"
      });
    } finally {
      bulkSubmitting.value = false;
      selectedRows.value = [];
      onSearch();
    }
  }

  const handleBulkApprove = () => runBulkReview("通过");
  const handleBulkReject = () => runBulkReview("驳回");

  /**
   * 退回待审（审批后悔药）：reject → pending，清空审核字段。
   * 也用于解除被驳回队员的重新报名限制。
   */
  function handleReopen(row: RegistrationItem) {
    ElMessageBox.confirm(
      h("div", { class: "leading-6" }, [
        h("p", `确定把「${rowSubject(row)}」的报名退回待审核吗？`),
        h("ul", { class: "mt-2 pl-4 list-disc text-xs" }, [
          h("li", "这条报名回到「待审核」，可以重新通过或驳回"),
          h("li", "原来的审核人、审核时间与驳回理由会被清空"),
          h("li", "该队员被驳回后的重新报名限制也一并解除"),
          h("li", "本操作不会给队员发通知")
        ])
      ]),
      "退回待审",
      {
        confirmButtonText: "确定退回",
        cancelButtonText: "返回",
        type: "warning"
      }
    )
      .then(async () => {
        if (!activityId.value) return;
        try {
          await reopenRegistration(activityId.value, row.id);
          message("已退回待审核", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(registrationReviewErrorMessage(error, "退回待审失败"), {
            type: "error"
          });
          onSearch();
        }
      })
      .catch(() => {});
  }

  /** 行主语：显示名 → 编号 → id（与队员列同口径） */
  function rowSubject(row: RegistrationItem) {
    return row.memberDisplayName ?? row.memberNo ?? row.memberId;
  }

  /** 审核通过（pending → pass；reviewNote 可空；后端拒绝/名额满时弹其 message） */
  function handleApprove(row: RegistrationItem) {
    ElMessageBox.prompt(
      `确定通过「${rowSubject(row)}」的报名吗？可填写审核备注（可空）。`,
      "审核通过",
      {
        confirmButtonText: "确定通过",
        cancelButtonText: "返回",
        type: "info",
        inputType: "textarea",
        inputPlaceholder: "审核备注（可空；≤ 500）",
        inputValidator: (val: string) => {
          if (val && val.length > 500) return "审核备注不能超过 500 字";
          return true;
        }
      }
    )
      .then(async ({ value }) => {
        if (!activityId.value) return;
        try {
          await approveRegistration(
            activityId.value,
            row.id,
            value ? { reviewNote: value } : {}
          );
          message("已通过", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(registrationReviewErrorMessage(error, "审核通过失败"), {
            type: "error"
          });
          // 并发审批的输家（21030）状态已变：重拉一次，别让用户对着过期行再点
          onSearch();
        }
      })
      .catch(() => {});
  }

  /** 审核拒绝（pending → reject；reviewNote 必填 → 弹必填输入框；后端拒绝弹其 message） */
  function handleReject(row: RegistrationItem) {
    ElMessageBox.prompt(
      `确定拒绝「${rowSubject(row)}」的报名吗？请填写拒绝理由（必填）。`,
      "审核拒绝",
      {
        confirmButtonText: "确定拒绝",
        cancelButtonText: "返回",
        type: "warning",
        inputType: "textarea",
        inputPlaceholder: "拒绝理由（必填；≤ 500）",
        inputValidator: (val: string) => {
          if (!val || !val.trim()) return "拒绝理由为必填项";
          if (val.length > 500) return "拒绝理由不能超过 500 字";
          return true;
        }
      }
    )
      .then(async ({ value }) => {
        if (!activityId.value) return;
        try {
          await rejectRegistration(activityId.value, row.id, {
            reviewNote: value
          });
          message("已拒绝", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(registrationReviewErrorMessage(error, "审核拒绝失败"), {
            type: "error"
          });
          // 同上：并发冲突时重拉
          onSearch();
        }
      })
      .catch(() => {});
  }

  /** 代取消（pending|pass → cancelled；cancelReason 可空；后端拒绝弹其 message） */
  function handleCancel(row: RegistrationItem) {
    ElMessageBox.prompt(
      `确定取消「${rowSubject(row)}」的报名吗？可填写取消原因（可空）。`,
      "代取消报名",
      {
        confirmButtonText: "确定取消",
        cancelButtonText: "返回",
        type: "warning",
        inputType: "textarea",
        inputPlaceholder: "取消原因（可空；≤ 500）",
        inputValidator: (val: string) => {
          if (val && val.length > 500) return "取消原因不能超过 500 字";
          return true;
        }
      }
    )
      .then(async ({ value }) => {
        if (!activityId.value) return;
        try {
          await cancelRegistration(
            activityId.value,
            row.id,
            value ? { cancelReason: value } : {}
          );
          message("已取消", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(bizErrorMessage(error, "取消失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /**
   * 懒加载代报名队员下拉（数据源 getMembers,仅 ACTIVE；参照活动页 organizationId 下拉做法）。
   * 无 member.read.record / 后端不可达 → 静默保持空 → 表单退化为文本输入 id。
   */
  async function ensureMemberOptions() {
    if (memberOptionsResolved) return;
    memberOptionsResolved = true;
    try {
      const { code, data } = await getMembers({
        status: "ACTIVE",
        pageSize: 100
      });
      if (code === 0) {
        memberOptions.value = data.items.map(m => ({
          label: `${m.displayName}（${m.memberNo}）`,
          value: m.id
        }));
      }
    } catch {
      // 无 member.read.record / 后端不可达 → 保持空 → 表单退化为文本输入 id
    }
  }

  /** 代报名（POST registrations；需先选中活动；仅提交 { memberId }；后端拒绝弹其 message） */
  async function openCreateDialog() {
    if (!activityId.value) {
      message("请先选择一个活动", { type: "warning" });
      return;
    }
    await Promise.allSettled([ensureMemberOptions(), ensurePositionOptions()]);
    addDialog({
      title: "代报名",
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          memberId: "",
          activityPositionId: ""
        } as RegistrationFormModel,
        memberOptions: memberOptions.value,
        positionOptions: positionOptions.value
      },
      contentRenderer: () => h(RegistrationForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const formComp = formRef.value;
        const curData = options.props.formInline as RegistrationFormModel;
        formComp.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            const created = await createRegistration(activityId.value, {
              memberId: curData.memberId,
              ...(curData.activityPositionId
                ? { activityPositionId: curData.activityPositionId }
                : {})
            });
            // 满员时后端会把这条直接落成候补,要如实告诉操作者,别一律说「报名成功」
            const pos = created?.data?.waitlistPosition;
            message(
              pos != null
                ? `已加入候补（第 ${pos} 位）：名额已满，取消或扩容后会自动递补`
                : "代报名成功",
              { type: "success", duration: pos != null ? 6000 : 3000 }
            );
            done();
            onSearch();
          } catch (error: any) {
            message(registrationReviewErrorMessage(error, "代报名失败"), {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /**
   * 导出报名名单 CSV（rbac 同读码 activity-registration.read.record）。
   * 默认 scope=pass（仅通过名单）；后端返 CSV blob,前端造下载。
   */
  async function handleExport(scope?: RegistrationExportScope) {
    if (!activityId.value) return;
    try {
      const blob = await exportRegistrations(activityId.value, scope);
      downloadByData(
        blob,
        `registrations-${activityId.value}-${scope ?? "pass"}.csv`
      );
      message("导出成功", { type: "success" });
    } catch (error: any) {
      message(bizErrorMessage(error, "导出失败"), { type: "error" });
    }
  }

  return {
    canRead,
    canApprove,
    canReject,
    canReopen,
    canBulk,
    selectedRows,
    selectedPendingIds,
    bulkSubmitting,
    onSelectionChange,
    handleBulkApprove,
    handleBulkReject,
    handleReopen,
    canCancel,
    canCreate,
    loading,
    columns,
    dataList,
    pagination,
    statusMeta,
    onSearch,
    openCreateDialog,
    handleApprove,
    handleReject,
    handleCancel,
    handleExport,
    handleSizeChange,
    handleCurrentChange
  };
}
