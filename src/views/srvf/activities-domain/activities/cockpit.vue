<script setup lang="ts">
import { bizErrorMessage } from "@/api/srvf-error";
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import {
  getActivity,
  publishActivity,
  cancelActivity,
  type ActivityDetail
} from "@/api/srvf-activity";
import { useRegistrations } from "../registrations/utils/hook";
import { useAttendances } from "../attendances/utils/hook";
import ReviewDetail from "../attendances/review-detail.vue";

import AddFill from "~icons/ri/add-circle-line";
import ArrowLeftLine from "~icons/ri/arrow-left-line";

defineOptions({
  name: "SrvfActivityCockpit"
});

/** 实体 id 来自路由参数（该路由不入 keepAlive → 每次进来重新挂载，setup 取一次即可靠） */
const route = useRoute();
const router = useRouter();
const activityId = route.params.id as string;

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

// 发布/取消按真实 RBAC 码做按钮级显隐（与活动列表 hook 同码门；SUPER_ADMIN 全码故全可见）
const canPublish = hasPerms("activity.publish.record");
const canCancel = hasPerms("activity.cancel.record");

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

/** 发布（draft → published；照活动列表 hook 写法：confirm + 复用 publishActivity；成功后重拉详情） */
function handlePublish() {
  if (!detail.value) return;
  ElMessageBox.confirm(
    `确定要发布活动「${detail.value.title}」吗？发布后将对符合条件的用户可见。`,
    "发布活动",
    { confirmButtonText: "确定发布", cancelButtonText: "取消", type: "warning" }
  )
    .then(async () => {
      try {
        await publishActivity(activityId);
        message("发布成功", { type: "success" });
        fetchDetail();
      } catch (error: any) {
        message(bizErrorMessage(error, "发布失败"), {
          type: "error"
        });
      }
    })
    .catch(() => {});
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
const activeTab = ref<"registrations" | "attendances">("registrations");

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

onMounted(() => {
  fetchDetail();
  // onSearch 自带 canRead + activityId 守卫；activityId 已由路由注入，有读码即加载该活动的报名/考勤
  regOnSearch();
  attOnSearch();
});
</script>

<template>
  <div class="main">
    <!-- 头部：活动信息 + 发布/取消 -->
    <el-card v-loading="detailLoading" shadow="never" class="mb-2">
      <el-button
        link
        class="mb-2!"
        :icon="useRenderIcon(ArrowLeftLine)"
        @click="router.push('/srvf/activities-domain/activities')"
      >
        返回活动列表
      </el-button>
      <template v-if="detail">
        <div class="cockpit-header">
          <div class="cockpit-header__title">
            <span class="cockpit-header__name">{{ detail.title }}</span>
            <el-tag :type="statusType(detail.statusCode)">
              {{ statusText(detail.statusCode) }}
            </el-tag>
          </div>
          <div class="cockpit-header__actions">
            <el-button
              v-if="canPublish && detail.statusCode === 'draft'"
              type="success"
              @click="handlePublish"
            >
              发布
            </el-button>
            <el-button
              v-if="canCancel && detail.statusCode !== 'cancelled'"
              type="warning"
              @click="handleCancel"
            >
              取消活动
            </el-button>
          </div>
        </div>
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
      <el-empty
        v-else-if="!detailLoading"
        description="未找到该活动或无权查看"
      />
    </el-card>

    <!-- Tab：报名 / 考勤（各自复用对应 list hook，无需再选活动） -->
    <el-tabs v-model="activeTab" class="cockpit-tabs">
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
                    type="primary"
                    :size="size"
                    @click="attOpenReviewDetail(row)"
                  >
                    查看明细
                  </el-button>
                  <el-button
                    v-if="attCanUpdate && row.statusCode === 'pending'"
                    class="reset-margin"
                    link
                    type="primary"
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
        <SrvfPermEmpty v-else action="查看考勤" code="attendance.read.sheet" />
      </el-tab-pane>
    </el-tabs>

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

.cockpit-header {
  display: flex;
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
    gap: 8px;
  }
}
</style>
