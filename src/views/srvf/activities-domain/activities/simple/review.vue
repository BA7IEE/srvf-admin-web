<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { getAdminMe } from "@/api/user";
import { bizErrorMessage as commonErrorMessage } from "@/api/srvf-error";
import {
  getSimpleDraft,
  submitSimpleActivityReview,
  type AdminSimpleDraftResponseDto
} from "@/api/srvf-simple-activity";
import {
  displayTime,
  reviewLabel,
  roleLabels,
  visibilityOptions
} from "./state";
import {
  confirmedReviewBody,
  isVersionedReviewBody,
  reviewDraft,
  ReviewDataError,
  reviewFailure,
  reviewIssues,
  reviewRecoveryStore,
  type PendingReview,
  type ReviewReceipt
} from "./review-state";

const props = defineProps<{
  draft: AdminSimpleDraftResponseDto;
  userId: string;
  organizationName: string;
  editing: boolean;
  disabled: boolean;
  accountInvalid: boolean;
}>();
const emit = defineEmits<{
  updated: [draft: AdminSimpleDraftResponseDto];
  identityInvalid: [];
  state: [state: { busy: boolean; locked: boolean; pending: boolean }];
}>();
function bizErrorMessage(error: unknown, fallback: string) {
  return error instanceof ReviewDataError
    ? error.message
    : commonErrorMessage(error, fallback);
}
const opened = ref(false);
const busy = ref(false);
const invalid = ref(false);
const storageBlocked = ref(false);
const professional = ref(false);
const confirmed = ref(false);
const preview = ref<AdminSimpleDraftResponseDto | null>(null);
const pending = ref<PendingReview | null>(null);
const receipt = ref<ReviewReceipt | null>(null);
const issues = ref<string[]>([]);
const error = ref("");
const notice = ref("");
let alive = true;
let readGeneration = 0;
const legacy = computed(
  () => !!pending.value && !isVersionedReviewBody(pending.value.body)
);
const inactive = computed(() => invalid.value || props.accountInvalid);
const unavailable = computed(
  () =>
    inactive.value || props.disabled || props.editing || storageBlocked.value
);
const canPrepare = computed(
  () =>
    !legacy.value &&
    (!!pending.value ||
      (props.draft.statusCode === "draft" &&
        props.draft.review?.status !== "pending" &&
        props.draft.editable))
);
const store = () =>
  reviewRecoveryStore(
    sessionStorage,
    location.origin,
    props.userId,
    props.draft.activityId
  );
const visiblePlace = computed(
  () =>
    visibilityOptions.find(
      option =>
        option.value ===
        preview.value?.places.find(place => place.roleCode === "primary")
          ?.visibilityCode
    )?.label ?? "以详情中的地点可见范围为准"
);

watch(
  [busy, opened, pending],
  () =>
    emit("state", {
      busy: busy.value,
      locked: busy.value || opened.value || !!pending.value,
      pending: !!pending.value
    }),
  { immediate: true }
);
watch(
  [
    () => props.draft.draftHash,
    () => props.draft.activityId,
    () => props.editing
  ],
  () => {
    if (!pending.value) confirmed.value = false;
  }
);

function ensureActive() {
  if (!alive || inactive.value)
    throw new Error("登录信息已改变，请以原账号重新打开草稿。");
}
async function verifyIdentity() {
  const { data: me } = await getAdminMe();
  ensureActive();
  if (me.userId !== props.userId) {
    invalid.value = true;
    preview.value = null;
    emit("identityInvalid");
    throw new Error("登录信息已改变，请以原账号重新打开草稿。");
  }
}
async function readCurrent() {
  const activityId = props.draft.activityId;
  const round = ++readGeneration;
  await verifyIdentity();
  const result = await getSimpleDraft(activityId);
  ensureActive();
  if (round !== readGeneration || activityId !== props.draft.activityId)
    throw new Error("活动上下文已变化，请重新打开草稿。");
  if (result.code !== 0) throw new Error("未能读取有效草稿，请重试。");
  const data = reviewDraft(result.data, activityId);
  emit("updated", data);
  return data;
}
function clearPending() {
  store().clear();
  pending.value = null;
}

