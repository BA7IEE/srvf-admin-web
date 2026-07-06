<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";
import { MEMBERSHIP_TYPE_LABEL } from "@/api/srvf-membership";

export type AddMemberOption = { label: string; value: string };

/** 组织侧"添加成员"弹窗表单模型（对齐 CreateMembershipDto，见 @/api/srvf-membership）。 */
export type AddMemberFormModel = {
  memberId: string;
  membershipType: string;
  reason: string;
};

const props = withDefaults(
  defineProps<{
    formInline?: AddMemberFormModel;
    /** 组织轴队员下拉（getOrgScopedMemberOptions 投影） */
    memberOptions?: AddMemberOption[];
  }>(),
  {
    formInline: () => ({
      memberId: "",
      membershipType: "PRIMARY",
      reason: ""
    }),
    memberOptions: () => []
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const membershipTypeOptions = Object.entries(MEMBERSHIP_TYPE_LABEL).map(
  ([value, label]) => ({ value, label: `${label} (${value})` })
);

const rules: FormRules = {
  memberId: [{ required: true, message: "请选择队员", trigger: "change" }],
  membershipType: [
    { required: true, message: "请选择归属类型", trigger: "change" }
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
    label-width="88px"
  >
    <re-col>
      <el-form-item label="队员" prop="memberId">
        <el-select
          v-model="newFormInline.memberId"
          class="w-full!"
          clearable
          filterable
          placeholder="选择要加入的队员"
        >
          <el-option
            v-for="opt in memberOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
    </re-col>
    <re-col>
      <el-form-item label="归属类型" prop="membershipType">
        <el-select v-model="newFormInline.membershipType" class="w-full!">
          <el-option
            v-for="opt in membershipTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
    </re-col>
    <re-col>
      <el-form-item label="原因">
        <el-input
          v-model="newFormInline.reason"
          type="textarea"
          :rows="2"
          maxlength="200"
          placeholder="可空；说明编入原因"
        />
      </el-form-item>
    </re-col>
  </el-form>
</template>
