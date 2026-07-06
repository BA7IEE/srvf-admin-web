<script setup lang="ts">
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { onMounted, ref } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useAttachmentConfigs } from "./utils/hook";

import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SrvfAttachmentConfig"
});

const {
  canReadType,
  canCreateType,
  canUpdateType,
  canDeleteType,
  canReadMime,
  canCreateMime,
  canUpdateMime,
  canDeleteMime,
  canReadSize,
  canCreateSize,
  canUpdateSize,
  canDeleteSize,
  typeList,
  mimeList,
  sizeList,
  typeLoading,
  mimeLoading,
  sizeLoading,
  typePager,
  mimePager,
  sizePager,
  typeColumns,
  mimeColumns,
  sizeColumns,
  init,
  onSearchType,
  onSearchMime,
  onSearchSize,
  typeSizeChange,
  typeCurrentChange,
  mimeSizeChange,
  mimeCurrentChange,
  sizeSizeChange,
  sizeCurrentChange,
  openTypeDialog,
  handleTypeStatus,
  handleTypeDelete,
  openMimeDialog,
  handleMimeStatus,
  handleMimeDelete,
  openSizeDialog,
  handleSizeDelete
} = useAttachmentConfigs();

onMounted(() => {
  init();
});

const anyRead = canReadType || canReadMime || canReadSize;

/**
 * 显式锚定默认激活 tab：EP el-tabs 无 v-model/default-value 时 currentName 默认 "0"，
 * 与所有具名 tab-pane 都不匹配 → 首屏所有 pane 被 v-show 隐藏（只剩 tab 头），点一下才显示。
 * 这里初始化为第一个「有读权限」的 pane（pane 由 v-if=canRead* 决定渲染），保证首屏即落到一个可见 pane。
 */
const activeTab = ref(
  canReadType ? "type" : canReadMime ? "mime" : canReadSize ? "size" : ""
);
</script>

<template>
  <div class="main">
    <el-tabs v-if="anyRead" v-model="activeTab" class="ac-tabs">
      <!-- 类型配置 -->
      <el-tab-pane v-if="canReadType" label="类型配置" name="type">
        <PureTableBar
          title="附件类型配置"
          :columns="typeColumns"
          @refresh="onSearchType"
        >
          <template #buttons>
            <el-button
              v-if="canCreateType"
              type="primary"
              :icon="useRenderIcon(AddFill)"
              @click="openTypeDialog('新建')"
            >
              新建类型
            </el-button>
          </template>
          <template v-slot="{ size, dynamicColumns }">
            <pure-table
              row-key="id"
              align-whole="center"
              table-layout="auto"
              :loading="typeLoading"
              :size="size"
              :data="typeList"
              :columns="dynamicColumns"
              :pagination="typePager"
              @page-size-change="typeSizeChange"
              @page-current-change="typeCurrentChange"
            >
              <template #status="{ row }">
                <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                  {{ row.status === "ACTIVE" ? "启用" : "停用" }}
                </el-tag>
              </template>
              <template #operation="{ row }">
                <el-button
                  v-if="canUpdateType"
                  link
                  type="primary"
                  :size="size"
                  @click="openTypeDialog('编辑', row)"
                >
                  编辑
                </el-button>
                <el-button
                  v-if="canUpdateType"
                  link
                  :type="row.status === 'ACTIVE' ? 'warning' : 'success'"
                  :size="size"
                  @click="handleTypeStatus(row)"
                >
                  {{ row.status === "ACTIVE" ? "停用" : "启用" }}
                </el-button>
                <el-button
                  v-if="canDeleteType"
                  link
                  type="danger"
                  :size="size"
                  @click="handleTypeDelete(row)"
                >
                  删除
                </el-button>
              </template>
            </pure-table>
          </template>
        </PureTableBar>
      </el-tab-pane>

      <!-- MIME 配置 -->
      <el-tab-pane v-if="canReadMime" label="MIME 配置" name="mime">
        <PureTableBar
          title="附件 MIME 配置"
          :columns="mimeColumns"
          @refresh="onSearchMime"
        >
          <template #buttons>
            <el-button
              v-if="canCreateMime"
              type="primary"
              :icon="useRenderIcon(AddFill)"
              @click="openMimeDialog"
            >
              新建 MIME
            </el-button>
          </template>
          <template v-slot="{ size, dynamicColumns }">
            <pure-table
              row-key="id"
              align-whole="center"
              table-layout="auto"
              :loading="mimeLoading"
              :size="size"
              :data="mimeList"
              :columns="dynamicColumns"
              :pagination="mimePager"
              @page-size-change="mimeSizeChange"
              @page-current-change="mimeCurrentChange"
            >
              <template #status="{ row }">
                <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                  {{ row.status === "ACTIVE" ? "启用" : "停用" }}
                </el-tag>
              </template>
              <template #operation="{ row }">
                <el-button
                  v-if="canUpdateMime"
                  link
                  :type="row.status === 'ACTIVE' ? 'warning' : 'success'"
                  :size="size"
                  @click="handleMimeStatus(row)"
                >
                  {{ row.status === "ACTIVE" ? "停用" : "启用" }}
                </el-button>
                <el-button
                  v-if="canDeleteMime"
                  link
                  type="danger"
                  :size="size"
                  @click="handleMimeDelete(row)"
                >
                  删除
                </el-button>
              </template>
            </pure-table>
          </template>
        </PureTableBar>
      </el-tab-pane>

      <!-- 尺寸限制 -->
      <el-tab-pane v-if="canReadSize" label="尺寸限制" name="size">
        <PureTableBar
          title="附件尺寸限制配置"
          :columns="sizeColumns"
          @refresh="onSearchSize"
        >
          <template #buttons>
            <el-button
              v-if="canCreateSize"
              type="primary"
              :icon="useRenderIcon(AddFill)"
              @click="openSizeDialog('新建')"
            >
              新建限制
            </el-button>
          </template>
          <template v-slot="{ size, dynamicColumns }">
            <pure-table
              row-key="id"
              align-whole="center"
              table-layout="auto"
              :loading="sizeLoading"
              :size="size"
              :data="sizeList"
              :columns="dynamicColumns"
              :pagination="sizePager"
              @page-size-change="sizeSizeChange"
              @page-current-change="sizeCurrentChange"
            >
              <template #operation="{ row }">
                <el-button
                  v-if="canUpdateSize"
                  link
                  type="primary"
                  :size="size"
                  @click="openSizeDialog('编辑', row)"
                >
                  编辑
                </el-button>
                <el-button
                  v-if="canDeleteSize"
                  link
                  type="danger"
                  :size="size"
                  @click="handleSizeDelete(row)"
                >
                  删除
                </el-button>
              </template>
            </pure-table>
          </template>
        </PureTableBar>
      </el-tab-pane>
    </el-tabs>
    <SrvfPermEmpty v-else action="查看附件配置" />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
