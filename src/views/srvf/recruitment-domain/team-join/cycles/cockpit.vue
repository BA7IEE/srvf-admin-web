<script setup lang="ts">
import { bizErrorMessage } from "@/api/srvf-error";
import { h, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { SrvfDetailShell, SrvfPermEmpty, SrvfStatusTag } from "@/srvf-kit";
import {
  getTeamJoinCycle,
  updateTeamJoinCycle,
  TJ_CYCLE_STATUS_LABEL,
  TJ_APP_STATUS_LABEL,
  TJ_APP_STATUS_TAG,
  type TeamJoinCycle
} from "@/api/srvf-team-join";
import TjCycleForm, { type TjCycleFormModel } from "./form.vue";
import { useTeamJoinApplications } from "../applications/utils/hook";
import TjApplicationDetail from "../applications/detail.vue";

import EditPen from "~icons/ep/edit-pen";

defineOptions({
  name: "SrvfTeamJoinCycleCockpit"
});

const route = useRoute();
const router = useRouter();
const cycleId = route.params.id as string;

/* ----------------------------- 头部：入队轮信息 + 动作 ----------------------------- */
const cycle = ref<TeamJoinCycle | null>(null);
const cycleLoading = ref(false);
const formRef = ref();

const canUpdate = hasPerms("team-join-cycle.update.record");

function cycleStatusText(code?: string) {
  return (code && TJ_CYCLE_STATUS_LABEL[code]) ?? code ?? "—";
}

async function fetchCycle() {
  cycleLoading.value = true;
  try {
    const { code, data } = await getTeamJoinCycle(cycleId);
    if (code === 0) cycle.value = data;
  } catch (error: any) {
    message(bizErrorMessage(error, "加载入队轮失败"), {
      type: "error"
    });
  } finally {
    cycleLoading.value = false;
  }
}

function handleToggleStatus() {
  if (!cycle.value) return;
  const next = cycle.value.statusCode === "open" ? "closed" : "open";
  const action = next === "open" ? "开启" : "关闭";
  ElMessageBox.confirm(
    `确定要${action}入队轮「${cycle.value.year} · ${cycle.value.name}」吗？`,
    `${action}本轮`,
    { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
  )
    .then(async () => {
      try {
        await updateTeamJoinCycle(cycleId, { statusCode: next });
        message(`${action}成功`, { type: "success" });
        fetchCycle();
      } catch (error: any) {
        message(bizErrorMessage(error, `${action}失败`), {
          type: "error"
        });
      }
    })
    .catch(() => {});
}

function openEditDialog() {
  if (!cycle.value) return;
  const c = cycle.value;
  addDialog({
    title: "编辑入队轮",
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    sureBtnLoading: true,
    props: {
      formInline: {
        isEdit: true,
        year: c.year,
        name: c.name
      } as TjCycleFormModel
    },
    contentRenderer: () => h(TjCycleForm, { ref: formRef }),
    beforeSure: (done, { options, closeLoading }) => {
      const curData = options.props.formInline as TjCycleFormModel;
      formRef.value.getRef().validate(async (valid: boolean) => {
        if (!valid) {
          closeLoading();
          return;
        }
        try {
          await updateTeamJoinCycle(cycleId, { name: curData.name });
          message("修改成功", { type: "success" });
          done();
          fetchCycle();
        } catch (error: any) {
          message(bizErrorMessage(error, "保存失败"), {
            type: "error"
          });
          closeLoading();
        }
      });
    }
  });
}

/* --------------- Tab：入队申请审核（按 cycleId 过滤，无轮次下拉） --------------- */
// 显式锚定默认激活 tab：EP el-tabs 无 v-model/default-value 时 currentName 默认 "0"，
// 与具名 tab-pane 不匹配 → 首屏 pane 被 v-show 隐藏；锚到唯一 tab「applications」即稳定落屏。
const activeTab = ref<"applications">("applications");

const {
  canRead: appCanRead,
  loading: appLoading,
  statusFilter: appStatusFilter,
  statusOptions: appStatusOptions,
  columns: appColumns,
  dataList: appDataList,
  pagination: appPagination,
  detailVisible: appDetailVisible,
  detailLoading: appDetailLoading,
  detailData: appDetailData,
  onSearch: appOnSearch,
  onFilterChange: appOnFilterChange,
  canDoGate: appCanDoGate,
  canDoEvaluate: appCanDoEvaluate,
  canDoJoin: appCanDoJoin,
  openDetail: appOpenDetail,
  openGateDialog: appOpenGateDialog,
  handleEvaluate: appHandleEvaluate,
  openJoinDialog: appOpenJoinDialog,
  goMember: appGoMember,
  handleSizeChange: appHandleSizeChange,
  handleCurrentChange: appHandleCurrentChange
} = useTeamJoinApplications(cycleId);

onMounted(() => {
  fetchCycle();
  appOnSearch();
});
</script>

<template>
  <div class="main">
    <!-- 头部：入队轮信息 + 动作 -->
    <SrvfDetailShell
      :loading="cycleLoading"
      :found="!!cycle"
      not-found-text="未找到该入队轮或无权查看"
      back-text="返回入队轮次"
      wrap
      @back="router.push('/srvf/recruitment-domain/team-join')"
    >
      <template #title>
        <span class="cockpit-header__name">
          {{ cycle.year }} · {{ cycle.name }}
        </span>
        <el-tag :type="cycle.statusCode === 'open' ? 'success' : 'info'">
          {{ cycleStatusText(cycle.statusCode) }}
        </el-tag>
      </template>
      <template #actions>
        <el-button
          v-if="canUpdate"
          :icon="useRenderIcon(EditPen)"
          @click="openEditDialog"
        >
          编辑
        </el-button>
        <el-button
          v-if="canUpdate"
          :type="cycle.statusCode === 'open' ? 'warning' : 'success'"
          @click="handleToggleStatus"
        >
          {{ cycle.statusCode === "open" ? "关闭本轮" : "开启本轮" }}
        </el-button>
      </template>

      <!-- Tab：入队申请审核 -->
      <el-tabs v-model="activeTab" class="cockpit-tabs">
        <el-tab-pane label="入队申请审核" name="applications">
          <template v-if="appCanRead">
            <PureTableBar
              title="入队申请审核"
              :columns="appColumns"
              @refresh="appOnSearch"
            >
              <template #buttons>
                <el-select
                  v-model="appStatusFilter"
                  class="w-40!"
                  placeholder="按状态过滤"
                  @change="appOnFilterChange"
                >
                  <el-option
                    v-for="opt in appStatusOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </template>
              <template v-slot="{ size, dynamicColumns }">
                <pure-table
                  row-key="id"
                  adaptive
                  :adaptiveConfig="{ offsetBottom: 108 }"
                  align-whole="center"
                  table-layout="auto"
                  :loading="appLoading"
                  :size="size"
                  :data="appDataList"
                  :columns="dynamicColumns"
                  :pagination="appPagination"
                  :paginationSmall="size === 'small' ? true : false"
                  :header-cell-style="{
                    background: 'var(--el-fill-color-light)',
                    color: 'var(--el-text-color-primary)'
                  }"
                  @page-size-change="appHandleSizeChange"
                  @page-current-change="appHandleCurrentChange"
                >
                  <template #statusCode="{ row }">
                    <SrvfStatusTag
                      :value="row.statusCode"
                      :label-dict="TJ_APP_STATUS_LABEL"
                      :tag-dict="TJ_APP_STATUS_TAG"
                    />
                  </template>
                  <template #operation="{ row }">
                    <el-button
                      class="reset-margin"
                      link
                      :size="size"
                      @click="appOpenDetail(row)"
                    >
                      详情
                    </el-button>
                    <el-button
                      v-if="appCanDoGate(row)"
                      class="reset-margin"
                      link
                      :size="size"
                      @click="appOpenGateDialog(row)"
                    >
                      标考核
                    </el-button>
                    <el-button
                      v-if="appCanDoEvaluate(row)"
                      class="reset-margin"
                      link
                      type="success"
                      :size="size"
                      @click="appHandleEvaluate(row, true)"
                    >
                      评定通过
                    </el-button>
                    <el-button
                      v-if="appCanDoEvaluate(row)"
                      class="reset-margin"
                      link
                      type="danger"
                      :size="size"
                      @click="appHandleEvaluate(row, false)"
                    >
                      淘汰
                    </el-button>
                    <el-button
                      v-if="appCanDoJoin(row)"
                      class="reset-margin"
                      link
                      type="success"
                      :size="size"
                      @click="appOpenJoinDialog(row)"
                    >
                      一键入队
                    </el-button>
                    <el-button
                      v-if="row.statusCode === 'joined'"
                      class="reset-margin"
                      link
                      :size="size"
                      @click="appGoMember(row)"
                    >
                      查看队员
                    </el-button>
                  </template>
                </pure-table>
              </template>
            </PureTableBar>
          </template>
          <SrvfPermEmpty
            v-else
            action="查看入队申请"
            code="team-join-application.read.record"
          />
        </el-tab-pane>
      </el-tabs>
    </SrvfDetailShell>

    <!-- 入队申请详情 drawer（gates 实况 + 贡献值 + 候选部门） -->
    <el-drawer
      v-model="appDetailVisible"
      title="入队申请详情"
      size="58%"
      destroy-on-close
    >
      <div v-loading="appDetailLoading">
        <TjApplicationDetail :app="appDetailData" />
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}

.cockpit-header__name {
  font-size: 18px;
  font-weight: 600;
}
</style>
