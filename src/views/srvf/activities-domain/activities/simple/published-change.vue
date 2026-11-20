<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  getManagedChangeState,
  submitPublishedChange,
  type ActivityChangePatch
} from "@/api/srvf-activity-publish-review";
import {
  getSimpleDraft,
  type AdminSimpleDraftResponseDto
} from "@/api/srvf-simple-activity";
import { getAdminMe } from "@/api/user";
import { bizErrorMessage } from "@/api/srvf-error";
import { beijingInput, beijingIso, displayTime, timeProblem } from "./state";
import { simpleChangeChildren } from "./published-layout";
const props = defineProps<{
  draft: AdminSimpleDraftResponseDto;
  userId: string;
}>();
const emit = defineEmits<{ submitted: [] }>();
const allowed = ref(false),
  busy = ref(false),
  notice = ref("");
const title = ref(""),
  description = ref(""),
  start = ref(""),
  end = ref(""),
  location = ref(""),
  capacity = ref("");
const problem = computed(() => {
  if (!title.value.trim() || !location.value.trim())
    return "请填写活动标题和地点文字。";
  if (
    capacity.value !== "" &&
    (!/^\d+$/.test(capacity.value) ||
      Number(capacity.value) < 1 ||
      Number(capacity.value) > 2147483647)
  )
    return "人数上限须为正整数，留空表示不限人数。";
  return timeProblem(
    start.value,
    end.value,
    beijingInput(props.draft.instance.registrationDeadline)
  );
});
const patch = computed(() => {
  const d = props.draft,
    changed: ActivityChangePatch = {};
  if (problem.value) return changed;
  if (title.value !== d.title && title.value.trim() !== d.title)
    changed.title = title.value.trim();
  if (
    description.value !== (d.instance.description ?? "") &&
    description.value.trim() !== (d.instance.description ?? "")
  )
    changed.description = description.value.trim();
  if (location.value !== d.location && location.value.trim() !== d.location)
    changed.location = location.value.trim();
  const startAt = beijingIso(start.value),
    endAt = beijingIso(end.value),
    nextCapacity = capacity.value === "" ? null : Number(capacity.value);
  if (startAt !== d.startAt) changed.startAt = startAt;
  if (endAt !== d.endAt) changed.endAt = endAt;
  if (nextCapacity !== d.instance.capacity) changed.capacity = nextCapacity;
  return changed;
});
const canSubmit = computed(
  () => !problem.value && Object.keys(patch.value).length > 0
);
let generation = 0;
async function ownerOf(d: AdminSimpleDraftResponseDto) {
  const r = await getManagedChangeState(d.activityId);
  const a = r.data?.activity;
  return (
    r.code === 0 &&
    a?.id === d.activityId &&
    a.statusCode === "published" &&
    a.title === d.title &&
    a.description === d.instance.description &&
    a.startAt === d.startAt &&
    a.endAt === d.endAt &&
    a.capacity === d.instance.capacity &&
    a.location === d.location &&
    r.data.myResponsibility?.responsibilityType === "owner" &&
    r.data.publishReview.status !== "pending"
  );
}
async function load() {
  const round = ++generation,
    d = props.draft;
  allowed.value = false;
  notice.value = "";
  title.value = d.title;
  description.value = d.instance.description ?? "";
  location.value = d.location;
  start.value = beijingInput(d.startAt);
  end.value = beijingInput(d.endAt);
  capacity.value = String(d.instance.capacity ?? "");
  try {
    const ok = await ownerOf(d);
    if (round === generation) allowed.value = ok;
  } catch {
    if (round === generation)
      notice.value = "未取得本人活动职责，暂不能提交变更。";
  }
}
watch(
  () => [props.draft.activityId, props.draft.draftHash, props.userId],
  load,
  { immediate: true }
);
async function submit() {
  if (busy.value || !allowed.value || !canSubmit.value) return;
  const d = props.draft,
    actor = props.userId,
    round = generation,
    proposed = patch.value;
  busy.value = true;
  try {
    const [me, latest, owner] = await Promise.all([
      getAdminMe(),
      getSimpleDraft(d.activityId),
      ownerOf(d)
    ]);
    if (round !== generation) return;
    if (
      me.code !== 0 ||
      me.data.userId !== actor ||
      latest.code !== 0 ||
      latest.data.activityId !== d.activityId ||
      latest.data.draftHash !== d.draftHash ||
      !owner
    ) {
      allowed.value = false;
      notice.value = "身份、活动或审核状态已变化，请刷新后核对。";
      return;
    }
    const children = simpleChangeChildren(proposed, d.session, d.position);
    const sessionId = d.session.id;
    const r = await submitPublishedChange(
      d.activityId,
      proposed,
      Object.keys(children.session).length
        ? [{ sessionId, ...children.session }]
        : [],
      Object.keys(children.position).length
        ? [{ sessionId, positionId: d.position.id, ...children.position }]
        : []
    );
    if (round !== generation) return;
    allowed.value = false;
    if (
      r.code !== 0 ||
      r.data.activityId !== d.activityId ||
      r.data.requestType !== "change" ||
      r.data.status !== "pending" ||
      r.data.submittedByUserId !== actor
    )
      throw Error();
    notice.value = "活动变更已提交，独立审核通过后生效。";
    emit("submitted");
  } catch (e) {
    if (round === generation) {
      allowed.value = false;
      notice.value = bizErrorMessage(
        e,
        "请刷新核对最新申请状态后再决定是否重试。"
      );
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
      <p>当前标题：{{ draft.title }}</p>
      <el-input
        v-model="title"
        aria-label="申请的新标题"
        maxlength="200"
        :disabled="busy"
      />
      <p>当前活动说明：{{ draft.instance.description || "未填写" }}</p>
      <el-input
        v-model="description"
        type="textarea"
        aria-label="申请的新活动说明"
        maxlength="500"
        :disabled="busy"
      />
      <p>
        活动和场次时间（北京时间）：{{ displayTime(draft.startAt) }} 至
        {{ displayTime(draft.endAt) }}。签到、签退和岗位时间随场次调整。
      </p>
      <label
        >申请的开始时间
        <input
          v-model="start"
          type="datetime-local"
          step="0.001"
          :disabled="busy"
      /></label>
      <label
        >申请的结束时间
        <input
          v-model="end"
          type="datetime-local"
          step="0.001"
          :disabled="busy"
      /></label>
      <p>
        活动和场次地点文字：{{
          draft.location
        }}。签到地址、地图点和地点可见范围沿用原安排。
      </p>
      <el-input
        v-model="location"
        aria-label="申请的地点文字"
        maxlength="200"
        :disabled="busy"
      />
      <p>
        活动、场次和默认岗位人数上限：{{
          draft.instance.capacity ?? "不限人数"
        }}。留空表示不限人数。
      </p>
      <el-input
        v-model="capacity"
        aria-label="申请的人数上限"
        inputmode="numeric"
        :disabled="busy"
      />
      <p v-if="problem" role="alert">{{ problem }}</p>
      <el-button :loading="busy" :disabled="!canSubmit" @click="submit"
        >提交活动变更审核</el-button
      >
    </template>
    <p v-if="notice" role="status">{{ notice }}</p>
  </el-card>
</template>
