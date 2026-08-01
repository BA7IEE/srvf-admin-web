<script setup lang="ts">
import { bizErrorMessage } from "@/api/srvf-error";
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import { SrvfDetailShell, SrvfFlowSteps, SrvfPermEmpty } from "@/srvf-kit";
import {
  getActivity,
  cancelActivity,
  type ActivityDetail
} from "@/api/srvf-activity";
import { openPublishDialog, openCompleteDialog } from "./utils/lifecycle";
import { useRegistrations } from "../registrations/utils/hook";
import { useAttendances } from "../attendances/utils/hook";
import { useActivityPositions } from "./positions/utils/hook";
import { useActivityFeedbacks } from "./feedbacks/utils/hook";
import { useActivityReconciliation } from "./reconciliation/utils/hook";
import ReviewDetail from "../attendances/review-detail.vue";

import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import InfoFilled from "~icons/ep/info-filled";

defineOptions({
  name: "SrvfActivityCockpit"
});

/** 实体 id 来自路由参数（该路由不入 keepAlive → 每次进来重新挂载，setup 取一次即可靠） */
const route = useRoute();
const router = useRouter();
const activityId = route.params.id as string;

/**
 * 活动生命周期条（UX 升级蓝图 §4.5-A）：把契约状态机 draft → published → completed
 * （cancelled 为分支态）画在页头。步骤标题查 activity_status 字典（不臆造状态名）,
 * 仅做展示——流转仍走「发布/取消」按钮与后端裁决。
 */
const lifecycle = computed(() => {
  const code = detail.value?.statusCode;
  const cancelled = code === "cancelled";
  const steps = [
    {
      title: dict.label("activity_status", "draft"),
      description: "完善信息后发布"
    },
    {
      title: dict.label("activity_status", "published"),
      description: "审核报名、组织活动"
    },
    cancelled
      ? {
          title: dict.label("activity_status", "cancelled"),
          description: "活动已取消"
        }
      : {
          title: dict.label("activity_status", "completed"),
          description: "提交考勤单并完成两级审核"
        }
  ];
  if (code === "completed")
    return { steps, active: 3, status: "success" as const };
  if (cancelled) return { steps, active: 2, status: "error" as const };
  return {
    steps,
    active: code === "published" ? 1 : 0,
    status: "process" as const
  };
});

/** 共享字典：活动类型 / 活动状态 code → 中文 */
const dict = useSrvfDictStoreHook();
dict.ensureTypes(["activity_type", "activity_status"]);

/** 状态 code → tag 颜色（与活动列表同口径展示色；文案仍查 activity_status 字典，不臆造） */
const STATUS_TAG_TYPE: Record<
  string,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  draft: "info",
  published: "success",
  cancelled: "danger",
  completed: "primary"
};

/* ----------------------------- 头部：活动详情 + 发布/取消 ----------------------------- */
const detail = ref<ActivityDetail | null>(null);
const detailLoading = ref(false);

// 发布/取消/完结按真实 RBAC 码做按钮级显隐（与活动列表 hook 同码门；SUPER_ADMIN 全码故全可见）
const canPublish = hasPerms("activity.publish.record");
const canCancel = hasPerms("activity.cancel.record");
const canComplete = hasPerms("activity.complete.record");

/**
 * 「完结活动」的显示条件 = 后端 complete 的两个前置条件（少判一条就是死按钮）：
 * published + 活动时间已结束。`phase` 直读后端派生值，前端不自算 endAt < now。
 * 活动一结束按钮就出现，正是最容易忘记完结、导致活动永远停在「已发布」的时刻。
 */
const showComplete = computed(
  () =>
    canComplete &&
    detail.value?.statusCode === "published" &&
    detail.value?.phase === "ended"
);

function statusText(code?: string) {
  return dict.label("activity_status", code);
}
function statusType(code?: string) {
  return (code && STATUS_TAG_TYPE[code]) || "info";
}

