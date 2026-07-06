<script setup lang="ts">
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
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
  statusMeta,
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
  <div class="main">
    <PureTableBar
      v-if="canRead"
      title="会籍总表（跨队员跨组织）"
      :columns="columns"
      @refresh="onSearch"
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
          <template #membershipType="{ row }">
            <el-tag
              :type="row.membershipType === 'PRIMARY' ? 'primary' : 'info'"
            >
              {{ typeLabel(row.membershipType) }}
            </el-tag>
          </template>
          <template #status="{ row }">
            <el-tag :type="statusMeta(row.status).type">
              {{ statusMeta(row.status).text }}
            </el-tag>
          </template>
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              type="primary"
              :size="size"
              @click="goMember(row)"
            >
              队员档案
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
    <SrvfPermEmpty v-else action="查看会籍" code="membership.list.record" />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
