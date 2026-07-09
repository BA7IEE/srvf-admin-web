<script setup lang="ts">
import { computed } from "vue";
import { toLabel } from "@/api/srvf-labels";

defineOptions({
  name: "SrvfStatusTag"
});

type TagType = "success" | "info" | "warning" | "danger" | "primary";

const props = defineProps<{
  /** 状态值（如 row.status），未命中字典时原样展示 */
  value?: string | null;
  /** 状态 → 中文字典（如 MEMBERSHIP_STATUS_LABEL） */
  labelDict: Record<string, string>;
  /** 状态 → el-tag type 字典（如 MEMBERSHIP_STATUS_TAG），未命中回退 info */
  tagDict: Record<string, TagType>;
}>();

const tagType = computed<TagType>(() => {
  if (props.value == null) return "info";
  return props.tagDict[props.value] ?? "info";
});
</script>

<template>
  <el-tag :type="tagType">{{ toLabel(labelDict, value) }}</el-tag>
</template>
