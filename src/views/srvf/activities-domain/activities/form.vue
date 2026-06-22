<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";

/** 下拉选项（字典 / 组织共用；为空数组 = 退化为文本输入） */
export type ActivityOption = { label: string; value: string };

/**
 * 活动弹窗表单模型（字段对齐后端 Create/Update DTO，见 @/api/srvf-activity）。
 * 仅含本轮范围内的「必填 + 简单可选」字段；复杂字段
 * （registrationSchema / content / 图集 / 封面 / 经纬度）本轮不做。
 */
export type ActivityFormModel = {
  isEdit: boolean;
  title: string;
  /** 活动类型字典 code（typeCode=activity_type） */
  activityTypeCode: string;
  /** 承办组织节点 id（不允许根节点） */
  organizationId: string;
  /** 开始时间（ISO 8601） */
  startAt: string;
  /** 结束时间（ISO 8601；须晚于 startAt） */
  endAt: string;
  location: string;
  description: string;
  /** 名额上限（undefined = 不限名额；≥ 1） */
  capacity: number | undefined;
  /** 性别限制字典 code（typeCode=gender_requirement；可空） */
  genderRequirementCode: string;
  /** 报名截止时间（ISO 8601；可空） */
  registrationDeadline: string;
  registrationNotes: string;
  isPublicRegistration: boolean;
  requiresInsurance: boolean;
};

const props = withDefaults(
  defineProps<{
    formInline?: ActivityFormModel;
    /** 活动类型字典下拉（type=activity_type；空 = 退化文本输入） */
    activityTypeOptions?: ActivityOption[];
    /** 性别限制字典下拉（type=gender_requirement；空 = 退化文本输入） */
    genderRequirementOptions?: ActivityOption[];
    /** 组织下拉（org.read.node；空 = 退化文本输入） */
    organizationOptions?: ActivityOption[];
  }>(),
  {
    formInline: () => ({
      isEdit: false,
      title: "",
      activityTypeCode: "",
      organizationId: "",
      startAt: "",
      endAt: "",
      location: "",
      description: "",
      capacity: undefined,
      genderRequirementCode: "",
      registrationDeadline: "",
      registrationNotes: "",
      isPublicRegistration: true,
      requiresInsurance: false
    }),
    activityTypeOptions: () => [],
    genderRequirementOptions: () => [],
    organizationOptions: () => []
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const rules: FormRules = {
  title: [{ required: true, message: "请输入活动标题", trigger: "blur" }],
  activityTypeCode: [
    { required: true, message: "请选择 / 输入活动类型", trigger: "change" }
  ],
  organizationId: [
    { required: true, message: "请选择 / 输入承办组织", trigger: "change" }
  ],
  startAt: [{ required: true, message: "请选择开始时间", trigger: "change" }],
  endAt: [{ required: true, message: "请选择结束时间", trigger: "change" }],
  location: [{ required: true, message: "请输入活动地点", trigger: "blur" }]
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
        <el-form-item label="活动标题" prop="title">
          <el-input
            v-model="newFormInline.title"
            clearable
            maxlength="200"
            placeholder="活动标题（必填；≤ 200）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="活动类型" prop="activityTypeCode">
          <el-select
            v-if="activityTypeOptions.length"
            v-model="newFormInline.activityTypeCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择活动类型（activity_type 字典）"
          >
            <el-option
              v-for="opt in activityTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.activityTypeCode"
            clearable
            maxlength="64"
            placeholder="活动类型字典 code（type=activity_type）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="承办组织" prop="organizationId">
          <el-select
            v-if="organizationOptions.length"
            v-model="newFormInline.organizationId"
            class="w-full!"
            clearable
            filterable
            placeholder="选择承办组织（不可选根节点）"
          >
            <el-option
              v-for="opt in organizationOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.organizationId"
            clearable
            maxlength="64"
            placeholder="承办组织节点 id（不允许根节点）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="开始时间" prop="startAt">
          <el-date-picker
            v-model="newFormInline.startAt"
            class="w-full!"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            placeholder="选择开始时间"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="结束时间" prop="endAt">
          <el-date-picker
            v-model="newFormInline.endAt"
            class="w-full!"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            placeholder="选择结束时间（须晚于开始时间）"
          />
        </el-form-item>
      </re-col>

      <re-col>
        <el-form-item label="活动地点" prop="location">
          <el-input
            v-model="newFormInline.location"
            clearable
            maxlength="200"
            placeholder="活动地点（必填；≤ 200）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="名额上限">
          <el-input-number
            v-model="newFormInline.capacity"
            class="w-full!"
            :min="1"
            controls-position="right"
            placeholder="留空 = 不限名额"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="性别限制">
          <el-select
            v-if="genderRequirementOptions.length"
            v-model="newFormInline.genderRequirementCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择性别限制（可空；gender_requirement 字典）"
          >
            <el-option
              v-for="opt in genderRequirementOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.genderRequirementCode"
            clearable
            maxlength="64"
            placeholder="性别限制字典 code（可空；type=gender_requirement）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="报名截止">
          <el-date-picker
            v-model="newFormInline.registrationDeadline"
            class="w-full!"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            placeholder="选择报名截止时间（可空）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="公开报名">
          <el-switch
            v-model="newFormInline.isPublicRegistration"
            inline-prompt
            active-text="公开"
            inactive-text="非公开"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="要求保险">
          <el-switch
            v-model="newFormInline.requiresInsurance"
            inline-prompt
            active-text="要求"
            inactive-text="不要求"
          />
        </el-form-item>
      </re-col>

      <re-col>
        <el-form-item label="短说明">
          <el-input
            v-model="newFormInline.description"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit
            placeholder="活动短说明（可空；≤ 500）"
          />
        </el-form-item>
      </re-col>

      <re-col>
        <el-form-item label="报名说明">
          <el-input
            v-model="newFormInline.registrationNotes"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit
            placeholder="报名补充说明（可空；≤ 500）"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
