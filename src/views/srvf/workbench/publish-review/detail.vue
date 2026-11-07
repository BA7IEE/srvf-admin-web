<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  useRoute,
  useRouter
} from "vue-router";
import { SrvfDetailShell, SrvfPermEmpty } from "@/srvf-kit";
import { getAdminMe, getMyPermissions } from "@/api/user";
import { useUserStoreHook } from "@/store/modules/user";
import {
  decidePublishReview,
  getPublishReview,
  getReferencedReviewPolicies,
  type PublishReview,
  type ReviewAction
} from "@/api/srvf-activity-publish-review";
import FrozenFacts from "./frozen-facts.vue";
import PolicyVersions from "./policy-versions.vue";
import {
  bindReferencedPolicies,
  needsReferencedPolicies,
  policyCoverageFor,
  policyToken,
  type PolicyCoverage
} from "./policy-binding";
import { objectValue } from "./snapshot";
import {
  actionPermission,
  canDecide,
  decisionBody,
  decisionFailure,
  decisionJournal,
  decisionReceipt,
  projectReview,
  readPermission,
  reviewRecord,
  reviewToken,
  statusLabels,
  type PendingDecision
} from "./state";

defineOptions({ name: "SrvfPublishReviewDetail" });
const route = useRoute(),
  router = useRouter(),
  userStore = useUserStoreHook();
const id = computed(() => String(route.params.reviewId ?? ""));
const review = ref<PublishReview | null>(null),
  userId = ref("");
const permissions = ref<string[]>([]);
const loading = ref(false),
  busy = ref(false),
  invalid = ref(false),
  storageBlocked = ref(false);
const error = ref("");
const pending = ref<PendingDecision | null>(null),
  lastReceipt = ref<PendingDecision | null>(null);
const dialog = ref<ReviewAction | null>(null),
  note = ref(""),
  confirmed = ref(false);
const openedSections = ref<number[]>([0, 1, 2]);
const policyCoverage = shallowRef<PolicyCoverage | null>(null);
const policyError = ref("");
const boundPolicies = computed(() =>
  review.value ? policyCoverageFor(review.value, policyCoverage.value) : null
);
const projection = computed(() =>
  review.value
    ? projectReview(review.value, policyCoverage.value)
    : { sections: [], issues: [] }
);
const canRead = computed(() => permissions.value.includes(readPermission));
const locked = computed(
  () =>
    !!pending.value ||
    storageBlocked.value ||
    invalid.value ||
    busy.value ||
    loading.value
);
const canApprove = computed(
  () =>
    !!review.value &&
    !locked.value &&
    canDecide(
      review.value,
      userId.value,
      permissions.value,
      "approve",
      policyCoverage.value
    )
);
const canReturn = computed(
  () =>
    !!review.value &&
    !locked.value &&
    canDecide(review.value, userId.value, permissions.value, "return")
);
const title = computed(() => {
  const activity = review.value?.snapshot.activity;
  return objectValue(activity) && typeof activity.title === "string"
    ? activity.title
    : "活动发布申请";
});
const outcome = computed(() => {
  const r = review.value;
  if (!r) return "";
  if (r.status === "approved")
    return r.requestType === "initial"
      ? "这份初发申请已通过，审核事务同时执行了发布。此记录不代表活动现在仍为已发布状态；当前活动状态需另行按可见权限核实。"
      : "这份变更申请已通过；此记录不代表活动当前状态。";
  if (r.status === "returned")
    return "已退回修改。请组织者查看退回原因，修改后重新提交新申请；本记录不会重新变为待审。";
  if (r.status === "pending")
    return "请核对本次冻结申请。通过初发申请会同时发布，退回会交由组织者修改后重新提审。";
  return "这份申请已结束，不能再作新决定。";
});
let generation = 0,
  disposed = false;
