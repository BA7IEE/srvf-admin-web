<script setup lang="ts">
import { ref } from "vue";

/** 微信订阅模板配置表单(按通知类型 upsert)。typeLabel/code 仅展示,不可改。 */
export type WechatTemplateFormModel = {
  notificationTypeCode: string;
  typeLabel: string;
  templateId: string;
  enabled: boolean;
  remarks: string;
};

const props = withDefaults(
  defineProps<{ formInline?: WechatTemplateFormModel }>(),
  {
    formInline: () => ({
      notificationTypeCode: "",
      typeLabel: "",
      templateId: "",
      enabled: false,
      remarks: ""
    })
  }
);
const model = ref(props.formInline);
const formRef = ref();

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="model" label-width="100px">
    <el-form-item label="通知类型">
      <el-input
        :model-value="model.typeLabel || model.notificationTypeCode"
        disabled
      />
    </el-form-item>
    <el-form-item label="模板 ID">
      <el-input
        v-model="model.templateId"
        placeholder="小程序后台审批后的订阅消息模板 ID(留空 = 该类型不可发微信)"
        clearable
      />
    </el-form-item>
    <el-form-item label="启用">
      <el-switch v-model="model.enabled" />
    </el-form-item>
    <el-form-item label="备注">
      <el-input
        v-model="model.remarks"
        type="textarea"
        :rows="2"
        maxlength="200"
      />
    </el-form-item>
  </el-form>
</template>
