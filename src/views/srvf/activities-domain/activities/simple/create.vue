<script setup lang="ts">
import {
  computed,
  onMounted,
  onBeforeUnmount,
  reactive,
  ref,
  watch
} from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { hasPerms } from "@/utils/auth";
import { getAdminMe } from "@/api/user";
import { bizErrorMessage } from "@/api/srvf-error";
import {
  createSimpleActivity,
  getSimpleOrganizations,
  getSimpleTemplates,
  type AdminSimpleOrganizationOptionDto,
  type AdminSimpleTemplateVersionOptionDto,
  type AdminCreateSimpleActivityDto
} from "@/api/srvf-simple-activity";
import {
  beijingInput,
  beijingIso,
  recoveryStore,
  timeProblem,
  visibilityOptions,
  type PendingCreate
} from "./state";

const props = defineProps<{ userId: string }>();
const ownerId = props.userId;
const emit = defineEmits<{ created: [id: string]; cancel: [] }>();
const store = recoveryStore(
  localStorage,
  sessionStorage,
  location.origin,
  ownerId
);
const formRef = ref<FormInstance>();
const busy = ref(false);
const loadingOrganizations = ref(false);
const loadingTemplates = ref(false);
const organizations = ref<AdminSimpleOrganizationOptionDto[]>([]);
const templates = ref<AdminSimpleTemplateVersionOptionDto[]>([]);
const organizationError = ref("");
const templateError = ref("");
const error = ref("");
const blocked = ref(false);
const accountInvalid = ref(false);
const pending = ref<PendingCreate | null>(null);
const page = ref(1);
const total = ref(0);
const fields = reactive({
  organizationId: "",
  templateVersionId: "",
  title: "",
  startAt: "",
  endAt: "",
  location: "",
  visibility: "" as
    | ""
    | AdminCreateSimpleActivityDto["defaultPlaceVisibilityCode"]
});
const canCreate = computed(() => hasPerms("activity.create.record"));
const chosen = computed(() =>
  templates.value.find(t => t.id === fields.templateVersionId)
);
const required = (message: string) => [
  { required: true, message, trigger: "change" }
];
const rules: FormRules = {
  organizationId: required("请选择承办组织"),
  templateVersionId: required("请选择一个模板版本"),
  title: [
    {
      required: true,
      whitespace: true,
      message: "请填写活动标题",
      trigger: "blur"
    }
  ],
  startAt: required("请选择开始时间"),
  endAt: required("请选择结束时间"),
  location: [
    { required: true, whitespace: true, message: "请填写地点", trigger: "blur" }
  ],
  visibility: required("请明确地点对谁可见")
};

async function loadOrganizations() {
  loadingOrganizations.value = true;
  organizationError.value = "";
  try {
    organizations.value = (await getSimpleOrganizations()).data;
  } catch (e) {
    organizationError.value = bizErrorMessage(e, "无法读取本人可发起的组织");
  } finally {
    loadingOrganizations.value = false;
  }
}

let templateRequest = 0;
async function loadTemplates(nextPage = 1) {
  const request = ++templateRequest;
  templates.value = [];
  fields.templateVersionId = "";
  total.value = 0;
  page.value = nextPage;
  templateError.value = "";
  if (!fields.organizationId) return;
  loadingTemplates.value = true;
  try {
    const { data } = await getSimpleTemplates(fields.organizationId, nextPage);
    if (request !== templateRequest) return;
    templates.value = data.items;
    total.value = data.total;
  } catch (e) {
    if (request === templateRequest)
      templateError.value = bizErrorMessage(e, "模板加载失败");
  } finally {
    if (request === templateRequest) loadingTemplates.value = false;
  }
}

function restore() {
  try {
    pending.value = store.pending();
    if (pending.value) {
      const b = pending.value.body;
      Object.assign(fields, {
        ...b,
        startAt: beijingInput(b.startAt),
        endAt: beijingInput(b.endAt),
        visibility: b.defaultPlaceVisibilityCode
      });
    }
  } catch (e) {
    blocked.value = true;
    error.value = e instanceof Error ? e.message : "无法恢复创建记录";
  }
}

