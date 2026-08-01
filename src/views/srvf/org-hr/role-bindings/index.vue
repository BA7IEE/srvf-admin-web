<script setup lang="ts">
import { h, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { addDrawer } from "@/components/ReDrawer";
import { SrvfListPage, SrvfStatusTag } from "@/srvf-kit";
import {
  BINDING_STATUS_LABEL,
  BINDING_STATUS_TAG
} from "@/api/srvf-role-binding";
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
function openExplain() {
  addDrawer({
    title: "权限诊断",
    size: "620px",
    hideFooter: true,
    contentRenderer: () => h(AuthzExplainDrawer)
  });
}

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
  principalLabel,
  principalLocked,
  clearPrincipalFilter,
  columns,
  dataList,
  pagination,
  scopeTypeLabel,
  onSearch,
  onFilterChange,
  openCreateDialog,
  openEditDialog,
  handleToggleSuspend,
  effectiveMeta,
  canResume,
  handleDelete,
  handleSizeChange,
  handleCurrentChange
} = useRoleBindings();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <SrvfListPage
    :can-read="canRead"
    title="角色绑定"
    intro="角色绑定 = 把角色授予某个主体（用户 / 队员 / 任职）并限定生效范围；「系统管理 → 角色权限」定义的是角色本身有哪些权限，两者配合使用。范围授权已对队员轴与参与域生效；具体能读能写仍取决于角色带的动作码与这条绑定的资源范围。"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看角色绑定"
    empty-code="role-binding.read.record"
    @refresh="onSearch"
    @page-size-change="handleSizeChange"
    @page-current-change="handleCurrentChange"
  >
    <template #banner>
      <el-alert
        v-if="principalLocked"
        type="warning"
        :closable="false"
        show-icon
        class="mb-2"
      >
        <template #title>
          <span>正在查看用户「{{ principalLabel }}」的授权绑定；</span>
          <el-button link type="primary" @click="clearPrincipalFilter">
            清除筛选，查看全部
          </el-button>
        </template>
      </el-alert>
    </template>
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
        placeholder="生效范围"
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
        @click="openExplain"
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
    <template #scopeType="{ row }">
      <el-tag type="info">{{ scopeTypeLabel(row.scopeType) }}</el-tag>
    </template>
    <template #status="{ row }">
      <SrvfStatusTag
        :value="row.status"
        :label-dict="BINDING_STATUS_LABEL"
        :tag-dict="BINDING_STATUS_TAG"
      />
    </template>
    <template #effectiveState="{ row }">
      <template v-if="effectiveMeta(row).meta">
        <el-tag :type="effectiveMeta(row).meta.type">
          {{ effectiveMeta(row).meta.text }}
        </el-tag>
      </template>
      <el-tag v-else type="success">生效中</el-tag>
    </template>
    <template #operation="{ row, size }">
      <el-button
        v-if="canUpdate"
        class="reset-margin"
        link
        :size="size"
        :icon="useRenderIcon(EditPen)"
        @click="openEditDialog(row)"
      >
        备注
      </el-button>
      <!--
        范围已失效的绑定不给「恢复」：它指向的组织已停用/已删，恢复了照样不产生权限。
        置灰并说明，比让人点一次以为修好了要诚实。
      -->
      <el-tooltip
        v-if="canUpdate && row.status === 'SUSPENDED' && !canResume(row)"
        content="该绑定的范围组织已停用或已删除，恢复也不会产生权限；请先恢复该组织，或另建一条指向有效组织的绑定"
        placement="top"
      >
        <span>
          <el-button
            class="reset-margin"
            link
            type="success"
            disabled
            :size="size"
          >
            恢复
          </el-button>
        </span>
      </el-tooltip>
      <el-button
        v-else-if="canUpdate && row.status !== 'ENDED'"
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
  </SrvfListPage>
</template>
