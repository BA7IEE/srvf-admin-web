<script setup lang="ts">
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { usePositions } from "./utils/hook";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SrvfPositions"
});

const {
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  loading,
  categoryFilter,
  categoryOptions,
  statusFilter,
  statusOptions,
  columns,
  dataList,
  pagination,
  onSearch,
  onFilterChange,
  openDialog,
  handleToggleStatus,
  handleDelete,
  handleSizeChange,
  handleCurrentChange
} = usePositions();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <PureTableBar
      v-if="canRead"
      title="职务定义（全局复用）"
      :columns="columns"
      @refresh="onSearch"
    >
      <template #buttons>
        <el-select
          v-model="categoryFilter"
          class="w-32! mr-2!"
          placeholder="全部类别"
          @change="onFilterChange"
        >
          <el-option
            v-for="opt in categoryOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
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
          新建职务
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
          <template #isLeadership="{ row }">
            <el-tag :type="row.isLeadership ? 'warning' : 'info'">
              {{ row.isLeadership ? "是" : "否" }}
            </el-tag>
          </template>
          <template #allowMultiple="{ row }">
            <el-tag :type="row.allowMultiple ? 'success' : 'info'">
              {{ row.allowMultiple ? "允许" : "独占" }}
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
      action="查看职务定义"
      code="position.read.definition"
    />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
