<script setup lang="ts">
import { onMounted } from "vue";
import { useUserAccounts } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";

defineOptions({
  name: "SrvfUsers"
});

const {
  canRead,
  loading,
  columns,
  dataList,
  pagination,
  roleMeta,
  onSearch,
  handleSizeChange,
  handleCurrentChange
} = useUserAccounts();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <PureTableBar
      v-if="canRead"
      title="用户管理"
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
          <template #role="{ row }">
            <el-tag :type="roleMeta(row.role).type">
              {{ roleMeta(row.role).text }}
            </el-tag>
          </template>
          <template #status="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'">
              {{ row.status === "ACTIVE" ? "正常" : "禁用" }}
            </el-tag>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
    <el-empty v-else description="您没有查看用户的权限（user.read.account）" />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
