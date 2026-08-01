<script setup lang="ts">
import { bizErrorMessage } from "@/api/srvf-error";
import { SrvfPermEmpty } from "@/srvf-kit";
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { getAdminMe } from "@/api/user";
import { getUserOptions, type UserOptionItem } from "@/api/srvf-user";
import {
  explainAuthz,
  explainAuthzBatch,
  AUTHZ_REASON_LABEL,
  RESOURCE_TYPE_LABEL,
  type ExplainAuthzResult,
  type ExplainBatchItem,
  type ExplainBatchResultItem,
  type ExplainResourceType
} from "@/api/srvf-authz";

defineOptions({
  name: "SrvfAuthzExplainDrawer"
});

/**
 * 权限诊断抽屉（自 7.11.0 fork 移植，改指向新 srvf-authz.ts + 加 reason 中文映射）。
 * 蓝图 §7：诊断是排查工具，不是常规业务流——用法是"这人为什么做不了 X"一键查，
 * 入口放本页（角色绑定）头部按钮。deny 是 200 数据，不是异常。
 */
const canExplain = hasPerms("authz.explain.decision");
const canReadUsers = hasPerms("user.read.account");
const loading = ref(false);
const usersLoading = ref(false);
const userOptions = ref<UserOptionItem[]>([]);
const result = ref<ExplainAuthzResult | null>(null);
const formRef = ref<FormInstance>();

const form = reactive<{
  userId: string;
  action: string;
  resourceType: "" | ExplainResourceType;
  resourceId: string;
}>({
  userId: "",
  action: "attendance.final-approve.sheet",
  resourceType: "",
  resourceId: ""
});

const rules: FormRules = {
  userId: [
    { required: true, message: "请输入或选择目标用户 id", trigger: "change" }
  ],
  action: [
    {
      required: true,
      message: "请输入权限标识（如 attendance.final-approve.sheet）",
      trigger: "blur"
    }
  ]
};

const resourceTypeOptions = Object.entries(RESOURCE_TYPE_LABEL).map(
  ([value, label]) => ({ value, label: `${label} ${value}` })
);

/** 常见 action 候选（可 allow-create 手填，不限于此列表）。 */
const actionOptions = [
  "activity.update.record",
  "activity.publish.record",
  "activity.cancel.record",
  "activity.delete.record",
  "activity-registration.read.record",
  "activity-registration.create.record",
  "activity-registration.approve.record",
  "activity-registration.reject.record",
  "activity-registration.cancel.record",
  "attendance.read.sheet",
  "attendance.create.sheet",
  "attendance.update.sheet",
  "attendance.delete.sheet",
  "attendance.approve.sheet",
  "attendance.reject.sheet",
  "attendance.final-approve.sheet",
  "attendance.final-reject.sheet"
];

const decisionTagType = computed(() =>
  result.value?.decision.allow ? "success" : "danger"
);
const decisionText = computed(() =>
  result.value?.decision.allow ? "允许" : "拒绝"
);
const reasonLabel = computed(() => {
  const r = result.value?.decision.reason;
  return r ? (AUTHZ_REASON_LABEL[r] ?? r) : "—";
});

function userLabel(user: UserOptionItem) {
  return user.label === user.username
    ? user.label
    : `${user.label}（${user.username}）`;
}

function applyInitial() {
  result.value = null;
}

async function fillCurrentUserIfNeeded() {
  if (form.userId) return;
  try {
    const { code, data } = await getAdminMe();
    if (code === 0) form.userId = data.userId;
  } catch {
    // 当前身份获取失败时保留手填，不阻塞抽屉使用
  }
}

async function loadUserOptions() {
  if (!canReadUsers || userOptions.value.length > 0) return;
  usersLoading.value = true;
  try {
    const { code, data } = await getUserOptions({ limit: 100 });
    if (code === 0) userOptions.value = data.items;
  } catch {
    // 无用户列表权限或接口失败时退化为 userId 手填
  } finally {
    usersLoading.value = false;
  }
}

