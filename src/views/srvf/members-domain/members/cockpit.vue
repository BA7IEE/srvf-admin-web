<script setup lang="ts">
import { bizErrorMessage } from "@/api/srvf-error";
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
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
import { SrvfStatusTag, SrvfDetailShell } from "@/srvf-kit";
import {
  MEMBERSHIP_STATUS_LABEL,
  MEMBERSHIP_STATUS_TAG
} from "@/api/srvf-labels";
import {
  getMember,
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
>("certificates");

/* ----------------------------- 头部：队员基本信息 ----------------------------- */
const detail = ref<MemberItem | null>(null);
const detailLoading = ref(false);

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
    "解绑后该账号将成为悬空账号（不会停用或删除该账号本身），确定解绑吗？",
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
    "退号重开",
    "旧账号将被作废，请输入新手机号重新开通（须与原手机号不同）："
  );
  if (!phone) return;
  try {
    const { data } = await reopenMemberAccount(memberId, phone);
    message(`已重新开通，登录用户名：${data.username}`, { type: "success" });
    fetchDetail();
  } catch (error: any) {
    message(bizErrorMessage(error, "退号重开失败"), { type: "error" });
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
  qualCheckCertType,
  qualCheckLoading,
  qualCheckResult,
  checkQualification
} = useCertificates(memberId);

/* --------------- Tab：保险（只读，复用 hook，memberId 由路由参数注入；无队员下拉） --------------- */
const {
  canRead: insCanRead,
  loading: insLoading,
  columns: insColumns,
  dataList: insDataList,
  isActive: insIsActive,
  onSearch: insOnSearch
} = useMemberInsurances(memberId);

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
  statusMeta: paStatusMeta,
  onSearch: paOnSearch
} = useMemberPositionAssignments(memberId);

/* --------------- Tab：分管范围（该队员若是分管人,只读展示;新建/撤销在督导总表页） --------------- */
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
        <el-tab-pane label="证书" name="certificates">
          <template v-if="certCanRead">
            <el-card shadow="never" class="mb-4">
              <template #header>资质核验</template>
              <div class="qual-check-row">
                <el-select
                  v-model="qualCheckCertType"
                  filterable
                  clearable
                  placeholder="选择证书大类"
                  class="w-64!"
                >
                  <el-option
                    v-for="opt in dict.options('cert_type')"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
                <el-button
                  type="primary"
                  :loading="qualCheckLoading"
                  :disabled="!qualCheckCertType"
                  @click="checkQualification"
                >
                  核验
                </el-button>
                <template v-if="qualCheckResult">
                  <el-tag
                    :type="qualCheckResult.qualified ? 'success' : 'danger'"
                    size="large"
                  >
                    {{
                      dict.label("cert_type", qualCheckResult.certTypeCode)
                    }}：{{
                      qualCheckResult.qualified ? "具备资质" : "不具备资质"
                    }}
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
                  <template #isInternal="{ row }">
                    <el-tag :type="row.isInternal ? 'warning' : 'info'">
                      {{ row.isInternal ? "内部" : "外部" }}
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

        <!-- Tab：保险（只读；admin 侧契约仅 GET，无写操作） -->
        <el-tab-pane label="保险" name="insurances">
          <template v-if="insCanRead">
            <PureTableBar
              title="队员保险"
              :columns="insColumns"
              @refresh="insOnSearch"
            >
              <template v-slot="{ size, dynamicColumns }">
                <pure-table
                  row-key="id"
                  adaptive
                  :adaptiveConfig="{ offsetBottom: 108 }"
                  align-whole="center"
                  table-layout="auto"
                  :loading="insLoading"
                  :size="size"
                  :data="insDataList"
                  :columns="dynamicColumns"
                  :header-cell-style="{
                    background: 'var(--el-fill-color-light)',
                    color: 'var(--el-text-color-primary)'
                  }"
                >
                  <template #validity="{ row }">
                    <el-tag :type="insIsActive(row) ? 'success' : 'info'">
                      {{ insIsActive(row) ? "有效" : "已过期" }}
                    </el-tag>
                  </template>
                </pure-table>
              </template>
            </PureTableBar>
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
                    <el-tag :type="paStatusMeta(row.status).type">
                      {{ paStatusMeta(row.status).text }}
                    </el-tag>
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

        <!-- Tab：分管范围（该队员若是分管人,只读;新建/撤销在督导总表页） -->
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
                    退号重开
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
              <el-statistic
                title="生涯累计贡献值"
                :value="
                  contribSummary ? Number(contribSummary.contributionPoints) : 0
                "
                :precision="2"
              />
              <div class="contribution-hint">
                后端实时算 capped 总分（approved 考勤 + 北京日封顶
                1.5）,前端直接展示。
              </div>
            </el-card>
          </template>
          <SrvfPermEmpty
            v-else
            action="查看贡献值"
            code="attendance.read.sheet"
          />
        </el-tab-pane>
      </el-tabs>
    </SrvfDetailShell>
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
</style>
