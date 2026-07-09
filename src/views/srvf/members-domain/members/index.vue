<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMembers } from "./utils/hook";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { SrvfListPage } from "@/srvf-kit";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SrvfMembers"
});

const route = useRoute();
const router = useRouter();

/** 工作台「快捷发起」入口：带 ?create=1 进来时自动打开新建弹窗（无创建权限则静默忽略） */
function consumeQuickCreate() {
  if (route.query.create !== "1") return;
  router.replace({ path: route.path });
  if (canCreate) openDialog("新建");
}

const {
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  canUpdateStatus,
  canBulkGrant,
  loading,
  columns,
  dataList,
  pagination,
  searchForm,
  gradeOptions,
  ensureGradeOptions,
  onSearch,
  onFilterChange,
  handleSelectionChange,
  openBulkGrantDialog,
  openDialog,
  openCockpit,
  handleDelete,
  handleToggleStatus,
  handleSizeChange,
  handleCurrentChange
} = useMembers();

onMounted(() => {
  consumeQuickCreate();
  onSearch();
  // 等级筛选下拉的数据源（member_grade 字典；无权限/失败时静默为空）
  ensureGradeOptions();
});
</script>

<template>
  <SrvfListPage
    :can-read="canRead"
    title="队员列表"
    intro="全队队员花名册：点「档案」查看某位队员的完整信息（证书、归属、履历、贡献值等都在档案里）。"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看队员"
    empty-code="member.read.record"
    @refresh="onSearch"
    @page-size-change="handleSizeChange"
    @page-current-change="handleCurrentChange"
    @selection-change="handleSelectionChange"
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
      <el-select
        v-model="searchForm.hasAccount"
        class="w-28! mr-2!"
        placeholder="账号"
        clearable
        @change="onFilterChange"
      >
        <el-option label="已开通" value="true" />
        <el-option label="未开通" value="false" />
      </el-select>
      <el-button
        v-if="canCreate"
        type="primary"
        :icon="useRenderIcon(AddFill)"
        @click="openDialog('新建')"
      >
        新建
      </el-button>
      <el-button v-if="canBulkGrant" @click="openBulkGrantDialog">
        批量开通账号
      </el-button>
    </template>
    <template #status="{ row }">
      <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
        {{ row.status === "ACTIVE" ? "在队" : "离队" }}
      </el-tag>
    </template>
    <template #account="{ row }">
      <el-tag v-if="!row.hasAccount" type="info">未开通</el-tag>
      <el-tag
        v-else
        :type="row.accountStatus === 'ACTIVE' ? 'success' : 'danger'"
      >
        {{ row.accountStatus === "ACTIVE" ? "已开通" : "已停用" }}
      </el-tag>
    </template>
    <template #operation="{ row, size }">
      <el-button
        class="reset-margin"
        link
        :size="size"
        @click="openCockpit(row)"
      >
        档案
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
  </SrvfListPage>
</template>
