<script setup lang="ts">
import { ref } from "vue";

/** 附件 MIME 配置表单(仅创建;更新只 remark,不在此表单)。 */
export type MimeFormModel = {
  typeConfigId: string;
  mime: string;
  remark: string;
};
type Option = { label: string; value: string };

const props = withDefaults(
  defineProps<{ formInline?: MimeFormModel; typeOptions?: Option[] }>(),
  {
    formInline: () => ({ typeConfigId: "", mime: "", remark: "" }),
    typeOptions: () => []
  }
);
const model = ref(props.formInline);
const formRef = ref();

const rules = {
  typeConfigId: [{ required: true, message: "请选择类型", trigger: "change" }],
  mime: [
    { required: true, message: "请填写 MIME(如 image/png)", trigger: "blur" }
  ]
};

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="90px">
    <el-form-item label="类型" prop="typeConfigId">
      <el-select
        v-model="model.typeConfigId"
        filterable
        placeholder="所属附件类型"
        class="w-full!"
      >
        <el-option
          v-for="o in typeOptions"
          :key="o.value"
          :label="o.label"
          :value="o.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="MIME" prop="mime">
      <el-input v-model="model.mime" placeholder="如 image/png" />
    </el-form-item>
    <el-form-item label="备注">
      <el-input v-model="model.remark" maxlength="200" />
    </el-form-item>
  </el-form>
</template>
