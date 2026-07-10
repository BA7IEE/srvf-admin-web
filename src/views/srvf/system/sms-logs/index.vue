<script setup lang="ts">
import { onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { SrvfListPage, SrvfStatusTag } from "@/srvf-kit";
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
  <SrvfListPage
    :can-read="canRead"
    title="短信日志"
    intro="短信发送记录：核对某手机号是否收到短信、排查发送失败原因。"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看短信日志"
    empty-code="sms-send-log.read.list"
    @refresh="onSearch"
    @page-size-change="handleSizeChange"
    @page-current-change="handleCurrentChange"
  >
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
    <template #status="{ row }">
      <SrvfStatusTag
        :value="row.status"
        :label-dict="SMS_STATUS_LABEL"
        :tag-dict="SMS_STATUS_TAG"
      />
    </template>
  </SrvfListPage>
</template>
