<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";
import { MEMBERSHIP_TYPE_LABEL } from "@/api/srvf-membership";

export type MembershipOption = { label: string; value: string };

/**
 * 归属弹窗表单模型（字段对齐 Create/UpdateMembershipDto，见 @/api/srvf-membership）。
 * create：organizationId + membershipType + reason；
 * edit：organizationId 只读展示（不在 UpdateMembershipDto 里，不可改），
 *       membershipType / startedAt / endedAt / reason 可改（不改 status，另有专用「结束」操作）。
 */
export type MembershipFormModel = {
  isEdit: boolean;
  organizationId: string;
  organizationLabel: string;
  membershipType: string;
  startedAt: string;
  endedAt: string;
  reason: string;
};

const props = withDefaults(
  defineProps<{
    formInline?: MembershipFormModel;
    /** 组织下拉（getOrgOptions 投影；create 时用于选目标组织） */
    orgOptions?: MembershipOption[];
  }>(),
  {
    formInline: () => ({
      isEdit: false,
      organizationId: "",
      organizationLabel: "",
      membershipType: "PRIMARY",
      startedAt: "",
      endedAt: "",
      reason: ""
    }),
    orgOptions: () => []
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const membershipTypeOptions = Object.entries(MEMBERSHIP_TYPE_LABEL).map(
  ([value, label]) => ({ value, label })
);

const rules: FormRules = {
  organizationId: [
    { required: true, message: "请选择目标组织", trigger: "change" }
  ],
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
    <el-row :gutter="30">
      <re-col>
        <el-form-item label="组织" prop="organizationId">
          <el-input
            v-if="newFormInline.isEdit"
            :model-value="newFormInline.organizationLabel"
            disabled
          />
          <el-select
            v-else
            v-model="newFormInline.organizationId"
            class="w-full!"
            clearable
            filterable
            placeholder="选择目标组织"
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

      <re-col :value="12">
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

      <template v-if="newFormInline.isEdit">
        <re-col :value="12">
          <el-form-item label="任期起">
            <el-date-picker
              v-model="newFormInline.startedAt"
              class="w-full!"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss"
              placeholder="不改则留空"
            />
          </el-form-item>
        </re-col>
        <re-col :value="12">
          <el-form-item label="任期止">
            <el-date-picker
              v-model="newFormInline.endedAt"
              class="w-full!"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss"
              placeholder="不改则留空"
            />
          </el-form-item>
        </re-col>
      </template>

      <re-col>
        <el-form-item label="原因">
          <el-input
            v-model="newFormInline.reason"
            type="textarea"
            :rows="2"
            maxlength="200"
            placeholder="可空；说明编入/调整原因"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
