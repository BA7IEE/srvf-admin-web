<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { getAdminMe } from "@/api/user";
import {
  getManagedActivityReviewContext,
  type AdminSimpleDraftResponseDto
} from "@/api/srvf-simple-activity";
import { bizErrorMessage } from "@/api/srvf-error";
import { readReturnedReviewNote, ReviewDataError } from "./review-state";

const props = defineProps<{
  draft: AdminSimpleDraftResponseDto;
  userId: string;
  accountInvalid: boolean;
  canEdit: boolean;
  editing: boolean;
}>();
const emit = defineEmits<{ edit: []; identityInvalid: [] }>();
const loading = ref(false);
const error = ref("");
const note = ref<string | null>(null);
const loaded = ref(false);
let generation = 0;
let alive = true;
const context = computed(() =>
  JSON.stringify([
    props.userId,
    props.accountInvalid,
    props.draft.activityId,
    props.draft.organizationId,
    props.draft.statusCode,
    props.draft.draftHash,
    props.draft.review
  ])
);

async function readNote() {
  const round = ++generation;
  const expected = context.value;
  const draft = props.draft;
  const userId = props.userId;
  note.value = null;
  loaded.value = false;
  error.value = "";
  loading.value = true;
  const current = () =>
    alive &&
    round === generation &&
    expected === context.value &&
    !props.accountInvalid;
  async function verifyIdentity() {
    const result = await getAdminMe();
    if (!current()) return false;
    if (result.code !== 0 || result.data.userId !== userId) {
      emit("identityInvalid");
      return false;
    }
    return true;
  }
  try {
    if (draft.review?.status !== "returned" || !(await verifyIdentity()))
      return;
    const result = await getManagedActivityReviewContext(draft.activityId);
    if (!current() || !(await verifyIdentity())) return;
    if (result.code !== 0) throw new Error("未取得有效退回原因。");
    note.value = readReturnedReviewNote(draft, result.data);
    loaded.value = true;
  } catch (e) {
    if (current())
      error.value =
        e instanceof ReviewDataError
          ? e.message
          : bizErrorMessage(
              e,
              "暂时无法读取退回原因，请重试或联系审核人员核实修改要求。"
            );
  } finally {
    if (alive && round === generation) loading.value = false;
  }
}

watch(context, readNote, { immediate: true, flush: "sync" });
onBeforeUnmount(() => {
  alive = false;
  generation++;
});
</script>

<template>
  <el-card
    v-if="draft.review?.status === 'returned' && !accountInvalid"
    class="mb-3"
    shadow="never"
    data-testid="returned-review"
  >
    <h2 class="mb-3 text-lg font-semibold">最近一次审核已退回</h2>
    <p v-if="loading" role="status">正在读取退回原因…</p>
    <el-alert
      v-if="error"
      class="my-3"
      type="warning"
      :closable="false"
      :title="error"
      role="alert"
    />
    <template v-if="loaded">
      <p class="mb-2 font-medium">审核人员的修改意见</p>
      <p v-if="note" class="whitespace-pre-wrap wrap-break-word">{{ note }}</p>
      <p v-else>未提供可显示的退回原因，请联系审核人员核实修改要求。</p>
    </template>
    <p class="my-3 text-sm">
      <template v-if="draft.statusCode === 'draft'">
        按意见修改并保存草稿，再核对提交新的审核申请。退回意见会保留到下一次提审；审核通过后才会发布。
      </template>
      <template v-else>
        这是最近一次申请的处理意见，活动当前状态以页面标题为准。本页不能修改已离开草稿阶段的活动。
      </template>
    </p>
    <div class="flex flex-wrap gap-2">
      <el-button v-if="canEdit && !editing" type="primary" @click="emit('edit')"
        >按意见修改草稿</el-button
      >
      <el-button :loading="loading" @click="readNote"
        >重新读取退回原因</el-button
      >
    </div>
  </el-card>
</template>