async function submit() {
  if (busy.value || blocked.value || !canCreate.value) return;
  busy.value = true;
  error.value = "";
  if (!pending.value) {
    if (!(await formRef.value?.validate().catch(() => false))) {
      busy.value = false;
      return;
    }
    const problem = timeProblem(fields.startAt, fields.endAt);
    if (problem) {
      error.value = problem;
      busy.value = false;
      return;
    }
    if (!chosen.value || !fields.visibility) {
      busy.value = false;
      return;
    }
  }
  const recovering = !!pending.value;
  let sent = false;
  try {
    if ((await getAdminMe()).data.userId !== ownerId || accountInvalid.value) {
      accountInvalid.value = true;
      blocked.value = true;
      error.value = "登录账号已改变，请关闭窗口并刷新页面";
      return;
    }
    if (!pending.value) {
      const record: PendingCreate = {
        body: {
          title: fields.title.trim(),
          organizationId: fields.organizationId,
          templateVersionId: fields.templateVersionId,
          operationKey: Array.from(
            crypto.getRandomValues(new Uint8Array(16)),
            byte => byte.toString(16).padStart(2, "0")
          ).join(""),
          startAt: beijingIso(fields.startAt),
          endAt: beijingIso(fields.endAt),
          location: fields.location.trim(),
          defaultPlaceVisibilityCode:
            fields.visibility as AdminCreateSimpleActivityDto["defaultPlaceVisibilityCode"]
        }
      };
      // Persist before dispatch. If storage fails, no creation request is made.
      store.putPending(record);
      pending.value = record;
    }
    let id = pending.value.activityId;
    if (!id) {
      sent = true;
      const { data } = await createSimpleActivity(pending.value.body);
      id = data.activityId;
      pending.value = { ...pending.value, activityId: id };
      store.putPending(pending.value);
    }
    store.remember(id);
    store.clearPending();
    if (!accountInvalid.value) emit("created", id);
  } catch (e) {
    const response = (
      e as { response?: { status: number; data?: { code?: number } } }
    )?.response;
    if (
      sent &&
      !recovering &&
      response &&
      response.status >= 400 &&
      response.status < 500 &&
      response.data?.code !== 20162
    ) {
      // A definite rejection can be corrected; an uncertain result retains its exact command.
      try {
        store.clearPending();
        pending.value = null;
      } catch {
        blocked.value = true;
      }
    }
    error.value =
      e instanceof DOMException
        ? "浏览器无法保存恢复记录，请保留此窗口并检查浏览器存储设置"
        : bizErrorMessage(e, "创建未能确认");
  } finally {
    busy.value = false;
  }
}

function preventClose(e: BeforeUnloadEvent) {
  if (busy.value || pending.value) {
    e.preventDefault();
    e.returnValue = "";
  }
}
function accountChanged(e: StorageEvent) {
  if (e.key === "user-info" || e.key === null) {
    blocked.value = true;
    accountInvalid.value = true;
    error.value =
      "登录信息已改变，请关闭窗口并刷新。已发出的创建记录仍按原账号保留。";
  }
}
watch(fields, () => {
  if (!pending.value && !blocked.value) error.value = "";
});
onMounted(() => {
  restore();
  loadOrganizations();
  window.addEventListener("beforeunload", preventClose);
  window.addEventListener("storage", accountChanged);
});
onBeforeUnmount(() => {
  templateRequest++;
  window.removeEventListener("beforeunload", preventClose);
  window.removeEventListener("storage", accountChanged);
});
defineExpose({ busy });
</script>

