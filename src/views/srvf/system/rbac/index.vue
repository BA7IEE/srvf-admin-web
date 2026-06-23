<script setup lang="ts">
import { onMounted } from "vue";
import { useRoles } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import Refresh from "~icons/ri/refresh-line";

defineOptions({
  name: "SrvfRbac"
});

const {
  canRead,
  canReload,
  loading,
  columns,
  dataList,
  pagination,
  onSearch,
  handleReload,
  handleSizeChange,
  handleCurrentChange
} = useRoles();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <PureTableBar
      v-if="canRead"
      title="角色权限"
      :columns="columns"
      @refresh="onSearch"
    >
      <template #buttons>
        <el-button
          v-if="canReload"
          :icon="useRenderIcon(Refresh)"
          @click="handleReload"
        >
          重载权限缓存
        </el-button>
      </template>
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
        />
      </template>
    </PureTableBar>
    <el-empty v-else description="您没有查看角色的权限（rbac.role.read）" />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