/** A definite POST receipt permits GET-only recovery. GET alone never proves an unknown POST. */
async function syncCurrent() {
  try {
    preview.value = await readCurrent();
    if (pending.value?.receipt) {
      store().archiveReceipt(pending.value);
      clearPending();
      opened.value = false;
    }
    return true;
  } catch (e) {
    if (alive && !inactive.value)
      error.value =
        e instanceof DOMException
          ? "已读取服务器状态，但本机回执保存或恢复记录清理未完成。请检查浏览器存储后重试刷新。"
          : bizErrorMessage(e, "暂时无法刷新审核状态，请保留页面并重试。");
    return false;
  }
}
async function refreshStatus() {
  if (busy.value || inactive.value || props.disabled || props.editing) return;
  busy.value = true;
  error.value = "";
  confirmed.value = false;
  await syncCurrent();
  if (pending.value?.keyConflict)
    error.value =
      "本次提审记录发生冲突，已停止重新提交。请刷新状态并联系管理员核对。";
  busy.value = false;
}
async function prepare() {
  if (busy.value || unavailable.value || !canPrepare.value) return;
  if (pending.value?.receipt || pending.value?.keyConflict)
    return refreshStatus();
  busy.value = true;
  error.value = "";
  notice.value = "";
  confirmed.value = false;
  opened.value = true;
  issues.value = [];
  if (!pending.value) receipt.value = null;
  try {
    preview.value = await readCurrent();
    issues.value = pending.value ? [] : reviewIssues(preview.value);
  } catch (e) {
    preview.value = null;
    if (alive && !inactive.value)
      error.value = bizErrorMessage(e, "无法读取已保存草稿，请重试核对。");
  } finally {
    busy.value = false;
  }
}
function closePreview() {
  if (busy.value) return;
  opened.value = false;
  confirmed.value = false;
  preview.value = null;
  issues.value = [];
}

async function submitReview() {
  if (
    busy.value ||
    unavailable.value ||
    !confirmed.value ||
    (!pending.value && !preview.value) ||
    issues.value.length ||
    legacy.value ||
    pending.value?.receipt ||
    pending.value?.keyConflict
  )
    return;
  busy.value = true;
  error.value = "";
  notice.value = "";
  let sent = false;
  try {
    if (!pending.value) {
      const confirmedDraft = preview.value!;
      const current = await readCurrent();
      if (current.draftHash !== confirmedDraft.draftHash) {
        preview.value = current;
        confirmed.value = false;
        issues.value = reviewIssues(current);
        notice.value =
          "已保存内容或审核状态发生变化，下面已更新。请重新核对并确认。";
        return;
      }
      issues.value = reviewIssues(current);
      if (issues.value.length) {
        confirmed.value = false;
        return;
      }
      const attempt: PendingReview = {
        body: confirmedReviewBody(
          confirmedDraft,
          props.draft.activityId,
          crypto.randomUUID()
        )
      };
      // Persist before sending. Storage failure must never create an unrepeatable request.
      store().write(attempt);
      pending.value = attempt;
    } else {
      // Recovery is an immutable prior intent. Current GET facts never rebind its version.
      await verifyIdentity();
    }
    ensureActive();
    if (!isVersionedReviewBody(pending.value.body))
      throw new Error("旧版未决提审仅能读取核对，不能自动升级或重发。");
    sent = true;
    const result = await submitSimpleActivityReview(
      props.draft.activityId,
      pending.value.body
    );
    ensureActive();
    const data = result.data;
    if (
      result.code !== 0 ||
      data.activityId !== props.draft.activityId ||
      data.requestType !== "initial" ||
      data.directPublish
    )
      throw new Error("提审回执与本次活动不一致，请继续核对。");
    receipt.value = {
      id: data.id,
      status: data.status,
      requestVersion: data.requestVersion,
      submittedAt: data.submittedAt
    };
    professional.value = false;
    pending.value = { ...pending.value, receipt: receipt.value };
    try {
      store().write(pending.value);
    } catch {
      error.value =
        "已收到提审回执，但本机未能更新恢复记录，请保持本标签页并刷新状态。";
    }
    confirmed.value = false;
    notice.value =
      data.status === "pending"
        ? "已提交发布审核，请等待审核结果；本次提交不代表活动已发布。"
        : "已确认此前的提审请求。请以下方重新读取的活动和审核状态为准。";
    await syncCurrent();
  } catch (e) {
    if (!alive || inactive.value) return;
    confirmed.value = false;
    const kind = reviewFailure(e);
    if (!sent) {
      error.value =
        e instanceof DOMException
          ? "浏览器未能保存提审恢复记录，未发送提审请求。请检查存储设置后重新核对。"
          : bizErrorMessage(
              e,
              "提审前核对未完成，未发送提审请求。请检查网络后重试。"
            );
    } else if (kind === "uncertain") {
      error.value =
        "未收到明确提审结果。请勿另建请求；继续核对会复用这一次提交。";
      await syncCurrent();
    } else if (kind === "key-conflict") {
      if (pending.value) {
        pending.value = { ...pending.value, keyConflict: true };
        try {
          store().write(pending.value);
        } catch {
          storageBlocked.value = true;
        }
      }
      error.value =
        "本次提审记录发生冲突，已停止重新提交。请刷新状态并联系管理员核对。";
      await syncCurrent();
    } else {
      // sessionStorage may have been cloned while this page's first POST was in flight.
      // A rejection ends this attempt, not every send of the persisted operation.
      professional.value = kind === "professional";
      const reason =
        kind === "stale"
          ? "本次尝试遇到草稿版本变化"
          : kind === "professional"
            ? "本次尝试被专业配置限制拒绝"
            : bizErrorMessage(e, "此次核对未完成");
      error.value = `${reason}。上次提审结果仍待确认，其他发送可能尚未结束。已保留原提交，不会新建替代请求；请继续核对或联系管理员。`;
      await syncCurrent();
    }
  } finally {
    busy.value = false;
  }
}

