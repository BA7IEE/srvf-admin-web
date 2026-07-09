<script setup lang="ts">
// 迁往 @/srvf-kit（P1-0）：真实实现见 src/srvf-kit/components/SrvfPermEmpty.vue，
// 本文件仅作旧路径转发，避免一次性改 34 处 import。新代码请从 @/srvf-kit 引入。
import SrvfPermEmptyImpl from "@/srvf-kit/components/SrvfPermEmpty.vue";

defineOptions({
  name: "SrvfPermEmpty"
});

withDefaults(
  defineProps<{
    action: string;
    code?: string;
  }>(),
  { code: "" }
);
</script>

<template>
  <SrvfPermEmptyImpl v-bind="$props" />
</template>
