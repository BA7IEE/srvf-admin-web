<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ArrowLeftLine from "~icons/ri/arrow-left-line";

defineOptions({
  name: "SrvfDetailShell"
});

withDefaults(
  defineProps<{
    /** 头部卡片 loading 态（对应实体详情请求中） */
    loading: boolean;
    /** 实体是否已加载到；false 时渲染 notFoundText 空态，不渲染 title/actions/overview 插槽 */
    found: boolean;
    /** 未找到 / 无权查看时的空态文案，如「未找到该活动或无权查看」 */
    notFoundText: string;
    /** 返回按钮文案，如「返回活动列表」 */
    backText: string;
    /** 头部标题行/操作按钮行是否允许换行（操作按钮较多的页面传 true） */
    wrap?: boolean;
  }>(),
  { wrap: false }
);

const emit = defineEmits<{
  (e: "back"): void;
}>();
</script>

<template>
  <div>
    <el-card v-loading="loading" shadow="never" class="mb-2">
      <el-button
        link
        class="mb-2!"
        :icon="useRenderIcon(ArrowLeftLine)"
        @click="emit('back')"
      >
        {{ backText }}
      </el-button>
      <template v-if="found">
        <div class="cockpit-header" :class="{ 'is-wrap': wrap }">
          <div class="cockpit-header__title">
            <slot name="title" />
          </div>
          <div v-if="$slots.actions" class="cockpit-header__actions">
            <slot name="actions" />
          </div>
        </div>
        <slot name="overview" />
      </template>
      <el-empty v-else-if="!loading" :description="notFoundText" />
    </el-card>
    <slot />
  </div>
</template>

<style scoped lang="scss">
.cockpit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  &.is-wrap {
    flex-wrap: wrap;
    gap: 12px;
  }

  &__title {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &.is-wrap &__actions {
    flex-wrap: wrap;
  }
}
</style>
