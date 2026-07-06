<script setup lang="ts">
import { ref } from "vue";
import type { FormRules } from "element-plus";

export type PermissionFormModel = {
  code: string;
  module: string;
  action: string;
  resourceType: string;
  description: string;
};

const props = withDefaults(
  defineProps<{
    formInline?: PermissionFormModel;
    isEdit?: boolean;
  }>(),
  {
    formInline: () => ({
      code: "",
      module: "",
      action: "",
      resourceType: "",
      description: ""
    }),
    isEdit: false
  }
);

const form = props.formInline;
const formRef = ref();

const rules: FormRules = {
  code: [
    { required: true, message: "请输入权限点 code", trigger: "blur" },
    {
      pattern: /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*){2,3}$/,
      message: "格式：<module>.<action>.<resourceType>[.<scope>]，3-4 段点分隔",
      trigger: "blur"
    }
  ],
  module: [{ required: true, message: "请输入模块名", trigger: "blur" }],
  action: [{ required: true, message: "请输入动作", trigger: "blur" }],
  resourceType: [{ required: true, message: "请输入资源类型", trigger: "blur" }]
};

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
    <el-form-item label="权限点 code" prop="code">
      <el-input
        v-model="form.code"
        clearable
        placeholder="如 attachment.upload.cert.self（创建后不可修改）"
        :disabled="props.isEdit"
      />
    </el-form-item>
    <el-form-item label="模块" prop="module">
      <el-input
        v-model="form.module"
        clearable
        placeholder="如 attachment"
        :disabled="props.isEdit"
      />
    </el-form-item>
    <el-form-item label="动作" prop="action">
      <el-input
        v-model="form.action"
        clearable
        placeholder="如 upload"
        :disabled="props.isEdit"
      />
    </el-form-item>
    <el-form-item label="资源类型" prop="resourceType">
      <el-input
        v-model="form.resourceType"
        clearable
        placeholder="如 cert"
        :disabled="props.isEdit"
      />
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="3"
        placeholder="可空；说明该权限点的用途"
      />
    </el-form-item>
  </el-form>
</template>
