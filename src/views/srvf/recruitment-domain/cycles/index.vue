<script setup lang="ts">
import { onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { SrvfListPage } from "@/srvf-kit";
import { useRecruitmentCycles } from "./utils/hook";

import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SrvfRecruitmentCycles"
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
} = useRecruitmentCycles();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <SrvfListPage
    :can-read="canRead"
    title="招新轮次"
    intro="招新是入队前的第一道门：公开报名 → 实名核验与考核 → 发放队员编号（简称「发号」）成为志愿者；志愿者再经「入队轮次」综合评定，成为正式队员。"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看招新轮次"
    empty-code="recruitment-cycle.read.record"
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
        新建轮次
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
