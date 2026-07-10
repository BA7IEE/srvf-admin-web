<script setup lang="ts">
import { onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { SrvfListPage } from "@/srvf-kit";
import { useTeamJoinCycles } from "./utils/hook";

import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SrvfTeamJoinCycles"
});

const {
  canRead,
  canCreate,
  canUpdate,
  loading,
  columns,
  dataList,
  pagination,
  statusMeta,
  onSearch,
  openDialog,
  handleToggleStatus,
  openCockpit,
  handleSizeChange,
  handleCurrentChange
} = useTeamJoinCycles();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <SrvfListPage
    :can-read="canRead"
    title="入队轮次"
    intro="入队是第二道门：已获得队员编号的志愿者提交入队申请 → 考核与综合评定 → 一键入队成为正式队员。"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看入队轮"
    empty-code="team-join-cycle.read.record"
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
        新建入队轮
      </el-button>
    </template>
    <template #statusCode="{ row }">
      <el-tag :type="statusMeta(row.statusCode).type">
        {{ statusMeta(row.statusCode).text }}
      </el-tag>
    </template>
    <template #operation="{ row, size }">
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
        @click="openDialog('编辑', row)"
      >
        编辑
      </el-button>
      <el-button
        v-if="canUpdate"
        class="reset-margin"
        link
        :type="row.statusCode === 'open' ? 'warning' : 'success'"
        :size="size"
        @click="handleToggleStatus(row)"
      >
        {{ row.statusCode === "open" ? "关闭" : "开启" }}
      </el-button>
    </template>
  </SrvfListPage>
</template>