/** 拉活动详情（GET /activities/{id}，[auth]-only；404 / 无权 → 头部退化为空态提示） */
async function fetchDetail() {
  detailLoading.value = true;
  try {
    const { code, data } = await getActivity(activityId);
    if (code === 0) detail.value = data;
  } catch (error: any) {
    message(bizErrorMessage(error, "加载活动详情失败"), {
      type: "error"
    });
  } finally {
    detailLoading.value = false;
  }
}

/** 发布（draft → published；与活动列表共用 openPublishDialog：保险核对勾选 + 必填 body；成功后重拉详情） */
function handlePublish() {
  if (!detail.value) return;
  openPublishDialog(
    {
      id: activityId,
      title: detail.value.title,
      requiresInsurance: detail.value.requiresInsurance
    },
    fetchDetail
  );
}

/** 完结（published → completed；唯一完结通路，与活动列表共用 openCompleteDialog；成功后重拉详情） */
function handleComplete() {
  if (!detail.value) return;
  openCompleteDialog(
    { id: activityId, title: detail.value.title },
    fetchDetail
  );
}

/** 取消（* → cancelled；照活动列表 hook 写法：prompt 原因可空 + 复用 cancelActivity；成功后重拉详情） */
function handleCancel() {
  if (!detail.value) return;
  ElMessageBox.prompt(
    `确定要取消活动「${detail.value.title}」吗？可填写取消原因（可空）。`,
    "取消活动",
    {
      confirmButtonText: "确定取消",
      cancelButtonText: "返回",
      type: "warning",
      inputType: "textarea",
      inputPlaceholder: "取消原因（可空；≤ 500）",
      inputValidator: (val: string) => {
        if (val && val.length > 500) return "取消原因不能超过 500 字";
        return true;
      }
    }
  )
    .then(async ({ value }) => {
      try {
        await cancelActivity(activityId, value ? { cancelReason: value } : {});
        message("取消成功", { type: "success" });
        fetchDetail();
      } catch (error: any) {
        message(bizErrorMessage(error, "取消失败"), {
          type: "error"
        });
      }
    })
    .catch(() => {});
}

/* --------------- Tab：报名 / 考勤（复用既有 hook，activityId 由路由参数注入；无活动下拉） --------------- */
const activeTab = ref<
  "registrations" | "attendances" | "positions" | "feedbacks" | "reconciliation"
>("registrations");

const {
  canRead: regCanRead,
  canApprove: regCanApprove,
  canReject: regCanReject,
  canCancel: regCanCancel,
  canCreate: regCanCreate,
  loading: regLoading,
  columns: regColumns,
  dataList: regDataList,
  pagination: regPagination,
  statusMeta: regStatusMeta,
  onSearch: regOnSearch,
  openCreateDialog: regOpenCreateDialog,
  handleApprove: regHandleApprove,
  handleReject: regHandleReject,
  handleCancel: regHandleCancel,
  handleExport: regHandleExport,
  handleSizeChange: regHandleSizeChange,
  handleCurrentChange: regHandleCurrentChange
} = useRegistrations(activityId);

const {
  canRead: attCanRead,
  canCreate: attCanCreate,
  canUpdate: attCanUpdate,
  canApprove: attCanApprove,
  canReject: attCanReject,
  canFinalApprove: attCanFinalApprove,
  canFinalReject: attCanFinalReject,
  canDelete: attCanDelete,
  loading: attLoading,
  columns: attColumns,
  dataList: attDataList,
  pagination: attPagination,
  statusMeta: attStatusMeta,
  onSearch: attOnSearch,
  openCreateDialog: attOpenCreateDialog,
  openEditDialog: attOpenEditDialog,
  handleApprove: attHandleApprove,
  handleReject: attHandleReject,
  handleFinalApprove: attHandleFinalApprove,
  handleFinalReject: attHandleFinalReject,
  handleDelete: attHandleDelete,
  openReviewDetail: attOpenReviewDetail,
  reviewDetailVisible: attReviewDetailVisible,
  reviewDetailLoading: attReviewDetailLoading,
  reviewDetailData: attReviewDetailData,
  handleSizeChange: attHandleSizeChange,
  handleCurrentChange: attHandleCurrentChange
} = useAttendances(activityId);

