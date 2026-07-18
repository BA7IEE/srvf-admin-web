<script setup lang="ts">
import { onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useSupervisionAssignments } from "./utils/hook";

import AddFill from "~icons/ri/add-circle-line";
import { SrvfListPage, SrvfStatusTag } from "@/srvf-kit";
import {
  SUPERVISION_STATUS_LABEL,
  SUPERVISION_STATUS_TAG
} from "@/api/srvf-supervision";

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
  <SrvfListPage
    :can-read="canRead"
    title="分管总表（谁分管哪些组织,与职务任命相互独立）"
    intro="维护「谁分管哪些组织」：分管与职务任命相互独立，用于范围化的监督权限。"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看分管"
    empty-code="supervision-assignment.read.record"
    @refresh="onSearch"
    @page-size-change="handleSizeChange"
    @page-current-change="handleCurrentChange"
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
    <template #scopeMode="{ row }">
      <el-tag :type="row.scopeMode === 'TREE' ? 'primary' : 'info'">
        {{ scopeModeLabel(row.scopeMode) }}
      </el-tag>
    </template>
    <template #status="{ row }">
      <SrvfStatusTag
        :value="row.status"
        :label-dict="SUPERVISION_STATUS_LABEL"
        :tag-dict="SUPERVISION_STATUS_TAG"
      />
    </template>
    <template #operation="{ row, size }">
      <el-button class="reset-margin" link :size="size" @click="goMember(row)">
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
  </SrvfListPage>
</template>
