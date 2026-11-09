<script setup lang="ts">
import { useRouter } from "vue-router";
import { PureTableBar } from "@/components/RePureTableBar";
import { SrvfPermEmpty } from "@/srvf-kit";
import { objectValue } from "./snapshot";
import { readPermission } from "./state";
import { usePendingPublishReviews } from "./use-pending";
import type { PublishReview } from "@/api/srvf-activity-publish-review";

defineOptions({ name: "SrvfPendingPublishReviews" });
const router = useRouter();
const { canRead, rows, loading, error, pagination, load } =
  usePendingPublishReviews();
const columns: TableColumnList = [
  { label: "待审活动", slot: "activity", minWidth: 230 },
  { label: "申请", slot: "request", minWidth: 125 },
  { label: "提交时间", prop: "submittedAt", minWidth: 200 },
  { label: "操作", slot: "operation", width: 110, fixed: "right" }
];
function title(row: PublishReview) {
  const activity = row.snapshot.activity;
  return objectValue(activity) && typeof activity.title === "string"
    ? activity.title
    : row.activityTitle;
}
function open(row: PublishReview) {
  router.push({
    name: "SrvfPublishReviewDetail",
    params: { reviewId: row.id }
  });
}
</script>

<template>
  <div data-testid="publish-review-list">
    <p class="review-list-intro">
      核对申请中冻结的活动安排后，决定是否通过并发布，或写明原因退回。可见范围由当前权限决定；看得到申请不代表能审核。
    </p>
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
    />
    <PureTableBar
      v-if="canRead"
      title="待处理的活动发布申请"
      :columns="columns"
      @refresh="load()"
    >
      <template #default="{ size, dynamicColumns }">
        <pure-table
          row-key="id"
          :data="rows"
          :columns="dynamicColumns"
          :size="size"
          :loading="loading"
          :pagination="pagination"
          :pagination-small="size === 'small'"
          @page-current-change="load"
        >
          <template #activity="{ row }">
            <strong>{{ title(row) }}</strong>
            <div class="review-list-meta">
              承办组织标识：{{ row.organizationId }}
            </div>
          </template>
          <template #request="{ row }"
            >{{ row.requestType === "initial" ? "初次发布" : "发布后变更" }} ·
            第 {{ row.requestVersion }} 次</template
          >
          <template #operation="{ row }"
            ><el-button link type="primary" @click="open(row)"
              >核对申请</el-button
            ></template
          >
          <template #empty
            ><el-empty
              :description="
                error
                  ? '列表读取失败，请点击刷新重试'
                  : '当前可见组织范围内没有待审申请'
              "
          /></template>
        </pure-table>
      </template>
    </PureTableBar>
    <SrvfPermEmpty v-else action="查看活动发布审核" :code="readPermission" />
  </div>
</template>

<style scoped lang="scss">
.review-list-intro {
  margin: 0 0 16px;
  line-height: 1.7;
}

.review-list-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow-wrap: anywhere;
}
</style>
