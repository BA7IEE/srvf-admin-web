<script setup lang="ts">
import { onMounted } from "vue";
import { useActivities } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import { SrvfPageIntro } from "@/srvf-kit";

defineOptions({
  name: "SrvfActivities"
});

const {
  canCreate,
  canUpdate,
  canDelete,
  canPublish,
  canCancel,
  loading,
  columns,
  dataList,
  pagination,
  statusMeta,
  onSearch,
  openDialog,
  openCockpit,
  handleDelete,
  handlePublish,
  handleCancel,
  handleSizeChange,
  handleCurrentChange
} = useActivities();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <SrvfPageIntro
      class="mb-2"
      title="发布和管理全队活动：新建后点「管理」进入活动详情，在那里发布活动、审核报名、提交和审核考勤。"
    />
    <PureTableBar title="活动列表" :columns="columns" @refresh="onSearch">
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
          <template #statusCode="{ row }">
            <el-tag :type="statusMeta(row.statusCode).type">
              {{ statusMeta(row.statusCode).text }}
            </el-tag>
          </template>
          <template #isPublicRegistration="{ row }">
            <el-tag :type="row.isPublicRegistration ? 'success' : 'info'">
              {{ row.isPublicRegistration ? "公开" : "非公开" }}
            </el-tag>
          </template>
          <template #operation="{ row }">
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
              :icon="useRenderIcon(EditPen)"
              @click="openDialog('编辑', row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canPublish && row.statusCode === 'draft'"
              class="reset-margin"
              link
              type="success"
              :size="size"
              @click="handlePublish(row)"
            >
              发布
            </el-button>
            <el-button
              v-if="canCancel && row.statusCode !== 'cancelled'"
              class="reset-margin"
              link
              type="warning"
              :size="size"
              @click="handleCancel(row)"
            >
              取消
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
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
