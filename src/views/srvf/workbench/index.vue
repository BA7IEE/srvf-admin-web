<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { getDashboardSummary, type DashboardSummary } from "@/api/srvf-meta";
import { useApprovalRegistrations, useApprovalAttendance } from "./utils/hook";

defineOptions({
  name: "SrvfWorkbench"
});

/**
 * 审批工作台 = 跨轴横扫"待我处理"（脱离 :activityId,按 statusCode 横扫报名/考勤）。
 * 作为工作台落地页：顶部 dashboard-summary 做聚合摘要，下面保留横扫列表。
 */
const activeTab = ref<"registrations" | "attendances">("registrations");

const summary = ref<DashboardSummary | null>(null);
const summaryLoading = ref(false);
const summaryError = ref("");

type SummaryCard = {
  key: string;
  title: string;
  value: number;
  desc: string;
};

const summaryCards = computed<SummaryCard[]>(() => {
  const current = summary.value;
  if (!current) return [];

  const cards: SummaryCard[] = [];

  if (current.registrations) {
    cards.push({
      key: "registrations.pending",
      title: "待审报名",
      value: current.registrations.pending,
      desc: "registration_status = pending"
    });
  }

  if (current.attendanceSheets) {
    cards.push({
      key: "attendanceSheets.pending",
      title: "考勤待一级审核",
      value: current.attendanceSheets.pending,
      desc: "attendance_sheet_status = pending"
    });
    cards.push({
      key: "attendanceSheets.pendingFinalReview",
      title: "考勤待终审",
      value: current.attendanceSheets.pendingFinalReview,
      desc: "attendance_sheet_status = pending_final_review"
    });
  }

  if (current.activities) {
    cards.push({
      key: "activities.published",
      title: "进行中活动",
      value: current.activities.published,
      desc: "activity_status = published"
    });
  }

  return cards;
});

async function loadDashboardSummary() {
  summaryLoading.value = true;
  summaryError.value = "";
  try {
    const { code, data } = await getDashboardSummary();
    if (code === 0) {
      summary.value = data;
      return;
    }
    summary.value = null;
    summaryError.value = "工作台摘要暂不可用，下方审批列表不受影响";
  } catch (error: any) {
    summary.value = null;
    summaryError.value =
      error?.response?.data?.message ??
      "工作台摘要加载失败，下方审批列表不受影响";
  } finally {
    summaryLoading.value = false;
  }
}

const {
  canRead: regCanRead,
  canApprove: regCanApprove,
  canReject: regCanReject,
  canCancel: regCanCancel,
  loading: regLoading,
  statusFilter: regStatusFilter,
  statusOptions: regStatusOptions,
  columns: regColumns,
  dataList: regDataList,
  pagination: regPagination,
  statusMeta: regStatusMeta,
  onSearch: regOnSearch,
  onFilterChange: regOnFilterChange,
  handleApprove: regHandleApprove,
  handleReject: regHandleReject,
  handleCancel: regHandleCancel,
  goCockpit: regGoCockpit,
  handleSizeChange: regHandleSizeChange,
  handleCurrentChange: regHandleCurrentChange
} = useApprovalRegistrations();

const {
  canRead: attCanRead,
  canApprove: attCanApprove,
  canReject: attCanReject,
  canFinalApprove: attCanFinalApprove,
  canFinalReject: attCanFinalReject,
  loading: attLoading,
  statusFilter: attStatusFilter,
  statusOptions: attStatusOptions,
  columns: attColumns,
  dataList: attDataList,
  pagination: attPagination,
  statusMeta: attStatusMeta,
  onSearch: attOnSearch,
  onFilterChange: attOnFilterChange,
  handleApprove: attHandleApprove,
  handleReject: attHandleReject,
  handleFinalApprove: attHandleFinalApprove,
  handleFinalReject: attHandleFinalReject,
  goCockpit: attGoCockpit,
  handleSizeChange: attHandleSizeChange,
  handleCurrentChange: attHandleCurrentChange
} = useApprovalAttendance();

onMounted(() => {
  loadDashboardSummary();
  // onSearch 自带 canRead 守卫；有读码即按默认 statusFilter=pending 横扫
  regOnSearch();
  attOnSearch();
});
</script>

