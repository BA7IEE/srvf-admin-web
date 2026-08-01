<script setup lang="ts">
import { bizErrorMessage } from "@/api/srvf-error";
import { ref, computed, onMounted, h } from "vue";
import { useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import { SrvfStatusTag, SrvfDetailShell, SrvfPermEmpty } from "@/srvf-kit";
import GrantWizard from "@/views/srvf/components/grant-wizard.vue";
import SrvfFormLabelTip from "@/views/srvf/components/form-label-tip.vue";
import {
  MEMBERSHIP_STATUS_LABEL,
  MEMBERSHIP_STATUS_TAG,
  ASSIGNMENT_STATUS_LABEL,
  ASSIGNMENT_STATUS_TAG
} from "@/api/srvf-labels";
import {
  getMember,
  getMemberOffboardImpact,
  offboardBlockingReasonText,
  offboardMember,
  memberOffboardBizErrorMessage,
  type MemberOffboardImpact,
  grantMemberAccount,
  bindMemberAccount,
  unbindMemberAccount,
  reopenMemberAccount,
  updateMemberAccountStatus,
  type MemberItem
} from "@/api/srvf-member";
import { getUserAccount } from "@/api/srvf-user";
import AccountBindForm, {
  type AccountBindFormModel
} from "./account-bind-form.vue";
import { useCertificates } from "../certificates/utils/hook";
import { useMemberInsurances } from "../insurances/utils/hook";
import { useEmergencyContacts } from "../emergency-contacts/utils/hook";
import { useMemberMemberships } from "../memberships/utils/hook";
import { useMemberPositionAssignments } from "../position-assignments/utils/hook";
import { useMemberSupervisionScope } from "../supervision-scope/utils/hook";
import { useMemberProfile } from "../profile/utils/hook";
import {
  useMemberRegistrations,
  useMemberAttendanceRecords,
  useMemberContribution
} from "../participation/utils/hook";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SrvfMemberCockpit"
});

/** 实体 id 来自路由参数（该路由不入 keepAlive → 每次进来重新挂载，setup 取一次即可靠） */
const route = useRoute();
const router = useRouter();
const memberId = route.params.id as string;

/** 共享字典：队员等级 member_grade code → 中文（证书 tab 的 cert_status 由 useCertificates 预热同一 store） */
const dict = useSrvfDictStoreHook();
dict.ensureTypes(["member_grade"]);

/**
 * 显式锚定默认激活 tab：EP el-tabs 无 v-model/default-value 时 currentName 默认 "0"，
 * 与所有具名 tab-pane 都不匹配 → 首屏所有 pane 被 v-show 隐藏，点一下才显示。
 * 本页 tab-pane 恒渲染（权限门在 pane 内部 template v-if 上，无权时退化为空态提示），
 * 故初始化为第一个 tab「证书」即可稳定落屏。
 */
const activeTab = ref<
  | "certificates"
  | "insurances"
  | "emergency-contacts"
  | "memberships"
  | "position-assignments"
  | "supervision-scope"
  | "profile"
  | "account"
  | "registrations-history"
  | "attendance-records"
  | "contribution"
>("profile");

/* ----------------------------- 头部：队员基本信息 ----------------------------- */
const detail = ref<MemberItem | null>(null);
const detailLoading = ref(false);

/** 授权向导（任一授权类写码即可见;向导内部再按场景细分门控） */
const grantWizardVisible = ref(false);
const canOpenGrantWizard =
  hasPerms("position-assignment.create.record") ||
  hasPerms("role-binding.create.record") ||
  hasPerms("rbac.user-role.create");

/** 拉队员详情（GET /members/{id}，rbac member.read.record；404 / 无权 → 头部退化为空态提示） */
async function fetchDetail() {
  detailLoading.value = true;
  try {
    const { code, data } = await getMember(memberId);
    if (code === 0) detail.value = data;
  } catch (error: any) {
    message(bizErrorMessage(error, "加载队员详情失败"), {
      type: "error"
    });
  } finally {
    detailLoading.value = false;
  }
  fetchLinkedAccountDetail();
}

/**
 * 已开通账号时补拉「最近登录」（GET /users/{id}，rbac user.read.account——与队员管理不同码族，
 * 无权限时静默保持空，账号 tab 退化为不显示该行）。
 * 契约未暴露手机号 / 微信绑定状态字段（仅 app/v1/me/* 自助端点有，属账号本人视角），故只做最近登录。
 */
const linkedAccountLastLoginAt = ref<string | null>(null);
async function fetchLinkedAccountDetail() {
  linkedAccountLastLoginAt.value = null;
  if (!detail.value?.userId) return;
  try {
    const { code, data } = await getUserAccount(detail.value.userId);
    if (code === 0) linkedAccountLastLoginAt.value = data.lastLoginAt;
  } catch {
    // 无 user.read.account 权限 / 后端不可达 → 静默保持空
  }
}

/* --------------- Tab：账号（队员账号闭环；字段随 fetchDetail 一并到手，无需单独 GET） --------------- */
/** 开号/退号重开码（绑 ops-admin，与本页其余按钮的 biz-admin 归属不同，单独判显隐） */
const canGrantAccount = hasPerms("member.grant.account");
/** 绑定/解绑码（同上绑 ops-admin） */
const canBindAccount = hasPerms("member.bind.account");
/** 启停关联账号码（复用既有用户管理码） */
const canUpdateAccountStatus = hasPerms("user.update.status");
/** 「查看授权」跳转目标（角色绑定页）的读码——与角色绑定页 canRead 同码，保证跳过去看得到东西 */
const canViewAccountAuthz = hasPerms("role-binding.read.record");
/** 当前账号状态下是否有任一可用操作（启停码只在已开通时才算数，启停码与开号码不总是同归属） */
const canManageAccountInCurrentState = computed(
  () =>
    canGrantAccount ||
    canBindAccount ||
    (!!detail.value?.hasAccount && canUpdateAccountStatus)
);

const accountFormRef = ref();

/** 开通账号 / 退号重开共用的手机号输入弹窗（11 位手机号校验规则、错误文案统一在此维护） */
function promptForPhone(title: string, tip: string): Promise<string | null> {
  return ElMessageBox.prompt(tip, title, {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPlaceholder: "如 13800001234",
    inputPattern: /^1[3-9]\d{9}$/,
    inputErrorMessage: "请输入11位手机号"
  })
    .then(({ value }) => value)
    .catch(() => null);
}