function resetForm() {
  applyInitial();
  form.action = "attendance.final-approve.sheet";
  form.resourceType = "";
  form.resourceId = "";
  nextTick(() => formRef.value?.clearValidate());
}

function submit() {
  if (!canExplain) return;
  formRef.value?.validate(async valid => {
    if (!valid) return;
    const hasResourceType = Boolean(form.resourceType);
    const hasResourceId = Boolean(form.resourceId.trim());
    if (hasResourceType !== hasResourceId) {
      message("资源类型和资源 id 需要同时填写，或同时留空。", {
        type: "warning"
      });
      return;
    }
    loading.value = true;
    result.value = null;
    try {
      const { code, data } = await explainAuthz({
        userId: form.userId.trim(),
        action: form.action.trim(),
        ...(hasResourceType && hasResourceId
          ? {
              resourceRef: {
                type: form.resourceType as ExplainResourceType,
                id: form.resourceId.trim()
              }
            }
          : {})
      });
      if (code === 0) result.value = data;
    } catch (error: any) {
      message(bizErrorMessage(error, "权限诊断失败"), {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  });
}

/* ============================================================================
 * 批量模式（explain-batch）
 * ==========================================================================
 * 排查「一批人为什么做不了同一件事」或「这个人对一串资源分别怎么判」时，
 * 逐条点单查太慢。批量一次问 ≤200 条，逐条独立判定、互不影响。
 *
 * 输入沿用本仓既有的「文本域逐行解析」范式（同批量标门槛），不引依赖：
 * 每行 `userId 空格或逗号 action [资源类型 资源ID]`，后两项可省。
 */
const BATCH_LIMIT = 200;

const batchRawText = ref("");
const batchLoading = ref(false);
const batchResults = ref<ExplainBatchResultItem[]>([]);
/** 解析时跳过的行（行号 + 原文），要显式回显——静默丢行是最难查的坑 */
const batchSkipped = ref<Array<{ line: number; raw: string }>>([]);

/** 逐行解析成请求项；空行与解析不出两段的行记入 skipped 回显。 */
function parseBatchInput(): ExplainBatchItem[] {
  const items: ExplainBatchItem[] = [];
  const skipped: Array<{ line: number; raw: string }> = [];
  batchRawText.value.split(/\r?\n/).forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) return;
    const parts = line.split(/[\s,，\t]+/).filter(Boolean);
    if (parts.length < 2) {
      skipped.push({ line: idx + 1, raw: line });
      return;
    }
    const [userId, action, resourceType, resourceId] = parts;
    items.push({
      userId,
      action,
      // 契约字段名是 type/id（不是 resourceType/resourceId）——已对 live 核实
      ...(resourceType && resourceId
        ? {
            resourceRef: {
              type: resourceType as ExplainResourceType,
              id: resourceId
            }
          }
        : {})
    });
  });
  batchSkipped.value = skipped;
  return items;
}

async function submitBatch() {
  const items = parseBatchInput();
  if (!items.length) {
    message("没有解析出可诊断的行，请检查格式", { type: "warning" });
    return;
  }
  if (items.length > BATCH_LIMIT) {
    message(`一次最多诊断 ${BATCH_LIMIT} 条，当前 ${items.length} 条`, {
      type: "warning"
    });
    return;
  }
  batchLoading.value = true;
  batchResults.value = [];
  try {
    const { code, data } = await explainAuthzBatch(items);
    // deny 是 200 数据不是异常——整批成功即逐行展示各自结论
    if (code === 0) batchResults.value = data.items;
  } catch (error: any) {
    message(bizErrorMessage(error, "批量诊断失败"), { type: "error" });
  } finally {
    batchLoading.value = false;
  }
}

function resetBatch() {
  batchRawText.value = "";
  batchResults.value = [];
  batchSkipped.value = [];
}

