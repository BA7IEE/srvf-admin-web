<script setup lang="ts">
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { usePositionRules } from "./utils/hook";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import { SrvfPageIntro } from "@/srvf-kit";

defineOptions({
  name: "SrvfPositionRules"
});

const {
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  loading,
  nodeTypeFilter,
  nodeTypeOptions,
  positionFilter,
  positionOptions,
  statusFilter,
  statusOptions,
  columns,
  dataList,
  pagination,
  ensureNodeTypeOptions,
  onSearch,
  onFilterChange,
  openDialog,
  handleToggleStatus,
  handleDelete,
  handleSizeChange,
  handleCurrentChange
} = usePositionRules();

onMounted(() => {
  // 过滤下拉预热（表单打开时会再 ensure 一次,幂等）
  ensureNodeTypeOptions();
  onSearch();
});
</script>

<template>
  <div class="main">
    <SrvfPageIntro
      class="mb-2"
      title="约束每类组织可设哪些职务、人数上下限，任命时系统会按此校验。"
    />
    <PureTableBar
      v-if="canRead"
      title="职务规则（组织类别 × 职务）"
      :columns="columns"
      @refresh="onSearch"
    >
      <template #buttons>
        <el-select
          v-model="nodeTypeFilter"
          class="w-40! mr-2!"
          placeholder="全部组织类别"
          clearable
          @change="onFilterChange"
        >
          <el-option
            v-for="opt in nodeTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-select
          v-model="positionFilter"
          class="w-36! mr-2!"
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
          class="w-32! mr-2!"
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
        <el-button
          v-if="canCreate"
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog('新建')"
        >
          新建规则
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
          <template #required="{ row }">
            <el-tag :type="row.required ? 'warning' : 'info'">
              {{ row.required ? "必设" : "可选" }}
            </el-tag>
          </template>
          <template #requireMembership="{ row }">
            <el-tag :type="row.requireMembership ? 'success' : 'info'">
              {{ row.requireMembership ? "要求" : "不要求" }}
            </el-tag>
          </template>
          <template #allowConcurrent="{ row }">
            <el-tag :type="row.allowConcurrent ? 'success' : 'info'">
              {{ row.allowConcurrent ? "允许" : "禁止" }}
            </el-tag>
          </template>
          <template #status="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
              {{ row.status === "ACTIVE" ? "启用" : "停用" }}
            </el-tag>
          </template>
          <template #operation="{ row }">
            <el-button
              v-if="canUpdate"
              class="reset-margin"
              link
              :size="size"
              :icon="useRenderIcon(EditPen)"
              @click="openDialog('编辑', row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canUpdate"
              class="reset-margin"
              link
              :type="row.status === 'ACTIVE' ? 'warning' : 'success'"
              :size="size"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === "ACTIVE" ? "停用" : "启用" }}
            </el-button>
            <el-button
              v-if="canDelete"
              class="reset-margin"
              link
              type="danger"
              :size="size"
              :icon="useRenderIcon(Delete)"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
    <SrvfPermEmpty
      v-else
      action="查看职务规则"
      code="position-rule.read.record"
    />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