/* --------------- Tab：岗位（活动的子资源，复用范式 A hook，无独立菜单） --------------- */
const {
  canWrite: posCanWrite,
  loading: posLoading,
  columns: posColumns,
  dataList: posDataList,
  setActivityWindow: posSetActivityWindow,
  onSearch: posOnSearch,
  openDialog: posOpenDialog,
  handleDelete: posHandleDelete
} = useActivityPositions(activityId);

/* --------------- Tab：评价（只读；汇总卡 + 五星分布 + 实名列表） --------------- */
const {
  canRead: fbCanRead,
  loading: fbLoading,
  summary: fbSummary,
  ratingBars: fbRatingBars,
  feedbackRatePercent: fbRatePercent,
  columns: fbColumns,
  dataList: fbDataList,
  pagination: fbPagination,
  refresh: fbRefresh,
  handleSizeChange: fbHandleSizeChange,
  handleCurrentChange: fbHandleCurrentChange
} = useActivityFeedbacks(activityId);

/** 平均星级展示：无评价（avgRating 为 null）时出「—」，不要显示成 0 分 */
function avgRatingFormatter(value: number | string) {
  return fbSummary.value?.avgRating == null ? "—" : String(value);
}

/* --------------- Tab：参与核对（核对部分仅 completed 可调） --------------- */
const {
  canRead: recCanRead,
  isCompleted: recIsCompleted,
  setActivityStatus: recSetActivityStatus,
  loading: recLoading,
  summary: recSummary,
  participants: recParticipants,
  attendanceRatePercent: recAttendanceRate,
  outcomeMeta: recOutcomeMeta,
  columns: recColumns,
  onSearch: recOnSearch
} = useActivityReconciliation(activityId);

onMounted(async () => {
  await fetchDetail();
  // 岗位时段的即时校验要拿活动时间窗做参照，故等详情到手后再喂给岗位 hook
  posSetActivityWindow(detail.value?.startAt, detail.value?.endAt);
  // onSearch 自带 canRead + activityId 守卫；activityId 已由路由注入，有读码即加载该活动的报名/考勤
  regOnSearch();
  attOnSearch();
  posOnSearch();
  fbRefresh();
  // 核对 hook 要先知道活动状态,才能决定发不发 reconciliation 那个 completed-only 端点
  recSetActivityStatus(detail.value?.statusCode);
  recOnSearch();
});
</script>

