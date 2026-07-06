<script setup lang="ts">
import { bizErrorMessage } from "@/api/srvf-error";
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { computed, nextTick, reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { getAdminMe } from "@/api/user";
import { getUserOptions, type UserOptionItem } from "@/api/srvf-user";
import {
  explainAuthz,
  AUTHZ_REASON_LABEL,
  RESOURCE_TYPE_LABEL,
  type ExplainAuthzResult,
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
const visible = defineModel<boolean>({ required: true });

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
  action: [{ required: true, message: "请输入 action 权限码", trigger: "blur" }]
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

watch(visible, async open => {
  if (!open) return;
  applyInitial();
  await Promise.allSettled([fillCurrentUserIfNeeded(), loadUserOptions()]);
  nextTick(() => formRef.value?.clearValidate());
});
</script>

<template>
  <el-drawer v-model="visible" title="权限诊断" size="620px" destroy-on-close>
    <template v-if="canExplain">
      <el-alert
        class="mb-3"
        type="info"
        show-icon
        :closable="false"
        title="诊断说明"
        description="authz/explain 是诊断读接口：合法入参下 deny 也是 200 数据。它用于解释目标用户对某个 action、某个可选资源为什么被允许或拒绝。"
      />

      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
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

      <el-card v-if="result" shadow="never" class="mt-4">
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
                ownerMemberId：{{
                  result.decision.resource.ownerMemberId ?? "—"
                }}
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
  </el-drawer>
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
