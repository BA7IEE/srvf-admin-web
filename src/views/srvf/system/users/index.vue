<script setup lang="ts">
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { onMounted } from "vue";
import { useUserAccounts } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import RbacRolesDrawer from "./rbac-roles-drawer.vue";

import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SrvfUsers"
});

const {
  canRead,
  canCreate,
  canUpdateAccount,
  canResetPassword,
  canUpdateStatus,
  canUpdateRole,
  canClearPhone,
  canClearWechat,
  canDelete,
  canRbacRoleManage,
  loading,
  columns,
  dataList,
  pagination,
  rbacRolesDrawerVisible,
  activeUser,
  roleMeta,
  onSearch,
  openDialog,
  handleResetPassword,
  handleToggleStatus,
  openRoleDialog,
  handleClearPhone,
  handleClearWechat,
  handleDelete,
  handleSizeChange,
  handleCurrentChange,
  openRbacRolesDrawer
} = useUserAccounts();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <PureTableBar
      v-if="canRead"
      title="用户管理"
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
          新建用户
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
          <template #role="{ row }">
            <el-tag :type="roleMeta(row.role).type">
              {{ roleMeta(row.role).text }}
            </el-tag>
          </template>
          <template #status="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'">
              {{ row.status === "ACTIVE" ? "正常" : "禁用" }}
            </el-tag>
          </template>
          <template #operation="{ row }">
            <el-button
              v-if="canUpdateAccount"
              class="reset-margin"
              link
              type="primary"
              :size="size"
              @click="openDialog('编辑', row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canResetPassword"
              class="reset-margin"
              link
              type="primary"
              :size="size"
              @click="handleResetPassword(row)"
            >
              重置密码
            </el-button>
            <el-button
              v-if="canUpdateStatus"
              class="reset-margin"
              link
              :type="row.status === 'ACTIVE' ? 'warning' : 'success'"
              :size="size"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === "ACTIVE" ? "禁用" : "启用" }}
            </el-button>
            <el-button
              v-if="canUpdateRole"
              class="reset-margin"
              link
              type="primary"
              :size="size"
              @click="openRoleDialog(row)"
            >
              改角色
            </el-button>
            <el-button
              v-if="canRbacRoleManage"
              class="reset-margin"
              link
              type="primary"
              :size="size"
              @click="openRbacRolesDrawer(row)"
            >
              RBAC角色
            </el-button>
            <el-button
              v-if="canClearPhone"
              class="reset-margin"
              link
              type="primary"
              :size="size"
              @click="handleClearPhone(row)"
            >
              清手机
            </el-button>
            <el-button
              v-if="canClearWechat"
              class="reset-margin"
              link
              type="primary"
              :size="size"
              @click="handleClearWechat(row)"
            >
              清微信
            </el-button>
            <el-button
              v-if="canDelete"
              class="reset-margin"
              link
              type="danger"
              :size="size"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
    <SrvfPermEmpty v-else action="查看用户" code="user.read.account" />

    <RbacRolesDrawer v-model="rbacRolesDrawerVisible" :user="activeUser" />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
