import dayjs from "dayjs";
import { h, ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
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
  type RegistrationItem,
  type RegistrationExportScope
} from "@/api/srvf-registration";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

/**
 * 报名状态 code → tag 颜色（仅展示色；文案查 registration_status 字典，前端不臆造）。
 * code 取自契约 registration_status 闭集（pending / pass / reject / cancelled）。
 */
const STATUS_TAG_TYPE: Record<
  string,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  pending: "warning",
  pass: "success",
  reject: "danger",
  cancelled: "info"
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
  const hasAnyRowAction = canApprove || canReject || canCancel;
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
    { label: "状态", prop: "statusCode", minWidth: 110, slot: "statusCode" },
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
      message(error?.response?.data?.message ?? "加载报名记录失败", {
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
          message(error?.response?.data?.message ?? "审核通过失败", {
            type: "error"
          });
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
          message(error?.response?.data?.message ?? "审核拒绝失败", {
            type: "error"
          });
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
          message(error?.response?.data?.message ?? "取消失败", {
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
    await ensureMemberOptions();
    addDialog({
      title: "代报名",
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: { memberId: "" } as RegistrationFormModel,
        memberOptions: memberOptions.value
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
            await createRegistration(activityId.value, {
              memberId: curData.memberId
            });
            message("代报名成功", { type: "success" });
            done();
            onSearch();
          } catch (error: any) {
            message(error?.response?.data?.message ?? "代报名失败", {
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `registrations-${activityId.value}-${scope ?? "pass"}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message("导出成功", { type: "success" });
    } catch (error: any) {
      message(error?.response?.data?.message ?? "导出失败", { type: "error" });
    }
  }

  return {
    canRead,
    canApprove,
    canReject,
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
