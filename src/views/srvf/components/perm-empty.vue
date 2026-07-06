<script setup lang="ts">
defineOptions({
  name: "SrvfPermEmpty"
});

/**
 * 权限空态（区别于「暂无数据」空态）：人话主文案 + 联系管理员指引，
 * RBAC 码弱化为小字备查（给管理员排查用，不再当主文案直出）。
 */
withDefaults(
  defineProps<{
    /** 被拦下的动作描述，如「查看队员」→ 渲染为「您没有查看队员的权限」 */
    action: string;
    /** 相关 RBAC 码（原样展示备查；可含多个，如 "a.b.c / .d"） */
    code?: string;
  }>(),
  { code: "" }
);
</script>

<template>
  <el-empty :image-size="80">
    <template #description>
      <p class="perm-empty-main">您没有{{ action }}的权限</p>
      <p class="perm-empty-sub">如需使用此功能，请联系管理员开通</p>
      <p v-if="code" class="perm-empty-code">权限标识：{{ code }}</p>
    </template>
  </el-empty>
</template>

<style scoped lang="scss">
.perm-empty-main {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.perm-empty-sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.perm-empty-code {
  margin-top: 8px;
  font-family: var(--el-font-family-mono, monospace);
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}
</style>
