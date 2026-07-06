<script setup lang="ts">
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { onMounted } from "vue";
import { useRoles } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import PermissionsDrawer from "./permissions-drawer.vue";

import Refresh from "~icons/ri/refresh-line";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import KeyLine from "~icons/ri/key-2-line";

defineOptions({
  name: "SrvfRbac"
});

const {
  canRead,
  canReload,
  canCreate,
  canUpdate,
  canDelete,
  canManagePermissions,
  loading,
  columns,
  dataList,
  pagination,
  permissionsDrawerVisible,
  activeRole,
  onSearch,
  handleReload,
  handleSizeChange,
  handleCurrentChange,
  openDialog,
  handleDelete,
  openPermissionsDrawer
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
          v-if="canCreate"
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog('新建')"
        >
          新建角色
        </el-button>
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
        >
          <template #operation="{ row }">
            <el-button
              v-if="canManagePermissions"
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(KeyLine)"
              @click="openPermissionsDrawer(row)"
            >
              权限点
            </el-button>
            <el-button
              v-if="canUpdate"
              class="reset-margin"
              link
              type="primary"
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
        </pure-table>
      </template>
    </PureTableBar>
    <SrvfPermEmpty v-else action="查看角色" code="rbac.role.read" />

    <PermissionsDrawer
      v-model="permissionsDrawerVisible"
      :role="activeRole"
      @saved="onSearch"
    />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
