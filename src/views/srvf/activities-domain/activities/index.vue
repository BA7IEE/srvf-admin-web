<script setup lang="ts">
import { onMounted } from "vue";
import { useActivities } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";

defineOptions({
  name: "SrvfActivities"
});

const {
  loading,
  columns,
  dataList,
  pagination,
  onSearch,
  handleSizeChange,
  handleCurrentChange
} = useActivities();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <PureTableBar title="活动列表" :columns="columns" @refresh="onSearch">
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
          <template #isPublicRegistration="{ row }">
            <el-tag :type="row.isPublicRegistration ? 'success' : 'info'">
              {{ row.isPublicRegistration ? "公开" : "非公开" }}
            </el-tag>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
