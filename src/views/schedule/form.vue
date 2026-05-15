<script setup lang="ts">
import { ref } from "vue";
import { formRules } from "./utils/rule";
import { FormProps } from "./utils/types";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    scheduling: "",
    classes: "morning",
    startDate: "",
    endDate: "",
    remark: ""
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="82px"
  >
    <el-form-item label="排班内容" prop="scheduling">
      <el-input
        v-model="newFormInline.scheduling"
        clearable
        placeholder="请输入排班内容"
      />
    </el-form-item>

    <el-form-item label="排班班次">
      <el-radio-group v-model="newFormInline.classes">
        <el-radio :value="'morning'">早班</el-radio>
        <el-radio :value="'noon'">中班</el-radio>
        <el-radio :value="'evening'">晚班</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="开始日期" prop="startDate">
      <el-date-picker
        v-model="newFormInline.startDate"
        placeholder="请选择开始日期"
        value-format="YYYY-MM-DD"
        class="w-full!"
      />
    </el-form-item>

    <el-form-item label="结束日期" prop="endDate">
      <el-date-picker
        v-model="newFormInline.endDate"
        placeholder="请选择结束日期"
        value-format="YYYY-MM-DD"
        class="w-full!"
      />
    </el-form-item>

    <el-form-item label="备注">
      <el-input
        v-model="newFormInline.remark"
        placeholder="请输入备注信息"
        type="textarea"
      />
    </el-form-item>
  </el-form>
</template>