/** 开通账号（prompt 输入手机号；后端建 User 绑手机验证码登录，不设密码） */
async function handleGrantAccount() {
  const phone = await promptForPhone(
    "开通账号",
    "为该队员开通登录账号（手机验证码登录，不设密码），请输入手机号："
  );
  if (!phone) return;
  try {
    const { data } = await grantMemberAccount(memberId, phone);
    message(`开通成功，登录用户名：${data.username}`, { type: "success" });
    fetchDetail();
  } catch (error: any) {
    message(bizErrorMessage(error, "开通失败"), { type: "error" });
  }
}

/** 绑定既有悬空账号（弹窗内自带远程搜索，已绑定他人的账号由后端拒绝） */
function openBindAccountDialog() {
  addDialog({
    title: "绑定既有账号",
    width: "32%",
    draggable: true,
    fullscreen: deviceDetection(),
    closeOnClickModal: false,
    sureBtnLoading: true,
    props: {
      formInline: { userId: "" } as AccountBindFormModel
    },
    contentRenderer: () => h(AccountBindForm, { ref: accountFormRef }),
    beforeSure: (done, { options, closeLoading }) => {
      const cur = options.props.formInline as AccountBindFormModel;
      if (!cur.userId) {
        message("请选择要绑定的账号", { type: "warning" });
        closeLoading();
        return;
      }
      (async () => {
        try {
          await bindMemberAccount(memberId, cur.userId);
          message("绑定成功", { type: "success" });
          done();
          fetchDetail();
        } catch (error: any) {
          message(bizErrorMessage(error, "绑定失败"), { type: "error" });
          closeLoading();
        }
      })();
    }
  });
}

/** 解绑账号（只断链，账号回落悬空 ACTIVE，不顺手停用/删除） */
function handleUnbindAccount() {
  ElMessageBox.confirm(
    "解绑后该账号将不再关联任何队员（账号本身不会停用或删除），确定解绑吗？",
    "解绑账号",
    { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
  )
    .then(async () => {
      try {
        await unbindMemberAccount(memberId);
        message("已解绑", { type: "success" });
        fetchDetail();
      } catch (error: any) {
        message(bizErrorMessage(error, "解绑失败"), { type: "error" });
      }
    })
    .catch(() => {});
}

/** 退号重开（软删旧号 + 新手机号开新号，须与旧号不同） */
async function handleReopenAccount() {
  const phone = await promptForPhone(
    "作废旧账号并重新开通",
    "旧账号将被作废，请输入新手机号重新开通（须与原手机号不同）："
  );
  if (!phone) return;
  try {
    const { data } = await reopenMemberAccount(memberId, phone);
    message(`已重新开通，登录用户名：${data.username}`, { type: "success" });
    fetchDetail();
  } catch (error: any) {
    message(bizErrorMessage(error, "重新开通失败"), { type: "error" });
  }
}

/** 启用 / 停用关联账号（后端禁止对自己绑定的账号操作，拒绝时走 bizErrorMessage 兜底文案） */
function handleToggleAccountStatus() {
  if (!detail.value) return;
  const next = detail.value.accountStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
  const action = next === "ACTIVE" ? "启用" : "停用";
  ElMessageBox.confirm(`确定要${action}该队员的登录账号吗？`, "系统提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        await updateMemberAccountStatus(memberId, next);
        message(`${action}成功`, { type: "success" });
        fetchDetail();
      } catch (error: any) {
        message(bizErrorMessage(error, `${action}失败`), { type: "error" });
      }
    })
    .catch(() => {});
}

/**
 * 查看该关联账号的全部授权（含 scoped 绑定）：跳「角色绑定」页并按 principalId 精确预筛。
 * 只在已开通账号时可用（授权绑定挂在 USER 主体，没有 userId 无从查起）。
 */
function goAccountAuthz() {
  if (!detail.value?.userId) return;
  router.push({
    path: "/srvf/org-hr/role-bindings",
    query: {
      principalType: "USER",
      principalId: detail.value.userId,
      principalLabel: detail.value.displayName
    }
  });
}

/* --------------- Tab：证书（复用既有 hook，memberId 由路由参数注入；无队员下拉） --------------- */
const {
  canRead: certCanRead,
  canCreate: certCanCreate,
  canUpdate: certCanUpdate,
  canDelete: certCanDelete,
  canVerify: certCanVerify,
  canReject: certCanReject,
  loading: certLoading,
  columns: certColumns,
  dataList: certDataList,
  certStatusTagType,
  onSearch: certOnSearch,
  openDialog: certOpenDialog,
  handleDelete: certHandleDelete,
  handleVerify: certHandleVerify,
  handleReject: certHandleReject,
  qualCheckType,
  qualCheckCode,
  qualCriterionOptions,
  qualCheckLoading,
  qualCheckResult,
  checkQualification
} = useCertificates(memberId);

/* --------------- Tab：保险（只读，复用 hook，memberId 由路由参数注入；无队员下拉） --------------- */
const {
  canRead: insCanRead,
  canReview: insCanReview,
  summary: insSummary,
  asOfDate: insAsOfDate,
  selfPurchased: insSelfPurchased,
  teamProvided: insTeamProvided,
  selfColumns: insSelfColumns,
  teamColumns: insTeamColumns,
  reviewingId: insReviewingId,
  dateStatusMeta: insDateStatusMeta,
  reviewStatusMeta: insReviewStatusMeta,
  canReviewRow: insCanReviewRow,
  handleReview: insHandleReview,
  loading: insLoading,
  onSearch: insOnSearch
} = useMemberInsurances(memberId);

/* ----------------------------- 头部危险区：一键离队 ----------------------------- */
const canOffboard = hasPerms("member.offboard.record");
const offboarding = ref(false);

/** 把预检结果画成人话清单（只列有内容的那几组，避免一屏全是「0 条」） */
function impactLines(impact: MemberOffboardImpact) {
  const lines: string[] = [];
  const n = (arr: unknown[]) => arr.length;
  if (n(impact.draftInitiatedActivities))
    lines.push(`发起且仍是草稿的活动 ${n(impact.draftInitiatedActivities)} 个`);
  if (n(impact.activeOwnerActivities))
    lines.push(`仍担任负责人的活动 ${n(impact.activeOwnerActivities)} 个`);
  if (n(impact.activeCollaboratorActivities))
    lines.push(
      `仍担任协办的活动 ${n(impact.activeCollaboratorActivities)} 个（仅供知情，不影响离队）`
    );
  if (n(impact.futureRegistrations))
    lines.push(`当前或未来的报名 ${n(impact.futureRegistrations)} 条`);
  if (n(impact.historicalRegistrationsWithEvidence))
    lines.push(
      `有参与记录的历史报名 ${n(impact.historicalRegistrationsWithEvidence)} 条（仅供知情，不影响离队）`
    );
  return lines;
}

