<script setup lang="ts">
import { ref } from "vue";
import type { FormRules } from "element-plus";

export type RoleFormModel = {
  code: string;
  displayName: string;
  description: string;
};

const props = withDefaults(
  defineProps<{
    formInline?: RoleFormModel;
    isEdit?: boolean;
  }>(),
  {
    formInline: () => ({ code: "", displayName: "", description: "" }),
    isEdit: false
  }
);

const form = props.formInline;
const formRef = ref();

const rules: FormRules = {
  code: [
    { required: true, message: "请输入角色 code", trigger: "blur" },
    {
      pattern: /^[a-z][a-z0-9-]{2,31}$/,
      message: "kebab 格式：小写字母开头，3-32 位小写字母/数字/连字符",
      trigger: "blur"
    }
  ],
  displayName: [
    { required: true, message: "请输入角色显示名", trigger: "blur" },
    { max: 50, message: "最长 50 字", trigger: "blur" }
  ]
};

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
    <el-form-item label="角色 code" prop="code">
      <el-input
        v-model="form.code"
        clearable
        placeholder="如 apd-chief（创建后不可修改）"
        :disabled="props.isEdit"
      />
    </el-form-item>
    <el-form-item label="显示名" prop="displayName">
      <el-input
        v-model="form.displayName"
        clearable
        placeholder="如 部门部长"
      />
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="3"
        placeholder="可空；说明该角色的用途"
      />
    </el-form-item>
  </el-form>
</template>
