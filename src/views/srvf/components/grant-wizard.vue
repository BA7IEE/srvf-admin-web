<script setup lang="ts">
import { ref, computed, watch } from "vue";
import dayjs from "dayjs";
import { hasPerms } from "@/utils/auth";
import { message } from "@/utils/message";
import { bizErrorMessage } from "@/api/srvf-error";
import { SrvfFlowSteps } from "@/srvf-kit";
import { getMember } from "@/api/srvf-member";
import { resolveLabelMap } from "@/api/srvf-meta";
import {
  getMemberOptions,
  getMemberPositionAssignments,
  previewPositionAssignment,
  createPositionAssignment,
  type MemberOptionItem,
  type PositionAssignmentItem,
  type PositionAssignmentViolation
} from "@/api/srvf-position-assignment";
import { getOrgOptions, type OrgOptionItem } from "@/api/srvf-organization";
import {
  getPositionOptions,
  type PositionOptionItem
} from "@/api/srvf-position";
import {
  getRoleOptions,
  assignUserRbacRole,
  type RoleOptionItem
} from "@/api/srvf-role";
import {
  previewRoleBinding,
  createRoleBinding,
  SCOPE_TYPE_LABEL,
  type RoleBindingPreviewConflict
} from "@/api/srvf-role-binding";

defineOptions({
  name: "SrvfGrantWizard"
});

/**
 * 授权向导（UX 升级蓝图 §4.5-D,W3 走查的解法）:把「任命职务 / 授予考勤终审权 /
 * 授予全局业务角色」三个高频授权任务包成 选人 → 选场景 → 预演确认 三步。
 * 向导只是「翻译器」——底层调的仍是任命/角色绑定/用户角色三套既有端点,
 * 场景 A/B 提交前必经后端 preview 预演(dry-run),违规信息用后端返回的中文原文。
 * 专业字段全集仍在「队务设置 → 角色绑定」的高级表单里,本向导不取代它。
 */
const props = defineProps<{
  /** 入口预置的队员（如队员档案页头进入）;传入即锁定第一步 */
  presetMember?: { id: string; label: string };
  /** 入口预置的组织（如组织架构行内进入,预填场景 A 的组织） */
  presetOrgId?: string;
}>();

const visible = defineModel<boolean>({ required: true });
const emit = defineEmits<{ (e: "granted"): void }>();

/** 三个场景各自的写权限码（真实 RBAC 码,与对应页面/端点一致） */
const canAppoint = hasPerms("position-assignment.create.record");
const canBindScoped = hasPerms("role-binding.create.record");
const canAssignGlobal = hasPerms("rbac.user-role.create");

const WIZARD_STEPS = [
  { title: "选人", description: "要授权给谁" },
  { title: "选场景", description: "想让 TA 做什么" },
  { title: "预演确认", description: "系统先检查再提交" }
];
const step = ref(1);
const submitting = ref(false);

/* ----------------------------- 第 1 步 · 选人 ----------------------------- */
const memberOptions = ref<MemberOptionItem[]>([]);
const memberSearching = ref(false);
const memberId = ref("");
const memberLabel = computed(
  () =>
    memberOptions.value.find(m => m.id === memberId.value)?.label ??
    props.presetMember?.label ??
    ""
);
/** 场景 C 需要队员关联的登录账号（getMember 补 userId;失败不阻塞 A/B） */
const memberUserId = ref<string | null>(null);
const memberDetailLoaded = ref(false);

async function searchMembers(q: string) {
  memberSearching.value = true;
  try {
    const { code, data } = await getMemberOptions({ q, limit: 20 });
    if (code === 0) memberOptions.value = data.items;
  } catch {
    memberOptions.value = [];
  } finally {
    memberSearching.value = false;
  }
}

async function loadMemberDetail() {
  memberDetailLoaded.value = false;
  memberUserId.value = null;
  if (!memberId.value) return;
  try {
    const { code, data } = await getMember(memberId.value);
    if (code === 0) memberUserId.value = data.userId ?? null;
  } catch {
    // 拿不到详情只影响场景 C 的账号提示,不阻塞
  } finally {
    memberDetailLoaded.value = true;
  }
}

/* ----------------------------- 第 2 步 · 选场景 ----------------------------- */
type Scenario = "appoint" | "final-review" | "global-role";
const scenario = ref<Scenario | "">("");

