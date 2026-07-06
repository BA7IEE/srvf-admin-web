<script setup lang="ts">
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
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
  getPublicityList,
  CYCLE_STATUS_LABEL,
  type RecruitmentCycle,
  type PublicityList
} from "@/api/srvf-recruitment";
import CycleForm, { type CycleFormModel } from "./form.vue";
import { useRecruitmentApplications } from "../applications/utils/hook";
import ApplicationDetail from "../applications/detail.vue";
import { useRecruitmentTools } from "./utils/tools-hook";

import EditPen from "~icons/ep/edit-pen";
import DownloadLine from "~icons/ri/download-2-line";
import CheckboxMultiple from "~icons/ri/checkbox-multiple-line";

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

/** 招新工作台补件：stats + 发号预检(替代原简单确认框) + 批量标门槛 + 导出 */
const {
  canReadStats: toolsCanReadStats,
  canMarkThreshold: toolsCanMarkThreshold,
  canExport: toolsCanExport,
  stats,
  statsLoading,
  loadStats,
  precheckVisible,
  precheckLoading,
  precheckData,
  openPrecheck,
  skipReasonLabel,
  confirmPromote,
  batchMarkVisible,
  batchMarkSubmitting,
  batchMarkResult,
  batchMarkThresholdCode,
  batchMarkCompleted,
  batchMarkRawText,
  THRESHOLD_CODES,
  THRESHOLD_LABEL: toolsThresholdLabel,
  openBatchMark,
  submitBatchMark,
  exportLoading,
  exportFilterOptions,
  handleExport
} = useRecruitmentTools(cycleId);