<template>
  <div data-testid="simple-create">
    <el-alert
      class="mb-4"
      type="info"
      :closable="false"
      show-icon
      title="创建草稿 → 核对名额和场次 → 完善后准备审核"
    >
      当前流程为一个场次、一个默认岗位，按先到先得分配名额；资格条件仍需满足，满额后可候补。创建后会显示实际名额与安排。
    </el-alert>
    <el-alert
      v-if="pending"
      class="mb-4"
      type="warning"
      :closable="false"
      show-icon
      title="有一笔创建需要继续确认"
    >
      请保持本标签页打开。继续确认会复用原来的内容，不会另建一场活动；关闭窗口后可从活动入口恢复，关闭标签页或清除浏览器数据可能丢失恢复记录。
    </el-alert>
    <el-alert
      v-if="error"
      class="mb-4"
      type="error"
      :closable="false"
      :title="error"
      role="alert"
    />
    <el-form
      v-if="!accountInvalid"
      ref="formRef"
      :model="fields"
      :rules="rules"
      label-position="top"
      :disabled="busy || !!pending || blocked"
    >
      <h3 class="mb-3 font-semibold">1. 选择组织和模板</h3>
      <el-form-item label="承办组织" prop="organizationId">
        <el-select
          v-model="fields.organizationId"
          class="w-full"
          :loading="loadingOrganizations"
          placeholder="选择本人可发起的组织"
          @change="loadTemplates(1)"
        >
          <el-option
            v-if="
              pending &&
              !organizations.some(
                o => o.organizationId === fields.organizationId
              )
            "
            :value="fields.organizationId"
            label="原已选承办组织（继续确认原请求）"
          />
          <el-option
            v-for="org in organizations"
            :key="org.organizationId"
            :value="org.organizationId"
            :label="org.pathLabel"
          />
        </el-select>
      </el-form-item>
      <p
        v-if="
          !loadingOrganizations && !organizationError && !organizations.length
        "
        class="mb-3"
      >
        当前没有可发起的组织。需要有效正式成员身份及对应组织的发起资格，请联系管理员核实。
      </p>
      <el-form-item label="活动模板版本" prop="templateVersionId">
        <el-select
          v-model="fields.templateVersionId"
          class="w-full"
          :loading="loadingTemplates"
          :disabled="!fields.organizationId || !!templateError"
          placeholder="选择适用于本次活动的模板版本"
        >
          <el-option
            v-if="pending"
            :value="fields.templateVersionId"
            label="原已选模板版本（继续确认原请求）"
          />
          <el-option
            v-for="t in templates"
            :key="t.id"
            :value="t.id"
            :label="`${t.family.name} · ${t.name}（第 ${t.version} 版）`"
          />
        </el-select>
        <el-pagination
          v-if="total > 20"
          class="mt-2"
          size="small"
          layout="prev, pager, next"
          :page-size="20"
          :total="total"
          :current-page="page"
          @current-change="loadTemplates"
        />
      </el-form-item>
      <p
        v-if="
          fields.organizationId &&
          !loadingTemplates &&
          !templateError &&
          !templates.length &&
          !pending
        "
        class="mb-3"
      >
        该组织当前没有可用的常规单场次模板，请联系模板维护人员。
      </p>
      <p v-if="chosen" class="mb-4 text-sm text-(--el-text-color-secondary)">
        已选第
        {{ chosen.version }}
        版。模板决定初始配置，创建后可核对本次活动的实际人数、地点和政策。
      </p>
      <h3 class="mb-3 font-semibold">2. 填写本次安排</h3>
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
        开始和结束须在北京时间同一天。签到、签退窗口由模板规则随场次时间生成。
      </p>
      <el-form-item label="活动地点" prop="location"
        ><el-input
          v-model="fields.location"
          maxlength="200"
          show-word-limit
          placeholder="填写便于参与者找到的地点"
      /></el-form-item>
      <el-form-item label="地点对谁可见" prop="visibility"
        ><el-select
          v-model="fields.visibility"
          class="w-full"
          placeholder="请选择可见范围"
          ><el-option
            v-for="option in visibilityOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label" /></el-select
      ></el-form-item>
      <p class="mb-3 text-sm">此处填写文字地点，不会自动设置定位签到。</p>
    </el-form>
    <div v-if="organizationError" class="mb-3" role="alert">
      {{ organizationError }}
      <el-button link :disabled="busy" @click="loadOrganizations"
        >重试组织加载</el-button
      >
    </div>
    <div v-if="templateError" class="mb-3" role="alert">
      {{ templateError }}
      <el-button link :disabled="busy" @click="loadTemplates(page)"
        >重试模板加载</el-button
      >
    </div>
    <p v-if="!canCreate" class="mb-3">
      当前账号没有创建活动权限，请联系管理员。
    </p>
    <div class="flex flex-wrap justify-end gap-2">
      <el-button :disabled="busy" @click="emit('cancel')">{{
        pending ? "暂时关闭，稍后确认" : "取消"
      }}</el-button>
      <el-button
        type="primary"
        :loading="busy"
        :disabled="blocked || !canCreate"
        @click="submit"
        >{{ pending ? "继续确认创建结果" : "创建草稿并核对场次" }}</el-button
      >
    </div>
  </div>
</template>
