<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

/** 等级下拉选项（来自 type=member_grade 字典；为空数组 = 退化为文本输入） */
export type MemberGradeOption = { label: string; value: string };

/** 弹窗表单模型（字段对齐后端 Create/Update DTO，见 @/api/srvf-member） */
export type MemberFormModel = {
  /** true=编辑：memberNo 后端禁改，置灰只读 */
  isEdit: boolean;
  memberNo: string;
  displayName: string;
  realName: string;
  nickname: string;
  memberSinceDate: string;
  memberOriginCode: string;
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
      realName: "",
      nickname: "",
      memberSinceDate: "",
      memberOriginCode: "",
      gradeCode: ""
    }),
    gradeOptions: () => []
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);
const dict = useSrvfDictStoreHook();

const rules: FormRules = {
  memberNo: [
    { required: true, message: "请输入队员编号", trigger: "blur" },
    ...(newFormInline.value.isEdit
      ? []
      : [
          {
            pattern: /^[A-Za-z0-9-]{1,32}$/,
            message: "队员编号只允许字母、数字和连字符",
            trigger: "blur"
          }
        ])
  ],
  realName: [
    { required: true, whitespace: true, message: "请输入姓名", trigger: "blur" }
  ],
  memberSinceDate: [
    { required: true, message: "请选择发号日", trigger: "change" }
  ],
  memberOriginCode: [
    {
      required: true,
      whitespace: true,
      message: "请填写来源",
      trigger: ["change", "blur"]
    }
  ],
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
        <el-form-item
          v-if="newFormInline.isEdit"
          label="称呼"
          prop="displayName"
        >
          <el-input
            v-model="newFormInline.displayName"
            clearable
            maxlength="100"
            placeholder="称呼 / 显示名"
          />
        </el-form-item>
        <el-form-item v-else label="姓名" prop="realName">
          <el-input v-model="newFormInline.realName" maxlength="64" />
        </el-form-item>
      </re-col>
      <re-col v-if="!newFormInline.isEdit">
        <el-form-item label="队内称呼" prop="nickname">
          <el-input
            v-model="newFormInline.nickname"
            clearable
            maxlength="64"
            placeholder="可选"
          />
        </el-form-item>
        <el-form-item label="发号日" prop="memberSinceDate">
          <el-date-picker
            v-model="newFormInline.memberSinceDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择发号日"
          />
        </el-form-item>
        <el-form-item label="来源" prop="memberOriginCode">
          <el-select
            v-if="dict.options('join_source').length"
            v-model="newFormInline.memberOriginCode"
            placeholder="选择来源"
          >
            <el-option
              v-for="option in dict.options('join_source')"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.memberOriginCode"
            maxlength="64"
            placeholder="来源字典码（join_source）"
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
