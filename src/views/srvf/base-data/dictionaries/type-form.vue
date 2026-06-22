<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";

/** 字典类型弹窗表单模型（对齐后端 Create/UpdateDictTypeDto） */
export type DictTypeFormModel = {
  /** true=编辑：code 后端禁改，置灰只读 */
  isEdit: boolean;
  code: string;
  label: string;
  sortOrder: number;
};

const props = withDefaults(defineProps<{ formInline?: DictTypeFormModel }>(), {
  formInline: () => ({
    isEdit: false,
    code: "",
    label: "",
    sortOrder: 0
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const rules: FormRules = {
  code: [
    { required: true, message: "请输入类型 code", trigger: "blur" },
    {
      pattern: /^[a-z][a-z0-9_]*$/,
      message: "小写字母 / 数字 / 下划线，且字母开头",
      trigger: "blur"
    }
  ],
  label: [{ required: true, message: "请输入显示名", trigger: "blur" }]
};

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="rules"
    label-width="82px"
  >
    <el-row :gutter="30">
      <re-col>
        <el-form-item label="类型 code" prop="code">
          <el-input
            v-model="newFormInline.code"
            :disabled="newFormInline.isEdit"
            clearable
            placeholder="全局唯一，如 activity_type"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="显示名" prop="label">
          <el-input
            v-model="newFormInline.label"
            clearable
            placeholder="请输入显示名"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="排序">
          <el-input-number
            v-model="newFormInline.sortOrder"
            :min="0"
            class="w-full!"
            controls-position="right"
            placeholder="排序权重（默认 0）"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