/** 批量结果行的原因中文（未知 code 原样回显，不吞） */
function batchReasonLabel(row: ExplainBatchResultItem) {
  return AUTHZ_REASON_LABEL[row.decision.reason] ?? row.decision.reason;
}

/** 当前模式：单条精查 / 批量粗筛 */
const mode = ref<"single" | "batch">("single");

onMounted(async () => {
  applyInitial();
  await Promise.allSettled([fillCurrentUserIfNeeded(), loadUserOptions()]);
  nextTick(() => formRef.value?.clearValidate());
});
</script>

<template>
  <template v-if="canExplain">
    <el-alert
      class="mb-3"
      type="info"
      show-icon
      :closable="false"
      title="诊断说明"
      description="这是排查工具：查得出「拒绝」也算查询成功，不是报错。用来回答「这个人为什么做不了某件事」。"
    />

    <!--
      这条区分是实测踩出来的（2026-08-01）：同一个已取消的活动，问「能不能发布」
      这里答「允许」，而列表上的发布按钮是灰的。两者问的不是同一件事——
      不写清楚，排查的人会以为哪边出了 bug。
    -->
    <el-alert
      class="mb-3"
      type="warning"
      show-icon
      :closable="false"
      title="这里只看「有没有权限」，不看「现在能不能做」"
      description="资源当前状态允不允许这个动作，不在本页的判断范围内。所以可能出现这里显示「允许」、但页面上按钮仍是灰的——那是状态机拦的，不是权限问题。"
    />

    <el-tabs v-model="mode" class="mb-2">
      <el-tab-pane label="单条精查" name="single" />
      <el-tab-pane label="批量粗筛" name="batch" />
    </el-tabs>

    <template v-if="mode === 'batch'">
      <el-alert
        class="mb-3"
        type="info"
        show-icon
        :closable="false"
        title="一次查一批"
        :description="`每行一条：用户ID 动作码，后面可选再跟 资源类型 资源ID。逗号、空格或制表符分隔都行。一次最多 ${BATCH_LIMIT} 条，逐条独立判定、互不影响。`"
      />
      <el-input
        v-model="batchRawText"
        type="textarea"
        :rows="8"
        placeholder="示例：&#10;cmxxx001 attendance.final-approve.sheet&#10;cmxxx002 activity.publish.record activity cmyyy001"
      />
      <div class="mt-2">
        <el-button type="primary" :loading="batchLoading" @click="submitBatch">
          批量诊断
        </el-button>
        <el-button @click="resetBatch">清空</el-button>
      </div>

      <el-alert
        v-if="batchSkipped.length"
        class="mt-3"
        type="warning"
        show-icon
        :closable="false"
        :title="`有 ${batchSkipped.length} 行没能解析，已跳过`"
      >
        <div class="text-xs">
          <div v-for="sk in batchSkipped" :key="sk.line">
            第 {{ sk.line }} 行：{{ sk.raw }}
          </div>
          <div class="mt-1">每行至少要有「用户ID 动作码」两段。</div>
        </div>
      </el-alert>

      <el-table
        v-if="batchResults.length"
        :data="batchResults"
        border
        size="small"
        class="mt-3"
        max-height="420"
      >
        <el-table-column label="用户" prop="userId" min-width="180" />
        <el-table-column label="动作" prop="action" min-width="220" />
        <el-table-column label="结论" min-width="90">
          <template #default="{ row }">
            <el-tag
              :type="row.decision.allow ? 'success' : 'danger'"
              size="small"
            >
              {{ row.decision.allow ? "允许" : "拒绝" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="原因" min-width="200">
          <template #default="{ row }">{{ batchReasonLabel(row) }}</template>
        </el-table-column>
      </el-table>
    </template>

    <el-form
      v-show="mode === 'single'"
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="110px"
    >
      <el-form-item label="目标用户" prop="userId">
        <el-select
          v-if="canReadUsers"
          v-model="form.userId"
          filterable
          allow-create
          default-first-option
          clearable
          :loading="usersLoading"
          placeholder="选择用户或直接粘贴 userId"
          class="w-full"
        >
          <el-option
            v-for="user in userOptions"
            :key="user.id"
            :label="userLabel(user)"
            :value="user.id"
          />
        </el-select>
        <el-input
          v-else
          v-model="form.userId"
          clearable
          placeholder="目标用户 userId"
        />
      </el-form-item>

      <el-form-item label="Action" prop="action">
        <el-select
          v-model="form.action"
          filterable
          allow-create
          default-first-option
          clearable
          placeholder="如 attendance.final-approve.sheet"
          class="w-full"
        >
          <el-option
            v-for="action in actionOptions"
            :key="action"
            :label="action"
            :value="action"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="资源类型">
        <el-select
          v-model="form.resourceType"
          clearable
          filterable
          placeholder="不填 = 全局退化路径"
          class="w-full"
        >
          <el-option
            v-for="item in resourceTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="资源 ID">
        <el-input
          v-model="form.resourceId"
          clearable
          placeholder="resourceRef.id；和资源类型同时填写或同时留空"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" @click="submit">
          开始诊断
        </el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>

    <el-card v-if="result && mode === 'single'" shadow="never" class="mt-4">
      <template #header>
        <div class="authz-result-header">
          <span>诊断结果</span>
          <el-tag :type="decisionTagType">{{ decisionText }}</el-tag>
        </div>
      </template>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="目标用户">
          {{ result.targetUser.username }} / {{ result.targetUser.role }} /
          {{ result.targetUser.status }}
        </el-descriptions-item>
        <el-descriptions-item label="判定原因">
          <el-tag :type="decisionTagType">{{ reasonLabel }}</el-tag>
          <span class="reason-raw">（{{ result.decision.reason }}）</span>
        </el-descriptions-item>
        <el-descriptions-item label="命中来源">
          <template v-if="result.decision.matchedGrant">
            <div>source：{{ result.decision.matchedGrant.source }}</div>
            <div v-if="result.decision.matchedGrant.roleCode">
              roleCode：{{ result.decision.matchedGrant.roleCode }}
            </div>
            <div>scopeType：{{ result.decision.matchedGrant.scopeType }}</div>
            <div v-if="result.decision.matchedGrant.scopeId">
              scopeId：{{ result.decision.matchedGrant.scopeId }}
            </div>
            <div v-if="result.decision.matchedGrant.bindingId">
              bindingId：{{ result.decision.matchedGrant.bindingId }}
            </div>
            <div v-if="result.decision.matchedGrant.positionAssignmentId">
              positionAssignmentId：{{
                result.decision.matchedGrant.positionAssignmentId
              }}
            </div>
            <div v-if="result.decision.matchedGrant.supervisionAssignmentId">
              supervisionAssignmentId：{{
                result.decision.matchedGrant.supervisionAssignmentId
              }}
            </div>
          </template>
          <span v-else>—</span>
        </el-descriptions-item>
        <el-descriptions-item label="资源解析">
          <template v-if="result.decision.resource">
            <div>
              resource：{{ result.decision.resource.resourceType }} /
              {{ result.decision.resource.resourceId }}
            </div>
            <div>
              organizationId：{{
                result.decision.resource.organizationId ?? "—"
              }}
            </div>
            <div>
              activityId：{{ result.decision.resource.activityId ?? "—" }}
            </div>
            <div>
              ownerMemberId：{{ result.decision.resource.ownerMemberId ?? "—" }}
            </div>
            <div>
              ownerUserId：{{ result.decision.resource.ownerUserId ?? "—" }}
            </div>
            <div>
              statusCode：{{ result.decision.resource.statusCode ?? "—" }}
            </div>
          </template>
          <span v-else>—</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </template>

  <SrvfPermEmpty v-else action="使用权限诊断" code="authz.explain.decision" />
</template>

<style scoped lang="scss">
.authz-result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reason-raw {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
