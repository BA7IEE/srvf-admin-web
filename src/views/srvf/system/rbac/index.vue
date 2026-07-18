<script setup lang="ts">
import { onMounted } from "vue";
import { useRoles } from "./utils/hook";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import Refresh from "~icons/ri/refresh-line";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import KeyLine from "~icons/ri/key-2-line";
import { SrvfListPage } from "@/srvf-kit";

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
  <SrvfListPage
    :can-read="canRead"
    title="角色权限"
    intro="定义每个角色拥有哪些权限点；要把角色授予具体的人，请用「系统账号 → 业务角色绑定」或「角色绑定」页。"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看角色"
    empty-code="rbac.role.read"
    @refresh="onSearch"
    @page-size-change="handleSizeChange"
    @page-current-change="handleCurrentChange"
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
        使权限立即生效
      </el-button>
    </template>
    <template #operation="{ row, size }">
      <el-button
        v-if="canManagePermissions"
        class="reset-margin"
        link
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