/**
 * 一键离队。
 *
 * 先调预检做**真预演**——后端会算出这个人还挂着哪些活动责任与报名，
 * 并直接给出能不能离队（`canOffboard`）。不能离队时只展示原因、不给确定按钮，
 * 而不是让人点下去再吃一个 15037 / 15038。
 * 老后端没有这个预检端点时（404）退化成静态后果清单，仍可继续。
 */
async function handleOffboard() {
  if (!canOffboard || !detail.value) return;

  let impact: MemberOffboardImpact | null = null;
  try {
    const { code, data } = await getMemberOffboardImpact(memberId);
    if (code === 0) impact = data;
  } catch {
    // 预检端点不可用时退化为静态后果清单，不阻断离队本身
  }

  const consequences = h("div", { class: "leading-6" }, [
    impact && impactLines(impact).length
      ? h("div", { class: "mb-2" }, [
          h("p", { class: "font-medium" }, "这个人目前还挂着："),
          h(
            "ul",
            { class: "mt-1 pl-4 list-disc text-xs" },
            impactLines(impact).map(t => h("li", t))
          )
        ])
      : null,
    impact && !impact.canOffboard
      ? h("div", { class: "offboard-block" }, [
          h("p", { class: "font-medium" }, "现在还不能离队："),
          h(
            "ul",
            { class: "mt-1 pl-4 list-disc text-xs" },
            (impact.blockingReasons.length
              ? impact.blockingReasons.map(offboardBlockingReasonText)
              : ["后端未给出具体原因，请联系管理员"]
            ).map(t => h("li", t))
          ),
          h(
            "p",
            { class: "mt-2 text-xs" },
            "按上面每条的做法处理完，再回来办离队。"
          )
        ])
      : h("div", {}, [
          h("p", { class: "font-medium" }, "确认离队后会立刻发生："),
          h("ul", { class: "mt-1 pl-4 list-disc text-xs" }, [
            h("li", "队员状态置为停用"),
            h("li", "结束全部在编的部门 / 小组归属"),
            h("li", "停用关联的登录账号，并让已登录的会话立即失效"),
            h("li", "撤销全部任职与分管"),
            h("li", "结束直接授予的角色绑定")
          ]),
          h("p", { class: "mt-2 font-medium" }, "会保留："),
          h("ul", { class: "mt-1 pl-4 list-disc text-xs" }, [
            h("li", "全部历史记录：报名、考勤、贡献值、证书都不动")
          ]),
          h(
            "p",
            { class: "mt-2 text-xs" },
            "注意：以后重新启用这名队员，只会恢复队员状态，归属、账号、任职不会自动回来，需要重新配。"
          )
        ])
  ]);

  if (impact && !impact.canOffboard) {
    ElMessageBox.alert(consequences, "暂时不能离队", {
      confirmButtonText: "知道了",
      type: "warning"
    }).catch(() => {});
    return;
  }

  try {
    await ElMessageBox.confirm(
      consequences,
      `一键离队 · ${detail.value.displayName}`,
      {
        confirmButtonText: "确定离队",
        cancelButtonText: "再想想",
        type: "warning"
      }
    );
  } catch {
    return;
  }

  offboarding.value = true;
  try {
    const { code, data } = await offboardMember(memberId);
    if (code === 0) {
      // 逐腿计数展示:哪几件事真发生了、各多少条。该操作幂等,失败可原样重试。
      ElMessageBox.alert(
        h("div", { class: "leading-6" }, [
          h("p", "离队已完成，这次实际做了："),
          h("ul", { class: "mt-1 pl-4 list-disc text-xs" }, [
            h(
              "li",
              `队员状态：${data.memberDeactivated ? "已置为停用" : "本来就已停用，未改动"}`
            ),
            h("li", `结束在编归属：${data.membershipsEnded} 条`),
            h(
              "li",
              `登录账号：${data.accountDisabled ? "已停用" : data.linkedUserId ? "本来就已停用" : "没有关联账号"}`
            ),
            h("li", `失效登录凭证：${data.refreshTokensRevoked} 条`)
          ]),
          data.residualActivePositionAssignments > 0 ||
          data.residualActiveSupervisions > 0
            ? h(
                "p",
                { class: "mt-2 text-xs offboard-residual" },
                `注意：仍有 ${data.residualActivePositionAssignments} 条任职、${data.residualActiveSupervisions} 条分管没被收干净，请联系管理员核查。`
              )
            : null
        ]),
        "离队结果",
        { confirmButtonText: "知道了", type: "success" }
      ).catch(() => {});
      fetchDetail();
    }
  } catch (error: any) {
    message(memberOffboardBizErrorMessage(error, "离队失败"), {
      type: "error",
      duration: 8000
    });
  } finally {
    offboarding.value = false;
  }
}

/* --------------- Tab：紧急联系人（CRUD，复用 hook，memberId 由路由参数注入；无队员下拉） --------------- */
const {
  canRead: ecCanRead,
  canCreate: ecCanCreate,
  canUpdate: ecCanUpdate,
  canDelete: ecCanDelete,
  loading: ecLoading,
  columns: ecColumns,
  dataList: ecDataList,
  onSearch: ecOnSearch,
  openDialog: ecOpenDialog,
  handleDelete: ecHandleDelete
} = useEmergencyContacts(memberId);

/* --------------- Tab：组织归属（memberships 多归属，含新增/编辑/结束/迁移写操作;
   旧「部门」tab（deprecated 单值端点 /department）已于 C 档摘除,handoff:「新面一律用 memberships」 --------------- */
const {
  canRead: msCanRead,
  canSet: msCanSet,
  canEnd: msCanEnd,
  canTransfer: msCanTransfer,
  loading: msLoading,
  columns: msColumns,
  dataList: msDataList,
  orgLabel: msOrgLabel,
  typeLabel: msTypeLabel,
  onSearch: msOnSearch,
  openDialog: msOpenDialog,
  handleEnd: msHandleEnd,
  openTransferDialog: msOpenTransferDialog
} = useMemberMemberships(memberId);

/* --------------- Tab：任职（队员轴,双轴子资源只读端;任命/撤销在组织架构页「在任职务」面板） --------------- */
const {
  canRead: paCanRead,
  loading: paLoading,
  columns: paColumns,
  dataList: paDataList,
  positionLabel: paPositionLabel,
  orgLabel: paOrgLabel,
  onSearch: paOnSearch
} = useMemberPositionAssignments(memberId);

