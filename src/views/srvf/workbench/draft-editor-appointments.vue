<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import {
  createRoleBinding,
  deleteRoleBinding,
  getEditorAppointment,
  getEditorDrafts,
  type EditorAppointment,
  type EditorDraft
} from "@/api/srvf-role-binding";
import {
  appointmentFeedback,
  type SubmittedAppointment
} from "./editor-appointment-result";

const emit = defineEmits<{ close: [] }>();
const pageSize = 20;
const page = ref(1);
const total = ref(0);
const drafts = ref<EditorDraft[]>([]);
const selected = ref<EditorDraft>();
const detail = ref<EditorAppointment>();
const loadingList = ref(false);
const loadingDetail = ref(false);
const busy = ref(false);
const listError = ref("");
const error = ref("");
const notice = ref("");
const pending = ref<SubmittedAppointment>();
let listSerial = 0;
let readSerial = 0;
const stateText = computed(() => {
  if (!detail.value?.binding) return "尚无编辑任命";
  return {
    ACTIVE: "任命生效中",
    EXPIRED: "任命已过期",
    SCHEDULED: "任命待生效"
  }[detail.value.binding.state];
});

async function loadDrafts(nextPage: number) {
  if (busy.value) return;
  const serial = ++listSerial;
  ++readSerial;
  selected.value = undefined;
  detail.value = undefined;
  loadingDetail.value = false;
  page.value = nextPage;
  drafts.value = [];
  listError.value = "";
  loadingList.value = true;
  try {
    const { code, data } = await getEditorDrafts(nextPage, pageSize);
    if (serial !== listSerial) return;
    if (
      code !== 0 ||
      !Array.isArray(data?.items) ||
      data.page !== nextPage ||
      data.pageSize !== pageSize ||
      !Number.isInteger(data.total) ||
      data.total < 0 ||
      !data.items.every(
        row =>
          typeof row?.id === "string" && row.id && typeof row.title === "string"
      )
    )
      throw new Error();
    drafts.value = data.items;
    total.value = data.total;
  } catch {
    if (serial === listSerial) listError.value = "未能读取草稿列表。";
  } finally {
    if (serial === listSerial) loadingList.value = false;
  }
}

async function readDetail(id: string) {
  const serial = ++readSerial;
  detail.value = undefined;
  loadingDetail.value = true;
  error.value = "";
  notice.value = "";
  try {
    const { code, data } = await getEditorAppointment(id);
    if (serial !== readSerial) return;
    if (
      code !== 0 ||
      data?.activityId !== id ||
      !data.principalId ||
      !data.roleId ||
      (data.binding !== null &&
        (!data.binding?.id ||
          !["ACTIVE", "SCHEDULED", "EXPIRED"].includes(data.binding.state) ||
          !Number.isFinite(Date.parse(data.binding.startedAt)) ||
          !Number.isFinite(Date.parse(data.binding.endedAt))))
    )
      throw new Error();
    detail.value = data;
    if (pending.value?.activity === id) {
      const result = appointmentFeedback(pending.value, data.binding);
      notice.value = result;
      pending.value = undefined;
    }
  } catch {
    if (serial === readSerial) {
      error.value =
        pending.value?.activity === id
          ? "操作结果待核对。请重新核对当前状态后再办理。"
          : "未能读取当前活动的任命状态。请重新核对。";
    }
  } finally {
    if (serial === readSerial) loadingDetail.value = false;
  }
}

function choose(draft: EditorDraft) {
  if (busy.value) return;
  selected.value = draft;
  readDetail(draft.id);
}

