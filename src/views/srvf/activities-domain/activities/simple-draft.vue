<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  useRoute,
  useRouter
} from "vue-router";
import { ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import { SrvfDetailShell } from "@/srvf-kit";
import { hasPerms } from "@/utils/auth";
import { getAdminMe } from "@/api/user";
import { bizErrorMessage } from "@/api/srvf-error";
import ReviewSubmission from "./simple/review.vue";
import ReturnedReview from "./simple/returned-review.vue";
import { reviewDraft } from "./simple/review-state";
import {
  getSimpleDraft,
  getSimpleOrganizations,
  saveSimpleDraft,
  type AdminSimpleDraftResponseDto,
  type AdminSaveSimpleActivityDto
} from "@/api/srvf-simple-activity";
import {
  activityListPath,
  canEditTextPlace,
  displayTime,
  fieldsFromDraft,
  matchesTarget,
  recoveryStore,
  reviewLabel,
  roleLabels,
  saveBody,
  statusLabel,
  timeProblem,
  visibilityOptions,
  type DraftFields
} from "./simple/state";

defineOptions({ name: "SrvfSimpleActivityDraft" });
const route = useRoute();
const router = useRouter();
const id = computed(() => String(route.params.id));
const draft = ref<AdminSimpleDraftResponseDto | null>(null);
const userId = ref("");
const organizationName = ref("");
const loading = ref(false);
const saving = ref(false);
const editing = ref(false);
const error = ref("");
const notice = ref("");
const storageWarning = ref("");
const accountInvalid = ref(false);
const formRef = ref<FormInstance>();
const fields = reactive<DraftFields>({
  title: "",
  startAt: "",
  endAt: "",
  location: "",
  capacity: null,
  registrationDeadline: "",
  description: "",
  registrationNotes: ""
});
const latest = ref<AdminSimpleDraftResponseDto | null>(null);
const uncertainTarget = ref<AdminSaveSimpleActivityDto | null>(null);
const conflict = ref(false);
const checking = ref(false);
const reviewState = ref({ busy: false, locked: false, pending: false });
const canSave = computed(
  () =>
    !!draft.value?.editable &&
    hasPerms("activity.update.record") &&
    !accountInvalid.value
);
const dirty = computed(
  () =>
    editing.value &&
    !!draft.value &&
    JSON.stringify(fields) !== JSON.stringify(fieldsFromDraft(draft.value))
);
const nextStep = computed(() => {
  const d = draft.value;
  if (!d) return "";
  if (d.review?.status === "pending")
    return "已提交审核，请等待审核结果。审核中不代表活动已发布。";
  if (d.statusCode === "published")
    return "活动已发布。请按现有参与和执行流程组织活动。";
  if (d.statusCode !== "draft")
    return "此活动已不在草稿阶段，请按当前活动状态处理。";
  if (d.review?.status === "returned")
    return "审核已退回。请先阅读上方退回意见，修改并保存草稿，再核对提交新的审核申请。";
  if (!d.editable)
    return "当前草稿暂不可编辑。请核实审核状态、模板有效性或联系管理员。";
  return "核对场次、名额和地点后，可在下方提交发布审核。审核期间不能修改草稿，审核通过后才会发布。";
});
const rules: FormRules = {
  title: [
    {
      required: true,
      whitespace: true,
      message: "请填写活动标题",
      trigger: "blur"
    }
  ],
  startAt: [{ required: true, message: "请选择开始时间", trigger: "change" }],
  endAt: [{ required: true, message: "请选择结束时间", trigger: "change" }],
  location: [
    { required: true, whitespace: true, message: "请填写地点", trigger: "blur" }
  ],
  capacity: [
    {
      validator: (_rule, value, callback) => {
        if (
          value !== null &&
          (!Number.isInteger(value) || value < 1 || value > 2147483647)
        )
          callback(new Error("人数须为 1 至 2147483647 的整数，或明确不限"));
        else callback();
      },
      trigger: "change"
    }
  ]
};

let generation = 0;
async function load() {
  const round = ++generation;
  loading.value = true;
  error.value = "";
  draft.value = null;
  organizationName.value = "";
  editing.value = false;
  latest.value = null;
  uncertainTarget.value = null;
  conflict.value = false;
  try {
    const [me, result] = await Promise.all([
      getAdminMe(),
      getSimpleDraft(id.value)
    ]);
    if (round !== generation) return;
    userId.value = me.data.userId;
    accountInvalid.value = false;
    if (result.code !== 0) throw new Error("未能读取有效草稿，请重试。");
    draft.value = reviewDraft(result.data, id.value);
    try {
      recoveryStore(
        localStorage,
        sessionStorage,
        location.origin,
        userId.value
      ).remember(result.data.activityId);
    } catch {
      storageWarning.value =
        "本设备未能保存找回记录，请收藏此详情链接后再离开。";
    }
    getSimpleOrganizations()
      .then(({ data }) => {
        if (round === generation)
          organizationName.value =
            data.find(o => o.organizationId === result.data.organizationId)
              ?.pathLabel ?? "";
      })
      .catch(() => {
        /* Draft remains readable if the optional organization label is unavailable. */
      });
  } catch (e) {
    if (round === generation)
      error.value = bizErrorMessage(
        e,
        "暂时无法打开本人草稿，请重试或联系管理员"
      );
  } finally {
    if (round === generation) loading.value = false;
  }
}

async function beginEdit() {
  if (loading.value || saving.value || reviewState.value.locked) return;
  await load();
  if (!draft.value || !canSave.value) return;
  Object.assign(fields, fieldsFromDraft(draft.value));
  editing.value = true;
  notice.value = "";
}

async function confirmLeave() {
  if (saving.value || checking.value || reviewState.value.busy) return false;
  if (reviewState.value.pending) {
    try {
      await ElMessageBox.confirm(
        "还有一笔提审需要核对。可回到本标签页继续确认；关闭标签页可能丢失恢复记录。确定离开？",
        "离开活动详情",
        {
          confirmButtonText: "离开，稍后核对",
          cancelButtonText: "留在此页",
          type: "warning"
        }
      );
      return true;
    } catch {
      return false;
    }
  }
  if (!dirty.value && !uncertainTarget.value) return true;
  try {
    await ElMessageBox.confirm(
      uncertainTarget.value
        ? "保存结果尚未确认，离开后可用此详情链接重新读取。确定离开？"
        : "尚有未保存的修改，确定放弃并离开编辑？",
      "离开编辑",
      {
        confirmButtonText: "放弃本次编辑",
        cancelButtonText: "继续编辑",
        type: "warning"
      }
    );
    return true;
  } catch {
    return false;
  }
}
async function cancelEdit() {
  if (await confirmLeave()) await load();
}

async function verifyAccount() {
  const { data } = await getAdminMe();
  if (data.userId !== userId.value) {
    accountInvalid.value = true;
    draft.value = null;
    editing.value = false;
    throw new Error("账号已改变");
  }
}

async function reconcile() {
  if (checking.value || accountInvalid.value) return;
  checking.value = true;
  const round = generation;
  try {
    await verifyAccount();
    if (round !== generation || accountInvalid.value) return;
    const result = await getSimpleDraft(id.value);
    if (round !== generation || accountInvalid.value) return;
    if (result.code !== 0) throw new Error("未能读取有效草稿，请重试。");
    const data = reviewDraft(result.data, id.value);
    latest.value = data;
    if (uncertainTarget.value && matchesTarget(data, uncertainTarget.value)) {
      draft.value = data;
      editing.value = false;
      uncertainTarget.value = null;
      conflict.value = false;
      error.value = "";
      notice.value = "已读回当前草稿，完整内容与本次保存目标一致。";
    } else {
      conflict.value = true;
      error.value =
        "已读取当前版本。本次编辑仍保留在表单中，请核对差异；没有再次发送保存。";
    }
  } catch (e) {
    error.value = bizErrorMessage(
      e,
      "无法核对当前版本，请保留编辑内容并重试读取"
    );
  } finally {
    checking.value = false;
  }
}

async function submit() {
  if (
    saving.value ||
    checking.value ||
    conflict.value ||
    uncertainTarget.value ||
    !draft.value ||
    !canSave.value
  )
    return;
  saving.value = true;
  const round = generation;
  const original = draft.value;
  if (!(await formRef.value?.validate().catch(() => false))) {
    saving.value = false;
    return;
  }
  if (round !== generation || accountInvalid.value) {
    saving.value = false;
    return;
  }
  error.value = timeProblem(
    fields.startAt,
    fields.endAt,
    fields.registrationDeadline
  );
  if (error.value) {
    saving.value = false;
    return;
  }
  const target = saveBody(original, fields);
  let sent = false;
  try {
    await verifyAccount();
    if (round !== generation || accountInvalid.value) return;
    sent = true;
    const result = await saveSimpleDraft(id.value, target);
    if (round !== generation || accountInvalid.value) return;
    if (result.code !== 0) throw new Error("保存回执无效，请重新读取核对。");
    const data = reviewDraft(result.data, id.value);
    draft.value = data;
    editing.value = false;
    notice.value = "草稿已保存，请核对下方场次和下一步。";
  } catch (e) {
    if (round !== generation || accountInvalid.value) {
      error.value = "登录信息已改变，请以原账号重新读取草稿核对保存结果";
      return;
    }
    const response = (
      e as { response?: { status: number; data?: { code?: number } } }
    )?.response;
    if (sent && response?.data?.code === 20255) {
      conflict.value = true;
      error.value =
        "草稿已被其他操作修改，本次没有覆盖。请读取最新版本核对，本次编辑已保留。";
    } else if (sent && (!response || response.status >= 500)) {
      uncertainTarget.value = target;
      error.value = "未收到明确保存结果，正在读回核对。请勿重复保存。";
      await reconcile();
    } else error.value = bizErrorMessage(e, "保存失败，编辑内容已保留");
  } finally {
    saving.value = false;
  }
}

async function useLatest() {
  if (!latest.value || !(await confirmLeave())) return;
  draft.value = latest.value;
  editing.value = false;
  latest.value = null;
  uncertainTarget.value = null;
  conflict.value = false;
  error.value = "";
  notice.value = "已采用刚读取的当前版本，可重新编辑。";
}

function invalidateAccount() {
  generation++;
  accountInvalid.value = true;
  draft.value = null;
  latest.value = null;
  editing.value = false;
  error.value = "登录信息已改变，请重新加载草稿";
}
function accountChanged(e: StorageEvent) {
  if (e.key === "user-info" || e.key === null) invalidateAccount();
}
function preventClose(e: BeforeUnloadEvent) {
  if (
    dirty.value ||
    saving.value ||
    uncertainTarget.value ||
    reviewState.value.busy ||
    reviewState.value.pending
  ) {
    e.preventDefault();
    e.returnValue = "";
  }
}
window.addEventListener("storage", accountChanged);
window.addEventListener("beforeunload", preventClose);
watch(id, load, { immediate: true });
onBeforeRouteLeave(confirmLeave);
onBeforeRouteUpdate(confirmLeave);
onBeforeUnmount(() => {
  generation++;
  window.removeEventListener("storage", accountChanged);
  window.removeEventListener("beforeunload", preventClose);
});
</script>

<template>
  <div class="m-6" data-testid="simple-draft">
    <SrvfDetailShell
      :loading="loading"
      :found="!!draft"
      not-found-text="暂时无法打开此草稿，请重试或联系管理员核实本人资格"
      back-text="返回活动与本机草稿入口"
      wrap
      @back="router.push(activityListPath)"
    >
      <template #title
        ><h1 class="text-xl font-semibold">{{ draft?.title }}</h1>
        <el-tag>{{ statusLabel(draft?.statusCode ?? "") }}</el-tag></template
      >
      <template #actions
        ><el-button
          v-if="!editing && canSave"
          type="primary"
          :disabled="loading || reviewState.locked"
          @click="beginEdit"
          >配置本次场次</el-button
        ><el-button
          v-if="!editing"
          :disabled="loading || reviewState.locked"
          @click="load"
          >刷新状态</el-button
        ></template
      >
      <template #overview>
        <p class="mt-3">
          {{ organizationName || "承办组织名称暂不可用" }} ·
          {{ reviewLabel(draft!.review) }}
        </p>
        <p class="mt-2 text-sm">
          此详情链接可收藏，用本人账号重新打开；刷新和返回不依赖活动列表能否看到草稿。
        </p>
      </template>
    </SrvfDetailShell>
    <el-alert
      v-if="error"
      class="mb-3"
      type="error"
      :closable="false"
      :title="error"
      role="alert"
    />
    <el-button v-if="!draft && !loading" class="mb-3" @click="load"
      >重新加载草稿</el-button
    >
    <el-alert
      v-if="notice"
      class="mb-3"
      type="success"
      :closable="false"
      :title="notice"
    />
    <el-alert
      v-if="storageWarning"
      class="mb-3"
      type="warning"
      :closable="false"
      :title="storageWarning"
    />
    <template v-if="draft">
      <ReturnedReview
        v-if="draft.review?.status === 'returned'"
        :draft="draft"
        :user-id="userId"
        :account-invalid="accountInvalid"
        :editing="editing"
        :can-edit="
          canSave &&
          draft.statusCode === 'draft' &&
          !loading &&
          !saving &&
          !checking &&
          !uncertainTarget &&
          !conflict &&
          !reviewState.locked
        "
        @edit="beginEdit"
        @identity-invalid="invalidateAccount"
      />
      <el-alert
        class="mb-3"
        type="info"
        :closable="false"
        show-icon
        title="名额分配：先到先得"
      >
        满足资格条件后，按服务端受理顺序分配本场次名额，满额可候补。此流程只有一个场次和一个默认岗位，分配方式由模板流程固定。
      </el-alert>
      <el-card v-if="editing" shadow="never" class="mb-3">
        <h2 class="mb-4 text-lg font-semibold">配置本次场次</h2>
        <el-form
          ref="formRef"
          :model="fields"
          :rules="rules"
          label-position="top"
          :disabled="saving || checking || !!uncertainTarget"
        >
          <el-form-item label="活动标题" prop="title"
            ><el-input v-model="fields.title" maxlength="100" show-word-limit
          /></el-form-item>
          <div class="grid gap-4 sm:grid-cols-2">
            <el-form-item label="开始时间（北京时间）" prop="startAt"
              ><el-date-picker
                v-model="fields.startAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss.SSS"
                format="YYYY-MM-DD HH:mm"
                class="w-full!"
            /></el-form-item>
            <el-form-item label="结束时间（北京时间）" prop="endAt"
              ><el-date-picker
                v-model="fields.endAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss.SSS"
                format="YYYY-MM-DD HH:mm"
                class="w-full!"
            /></el-form-item>
          </div>
          <p class="mb-3 text-sm">
            同一场次须在北京时间同一天结束；签到、签退和准备时间将按原模板规则同步调整。
          </p>
          <el-form-item label="本次人数上限" prop="capacity">
            <el-checkbox
              :model-value="fields.capacity === null"
              @change="
                value =>
                  (fields.capacity = value
                    ? null
                    : (draft?.instance.capacity ?? 1))
              "
              >不限人数</el-checkbox
            >
            <el-input-number
              v-if="fields.capacity !== null"
              v-model="fields.capacity"
              class="ml-3"
              :min="1"
              :max="2147483647"
              :precision="0"
              aria-label="本次人数上限"
            />
          </el-form-item>
          <el-form-item
            label="报名截止（北京时间，可清空为不限）"
            prop="registrationDeadline"
            ><el-date-picker
              v-model="fields.registrationDeadline"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss.SSS"
              format="YYYY-MM-DD HH:mm"
              clearable
              class="w-full!"
          /></el-form-item>
          <el-form-item label="主地点" prop="location"
            ><el-input
              v-model="fields.location"
              maxlength="200"
              :disabled="!canEditTextPlace(draft)"
          /></el-form-item>
          <p v-if="!canEditTextPlace(draft)" class="mb-3 text-sm">
            主地点含坐标或地图来源，本页保留原地点，请通过原地点配置流程修改。
          </p>
          <p class="mb-3 text-sm">
            所有地点用途、可见范围和已有坐标会一并保留。本页文字地点修改不会启用定位签到。
          </p>
          <el-form-item label="活动说明"
            ><el-input
              v-model="fields.description"
              type="textarea"
              :rows="3"
              maxlength="2000"
              show-word-limit
          /></el-form-item>
          <el-form-item label="参与准备"
            ><el-input
              v-model="fields.registrationNotes"
              type="textarea"
              :rows="3"
              maxlength="2000"
              show-word-limit
          /></el-form-item>
        </el-form>
        <div v-if="conflict || uncertainTarget" class="mb-3">
          <el-button :loading="checking" :disabled="saving" @click="reconcile"
            >读取当前版本并核对</el-button
          >
          <el-card v-if="latest" shadow="never" class="mt-3">
            <h3 class="mb-2 font-semibold">
              当前保存的内容（上方保留本次编辑）
            </h3>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="标题">{{
                latest.title
              }}</el-descriptions-item>
              <el-descriptions-item label="时间"
                >{{ displayTime(latest.startAt) }} —
                {{ displayTime(latest.endAt) }}</el-descriptions-item
              >
              <el-descriptions-item label="人数">{{
                latest.instance.capacity ?? "不限"
              }}</el-descriptions-item>
              <el-descriptions-item label="报名截止">{{
                displayTime(latest.instance.registrationDeadline)
              }}</el-descriptions-item>
              <el-descriptions-item label="活动说明">{{
                latest.instance.description || "未填写"
              }}</el-descriptions-item>
              <el-descriptions-item label="参与准备">{{
                latest.instance.registrationNotes || "未填写"
              }}</el-descriptions-item>
              <el-descriptions-item label="地点"
                ><p v-for="place in latest.places" :key="place.roleCode">
                  {{ roleLabels[place.roleCode] }}：{{
                    place.inline?.addressText
                  }}
                  ·
                  {{
                    visibilityOptions.find(
                      v => v.value === place.visibilityCode
                    )?.label
                  }}
                </p></el-descriptions-item
              >
              <el-descriptions-item label="状态"
                >{{ statusLabel(latest.statusCode) }} ·
                {{ reviewLabel(latest.review) }}</el-descriptions-item
              >
            </el-descriptions>
            <el-button class="mt-3" @click="useLatest"
              >放弃本次编辑，采用当前版本</el-button
            >
          </el-card>
        </div>
        <div class="flex flex-wrap gap-2">
          <el-button
            type="primary"
            :loading="saving"
            :disabled="checking || conflict || !!uncertainTarget || !canSave"
            @click="submit"
            >保存草稿</el-button
          >
          <el-button :disabled="saving || checking" @click="cancelEdit"
            >取消编辑并重新读取</el-button
          >
        </div>
      </el-card>
      <el-card v-else shadow="never" class="mb-3">
        <h2 class="mb-3 text-lg font-semibold">
          本次场次：{{ draft.session.name }}
        </h2>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="活动时间（北京时间）"
            >{{ displayTime(draft.session.startAt) }} —
            {{ displayTime(draft.session.endAt) }}</el-descriptions-item
          >
          <el-descriptions-item label="场次人数">{{
            draft.session.capacity ?? "不限人数"
          }}</el-descriptions-item>
          <el-descriptions-item label="默认岗位"
            >{{ draft.position.name }} ·
            {{ draft.position.capacity ?? "不限" }} 人</el-descriptions-item
          >
          <el-descriptions-item label="报名截止（北京时间）">{{
            draft.instance.registrationDeadline
              ? displayTime(draft.instance.registrationDeadline)
              : "不限"
          }}</el-descriptions-item>
          <el-descriptions-item label="签到窗口"
            >{{ displayTime(draft.session.checkInOpenAt) }} —
            {{
              displayTime(draft.session.checkInCloseAt)
            }}</el-descriptions-item
          >
          <el-descriptions-item label="签退窗口"
            >{{ displayTime(draft.session.checkOutOpenAt) }} —
            {{
              displayTime(draft.session.checkOutCloseAt)
            }}</el-descriptions-item
          >
          <el-descriptions-item
            v-if="draft.session.preparationStartAt"
            label="准备时间"
            >{{
              displayTime(draft.session.preparationStartAt)
            }}</el-descriptions-item
          >
          <el-descriptions-item label="地点"
            ><p v-for="place in draft.places" :key="place.roleCode">
              {{ roleLabels[place.roleCode] }}：{{ place.inline?.name }} ·
              {{ place.inline?.addressText }} ·
              {{
                visibilityOptions.find(v => v.value === place.visibilityCode)
                  ?.label
              }}<span v-if="!place.inline?.coordinate">（文字地点）</span>
            </p></el-descriptions-item
          >
          <el-descriptions-item label="活动说明"
            ><p class="whitespace-pre-wrap">
              {{ draft.instance.description || "未填写" }}
            </p></el-descriptions-item
          >
          <el-descriptions-item label="参与准备"
            ><p class="whitespace-pre-wrap">
              {{ draft.instance.registrationNotes || "未填写" }}
            </p></el-descriptions-item
          >
          <el-descriptions-item v-if="draft.policies.length" label="已选政策"
            ><p
              v-for="policy in draft.policies"
              :key="`${policy.kind}:${policy.layerCode}`"
            >
              {{ policy.kind === "time" ? "时长" : "贡献" }}：{{
                policy.name || "未选择命名政策"
              }}<span v-if="policy.version !== null"
                >（第 {{ policy.version }} 版）</span
              >
            </p></el-descriptions-item
          >
        </el-descriptions>
        <p v-if="!canSave" class="mt-3">
          当前不能编辑：需本人草稿、对应组织的修改权限、可用模板且没有待审请求。最终操作资格由服务端核实。
        </p>
      </el-card>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="下一步"
        :description="nextStep"
        data-testid="simple-next-step"
      />
      <ReviewSubmission
        :key="`${id}:${userId}`"
        :draft="draft"
        :user-id="userId"
        :organization-name="organizationName"
        :editing="editing"
        :disabled="
          loading || saving || checking || !!uncertainTarget || conflict
        "
        :account-invalid="accountInvalid"
        @updated="draft = $event"
        @identity-invalid="invalidateAccount"
        @state="reviewState = $event"
      />
    </template>
  </div>
</template>
