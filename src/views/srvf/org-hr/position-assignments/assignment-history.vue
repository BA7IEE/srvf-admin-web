<script setup lang="ts">
import dayjs from "dayjs";
import {
  ASSIGNMENT_STATUS_LABEL,
  ASSIGNMENT_STATUS_TAG,
  type PositionAssignmentItem
} from "@/api/srvf-position-assignment";

/**
 * 任职历史链只读展示（父级已 loading 拉完数据传入;此组件不发请求）。
 * 以 :id 锚定的人-组织-职务三元组全量历史,含所有 ACTIVE/ENDED/REVOKED 记录。
 * 与 base-data/organizations/assignment-history.vue 同形——按仓内约定,跨域小展示组件各域自持一份,不跨目录共享。
 */
const props = withDefaults(
  defineProps<{
    items?: PositionAssignmentItem[];
    loading?: boolean;
  }>(),
  { items: () => [], loading: false }
);

function fmt(v: string | null) {
  return v ? dayjs(v).format("YYYY-MM-DD") : "—";
}
</script>

<template>
  <div v-loading="props.loading">
    <el-empty
      v-if="!props.loading && !props.items.length"
      description="暂无历史记录"
    />
    <el-timeline v-else>
      <el-timeline-item
        v-for="item in props.items"
        :key="item.id"
        :type="ASSIGNMENT_STATUS_TAG[item.status]"
        :timestamp="`${fmt(item.startedAt)} ~ ${fmt(item.endedAt)}`"
      >
        <div class="history-row">
          <el-tag :type="ASSIGNMENT_STATUS_TAG[item.status]" size="small">
            {{ ASSIGNMENT_STATUS_LABEL[item.status] ?? item.status }}
          </el-tag>
          <span v-if="item.isConcurrent" class="history-tag">兼任</span>
          <span v-if="item.note" class="history-note">{{ item.note }}</span>
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<style scoped lang="scss">
.history-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.history-tag {
  font-size: 12px;
  color: var(--el-color-warning);
}

.history-note {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
