<script setup lang="ts">
import { ref, computed } from "vue";
import { GATE_CODES, GATE_LABEL } from "@/api/srvf-team-join";

/** 标 gate 表单（gateCode + 结果 + 完成日；dept-assessment 可填延长期）。 */
export type GateFormModel = {
  gateCode: string;
  passed: boolean;
  completionDate: string;
  extendedUntil: string;
};

const props = withDefaults(defineProps<{ formInline?: GateFormModel }>(), {
  formInline: () => ({
    gateCode: "",
    passed: true,
    completionDate: "",
    extendedUntil: ""
  })
});
const model = ref(props.formInline);
const formRef = ref();

const isDeptAssessment = computed(
  () => model.value.gateCode === "dept-assessment"
);

const rules = {
  gateCode: [{ required: true, message: "请选择考核项", trigger: "change" }],
  completionDate: [
    { required: true, message: "请选择完成日", trigger: "change" }
  ]
};

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="96px">
    <el-form-item label="考核项" prop="gateCode">
      <el-select
        v-model="model.gateCode"
        placeholder="选择 gate"
        class="w-full!"
      >
        <el-option
          v-for="c in GATE_CODES"
          :key="c"
          :label="GATE_LABEL[c]"
          :value="c"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="结果">
      <el-radio-group v-model="model.passed">
        <el-radio :value="true">通过</el-radio>
        <el-radio :value="false">未通过</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="完成日" prop="completionDate">
      <el-date-picker
        v-model="model.completionDate"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="北京日历日"
        class="w-full!"
      />
    </el-form-item>
    <el-form-item v-if="isDeptAssessment" label="延长期至">
      <el-date-picker
        v-model="model.extendedUntil"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="部门考核可延长综合评估有效期(可空)"
        class="w-full!"
      />
    </el-form-item>
  </el-form>
</template>
