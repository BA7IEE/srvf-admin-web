<script setup lang="ts">
import { onMounted } from "vue";
import { useRegistrations } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";

defineOptions({
  name: "SrvfRegistrations"
});

const {
  canRead,
  loading,
  columns,
  dataList,
  activityId,
  activityOptions,
  activityLoading,
  pagination,
  loadActivities,
  onSearch,
  onActivityChange,
  handleSizeChange,
  handleCurrentChange
} = useRegistrations();

onMounted(() => {
  if (canRead) loadActivities();
});
</script>

<template>
  <div class="main">
    <template v-if="canRead">
      <el-card shadow="never" class="mb-2">
        <div class="flex items-center gap-2">
          <span class="text-sm">选择活动：</span>
          <el-select
            v-model="activityId"
            filterable
            clearable
            class="w-80"
            placeholder="按标题搜索活动"
            :loading="activityLoading"
            @change="onActivityChange"
          >
            <el-option
              v-for="a in activityOptions"
              :key="a.value"
              :label="a.label"
              :value="a.value"
            />
          </el-select>
        </div>
      </el-card>
      <PureTableBar title="报名记录" :columns="columns" @refresh="onSearch">
        <template v-slot="{ size, dynamicColumns }">
          <el-empty
            v-if="!activityId"
            description="请先选择一个活动查看报名记录"
          />
          <pure-table
            v-else
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
          />
        </template>
      </PureTableBar>
    </template>
    <el-empty
      v-else
      description="您没有查看报名记录的权限（activity-registration.read.record）"
    />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