<template>
  <div class="main">
    <el-card shadow="never" class="summary-card">
      <template #header>
        <div class="summary-header">
          <div>
            <div class="summary-title">工作台摘要</div>
            <div class="summary-subtitle">
              摘要块由后端按权限裁剪，缺权限的块不会显示为 0
            </div>
          </div>
          <el-button
            link
            type="primary"
            :loading="summaryLoading"
            @click="loadDashboardSummary"
          >
            刷新摘要
          </el-button>
        </div>
      </template>

      <el-skeleton v-if="summaryLoading && !summary" animated :rows="2" />
      <el-alert
        v-else-if="summaryError"
        :title="summaryError"
        type="warning"
        show-icon
        :closable="false"
      />
      <div v-else-if="summaryCards.length" class="summary-grid">
        <div v-for="card in summaryCards" :key="card.key" class="summary-item">
          <div class="summary-item-title">{{ card.title }}</div>
          <div class="summary-item-value">{{ card.value }}</div>
          <div class="summary-item-desc">{{ card.desc }}</div>
        </div>
      </div>
      <el-empty v-else description="当前账号暂无可展示的工作台摘要块" />
    </el-card>

    <el-tabs v-model="activeTab" class="workbench-tabs">
      <!-- 报名审批：跨所有活动横扫 -->
      <el-tab-pane label="报名审批" name="registrations">
        <template v-if="regCanRead">
          <PureTableBar
            title="报名横扫（待我处理）"
            :columns="regColumns"
            @refresh="regOnSearch"
          >
            <template #buttons>
              <el-select
                v-model="regStatusFilter"
                class="w-40!"
                placeholder="按状态横扫"
                @change="regOnFilterChange"
              >
                <el-option
                  v-for="opt in regStatusOptions"
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
                :loading="regLoading"
                :size="size"
                :data="regDataList"
                :columns="dynamicColumns"
                :pagination="regPagination"
                :paginationSmall="size === 'small' ? true : false"
                :header-cell-style="{
                  background: 'var(--el-fill-color-light)',
                  color: 'var(--el-text-color-primary)'
                }"
                @page-size-change="regHandleSizeChange"
                @page-current-change="regHandleCurrentChange"
              >
                <template #statusCode="{ row }">
                  <el-tag :type="regStatusMeta(row.statusCode).type">
                    {{ regStatusMeta(row.statusCode).text }}
                  </el-tag>
                </template>
                <template #operation="{ row }">
                  <el-button
                    v-if="regCanApprove && row.statusCode === 'pending'"
                    class="reset-margin"
                    link
                    type="success"
                    :size="size"
                    @click="regHandleApprove(row)"
                  >
                    审核通过
                  </el-button>
                  <el-button
                    v-if="regCanReject && row.statusCode === 'pending'"
                    class="reset-margin"
                    link
                    type="danger"
                    :size="size"
                    @click="regHandleReject(row)"
                  >
                    审核拒绝
                  </el-button>
                  <el-button
                    v-if="
                      regCanCancel &&
                      (row.statusCode === 'pending' ||
                        row.statusCode === 'pass')
                    "
                    class="reset-margin"
                    link
                    type="warning"
                    :size="size"
                    @click="regHandleCancel(row)"
                  >
                    代取消
                  </el-button>
                  <el-button
                    class="reset-margin"
                    link
                    type="primary"
                    :size="size"
                    @click="regGoCockpit(row)"
                  >
                    前往作战室
                  </el-button>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </template>
        <el-empty
          v-else
          description="您没有查看报名的权限（activity-registration.read.record）"
        />
      </el-tab-pane>

      <!-- 考勤审批：跨所有活动横扫 -->
      <el-tab-pane label="考勤审批" name="attendances">
        <template v-if="attCanRead">
          <PureTableBar
            title="考勤横扫（待我处理）"
            :columns="attColumns"
            @refresh="attOnSearch"
          >
            <template #buttons>
              <el-select
                v-model="attStatusFilter"
                class="w-40!"
                placeholder="按状态横扫"
                @change="attOnFilterChange"
              >
                <el-option
                  v-for="opt in attStatusOptions"
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
                :loading="attLoading"
                :size="size"
                :data="attDataList"
                :columns="dynamicColumns"
                :pagination="attPagination"
                :paginationSmall="size === 'small' ? true : false"
                :header-cell-style="{
                  background: 'var(--el-fill-color-light)',
                  color: 'var(--el-text-color-primary)'
                }"
                @page-size-change="attHandleSizeChange"
                @page-current-change="attHandleCurrentChange"
              >
                <template #statusCode="{ row }">
                  <el-tag :type="attStatusMeta(row.statusCode).type">
                    {{ attStatusMeta(row.statusCode).text }}
                  </el-tag>
                </template>
                <template #operation="{ row }">
                  <el-button
                    v-if="attCanApprove && row.statusCode === 'pending'"
                    class="reset-margin"
                    link
                    type="success"
                    :size="size"
                    @click="attHandleApprove(row)"
                  >
                    一级通过
                  </el-button>
                  <el-button
                    v-if="attCanReject && row.statusCode === 'pending'"
                    class="reset-margin"
                    link
                    type="danger"
                    :size="size"
                    @click="attHandleReject(row)"
                  >
                    一级驳回
                  </el-button>
                  <el-button
                    v-if="
                      attCanFinalApprove &&
                      row.statusCode === 'pending_final_review'
                    "
                    class="reset-margin"
                    link
                    type="success"
                    :size="size"
                    @click="attHandleFinalApprove(row)"
                  >
                    终审通过
                  </el-button>
                  <el-button
                    v-if="
                      attCanFinalReject &&
                      row.statusCode === 'pending_final_review'
                    "
                    class="reset-margin"
                    link
                    type="danger"
                    :size="size"
                    @click="attHandleFinalReject(row)"
                  >
                    终审驳回
                  </el-button>
                  <el-button
                    class="reset-margin"
                    link
                    type="primary"
                    :size="size"
                    @click="attGoCockpit(row)"
                  >
                    前往作战室
                  </el-button>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </template>
        <el-empty
          v-else
          description="您没有查看考勤的权限（attendance.read.sheet）"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}

.summary-card {
  margin-bottom: 16px;
}

.summary-header {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.summary-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.summary-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.summary-item {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.summary-item-title {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.summary-item-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.summary-item-desc {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