function accountChanged(e: StorageEvent) {
  if (e.key === "user-info" || e.key === null) {
    invalid.value = true;
    preview.value = null;
    receipt.value = null;
  }
}
onMounted(() => {
  try {
    pending.value = store().read();
    receipt.value = pending.value?.receipt ?? null;
    if (pending.value?.keyConflict)
      error.value =
        "本次提审记录发生冲突，已停止重新提交。请刷新状态并联系管理员核对。";
  } catch (e) {
    storageBlocked.value = true;
    error.value =
      e instanceof Error ? e.message : "无法读取本标签页提审恢复记录。";
  }
  window.addEventListener("storage", accountChanged);
});
onBeforeUnmount(() => {
  alive = false;
  readGeneration++;
  window.removeEventListener("storage", accountChanged);
});
</script>

<template>
  <el-card class="mt-3" shadow="never" data-testid="simple-review">
    <h2 class="text-lg font-semibold">提交发布审核</h2>
    <p class="my-2">
      核对已保存的活动安排后提交。审核期间不能修改草稿，审核通过后才会发布。
    </p>
    <el-alert
      v-if="editing"
      type="info"
      :closable="false"
      title="请先保存或取消本次编辑，再核对提审。"
    />
    <el-alert
      v-if="inactive"
      type="error"
      :closable="false"
      title="登录信息已改变，请以原账号重新打开草稿。"
    />
    <template v-else>
      <el-alert
        v-if="legacy && !pending?.receipt"
        class="my-3"
        type="warning"
        :closable="false"
        title="旧版提审结果尚未确认，仅支持读取核对"
        description="已保留旧请求。当前版本不会替它补入新版本、换键或重新提交。刷新看到的最新审核不能证明这笔请求的结果，请保留本标签页并联系管理员核对。"
      />
      <el-alert
        v-if="pending && !pending.receipt"
        class="my-3"
        type="warning"
        :closable="false"
        title="本标签页还有一笔提审需要核对"
        description="请保留本标签页。继续核对沿用上次确认的版本，未完成时可能尝试提交。即使本次被拒绝，也不能确认其他发送已结束；核实前不能修改草稿或另建提审，可联系管理员协助。关闭页面、超时不等于取消，清除浏览器数据可能丢失恢复记录。"
      />
      <el-alert
        v-if="professional"
        class="my-3"
        type="warning"
        :closable="false"
        title="需要专业流程核对"
        description="读取成功或草稿可编辑不表示专业配置已通过核验。请联系活动负责人核对专业配置；刷新版本不会自动解决此限制。"
      />
      <el-alert
        v-if="notice"
        class="my-3"
        type="info"
        :closable="false"
        :title="notice"
        role="status"
      />
      <el-alert
        v-if="error"
        class="my-3"
        type="error"
        :closable="false"
        :title="error"
        role="alert"
      />
      <p v-if="receipt" class="my-2">
        已收到第 {{ receipt.requestVersion }} 次审核请求回执（{{
          reviewLabel({
            id: receipt.id,
            status: receipt.status,
            requestType: "initial"
          })
        }}）。当前状态以刷新结果为准。
      </p>
      <p class="my-2">当前审核：{{ reviewLabel(draft.review) }}</p>
      <el-button
        v-if="
          canPrepare && !opened && !pending?.receipt && !pending?.keyConflict
        "
        type="primary"
        :loading="busy"
        :disabled="unavailable"
        @click="prepare"
        >{{ pending ? "继续核对上次提审" : "核对并提交审核" }}</el-button
      >
      <el-button
        v-if="!opened || pending?.receipt || pending?.keyConflict"
        :loading="busy"
        :disabled="inactive || disabled || editing"
        @click="refreshStatus"
        >刷新审核状态</el-button
      >
      <section v-if="opened" class="mt-4" data-testid="review-confirmation">
        <h3 class="mb-3 font-semibold">提交前核对</h3>
        <el-button
          v-if="!preview"
          :loading="busy"
          :disabled="unavailable"
          @click="prepare"
          >重新读取已保存草稿</el-button
        >
        <template v-if="preview">
          <p v-if="pending" class="mb-3 text-sm">
            下方为当前已保存内容，仅供核对。恢复仍使用上次已确认的版本，不会以这些新内容替换原提交。
          </p>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="活动">{{
              preview.title
            }}</el-descriptions-item>
            <el-descriptions-item label="承办组织">{{
              organizationName || "请核对活动详情中的承办组织"
            }}</el-descriptions-item>
            <el-descriptions-item label="唯一场次（北京时间）"
              >{{ displayTime(preview.startAt) }} 至
              {{ displayTime(preview.endAt) }}</el-descriptions-item
            >
            <el-descriptions-item label="名额规则"
              >先到先得 ·
              {{
                preview.instance.capacity === null
                  ? "不限人数"
                  : `${preview.instance.capacity} 人`
              }}</el-descriptions-item
            >
            <el-descriptions-item label="报名截止">{{
              displayTime(preview.instance.registrationDeadline)
            }}</el-descriptions-item>
            <el-descriptions-item label="主地点"
              >{{ preview.location }}（{{
                visiblePlace
              }}）</el-descriptions-item
            >
            <el-descriptions-item label="场次安排"
              >{{ preview.session.name }} ·
              {{ preview.session.capacity ?? "不限" }} 人<br />
              {{ displayTime(preview.session.startAt) }} 至
              {{ displayTime(preview.session.endAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="签到窗口"
              >{{ displayTime(preview.session.checkInOpenAt) }} 至
              {{ displayTime(preview.session.checkInCloseAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="签退窗口"
              >{{ displayTime(preview.session.checkOutOpenAt) }} 至
              {{ displayTime(preview.session.checkOutCloseAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="准备时间">{{
              displayTime(preview.session.preparationStartAt)
            }}</el-descriptions-item>
            <el-descriptions-item label="默认岗位"
              >{{ preview.position.name }} ·
              {{ preview.position.capacity ?? "不限" }} 人<br />
              {{
                preview.position.startAt
                  ? displayTime(preview.position.startAt)
                  : "开始时间继承场次"
              }}
              至
              {{
                preview.position.endAt
                  ? displayTime(preview.position.endAt)
                  : "结束时间继承场次"
              }}
            </el-descriptions-item>
            <el-descriptions-item label="各用途地点">
              <div
                v-for="place in preview.places"
                :key="place.roleCode"
                class="mb-2"
              >
                <p>
                  {{ roleLabels[place.roleCode] }}：{{ place.inline?.name }} ·
                  {{ place.inline?.addressText }} ·
                  {{
                    visibilityOptions.find(
                      v => v.value === place.visibilityCode
                    )?.label
                  }}
                </p>
                <p v-if="place.inline?.instruction">
                  {{ place.inline.instruction }}
                </p>
                <p v-if="place.inline?.coordinate">
                  坐标：{{ place.inline.coordinate.longitude }}，{{
                    place.inline.coordinate.latitude
                  }}（{{ place.inline.coordinate.coordinateSystemCode }}）
                </p>
                <p v-if="place.inline?.providerCode">
                  地图来源：{{ place.inline.providerCode }}
                </p>
                <p>
                  签到候选：{{ place.inline?.checkInEligible ? "是" : "否"
                  }}<span v-if="place.inline?.radiusMeters !== undefined">
                    · 半径 {{ place.inline.radiusMeters }} 米</span
                  >（不代表已启用定位签到）
                </p>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="活动说明"
              ><p class="whitespace-pre-wrap">
                {{ preview.instance.description || "未填写" }}
              </p></el-descriptions-item
            >
            <el-descriptions-item label="参与准备"
              ><p class="whitespace-pre-wrap">
                {{ preview.instance.registrationNotes || "未填写" }}
              </p></el-descriptions-item
            >
            <el-descriptions-item
              v-if="preview.policies.length"
              label="已选政策"
            >
              <p
                v-for="policy in preview.policies"
                :key="`${policy.kind}:${policy.layerCode}`"
              >
                {{ policy.kind === "time" ? "时长" : "贡献" }}：{{
                  policy.name || "未返回命名政策"
                }}
                <span v-if="policy.version !== null"
                  >（第 {{ policy.version }} 版）</span
                >
              </p>
            </el-descriptions-item>
          </el-descriptions>
          <el-alert
            v-for="issue in issues"
            :key="issue"
            class="mt-2"
            type="warning"
            :closable="false"
            :title="issue"
          />
          <p class="my-3 text-sm">
            以上是同一次读取的已保存安排。新提交绑定本次确认的版本，变更后须重新核对。简单流程保留模板默认配置；本页不展示完整审核快照，资格和专业配置仍由服务端核验。
          </p>
        </template>
        <el-checkbox
          v-if="preview || pending"
          v-model="confirmed"
          class="review-confirmation-check"
          :disabled="
            busy ||
            unavailable ||
            legacy ||
            !!issues.length ||
            !!pending?.receipt ||
            !!pending?.keyConflict
          "
        >
          {{
            pending
              ? "继续核对上次已确认版本的提审结果；不以当前新版本替换原提交"
              : "我已核对本页已保存安排，确认按此版本提交审核；提交不代表已发布"
          }}
        </el-checkbox>
        <div class="mt-4 flex flex-wrap gap-2">
          <el-button :disabled="busy" @click="closePreview">{{
            pending ? "暂时关闭，稍后核对" : "取消，返回草稿"
          }}</el-button>
          <el-button
            v-if="!pending?.receipt && !pending?.keyConflict && !legacy"
            type="primary"
            :loading="busy"
            :disabled="
              unavailable ||
              !confirmed ||
              (!pending && !preview) ||
              !!issues.length
            "
            @click="submitReview"
            >{{ pending ? "确认核对上次提审" : "确认提交发布审核" }}</el-button
          >
        </div>
      </section>
    </template>
  </el-card>
</template>

<style scoped>
.review-confirmation-check {
  align-items: flex-start;
  height: auto;
}

.review-confirmation-check :deep(.el-checkbox__label) {
  line-height: 1.5;
  white-space: normal;
}
</style>