function journal() {
  return decisionJournal(
    sessionStorage,
    location.origin,
    userId.value,
    id.value
  );
}
function ensure(round: number) {
  if (disposed || round !== generation || invalid.value)
    throw Error("页面或账号已改变，请重新打开申请。");
}
function hidePreviousIdentity() {
  invalid.value = true;
  review.value = null;
  pending.value = null;
  lastReceipt.value = null;
  dialog.value = null;
  note.value = "";
  confirmed.value = false;
  permissions.value = [];
  policyCoverage.value = null;
  policyError.value = "";
}
async function identity(round: number, expected?: string) {
  const [me, auth] = await Promise.all([getAdminMe(), getMyPermissions()]);
  ensure(round);
  if (
    me.code !== 0 ||
    auth.code !== 0 ||
    !me.data.userId ||
    !Array.isArray(auth.data.permissions)
  )
    throw Error("无法核实当前身份与有效权限。");
  if (expected && me.data.userId !== expected) {
    hidePreviousIdentity();
    throw Error("账号已变化，请以原账号重新打开，保留原处理记录。");
  }
  return { userId: me.data.userId, permissions: auth.data.permissions };
}
async function read(round: number) {
  const result = await getPublishReview(id.value);
  ensure(round);
  if (result.code !== 0) throw Error("未取得有效审核内容。");
  return reviewRecord(result.data, id.value);
}
async function readPolicies(value: PublishReview, round: number) {
  if (!needsReferencedPolicies(value)) return null;
  const result = await getReferencedReviewPolicies(value.id);
  ensure(round);
  if (result.code !== 0) throw Error("未取得完整引用政策，不能通过。");
  return bindReferencedPolicies(value, result.data);
}
async function load() {
  if (busy.value) return;
  const round = ++generation;
  loading.value = true;
  error.value = "";
  review.value = null;
  dialog.value = null;
  confirmed.value = false;
  pending.value = null;
  lastReceipt.value = null;
  invalid.value = false;
  storageBlocked.value = false;
  policyCoverage.value = null;
  policyError.value = "";
  try {
    const auth = await identity(round);
    userId.value = auth.userId;
    permissions.value = auth.permissions;
    try {
      pending.value = journal().read();
      lastReceipt.value = journal().lastReceipt();
    } catch {
      storageBlocked.value = true;
      error.value =
        "无法读取本机处理记录，已停止新决定。请保留现场并联系管理员核对。";
    }
    if (!canRead.value) return;
    const result = await read(round);
    let policies: PolicyCoverage | null = null;
    try {
      policies = await readPolicies(result, round);
    } catch (e: unknown) {
      ensure(round);
      policyError.value = decisionFailure(e).message;
    }
    await identity(round, userId.value);
    ensure(round);
    review.value = result;
    policyCoverage.value = policies;
  } catch (e: unknown) {
    if (round === generation) error.value = decisionFailure(e).message;
  } finally {
    if (round === generation) loading.value = false;
  }
}
function open(action: ReviewAction) {
  if (action === "approve" ? !canApprove.value : !canReturn.value) return;
  dialog.value = action;
  note.value = "";
  confirmed.value = false;
  error.value = "";
}
function cancel() {
  if (!busy.value) {
    dialog.value = null;
    confirmed.value = false;
  }
}
function rememberSuccess(
  original: PendingDecision,
  receipt: ReturnType<typeof decisionReceipt>
) {
  pending.value = { ...original, receipt };
  journal().complete(original, receipt);
  lastReceipt.value = { ...original, receipt };
  pending.value = null;
}
async function transmit(original: PendingDecision, round: number) {
  try {
    const result = await decidePublishReview(
      original.reviewId,
      original.action,
      original.body
    );
    ensure(round);
    await identity(round, userId.value);
    ensure(round);
    if (result.code !== 0) throw Error("未取得成功处理回执。");
    const receipt = decisionReceipt(result.data, original);
    // This HTTP success is associated with the exact submitted request. GET status alone is not.
    review.value = reviewRecord(result.data, original.reviewId);
    try {
      rememberSuccess(original, receipt);
    } catch {
      error.value =
        "已收到成功回执，但本机归档失败。请保存回执后继续；不会发送新的决定。";
    }
    dialog.value = null;
    try {
      review.value = await read(round);
    } catch {
      if (!error.value)
        error.value = "处理成功；详情刷新失败，可稍后刷新，不需再次决定。";
    }
  } catch (e: unknown) {
    if (round !== generation || disposed) return;
    const failure = decisionFailure(e);
    error.value = failure.message;
    dialog.value = null;
    if (failure.code === 20143 && pending.value) {
      pending.value = { ...pending.value, keyConflict: true };
      try {
        journal().write(pending.value);
      } catch {
        storageBlocked.value = true;
      }
    }
  }
}
async function submit() {
  if (
    busy.value ||
    !dialog.value ||
    !review.value ||
    !confirmed.value ||
    locked.value
  )
    return;
  const shownPolicyToken = policyToken(policyCoverage.value);
  const action = dialog.value,
    shown = review.value,
    token = reviewToken(shown),
    round = generation;
  try {
    decisionBody(action, "local-validation-key", note.value);
  } catch (e: unknown) {
    error.value = decisionFailure(e).message;
    return;
  }
  busy.value = true;
  error.value = "";
  try {
    const auth = await identity(round, userId.value);
    permissions.value = auth.permissions;
    const latest = await read(round);
    const latestPolicies =
      action === "approve"
        ? await readPolicies(latest, round)
        : policyCoverage.value;
    const currentAuth = await identity(round, userId.value);
    permissions.value = currentAuth.permissions;
    ensure(round);
    if (
      reviewToken(latest) !== token ||
      (action === "approve" && policyToken(latestPolicies) !== shownPolicyToken)
    ) {
      review.value = latest;
      policyCoverage.value = latestPolicies;
      policyError.value = "";
      dialog.value = null;
      confirmed.value = false;
      throw Error("申请内容或状态已变化，请重新核对后决定。本次尚未发送。");
    }
    if (
      !canDecide(
        latest,
        userId.value,
        permissions.value,
        action,
        latestPolicies
      )
    )
      throw Error("当前状态、权限或本人提交限制不允许这项决定。本次尚未发送。");
    const original: PendingDecision = {
      version: 1,
      reviewId: shown.id,
      activityId: shown.activityId,
      requestType: shown.requestType,
      requestVersion: shown.requestVersion,
      action,
      body: decisionBody(action, crypto.randomUUID(), note.value)
    };
    try {
      journal().write(original);
    } catch {
      throw Error(
        "浏览器未能保存恢复记录，未发送处理请求。请检查存储后重新核对。"
      );
    }
    pending.value = original;
    await transmit(original, round);
  } catch (e: unknown) {
    if (round === generation) error.value = decisionFailure(e).message;
  } finally {
    if (round === generation) busy.value = false;
  }
}
async function recover() {
  if (
    busy.value ||
    !pending.value ||
    pending.value.keyConflict ||
    invalid.value
  )
    return;
  busy.value = true;
  error.value = "";
  const round = generation,
    original = JSON.parse(JSON.stringify(pending.value)) as PendingDecision;
  try {
    await identity(round, userId.value);
    ensure(round);
    if (original.receipt) {
      rememberSuccess(original, original.receipt);
      return;
    }
    // No replacement from latest GET, no opposite decision, no fresh operation key.
    await transmit(original, round);
  } catch (e: unknown) {
    if (round === generation) error.value = decisionFailure(e).message;
  } finally {
    if (round === generation) busy.value = false;
  }
}
function back() {
  if (!busy.value)
    router.push({
      path: "/srvf/workbench/approvals",
      query: { task: "publish" }
    });
}
function beforeUnload(event: BeforeUnloadEvent) {
  if (busy.value) {
    event.preventDefault();
    event.returnValue = "";
  }
}
window.addEventListener("beforeunload", beforeUnload);
onBeforeRouteLeave(() => {
  if (busy.value) return false;
  cancel();
  return true;
});
onBeforeRouteUpdate(() => {
  if (busy.value) return false;
  cancel();
  return true;
});
watch(id, () => load(), { immediate: true });
watch(
  () => userStore.username,
  () => {
    generation++;
    hidePreviousIdentity();
    busy.value = false;
    error.value = "账号已变化，请重新打开申请。";
  }
);
onBeforeUnmount(() => {
  disposed = true;
  generation++;
  window.removeEventListener("beforeunload", beforeUnload);
});
</script>

