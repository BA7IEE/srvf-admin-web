<script setup lang="ts">
import { onMounted } from "vue";
import { usePermissions } from "./utils/hook";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { SrvfListPage } from "@/srvf-kit";

import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";

defineOptions({
  name: "SrvfPermissions"
});

const {
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  loading,
  columns,
  dataList,
  pagination,
  filterForm,
  onSearch,
  handleFilterReset,
  handleFilterSearch,
  handleSizeChange,
  handleCurrentChange,
  openDialog,
  handleDelete
} = usePermissions();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <SrvfListPage
    :can-read="canRead"
    title="权限点管理"
    intro="系统权限的最小单元（技术配置页）：一般由系统管理员维护，日常无需改动。"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看权限点"
    empty-code="rbac.permission.read"
    @refresh="onSearch"
    @page-size-change="handleSizeChange"
    @page-current-change="handleCurrentChange"
  >
    <template #banner>
      <el-form :inline="true" :model="filterForm" class="mb-2">
        <el-form-item label="模块">
          <el-input
            v-model="filterForm.module"
            clearable
            placeholder="精确匹配，如 attachment"
            class="w-50!"
            @keyup.enter="handleFilterSearch"
            @clear="handleFilterSearch"
          />
        </el-form-item>
        <el-form-item label="资源类型">
          <el-input
            v-model="filterForm.resourceType"
            clearable
            placeholder="精确匹配，如 cert"
            class="w-50!"
            @keyup.enter="handleFilterSearch"
            @clear="handleFilterSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilterSearch">搜索</el-button>
          <el-button @click="handleFilterReset">重置</el-button>
        </el-form-item>
      </el-form>
    </template>
    <template #buttons>
      <el-button
        v-if="canCreate"
        type="primary"
        :icon="useRenderIcon(AddFill)"
        @click="openDialog('新建')"
      >
        新建权限点
      </el-button>
    </template>
    <template #operation="{ row, size }">
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
  </SrvfListPage>
</template>
