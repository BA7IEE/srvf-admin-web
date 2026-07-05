import dayjs from "dayjs";
import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import {
  getAllRegistrations,
  getAllAttendanceSheets,
  type AdminRegistrationItem,
  type AdminAttendanceSheetItem
} from "@/api/srvf-approval";
import {
  approveRegistration,
  rejectRegistration,
  cancelRegistration
} from "@/api/srvf-registration";
import {
  approveAttendanceSheet,
  rejectAttendanceSheet,
  finalApproveAttendanceSheet,
  finalRejectAttendanceSheet,
  finalReviewErrorMessage
} from "@/api/srvf-attendance";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

/**
 * 报名状态 code → tag 颜色（仅展示色；文案查 registration_status 字典,前端不臆造）。
 * code 取自契约 registration_status 闭集（pending / pass / reject / cancelled）。
 */
const REG_STATUS_TAG: Record<
  string,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  pending: "warning",
  pass: "success",
  reject: "danger",
  cancelled: "info"
};

/**
 * 考勤单据审核状态 code → tag 颜色（仅展示色；文案查 attendance_sheet_status 字典）。
 * code 取自契约 attendance_sheet_status 5 态闭集（approved 语义为终审通过）。
 */
const ATT_STATUS_TAG: Record<
  string,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  pending: "warning",
  pending_final_review: "warning",
  approved: "success",
  rejected: "danger",
  final_rejected: "danger"
};

/* ============================================================================
 * 审批工作台 · 报名横扫（跨所有活动按 statusCode 横扫"待我处理"）
 * 与活动作战室内的 useRegistrations 区别：脱离单一 activityId,写操作用每行 row.activityId。
 * ========================================================================== */
