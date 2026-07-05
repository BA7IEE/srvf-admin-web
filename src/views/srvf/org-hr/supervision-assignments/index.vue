<script setup lang="ts">
import { onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useSupervisionAssignments } from "./utils/hook";

import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SrvfSupervisionAssignments"
});

const {
  canRead,
  canCreate,
  canRevoke,
  loading,
  scopeModeFilter,
  scopeModeOptions,
  statusFilter,
  statusOptions,
  keyword,
  columns,
  dataList,
  pagination,
  scopeModeLabel,
  statusMeta,
  onSearch,
  onFilterChange,
  openCreateDialog,
  handleRevoke,
  goMember,
  handleSizeChange,
  handleCurrentChange
} = useSupervisionAssignments();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <PureTableBar
      v-if="canRead"
      title="督导总表（分管,与职务正交）"
      :columns="columns"
      @refresh="onSearch"
    >
      <template #buttons>
        <el-input
          v-model="keyword"
          class="w-40! mr-2!"
          placeholder="搜分管人/组织（回车）"
          clearable
          @keyup.enter="onFilterChange"
          @clear="onFilterChange"
        />
        <el-select
          v-model="scopeModeFilter"
          class="w-32! mr-2!"
          placeholder="覆盖范围"
          @change="onFilterChange"
        >
          <el-option
            v-for="opt in scopeModeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-select
          v-model="statusFilter"
          class="w-36! mr-2!"
          placeholder="状态"
          @change="onFilterChange"
        >
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-button
          v-if="canCreate"
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openCreateDialog"
        >
          新建分管
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
        >
          <template #scopeMode="{ row }">
            <el-tag :type="row.scopeMode === 'TREE' ? 'primary' : 'info'">
              {{ scopeModeLabel(row.scopeMode) }}
            </el-tag>
          </template>
          <template #status="{ row }">
            <el-tag :type="statusMeta(row.status).type">
              {{ statusMeta(row.status).text }}
            </el-tag>
          </template>
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              type="primary"
              :size="size"
              @click="goMember(row)"
            >
              队员档案
            </el-button>
            <el-button
              v-if="canRevoke && row.status === 'ACTIVE'"
              class="reset-margin"
              link
              type="danger"
              :size="size"
              @click="handleRevoke(row)"
            >
              撤销
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
    <el-empty
      v-else
      description="您没有查看督导的权限（supervision-assignment.read.record）"
    />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
