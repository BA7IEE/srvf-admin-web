<script setup lang="ts">
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { SrvfStatusTag } from "@/srvf-kit";
import { SMS_STATUS_LABEL, SMS_STATUS_TAG } from "@/api/srvf-labels";
import { useSmsLogs } from "./utils/hook";

import Search from "~icons/ri/search-line";

defineOptions({
  name: "SrvfSmsLogs"
});

const {
  canRead,
  loading,
  phone,
  columns,
  dataList,
  pagination,
  onSearch,
  onFilterChange,
  handleSizeChange,
  handleCurrentChange
} = useSmsLogs();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <template v-if="canRead">
      <PureTableBar title="短信日志" :columns="columns" @refresh="onSearch">
        <template #buttons>
          <el-input
            v-model="phone"
            class="w-52!"
            placeholder="按手机号精确查"
            clearable
            :prefix-icon="useRenderIcon(Search)"
            @keyup.enter="onFilterChange"
            @clear="onFilterChange"
          />
          <el-button type="primary" @click="onFilterChange">查询</el-button>
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
            <template #status="{ row }">
              <SrvfStatusTag
                :value="row.status"
                :label-dict="SMS_STATUS_LABEL"
                :tag-dict="SMS_STATUS_TAG"
              />
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </template>
    <SrvfPermEmpty v-else action="查看短信日志" code="sms-send-log.read.list" />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
