<script setup lang="ts">
import { onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useContents } from "./utils/hook";

import AddFill from "~icons/ri/add-circle-line";
import Search from "~icons/ri/search-line";
import { SrvfListPage, SrvfStatusTag } from "@/srvf-kit";
import { CONTENT_STATUS_LABEL, CONTENT_STATUS_TAG } from "@/api/srvf-content";

defineOptions({
  name: "SrvfContents"
});

const {
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  canPublish,
  loading,
  statusFilter,
  statusOptions,
  keyword,
  columns,
  dataList,
  pagination,
  onSearch,
  onFilterChange,
  openDialog,
  runStateAction,
  handleDelete,
  openMedia,
  handleSizeChange,
  handleCurrentChange
} = useContents();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <SrvfListPage
    :can-read="canRead"
    title="内容发布"
    intro="面向队内或公众的图文内容：先保存为草稿，点「发布」上线，可随时撤回或归档。"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看内容"
    empty-code="content.read.record"
    @refresh="onSearch"
    @page-size-change="handleSizeChange"
    @page-current-change="handleCurrentChange"
  >
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
      <el-input
        v-model="keyword"
        class="w-52!"
        placeholder="标题/正文关键词"
        clearable
        :prefix-icon="useRenderIcon(Search)"
        @keyup.enter="onFilterChange"
        @clear="onFilterChange"
      />
      <el-button type="primary" @click="onFilterChange">搜索</el-button>
      <el-button
        v-if="canCreate"
        type="primary"
        :icon="useRenderIcon(AddFill)"
        @click="openDialog('新建')"
      >
        新建内容
      </el-button>
    </template>
    <template #statusCode="{ row }">
      <SrvfStatusTag
        :value="row.statusCode"
        :label-dict="CONTENT_STATUS_LABEL"
        :tag-dict="CONTENT_STATUS_TAG"
      />
    </template>
    <template #operation="{ row, size }">
      <el-button
        v-if="canUpdate && row.statusCode !== 'archived'"
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
        :size="size"
        @click="openMedia(row)"
      >
        封面/附件
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
  </SrvfListPage>
</template>