<template>
  <div class="main">
    <!-- 头部：活动信息 + 发布/取消 -->
    <SrvfDetailShell
      :loading="detailLoading"
      :found="!!detail"
      not-found-text="未找到该活动或无权查看"
      back-text="返回活动列表"
      @back="router.push('/srvf/activities-domain/activities')"
    >
      <template #title>
        <span class="cockpit-header__name">{{ detail.title }}</span>
        <el-tag :type="statusType(detail.statusCode)">
          {{ statusText(detail.statusCode) }}
        </el-tag>
      </template>
      <template #actions>
        <el-button
          v-if="canPublish && detail.statusCode === 'draft'"
          type="success"
          @click="handlePublish"
        >
          发布
        </el-button>
        <el-button v-if="showComplete" type="primary" @click="handleComplete">
          完结活动
        </el-button>
        <el-button
          v-if="canCancel && detail.statusCode !== 'cancelled'"
          type="warning"
          @click="handleCancel"
        >
          取消活动
        </el-button>
      </template>
      <template #overview>
        <SrvfFlowSteps
          class="mt-2"
          :steps="lifecycle.steps"
          :active="lifecycle.active"
          :process-status="lifecycle.status"
        />
        <el-descriptions :column="3" border class="mt-3">
          <el-descriptions-item label="活动类型">
            {{ dict.label("activity_type", detail.activityTypeCode) }}
          </el-descriptions-item>
          <el-descriptions-item label="地点">
            {{ detail.location || "—" }}
          </el-descriptions-item>
          <el-descriptions-item label="名额上限">
            {{ detail.capacity ?? "不限" }}
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{
              detail.startAt
                ? dayjs(detail.startAt).format("YYYY-MM-DD HH:mm")
                : "—"
            }}
          </el-descriptions-item>
          <el-descriptions-item label="结束时间">
            {{
              detail.endAt
                ? dayjs(detail.endAt).format("YYYY-MM-DD HH:mm")
                : "—"
            }}
          </el-descriptions-item>
          <el-descriptions-item label="公开报名">
            {{ detail.isPublicRegistration ? "公开" : "非公开" }}
          </el-descriptions-item>
          <el-descriptions-item label="报名截止">
            {{
              detail.registrationDeadline
                ? dayjs(detail.registrationDeadline).format("YYYY-MM-DD HH:mm")
                : "—"
            }}
          </el-descriptions-item>
          <el-descriptions-item label="需保险">
            {{ detail.requiresInsurance ? "需要" : "不需要" }}
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <!-- Tab：报名 / 考勤 / 岗位（各自复用对应 list hook，无需再选活动） -->
      <el-tabs v-model="activeTab" class="cockpit-tabs">
        <el-tab-pane label="岗位" name="positions">
          <PureTableBar
            title="活动岗位"
            :columns="posColumns"
            @refresh="posOnSearch"
          >
            <template #buttons>
              <el-button
                v-if="posCanWrite"
                type="primary"
                :icon="useRenderIcon(AddFill)"
                @click="posOpenDialog('新建')"
              >
                新建岗位
              </el-button>
            </template>
            <template v-slot="{ size, dynamicColumns }">
              <pure-table
                row-key="activityPositionId"
                adaptive
                :adaptiveConfig="{ offsetBottom: 108 }"
                align-whole="center"
                table-layout="auto"
                :loading="posLoading"
                :size="size"
                :data="posDataList"
                :columns="dynamicColumns"
                :header-cell-style="{
                  background: 'var(--el-fill-color-light)',
                  color: 'var(--el-text-color-primary)'
                }"
              >
                <template #empty>
                  <el-empty
                    description="还没有岗位：不配岗位时，队员直接报名这个活动；配了岗位后，报名必须选岗位"
                  />
                </template>
                <template #operation="{ row, size: btnSize }">
                  <el-button
                    v-if="posCanWrite"
                    class="reset-margin"
                    link
                    :size="btnSize"
                    :icon="useRenderIcon(EditPen)"
                    @click="posOpenDialog('编辑', row)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    v-if="posCanWrite"
                    class="reset-margin"
                    link
                    type="danger"
                    :size="btnSize"
                    @click="posHandleDelete(row)"
                  >
                    删除
                  </el-button>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </el-tab-pane>

        <el-tab-pane label="报名" name="registrations">
          <template v-if="regCanRead">
            <PureTableBar
              title="报名记录"
              :columns="regColumns"
              @refresh="regOnSearch"
            >
              <template #buttons>
                <el-button
                  v-if="regCanCreate"
                  type="primary"
                  :icon="useRenderIcon(AddFill)"
                  @click="regOpenCreateDialog"
                >
                  代报名
                </el-button>
                <el-button v-if="regCanRead" @click="regHandleExport('pass')">
                  导出通过名单
                </el-button>
                <el-button v-if="regCanRead" @click="regHandleExport('all')">
                  导出全部
                </el-button>
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
                  </template>
                </pure-table>
              </template>
            </PureTableBar>
          </template>
          <SrvfPermEmpty
            v-else
            action="查看报名记录"
            code="activity-registration.read.record"
          />
        </el-tab-pane>

        <el-tab-pane label="考勤" name="attendances">
          <template v-if="attCanRead">
            <PureTableBar
              title="考勤管理"
              :columns="attColumns"
              @refresh="attOnSearch"
            >
              <template v-if="attCanCreate" #buttons>
                <el-button type="primary" @click="attOpenCreateDialog">
                  提交考勤单据
                </el-button>
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
                      class="reset-margin"
                      link
                      :size="size"
                      @click="attOpenReviewDetail(row)"
                    >
                      查看明细
                    </el-button>
                    <el-button
                      v-if="attCanUpdate && row.statusCode === 'pending'"
                      class="reset-margin"
                      link
                      :size="size"
                      @click="attOpenEditDialog(row)"
                    >
                      编辑
                    </el-button>
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
                      v-if="attCanDelete && row.statusCode === 'pending'"
                      class="reset-margin"
                      link
                      type="danger"
                      :size="size"
                      @click="attHandleDelete(row)"
                    >
                      删除
                    </el-button>
                  </template>
                </pure-table>
              </template>
            </PureTableBar>
          </template>
          <SrvfPermEmpty
            v-else
            action="查看考勤"
            code="attendance.read.sheet"
          />
        </el-tab-pane>

        <el-tab-pane label="评价" name="feedbacks">
          <template v-if="fbCanRead">
            <el-card v-loading="fbLoading" shadow="never" class="mb-4">
              <template #header>
                <span>评价汇总</span>
              </template>
              <div class="fb-summary">
                <el-statistic title="评价人数" :value="fbSummary?.count ?? 0" />
                <!--
                  无评价时 avgRating 是 null,必须显示占位而不是 0 分——
                  「0 分」和「还没人评」是两个完全不同的意思。
                  值本身走 value 属性(类型只收数字),占位靠 formatter 出——
                  默认插槽覆盖不了它,会退回属性默认值 0。
                -->
                <el-statistic
                  title="平均星级"
                  :value="fbSummary?.avgRating ?? 0"
                  :formatter="avgRatingFormatter"
                />
                <el-statistic
                  title="评价率"
                  :value="fbRatePercent"
                  suffix="%"
                />
              </div>
              <div class="fb-bars">
                <div v-for="b in fbRatingBars" :key="b.rating" class="fb-bar">
                  <span class="fb-bar__label">{{ b.rating }} 星</span>
                  <el-progress
                    :percentage="b.percent"
                    :stroke-width="10"
                    :show-text="false"
                    class="fb-bar__track"
                  />
                  <span class="fb-bar__count">{{ b.count }}</span>
                </div>
              </div>
              <div class="fb-hint">
                评价率的分母是「已终审考勤的队员 ∪
                已评价的队员」去重数，不是报名人数。
              </div>
            </el-card>

            <PureTableBar
              title="评价明细"
              :columns="fbColumns"
              @refresh="fbRefresh"
            >
              <template v-slot="{ size, dynamicColumns }">
                <pure-table
                  adaptive
                  :adaptiveConfig="{ offsetBottom: 108 }"
                  align-whole="center"
                  table-layout="auto"
                  :loading="fbLoading"
                  :size="size"
                  :data="fbDataList"
                  :columns="dynamicColumns"
                  :pagination="fbPagination"
                  :header-cell-style="{
                    background: 'var(--el-fill-color-light)',
                    color: 'var(--el-text-color-primary)'
                  }"
                  @page-size-change="fbHandleSizeChange"
                  @page-current-change="fbHandleCurrentChange"
                >
                  <template #empty>
                    <el-empty
                      description="还没有评价：活动完结并且考勤生效后，队员才能在小程序里评价"
                    />
                  </template>
                  <template #rating="{ row }">
                    <el-rate :model-value="row.rating" disabled />
                  </template>
                </pure-table>
              </template>
            </PureTableBar>
          </template>
          <SrvfPermEmpty
            v-else
            action="查看活动评价"
            code="attendance.read.sheet"
          />
        </el-tab-pane>

        <el-tab-pane label="参与核对" name="reconciliation">
          <template v-if="recCanRead">
            <el-card v-loading="recLoading" shadow="never" class="mb-4">
              <template #header>
                <span>参与合计</span>
                <el-tooltip placement="top">
                  <template #content>
                    <div class="rec-tip">
                      未到场 =
                      报名已通过、但这个活动下一条考勤记录都没有（不论单据是否已审）。<br />
                      已取消的报名不计入未到场。<br />
                      临时参加 = 没有报名记录、却有考勤记录的人。<br />
                      生效时长与贡献值只统计已终审的单据。
                    </div>
                  </template>
                  <el-icon class="rec-tip__icon"><InfoFilled /></el-icon>
                </el-tooltip>
              </template>
              <div class="fb-summary">
                <el-statistic
                  title="报名总数"
                  :value="recSummary?.registrationCounts.total ?? 0"
                />
                <el-statistic
                  title="已通过"
                  :value="recSummary?.registrationCounts.pass ?? 0"
                />
                <el-statistic
                  title="候补中"
                  :value="recSummary?.registrationCounts.waitlisted ?? 0"
                />
                <el-statistic
                  title="实际到场"
                  :value="recSummary?.attendeeCount ?? 0"
                />
                <el-statistic
                  title="未到场"
                  :value="recSummary?.noShowCount ?? 0"
                />
                <el-statistic
                  title="到场率"
                  :value="recAttendanceRate"
                  suffix="%"
                />
              </div>
              <div v-if="recSummary" class="fb-bars">
                <div class="fb-bar">
                  <span class="fb-bar__label">生效时长</span>
                  <span class="fb-bar__count">
                    {{ recSummary.totalServiceHours }} 小时 · 贡献值
                    {{ recSummary.totalContributionPoints }}
                  </span>
                </div>
                <div class="fb-bar">
                  <span class="fb-bar__label">时长分布</span>
                  <span class="fb-bar__count">
                    2 小时内 {{ recSummary.durationHistogram.under2Hours }} ·
                    2~4 小时 {{ recSummary.durationHistogram.from2To4Hours }} ·
                    4~8 小时 {{ recSummary.durationHistogram.from4To8Hours }} ·
                    8 小时以上 {{ recSummary.durationHistogram.atLeast8Hours }}
                  </span>
                </div>
              </div>
            </el-card>

            <!-- 核对名单只有完结活动才有:后端该端点仅 completed 可调 -->
            <PureTableBar
              v-if="recIsCompleted"
              title="报名与实到核对"
              :columns="recColumns"
              @refresh="recOnSearch"
            >
              <template v-slot="{ size, dynamicColumns }">
                <pure-table
                  row-key="memberId"
                  adaptive
                  :adaptiveConfig="{ offsetBottom: 108 }"
                  align-whole="center"
                  table-layout="auto"
                  :loading="recLoading"
                  :size="size"
                  :data="recParticipants"
                  :columns="dynamicColumns"
                  :header-cell-style="{
                    background: 'var(--el-fill-color-light)',
                    color: 'var(--el-text-color-primary)'
                  }"
                >
                  <template #empty>
                    <el-empty description="没有需要核对的人员" />
                  </template>
                  <template #outcome="{ row }">
                    <el-tag :type="recOutcomeMeta(row.outcome).type">
                      {{ recOutcomeMeta(row.outcome).text }}
                    </el-tag>
                  </template>
                </pure-table>
              </template>
            </PureTableBar>
            <el-empty
              v-else
              description="活动完结后，这里会列出每个人到场没到场"
            />
          </template>
          <SrvfPermEmpty
            v-else
            action="查看参与核对"
            code="attendance.read.sheet 与 activity-registration.read.record"
          />
        </el-tab-pane>
      </el-tabs>
    </SrvfDetailShell>

    <!-- 考勤审核明细 drawer（只读：活动摘要 + 单据 + records 含队员嵌套） -->
    <el-drawer
      v-model="attReviewDetailVisible"
      title="考勤审核明细"
      size="60%"
      destroy-on-close
    >
      <div v-loading="attReviewDetailLoading">
        <ReviewDetail :detail="attReviewDetailData" />
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

.fb-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  align-items: flex-start;
}

.fb-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 16px;
}

.fb-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 12px;
}

.fb-bar__label {
  flex: 0 0 64px;
  color: var(--el-text-color-secondary);
}

.fb-bar__track {
  flex: 1;
  min-width: 120px;
}

.fb-bar__count {
  flex: 0 0 auto;
  color: var(--el-text-color-regular);
}

.fb-hint {
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.fb-muted {
  color: var(--el-text-color-secondary);
}

.rec-tip {
  font-size: 12px;
  line-height: 1.6;
}

.rec-tip__icon {
  margin-left: 6px;
  vertical-align: middle;
  color: var(--el-text-color-secondary);
}
</style>
