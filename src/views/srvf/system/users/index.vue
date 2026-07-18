<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useUserAccounts } from "./utils/hook";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import AddFill from "~icons/ri/add-circle-line";
import More from "~icons/ep/more-filled";
import { SrvfListPage } from "@/srvf-kit";
import GrantWizard from "@/views/srvf/components/grant-wizard.vue";
import { hasPerms } from "@/utils/auth";

defineOptions({
  name: "SrvfUsers"
});

/** 授权向导（任一授权类写码即可见;向导内部再按场景细分门控） */
const grantWizardVisible = ref(false);
const canOpenGrantWizard =
  hasPerms("position-assignment.create.record") ||
  hasPerms("role-binding.create.record") ||
  hasPerms("rbac.user-role.create");

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
  searchForm,
  roleMeta,
  onSearch,
  onFilterChange,
  goMemberProfile,
  goUserAuthz,
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

/** 低频行操作收进「更多」下拉（操作列只保留 编辑 / 启停 两个主操作） */
const canMoreOps =
  canResetPassword ||
  canUpdateRole ||
  canRbacRoleManage ||
  canClearPhone ||
  canClearWechat ||
  canDelete;

onMounted(() => {
  onSearch();
});
</script>

<template>
  <SrvfListPage
    :can-read="canRead"
    title="系统账号"
    intro="管理登录本系统的账号：创建账号、重置密码、调整系统角色与业务角色绑定。"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看用户"
    empty-code="user.read.account"
    @refresh="onSearch"
    @page-size-change="handleSizeChange"
    @page-current-change="handleCurrentChange"
  >
    <template #buttons>
      <el-input
        v-model="searchForm.q"
        class="w-48! mr-2!"
        placeholder="搜用户名 / 昵称 / 邮箱（回车）"
        clearable
        @keyup.enter="onFilterChange"
        @clear="onFilterChange"
      />
      <el-select
        v-model="searchForm.role"
        class="w-32! mr-2!"
        placeholder="系统角色"
        clearable
        @change="onFilterChange"
      >
        <el-option label="超级管理员" value="SUPER_ADMIN" />
        <el-option label="管理员" value="ADMIN" />
        <el-option label="普通用户" value="USER" />
      </el-select>
      <el-select
        v-model="searchForm.status"
        class="w-28! mr-2!"
        placeholder="状态"
        clearable
        @change="onFilterChange"
      >
        <el-option label="正常" value="ACTIVE" />
        <el-option label="禁用" value="DISABLED" />
      </el-select>
      <el-button
        v-if="canCreate"
        type="primary"
        :icon="useRenderIcon(AddFill)"
        @click="openDialog('新建')"
      >
        新建用户
      </el-button>
      <el-button v-if="canOpenGrantWizard" @click="grantWizardVisible = true">
        授权向导
      </el-button>
    </template>
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
    <template #member="{ row }">
      <el-link
        v-if="row.member"
        type="primary"
        :underline="false"
        @click="goMemberProfile(row)"
      >
        {{ row.member.displayName }}（{{ row.member.memberNo }}）
      </el-link>
      <span v-else>—</span>
    </template>
    <template #operation="{ row, size }">
      <el-button
        v-if="canUpdateAccount"
        class="reset-margin"
        link
        :size="size"
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
        {{ row.status === "ACTIVE" ? "禁用" : "启用" }}
      </el-button>
      <el-dropdown v-if="canMoreOps" trigger="click">
        <el-button
          class="ml-3! mt-0.5!"
          link
          :size="size"
          :icon="useRenderIcon(More)"
        />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-if="canUpdateRole">
              <el-button
                class="reset-margin!"
                link
                :size="size"
                @click="openRoleDialog(row)"
              >
                改系统角色
              </el-button>
            </el-dropdown-item>
            <el-dropdown-item v-if="canRbacRoleManage">
              <el-button
                class="reset-margin!"
                link
                :size="size"
                @click="openRbacRolesDrawer(row)"
              >
                业务角色绑定
              </el-button>
            </el-dropdown-item>
            <el-dropdown-item v-if="canRbacRoleManage">
              <el-button
                class="reset-margin!"
                link
                :size="size"
                @click="goUserAuthz(row)"
              >
                查看授权
              </el-button>
            </el-dropdown-item>
            <el-dropdown-item v-if="canResetPassword" divided>
              <el-button
                class="reset-margin!"
                link
                type="warning"
                :size="size"
                @click="handleResetPassword(row)"
              >
                重置密码
              </el-button>
            </el-dropdown-item>
            <el-dropdown-item v-if="canClearPhone">
              <el-button
                class="reset-margin!"
                link
                type="warning"
                :size="size"
                @click="handleClearPhone(row)"
              >
                清除手机绑定
              </el-button>
            </el-dropdown-item>
            <el-dropdown-item v-if="canClearWechat">
              <el-button
                class="reset-margin!"
                link
                type="warning"
                :size="size"
                @click="handleClearWechat(row)"
              >
                清除微信绑定
              </el-button>
            </el-dropdown-item>
            <el-dropdown-item v-if="canDelete" divided>
              <el-button
                class="reset-margin!"
                link
                type="danger"
                :size="size"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>
  </SrvfListPage>

  <GrantWizard v-model="grantWizardVisible" />
</template>
