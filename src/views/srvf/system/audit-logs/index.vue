<script setup lang="ts">
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { onMounted } from "vue";
import { useAuditLogs } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import DetailDrawer from "./detail-drawer.vue";
import { SrvfPageIntro } from "@/srvf-kit";

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
  <div class="main">
    <SrvfPageIntro
      class="mb-2"
      title="系统操作留痕（技术排查用）：出现异常操作或需要追溯时，按时间和资源检索。"
    />
    <PureTableBar
      v-if="canRead"
      title="审计日志"
      :columns="columns"
      @refresh="onSearch"
    >
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          row-key="id"
          adaptive
          :adaptiveConfig="{ offsetBottom: 108 }"
          align-whole="center"
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :paginationSmall="size === 'small' ? true : false"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
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
        </pure-table>
      </template>
    </PureTableBar>
    <SrvfPermEmpty v-else action="查看审计日志" code="audit-log.read.entry" />
    <DetailDrawer :id="detailId" v-model="detailVisible" />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