async function change() {
  const target = detail.value;
  const draft = selected.value;
  if (
    !target ||
    !draft ||
    busy.value ||
    loadingDetail.value ||
    target.activityId !== draft.id
  )
    return;
  const previous = target.binding;
  const verb = previous ? "结束" : "开始";
  busy.value = true;
  try {
    try {
      await ElMessageBox.confirm(
        previous
          ? `结束《${draft.title}》当前的编辑任命？`
          : `允许《${draft.title}》的发起人在接下来的 10 分钟内配置本活动指标？`,
        `${verb}编辑任命`,
        { confirmButtonText: `确认${verb}`, cancelButtonText: "取消" }
      );
    } catch {
      return;
    }
    const intent: SubmittedAppointment = {
      activity: draft.id,
      previous: previous?.id ?? null,
      confirmed: false,
      returnedId: null
    };
    pending.value = intent;
    try {
      const response = previous
        ? await deleteRoleBinding(previous.id, draft.id)
        : await createRoleBinding(
            {
              scopeType: "ACTIVITY",
              scopeActivityId: draft.id,
              principalType: "USER",
              principalId: target.principalId,
              roleId: target.roleId,
              endedAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
            },
            draft.id
          );
      const row = response.data;
      if (
        response.code === 0 &&
        row?.id &&
        row.principalType === "USER" &&
        row.principalId === target.principalId &&
        row.roleId === target.roleId &&
        row.scopeType === "ACTIVITY" &&
        row.scopeActivityId === draft.id &&
        (!previous || row.id === previous.id)
      ) {
        intent.confirmed = true;
        intent.returnedId = row.id;
      }
    } catch {
      // A missing reply can follow a committed write. Only a read follows this attempt.
    }
    await readDetail(draft.id);
  } finally {
    busy.value = false;
  }
}

function close(done: () => void) {
  if (!busy.value) done();
}
onMounted(() => loadDrafts(1));
onBeforeUnmount(() => {
  ++listSerial;
  ++readSerial;
});
</script>

<template>
  <el-drawer
    :model-value="true"
    title="草稿编辑任命"
    size="min(100%, 640px)"
    :before-close="close"
    @closed="emit('close')"
  >
    <p class="intro">选择活动草稿，为该草稿的发起人办理指标编辑任命。</p>
    <el-alert
      v-if="listError"
      :title="listError"
      type="error"
      :closable="false"
    />
    <div v-loading="loadingList" class="draft-list">
      <el-button v-if="listError" @click="loadDrafts(page)"
        >重新读取列表</el-button
      >
      <el-empty
        v-else-if="!loadingList && !drafts.length"
        description="当前没有可办理的草稿"
      />
      <el-button
        v-for="draft in drafts"
        :key="draft.id"
        :data-testid="`draft-editor-select-${draft.id}`"
        :type="selected?.id === draft.id ? 'primary' : 'default'"
        plain
        :disabled="busy"
        @click="choose(draft)"
        >{{ draft.title }}</el-button
      >
    </div>
    <el-pagination
      v-if="total > pageSize"
      :current-page="page"
      :page-size="pageSize"
      :total="total"
      :disabled="busy"
      layout="prev, pager, next"
      @current-change="loadDrafts"
    />
    <section
      v-if="selected"
      v-loading="loadingDetail"
      class="appointment"
      data-testid="draft-editor-detail"
    >
      <h3>{{ selected.title }}</h3>
      <el-alert v-if="error" :title="error" type="warning" :closable="false" />
      <p v-if="notice" role="status">{{ notice }}</p>
      <template v-if="detail">
        <p>任命对象：本草稿发起人</p>
        <p>当前状态：{{ stateText }}</p>
        <p v-if="detail.binding">
          任命到期：{{
            new Date(detail.binding.endedAt).toLocaleString("zh-CN", {
              timeZone: "Asia/Shanghai",
              hour12: false
            })
          }}（北京时间）
        </p>
        <el-button
          v-if="detail.binding"
          data-testid="draft-editor-end"
          :loading="busy"
          type="warning"
          @click="change"
          >结束编辑任命</el-button
        >
        <el-button
          v-else
          data-testid="draft-editor-start"
          :loading="busy"
          type="primary"
          @click="change"
          >开始编辑任命</el-button
        >
      </template>
      <el-button
        data-testid="draft-editor-check"
        :disabled="busy || loadingDetail"
        @click="readDetail(selected.id)"
        >重新核对</el-button
      >
    </section>
  </el-drawer>
</template>

<style scoped lang="scss">
.intro {
  margin: 0 0 16px;
  color: var(--el-text-color-secondary);
}

.draft-list {
  display: grid;
  gap: 8px;
  min-height: 44px;
  margin-bottom: 16px;
}

.draft-list .el-button {
  justify-content: flex-start;
  height: auto;
  min-height: 36px;
  margin: 0;
  text-align: left;
  white-space: normal;
}

.appointment {
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-light);
}

.appointment h3 {
  margin: 0 0 12px;
  overflow-wrap: anywhere;
}

.appointment p {
  margin: 8px 0;
}
</style>
