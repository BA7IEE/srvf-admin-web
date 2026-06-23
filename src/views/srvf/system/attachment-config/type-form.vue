<script setup lang="ts">
import { ref } from "vue";

/** 附件类型配置表单。code 仅创建时可填(更新禁改)。 */
export type TypeFormModel = {
  isEdit: boolean;
  code: string;
  displayName: string;
  description: string;
  ownerTable: string;
  defaultMaxSizeBytes: number | undefined;
  defaultMimeWhitelist: string[];
};

const props = withDefaults(defineProps<{ formInline?: TypeFormModel }>(), {
  formInline: () => ({
    isEdit: false,
    code: "",
    displayName: "",
    description: "",
    ownerTable: "",
    defaultMaxSizeBytes: undefined,
    defaultMimeWhitelist: []
  })
});
const model = ref(props.formInline);
const formRef = ref();

const rules = {
  code: [
    { required: true, message: "请填写 code(kebab-case)", trigger: "blur" }
  ],
  displayName: [{ required: true, message: "请填写显示名", trigger: "blur" }],
  ownerTable: [{ required: true, message: "请填写归属表", trigger: "blur" }]
};

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="120px">
    <el-form-item v-if="!model.isEdit" label="Code" prop="code">
      <el-input v-model="model.code" placeholder="kebab-case,3-32" />
    </el-form-item>
    <el-form-item label="显示名" prop="displayName">
      <el-input v-model="model.displayName" maxlength="100" />
    </el-form-item>
    <el-form-item label="归属表" prop="ownerTable">
      <el-input
        v-model="model.ownerTable"
        placeholder="如 members / contents"
      />
    </el-form-item>
    <el-form-item label="默认大小上限">
      <el-input-number
        v-model="model.defaultMaxSizeBytes"
        :min="0"
        placeholder="字节"
      />
    </el-form-item>
    <el-form-item label="默认 MIME 白名单">
      <el-select
        v-model="model.defaultMimeWhitelist"
        multiple
        filterable
        allow-create
        default-first-option
        placeholder="如 image/png,输入后回车"
        class="w-full!"
      />
    </el-form-item>
    <el-form-item label="描述">
      <el-input v-model="model.description" type="textarea" :rows="2" />
    </el-form-item>
  </el-form>
</template>