/* --------------- Tab：分管范围（该队员若是分管人,只读展示;新建/撤销在分管总表页） --------------- */
const {
  canRead: ssCanRead,
  loading: ssLoading,
  columns: ssColumns,
  dataList: ssDataList,
  scopeModeLabel: ssScopeModeLabel,
  expandedLabels: ssExpandedLabels,
  onSearch: ssOnSearch
} = useMemberSupervisionScope(memberId);

/* --------------- Tab：档案（1:1 子资源：读 + 新建/编辑，memberId 由路由参数注入；无队员下拉） --------------- */
const {
  canRead: profileCanRead,
  canCreate: profileCanCreate,
  canUpdate: profileCanUpdate,
  loading: profileLoading,
  profile: profileData,
  displayRows: profileDisplayRows,
  onSearch: profileOnSearch,
  openDialog: profileOpenDialog
} = useMemberProfile(memberId);

/* --------------- Tab：活动履历（队员跨活动报名,只读;沿队员轴下钻,memberId 由路由参数注入） --------------- */
const {
  canRead: regCanRead,
  loading: regLoading,
  statusFilter: regStatusFilter,
  statusOptions: regStatusOptions,
  columns: regColumns,
  dataList: regDataList,
  pagination: regPagination,
  statusMeta: regStatusMeta,
  onSearch: regOnSearch,
  onFilterChange: regOnFilterChange,
  handleSizeChange: regHandleSizeChange,
  handleCurrentChange: regHandleCurrentChange
} = useMemberRegistrations(memberId);

/* --------------- Tab：考勤记录（仅 approved sheet 内 records,只读） --------------- */
const {
  canRead: arecCanRead,
  loading: arecLoading,
  columns: arecColumns,
  dataList: arecDataList,
  pagination: arecPagination,
  onSearch: arecOnSearch,
  handleSizeChange: arecHandleSizeChange,
  handleCurrentChange: arecHandleCurrentChange
} = useMemberAttendanceRecords(memberId);

/* --------------- Tab：贡献值（生涯累计 capped 总分,只读单值;直接展示别再算） --------------- */
const {
  canRead: contribCanRead,
  loading: contribLoading,
  summary: contribSummary,
  participation: contribParticipation,
  onSearch: contribOnSearch
} = useMemberContribution(memberId);

/** 头部概览：主属部门 / 在任职务（复用组织归属、任职两 tab 已加载的数据与标签解析,零额外请求） */
const primaryOrgName = computed(() => {
  const hit = msDataList.value.find(
    m => m.status === "ACTIVE" && m.membershipType === "PRIMARY"
  );
  return hit ? msOrgLabel(hit.organizationId) : "";
});
const activePositionsText = computed(() =>
  paDataList.value
    .filter(a => a.status === "ACTIVE")
    .map(
      a =>
        `${paPositionLabel(a.positionId)} @ ${paOrgLabel(a.organizationId)}${a.isConcurrent ? "（兼）" : ""}`
    )
    .join("、")
);

onMounted(() => {
  fetchDetail();
  // onSearch 自带 canRead + memberId 守卫；memberId 已由路由注入，有读码即加载对应子资源
  certOnSearch();
  insOnSearch();
  ecOnSearch();
  msOnSearch();
  paOnSearch();
  ssOnSearch();
  profileOnSearch();
  regOnSearch();
  arecOnSearch();
  contribOnSearch();
});
</script>

