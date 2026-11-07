<script setup lang="ts">
import { h, onMounted, onBeforeUnmount, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { addDialog, closeDialog } from "@/components/ReDialog";
import { hasPerms } from "@/utils/auth";
import { getAdminMe } from "@/api/user";
import {
  getSimpleDraft,
  type AdminSimpleDraftResponseDto
} from "@/api/srvf-simple-activity";
import { bizErrorMessage } from "@/api/srvf-error";
import CreateForm from "./create.vue";
import {
  recoveryStore,
  simpleDraftPath,
  statusLabel,
  reviewLabel
} from "./state";

const props = defineProps<{ quickCreate?: boolean }>();
const router = useRouter();
const userId = ref("");
const error = ref("");
const loading = ref(false);
const pending = ref(false);
const dialogOpen = ref(false);
const rows = ref<
  {
    id: string;
    draft?: AdminSimpleDraftResponseDto;
    error?: string;
    loading?: boolean;
  }[]
>([]);
const canCreate = computed(() => hasPerms("activity.create.record"));
const store = () =>
  recoveryStore(localStorage, sessionStorage, location.origin, userId.value);
let generation = 0;
async function loadRow(id: string) {
  const round = generation;
  const row = rows.value.find(r => r.id === id);
  if (!row) return;
  row.loading = true;
  row.error = "";
  try {
    const { data } = await getSimpleDraft(id);
    if (round === generation) row.draft = data;
  } catch (e) {
    if (round === generation)
      row.error = bizErrorMessage(e, "暂时无法打开，请重试或联系管理员");
  } finally {
    row.loading = false;
  }
}
async function load() {
  const round = ++generation;
  userId.value = "";
  rows.value = [];
  error.value = "";
  loading.value = true;
  try {
    const { data } = await getAdminMe();
    if (round !== generation) return;
    userId.value = data.userId;
    pending.value = !!store().pending();
    rows.value = store()
      .recent()
      .map(id => ({ id }));
    // Bounded reads; older references remain available through their link.
    for (const row of rows.value.slice(0, 5)) await loadRow(row.id);
  } catch (e) {
    error.value =
      e instanceof DOMException
        ? "浏览器存储不可用，请检查设置后重试"
        : bizErrorMessage(e, "无法读取本人草稿入口");
  } finally {
    if (round === generation) loading.value = false;
  }
}

function openCreate() {
  if (dialogOpen.value || !userId.value || error.value || !canCreate.value)
    return;
  dialogOpen.value = true;
  const form = ref<InstanceType<typeof CreateForm>>();
  addDialog({
    title: "筹备单场次活动",
    width: "min(720px, 96vw)",
    top: "5vh",
    hideFooter: true,
    closeOnClickModal: false,
    closeOnPressEscape: false,
    beforeClose: done => {
      if (!form.value?.busy) done();
    },
    closeCallBack: () => {
      dialogOpen.value = false;
      load();
    },
    contentRenderer: ({ options, index }) =>
      h(CreateForm, {
        ref: form,
        userId: userId.value,
        onCancel: () => {
          if (!form.value?.busy) closeDialog(options, index);
        },
        onCreated: id => {
          closeDialog(options, index);
          router.push(simpleDraftPath(id));
        }
      })
  });
}
function forget(id: string) {
  try {
    store().forget(id);
    rows.value = rows.value.filter(r => r.id !== id);
  } catch {
    error.value = "无法移除本机引用，请检查浏览器存储设置";
  }
}
function accountChanged(e: StorageEvent) {
  if (e.key === "user-info" || e.key === null) {
    generation++;
    userId.value = "";
    rows.value = [];
    error.value = "登录信息已改变，请刷新本人草稿入口";
  }
}
function preventClose(e: BeforeUnloadEvent) {
  if (pending.value) {
    e.preventDefault();
    e.returnValue = "";
  }
}
onMounted(async () => {
  window.addEventListener("storage", accountChanged);
  window.addEventListener("beforeunload", preventClose);
  await load();
  if (props.quickCreate) openCreate();
});
onBeforeUnmount(() => {
  generation++;
  window.removeEventListener("storage", accountChanged);
  window.removeEventListener("beforeunload", preventClose);
});
defineExpose({ openCreate });
</script>

<template>
  <el-card shadow="never" class="mb-4" data-testid="simple-entry">
    <div class="flex-bc flex-wrap gap-3">
      <div>
        <h2 class="text-lg font-semibold">筹备我的活动</h2>
        <p class="mt-1 text-sm">
          从模板创建单场次草稿，在活动内核对名额和安排。
        </p>
      </div>
      <el-button
        v-if="canCreate"
        type="primary"
        :disabled="loading || !userId || !!error"
        @click="openCreate"
        >{{ pending ? "继续上次创建" : "筹备单场次活动" }}</el-button
      >
    </div>
    <p v-if="!canCreate" class="mt-2">
      当前账号没有创建活动权限；已保存的草稿仍可通过下方入口查看。
    </p>
    <el-alert
      v-if="pending"
      class="mt-3"
      type="warning"
      :closable="false"
      title="本标签页还有待确认的创建，请先继续确认再关闭标签页；清除浏览器数据会丢失这份恢复记录。"
    />
    <h3 class="mt-4 font-semibold">我在本设备打开过的活动草稿</h3>
    <p class="mt-1 mb-3 text-sm text-(--el-text-color-secondary)">
      仅供当前账号在此浏览器找回，不是完整草稿列表。换设备或清除浏览器数据后，请用已收藏的详情链接打开；移除引用不会删除活动。
    </p>
    <div v-if="error" class="mb-2" role="alert">{{ error }}</div>
    <el-button link :loading="loading" @click="load"
      >刷新本人草稿入口</el-button
    >
    <p v-if="!loading && !error && !rows.length" class="mt-2">
      还没有本设备记录。创建成功后会出现在这里。
    </p>
    <ul class="mt-2 space-y-3">
      <li
        v-for="row in rows"
        :key="row.id"
        class="flex flex-wrap items-center gap-2"
      >
        <template v-if="row.draft">
          <el-button
            link
            type="primary"
            @click="router.push(simpleDraftPath(row.id))"
            >{{ row.draft.title }}</el-button
          >
          <el-tag>{{ statusLabel(row.draft.statusCode) }}</el-tag
          ><span>{{ reviewLabel(row.draft.review) }}</span>
        </template>
        <span v-else>{{ row.error || "本机保存的活动链接" }}</span>
        <el-button
          v-if="!row.draft"
          link
          :loading="row.loading"
          @click="loadRow(row.id)"
          >读取草稿</el-button
        >
        <el-popconfirm
          title="仅移除此浏览器中的引用，不会删除活动。确定移除？"
          @confirm="forget(row.id)"
          ><template #reference
            ><el-button link type="info">移除本机引用</el-button></template
          ></el-popconfirm
        >
      </li>
    </ul>
  </el-card>
</template>
