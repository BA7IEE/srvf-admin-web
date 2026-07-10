<script setup lang="ts">
import { SrvfPermEmpty } from "@/srvf-kit";
import { onMounted } from "vue";
import { useDictTypes } from "./utils/hook";
import { deviceDetection } from "@pureadmin/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import More from "~icons/ep/more-filled";
import Search from "~icons/ri/search-line";
import AddFill from "~icons/ri/add-circle-line";
import type { DictItemTreeNode } from "@/api/srvf-dict";

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
  typeLoading,
  typeKeyword,
  filteredTypeList,
  selectedType,
  fetchTypes,
  selectType,
  openTypeDialog,
  handleDeleteType,
  handleToggleTypeStatus,
  itemLoading,
  itemColumns,
  itemTree,
  fetchItems,
  openItemDialog,
  handleDeleteItem,
  handleToggleItemStatus
} = useDictTypes();

onMounted(() => {
  fetchTypes();
});

/** 有子级的行按"分组行"加粗+浅底，让层级一眼可辨（与叶子行区分，不看缩进也能分清） */
function itemRowClassName({ row }: { row: DictItemTreeNode }) {
  return row.children?.length ? "is-dict-item-parent" : "";
}
</script>

<template>
  <div v-if="canRead" :class="['flex', deviceDetection() && 'flex-wrap']">
    <!-- 左：字典类型导航（列表 + 搜索 + 滚动，不分页） -->
    <!-- shrink-0：固定宽度，避免右侧树表变宽时把左侧挤压回旧问题 -->
    <div
      :class="[
        'mr-2',
        'mt-2',
        'shrink-0',
        deviceDetection() ? 'w-full' : 'w-110'
      ]"
    >
      <el-card shadow="never" :body-style="{ padding: 0 }">
        <template #header>
          <div class="flex-bc">
            <span class="font-bold">字典类型</span>
            <el-button
              v-if="canCreateType"
              type="primary"
              size="small"
              :icon="useRenderIcon(AddFill)"
              @click="openTypeDialog('新建')"
            >
              新建类型
            </el-button>
          </div>
        </template>

        <div class="px-3 pt-3 pb-2">
          <el-input
            v-model="typeKeyword"
            clearable
            placeholder="搜索类型名称 / code"
            :prefix-icon="useRenderIcon(Search)"
          />
        </div>

        <el-scrollbar
          v-loading="typeLoading"
          height="calc(100vh - 280px)"
          class="dict-type-scroll"
        >
          <div
            v-for="item in filteredTypeList"
            :key="item.id"
            :class="[
              'dict-type-item',
              selectedType?.id === item.id ? 'is-selected' : ''
            ]"
            @click="selectType(item)"
          >
            <div class="dict-type-item__main">
              <div class="dict-type-item__label">{{ item.label }}</div>
              <div class="dict-type-item__code">{{ item.code }}</div>
            </div>
            <div class="dict-type-item__actions" @click.stop>
              <el-tag
                :type="item.status === 'ACTIVE' ? 'success' : 'info'"
                size="small"
              >
                {{ item.status === "ACTIVE" ? "启用" : "停用" }}
              </el-tag>
              <el-dropdown
                v-if="canUpdateType || canDeleteType"
                trigger="click"
              >
                <el-button link :icon="useRenderIcon(More)" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="canUpdateType">
                      <el-button
                        class="reset-margin!"
                        link
                        :icon="useRenderIcon(EditPen)"
                        @click="openTypeDialog('编辑', item)"
                      >
                        编辑
                      </el-button>
                    </el-dropdown-item>
                    <el-dropdown-item v-if="canUpdateType">
                      <el-button
                        class="reset-margin!"
                        link
                        :type="item.status === 'ACTIVE' ? 'warning' : 'success'"
                        @click="handleToggleTypeStatus(item)"
                      >
                        {{ item.status === "ACTIVE" ? "停用" : "启用" }}
                      </el-button>
                    </el-dropdown-item>
                    <el-dropdown-item v-if="canDeleteType" divided>
                      <el-button
                        class="reset-margin!"
                        link
                        type="danger"
                        :icon="useRenderIcon(Delete)"
                        @click="handleDeleteType(item)"
                      >
                        删除
                      </el-button>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <el-empty
            v-if="!filteredTypeList.length"
            :description="typeKeyword ? '未找到匹配的字典类型' : '暂无字典类型'"
            :image-size="64"
          />
        </el-scrollbar>
      </el-card>
    </div>

    <!-- 右：字典条目（树形表格，随左侧选中类型切换） -->
    <div :class="[deviceDetection() ? 'w-full' : 'flex-1']">
      <PureTableBar
        :title="
          selectedType
            ? `字典条目 · ${selectedType.label} ${selectedType.code}`
            : '字典条目'
        "
        :columns="itemColumns"
        @refresh="fetchItems"
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
          <SrvfPermEmpty
            v-if="!canReadItem"
            action="查看字典条目"
            code="dict.read.item"
          />
          <el-empty
            v-else-if="!selectedType"
            description="请选择左侧字典类型以查看条目"
          />
          <pure-table
            v-else
            row-key="id"
            adaptive
            default-expand-all
            show-overflow-tooltip
            :indent="24"
            :row-class-name="itemRowClassName"
            :adaptiveConfig="{ offsetBottom: 108 }"
            align-whole="center"
            table-layout="auto"
            :loading="itemLoading"
            :size="size"
            :data="itemTree"
            :columns="dynamicColumns"
            :header-cell-style="{
              background: 'var(--el-fill-color-light)',
              color: 'var(--el-text-color-primary)'
            }"
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
              <el-dropdown v-if="canDeleteItem" trigger="click">
                <el-button
                  class="ml-3! mt-0.5!"
                  link
                  :size="size"
                  :icon="useRenderIcon(More)"
                />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item>
                      <el-button
                        class="reset-margin!"
                        link
                        type="danger"
                        :size="size"
                        :icon="useRenderIcon(Delete)"
                        @click="handleDeleteItem(row)"
                      >
                        删除
                      </el-button>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>
  </div>
  <div v-else class="main">
    <SrvfPermEmpty action="查看字典" code="dict.read.type" />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}

.dict-type-scroll {
  padding-bottom: 8px;
}

.dict-type-item {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &.is-selected {
    background-color: var(--el-color-primary-light-9);

    .dict-type-item__label {
      font-weight: 600;
      color: var(--el-color-primary);
    }
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__label {
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
    white-space: nowrap;
  }

  &__code {
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    flex-shrink: 0;
    gap: 6px;
    align-items: center;
  }
}

// 树表分组行（有子级）加粗+浅底，跟叶子行拉开视觉层级，不必只靠缩进辨认
:deep(.is-dict-item-parent) {
  font-weight: 600;
  background-color: var(--el-fill-color-light);

  td {
    background-color: var(--el-fill-color-light);
  }
}
</style>
