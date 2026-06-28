<script setup lang="ts">
import { onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useNotifications } from "./utils/hook";

import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SrvfNotifications"
});

const {
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  canPublish,
  canSendSms,
  loading,
  statusFilter,
  statusOptions,
  typeFilter,
  typeOptions,
  columns,
  dataList,
  pagination,
  statusMeta,
  ensureTypeOptions,
  onSearch,
  onFilterChange,
  openDialog,
  runStateAction,
  openSendSms,
  handleDelete,
  handleSizeChange,
  handleCurrentChange
} = useNotifications();

onMounted(() => {
  onSearch();
  ensureTypeOptions();
});
</script>

<template>
  <div class="main">
    <template v-if="canRead">
      <PureTableBar title="通知管理" :columns="columns" @refresh="onSearch">
        <template #buttons>
          <el-select
            v-model="statusFilter"
            class="w-32!"
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
          <el-select
            v-model="typeFilter"
            class="w-40!"
            placeholder="全部类型"
            clearable
            @change="onFilterChange"
            @clear="onFilterChange"
          >
            <el-option
              v-for="opt in typeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-button
            v-if="canCreate"
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新建')"
          >
            新建通知
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
            <template #operation="{ row }">
              <el-button
                v-if="canUpdate && row.statusCode !== 'archived'"
                class="reset-margin"
                link
                type="primary"
                :size="size"
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
                @click="runStateAction(row, 'publish')"
              >
                发布
              </el-button>
              <el-button
                v-if="canPublish && row.statusCode === 'published'"
                class="reset-margin"
                link
                type="warning"
                :size="size"
                @click="runStateAction(row, 'unpublish')"
              >
                撤回
              </el-button>
              <el-button
                v-if="canPublish && row.statusCode === 'published'"
                class="reset-margin"
                link
                type="info"
                :size="size"
                @click="runStateAction(row, 'archive')"
              >
                归档
              </el-button>
              <el-button
                v-if="
                  canSendSms &&
                  row.statusCode === 'published' &&
                  (row.channels ?? []).includes('sms')
                "
                class="reset-margin"
                link
                type="danger"
                :size="size"
                @click="openSendSms(row)"
              >
                发送短信
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
    </template>
    <el-empty
      v-else
      description="您没有查看通知的权限（notification.read.record）"
    />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