export function useApprovalRegistrations() {
  const router = useRouter();
  /** 共享字典标签解析器：报名状态 code → 中文（registration_status 字典） */
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["registration_status"]);

  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染 */
  const canRead = hasPerms("activity-registration.read.record");
  /** 写权限（行内按钮级显隐；SUPER_ADMIN 拥有全部码故全部可见） */
  const canApprove = hasPerms("activity-registration.approve.record");
  const canReject = hasPerms("activity-registration.reject.record");
  const canCancel = hasPerms("activity-registration.cancel.record");

  const dataList = ref<AdminRegistrationItem[]>([]);
  const loading = ref(false);
  /** statusCode 横扫过滤（默认 pending = 待审；空串 = 全部状态） */
  const statusFilter = ref<string>("pending");
  /** q 综合关键词（契约 F2；空串不传参） */
  const keyword = ref<string>("");
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  /** 状态下拉项：契约闭集 code + 字典文案 + 全部 */
  const statusOptions = computed(() => [
    { value: "", label: "全部状态" },
    ...Object.keys(REG_STATUS_TAG).map(code => ({
      value: code,
      label: dict.label("registration_status", code)
    }))
  ]);

  const columns: TableColumnList = [
    {
      label: "活动",
      prop: "activityTitle",
      minWidth: 180,
      formatter: ({ activityTitle, activityId }) => activityTitle ?? activityId
    },
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
      minWidth: 130,
      formatter: ({ memberNo }) => memberNo ?? "—"
    },
    { label: "状态", prop: "statusCode", minWidth: 100, slot: "statusCode" },
    {
      label: "报名时间",
      prop: "registeredAt",
      minWidth: 165,
      formatter: ({ registeredAt }) =>
        registeredAt ? dayjs(registeredAt).format("YYYY-MM-DD HH:mm") : "—"
    },
    { label: "操作", fixed: "right" as const, width: 280, slot: "operation" }
  ];

  /** 状态 code → 展示元数据：文案查字典,颜色按 code 给展示色（未知 → 原 code + info 灰） */
  function statusMeta(code: string) {
    return {
      text: dict.label("registration_status", code),
      type: REG_STATUS_TAG[code] ?? ("info" as const)
    };
  }

  async function onSearch() {
    if (!canRead) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getAllRegistrations({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        ...(statusFilter.value ? { statusCode: statusFilter.value } : {}),
        ...(keyword.value.trim() ? { q: keyword.value.trim() } : {})
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载报名横扫失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  /** 切换状态过滤 → 回到第 1 页重查 */
  function onFilterChange() {
    pagination.currentPage = 1;
    onSearch();
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
  function rowSubject(row: AdminRegistrationItem) {
    return row.memberDisplayName ?? row.memberNo ?? row.memberId;
  }

  /** 审核通过（pending → pass；reviewNote 可空；写操作用每行 activityId；后端拒绝/名额满弹其 message） */
  function handleApprove(row: AdminRegistrationItem) {
    ElMessageBox.prompt(
      `确定通过「${rowSubject(row)}」在「${row.activityTitle ?? row.activityId}」的报名吗？可填写审核备注（可空）。`,
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
        try {
          await approveRegistration(
            row.activityId,
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

  /** 审核拒绝（pending → reject；reviewNote 必填；后端拒绝弹其 message） */
  function handleReject(row: AdminRegistrationItem) {
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
        try {
          await rejectRegistration(row.activityId, row.id, {
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
  function handleCancel(row: AdminRegistrationItem) {
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
        try {
          await cancelRegistration(
            row.activityId,
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

  /** 跳进该报名所属活动的作战室（跨轴横扫 → 沿轴下钻） */
  function goCockpit(row: AdminRegistrationItem) {
    router.push(`/srvf/activities-domain/activities/${row.activityId}`);
  }

  return {
    canRead,
    canApprove,
    canReject,
    canCancel,
    loading,
    statusFilter,
    keyword,
    statusOptions,
    columns,
    dataList,
    pagination,
    statusMeta,
    onSearch,
    onFilterChange,
    handleApprove,
    handleReject,
    handleCancel,
    goCockpit,
    handleSizeChange,
    handleCurrentChange
  };
}

/* ============================================================================
 * 审批工作台 · 考勤单据横扫（跨所有活动按 statusCode 横扫）
 * 考勤写端点本就扁平（仅需 sheet id）,故 handler 直接复用 srvf-attendance。
 * ========================================================================== */
export function useApprovalAttendance() {
  const router = useRouter();
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["attendance_sheet_status"]);

  const canRead = hasPerms("attendance.read.sheet");
  const canApprove = hasPerms("attendance.approve.sheet");
  const canReject = hasPerms("attendance.reject.sheet");
  const canFinalApprove = hasPerms("attendance.final-approve.sheet");
  const canFinalReject = hasPerms("attendance.final-reject.sheet");

  const dataList = ref<AdminAttendanceSheetItem[]>([]);
  const loading = ref(false);
  /** statusCode 横扫过滤（默认 pending = 待一级审；可切 pending_final_review = 待终审） */
  const statusFilter = ref<string>("pending");
  /** q 综合关键词（契约 F2；空串不传参） */
  const keyword = ref<string>("");
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const statusOptions = computed(() => [
    { value: "", label: "全部状态" },
    ...Object.keys(ATT_STATUS_TAG).map(code => ({
      value: code,
      label: dict.label("attendance_sheet_status", code)
    }))
  ]);

  const columns: TableColumnList = [
    {
      label: "活动",
      prop: "activityTitle",
      minWidth: 180,
      formatter: ({ activityTitle, activityId }) => activityTitle ?? activityId
    },
    { label: "提交人 ID", prop: "submitterUserId", minWidth: 180 },
    { label: "状态", prop: "statusCode", minWidth: 110, slot: "statusCode" },
    { label: "版本", prop: "version", minWidth: 70 },
    {
      label: "提交时间",
      prop: "submittedAt",
      minWidth: 165,
      formatter: ({ submittedAt }) =>
        submittedAt ? dayjs(submittedAt).format("YYYY-MM-DD HH:mm") : "—"
    },
    { label: "操作", fixed: "right" as const, width: 300, slot: "operation" }
  ];

  function statusMeta(code: string) {
    return {
      text: dict.label("attendance_sheet_status", code),
      type: ATT_STATUS_TAG[code] ?? ("info" as const)
    };
  }

  async function onSearch() {
    if (!canRead) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getAllAttendanceSheets({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        ...(statusFilter.value ? { statusCode: statusFilter.value } : {}),
        ...(keyword.value.trim() ? { q: keyword.value.trim() } : {})
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载考勤横扫失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  function onFilterChange() {
    pagination.currentPage = 1;
    onSearch();
  }
  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }
  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  /** 一级通过（pending → pending_final_review；reviewNote 可空；前置校验由后端裁决 → 弹其 message） */
  function handleApprove(row: AdminAttendanceSheetItem) {
    ElMessageBox.prompt(
      `确定一级通过「提交人 ${row.submitterUserId}」在「${row.activityTitle ?? row.activityId}」的考勤单据吗？可填写审核备注（可空）。`,
      "一级通过",
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
        try {
          await approveAttendanceSheet(
            row.id,
            value ? { reviewNote: value } : {}
          );
          message("已一级通过", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? "一级通过失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 一级驳回（pending → rejected；reviewNote 必填；后端拒绝弹其 message） */
  function handleReject(row: AdminAttendanceSheetItem) {
    ElMessageBox.prompt(
      `确定一级驳回「提交人 ${row.submitterUserId}」的考勤单据吗？请填写驳回理由（必填）。`,
      "一级驳回",
      {
        confirmButtonText: "确定驳回",
        cancelButtonText: "返回",
        type: "warning",
        inputType: "textarea",
        inputPlaceholder: "驳回理由（必填；≤ 500）",
        inputValidator: (val: string) => {
          if (!val || !val.trim()) return "驳回理由为必填项";
          if (val.length > 500) return "驳回理由不能超过 500 字";
          return true;
        }
      }
    )
      .then(async ({ value }) => {
        try {
          await rejectAttendanceSheet(row.id, { reviewNote: value });
          message("已一级驳回", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? "一级驳回失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 终审通过（pending_final_review → approved；finalReviewNote 可空；贡献值正式生效；后端拒绝弹其 message） */
  function handleFinalApprove(row: AdminAttendanceSheetItem) {
    ElMessageBox.prompt(
      `确定终审通过「提交人 ${row.submitterUserId}」的考勤单据吗？贡献值将正式生效。可填写终审备注（可空）。`,
      "终审通过",
      {
        confirmButtonText: "确定终审通过",
        cancelButtonText: "返回",
        type: "info",
        inputType: "textarea",
        inputPlaceholder: "终审备注（可空；≤ 500）",
        inputValidator: (val: string) => {
          if (val && val.length > 500) return "终审备注不能超过 500 字";
          return true;
        }
      }
    )
      .then(async ({ value }) => {
        try {
          await finalApproveAttendanceSheet(
            row.id,
            value ? { finalReviewNote: value } : {}
          );
          message("已终审通过", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(finalReviewErrorMessage(error, "终审通过失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 终审驳回（pending_final_review → final_rejected；finalReviewNote 必填；后端拒绝弹其 message） */
  function handleFinalReject(row: AdminAttendanceSheetItem) {
    ElMessageBox.prompt(
      `确定终审驳回「提交人 ${row.submitterUserId}」的考勤单据吗？请填写终审驳回理由（必填）。`,
      "终审驳回",
      {
        confirmButtonText: "确定终审驳回",
        cancelButtonText: "返回",
        type: "warning",
        inputType: "textarea",
        inputPlaceholder: "终审驳回理由（必填；≤ 500）",
        inputValidator: (val: string) => {
          if (!val || !val.trim()) return "终审驳回理由为必填项";
          if (val.length > 500) return "终审驳回理由不能超过 500 字";
          return true;
        }
      }
    )
      .then(async ({ value }) => {
        try {
          await finalRejectAttendanceSheet(row.id, { finalReviewNote: value });
          message("已终审驳回", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(finalReviewErrorMessage(error, "终审驳回失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 跳进该单据所属活动的作战室（含考勤审核详情等深操作） */
  function goCockpit(row: AdminAttendanceSheetItem) {
    router.push(`/srvf/activities-domain/activities/${row.activityId}`);
  }

  return {
    canRead,
    canApprove,
    canReject,
    canFinalApprove,
    canFinalReject,
    loading,
    statusFilter,
    keyword,
    statusOptions,
    columns,
    dataList,
    pagination,
    statusMeta,
    onSearch,
    onFilterChange,
    handleApprove,
    handleReject,
    handleFinalApprove,
    handleFinalReject,
    goCockpit,
    handleSizeChange,
    handleCurrentChange
  };
}