/** 发号预检确认后才真正调用 promote,并刷新轮次 + 报名列表 + stats */
function handlePromoteConfirmed() {
  confirmPromote(() => {
    fetchCycle();
    appOnSearch();
    loadStats();
  });
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
  loadStats();
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
            <el-button v-if="canPromote" type="primary" @click="openPrecheck">
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

    <!-- 工作台聚合 stats（今日/待处理/门槛/评定/发号 五组,纯读零写,同源业务态计数） -->
    <el-card
      v-if="toolsCanReadStats"
      v-loading="statsLoading"
      shadow="never"
      class="mb-2"
    >
      <template v-if="stats">
        <div class="stats-grid">
          <div class="stats-group">
            <div class="stats-group__title">今日</div>
            <div class="stats-group__row">
              新报名 {{ stats.today.newApplications }} · 发临时号
              {{ stats.today.tempNoIssued }} · 人工处理
              {{ stats.today.manualProcessed }}
            </div>
          </div>
          <div class="stats-group">
            <div class="stats-group__title">待处理</div>
            <div class="stats-group__row">
              待人工 {{ stats.pending.manualTotal }}（普通
              {{ stats.pending.manualNormal }} / 高风险
              {{ stats.pending.manualHigh }} / 系统异常
              {{ stats.pending.manualSystem }}）
            </div>
            <div class="stats-group__row">
              待评定 {{ stats.pending.pendingEvaluation }} · 待发号
              {{ stats.pending.pendingIssuance }}
            </div>
          </div>
          <div class="stats-group">
            <div class="stats-group__title">
              门槛跟踪中 {{ stats.threshold.tracking }} 人
            </div>
            <div class="stats-group__row">
              <span
                v-for="item in stats.threshold.byThreshold"
                :key="item.code"
                class="stats-group__pill"
              >
                {{ item.name }} {{ item.completedCount }}
              </span>
            </div>
          </div>
          <div class="stats-group">
            <div class="stats-group__title">综合评定</div>
            <div class="stats-group__row">
              待评定 {{ stats.evaluation.pending }} · 已通过
              {{ stats.evaluation.passed }} · 淘汰
              {{ stats.evaluation.eliminated }}
            </div>
          </div>
          <div class="stats-group">
            <div class="stats-group__title">公示发号</div>
            <div class="stats-group__row">
              公示中 {{ stats.issuance.inPublicity }} · 可一键发号
              {{ stats.issuance.oneClickIssuable }} · 需手动建档
              {{ stats.issuance.needManualBuild }} · 已发号
              {{ stats.issuance.promoted }}
            </div>
          </div>
        </div>
      </template>
      <el-empty v-else-if="!statsLoading" description="暂无工作台数据" />
    </el-card>

    <!-- Tab：报名审核 -->
    <el-tabs v-model="activeTab" class="cockpit-tabs">
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
                class="w-40! mr-2!"
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
              <el-button
                v-if="toolsCanMarkThreshold"
                :icon="useRenderIcon(CheckboxMultiple)"
                @click="openBatchMark"
              >
                批量标门槛
              </el-button>
              <el-dropdown
                v-if="toolsCanExport"
                class="ml-2"
                @command="handleExport"
              >
                <el-button
                  :icon="useRenderIcon(DownloadLine)"
                  :loading="exportLoading"
                >
                  导出
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="opt in exportFilterOptions"
                      :key="opt.value"
                      :command="opt.value"
                    >
                      {{ opt.label }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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
        <SrvfPermEmpty
          v-else
          action="查看招新报名"
          code="recruitment-application.read.record"
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

    <!-- 一键发号预检 dialog（纯读,与实发结构性同源;确认后才真正调用 promote） -->
    <el-dialog
      v-model="precheckVisible"
      title="一键发号预检"
      width="72%"
      destroy-on-close
    >
      <div v-loading="precheckLoading">
        <template v-if="precheckData">
          <el-alert
            class="mb-3"
            type="info"
            show-icon
            :closable="false"
            :title="`公示总数 ${precheckData.total} · 可一键发号 ${precheckData.promotableCount} · 需跳过(手动建档) ${precheckData.skipCount}`"
          />
          <el-table
            :data="precheckData.rows"
            border
            size="small"
            row-key="applicationId"
            max-height="420"
          >
            <el-table-column label="姓名" min-width="110">
              <template #default="{ row }">{{ row.realName ?? "—" }}</template>
            </el-table-column>
            <el-table-column label="是否可发号" min-width="100">
              <template #default="{ row }">
                <el-tag
                  :type="row.willIssue ? 'success' : 'warning'"
                  size="small"
                >
                  {{ row.willIssue ? "可发号" : "需跳过" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="拟发编号" min-width="110">
              <template #default="{ row }">
                {{ row.proposedMemberNo ?? "—" }}
              </template>
            </el-table-column>
            <el-table-column label="跳过原因" min-width="180">
              <template #default="{ row }">
                {{ skipReasonLabel(row.skipReason) }}
              </template>
            </el-table-column>
            <el-table-column label="风险标记" min-width="200">
              <template #default="{ row }">
                <el-tag
                  v-if="row.duplicateOpenidInBatch"
                  type="danger"
                  size="small"
                  class="mr-1"
                >
                  openid本批重复
                </el-tag>
                <el-tag
                  v-if="row.openidAlreadyBound"
                  type="danger"
                  size="small"
                  class="mr-1"
                >
                  openid已占用
                </el-tag>
                <el-tag
                  v-if="row.missingOpenid"
                  type="warning"
                  size="small"
                  class="mr-1"
                >
                  缺openid
                </el-tag>
                <el-tag
                  v-if="row.missingPhone"
                  type="warning"
                  size="small"
                  class="mr-1"
                >
                  缺手机
                </el-tag>
                <el-tag
                  v-if="row.missingBirthDate"
                  type="warning"
                  size="small"
                  class="mr-1"
                >
                  缺生日
                </el-tag>
                <el-tag
                  v-if="row.missingGender"
                  type="warning"
                  size="small"
                  class="mr-1"
                >
                  缺性别
                </el-tag>
                <el-tag v-if="row.isForeigner" type="info" size="small">
                  外籍
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </template>
        <el-empty v-else-if="!precheckLoading" description="暂无预检数据" />
      </div>
      <template #footer>
        <el-button @click="precheckVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!precheckData || precheckData.promotableCount === 0"
          @click="handlePromoteConfirmed"
        >
          确定发号（{{ precheckData?.promotableCount ?? 0 }} 人）
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量标门槛 dialog（前端解析文本域为 matches 数组,不引入 xlsx 依赖） -->
    <el-dialog
      v-model="batchMarkVisible"
      title="批量标门槛"
      width="56%"
      destroy-on-close
    >
      <el-form label-width="88px">
        <el-form-item label="门槛">
          <el-select v-model="batchMarkThresholdCode" class="w-full">
            <el-option
              v-for="code in THRESHOLD_CODES"
              :key="code"
              :label="toolsThresholdLabel[code]"
              :value="code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作">
          <el-radio-group v-model="batchMarkCompleted">
            <el-radio :value="true">标记完成</el-radio>
            <el-radio :value="false">清除标记</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="匹配数据">
          <el-input
            v-model="batchMarkRawText"
            type="textarea"
            :rows="8"
            placeholder="每行一条：临时编号（如 T2601001），或「手机,姓名」（如 13800001111,张三）。可直接从签到表粘贴。"
          />
        </el-form-item>
      </el-form>
      <template v-if="batchMarkResult">
        <el-alert
          class="mb-2"
          :type="
            batchMarkResult.failed || batchMarkResult.unmatched
              ? 'warning'
              : 'success'
          "
          show-icon
          :closable="false"
          :title="`共 ${batchMarkResult.total} 条 · 已标记 ${batchMarkResult.marked} · 不匹配 ${batchMarkResult.unmatched} · 失败 ${batchMarkResult.failed} · 自动推进 ${batchMarkResult.autoAdvanced}`"
        />
        <el-table
          :data="batchMarkResult.results"
          border
          size="small"
          max-height="240"
        >
          <el-table-column label="#" prop="index" min-width="50" />
          <el-table-column label="结果" min-width="90">
            <template #default="{ row }">
              <el-tag
                :type="
                  row.status === 'marked'
                    ? 'success'
                    : row.status === 'unmatched'
                      ? 'info'
                      : 'danger'
                "
                size="small"
              >
                {{
                  row.status === "marked"
                    ? "已标记"
                    : row.status === "unmatched"
                      ? "不匹配"
                      : "失败"
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="详情" min-width="160">
            <template #default="{ row }">
              {{ row.unmatchedReason ?? row.matchedBy ?? row.errorCode ?? "—" }}
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template #footer>
        <el-button @click="batchMarkVisible = false">关闭</el-button>
        <el-button
          type="primary"
          :loading="batchMarkSubmitting"
          @click="submitBatchMark"
        >
          提交
        </el-button>
      </template>
    </el-dialog>
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.stats-group {
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;

  &__title {
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__row {
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }

  &__pill {
    display: inline-block;
    margin: 2px 6px 2px 0;
  }
}
</style>