<template>
  <div class="main">
    <!-- 头部：队员基本信息 -->
    <SrvfDetailShell
      :loading="detailLoading"
      :found="!!detail"
      not-found-text="未找到该队员或无权查看"
      back-text="返回队员列表"
      @back="router.push('/srvf/members-domain/members')"
    >
      <template #title>
        <span class="cockpit-header__name">{{ detail.displayName }}</span>
        <el-tag :type="detail.status === 'ACTIVE' ? 'success' : 'info'">
          {{ detail.status === "ACTIVE" ? "在队" : "离队" }}
        </el-tag>
        <el-tag v-if="!detail.hasAccount" type="info" effect="plain">
          账号：未开通
        </el-tag>
        <el-tag
          v-else
          :type="detail.accountStatus === 'ACTIVE' ? 'success' : 'danger'"
          effect="plain"
        >
          账号：{{ detail.accountStatus === "ACTIVE" ? "已开通" : "已停用" }}
        </el-tag>
      </template>
      <template #actions>
        <el-button
          v-if="canOpenGrantWizard"
          type="primary"
          plain
          @click="grantWizardVisible = true"
        >
          授权
        </el-button>
        <!-- 危险区:一键离队(单独码门);预检与后果清单都在弹窗里 -->
        <el-button
          v-if="canOffboard && detail.status === 'ACTIVE'"
          type="danger"
          plain
          :loading="offboarding"
          @click="handleOffboard"
        >
          一键离队
        </el-button>
      </template>
      <template #overview>
        <el-descriptions :column="3" border class="mt-3">
          <el-descriptions-item label="队员编号">
            {{ detail.memberNo }}
          </el-descriptions-item>
          <el-descriptions-item label="等级">
            {{ dict.label("member_grade", detail.gradeCode) }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{
              detail.createdAt
                ? dayjs(detail.createdAt).format("YYYY-MM-DD HH:mm")
                : "—"
            }}
          </el-descriptions-item>
          <el-descriptions-item label="主属部门">
            {{ primaryOrgName || "—" }}
          </el-descriptions-item>
          <el-descriptions-item label="在任职务" :span="2">
            {{ activePositionsText || "—" }}
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <!-- Tab：证书（复用证书 list hook，无需再选队员） -->
      <el-tabs v-model="activeTab" class="cockpit-tabs">
        <!-- Tab：档案（1:1 扩展档案，读 + 新建/编辑；字典字段已翻中文；无档案 → 空态 + 新建） -->
        <el-tab-pane label="档案" name="profile">
          <template v-if="profileCanRead">
            <el-card v-loading="profileLoading" shadow="never">
              <template v-if="profileData">
                <div v-if="profileCanUpdate" class="profile-pane__actions">
                  <el-button
                    type="primary"
                    :icon="useRenderIcon(EditPen)"
                    @click="profileOpenDialog('编辑', profileData)"
                  >
                    编辑档案
                  </el-button>
                </div>
                <el-descriptions :column="2" border>
                  <el-descriptions-item
                    v-for="row in profileDisplayRows"
                    :key="row.label"
                    :label="row.label"
                    :span="row.span ?? 1"
                  >
                    {{ row.value }}
                  </el-descriptions-item>
                </el-descriptions>
              </template>
              <el-empty
                v-else-if="!profileLoading"
                description="该队员暂无扩展档案"
              >
                <el-button
                  v-if="profileCanCreate"
                  type="primary"
                  :icon="useRenderIcon(AddFill)"
                  @click="profileOpenDialog('新建')"
                >
                  新建档案
                </el-button>
              </el-empty>
            </el-card>
          </template>
          <SrvfPermEmpty
            v-else
            action="查看队员档案"
            code="member-profile.read.record"
          />
        </el-tab-pane>

        <!-- Tab：组织归属（memberships 多归属;组织名经 resolveLabels 解析；新增/编辑/结束/迁移写操作） -->
        <el-tab-pane label="组织归属" name="memberships">
          <template v-if="msCanRead">
            <PureTableBar
              title="组织归属（多归属）"
              :columns="msColumns"
              @refresh="msOnSearch"
            >
              <template #buttons>
                <el-button
                  v-if="msCanSet"
                  type="primary"
                  :icon="useRenderIcon(AddFill)"
                  @click="msOpenDialog('新增')"
                >
                  新增归属
                </el-button>
              </template>
              <template v-slot="{ size, dynamicColumns }">
                <pure-table
                  row-key="id"
                  adaptive
                  :adaptiveConfig="{ offsetBottom: 108 }"
                  align-whole="center"
                  table-layout="auto"
                  :loading="msLoading"
                  :size="size"
                  :data="msDataList"
                  :columns="dynamicColumns"
                  :header-cell-style="{
                    background: 'var(--el-fill-color-light)',
                    color: 'var(--el-text-color-primary)'
                  }"
                >
                  <template #organization="{ row }">
                    {{ msOrgLabel(row.organizationId) }}
                  </template>
                  <template #membershipType="{ row }">
                    <el-tag
                      :type="
                        row.membershipType === 'PRIMARY' ? 'primary' : 'info'
                      "
                    >
                      {{ msTypeLabel(row.membershipType) }}
                    </el-tag>
                  </template>
                  <template #status="{ row }">
                    <SrvfStatusTag
                      :value="row.status"
                      :label-dict="MEMBERSHIP_STATUS_LABEL"
                      :tag-dict="MEMBERSHIP_STATUS_TAG"
                    />
                  </template>
                  <template #operation="{ row }">
                    <el-button
                      v-if="msCanSet"
                      class="reset-margin"
                      link
                      :size="size"
                      :icon="useRenderIcon(EditPen)"
                      @click="msOpenDialog('编辑', row)"
                    >
                      编辑
                    </el-button>
                    <el-button
                      v-if="msCanTransfer && row.status === 'ACTIVE'"
                      class="reset-margin"
                      link
                      type="warning"
                      :size="size"
                      @click="msOpenTransferDialog(row)"
                    >
                      迁移
                    </el-button>
                    <el-button
                      v-if="msCanEnd && row.status === 'ACTIVE'"
                      class="reset-margin"
                      link
                      type="danger"
                      :size="size"
                      @click="msHandleEnd(row)"
                    >
                      结束
                    </el-button>
                  </template>
                </pure-table>
              </template>
            </PureTableBar>
          </template>
          <SrvfPermEmpty
            v-else
            action="查看组织归属"
            code="membership.list.record"
          />
        </el-tab-pane>

        <!-- Tab：任职（队员轴,只读全历史;任命/撤销在组织架构页「在任职务」面板） -->
        <el-tab-pane label="任职" name="position-assignments">
          <template v-if="paCanRead">
            <PureTableBar
              title="任职历史（ACTIVE/ENDED/REVOKED 全量）"
              :columns="paColumns"
              @refresh="paOnSearch"
            >
              <template v-slot="{ size, dynamicColumns }">
                <pure-table
                  row-key="id"
                  adaptive
                  :adaptiveConfig="{ offsetBottom: 108 }"
                  align-whole="center"
                  table-layout="auto"
                  :loading="paLoading"
                  :size="size"
                  :data="paDataList"
                  :columns="dynamicColumns"
                  :header-cell-style="{
                    background: 'var(--el-fill-color-light)',
                    color: 'var(--el-text-color-primary)'
                  }"
                >
                  <template #position="{ row }">
                    {{ paPositionLabel(row.positionId) }}
                  </template>
                  <template #organization="{ row }">
                    {{ paOrgLabel(row.organizationId) }}
                  </template>
                  <template #status="{ row }">
                    <SrvfStatusTag
                      :value="row.status"
                      :label-dict="ASSIGNMENT_STATUS_LABEL"
                      :tag-dict="ASSIGNMENT_STATUS_TAG"
                    />
                  </template>
                  <template #isConcurrent="{ row }">
                    <el-tag :type="row.isConcurrent ? 'warning' : 'info'">
                      {{ row.isConcurrent ? "是" : "否" }}
                    </el-tag>
                  </template>
                </pure-table>
              </template>
            </PureTableBar>
          </template>
          <SrvfPermEmpty
            v-else
            action="查看任职"
            code="position-assignment.read.record"
          />
        </el-tab-pane>

        <!-- Tab：分管范围（该队员若是分管人,只读;新建/撤销在分管总表页） -->
        <el-tab-pane label="分管范围" name="supervision-scope">
          <template v-if="ssCanRead">
            <PureTableBar
              title="分管范围（若无记录,说明该队员当前无分管职责）"
              :columns="ssColumns"
              @refresh="ssOnSearch"
            >
              <template v-slot="{ size, dynamicColumns }">
                <pure-table
                  row-key="supervisionAssignmentId"
                  adaptive
                  :adaptiveConfig="{ offsetBottom: 108 }"
                  align-whole="center"
                  table-layout="auto"
                  :loading="ssLoading"
                  :size="size"
                  :data="ssDataList"
                  :columns="dynamicColumns"
                  :header-cell-style="{
                    background: 'var(--el-fill-color-light)',
                    color: 'var(--el-text-color-primary)'
                  }"
                >
                  <template #scopeMode="{ row }">
                    <el-tag
                      :type="row.scopeMode === 'TREE' ? 'primary' : 'info'"
                    >
                      {{ ssScopeModeLabel(row.scopeMode) }}
                    </el-tag>
                  </template>
                </pure-table>
                <p v-if="ssDataList.length" class="ss-expanded-hint">
                  <template
                    v-for="(row, i) in ssDataList"
                    :key="row.supervisionAssignmentId"
                  >
                    展开覆盖：{{ ssExpandedLabels(row)
                    }}<template v-if="i < ssDataList.length - 1"
                      ><br
                    /></template>
                  </template>
                </p>
              </template>
            </PureTableBar>
          </template>
          <SrvfPermEmpty
            v-else
            action="查看分管范围"
            code="supervision-assignment.read.record"
          />
        </el-tab-pane>

        <el-tab-pane label="证书" name="certificates">
          <template v-if="certCanRead">
            <el-card shadow="never" class="mb-4">
              <template #header>资质核验</template>
              <div class="qual-check-row">
                <!-- 判据两段：先选按大类还是按具体标准，再选具体判据 -->
                <el-select v-model="qualCheckType" class="w-32!">
                  <el-option label="按大类" value="category" />
                  <el-option label="按标准" value="standard" />
                </el-select>
                <el-select
                  v-model="qualCheckCode"
                  filterable
                  clearable
                  :placeholder="
                    qualCheckType === 'category'
                      ? '选择证书大类'
                      : '选择证书标准'
                  "
                  class="w-64!"
                >
                  <el-option
                    v-for="opt in qualCriterionOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
                <el-button
                  type="primary"
                  :loading="qualCheckLoading"
                  :disabled="!qualCheckCode"
                  @click="checkQualification"
                >
                  核验
                </el-button>
                <template v-if="qualCheckResult">
                  <el-tag
                    :type="qualCheckResult.qualified ? 'success' : 'danger'"
                    size="large"
                  >
                    {{ qualCheckResult.qualified ? "具备资质" : "不具备资质" }}
                    <template v-if="qualCheckResult.qualified">
                      （{{
                        qualCheckResult.expiredAt
                          ? `有效期至 ${qualCheckResult.expiredAt.slice(0, 10)}`
                          : "终身有效"
                      }}）
                    </template>
                  </el-tag>
                </template>
              </div>
              <div class="qual-check-hint">
                判定 = 已核验 + 未过期 +
                未软删；只返回布尔结果，不代表队员没有该类型的其他证书记录（如待核验/已驳回）。
              </div>
            </el-card>
            <PureTableBar
              title="队员证书"
              :columns="certColumns"
              @refresh="certOnSearch"
            >
              <template #buttons>
                <el-button
                  v-if="certCanCreate"
                  type="primary"
                  :icon="useRenderIcon(AddFill)"
                  @click="certOpenDialog('新建')"
                >
                  新建
                </el-button>
              </template>
              <template v-slot="{ size, dynamicColumns }">
                <pure-table
                  row-key="id"
                  adaptive
                  :adaptiveConfig="{ offsetBottom: 108 }"
                  align-whole="center"
                  table-layout="auto"
                  :loading="certLoading"
                  :size="size"
                  :data="certDataList"
                  :columns="dynamicColumns"
                  :header-cell-style="{
                    background: 'var(--el-fill-color-light)',
                    color: 'var(--el-text-color-primary)'
                  }"
                >
                  <template #certStatusCode="{ row }">
                    <el-tag :type="certStatusTagType(row.certStatusCode)">
                      {{ dict.label("cert_status", row.certStatusCode) }}
                    </el-tag>
                  </template>
                  <template #operation="{ row }">
                    <el-button
                      v-if="certCanUpdate"
                      class="reset-margin"
                      link
                      :size="size"
                      :icon="useRenderIcon(EditPen)"
                      @click="certOpenDialog('编辑', row)"
                    >
                      编辑
                    </el-button>
                    <el-button
                      v-if="certCanVerify && row.certStatusCode === 'pending'"
                      class="reset-margin"
                      link
                      type="success"
                      :size="size"
                      @click="certHandleVerify(row)"
                    >
                      核验通过
                    </el-button>
                    <el-button
                      v-if="certCanReject && row.certStatusCode === 'pending'"
                      class="reset-margin"
                      link
                      type="warning"
                      :size="size"
                      @click="certHandleReject(row)"
                    >
                      核验驳回
                    </el-button>
                    <el-button
                      v-if="certCanDelete"
                      class="reset-margin"
                      link
                      type="danger"
                      :size="size"
                      :icon="useRenderIcon(Delete)"
                      @click="certHandleDelete(row)"
                    >
                      删除
                    </el-button>
                  </template>
                </pure-table>
              </template>
            </PureTableBar>
          </template>
          <SrvfPermEmpty
            v-else
            action="查看证书"
            code="certificate.read.record"
          />
        </el-tab-pane>

        <!-- Tab：保险（主源=统一概览：自购可审 + 队内覆盖只读投影） -->
        <el-tab-pane label="保险" name="insurances">
          <template v-if="insCanRead">
            <el-card v-loading="insLoading" shadow="never" class="mb-4">
              <template #header>
                <div class="ins-head">
                  <span>保险概览</span>
                  <el-tag
                    v-if="insSummary"
                    :type="insSummary.hasConfirmedCoverage ? 'success' : 'info'"
                  >
                    {{
                      insSummary.hasConfirmedCoverage
                        ? "已有确认的保险来源"
                        : "暂无确认的保险来源"
                    }}
                  </el-tag>
                </div>
              </template>
              <div v-if="insSummary" class="ins-summary">
                <el-statistic
                  title="自购·日期有效"
                  :value="insSummary.dateActiveSelfPurchasedCount"
                />
                <el-statistic
                  title="自购·已确认"
                  :value="insSummary.confirmedActiveSelfPurchasedCount"
                />
                <el-statistic
                  title="队内覆盖·日期有效"
                  :value="insSummary.dateActiveTeamProvidedCount"
                />
              </div>
              <div class="ins-note">
                按 {{ insAsOfDate || "今日" }} 计算。
                <template v-if="insSummary?.confirmedCoverageThrough">
                  已确认的保险最晚覆盖到
                  {{
                    dayjs(insSummary.confirmedCoverageThrough).format(
                      "YYYY-MM-DD"
                    )
                  }}。
                </template>
                <strong
                  >这只是保险资料的核对结果，不能替代活动审批或入队时的资格判定。</strong
                >
              </div>
            </el-card>

            <PureTableBar
              title="个人自购"
              :columns="insSelfColumns"
              @refresh="insOnSearch"
            >
              <template v-slot="{ size, dynamicColumns }">
                <pure-table
                  row-key="id"
                  align-whole="center"
                  table-layout="auto"
                  :loading="insLoading"
                  :size="size"
                  :data="insSelfPurchased"
                  :columns="dynamicColumns"
                  :header-cell-style="{
                    background: 'var(--el-fill-color-light)',
                    color: 'var(--el-text-color-primary)'
                  }"
                >
                  <template #empty>
                    <el-empty description="该队员没有自己买的保险记录" />
                  </template>
                  <template #dateStatus="{ row }">
                    <el-tag :type="insDateStatusMeta(row.dateStatus).type">
                      {{ insDateStatusMeta(row.dateStatus).text }}
                    </el-tag>
                  </template>
                  <template #reviewStatus="{ row }">
                    <el-tag
                      :type="insReviewStatusMeta(row.reviewStatusCode).type"
                    >
                      {{ insReviewStatusMeta(row.reviewStatusCode).text }}
                    </el-tag>
                  </template>
                  <template #operation="{ row, size: btnSize }">
                    <!-- 只有待核验的行才给动作;其余状态后端只会返 26012 -->
                    <template v-if="insCanReviewRow(row)">
                      <el-button
                        class="reset-margin"
                        link
                        type="success"
                        :size="btnSize"
                        :loading="insReviewingId === row.id"
                        @click="insHandleReview(row, 'verified')"
                      >
                        核验通过
                      </el-button>
                      <el-button
                        class="reset-margin"
                        link
                        type="danger"
                        :size="btnSize"
                        :loading="insReviewingId === row.id"
                        @click="insHandleReview(row, 'rejected')"
                      >
                        驳回
                      </el-button>
                    </template>
                    <span v-else class="ins-muted">已审核</span>
                  </template>
                </pure-table>
              </template>
            </PureTableBar>

            <PureTableBar
              title="队内统一投保"
              :columns="insTeamColumns"
              class="mt-4"
              @refresh="insOnSearch"
            >
              <template v-slot="{ size, dynamicColumns }">
                <pure-table
                  row-key="coverageId"
                  align-whole="center"
                  table-layout="auto"
                  :loading="insLoading"
                  :size="size"
                  :data="insTeamProvided"
                  :columns="dynamicColumns"
                  :header-cell-style="{
                    background: 'var(--el-fill-color-light)',
                    color: 'var(--el-text-color-primary)'
                  }"
                >
                  <template #empty>
                    <el-empty
                      description="该队员不在任何队内统一保单的覆盖名单里"
                    />
                  </template>
                  <template #dateStatus="{ row }">
                    <el-tag :type="insDateStatusMeta(row.dateStatus).type">
                      {{ insDateStatusMeta(row.dateStatus).text }}
                    </el-tag>
                  </template>
                </pure-table>
              </template>
            </PureTableBar>
            <div class="ins-note mt-2">
              队内统一投保这一块是只读投影：这里不显示保单号与备注，也没有审核动作。
              保单明细与覆盖名单请到「队员 → 队保单」维护。
            </div>
          </template>
          <SrvfPermEmpty
            v-else
            action="查看保险"
            code="member-insurance.read.other"
          />
        </el-tab-pane>

        <!-- Tab：紧急联系人（CRUD，复用 list hook，无需再选队员） -->
        <el-tab-pane label="紧急联系人" name="emergency-contacts">
          <template v-if="ecCanRead">
            <PureTableBar
              title="紧急联系人"
              :columns="ecColumns"
              @refresh="ecOnSearch"
            >
              <template #buttons>
                <el-button
                  v-if="ecCanCreate"
                  type="primary"
                  :icon="useRenderIcon(AddFill)"
                  @click="ecOpenDialog('新建')"
                >
                  新建
                </el-button>
              </template>
              <template v-slot="{ size, dynamicColumns }">
                <pure-table
                  row-key="id"
                  adaptive
                  :adaptiveConfig="{ offsetBottom: 108 }"
                  align-whole="center"
                  table-layout="auto"
                  :loading="ecLoading"
                  :size="size"
                  :data="ecDataList"
                  :columns="dynamicColumns"
                  :header-cell-style="{
                    background: 'var(--el-fill-color-light)',
                    color: 'var(--el-text-color-primary)'
                  }"
                >
                  <template #operation="{ row }">
                    <el-button
                      v-if="ecCanUpdate"
                      class="reset-margin"
                      link
                      :size="size"
                      :icon="useRenderIcon(EditPen)"
                      @click="ecOpenDialog('编辑', row)"
                    >
                      编辑
                    </el-button>
                    <el-button
                      v-if="ecCanDelete"
                      class="reset-margin"
                      link
                      type="danger"
                      :size="size"
                      :icon="useRenderIcon(Delete)"
                      @click="ecHandleDelete(row)"
                    >
                      删除
                    </el-button>
                  </template>
                </pure-table>
              </template>
            </PureTableBar>
          </template>
          <SrvfPermEmpty
            v-else
            action="查看紧急联系人"
            code="emergency-contact.read.record"
          />
        </el-tab-pane>

        <!-- Tab：活动履历（队员跨活动报名,只读;状态可过滤） -->
        <el-tab-pane label="活动履历" name="registrations-history">
          <template v-if="regCanRead">
            <PureTableBar
              title="活动履历"
              :columns="regColumns"
              @refresh="regOnSearch"
            >
              <template #buttons>
                <el-select
                  v-model="regStatusFilter"
                  class="w-40!"
                  placeholder="按状态过滤"
                  @change="regOnFilterChange"
                >
                  <el-option
                    v-for="opt in regStatusOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </template>
              <template v-slot="{ size, dynamicColumns }">
                <pure-table
                  row-key="id"
                  adaptive
                  :adaptiveConfig="{ offsetBottom: 108 }"
                  align-whole="center"
                  table-layout="auto"
                  :loading="regLoading"
                  :size="size"
                  :data="regDataList"
                  :columns="dynamicColumns"
                  :pagination="regPagination"
                  :paginationSmall="size === 'small' ? true : false"
                  :header-cell-style="{
                    background: 'var(--el-fill-color-light)',
                    color: 'var(--el-text-color-primary)'
                  }"
                  @page-size-change="regHandleSizeChange"
                  @page-current-change="regHandleCurrentChange"
                >
                  <template #statusCode="{ row }">
                    <el-tag :type="regStatusMeta(row.statusCode).type">
                      {{ regStatusMeta(row.statusCode).text }}
                    </el-tag>
                  </template>
                </pure-table>
              </template>
            </PureTableBar>
          </template>
          <SrvfPermEmpty
            v-else
            action="查看活动履历"
            code="activity-registration.read.record"
          />
        </el-tab-pane>

        <!-- Tab：考勤记录（仅 approved sheet 内已生效 records,只读） -->
        <el-tab-pane label="考勤记录" name="attendance-records">
          <template v-if="arecCanRead">
            <PureTableBar
              title="考勤记录（仅已生效）"
              :columns="arecColumns"
              @refresh="arecOnSearch"
            >
              <template v-slot="{ size, dynamicColumns }">
                <pure-table
                  row-key="id"
                  adaptive
                  :adaptiveConfig="{ offsetBottom: 108 }"
                  align-whole="center"
                  table-layout="auto"
                  :loading="arecLoading"
                  :size="size"
                  :data="arecDataList"
                  :columns="dynamicColumns"
                  :pagination="arecPagination"
                  :paginationSmall="size === 'small' ? true : false"
                  :header-cell-style="{
                    background: 'var(--el-fill-color-light)',
                    color: 'var(--el-text-color-primary)'
                  }"
                  @page-size-change="arecHandleSizeChange"
                  @page-current-change="arecHandleCurrentChange"
                />
              </template>
            </PureTableBar>
          </template>
          <SrvfPermEmpty
            v-else
            action="查看考勤记录"
            code="attendance.read.sheet"
          />
        </el-tab-pane>

        <!-- Tab：贡献值（生涯累计 capped 总分,后端实时算,直接展示别再加） -->
        <el-tab-pane label="贡献值" name="contribution">
          <template v-if="contribCanRead">
            <el-card v-loading="contribLoading" shadow="never">
              <template #header>参与汇总</template>
              <!-- 四个数都由后端按已终审单据算好,前端只展示不再加总 -->
              <div class="participation-summary">
                <el-statistic
                  :value="
                    contribSummary
                      ? Number(contribSummary.contributionPoints)
                      : 0
                  "
                  :precision="2"
                >
                  <!--
                    封顶规则放在数字旁边而不是只写在脚注里：看数的人会问
                    「我干了一整天为什么只加 1.5」，答案要在他看数的地方。
                  -->
                  <template #title>
                    <SrvfFormLabelTip
                      label="生涯累计贡献值"
                      tip="同一个北京日内，无论参加几场活动、干了多少小时，当天最多计 1.5 分。这里显示的是按此规则封顶后的累计值。"
                    />
                  </template>
                </el-statistic>
                <el-statistic
                  title="生效时长（小时）"
                  :value="
                    contribParticipation
                      ? Number(contribParticipation.totalServiceHours)
                      : 0
                  "
                  :precision="2"
                />
                <el-statistic
                  title="参与活动数"
                  :value="contribParticipation?.activityCount ?? 0"
                />
                <el-statistic
                  title="考勤记录数"
                  :value="contribParticipation?.recordCount ?? 0"
                />
              </div>
              <div class="contribution-hint">
                这几个数都只统计<strong>已终审</strong>的考勤单，由后端实时计算（贡献值按北京日封顶
                1.5 计），前端直接展示、不再自行加总。
              </div>
            </el-card>
          </template>
          <SrvfPermEmpty
            v-else
            action="查看贡献值"
            code="attendance.read.sheet"
          />
        </el-tab-pane>

        <!-- Tab：账号（队员账号闭环；字段随头部详情一并到手，开号/绑定归 ops-admin，启停复用用户管理码） -->
        <el-tab-pane label="账号" name="account">
          <el-card v-loading="detailLoading" shadow="never">
            <template v-if="detail">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="账号状态">
                  <el-tag v-if="!detail.hasAccount" type="info">未开通</el-tag>
                  <el-tag
                    v-else
                    :type="
                      detail.accountStatus === 'ACTIVE' ? 'success' : 'danger'
                    "
                  >
                    {{
                      detail.accountStatus === "ACTIVE"
                        ? "已开通 · 正常"
                        : "已开通 · 已停用"
                    }}
                  </el-tag>
                  <span v-if="detail.userId" class="account-id-caption">
                    账号 ID：{{ detail.userId }}
                  </span>
                </el-descriptions-item>
                <el-descriptions-item
                  v-if="detail.hasAccount && linkedAccountLastLoginAt"
                  label="最近登录"
                >
                  {{
                    dayjs(linkedAccountLastLoginAt).format("YYYY-MM-DD HH:mm")
                  }}
                </el-descriptions-item>
              </el-descriptions>
              <div class="account-actions">
                <template v-if="!detail.hasAccount">
                  <el-button
                    v-if="canGrantAccount && detail.status === 'ACTIVE'"
                    type="primary"
                    @click="handleGrantAccount"
                  >
                    开通账号
                  </el-button>
                  <el-button
                    v-if="canBindAccount"
                    @click="openBindAccountDialog"
                  >
                    绑定既有账号
                  </el-button>
                </template>
                <template v-else>
                  <el-button
                    v-if="canUpdateAccountStatus"
                    :type="
                      detail.accountStatus === 'ACTIVE' ? 'warning' : 'success'
                    "
                    @click="handleToggleAccountStatus"
                  >
                    {{
                      detail.accountStatus === "ACTIVE"
                        ? "停用账号"
                        : "启用账号"
                    }}
                  </el-button>
                  <el-button
                    v-if="canGrantAccount && detail.status === 'ACTIVE'"
                    @click="handleReopenAccount"
                  >
                    作废并重新开通
                  </el-button>
                  <el-button
                    v-if="canBindAccount"
                    type="danger"
                    @click="handleUnbindAccount"
                  >
                    解绑账号
                  </el-button>
                  <el-button
                    v-if="canViewAccountAuthz"
                    link
                    @click="goAccountAuthz"
                  >
                    查看授权
                  </el-button>
                </template>
              </div>
              <p v-if="!canManageAccountInCurrentState" class="account-hint">
                账号操作需要账号管理权限（开号/绑定归系统管理员），如需操作请联系拥有相应权限的管理员。
              </p>
            </template>
            <el-empty
              v-else-if="!detailLoading"
              description="未找到该队员或无权查看"
            />
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </SrvfDetailShell>

    <GrantWizard
      v-if="detail"
      v-model="grantWizardVisible"
      :preset-member="{ id: memberId, label: detail.displayName }"
    />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}

.qual-check-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.qual-check-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.cockpit-header__name {
  font-size: 18px;
  font-weight: 600;
}

.profile-pane__actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.account-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.account-hint {
  margin-top: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.account-id-caption {
  margin-left: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.contribution-hint {
  margin-top: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.ins-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.ins-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
}

.ins-note {
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.ins-muted {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.participation-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
}

.offboard-block {
  padding: 8px 10px;
  margin-top: 4px;
  background: var(--el-color-warning-light-9);
  border-radius: 4px;
}

.offboard-residual {
  color: var(--el-color-warning);
}
</style>