<template>
  <div data-testid="publish-review-detail" class="review-detail">
    <SrvfDetailShell
      :loading="loading"
      :found="!!review"
      :not-found-text="error || '未找到该申请或当前不可读取'"
      back-text="返回发布审核工作台"
      wrap
      @back="back"
    >
      <template #title
        ><h2>{{ title }}</h2>
        <el-tag v-if="review">{{
          statusLabels[review.status]
        }}</el-tag></template
      >
      <template #actions
        ><el-button :disabled="busy || loading" @click="load"
          >刷新申请记录</el-button
        ></template
      >
      <template #overview>
        <p v-if="review">
          {{ review.requestType === "initial" ? "初次发布" : "发布后变更" }} ·
          第 {{ review.requestVersion }} 次申请 · {{ review.submittedAt }}
        </p>
        <p>{{ outcome }}</p>
      </template>
    </SrvfDetailShell>
    <el-button v-if="!review && !loading" :disabled="busy" @click="load"
      >重新读取申请</el-button
    >
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
    />
    <el-alert
      v-if="policyError"
      :title="'引用政策读取失败：' + policyError"
      type="error"
      :closable="false"
      show-icon
    />
    <SrvfPermEmpty
      v-if="!loading && !canRead && !error"
      action="查看活动发布审核"
      :code="readPermission"
    />
    <el-alert
      v-if="lastReceipt?.receipt"
      type="success"
      :closable="false"
      title="已取得本次处理的成功回执"
      show-icon
    >
      审核人标识：{{ lastReceipt.receipt.reviewedByUserId }}；处理时间：{{
        lastReceipt.receipt.reviewedAt
      }}。当前活动状态不由此历史回执推定。
    </el-alert>
    <el-card
      v-if="pending"
      shadow="never"
      class="review-block"
      data-testid="decision-pending"
    >
      <h3>
        {{
          pending.receipt
            ? "成功回执待本机归档"
            : "上次处理尚未取得关联成功回执"
        }}
      </h3>
      <p>
        原意图：{{
          pending.action === "approve" ? "通过并发布" : "退回修改"
        }}；原说明：{{ pending.body.reviewNote || "未填写" }}。
      </p>
      <p>
        仅原样核对这次请求。刷新读到的审核状态、关闭页面或某次失败，都不能证明所有在途发送已结束；本页暂不允许新的或相反的决定。
      </p>
      <p>
        恢复记录只保留在本账号、本站点的当前标签页；关闭标签页或清除浏览器数据后不能保证找回。
      </p>
      <el-button
        :loading="busy"
        :disabled="busy || pending.keyConflict || invalid"
        @click="recover"
        >{{ pending.receipt ? "保存处理回执" : "原样核对上次处理" }}</el-button
      >
      <p v-if="pending.keyConflict">
        操作键冲突，已停止重发，请联系管理员核对。
      </p>
    </el-card>
    <template v-if="review">
      <el-card shadow="never" class="review-block">
        <h3>本次冻结申请</h3>
        <p>
          下方为提审时保存的申请内容和原基线，不是当前草稿。当前关联活动标题：{{
            review.activityTitle
          }}；当前承办组织标识：{{ review.organizationId }}。
        </p>
        <p>
          提交者标识：{{ review.submittedByUserId }}；申请记录：{{
            review.id
          }}。
        </p>
        <p v-if="review.affectedMemberCount !== undefined">
          当前受影响参与人数：{{
            review.affectedMemberCount
          }}（读取时人数，不是冻结人数）。
        </p>
        <p v-if="review.submittedByUserId === userId" data-testid="self-review">
          这是本人提交的申请，不能自行通过或退回，请交由其他有权人员处理。
        </p>
        <p v-if="review.reviewedByUserId">
          记录的审核人标识：{{ review.reviewedByUserId }}；处理时间：{{
            review.reviewedAt
          }}。
        </p>
        <p v-if="review.reviewNote">处理说明：{{ review.reviewNote }}</p>
        <el-alert
          v-if="projection.issues.length"
          title="本页尚未完整支持这份申请，不能通过"
          type="warning"
          :closable="false"
          show-icon
        >
          <ul>
            <li v-for="issue in projection.issues" :key="issue">{{ issue }}</li>
          </ul>
          可按权限写明原因退回；请勿把未展开内容视为不存在。
        </el-alert>
        <p v-else>
          本页支持的冻结内容已列在下方。此覆盖检查不代表申请来自简单入口；服务端仍会检查权限、引用与现场是否漂移。
        </p>
        <el-collapse v-model="openedSections">
          <el-collapse-item
            v-for="(section, index) in projection.sections"
            :key="index"
            :title="section.label"
            :name="index"
          >
            <FrozenFacts :facts="section.children ?? [section]" />
          </el-collapse-item>
        </el-collapse>
      </el-card>
      <PolicyVersions v-if="boundPolicies" :coverage="boundPolicies" />
      <el-card
        v-if="review.status === 'pending'"
        shadow="never"
        class="review-block"
      >
        <h3>处理这份申请</h3>
        <p>
          通过初发申请会立即执行发布。保险确认不会改动申请中的保险设置。操作仍受组织范围与自审限制。
        </p>
        <p
          v-if="
            !permissions.includes(actionPermission.approve) &&
            !permissions.includes(actionPermission.return)
          "
        >
          当前账号只有查看能力，请交由有处理权限的审核员。
        </p>
        <div class="decision-buttons">
          <el-button
            v-if="review.requestType === 'initial'"
            type="primary"
            :disabled="!canApprove"
            @click="open('approve')"
            >通过并发布</el-button
          >
          <el-button :disabled="!canReturn" @click="open('return')"
            >退回修改</el-button
          >
        </div>
      </el-card>
    </template>
    <el-dialog
      :model-value="!!dialog"
      :title="dialog === 'approve' ? '确认通过并发布' : '退回修改'"
      width="min(560px, 94vw)"
      :close-on-click-modal="false"
      :close-on-press-escape="!busy"
      :show-close="!busy"
      @update:model-value="cancel"
    >
      <p>{{ title }} · 第 {{ review?.requestVersion }} 次申请</p>
      <p>
        {{
          dialog === "approve"
            ? "此操作会通过这份冻结申请，并在同一事务发布活动。请核对活动安排及保险要求。"
            : "请写清组织者需要修改的内容；组织者修改后需重新提审。"
        }}
      </p>
      <el-input
        v-model="note"
        type="textarea"
        :rows="4"
        maxlength="500"
        show-word-limit
        :disabled="busy || !!pending"
        :placeholder="
          dialog === 'approve' ? '审核说明（可选）' : '退回原因（必填）'
        "
      />
      <el-checkbox v-model="confirmed" :disabled="busy || !!pending">{{
        dialog === "approve"
          ? "我已核对冻结内容及保险要求，确认通过并发布"
          : "我确认按上述原因退回这份申请"
      }}</el-checkbox>
      <p v-if="error" role="alert">{{ error }}</p>
      <template #footer
        ><el-button :disabled="busy" @click="cancel">取消</el-button
        ><el-button
          type="primary"
          :loading="busy"
          :disabled="!confirmed || busy || !!pending"
          @click="submit"
          >{{
            dialog === "approve" ? "确认通过并发布" : "确认退回修改"
          }}</el-button
        ></template
      >
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.review-detail {
  overflow-wrap: anywhere;
}

.review-block {
  margin-top: 12px;
}

.review-detail p {
  margin: 10px 0;
  line-height: 1.7;
}

.decision-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.review-detail :deep(.el-checkbox) {
  height: auto;
  margin-top: 16px;
  white-space: normal;
}

.review-detail :deep(.el-checkbox__label) {
  white-space: normal;
}
</style>
