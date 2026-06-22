import dayjs from "dayjs";
import { ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { getActivities } from "@/api/srvf-activity";
import {
  getActivityAttendanceSheets,
  approveAttendanceSheet,
  rejectAttendanceSheet,
  finalApproveAttendanceSheet,
  finalRejectAttendanceSheet,
  deleteAttendanceSheet,
  type AttendanceSheetItem
} from "@/api/srvf-attendance";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

/**
 * 考勤单据审核状态 code → tag 颜色（仅展示色；文案查 attendance_sheet_status 字典，前端不臆造）。
 * code 取自契约 attendance_sheet_status 5 态闭集（approved 语义为终审通过）。
 */
const STATUS_TAG_TYPE: Record<
  string,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  pending: "warning",
  pending_final_review: "warning",
  approved: "success",
  rejected: "danger",
  final_rejected: "danger"
};

/**
 * @param externalActivityId 外部注入的活动 id（作战室 tab 用，来自路由参数）。
 *   传入 → 固定该活动、不渲染/不加载页内活动下拉；不传 → 维持独立菜单页现状（页内下拉自选活动）。
 */
export function useAttendances(externalActivityId?: string) {
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染 */
  const canRead = hasPerms("attendance.read.sheet");
  /**
   * 两级审批 + 删除写权限（后端真实 RBAC 码）；行内按钮级显隐（SUPER_ADMIN 拥有全部码故全部可见）。
   * 状态机交后端（基本显隐,非前端复刻流转规则；后端拒绝时弹其 message）：
   *   一级 approve/reject 仅 pending、终审 final-approve/final-reject 仅 pending_final_review、删除仅 pending。
   */
  const canApprove = hasPerms("attendance.approve.sheet");
  const canReject = hasPerms("attendance.reject.sheet");
  const canFinalApprove = hasPerms("attendance.final-approve.sheet");
  const canFinalReject = hasPerms("attendance.final-reject.sheet");
  const canDelete = hasPerms("attendance.delete.sheet");
  const hasAnyRowAction =
    canApprove || canReject || canFinalApprove || canFinalReject || canDelete;
  /** 共享字典标签解析器：考勤审核状态 code → 中文（attendance_sheet_status 字典） */
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["attendance_sheet_status"]);
  const dataList = ref<AttendanceSheetItem[]>([]);
  const loading = ref(false);
  /**
   * 考勤隶属活动 id。
   * - 独立菜单页：留空，由页内活动下拉选定（现状）。
   * - 作战室 tab：由外部（路由参数）注入并固定，不渲染/不加载活动下拉。
   */
  const activityId = ref<string>(externalActivityId ?? "");
  /** 是否由外部注入活动（作战室嵌入）：true 时跳过页内活动下拉加载 */
  const isExternalActivity = !!externalActivityId;
  const activityOptions = ref<Array<{ label: string; value: string }>>([]);
  const activityLoading = ref(false);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    { label: "提交人 ID", prop: "submitterUserId", minWidth: 200 },
    { label: "状态", prop: "statusCode", minWidth: 110, slot: "statusCode" },
    { label: "版本", prop: "version", minWidth: 80 },
    {
      label: "提交时间",
      prop: "submittedAt",
      minWidth: 170,
      formatter: ({ submittedAt }) =>
        submittedAt ? dayjs(submittedAt).format("YYYY-MM-DD HH:mm:ss") : "—"
    },
    {
      label: "审核时间",
      prop: "reviewedAt",
      minWidth: 170,
      formatter: ({ reviewedAt }) =>
        reviewedAt ? dayjs(reviewedAt).format("YYYY-MM-DD HH:mm:ss") : "—"
    },
    {
      label: "创建时间",
      prop: "createdAt",
      minWidth: 170,
      formatter: ({ createdAt }) =>
        createdAt ? dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss") : "—"
    },
    ...(hasAnyRowAction
      ? [
          {
            label: "操作",
            fixed: "right" as const,
            width: 240,
            slot: "operation"
          }
        ]
      : [])
  ];

  /** 状态 code → 展示元数据：文案查 attendance_sheet_status 字典，颜色按 code 给展示色（未知 → 原 code + info 灰） */
  function statusMeta(code: string) {
    return {
      text: dict.label("attendance_sheet_status", code),
      type: STATUS_TAG_TYPE[code] ?? ("info" as const)
    };
  }

  /** 活动下拉（数据源 getActivities；首页 50 条 + filterable 检索）。外部注入活动时无需下拉，直接跳过。 */
  async function loadActivities() {
    if (isExternalActivity || !canRead) return;
    activityLoading.value = true;
    try {
      const { code, data } = await getActivities({ page: 1, pageSize: 50 });
      if (code === 0) {
        activityOptions.value = data.items.map(a => ({
          label: a.title,
          value: a.id
        }));
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载活动失败", {
        type: "error"
      });
    } finally {
      activityLoading.value = false;
    }
  }

  async function onSearch() {
    if (!canRead || !activityId.value) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getActivityAttendanceSheets(
        activityId.value,
        { page: pagination.currentPage, pageSize: pagination.pageSize }
      );
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载考勤单据失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  function onActivityChange() {
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

  /** 行主语：以提交人 ID 标识单据（列表项无展示名,沿提交人列口径） */
  function rowSubject(row: AttendanceSheetItem) {
    return row.submitterUserId;
  }

  /** 一级通过（pending → pending_final_review；reviewNote 可空；R31 等前置校验由后端裁决 → 弹其 message） */
  function handleApprove(row: AttendanceSheetItem) {
    ElMessageBox.prompt(
      `确定一级通过「提交人 ${rowSubject(row)}」的考勤单据吗？可填写审核备注（可空）。`,
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

  /** 一级驳回（pending → rejected；reviewNote 必填 → 弹必填输入框；后端拒绝弹其 message） */
  function handleReject(row: AttendanceSheetItem) {
    ElMessageBox.prompt(
      `确定一级驳回「提交人 ${rowSubject(row)}」的考勤单据吗？请填写驳回理由（必填）。`,
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

  /** 终审通过（pending_final_review → approved；finalReviewNote 可空；后端拒绝弹其 message） */
  function handleFinalApprove(row: AttendanceSheetItem) {
    ElMessageBox.prompt(
      `确定终审通过「提交人 ${rowSubject(row)}」的考勤单据吗？贡献值将正式生效。可填写终审备注（可空）。`,
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
          message(error?.response?.data?.message ?? "终审通过失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 终审驳回（pending_final_review → final_rejected；finalReviewNote 必填 → 弹必填输入框；后端拒绝弹其 message） */
  function handleFinalReject(row: AttendanceSheetItem) {
    ElMessageBox.prompt(
      `确定终审驳回「提交人 ${rowSubject(row)}」的考勤单据吗？请填写终审驳回理由（必填）。`,
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
          message(error?.response?.data?.message ?? "终审驳回失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 删除（仅 pending 软删；二次确认；后端对非 pending 拒绝 → 弹其 message） */
  function handleDelete(row: AttendanceSheetItem) {
    ElMessageBox.confirm(
      `确定删除「提交人 ${rowSubject(row)}」的考勤单据吗？此操作将级联软删其考勤记录,不可在前端撤销。`,
      "删除考勤单据",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "返回",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await deleteAttendanceSheet(row.id);
          message("已删除", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? "删除失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  return {
    canRead,
    canApprove,
    canReject,
    canFinalApprove,
    canFinalReject,
    canDelete,
    loading,
    columns,
    dataList,
    activityId,
    isExternalActivity,
    activityOptions,
    activityLoading,
    pagination,
    statusMeta,
    loadActivities,
    onSearch,
    onActivityChange,
    handleApprove,
    handleReject,
    handleFinalApprove,
    handleFinalReject,
    handleDelete,
    handleSizeChange,
    handleCurrentChange
  };
}
