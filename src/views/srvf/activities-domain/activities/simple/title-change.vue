<script setup lang="ts">
import { ref, watch } from "vue";
import {
  getManagedChangeState,
  submitTitleChange
} from "@/api/srvf-activity-publish-review";
import { getAdminMe } from "@/api/user";
const props = defineProps<{ activityId: string; userId: string }>();
const emit = defineEmits<{ submitted: [] }>();
const allowed = ref(false),
  busy = ref(false),
  original = ref(""),
  title = ref(""),
  notice = ref("");
let generation = 0;
async function load() {
  const round = ++generation;
  allowed.value = false;
  notice.value = "";
  title.value = "";
  try {
    const r = await getManagedChangeState(props.activityId);
    if (round !== generation) return;
    if (r.code !== 0 || r.data.activity.id !== props.activityId) throw Error();
    original.value = r.data.activity.title;
    allowed.value =
      r.data.activity.statusCode === "published" &&
      r.data.myResponsibility?.responsibilityType === "owner" &&
      r.data.publishReview.status !== "pending";
  } catch {
    if (round === generation)
      notice.value = "未取得本人活动职责，暂不能提交标题变更。";
  }
}
watch(() => [props.activityId, props.userId], load, { immediate: true });
async function submit() {
  if (
    busy.value ||
    !allowed.value ||
    !title.value.trim() ||
    title.value.trim() === original.value
  )
    return;
  const id = props.activityId,
    actor = props.userId,
    proposed = title.value.trim(),
    round = generation;
  busy.value = true;
  try {
    const [me, current] = await Promise.all([
      getAdminMe(),
      getManagedChangeState(id)
    ]);
    if (round !== generation) return;
    if (
      me.code !== 0 ||
      me.data.userId !== actor ||
      current.code !== 0 ||
      current.data.activity.id !== id ||
      current.data.activity.title !== original.value ||
      current.data.activity.statusCode !== "published" ||
      current.data.myResponsibility?.responsibilityType !== "owner" ||
      current.data.publishReview.status === "pending"
    ) {
      allowed.value = false;
      notice.value = "身份、活动或审核状态已变化，请刷新后核对。";
      return;
    }
    const r = await submitTitleChange(id, proposed);
    if (round !== generation) return;
    allowed.value = false;
    if (
      r.code !== 0 ||
      r.data.activityId !== id ||
      r.data.requestType !== "change" ||
      r.data.status !== "pending" ||
      r.data.submittedByUserId !== actor
    )
      throw Error();
    notice.value = "标题变更已提交，独立审核通过后生效。";
    emit("submitted");
  } catch {
    if (round === generation) {
      allowed.value = false;
      notice.value = "请刷新核对最新申请状态后再决定是否重试。";
    }
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <el-card v-if="allowed || notice" shadow="never">
    <h3>发布后变更</h3>
    <template v-if="allowed">
      <p>当前标题：{{ original }}</p>
      <el-input
        v-model="title"
        aria-label="申请的新标题"
        maxlength="200"
        :disabled="busy"
      />
      <el-button
        :loading="busy"
        :disabled="!title.trim() || title.trim() === original"
        @click="submit"
        >提交标题变更审核</el-button
      >
    </template>
    <p v-if="notice" role="status">{{ notice }}</p>
  </el-card>
</template>
