<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";

/** 等级下拉选项（来自 type=member_grade 字典；为空数组 = 退化为文本输入） */
export type MemberGradeOption = { label: string; value: string };

/** 弹窗表单模型（字段对齐后端 Create/Update DTO，见 @/api/srvf-member） */
export type MemberFormModel = {
  /** true=编辑：memberNo 后端禁改，置灰只读 */
  isEdit: boolean;
  memberNo: string;
  displayName: string;
  /** 等级字典 code（type=member_grade；可空） */
  gradeCode: string;
};

const props = withDefaults(
  defineProps<{
    formInline?: MemberFormModel;
    gradeOptions?: MemberGradeOption[];
  }>(),
  {
    formInline: () => ({
      isEdit: false,
      memberNo: "",
      displayName: "",
      gradeCode: ""
    }),
    gradeOptions: () => []
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const rules: FormRules = {
  memberNo: [{ required: true, message: "请输入队员编号", trigger: "blur" }],
  displayName: [
    { required: true, message: "请输入称呼 / 显示名", trigger: "blur" }
  ]
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
    label-width="92px"
  >
    <el-row :gutter="30">
      <re-col>
        <el-form-item label="队员编号" prop="memberNo">
          <el-input
            v-model="newFormInline.memberNo"
            :disabled="newFormInline.isEdit"
            clearable
            maxlength="32"
            placeholder="字母 / 数字 / 连字符；1-32 位（编辑时不可改）"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="称呼" prop="displayName">
          <el-input
            v-model="newFormInline.displayName"
            clearable
            maxlength="100"
            placeholder="称呼 / 显示名"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="等级">
          <el-select
            v-if="gradeOptions.length"
            v-model="newFormInline.gradeCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择等级（可空；来自 member_grade 字典）"
          >
            <el-option
              v-for="opt in gradeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.gradeCode"
            clearable
            maxlength="64"
            placeholder="等级字典 code（type=member_grade；可空）"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
