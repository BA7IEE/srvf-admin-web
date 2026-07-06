<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";

export type TransferOption = { label: string; value: string };

/**
 * 归属迁移弹窗表单模型（对齐 TransferMembershipDto，见 @/api/srvf-membership）。
 * memberId/fromOrganizationId/membershipType 由触发行决定，只读展示不可改；
 * 只需选 toOrganizationId + 填 reason。
 */
export type TransferFormModel = {
  fromOrganizationLabel: string;
  membershipTypeLabel: string;
  toOrganizationId: string;
  reason: string;
};

const props = withDefaults(
  defineProps<{
    formInline?: TransferFormModel;
    /** 组织下拉（getOrgOptions 投影；已排除当前源组织） */
    orgOptions?: TransferOption[];
  }>(),
  {
    formInline: () => ({
      fromOrganizationLabel: "",
      membershipTypeLabel: "",
      toOrganizationId: "",
      reason: ""
    }),
    orgOptions: () => []
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const rules: FormRules = {
  toOrganizationId: [
    { required: true, message: "请选择迁移目标组织", trigger: "change" }
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
    label-width="96px"
  >
    <el-row :gutter="30">
      <re-col :value="12">
        <el-form-item label="源组织">
          <el-input
            :model-value="newFormInline.fromOrganizationLabel"
            disabled
          />
        </el-form-item>
      </re-col>
      <re-col :value="12">
        <el-form-item label="归属类型">
          <el-input :model-value="newFormInline.membershipTypeLabel" disabled />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="目标组织" prop="toOrganizationId">
          <el-select
            v-model="newFormInline.toOrganizationId"
            class="w-full!"
            clearable
            filterable
            placeholder="选择迁移目标组织"
          >
            <el-option
              v-for="opt in orgOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="迁移原因">
          <el-input
            v-model="newFormInline.reason"
            type="textarea"
            :rows="2"
            maxlength="200"
            placeholder="可空；说明迁移原因"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
