<script setup lang="ts">
import { ref } from "vue";
import type { UserOptionItem } from "@/api/srvf-user";

/** 绑定既有账号表单（单选账号 id）。model 即注入的 formInline，父 beforeSure 直接读 formInline.userId。 */
export type AccountBindFormModel = { userId: string };

const props = withDefaults(
  defineProps<{
    formInline?: AccountBindFormModel;
    userOptions?: UserOptionItem[];
  }>(),
  {
    formInline: () => ({ userId: "" }),
    userOptions: () => []
  }
);
const model = ref(props.formInline);
</script>

<template>
  <el-select
    v-model="model.userId"
    filterable
    clearable
    placeholder="选择要绑定的账号（须为未绑定队员的悬空账号，已绑定他人会被后端拒绝）"
    class="w-full"
  >
    <el-option
      v-for="opt in props.userOptions"
      :key="opt.id"
      :label="
        opt.label === opt.username
          ? opt.label
          : `${opt.label}（${opt.username}）`
      "
      :value="opt.id"
    />
  </el-select>
</template>