const scenarioCards = computed(() => [
  {
    key: "appoint" as const,
    title: "任命职务",
    desc: "让 TA 担任某个队/组的职务（如中队长、组长）",
    enabled: canAppoint,
    disabledReason: "您没有发起任命的权限"
  },
  {
    key: "final-review" as const,
    title: "授予考勤终审权",
    desc: "让 TA 能对考勤单做最终审核（跟随其在任职务）",
    enabled: canBindScoped,
    disabledReason: "您没有创建角色绑定的权限"
  },
  {
    key: "global-role" as const,
    title: "授予业务角色",
    desc: "让 TA 获得一组全队范围的操作权限（如业务管理员）",
    enabled: canAssignGlobal,
    disabledReason: "您没有分配系统角色的权限"
  }
]);

/* --------- 场景 A · 任命职务 --------- */
const orgOptions = ref<OrgOptionItem[]>([]);
const positionOptions = ref<PositionOptionItem[]>([]);
const appointForm = ref({
  organizationId: props.presetOrgId ?? "",
  positionId: "",
  startedAt: dayjs().format("YYYY-MM-DD"),
  isConcurrent: false
});

async function ensureAppointOptions() {
  if (!orgOptions.value.length) {
    try {
      const { code, data } = await getOrgOptions({ limit: 100 });
      if (code === 0) orgOptions.value = data.items;
    } catch {
      orgOptions.value = [];
    }
  }
  if (!positionOptions.value.length) {
    try {
      const { code, data } = await getPositionOptions({ limit: 100 });
      if (code === 0) positionOptions.value = data.items;
    } catch {
      positionOptions.value = [];
    }
  }
}

/* --------- 场景 B · 考勤终审权 --------- */
const activeAssignments = ref<PositionAssignmentItem[]>([]);
const assignmentsLoaded = ref(false);
const finalForm = ref({
  assignmentId: "",
  scopeType: "ORGANIZATION_TREE" as "ORGANIZATION" | "ORGANIZATION_TREE"
});
const finalReviewerRoleId = ref("");

const selectedAssignment = computed(() =>
  activeAssignments.value.find(a => a.id === finalForm.value.assignmentId)
);

/** 队员轴任职端点不带展开对象——组织/职务名经 resolve-labels 批量补齐,未命中回落 id */
const orgNameById = ref<Record<string, string>>({});
const positionNameById = ref<Record<string, string>>({});

function assignmentLabel(a: PositionAssignmentItem): string {
  const org =
    a.organization?.name ??
    orgNameById.value[a.organizationId] ??
    a.organizationId;
  const pos =
    a.position?.name ?? positionNameById.value[a.positionId] ?? a.positionId;
  return `${org} · ${pos}（自 ${dayjs(a.startedAt).format("YYYY-MM-DD")}）`;
}

async function ensureFinalReviewData() {
  assignmentsLoaded.value = false;
  try {
    const [assignRes, roleRes] = await Promise.all([
      getMemberPositionAssignments(memberId.value),
      getRoleOptions({ q: "attendance-final-reviewer", limit: 20 })
    ]);
    if (assignRes.code === 0) {
      activeAssignments.value = assignRes.data.filter(
        a => a.status === "ACTIVE"
      );
      if (activeAssignments.value.length === 1) {
        finalForm.value.assignmentId = activeAssignments.value[0].id;
      }
      const [orgMap, posMap] = await Promise.all([
        resolveLabelMap(
          "organization",
          activeAssignments.value.map(a => a.organizationId)
        ),
        resolveLabelMap(
          "position",
          activeAssignments.value.map(a => a.positionId)
        )
      ]);
      orgNameById.value = { ...orgNameById.value, ...orgMap };
      positionNameById.value = { ...positionNameById.value, ...posMap };
    }
    if (roleRes.code === 0) {
      finalReviewerRoleId.value =
        roleRes.data.items.find(r => r.code === "attendance-final-reviewer")
          ?.id ?? "";
    }
  } catch (error: any) {
    message(bizErrorMessage(error, "加载任职信息失败"), { type: "error" });
  } finally {
    assignmentsLoaded.value = true;
  }
}

/* --------- 场景 C · 全局业务角色 --------- */
/** 经「职务→角色 policy」推导的派生角色:向导面向新手,直接从可选项剔除
 *  （高级表单仍可绑,那里有软提示;handoff §2.6:手工全局绑定绕开推导设计） */
