<script setup lang="ts">
import { onMounted } from "vue";
import { usePositionAssignmentList } from "./utils/hook";
import { SrvfListPage } from "@/srvf-kit";

defineOptions({
  name: "SrvfPositionAssignments"
});

const {
  canRead,
  canRevoke,
  canHistory,
  loading,
  statusFilter,
  statusOptions,
  positionFilter,
  positionOptions,
  orgFilter,
  orgOptions,
  includeDescendants,
  keyword,
  columns,
  dataList,
  pagination,
  statusMeta,
  onSearch,
  onFilterChange,
  handleRevoke,
  openHistory,
  goMember,
  handleSizeChange,
  handleCurrentChange
} = usePositionAssignmentList();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <SrvfListPage
    :can-read="canRead"
    title="任命记录（跨组织跨队员）"
    intro="跨组织查看全部职务任命记录；新的任命在「组织架构」页对应节点的「在任职务」里发起。"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看任职"
    empty-code="position-assignment.read.record"
    @refresh="onSearch"
    @page-size-change="handleSizeChange"
    @page-current-change="handleCurrentChange"
  >
    <template #buttons>
      <el-input
        v-model="keyword"
        class="w-40! mr-2!"
        placeholder="搜队员/组织（回车）"
        clearable
        @keyup.enter="onFilterChange"
        @clear="onFilterChange"
      />
      <el-select
        v-model="orgFilter"
        class="w-36! mr-2!"
        placeholder="全部组织"
        clearable
        filterable
        @change="onFilterChange"
      >
        <el-option
          v-for="opt in orgOptions"
          :key="opt.id"
          :label="opt.label"
          :value="opt.id"
        />
      </el-select>
      <el-checkbox
        v-if="orgFilter"
        v-model="includeDescendants"
        class="mr-2!"
        @change="onFilterChange"
      >
        含下级组织
      </el-checkbox>
      <el-select
        v-model="positionFilter"
        class="w-32! mr-2!"
        placeholder="全部职务"
        clearable
        filterable
        @change="onFilterChange"
      >
        <el-option
          v-for="opt in positionOptions"
          :key="opt.id"
          :label="opt.label"
          :value="opt.id"
        />
      </el-select>
      <el-select
        v-model="statusFilter"
        class="w-36!"
        placeholder="全部状态"
        @change="onFilterChange"
      >
        <el-option
          v-for="opt in statusOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </template>
    <template #status="{ row }">
      <el-tag :type="statusMeta(row.status).type">
        {{ statusMeta(row.status).text }}
      </el-tag>
    </template>
    <template #isConcurrent="{ row }">
      <el-tag :type="row.isConcurrent ? 'warning' : 'info'">
        {{ row.isConcurrent ? "是" : "否" }}
      </el-tag>
    </template>
    <template #operation="{ row, size }">
      <el-button class="reset-margin" link :size="size" @click="goMember(row)">
        队员档案
      </el-button>
      <el-button
        v-if="canHistory"
        class="reset-margin"
        link
        :size="size"
        @click="openHistory(row)"
      >
        历史
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
  </SrvfListPage>
</template>
