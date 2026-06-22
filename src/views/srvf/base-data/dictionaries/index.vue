<script setup lang="ts">
import { onMounted } from "vue";
import { useDictTypes } from "./utils/hook";
import { deviceDetection } from "@pureadmin/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SrvfDictionaries"
});

const {
  canRead,
  canReadItem,
  canCreateType,
  canUpdateType,
  canDeleteType,
  canCreateItem,
  canUpdateItem,
  canDeleteItem,
  loading,
  columns,
  dataList,
  pagination,
  selectedType,
  rowStyle,
  onSearch,
  selectType,
  openTypeDialog,
  handleDeleteType,
  handleToggleTypeStatus,
  handleSizeChange,
  handleCurrentChange,
  itemLoading,
  itemColumns,
  itemList,
  itemPagination,
  onSearchItems,
  openItemDialog,
  handleDeleteItem,
  handleToggleItemStatus,
  handleItemSizeChange,
  handleItemCurrentChange
} = useDictTypes();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div v-if="canRead" :class="['flex', deviceDetection() && 'flex-wrap']">
    <!-- 左：字典类型 -->
    <div :class="['mr-2', deviceDetection() ? 'w-full' : 'w-110']">
      <PureTableBar title="字典类型" :columns="columns" @refresh="onSearch">
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
            :row-style="rowStyle"
            :header-cell-style="{
              background: 'var(--el-fill-color-light)',
              color: 'var(--el-text-color-primary)'
            }"
            @row-click="selectType"
            @page-size-change="handleSizeChange"
            @page-current-change="handleCurrentChange"
          >
            <template #status="{ row }">
              <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                {{ row.status === "ACTIVE" ? "启用" : "停用" }}
              </el-tag>
            </template>
            <template #operation="{ row }">
              <el-button
                v-if="canUpdateType"
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(EditPen)"
                @click.stop="openTypeDialog('编辑', row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="canUpdateType"
                class="reset-margin"
                link
                :type="row.status === 'ACTIVE' ? 'warning' : 'success'"
                :size="size"
                @click.stop="handleToggleTypeStatus(row)"
              >
                {{ row.status === "ACTIVE" ? "停用" : "启用" }}
              </el-button>
              <el-button
                v-if="canDeleteType"
                class="reset-margin"
                link
                type="danger"
                :size="size"
                :icon="useRenderIcon(Delete)"
                @click.stop="handleDeleteType(row)"
              >
                删除
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>

    <!-- 右：字典条目（选中类型后展示） -->
    <div :class="[deviceDetection() ? 'w-full' : 'flex-1']">
      <PureTableBar
        :title="selectedType ? `字典条目 · ${selectedType.label}` : '字典条目'"
        :columns="itemColumns"
        @refresh="onSearchItems"
      >
        <template #buttons>
          <el-button
            v-if="canCreateItem"
            type="primary"
            :disabled="!selectedType"
            :icon="useRenderIcon(AddFill)"
            @click="openItemDialog('新建')"
          >
            新建条目
          </el-button>
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <el-empty
            v-if="!canReadItem"
            description="您没有查看字典条目的权限（dict.read.item）"
          />
          <el-empty
            v-else-if="!selectedType"
            description="请选择左侧字典类型以查看条目"
          />
          <pure-table
            v-else
            row-key="id"
            adaptive
            :adaptiveConfig="{ offsetBottom: 108 }"
            align-whole="center"
            table-layout="auto"
            :loading="itemLoading"
            :size="size"
            :data="itemList"
            :columns="dynamicColumns"
            :pagination="itemPagination"
            :paginationSmall="size === 'small' ? true : false"
            :header-cell-style="{
              background: 'var(--el-fill-color-light)',
              color: 'var(--el-text-color-primary)'
            }"
            @page-size-change="handleItemSizeChange"
            @page-current-change="handleItemCurrentChange"
          >
            <template #itemStatus="{ row }">
              <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                {{ row.status === "ACTIVE" ? "启用" : "停用" }}
              </el-tag>
            </template>
            <template #itemOperation="{ row }">
              <el-button
                v-if="canUpdateItem"
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(EditPen)"
                @click="openItemDialog('编辑', row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="canUpdateItem"
                class="reset-margin"
                link
                :type="row.status === 'ACTIVE' ? 'warning' : 'success'"
                :size="size"
                @click="handleToggleItemStatus(row)"
              >
                {{ row.status === "ACTIVE" ? "停用" : "启用" }}
              </el-button>
              <el-button
                v-if="canDeleteItem"
                class="reset-margin"
                link
                type="danger"
                :size="size"
                :icon="useRenderIcon(Delete)"
                @click="handleDeleteItem(row)"
              >
                删除
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>
  </div>
  <div v-else class="main">
    <el-empty description="您没有查看字典的权限（dict.read.type）" />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
