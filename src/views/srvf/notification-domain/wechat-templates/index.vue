<script setup lang="ts">
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useWechatTemplates } from "./utils/hook";

defineOptions({
  name: "SrvfNotificationWechatTemplates"
});

const { canRead, canUpdate, loading, columns, dataList, onSearch, openDialog } =
  useWechatTemplates();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <template v-if="canRead">
      <PureTableBar
        title="微信订阅模板配置"
        :columns="columns"
        @refresh="onSearch"
      >
        <template #buttons>
          <span class="text-xs text-gray-400">
            各通知类型 → 小程序订阅消息模板 ID + 启用态;留空模板 ID =
            该类型不可发微信。
          </span>
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            row-key="notificationTypeCode"
            adaptive
            :adaptiveConfig="{ offsetBottom: 108 }"
            align-whole="center"
            table-layout="auto"
            :loading="loading"
            :size="size"
            :data="dataList"
            :columns="dynamicColumns"
            :header-cell-style="{
              background: 'var(--el-fill-color-light)',
              color: 'var(--el-text-color-primary)'
            }"
          >
            <template #enabled="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'">
                {{ row.enabled ? "启用" : "停用" }}
              </el-tag>
            </template>
            <template #operation="{ row }">
              <el-button
                v-if="canUpdate"
                class="reset-margin"
                link
                type="primary"
                :size="size"
                @click="openDialog(row)"
              >
                配置
              </el-button>
              <span v-else class="text-xs text-gray-400">只读</span>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </template>
    <SrvfPermEmpty
      v-else
      action="查看微信模板配置"
      code="notification.read.record"
    />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
