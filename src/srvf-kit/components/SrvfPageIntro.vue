<script setup lang="ts">
defineOptions({
  name: "SrvfPageIntro"
});

withDefaults(
  defineProps<{
    /** 主文案 */
    title: string;
    /** 次要说明（对应 el-alert 原生 description；需要富文本/列表等结构化内容时改用默认插槽） */
    description?: string;
    /** 语义色，默认 info（概念/流程说明场景的通用色） */
    type?: "info" | "success" | "warning" | "error";
    /** 是否可关闭，默认 false（现有页面均不可关闭） */
    closable?: boolean;
  }>(),
  {
    description: undefined,
    type: "info",
    closable: false
  }
);
</script>

<template>
  <el-alert
    :type="type"
    :closable="closable"
    :title="title"
    :description="description"
    show-icon
  >
    <slot />
  </el-alert>
</template>
