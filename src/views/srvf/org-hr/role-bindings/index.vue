<script setup lang="ts">
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { onMounted, ref } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { hasPerms } from "@/utils/auth";
import { useRoleBindings } from "./utils/hook";
import AuthzExplainDrawer from "./authz-explain-drawer.vue";

import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import Guide from "~icons/ri/compass-3-line";

defineOptions({
  name: "SrvfRoleBindings"
});

/** 权限诊断入口（蓝图 §7：诊断是排查工具,入口放本页） */
const canExplain = hasPerms("authz.explain.decision");
const explainVisible = ref(false);

const {
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  loading,
  principalTypeFilter,
  principalTypeOptions,
  scopeTypeFilter,
  scopeTypeOptions,
  statusFilter,
  statusOptions,
  includeExpired,
  keyword,
  columns,
  dataList,
  pagination,
  scopeTypeLabel,
  statusMeta,
  onSearch,
  onFilterChange,
  openCreateDialog,
  openEditDialog,
  handleToggleSuspend,
  handleDelete,
  handleSizeChange,
  handleCurrentChange
} = useRoleBindings();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <PureTableBar
      v-if="canRead"
      title="角色绑定（主体 → 角色 @ scope 的实际授予）"
      :columns="columns"
      @refresh="onSearch"
    >
      <template #buttons>
        <el-input
          v-model="keyword"
          class="w-40! mr-2!"
          placeholder="搜主体（回车）"
          clearable
          @keyup.enter="onFilterChange"
          @clear="onFilterChange"
        />
        <el-select
          v-model="principalTypeFilter"
          class="w-32! mr-2!"
          placeholder="主体类型"
          @change="onFilterChange"
        >
          <el-option
            v-for="opt in principalTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-select
          v-model="scopeTypeFilter"
          class="w-32! mr-2!"
          placeholder="Scope"
          @change="onFilterChange"
        >
          <el-option
            v-for="opt in scopeTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-select
          v-model="statusFilter"
          class="w-28! mr-2!"
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
        <el-checkbox
          v-model="includeExpired"
          class="mr-2!"
          @change="onFilterChange"
        >
          含历史
        </el-checkbox>
        <el-button
          v-if="canExplain"
          :icon="useRenderIcon(Guide)"
          @click="explainVisible = true"
        >
          权限诊断
        </el-button>
        <el-button
          v-if="canCreate"
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openCreateDialog"
        >
          新建绑定
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
          <template #scopeType="{ row }">
            <el-tag type="info">{{ scopeTypeLabel(row.scopeType) }}</el-tag>
          </template>
          <template #status="{ row }">
            <el-tag :type="statusMeta(row.status).type">
              {{ statusMeta(row.status).text }}
            </el-tag>
          </template>
          <template #operation="{ row }">
            <el-button
              v-if="canUpdate"
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(EditPen)"
              @click="openEditDialog(row)"
            >
              备注
            </el-button>
            <el-button
              v-if="canUpdate && row.status !== 'ENDED'"
              class="reset-margin"
              link
              :type="row.status === 'SUSPENDED' ? 'success' : 'warning'"
              :size="size"
              @click="handleToggleSuspend(row)"
            >
              {{ row.status === "SUSPENDED" ? "恢复" : "暂停" }}
            </el-button>
            <el-button
              v-if="canDelete && row.status !== 'ENDED'"
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
      action="查看角色绑定"
      code="role-binding.read.record"
    />
    <AuthzExplainDrawer v-model="explainVisible" />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
