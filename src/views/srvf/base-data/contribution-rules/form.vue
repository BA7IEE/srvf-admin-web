<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";
import type { ContributionRuleStatus } from "@/api/srvf-contribution-rule";
import FormLabelTip from "@/views/srvf/components/form-label-tip.vue";

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
  pointsBelow: [
    { required: true, message: "请输入门槛内得分", trigger: "blur" }
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
        <el-form-item prop="attendanceRoleCode">
          <template #label>
            <FormLabelTip
              label="考勤角色"
              tip="同一场活动里不同分工（如指挥、队员）可以按不同标准记分"
            />
          </template>
          <el-input
            v-model="newFormInline.attendanceRoleCode"
            :disabled="newFormInline.isEdit"
            clearable
            placeholder="考勤角色字典 code（type=attendance_role）"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item>
          <template #label>
            <FormLabelTip
              label="时长门槛(小时)"
              tip="服务时长的分界线：不超过它记「门槛内得分」，超过记「超出门槛得分」；留空表示不分档"
            />
          </template>
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
        <el-form-item prop="pointsBelow">
          <template #label>
            <FormLabelTip
              label="门槛内得分"
              tip="服务时长未超过门槛（或未设门槛）时记的分"
            />
          </template>
          <el-input-number
            v-model="newFormInline.pointsBelow"
            :min="0"
            :precision="2"
            :value-on-clear="0"
            class="w-full!"
            controls-position="right"
            placeholder="服务时长未超过门槛（或未设门槛）时记的分"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item>
          <template #label>
            <FormLabelTip
              label="超出门槛得分"
              tip="服务时长超过门槛时记的分；须大于门槛内得分"
            />
          </template>
          <el-input-number
            v-model="newFormInline.pointsAbove"
            :min="0"
            :precision="2"
            :value-on-clear="null"
            class="w-full!"
            controls-position="right"
            placeholder="留空 = 不设；填写时须大于门槛内得分，且已设时长门槛"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item>
          <template #label>
            <FormLabelTip
              label="每日上限"
              tip="同一人同一天最多累计的分数，超出部分不再累计"
            />
          </template>
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
