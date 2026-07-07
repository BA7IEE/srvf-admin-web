<script setup lang="ts">
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { onMounted } from "vue";
import { useMembers } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SrvfMembers"
});

const {
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  canUpdateStatus,
  loading,
  columns,
  dataList,
  pagination,
  searchForm,
  gradeOptions,
  ensureGradeOptions,
  onSearch,
  onFilterChange,
  openDialog,
  openCockpit,
  handleDelete,
  handleToggleStatus,
  handleSizeChange,
  handleCurrentChange
} = useMembers();

onMounted(() => {
  onSearch();
  // 等级筛选下拉的数据源（member_grade 字典；无权限/失败时静默为空）
  ensureGradeOptions();
});
</script>

<template>
  <div class="main">
    <PureTableBar
      v-if="canRead"
      title="队员列表"
      :columns="columns"
      @refresh="onSearch"
    >
      <template #buttons>
        <el-input
          v-model="searchForm.q"
          class="w-48! mr-2!"
          placeholder="搜编号 / 称呼（回车）"
          clearable
          @keyup.enter="onFilterChange"
          @clear="onFilterChange"
        />
        <el-select
          v-model="searchForm.gradeCode"
          class="w-36! mr-2!"
          placeholder="等级"
          clearable
          @change="onFilterChange"
        >
          <el-option
            v-for="opt in gradeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-select
          v-model="searchForm.status"
          class="w-28! mr-2!"
          placeholder="状态"
          clearable
          @change="onFilterChange"
        >
          <el-option label="在队" value="ACTIVE" />
          <el-option label="离队" value="INACTIVE" />
        </el-select>
        <el-button
          v-if="canCreate"
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog('新建')"
        >
          新建
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
          <template #status="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
              {{ row.status === "ACTIVE" ? "在队" : "离队" }}
            </el-tag>
          </template>
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              :size="size"
              @click="openCockpit(row)"
            >
              管理
            </el-button>
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
              v-if="canUpdateStatus"
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
    <SrvfPermEmpty v-else action="查看队员" code="member.read.record" />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