const DERIVED_ROLE_CODES = [
  "org-admin",
  "group-manager",
  "org-supervisor",
  "attendance-final-reviewer"
];
const roleOptions = ref<RoleOptionItem[]>([]);
const globalForm = ref({ roleCode: "" });

async function ensureRoleOptions() {
  if (roleOptions.value.length) return;
  try {
    const { code, data } = await getRoleOptions({ limit: 100 });
    if (code === 0) {
      roleOptions.value = data.items.filter(
        r => !DERIVED_ROLE_CODES.includes(r.code)
      );
    }
  } catch {
    roleOptions.value = [];
  }
}

const selectedRole = computed(() =>
  roleOptions.value.find(r => r.code === globalForm.value.roleCode)
);

/* ----------------------------- 第 3 步 · 预演确认 ----------------------------- */
const previewLoading = ref(false);
const previewRan = ref(false);
const previewValid = ref(false);
const previewIssues = ref<
  Array<PositionAssignmentViolation | RoleBindingPreviewConflict>
>([]);
const previewResolvedScope = ref("");

const summaryText = computed(() => {
  if (scenario.value === "appoint") {
    const org = orgOptions.value.find(
      o => o.id === appointForm.value.organizationId
    );
    const pos = positionOptions.value.find(
      p => p.id === appointForm.value.positionId
    );
    return `将任命 ${memberLabel.value} 为「${org?.label ?? ""} · ${pos?.label ?? ""}」，自 ${appointForm.value.startedAt} 起${appointForm.value.isConcurrent ? "（兼任）" : ""}。`;
  }
  if (scenario.value === "final-review") {
    const a = selectedAssignment.value;
    return `将授予 ${memberLabel.value} 考勤终审权，挂在其任职「${a ? assignmentLabel(a) : ""}」上，生效范围：${SCOPE_TYPE_LABEL[finalForm.value.scopeType]}${previewResolvedScope.value ? `（系统确认:${previewResolvedScope.value}）` : ""}。`;
  }
  if (scenario.value === "global-role") {
    return `将授予 ${memberLabel.value} 的登录账号「${selectedRole.value?.label ?? globalForm.value.roleCode}」角色，全队范围生效。`;
  }
  return "";
});

async function runPreview() {
  previewLoading.value = true;
  previewRan.value = false;
  previewIssues.value = [];
  previewResolvedScope.value = "";
  try {
    if (scenario.value === "appoint") {
      const { code, data } = await previewPositionAssignment({
        organizationId: appointForm.value.organizationId,
        positionId: appointForm.value.positionId,
        memberId: memberId.value,
        startedAt: appointForm.value.startedAt,
        isConcurrent: appointForm.value.isConcurrent
      });
      if (code === 0) {
        previewValid.value = data.valid;
        previewIssues.value = data.violations;
      }
    } else if (scenario.value === "final-review") {
      const { code, data } = await previewRoleBinding({
        principalType: "POSITION_ASSIGNMENT",
        principalId: finalForm.value.assignmentId,
        roleId: finalReviewerRoleId.value,
        scopeType: finalForm.value.scopeType,
        scopeOrgId: selectedAssignment.value?.organizationId
      });
      if (code === 0) {
        previewValid.value = data.valid;
        previewIssues.value = data.conflicts;
        const rs = data.resolvedScope;
        previewResolvedScope.value = rs
          ? (SCOPE_TYPE_LABEL[rs.scopeType] ?? rs.scopeType)
          : "";
      }
    } else {
      // 场景 C 无预演端点(user-roles 直绑,重复绑定等由后端在提交时裁决)
      previewValid.value = true;
    }
    previewRan.value = true;
  } catch (error: any) {
    previewValid.value = false;
    previewRan.value = true;
    previewIssues.value = [
      { bizCode: null, message: bizErrorMessage(error, "预演失败,请重试") }
    ];
  } finally {
    previewLoading.value = false;
  }
}

async function submit() {
  submitting.value = true;
  try {
    if (scenario.value === "appoint") {
      await createPositionAssignment(appointForm.value.organizationId, {
        positionId: appointForm.value.positionId,
        memberId: memberId.value,
        startedAt: appointForm.value.startedAt,
        isConcurrent: appointForm.value.isConcurrent
      });
      message("任命成功", { type: "success" });
    } else if (scenario.value === "final-review") {
      await createRoleBinding({
        principalType: "POSITION_ASSIGNMENT",
        principalId: finalForm.value.assignmentId,
        roleId: finalReviewerRoleId.value,
        scopeType: finalForm.value.scopeType,
        scopeOrgId: selectedAssignment.value?.organizationId
      });
      message("已授予考勤终审权", { type: "success" });
    } else {
      await assignUserRbacRole(memberUserId.value!, globalForm.value.roleCode);
      message(
        "角色已授予；如需立即生效，请到「角色权限」页点「使权限立即生效」",
        { type: "success" }
      );
    }
    emit("granted");
    visible.value = false;
  } catch (error: any) {
    message(bizErrorMessage(error, "提交失败"), { type: "error" });
  } finally {
    submitting.value = false;
  }
}

