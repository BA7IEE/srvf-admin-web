<script setup lang="ts">
import { h, ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import {
  getRecruitmentCycle,
  updateRecruitmentCycle,
  promoteRecruitmentCycle,
  getPublicityList,
  CYCLE_STATUS_LABEL,
  type RecruitmentCycle,
  type PublicityList
} from "@/api/srvf-recruitment";
import CycleForm, { type CycleFormModel } from "./form.vue";
import { useRecruitmentApplications } from "../applications/utils/hook";
import ApplicationDetail from "../applications/detail.vue";

import EditPen from "~icons/ep/edit-pen";

defineOptions({
  name: "SrvfRecruitmentCycleCockpit"
});

const route = useRoute();
const cycleId = route.params.id as string;

/* ----------------------------- 头部：轮次信息 + 动作 ----------------------------- */
const cycle = ref<RecruitmentCycle | null>(null);
const cycleLoading = ref(false);
const formRef = ref();

const canUpdate = hasPerms("recruitment-cycle.update.record");
const canPromote = hasPerms("recruitment-application.promote.member");
const canReadApp = hasPerms("recruitment-application.read.record");

function cycleStatusText(code?: string) {
  return (code && CYCLE_STATUS_LABEL[code]) ?? code ?? "—";
}

async function fetchCycle() {
  cycleLoading.value = true;
  try {
    const { code, data } = await getRecruitmentCycle(cycleId);
    if (code === 0) cycle.value = data;
  } catch (error: any) {
    message(error?.response?.data?.message ?? "加载招新轮次失败", {
      type: "error"
    });
  } finally {
    cycleLoading.value = false;
  }
}

/** 开启 / 关闭本轮（PATCH statusCode；开 open 要求当前无其它 open 轮,后端裁决） */
function handleToggleStatus() {
  if (!cycle.value) return;
  const next = cycle.value.statusCode === "open" ? "closed" : "open";
  const action = next === "open" ? "开启" : "关闭";
  ElMessageBox.confirm(
    `确定要${action}招新轮次「${cycle.value.year} · ${cycle.value.name}」吗？`,
    `${action}本轮`,
    { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
  )
    .then(async () => {
      try {
        await updateRecruitmentCycle(cycleId, { statusCode: next });
        message(`${action}成功`, { type: "success" });
        fetchCycle();
      } catch (error: any) {
        message(error?.response?.data?.message ?? `${action}失败`, {
          type: "error"
        });
      }
    })
    .catch(() => {});
}

/** 编辑轮次设置（容量/见面会/QQ 群）；复用 CycleForm 编辑态 */
function openEditDialog() {
  if (!cycle.value) return;
  const c = cycle.value;
  addDialog({
    title: "编辑招新轮次",
    width: "42%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    sureBtnLoading: true,
    props: {
      formInline: {
        isEdit: true,
        year: c.year,
        name: c.name,
        capacity: c.capacity ?? undefined,
        meetingInfo: c.meetingInfo ?? "",
        qqGroup: c.qqGroup ?? ""
      } as CycleFormModel
    },
    contentRenderer: () => h(CycleForm, { ref: formRef }),
    beforeSure: (done, { options, closeLoading }) => {
      const curData = options.props.formInline as CycleFormModel;
      formRef.value.getRef().validate(async (valid: boolean) => {
        if (!valid) {
          closeLoading();
          return;
        }
        try {
          await updateRecruitmentCycle(cycleId, {
            ...(curData.capacity != null ? { capacity: curData.capacity } : {}),
            meetingInfo: curData.meetingInfo,
            qqGroup: curData.qqGroup
          });
          message("修改成功", { type: "success" });
          done();
          fetchCycle();
        } catch (error: any) {
          message(error?.response?.data?.message ?? "保存失败", {
            type: "error"
          });
          closeLoading();
        }
      });
    }
  });
}

/** 公示结束一键发号（批量发永久编号 + 建 User+Member；外籍 skip+report 不 block；幂等） */
function handlePromote() {
  if (!cycle.value) return;
  ElMessageBox.confirm(
    `确定对「${cycle.value.year} · ${cycle.value.name}」的公示报名一键发永久编号吗？将批量建 User+Member（外籍跳过需手动建档,空集零发,幂等可重跑）。`,
    "公示结束一键发号",
    { confirmButtonText: "确定发号", cancelButtonText: "取消", type: "warning" }
  )
    .then(async () => {
      try {
        const { code, data } = await promoteRecruitmentCycle(cycleId);
        if (code === 0) {
          ElMessageBox.alert(
            `已发号 ${data.promotedCount} 人；跳过 ${data.skippedCount} 人（外籍/需手动建档）。`,
            "发号结果",
            { confirmButtonText: "知道了", type: "success" }
          );
          fetchCycle();
          appOnSearch();
        }
      } catch (error: any) {
        message(error?.response?.data?.message ?? "一键发号失败", {
          type: "error"
        });
      }
    })
    .catch(() => {});
}

/* ----------------------------- 公示名单 drawer ----------------------------- */
const publicityVisible = ref(false);
const publicityLoading = ref(false);
const publicityData = ref<PublicityList | null>(null);

async function openPublicity() {
  publicityVisible.value = true;
  publicityLoading.value = true;
  publicityData.value = null;
  try {
    const { code, data } = await getPublicityList(cycleId);
    if (code === 0) publicityData.value = data;
  } catch (error: any) {
    message(error?.response?.data?.message ?? "加载公示名单失败", {
      type: "error"
    });
  } finally {
    publicityLoading.value = false;
  }
}

/* --------------- Tab：报名审核（按 cycleId 过滤，无轮次下拉） --------------- */
const {
  canRead: appCanRead,
  loading: appLoading,
  statusFilter: appStatusFilter,
  statusOptions: appStatusOptions,
  columns: appColumns,
  dataList: appDataList,
  pagination: appPagination,
  statusMeta: appStatusMeta,
  detailVisible: appDetailVisible,
  detailLoading: appDetailLoading,
  detailData: appDetailData,
  canMarkThreshold: appCanMarkThreshold,
  onSearch: appOnSearch,
  onFilterChange: appOnFilterChange,
  canDoEvaluate: appCanDoEvaluate,
  canDoResolve: appCanDoResolve,
  openDetail: appOpenDetail,
  handleMarkThreshold: appHandleMarkThreshold,
  handleEvaluate: appHandleEvaluate,
  handleResolve: appHandleResolve,
  openIdCardImage: appOpenIdCardImage,
  goMember: appGoMember,
  handleSizeChange: appHandleSizeChange,
  handleCurrentChange: appHandleCurrentChange
} = useRecruitmentApplications(cycleId);

onMounted(() => {
  fetchCycle();
  appOnSearch();
});
</script>

<template>
  <div class="main">
    <!-- 头部：轮次信息 + 动作 -->
    <el-card v-loading="cycleLoading" shadow="never" class="mb-2">
      <template v-if="cycle">
        <div class="cockpit-header">
          <div class="cockpit-header__title">
            <span class="cockpit-header__name">
              {{ cycle.year }} · {{ cycle.name }}
            </span>
            <el-tag :type="cycle.statusCode === 'open' ? 'success' : 'info'">
              {{ cycleStatusText(cycle.statusCode) }}
            </el-tag>
          </div>
          <div class="cockpit-header__actions">
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
            <el-button v-if="canReadApp" @click="openPublicity">
              公示名单
            </el-button>
            <el-button v-if="canPromote" type="primary" @click="handlePromote">
              一键发号
            </el-button>
          </div>
        </div>
        <el-descriptions :column="3" border class="mt-3">
          <el-descriptions-item label="容量">
            {{ cycle.capacity ?? "不限" }}
          </el-descriptions-item>
          <el-descriptions-item label="已发号">
            {{ cycle.issuedCount }}
          </el-descriptions-item>
          <el-descriptions-item label="QQ 群">
            {{ cycle.qqGroup || "—" }}
          </el-descriptions-item>
          <el-descriptions-item label="见面会" :span="3">
            {{ cycle.meetingInfo || "—" }}
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <el-empty
        v-else-if="!cycleLoading"
        description="未找到该轮次或无权查看"
      />
    </el-card>

    <!-- Tab：报名审核 -->
    <el-tabs class="cockpit-tabs">
      <el-tab-pane label="报名审核" name="applications">
        <template v-if="appCanRead">
          <PureTableBar
            title="报名审核"
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
                  <el-tag :type="appStatusMeta(row.statusCode).type">
                    {{ appStatusMeta(row.statusCode).text }}
                  </el-tag>
                </template>
                <template #operation="{ row }">
                  <el-button
                    class="reset-margin"
                    link
                    type="primary"
                    :size="size"
                    @click="appOpenDetail(row)"
                  >
                    详情
                  </el-button>
                  <el-button
                    v-if="row.hasIdCardImage"
                    class="reset-margin"
                    link
                    type="primary"
                    :size="size"
                    @click="appOpenIdCardImage(row)"
                  >
                    证件照
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
                    v-if="appCanDoResolve(row)"
                    class="reset-margin"
                    link
                    type="success"
                    :size="size"
                    @click="appHandleResolve(row, true)"
                  >
                    人工通过
                  </el-button>
                  <el-button
                    v-if="appCanDoResolve(row)"
                    class="reset-margin"
                    link
                    type="danger"
                    :size="size"
                    @click="appHandleResolve(row, false)"
                  >
                    人工驳回
                  </el-button>
                  <el-button
                    v-if="row.promotedMemberId"
                    class="reset-margin"
                    link
                    type="primary"
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
        <el-empty
          v-else
          description="您没有查看招新报名的权限（recruitment-application.read.record）"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 报名详情 drawer（全 PII + 门槛开关；标门槛回调到 hook） -->
    <el-drawer
      v-model="appDetailVisible"
      title="报名详情"
      size="56%"
      destroy-on-close
    >
      <div v-loading="appDetailLoading">
        <ApplicationDetail
          :app="appDetailData"
          :can-mark="appCanMarkThreshold"
          @mark="appHandleMarkThreshold"
        />
      </div>
    </el-drawer>

    <!-- 公示名单 drawer（姓名 + 拟发编号,拼音序,零敏感） -->
    <el-drawer
      v-model="publicityVisible"
      title="公示名单"
      size="50%"
      destroy-on-close
    >
      <div v-loading="publicityLoading">
        <template v-if="publicityData">
          <div class="publicity-summary">
            {{ publicityData.cycleYear }} 年度 · 可发号
            {{ publicityData.promotableCount }} 人 · 需手动建档（外籍）
            {{ publicityData.manualBuildCount }} 人
          </div>
          <el-table
            :data="publicityData.items"
            border
            size="small"
            row-key="applicationId"
          >
            <el-table-column label="姓名" min-width="120">
              <template #default="{ row }">{{ row.realName ?? "—" }}</template>
            </el-table-column>
            <el-table-column label="拟发编号" min-width="120">
              <template #default="{ row }">
                {{ row.proposedMemberNo ?? "—" }}
              </template>
            </el-table-column>
            <el-table-column label="外籍" min-width="80">
              <template #default="{ row }">
                {{ row.isForeigner ? "是" : "否" }}
              </template>
            </el-table-column>
            <el-table-column label="需手动建档" min-width="100">
              <template #default="{ row }">
                <el-tag
                  :type="row.needsManualBuild ? 'warning' : 'info'"
                  size="small"
                >
                  {{ row.needsManualBuild ? "是" : "否" }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </template>
        <el-empty v-else-if="!publicityLoading" description="暂无公示名单" />
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}

.cockpit-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;

  &__title {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  &__name {
    font-size: 18px;
    font-weight: 600;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.publicity-summary {
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
