<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import QuestionLine from "~icons/ri/question-line";

defineOptions({
  name: "SrvfFormLabelTip"
});

/**
 * 表单字段级提示（UX 升级蓝图 §4.7 帮助体系）：label 旁挂问号,hover 出一句
 * 「这是什么/怎么填」。用在 el-form-item 的 #label 插槽;文案守文案军规——
 * 说用途不说实现,不出现后端字段名。
 */
defineProps<{
  label: string;
  tip: string;
}>();
</script>

<template>
  <span class="label-tip">
    {{ label }}
    <el-tooltip :content="tip" placement="top" :show-after="150">
      <IconifyIconOffline :icon="QuestionLine" class="label-tip__icon" />
    </el-tooltip>
  </span>
</template>

<style scoped lang="scss">
.label-tip {
  display: inline-flex;
  gap: 2px;
  align-items: center;
}

.label-tip__icon {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  cursor: help;

  &:hover {
    color: var(--el-text-color-secondary);
  }
}
</style>
