<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";
import { memberFieldError, type MemberFormModel } from "./member-form-state";

export type { MemberFormModel } from "./member-form-state";

/** 等级下拉选项（来自 type=member_grade 字典；为空数组 = 退化为文本输入） */
export type MemberGradeOption = { label: string; value: string };

const props = withDefaults(
  defineProps<{
    formInline?: MemberFormModel;
    gradeOptions?: MemberGradeOption[];
    originOptions?: MemberGradeOption[];
  }>(),
  {
    formInline: () => ({
      isEdit: false,
      isSaving: false,
      memberNo: "",
      realName: "",
      nickname: "",
      memberSinceDate: "",
      memberOriginCode: "",
      gradeCode: ""
    }),
    gradeOptions: () => [],
    originOptions: () => []
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const validateField =
  (field: Parameters<typeof memberFieldError>[0]) =>
  (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    const error = memberFieldError(field, value ?? "");
    callback(error ? new Error(error) : undefined);
  };
const rules: FormRules = {
  memberNo: [
    { required: true, validator: validateField("memberNo"), trigger: "blur" }
  ],
  realName: [
    { required: true, validator: validateField("realName"), trigger: "blur" }
  ],
  nickname: [{ validator: validateField("nickname"), trigger: "blur" }],
  memberSinceDate: [
    {
      required: true,
      validator: validateField("memberSinceDate"),
      trigger: "change"
    }
  ],
  memberOriginCode: [
    {
      required: true,
      validator: validateField("memberOriginCode"),
      trigger: "blur"
    }
  ],
  gradeCode: [{ validator: validateField("gradeCode"), trigger: "blur" }]
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
    :disabled="newFormInline.isSaving"
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
        <el-form-item label="真实姓名" prop="realName">
          <el-input
            v-model="newFormInline.realName"
            clearable
            maxlength="64"
            placeholder="请输入真实姓名"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="newFormInline.nickname"
            clearable
            maxlength="64"
            placeholder="选填；队内称呼"
          />
        </el-form-item>
      </re-col>
      <re-col v-if="!newFormInline.isEdit">
        <el-form-item label="发号日" prop="memberSinceDate">
          <el-date-picker
            v-model="newFormInline.memberSinceDate"
            class="w-full!"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择该编号的发号日"
          />
        </el-form-item>
      </re-col>
      <re-col v-if="!newFormInline.isEdit">
        <el-form-item label="来源" prop="memberOriginCode">
          <el-select
            v-if="originOptions.length"
            v-model="newFormInline.memberOriginCode"
            class="w-full!"
            filterable
            allow-create
            default-first-option
            clearable
            placeholder="选择或输入实际来源代码"
          >
            <el-option
              v-for="opt in originOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.memberOriginCode"
            clearable
            maxlength="64"
            placeholder="输入实际来源代码（join_source）"
          />
          <p class="text-sm text-gray-500">
            来源可从字典选择，也可填写实际来源代码。
          </p>
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="等级" prop="gradeCode">
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
