<script setup lang="ts">
import { ref } from "vue";

/** 附件尺寸限制配置表单。typeConfigId 仅创建时可选(更新禁改,只 maxSizeBytes/remark)。 */
export type SizeFormModel = {
  isEdit: boolean;
  typeConfigId: string;
  maxSizeBytes: number | undefined;
  remark: string;
};
type Option = { label: string; value: string };

const props = withDefaults(
  defineProps<{ formInline?: SizeFormModel; typeOptions?: Option[] }>(),
  {
    formInline: () => ({
      isEdit: false,
      typeConfigId: "",
      maxSizeBytes: undefined,
      remark: ""
    }),
    typeOptions: () => []
  }
);
const model = ref(props.formInline);
const formRef = ref();

const rules = {
  typeConfigId: [{ required: true, message: "请选择类型", trigger: "change" }],
  maxSizeBytes: [
    { required: true, message: "请填写大小上限(字节)", trigger: "blur" }
  ]
};

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="100px">
    <el-form-item label="类型" prop="typeConfigId">
      <el-select
        v-model="model.typeConfigId"
        :disabled="model.isEdit"
        filterable
        placeholder="所属附件类型(1:1)"
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
    <el-form-item label="大小上限" prop="maxSizeBytes">
      <el-input-number
        v-model="model.maxSizeBytes"
        :min="0"
        placeholder="字节"
      />
    </el-form-item>
    <el-form-item label="备注">
      <el-input v-model="model.remark" maxlength="200" />
    </el-form-item>
  </el-form>
</template>
