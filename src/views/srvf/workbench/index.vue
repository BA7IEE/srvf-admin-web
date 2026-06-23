<script setup lang="ts">
import { ref, onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useApprovalRegistrations, useApprovalAttendance } from "./utils/hook";

defineOptions({
  name: "SrvfWorkbench"
});

/**
 * 审批工作台 = 跨轴横扫"待我处理"（脱离 :activityId,按 statusCode 横扫报名/考勤）。
 * 作为工作台落地页兜底（后端暂无聚合 stats 端点）。沿轴下钻请点行内「前往作战室」。
 */
const activeTab = ref<"registrations" | "attendances">("registrations");

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
  // onSearch 自带 canRead 守卫；有读码即按默认 statusFilter=pending 横扫
  regOnSearch();
  attOnSearch();
});
</script>

<template>
  <div class="main">
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
</style>
