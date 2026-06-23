<script setup lang="ts">
import { ref } from "vue";

/** 入队轮表单。create:year/name；edit:name(year 只读,UpdateTeamJoinCycleDto 不含 year)。 */
export type TjCycleFormModel = {
  isEdit: boolean;
  year: number | undefined;
  name: string;
};

const props = withDefaults(defineProps<{ formInline?: TjCycleFormModel }>(), {
  formInline: () => ({ isEdit: false, year: undefined, name: "" })
});
const model = ref(props.formInline);
const formRef = ref();

const rules = {
  year: [{ required: true, message: "请填写年度", trigger: "blur" }],
  name: [{ required: true, message: "请填写轮次名称", trigger: "blur" }]
};

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="90px">
    <el-form-item v-if="model.isEdit" label="年度">
      <span>{{ model.year }}</span>
    </el-form-item>
    <el-form-item v-else label="年度" prop="year">
      <el-input-number v-model="model.year" :min="2000" :max="2100" />
    </el-form-item>
    <el-form-item label="轮次名称" prop="name">
      <el-input
        v-model="model.name"
        maxlength="100"
        placeholder="如:2026 年入队考核"
      />
    </el-form-item>
  </el-form>
</template>
