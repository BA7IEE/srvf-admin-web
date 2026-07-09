<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";
import { SrvfRemoteSelect } from "@/srvf-kit";

/** 队员下拉选项（value = Member.id；空数组 = 无读权限，选择器禁用） */
export type MemberOption = { label: string; value: string };

/**
 * 代报名弹窗表单模型（对齐后端 `CreateRegistrationDto`，见 @/api/srvf-registration）。
 * 本轮仅 `memberId`（必填）；`extras`（扩展 Json）本轮不做,不放进表单也不提交。
 */
export type RegistrationFormModel = {
  /** 目标队员 Member.id（必填；8–64） */
  memberId: string;
};

const props = withDefaults(
  defineProps<{
    formInline?: RegistrationFormModel;
    /** 队员下拉（数据源 getMembers；空 = 退化为文本输入 id） */
    memberOptions?: MemberOption[];
  }>(),
  {
    formInline: () => ({ memberId: "" }),
    memberOptions: () => []
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const rules: FormRules = {
  memberId: [
    { required: true, message: "请选择 / 输入代报名队员", trigger: "change" }
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
        <el-form-item label="代报名队员" prop="memberId">
          <SrvfRemoteSelect
            v-model="newFormInline.memberId"
            :options="memberOptions"
            placeholder="选择队员（按显示名 / 编号检索）"
            empty-hint="队员选项不可用（需队员读取权限），请联系管理员"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
