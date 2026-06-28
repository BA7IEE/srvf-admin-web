<script setup lang="ts">
import { ref } from "vue";

/** 队保单表单。起保/到期为日期(后端校验 起保≤到期,否则 26010)。 */
export type PolicyFormModel = {
  isEdit: boolean;
  insurerName: string;
  policyNumber: string;
  coverageStart: string;
  coverageEnd: string;
  note: string;
};

const props = withDefaults(defineProps<{ formInline?: PolicyFormModel }>(), {
  formInline: () => ({
    isEdit: false,
    insurerName: "",
    policyNumber: "",
    coverageStart: "",
    coverageEnd: "",
    note: ""
  })
});
const model = ref(props.formInline);
const formRef = ref();

const rules = {
  insurerName: [{ required: true, message: "请填写保险公司", trigger: "blur" }],
  policyNumber: [{ required: true, message: "请填写保单号", trigger: "blur" }],
  coverageStart: [
    { required: true, message: "请选择起保日", trigger: "change" }
  ],
  coverageEnd: [{ required: true, message: "请选择到期日", trigger: "change" }]
};

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="84px">
    <el-form-item label="保险公司" prop="insurerName">
      <el-input v-model="model.insurerName" maxlength="100" />
    </el-form-item>
    <el-form-item label="保单号" prop="policyNumber">
      <el-input v-model="model.policyNumber" maxlength="100" />
    </el-form-item>
    <el-form-item label="起保日" prop="coverageStart">
      <el-date-picker
        v-model="model.coverageStart"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="起保日"
        class="w-full!"
      />
    </el-form-item>
    <el-form-item label="到期日" prop="coverageEnd">
      <el-date-picker
        v-model="model.coverageEnd"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="到期日"
        class="w-full!"
      />
    </el-form-item>
    <el-form-item label="备注">
      <el-input
        v-model="model.note"
        type="textarea"
        :rows="2"
        maxlength="500"
      />
    </el-form-item>
  </el-form>
</template>