/* ----------------------------- 步骤流转 ----------------------------- */
const canNext = computed(() => {
  if (step.value === 1) return !!memberId.value;
  if (step.value === 2) {
    if (scenario.value === "appoint")
      return !!(
        appointForm.value.organizationId &&
        appointForm.value.positionId &&
        appointForm.value.startedAt
      );
    if (scenario.value === "final-review")
      return !!(finalForm.value.assignmentId && finalReviewerRoleId.value);
    if (scenario.value === "global-role")
      return !!(globalForm.value.roleCode && memberUserId.value);
    return false;
  }
  return false;
});

async function next() {
  if (step.value === 1) {
    loadMemberDetail();
    step.value = 2;
    return;
  }
  if (step.value === 2) {
    step.value = 3;
    await runPreview();
  }
}

function back() {
  if (step.value > 1) step.value -= 1;
}

async function onScenarioChange(key: Scenario) {
  scenario.value = key;
  if (key === "appoint") await ensureAppointOptions();
  if (key === "final-review") await ensureFinalReviewData();
  if (key === "global-role") await ensureRoleOptions();
}

function resetAll() {
  step.value = 1;
  scenario.value = "";
  memberId.value = props.presetMember?.id ?? "";
  memberUserId.value = null;
  memberDetailLoaded.value = false;
  appointForm.value = {
    organizationId: props.presetOrgId ?? "",
    positionId: "",
    startedAt: dayjs().format("YYYY-MM-DD"),
    isConcurrent: false
  };
  finalForm.value = { assignmentId: "", scopeType: "ORGANIZATION_TREE" };
  globalForm.value = { roleCode: "" };
  previewRan.value = false;
  previewIssues.value = [];
}

watch(visible, open => {
  if (open) {
    resetAll();
    if (props.presetMember) {
      memberOptions.value = [
        {
          id: props.presetMember.id,
          label: props.presetMember.label,
          memberNo: "",
          gradeCode: null
        }
      ];
      memberId.value = props.presetMember.id;
    } else {
      searchMembers("");
    }
  }
});
</script>

