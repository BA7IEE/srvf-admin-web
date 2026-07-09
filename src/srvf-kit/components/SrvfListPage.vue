<script setup lang="ts" generic="T extends Record<string, any>">
import { useSlots, computed } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { PureTableBar } from "@/components/RePureTableBar";
import SrvfPermEmpty from "./SrvfPermEmpty.vue";
import SrvfPageIntro from "./SrvfPageIntro.vue";

defineOptions({
  name: "SrvfListPage"
});

withDefaults(
  defineProps<{
    /** 读权限门；false 时渲染权限空态（emptyAction/emptyCode），不渲染表格 */
    canRead: boolean;
    /** PureTableBar 标题（列设置面板抬头，同时也是表格上方大标题） */
    title: string;
    /** 列定义：供 PureTableBar 列设置面板 + 表格实际渲染共用 */
    columns: TableColumnList;
    loading: boolean;
    dataList: T[];
    pagination: PaginationProps;
    rowKey?: string;
    /** 权限空态：被拦下的动作，如「查看队员」 */
    emptyAction: string;
    /** 权限空态：相关 RBAC 码（备查） */
    emptyCode?: string;
    /** 页头一句话说明（有值且有读权限时渲染 SrvfPageIntro） */
    intro?: string;
  }>(),
  { rowKey: "id", emptyCode: "", intro: "" }
);

defineEmits<{
  (e: "refresh"): void;
  (e: "page-size-change", val: number): void;
  (e: "page-current-change", val: number): void;
  (e: "selection-change", rows: T[]): void;
}>();

/** 除 buttons（工具栏，走 PureTableBar 自己的 #buttons）外，其余具名插槽原样转发给 pure-table（各页自定义列渲染） */
const slots = useSlots();
const columnSlotNames = computed(() =>
  Object.keys(slots).filter(name => name !== "buttons")
);
</script>

<template>
  <div class="main">
    <SrvfPageIntro v-if="intro && canRead" class="mb-2" :title="intro" />
    <PureTableBar
      v-if="canRead"
      :title="title"
      :columns="columns"
      @refresh="$emit('refresh')"
    >
      <template #buttons>
        <slot name="buttons" />
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          :row-key="rowKey"
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
          @page-size-change="$emit('page-size-change', $event)"
          @page-current-change="$emit('page-current-change', $event)"
          @selection-change="$emit('selection-change', $event)"
        >
          <template
            v-for="name in columnSlotNames"
            :key="name"
            #[name]="slotProps"
          >
            <slot :name="name" v-bind="{ ...(slotProps ?? {}), size }" />
          </template>
        </pure-table>
      </template>
    </PureTableBar>
    <SrvfPermEmpty v-else :action="emptyAction" :code="emptyCode" />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
