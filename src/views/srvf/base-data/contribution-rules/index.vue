<script setup lang="ts">
import { onMounted } from "vue";
import { useContributionRules } from "./utils/hook";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import { SrvfListPage } from "@/srvf-kit";

defineOptions({
  name: "SrvfContributionRules"
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
  onSearch,
  openDialog,
  handleDelete,
  handleToggleStatus,
  handleSizeChange,
  handleCurrentChange
} = useContributionRules();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <SrvfListPage
    :can-read="canRead"
    title="贡献值规则"
    intro="配置各类活动、各考勤角色的记分规则：按服务时长门槛给分，考勤终审通过后自动落分。"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看贡献值规则"
    empty-code="contribution.read.rule"
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
        新建
      </el-button>
    </template>
    <template #status="{ row }">
      <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
        {{ row.status === "ACTIVE" ? "启用" : "停用" }}
      </el-tag>
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
  </SrvfListPage>
</template>
