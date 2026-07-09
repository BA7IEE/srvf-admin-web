import { bizErrorMessage } from "@/api/srvf-error";
import dayjs from "dayjs";
import { h, ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { getMembers, type MemberItem } from "@/api/srvf-member";
import {
  getActivityRegistrations,
  type RegistrationItem
} from "@/api/srvf-registration";
import {
  getActivityAttendanceSheets,
  submitAttendanceSheet,
  updateAttendanceSheet,
  approveAttendanceSheet,
  rejectAttendanceSheet,
  finalApproveAttendanceSheet,
  finalRejectAttendanceSheet,
  deleteAttendanceSheet,
  getAttendanceSheetReviewDetail,
  finalReviewErrorMessage,
  type AttendanceSheetItem,
  type AttendanceSheetReviewDetail,
  type AttendanceRecordInputBody
} from "@/api/srvf-attendance";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import { resolveLabelMap } from "@/api/srvf-meta";
import AttendanceForm, {
  createEmptyRecord,
  type AttendanceFormOption,
  type AttendanceRecordFormModel,
  type AttendanceSheetFormModel,
  type AttendanceRegistrationImportOption
} from "../form.vue";

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
 * @param externalActivityId 考勤隶属活动 id（必传，来自活动作战室路由参数）。
 *   作战室是唯一消费方（独立考勤菜单页已退役），故固定该活动、无页内活动下拉。
 */
export function useAttendances(externalActivityId: string) {
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
  /** 提交 / 编辑写权限（后端真实 RBAC 码）。 */
  const canCreate = hasPerms("attendance.create.sheet");
  const canUpdate = hasPerms("attendance.update.sheet");
  /** 共享字典标签解析器：考勤审核状态 code → 中文（attendance_sheet_status 字典） */
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["attendance_sheet_status"]);
  const dataList = ref<AttendanceSheetItem[]>([]);
  const loading = ref(false);
  /** 提交人 User.id → 展示名（resolve-labels 批量解析；未命中回落原 id） */
  const submitterLabels = ref<Record<string, string>>({});
  /** 审核明细 drawer 状态（查看明细：活动摘要 + 单据 + records，只读） */
  const reviewDetailVisible = ref(false);
  const reviewDetailLoading = ref(false);
  const reviewDetailData = ref<AttendanceSheetReviewDetail | null>(null);
  /** 提交 / 编辑表单下拉选项。无 member.read.record / dict 权限时，表单退化为文本输入 code/id。 */
  const memberOptions = ref<AttendanceFormOption[]>([]);
  const memberOptionsNotice = ref("");
  const roleOptions = ref<AttendanceFormOption[]>([]);
  const statusOptions = ref<AttendanceFormOption[]>([]);
  const registrationOptions = ref<AttendanceRegistrationImportOption[]>([]);
  let attendanceFormOptionsResolved = false;
  const formRef = ref();
  /** 考勤隶属活动 id：由作战室经路由参数注入并固定。保留 ref 形态，列表加载仍走 activityId.value 不改。 */
  const activityId = ref<string>(externalActivityId);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    {
      label: "提交人",
      prop: "submitterUserId",
      minWidth: 140,
      formatter: row => rowSubject(row as AttendanceSheetItem)
    },
    { label: "状态", prop: "statusCode", minWidth: 110, slot: "statusCode" },
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
    // 操作列恒显：查看明细对任何有读码者开放（本 tab 已 canRead 门控）；写操作仍按各自码 v-if 显隐
    {
      label: "操作",
      fixed: "right" as const,
      width: 390,
      slot: "operation"
    }
  ];

  /** 状态 code → 展示元数据：文案查 attendance_sheet_status 字典，颜色按 code 给展示色（未知 → 原 code + info 灰） */
  function statusMeta(code: string) {
    return {
      text: dict.label("attendance_sheet_status", code),
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
      const { code, data } = await getActivityAttendanceSheets(
        activityId.value,
        { page: pagination.currentPage, pageSize: pagination.pageSize }
      );
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
        const resolved = await resolveLabelMap(
          "user",
          data.items.map(i => i.submitterUserId)
        );
        submitterLabels.value = { ...submitterLabels.value, ...resolved };
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "加载考勤单据失败"), {
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

  /** 行主语：提交人展示名（resolve-labels 命中）；未命中回落原 User.id */
  function rowSubject(row: AttendanceSheetItem) {
    return submitterLabels.value[row.submitterUserId] ?? row.submitterUserId;
  }

  function toFormDate(value?: string | null): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function reviewRecordToForm(
    record: AttendanceSheetReviewDetail["records"][number]
  ): AttendanceRecordFormModel {
    return {
      memberId: record.memberId,
      roleCode: record.roleCode,
      checkInAt: toFormDate(record.checkInAt),
      checkOutAt: toFormDate(record.checkOutAt),
      serviceHours: record.serviceHours ?? "",
      attendanceStatusCode: record.attendanceStatusCode,
      note: record.note ?? "",
      registrationId: record.registrationId ?? "",
      contributionPoints: record.contributionPoints ?? ""
    };
  }

  function reviewRecordSubject(
    record: AttendanceSheetReviewDetail["records"][number]
  ): string {
    const displayName = record.member?.displayName?.trim();
    const memberNo = record.member?.memberNo?.trim();
    if (displayName && memberNo) return `${displayName}（${memberNo}）`;
    return displayName || memberNo || record.memberId;
  }

  function hasContributionPoints(
    record: AttendanceSheetReviewDetail["records"][number]
  ): boolean {
    return (
      record.contributionPoints !== null &&
      String(record.contributionPoints).trim() !== ""
    );
  }

  /**
   * 一级通过前贡献值友好预检查（R31：approve 前所有 records.contributionPoints 必填，
   * 后端会硬拒绝）。只是提前把"会失败"的原因摊开给审核人看，最终裁决权仍在后端——
   * 预检查本身失败（如查看明细网络错误）不阻断审核，交由后端兜底判定。
   */
  async function assertContributionPointsReadyBeforeApprove(
    row: AttendanceSheetItem
  ): Promise<boolean> {
    try {
      const { code, data } = await getAttendanceSheetReviewDetail(row.id);
      if (code !== 0) return true;
      const missingRecords = data.records.filter(
        record => !hasContributionPoints(record)
      );
      if (!missingRecords.length) return true;

      const maxPreviewCount = 8;
      const missingList = missingRecords
        .slice(0, maxPreviewCount)
        .map((record, index) => `${index + 1}. ${reviewRecordSubject(record)}`)
        .join("\n");
      const restCount = missingRecords.length - maxPreviewCount;
      const restText = restCount > 0 ? `\n……另有 ${restCount} 条记录` : "";

      await ElMessageBox.alert(
        `当前考勤单据还有 ${missingRecords.length} 条记录缺少贡献值，后端会拒绝一级通过。\n\n${missingList}${restText}\n\n请先编辑单据补齐贡献值，或确认贡献值规则预填已生效后再审核。`,
        "一级通过前检查",
        {
          confirmButtonText: "去编辑补齐",
          type: "warning"
        }
      );
      return false;
    } catch (error: any) {
      message(bizErrorMessage(error, "贡献值预检查失败，将继续交由后端裁决"), {
        type: "warning"
      });
      return true;
    }
  }

  function assertIsoDate(
    value: Date | string | null,
    label: string,
    index: number
  ): string {
    if (!value) throw new Error(`第 ${index + 1} 条${label}为必填项`);
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`第 ${index + 1} 条${label}格式不正确`);
    }
    return date.toISOString();
  }

  function optionalNumber(
    value: string,
    label: string,
    index: number,
    min: number
  ): number | undefined {
    const text = String(value ?? "").trim();
    if (!text) return undefined;
    const num = Number(text);
    if (!Number.isFinite(num) || num < min) {
      throw new Error(`第 ${index + 1} 条${label}必须是不小于 ${min} 的数字`);
    }
    return num;
  }

  function requiredText(value: string, label: string, index: number): string {
    const text = String(value ?? "").trim();
    if (!text) throw new Error(`第 ${index + 1} 条${label}为必填项`);
    return text;
  }

  function normalizeFormRecords(
    form: AttendanceSheetFormModel
  ): AttendanceRecordInputBody[] {
    if (!form.records.length) throw new Error("至少需要一条考勤记录");
    return form.records.map((record, index) => {
      const memberId = requiredText(record.memberId, "队员", index);
      const roleCode = requiredText(record.roleCode, "考勤角色", index);
      const attendanceStatusCode = requiredText(
        record.attendanceStatusCode,
        "出勤状态",
        index
      );
      const checkInAt = assertIsoDate(record.checkInAt, "签到时间", index);
      const checkOutAt = assertIsoDate(record.checkOutAt, "签退时间", index);
      if (new Date(checkOutAt).getTime() <= new Date(checkInAt).getTime()) {
        throw new Error(`第 ${index + 1} 条签退时间必须晚于签到时间`);
      }

      const body: AttendanceRecordInputBody = {
        memberId,
        roleCode,
        checkInAt,
        checkOutAt,
        attendanceStatusCode
      };

      const serviceHours = optionalNumber(
        record.serviceHours,
        "服务时长",
        index,
        0.01
      );
      if (serviceHours !== undefined) body.serviceHours = serviceHours;

      const contributionPoints = optionalNumber(
        record.contributionPoints,
        "贡献值",
        index,
        0
      );
      if (contributionPoints !== undefined) {
        body.contributionPoints = contributionPoints;
      }

      const note = record.note.trim();
      if (note) body.note = note;

      const registrationId = record.registrationId.trim();
      if (registrationId) body.registrationId = registrationId;

      return body;
    });
  }

  function shortId(id: string) {
    return id.length > 8 ? id.slice(-8) : id;
  }

  function memberLabel(member: MemberItem) {
    return `${member.displayName}（${member.memberNo}）`;
  }

  function registrationLabel(row: RegistrationItem) {
    const name = row.memberDisplayName ?? row.memberNo ?? row.memberId;
    const memberText =
      row.memberNo && row.memberDisplayName
        ? `${row.memberDisplayName}（${row.memberNo}）`
        : name;
    return `${memberText} · 报名 ${shortId(row.id)}`;
  }

  /** 预取该活动"已通过"报名名单（单次最多 1000 条，超出仍可手输补录）。 */
  async function fetchApprovedRegistrationImportOptions() {
    registrationOptions.value = [];
    if (!activityId.value) return;
    const pageSize = 100;
    const items: RegistrationItem[] = [];
    let page = 1;
    let total = 0;
    do {
      const { code, data } = await getActivityRegistrations(activityId.value, {
        statusCode: "pass",
        page,
        pageSize
      });
      if (code !== 0) break;
      items.push(...data.items);
      total = data.total;
      page += 1;
    } while (items.length < total && page <= 10);

    registrationOptions.value = items.map(item => ({
      registrationId: item.id,
      memberId: item.memberId,
      label: registrationLabel(item)
    }));
  }

  function mergeRegistrationMembersIntoMemberOptions() {
    const known = new Set(memberOptions.value.map(item => item.value));
    for (const item of registrationOptions.value) {
      if (known.has(item.memberId)) continue;
      known.add(item.memberId);
      memberOptions.value.push({ label: item.label, value: item.memberId });
    }
  }

  const MEMBER_OPTION_PAGE_SIZE = 100;
  const MEMBER_OPTION_MAX_ITEMS = 1000;

  /** 预取全队 ACTIVE 队员（≤1000）供表单本地搜索；超量仍可手输 Member.id 兜底。 */
  async function fetchActiveMemberOptions() {
    const items: MemberItem[] = [];
    let page = 1;
    let total = 0;
    do {
      const { code, data } = await getMembers({
        status: "ACTIVE",
        page,
        pageSize: MEMBER_OPTION_PAGE_SIZE
      });
      if (code !== 0) break;
      items.push(...data.items);
      total = data.total;
      page += 1;
    } while (items.length < total && items.length < MEMBER_OPTION_MAX_ITEMS);

    memberOptions.value = items.slice(0, MEMBER_OPTION_MAX_ITEMS).map(m => ({
      label: memberLabel(m),
      value: m.id
    }));

    if (total > MEMBER_OPTION_MAX_ITEMS) {
      memberOptionsNotice.value = `已加载前 ${MEMBER_OPTION_MAX_ITEMS} 名 ACTIVE 队员，可按姓名/编号本地搜索；未找到时请手输 Member.id。`;
      return;
    }

    if (memberOptions.value.length) {
      memberOptionsNotice.value = `已加载 ${memberOptions.value.length} 名 ACTIVE 队员，可按姓名/编号本地搜索；也可手输 Member.id。`;
    } else {
      memberOptionsNotice.value = "未加载到 ACTIVE 队员；可手输 Member.id。";
    }
  }

  /** 打开创建/编辑对话框前确保下拉选项就绪（load-once；每次打开都重拉已通过报名，其它选项只拉一次）。 */
  async function ensureAttendanceFormOptions() {
    if (!attendanceFormOptionsResolved) {
      attendanceFormOptionsResolved = true;
      await Promise.all([
        dict.ensureTypes(["attendance_role", "attendance_status"]),
        fetchActiveMemberOptions().catch(() => {
          memberOptions.value = [];
          memberOptionsNotice.value =
            "无法加载队员列表；表单将退化为手输 Member.id。";
        })
      ]);
      roleOptions.value = dict.options("attendance_role");
      statusOptions.value = dict.options("attendance_status");
    }

    await fetchApprovedRegistrationImportOptions().catch(() => {
      // 无 activity-registration.read.record / 后端不可达 → 保持空数组，仅禁用导入按钮
      registrationOptions.value = [];
    });
    mergeRegistrationMembersIntoMemberOptions();
  }

  /** 提交新考勤单据（对话框；对齐既有 openXxxDialog 范式：addDialog + contentRenderer + beforeSure）。 */
  function openCreateDialog() {
    if (!activityId.value) {
      message("请先从活动列表点「管理」进入一个活动", { type: "warning" });
      return;
    }
    ensureAttendanceFormOptions()
      .then(() => {
        addDialog({
          title: "提交考勤单据",
          width: "72%",
          draggable: true,
          fullscreen: deviceDetection(),
          fullscreenIcon: true,
          closeOnClickModal: false,
          sureBtnLoading: true,
          props: {
            mode: "create",
            formInline: {
              records: [createEmptyRecord()]
            } as AttendanceSheetFormModel,
            memberOptions: memberOptions.value,
            memberOptionsNotice: memberOptionsNotice.value,
            roleOptions: roleOptions.value,
            statusOptions: statusOptions.value,
            registrationOptions: registrationOptions.value
          },
          contentRenderer: () => h(AttendanceForm, { ref: formRef }),
          beforeSure: (done, { options, closeLoading }) => {
            const formComp = formRef.value;
            const curData = options.props
              .formInline as AttendanceSheetFormModel;
            formComp.getRef().validate(async (valid: boolean) => {
              if (!valid) {
                closeLoading();
                return;
              }
              try {
                await submitAttendanceSheet(activityId.value, {
                  records: normalizeFormRecords(curData)
                });
                message("考勤单据已提交", { type: "success" });
                done();
                onSearch();
              } catch (error: any) {
                message(
                  error?.message && !error?.response
                    ? error.message
                    : bizErrorMessage(error, "提交考勤失败"),
                  { type: "error" }
                );
                closeLoading();
              }
            });
          }
        });
      })
      .catch(() => {
        message("打开考勤表单失败", { type: "error" });
      });
  }

  /** 编辑 pending 考勤单据（仅 pending 可编辑；非 pending 由后端拒绝兜底，前端先做一层友好提示）。 */
  async function openEditDialog(row: AttendanceSheetItem) {
    if (row.statusCode !== "pending") {
      message("只有待一级审核的考勤单据可以编辑", { type: "warning" });
      return;
    }
    try {
      await ensureAttendanceFormOptions();
      const { code, data } = await getAttendanceSheetReviewDetail(row.id);
      const records =
        code === 0 && data.records.length
          ? data.records.map(reviewRecordToForm)
          : [createEmptyRecord()];

      addDialog({
        title: "编辑考勤单据",
        width: "72%",
        draggable: true,
        fullscreen: deviceDetection(),
        fullscreenIcon: true,
        closeOnClickModal: false,
        sureBtnLoading: true,
        props: {
          mode: "edit",
          formInline: { records } as AttendanceSheetFormModel,
          memberOptions: memberOptions.value,
          memberOptionsNotice: memberOptionsNotice.value,
          roleOptions: roleOptions.value,
          statusOptions: statusOptions.value,
          registrationOptions: registrationOptions.value
        },
        contentRenderer: () => h(AttendanceForm, { ref: formRef }),
        beforeSure: (done, { options, closeLoading }) => {
          const formComp = formRef.value;
          const curData = options.props.formInline as AttendanceSheetFormModel;
          formComp.getRef().validate(async (valid: boolean) => {
            if (!valid) {
              closeLoading();
              return;
            }
            try {
              await updateAttendanceSheet(row.id, {
                records: normalizeFormRecords(curData)
              });
              message("考勤单据已更新", { type: "success" });
              done();
              onSearch();
            } catch (error: any) {
              message(
                error?.message && !error?.response
                  ? error.message
                  : bizErrorMessage(error, "编辑考勤失败"),
                { type: "error" }
              );
              closeLoading();
            }
          });
        }
      });
    } catch (error: any) {
      message(bizErrorMessage(error, "打开编辑表单失败"), {
        type: "error"
      });
    }
  }

  /** 一级通过（pending → pending_final_review；reviewNote 可空；R31 前置校验先友好预检查,最终仍由后端裁决 → 弹其 message） */
  async function handleApprove(row: AttendanceSheetItem) {
    const ready = await assertContributionPointsReadyBeforeApprove(row);
    if (!ready) return;
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
          message(bizErrorMessage(error, "一级通过失败"), {
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
          message(bizErrorMessage(error, "一级驳回失败"), {
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
          message(finalReviewErrorMessage(error, "终审通过失败"), {
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
          message(finalReviewErrorMessage(error, "终审驳回失败"), {
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
          message(bizErrorMessage(error, "删除失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 查看审核明细（drawer 内只读展示活动摘要 + 单据 + records）；canRead 同读码门 */
  async function openReviewDetail(row: AttendanceSheetItem) {
    reviewDetailVisible.value = true;
    reviewDetailLoading.value = true;
    reviewDetailData.value = null;
    try {
      const { code, data } = await getAttendanceSheetReviewDetail(row.id);
      if (code === 0) reviewDetailData.value = data;
    } catch (error: any) {
      message(bizErrorMessage(error, "加载审核明细失败"), {
        type: "error"
      });
    } finally {
      reviewDetailLoading.value = false;
    }
  }

  return {
    canRead,
    canCreate,
    canUpdate,
    canApprove,
    canReject,
    canFinalApprove,
    canFinalReject,
    canDelete,
    loading,
    columns,
    dataList,
    pagination,
    statusMeta,
    onSearch,
    openCreateDialog,
    openEditDialog,
    handleApprove,
    handleReject,
    handleFinalApprove,
    handleFinalReject,
    handleDelete,
    openReviewDetail,
    reviewDetailVisible,
    reviewDetailLoading,
    reviewDetailData,
    handleSizeChange,
    handleCurrentChange
  };
}
