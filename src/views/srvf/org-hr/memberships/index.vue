<script setup lang="ts">
import { onMounted } from "vue";
import { SrvfListPage, SrvfStatusTag } from "@/srvf-kit";
import {
  MEMBERSHIP_STATUS_LABEL,
  MEMBERSHIP_STATUS_TAG
} from "@/api/srvf-labels";
import { useMembershipList } from "./utils/hook";

defineOptions({
  name: "SrvfMemberships"
});

const {
  canRead,
  loading,
  statusFilter,
  statusOptions,
  typeFilter,
  typeOptions,
  keyword,
  columns,
  dataList,
  pagination,
  typeLabel,
  onSearch,
  onFilterChange,
  goMember,
  goConflicts,
  handleSizeChange,
  handleCurrentChange
} = useMembershipList();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <SrvfListPage
    :can-read="canRead"
    title="归属总表（跨队员跨组织）"
    intro="跨队员查看全部部门归属记录；给某位队员调整归属，请在其档案的「组织归属」页操作。"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看归属"
    empty-code="membership.list.record"
    @refresh="onSearch"
    @page-size-change="handleSizeChange"
    @page-current-change="handleCurrentChange"
  >
    <template #buttons>
      <el-input
        v-model="keyword"
        class="w-48! mr-2!"
        placeholder="搜队员/组织（回车）"
        clearable
        @keyup.enter="onFilterChange"
        @clear="onFilterChange"
      />
      <el-select
        v-model="typeFilter"
        class="w-32! mr-2!"
        placeholder="归属类型"
        @change="onFilterChange"
      >
        <el-option
          v-for="opt in typeOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-select
        v-model="statusFilter"
        class="w-36! mr-2!"
        placeholder="归属状态"
        @change="onFilterChange"
      >
        <el-option
          v-for="opt in statusOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-button type="warning" plain @click="goConflicts">
        归属体检
      </el-button>
    </template>
    <template #membershipType="{ row }">
      <el-tag :type="row.membershipType === 'PRIMARY' ? 'primary' : 'info'">
        {{ typeLabel(row.membershipType) }}
      </el-tag>
    </template>
    <template #status="{ row }">
      <SrvfStatusTag
        :value="row.status"
        :label-dict="MEMBERSHIP_STATUS_LABEL"
        :tag-dict="MEMBERSHIP_STATUS_TAG"
      />
    </template>
    <template #operation="{ row, size }">
      <el-button class="reset-margin" link :size="size" @click="goMember(row)">
        队员档案
      </el-button>
    </template>
  </SrvfListPage>
</template>
