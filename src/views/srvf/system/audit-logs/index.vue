<script setup lang="ts">
import { onMounted } from "vue";
import { useAuditLogs } from "./utils/hook";
import DetailDrawer from "./detail-drawer.vue";
import { SrvfListPage } from "@/srvf-kit";

defineOptions({
  name: "SrvfAuditLogs"
});

const {
  canRead,
  loading,
  columns,
  dataList,
  pagination,
  onSearch,
  handleSizeChange,
  handleCurrentChange,
  detailVisible,
  detailId,
  openDetail
} = useAuditLogs();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <SrvfListPage
    :can-read="canRead"
    title="审计日志"
    intro="系统操作留痕（技术排查用）：出现异常操作或需要追溯时，按时间和资源检索。"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看审计日志"
    empty-code="audit-log.read.entry"
    @refresh="onSearch"
    @page-size-change="handleSizeChange"
    @page-current-change="handleCurrentChange"
  >
    <template #success="{ row }">
      <el-tag :type="row.success ? 'success' : 'danger'">
        {{ row.success ? "成功" : "失败" }}
      </el-tag>
    </template>
    <template #operation="{ row, size }">
      <el-button
        class="reset-margin"
        link
        :size="size"
        @click="openDetail(row)"
      >
        查看详情
      </el-button>
    </template>
  </SrvfListPage>
  <DetailDrawer :id="detailId" v-model="detailVisible" />
</template>
