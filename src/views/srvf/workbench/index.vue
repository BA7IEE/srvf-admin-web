<script setup lang="ts">
import { bizErrorMessage } from "@/api/srvf-error";
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { computed, ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { dayjs } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import { hasPerms } from "@/utils/auth";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import {
  useSrvfRecentsStoreHook,
  type SrvfRecentEntity
} from "@/store/modules/srvfRecents";
import { getDashboardSummary, type DashboardSummary } from "@/api/srvf-meta";
import { useApprovalRegistrations, useApprovalAttendance } from "./utils/hook";
import { useWorkbenchDashboard } from "./utils/dashboard-hook";
import AttendanceTrendChart from "./attendance-trend-chart.vue";

defineOptions({
  name: "SrvfWorkbench"
});

// 与 src/views/schedule/index.vue 同一处理：el-calendar 内部用 dayjs 的 locale 周起点，
// 全局设为周一开始（幂等调用，和既有 schedule 页不冲突）。
// https://github.com/element-plus/element-plus/issues/8007#issuecomment-2229946178
dayjs.locale("zh-cn", { weekStart: 1 });

/**
 * 审批工作台 = 跨轴横扫"待我处理"（脱离 :activityId,按 statusCode 横扫报名/考勤）。
 * 作为工作台落地页：顶部 dashboard-summary 做聚合摘要 + KPI 卡 + 出勤趋势 + 活动日历
 * （Phase 3 按设计稿升级新增），下面保留横扫列表。
 */
const activeTab = ref<"registrations" | "attendances">("registrations");
const router = useRouter();

const {
  canReadMembers,
  memberTotal,
  monthActivityTotal,
  trendLoading,
  trendWeeks,
  trendSeries,
  calendarLoading,
  activitiesOnDate,
  loadCalendarMonth
} = useWorkbenchDashboard();

const calendarDate = ref(new Date());
watch(calendarDate, val => loadCalendarMonth(val));

function calendarDayLabel(day: string) {
  return day.split("-").slice(2).join("");
}

/**
 * 快捷发起（工作台 v2,UX 升级蓝图 §4.4）：按创建权限显隐;
 * 带 ?create=1 跳目标列表页,目标页 onMounted 直开新建弹窗。
 */
const quickActions = [
  {
    label: "新建活动",
    path: "/srvf/activities-domain/activities",
    perm: "activity.create.record"
  },
  {
    label: "发通知",
    path: "/srvf/notification-domain/notifications",
    perm: "notification.create.record"
  },
  {
    label: "录队员",
    path: "/srvf/members-domain/members",
    perm: "member.create.record"
  }
].filter(action => hasPerms(action.perm));

function quickCreate(action: (typeof quickActions)[number]) {
  router.push({ path: action.path, query: { create: "1" } });
}

/** 最近访问（与全局搜索 Ctrl/Cmd+K 同一份数据;点击回到上次看的实体） */
const recents = useSrvfRecentsStoreHook();
const recentItems = computed(() => recents.items.slice(0, 8));
const RECENT_TYPE_LABEL: Record<SrvfRecentEntity["type"], string> = {
  member: "队员",
  activity: "活动",
  organization: "组织",
  content: "内容"
};

function openRecent(item: SrvfRecentEntity) {
  if (item.routeName) {
    useMultiTagsStoreHook().handleTags("push", {
      path: item.path,
      name: item.routeName,
      params: item.routeParams,
      meta: { title: `${RECENT_TYPE_LABEL[item.type]} · ${item.title}` }
    });
    router.push({ name: item.routeName, params: item.routeParams });
  } else {
    router.push(item.path);
  }
}

const summary = ref<DashboardSummary | null>(null);
const summaryLoading = ref(false);
const summaryError = ref("");

type SummaryCard = {
  key: string;
  title: string;
  value: number;
  desc: string;
  /**
   * 语义强调色（引用已定义的 SRVF 品牌 tokens，见 src/style/srvf-tokens.scss）。
   * 色即信息：告警红=最紧急（待终审）、待命琥珀=待办（待审报名/一级审核）、
   * 进行绿=活跃（进行中活动）；纯信息量的静态卡用盾蓝。
   */
  accent: string;
};

/** 盾蓝——纯信息量卡片（在册队员 / 本月活动）的品牌强调色 */
const INFO_ACCENT = "var(--srvf-navy)";

const summaryCards = computed<SummaryCard[]>(() => {
  const current = summary.value;
  if (!current) return [];

  const cards: SummaryCard[] = [];

  if (current.registrations) {
    cards.push({
      key: "registrations.pending",
      title: "待审报名",
      value: current.registrations.pending,
      desc: "等待审核的活动报名，点击处理",
      accent: "var(--srvf-status-standby)"
    });
  }

  if (current.attendanceSheets) {
    cards.push({
      key: "attendanceSheets.pending",
      title: "考勤待一级审核",
      value: current.attendanceSheets.pending,
      desc: "等待一级审核的考勤单，点击处理",
      accent: "var(--srvf-status-standby)"
    });
    cards.push({
      key: "attendanceSheets.pendingFinalReview",
      title: "考勤待终审",
      value: current.attendanceSheets.pendingFinalReview,
      desc: "等待终审的考勤单，点击处理",
      accent: "var(--srvf-status-alert)"
    });
  }

  if (current.activities) {
    cards.push({
      key: "activities.published",
      title: "进行中活动",
      value: current.activities.published,
      desc: "已发布、进行中的活动，点击查看",
      accent: "var(--srvf-status-active)"
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
    summaryError.value = bizErrorMessage(
      error,
      "工作台摘要加载失败，下方审批列表不受影响"
    );
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
  keyword: regKeyword,
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
  keyword: attKeyword,
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

/**
 * 摘要卡下钻：点卡片 → 切到对应 tab 并预置 statusCode 重查；
 * "进行中活动"卡跳活动列表（工作台无活动 tab）。
 * key 与 dashboard-summary 的块结构一一对应（后端按权限裁剪出块）。
 */
function onCardClick(key: string) {
  switch (key) {
    case "registrations.pending":
      activeTab.value = "registrations";
      regStatusFilter.value = "pending";
      regOnFilterChange();
      break;
    case "attendanceSheets.pending":
      activeTab.value = "attendances";
      attStatusFilter.value = "pending";
      attOnFilterChange();
      break;
    case "attendanceSheets.pendingFinalReview":
      activeTab.value = "attendances";
      attStatusFilter.value = "pending_final_review";
      attOnFilterChange();
      break;
    case "activities.published":
      router.push("/srvf/activities-domain/activities");
      break;
  }
}

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
              只显示您有权查看的数据，数字卡片可点击直达处理
            </div>
          </div>
          <div class="summary-header-actions">
            <el-button
              v-for="action in quickActions"
              :key="action.path"
              type="primary"
              plain
              size="small"
              @click="quickCreate(action)"
            >
              {{ action.label }}
            </el-button>
            <el-button
              link
              :loading="summaryLoading"
              @click="loadDashboardSummary"
            >
              刷新摘要
            </el-button>
          </div>
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
      <div v-if="summaryCards.length || canReadMembers" class="summary-grid">
        <div
          v-if="canReadMembers"
          class="summary-item"
          :style="{ '--card-accent': INFO_ACCENT }"
        >
          <div class="summary-item-title">在册队员</div>
          <div class="summary-item-value">
            {{ memberTotal ?? "—" }}
          </div>
          <div class="summary-item-desc">当前在队的队员总数</div>
        </div>
        <div class="summary-item" :style="{ '--card-accent': INFO_ACCENT }">
          <div class="summary-item-title">本月活动</div>
          <div class="summary-item-value">
            {{ monthActivityTotal ?? "—" }}
          </div>
          <div class="summary-item-desc">开始时间在本月内的活动数</div>
        </div>
        <div
          v-for="card in summaryCards"
          :key="card.key"
          class="summary-item summary-item-clickable"
          :style="{ '--card-accent': card.accent }"
          title="点击查看对应列表"
          @click="onCardClick(card.key)"
        >
          <div class="summary-item-title">{{ card.title }}</div>
          <div class="summary-item-value">{{ card.value }}</div>
          <div class="summary-item-desc">{{ card.desc }}</div>
        </div>
      </div>
      <el-empty
        v-else-if="!summaryLoading"
        description="当前账号暂无可展示的工作台摘要块"
      />
      <div v-if="recentItems.length" class="recent-row">
        <span class="recent-label">最近访问</span>
        <el-button
          v-for="item in recentItems"
          :key="item.type + item.id"
          link
          size="small"
          class="recent-link"
          @click="openRecent(item)"
        >
          {{ RECENT_TYPE_LABEL[item.type] }} · {{ item.title }}
        </el-button>
      </div>
    </el-card>

    <div class="dashboard-row">
      <el-card shadow="never" class="dashboard-col-main">
        <template #header>
          <div class="summary-title">出勤趋势 · 近 12 周</div>
        </template>
        <AttendanceTrendChart
          :weeks="trendWeeks"
          :series="trendSeries"
          :loading="trendLoading"
        />
      </el-card>

      <el-card shadow="never" class="dashboard-col-side">
        <template #header>
          <div class="summary-title">活动日历</div>
        </template>
        <el-calendar v-model="calendarDate" v-loading="calendarLoading">
          <template #date-cell="{ data }">
            <div class="cal-cell">
              <div class="cal-day">{{ calendarDayLabel(data.day) }}</div>
              <div
                v-if="activitiesOnDate(data.day).length"
                class="cal-dots"
                :title="
                  activitiesOnDate(data.day)
                    .map(a => a.title)
                    .join('、')
                "
              >
                <span
                  v-for="a in activitiesOnDate(data.day).slice(0, 3)"
                  :key="a.id"
                  class="cal-dot"
                />
              </div>
            </div>
          </template>
        </el-calendar>
      </el-card>
    </div>

    <el-tabs v-model="activeTab" class="workbench-tabs">
      <!-- 报名审批：跨所有活动横扫 -->
      <el-tab-pane label="报名审批" name="registrations">
        <template v-if="regCanRead">
          <PureTableBar
            title="待我审批的报名"
            :columns="regColumns"
            @refresh="regOnSearch"
          >
            <template #buttons>
              <el-input
                v-model="regKeyword"
                class="w-48! mr-2!"
                placeholder="关键词搜索（回车）"
                clearable
                @keyup.enter="regOnFilterChange"
                @clear="regOnFilterChange"
              />
              <el-select
                v-model="regStatusFilter"
                class="w-40!"
                placeholder="按状态筛选"
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
                    :size="size"
                    @click="regGoCockpit(row)"
                  >
                    活动详情
                  </el-button>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </template>
        <SrvfPermEmpty
          v-else
          action="查看报名"
          code="activity-registration.read.record"
        />
      </el-tab-pane>

      <!-- 考勤审批：跨所有活动横扫 -->
      <el-tab-pane label="考勤审批" name="attendances">
        <template v-if="attCanRead">
          <PureTableBar
            title="待我审批的考勤"
            :columns="attColumns"
            @refresh="attOnSearch"
          >
            <template #buttons>
              <el-input
                v-model="attKeyword"
                class="w-48! mr-2!"
                placeholder="关键词搜索（回车）"
                clearable
                @keyup.enter="attOnFilterChange"
                @clear="attOnFilterChange"
              />
              <el-select
                v-model="attStatusFilter"
                class="w-40!"
                placeholder="按状态筛选"
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
                    :size="size"
                    @click="attGoCockpit(row)"
                  >
                    活动详情
                  </el-button>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </template>
        <SrvfPermEmpty v-else action="查看考勤" code="attendance.read.sheet" />
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

.summary-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.recent-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  align-items: center;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.recent-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.recent-link {
  max-width: 220px;
  overflow: hidden;
}

.summary-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  /* 品牌左强调条（救援红），把区块标题从通用后台拉回 SRVF 视觉 */
  &::before {
    display: inline-block;
    width: 3px;
    height: 15px;
    margin-right: 8px;
    vertical-align: -2px;
    content: "";
    background: var(--srvf-red, var(--el-color-primary));
    border-radius: 2px;
  }
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
  /* --card-accent 由模板按语义注入（告警红/待命琥珀/进行绿/信息盾蓝）；
     缺省兜底盾蓝，保证无 token 环境也不塌成透明。 */
  --card-accent: var(--srvf-navy, var(--el-color-primary));

  position: relative;
  padding: 16px 16px 16px 20px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-left: 3px solid var(--card-accent);
  border-radius: 8px;
}

.summary-item-clickable {
  cursor: pointer;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}

.summary-item-clickable:hover {
  box-shadow: var(--el-box-shadow-light);
  transform: translateY(-1px);
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

  /* 数字取语义强调色——色即信息（红=紧急/琥珀=待办/绿=活跃/盾蓝=信息） */
  color: var(--card-accent);
}

.summary-item-desc {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.dashboard-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

@media (width <= 992px) {
  .dashboard-row {
    grid-template-columns: 1fr;
  }
}

.dashboard-col-main,
.dashboard-col-side {
  min-width: 0;
}

.cal-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  padding: 2px 0;
}

.cal-day {
  font-size: 12px;
}

.cal-dots {
  display: flex;
  gap: 2px;
  margin-top: 2px;
}

.cal-dot {
  width: 4px;
  height: 4px;
  background: var(--srvf-red, var(--el-color-primary));
  border-radius: 50%;
}

:deep(.el-calendar__header) {
  padding: 8px 0;
}

:deep(.el-calendar-table .el-calendar-day) {
  height: 48px;
  padding: 2px;
}
</style>