<template>
  <el-dialog
    v-model="visible"
    title="授权向导"
    width="640px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <SrvfFlowSteps :steps="WIZARD_STEPS" :active="step - 1" class="mb-4" />

    <!-- 第 1 步 · 选人 -->
    <div v-if="step === 1">
      <el-form label-width="72px">
        <el-form-item label="队员" required>
          <el-select
            v-model="memberId"
            filterable
            remote
            :remote-method="searchMembers"
            :loading="memberSearching"
            :disabled="!!presetMember"
            placeholder="输入姓名或编号搜索"
            class="w-full"
          >
            <el-option
              v-for="m in memberOptions"
              :key="m.id"
              :label="m.label"
              :value="m.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <!-- 第 2 步 · 选场景 -->
    <div v-else-if="step === 2">
      <div class="scenario-list">
        <div
          v-for="card in scenarioCards"
          :key="card.key"
          class="scenario-card"
          :class="{
            'is-active': scenario === card.key,
            'is-disabled': !card.enabled
          }"
          @click="card.enabled && onScenarioChange(card.key)"
        >
          <div class="scenario-card__title">{{ card.title }}</div>
          <div class="scenario-card__desc">
            {{ card.enabled ? card.desc : card.disabledReason }}
          </div>
        </div>
      </div>

      <!-- A · 任命职务 -->
      <el-form v-if="scenario === 'appoint'" label-width="88px" class="mt-4">
        <el-form-item label="组织" required>
          <el-select
            v-model="appointForm.organizationId"
            filterable
            placeholder="选择队/组"
            class="w-full"
          >
            <el-option
              v-for="o in orgOptions"
              :key="o.id"
              :label="o.label"
              :value="o.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="职务" required>
          <el-select
            v-model="appointForm.positionId"
            filterable
            placeholder="选择职务（在「队务设置 → 职务定义」维护）"
            class="w-full"
          >
            <el-option
              v-for="p in positionOptions"
              :key="p.id"
              :label="p.label"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任期开始" required>
          <el-date-picker
            v-model="appointForm.startedAt"
            type="date"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="兼任">
          <el-switch v-model="appointForm.isConcurrent" />
          <span class="form-hint">TA 已有其他职务、此为兼任时打开</span>
        </el-form-item>
      </el-form>

      <!-- B · 考勤终审权 -->
      <div v-else-if="scenario === 'final-review'" class="mt-4">
        <el-alert
          v-if="assignmentsLoaded && !activeAssignments.length"
          type="warning"
          show-icon
          :closable="false"
          title="该队员当前没有在任职务——考勤终审权需要挂在职务上。请先用「任命职务」场景任命，再回来授权。"
        />
        <el-form v-else label-width="88px">
          <el-form-item label="挂在任职" required>
            <el-select
              v-model="finalForm.assignmentId"
              placeholder="选择 TA 的在任职务"
              class="w-full"
            >
              <el-option
                v-for="a in activeAssignments"
                :key="a.id"
                :label="assignmentLabel(a)"
                :value="a.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="生效范围">
            <el-radio-group v-model="finalForm.scopeType">
              <el-radio value="ORGANIZATION_TREE">本组织及下级</el-radio>
              <el-radio value="ORGANIZATION">仅本组织</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>

      <!-- C · 全局业务角色 -->
      <div v-else-if="scenario === 'global-role'" class="mt-4">
        <el-alert
          v-if="memberDetailLoaded && !memberUserId"
          type="warning"
          show-icon
          :closable="false"
          title="该队员还没有登录账号——业务角色授予的是登录账号。请先到其档案页开通账号，再回来授权。"
        />
        <el-form v-else label-width="88px">
          <el-form-item label="业务角色" required>
            <el-select
              v-model="globalForm.roleCode"
              filterable
              placeholder="选择要授予的角色"
              class="w-full"
            >
              <el-option
                v-for="r in roleOptions"
                :key="r.id"
                :label="r.label"
                :value="r.code"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 第 3 步 · 预演确认 -->
    <div v-else>
      <el-skeleton v-if="previewLoading" animated :rows="3" />
      <template v-else-if="previewRan">
        <el-alert
          v-if="previewValid"
          type="success"
          show-icon
          :closable="false"
          title="系统检查通过，可以提交"
          class="mb-3"
        />
        <el-alert
          v-else
          type="error"
          show-icon
          :closable="false"
          title="系统检查发现问题，暂不能提交"
          class="mb-3"
        />
        <p class="summary-line">{{ summaryText }}</p>
        <ul v-if="previewIssues.length" class="issue-list">
          <li v-for="(issue, i) in previewIssues" :key="i">
            {{ issue.message }}
          </li>
        </ul>
        <el-alert
          v-if="scenario === 'final-review'"
          type="info"
          show-icon
          :closable="false"
          class="mt-3"
          title="范围化授权目前仅对「考勤终审」和「活动/报名/考勤的单点操作」生效，其余功能仍按全队角色判权。"
        />
        <el-alert
          v-if="scenario === 'appoint'"
          type="info"
          show-icon
          :closable="false"
          class="mt-3"
          title="任命生效后，TA 会按「职务 → 角色」规则自动获得对应管理权限；换届撤销任命即自动失权。"
        />
      </template>
    </div>

    <template #footer>
      <el-button v-if="step > 1" :disabled="submitting" @click="back">
        上一步
      </el-button>
      <el-button
        v-if="step < 3"
        type="primary"
        :disabled="!canNext"
        @click="next"
      >
        下一步
      </el-button>
      <el-button
        v-else
        type="primary"
        :loading="submitting"
        :disabled="!previewRan || !previewValid"
        @click="submit"
      >
        确认授权
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.scenario-list {
  display: flex;
  gap: 10px;
}

.scenario-card {
  flex: 1;
  padding: 12px;
  cursor: pointer;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  transition: border-color 0.15s;

  &.is-active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .scenario-card__title {
    font-size: 14px;
    font-weight: 600;
  }

  .scenario-card__desc {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }
}

.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.summary-line {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 1.7;
}

.issue-list {
  padding-left: 18px;
  margin: 4px 0;

  li {
    margin: 4px 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-color-error);
    list-style: disc;
  }
}
</style>
