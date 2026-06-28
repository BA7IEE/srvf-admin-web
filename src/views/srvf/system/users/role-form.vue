<script setup lang="ts">
import { ref } from "vue";
import type { AccountRole } from "@/api/srvf-user";

/** 改角色表单(单选)。model 即注入的 formInline 对象,父 beforeSure 直接读 formInline.role。 */
export type RoleFormModel = { role: AccountRole };

const props = withDefaults(defineProps<{ formInline?: RoleFormModel }>(), {
  formInline: () => ({ role: "USER" })
});
const model = ref(props.formInline);
</script>

<template>
  <el-radio-group v-model="model.role">
    <el-radio value="SUPER_ADMIN">超级管理员</el-radio>
    <el-radio value="ADMIN">管理员</el-radio>
    <el-radio value="USER">普通用户</el-radio>
  </el-radio-group>
</template>
