<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";
import type { ContributionRuleStatus } from "@/api/srvf-contribution-rule";

/** 弹窗表单模型（字段对齐后端 Create/Update DTO，见 @/api/srvf-contribution-rule） */
export type ContributionRuleFormModel = {
  /** true=编辑：activityTypeCode / attendanceRoleCode / durationThreshold 后端禁改，置灰只读 */
  isEdit: boolean;
  activityTypeCode: string;
  attendanceRoleCode: string;
  durationThreshold: number | null;
  pointsBelow: number | null;
  pointsAbove: number | null;
  dailyCap: number | null;
  status: ContributionRuleStatus;
  remark: string;
};

const props = withDefaults(
  defineProps<{ formInline?: ContributionRuleFormModel }>(),
  {
    formInline: () => ({
      isEdit: false,
      activityTypeCode: "",
      attendanceRoleCode: "",
      durationThreshold: null,
      pointsBelow: 0,
      pointsAbove: null,
      dailyCap: null,
      status: "ACTIVE",
      remark: ""
    })
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const rules: FormRules = {
  activityTypeCode: [
    { required: true, message: "请输入活动类型字典 code", trigger: "blur" }
  ],
  attendanceRoleCode: [
    { required: true, message: "请输入考勤角色字典 code", trigger: "blur" }
  ],
  pointsBelow: [{ required: true, message: "请输入阈下分值", trigger: "blur" }]
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
        <el-form-item label="活动类型" prop="activityTypeCode">
          <el-input
            v-model="newFormInline.activityTypeCode"
            :disabled="newFormInline.isEdit"
            clearable
            placeholder="活动类型字典 code（type=activity_type）"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="考勤角色" prop="attendanceRoleCode">
          <el-input
            v-model="newFormInline.attendanceRoleCode"
            :disabled="newFormInline.isEdit"
            clearable
            placeholder="考勤角色字典 code（type=attendance_role）"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="时长阈值">
          <el-input-number
            v-model="newFormInline.durationThreshold"
            :disabled="newFormInline.isEdit"
            :min="0"
            :precision="2"
            :value-on-clear="null"
            class="w-full!"
            controls-position="right"
            placeholder="小时；留空 = 无档位"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="阈下分" prop="pointsBelow">
          <el-input-number
            v-model="newFormInline.pointsBelow"
            :min="0"
            :precision="2"
            :value-on-clear="0"
            class="w-full!"
            controls-position="right"
            placeholder="≤ 阈值（或无档位）的预填分值"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="阈上分">
          <el-input-number
            v-model="newFormInline.pointsAbove"
            :min="0"
            :precision="2"
            :value-on-clear="null"
            class="w-full!"
            controls-position="right"
            placeholder="留空 = 无；非空需 > 阈下分 且 有时长阈值"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="每日上限">
          <el-input-number
            v-model="newFormInline.dailyCap"
            :min="0"
            :precision="2"
            :value-on-clear="null"
            class="w-full!"
            controls-position="right"
            placeholder="留空 = 无（预填兜底 1.5）"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="状态">
          <el-switch
            v-model="newFormInline.status"
            inline-prompt
            active-value="ACTIVE"
            inactive-value="INACTIVE"
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="备注">
          <el-input
            v-model="newFormInline.remark"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="运营备注（可空）"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
