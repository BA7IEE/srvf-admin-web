<script setup lang="ts">
import { ref, computed } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";

/** 下拉选项（字典 / 组织共用；为空数组 = 数据源不可用，选择器禁用） */
export type ActivityOption = { label: string; value: string };

/**
 * 活动弹窗表单模型（字段对齐后端 Create/Update DTO，见 @/api/srvf-activity）。
 * 仅含本轮范围内的「必填 + 简单可选」字段；复杂字段
 * （registrationSchema / content / 图集 / 封面 / 经纬度）本轮不做。
 */
export type ActivityFormModel = {
  isEdit: boolean;
  /** 编辑态的活动状态 code：completed / cancelled 时后端只收五个展示字段 */
  statusCode: string;
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
      statusCode: "",
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

/**
 * 终态锁：活动已完结 / 已取消时，后端只接受五个展示字段
 * （description / coverImageUrl / galleryImageUrls / content / registrationNotes）。
 * 本表单里属于这五个的只有「简介」和「报名须知」，其余一律禁用——
 * 不锁的话用户改完点保存会被后端整单拒掉，还不知道是哪一项惹的。
 */
const terminalLocked = computed(
  () =>
    newFormInline.value.isEdit &&
    (newFormInline.value.statusCode === "completed" ||
      newFormInline.value.statusCode === "cancelled")
);

/** 报名截止不得晚于活动结束（后端拒的规则，前端先说人话） */
const deadlineWarning = computed(() => {
  const m = newFormInline.value;
  if (!m.registrationDeadline || !m.endAt) return "";
  return m.registrationDeadline > m.endAt
    ? "报名截止时间晚于活动结束时间，后端会拒绝"
    : "";
});

const rules: FormRules = {
  title: [{ required: true, message: "请输入活动标题", trigger: "blur" }],
  activityTypeCode: [
    { required: true, message: "请选择 / 输入活动类型", trigger: "change" }
  ],
  organizationId: [
    { required: true, message: "请选择 / 输入承办组织", trigger: "change" }
  ],
  startAt: [{ required: true, message: "请选择开始时间", trigger: "change" }],
  endAt: [
    { required: true, message: "请选择结束时间", trigger: "change" },
    {
      validator: (_rule, value: string, callback) => {
        if (
          value &&
          newFormInline.value.startAt &&
          value <= newFormInline.value.startAt
        ) {
          callback(new Error("结束时间须晚于开始时间"));
          return;
        }
        callback();
      },
      trigger: "change"
    }
  ],
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
    <!-- 终态提示:说清还能改什么,免得用户挨个试哪个字段被拒 -->
    <el-alert
      v-if="terminalLocked"
      class="mb-4"
      type="info"
      :closable="false"
      show-icon
      title="活动已完结或已取消，基本不能再改"
    >
      <span class="text-xs/5">
        时间、地点、名额、报名设置等都已锁定。按契约还应放开「活动简介」与「报名须知」两项，
        但当前后端对终态活动一律拒绝修改——保存很可能仍会被拒；如确需更正请联系管理员。
      </span>
    </el-alert>

    <el-row :gutter="30">
      <re-col>
        <el-divider content-position="left" class="form-section">
          基本信息
        </el-divider>
      </re-col>
      <re-col>
        <el-form-item label="活动标题" prop="title">
          <el-input
            v-model="newFormInline.title"
            :disabled="terminalLocked"
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
            :disabled="terminalLocked"
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
            disabled
            placeholder="活动类型选项不可用（需字典读取权限），请联系管理员"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="承办组织" prop="organizationId">
          <el-select
            v-if="organizationOptions.length"
            v-model="newFormInline.organizationId"
            :disabled="terminalLocked"
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
            disabled
            placeholder="组织选项不可用（需组织读取权限），请联系管理员"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="开始时间" prop="startAt">
          <el-date-picker
            v-model="newFormInline.startAt"
            :disabled="terminalLocked"
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
            :disabled="terminalLocked"
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
            :disabled="terminalLocked"
            clearable
            maxlength="200"
            placeholder="活动地点（必填；≤ 200）"
          />
        </el-form-item>
      </re-col>

      <re-col>
        <el-divider content-position="left" class="form-section">
          报名设置
        </el-divider>
      </re-col>
      <re-col :value="12">
        <el-form-item label="名额上限">
          <el-input-number
            v-model="newFormInline.capacity"
            :disabled="terminalLocked"
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
            :disabled="terminalLocked"
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
            disabled
            placeholder="性别限制选项不可用（需字典读取权限）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="报名截止">
          <el-date-picker
            v-model="newFormInline.registrationDeadline"
            :disabled="terminalLocked"
            class="w-full!"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            placeholder="选择报名截止时间（可空）"
          />
          <div v-if="deadlineWarning" class="form-field-warn">
            {{ deadlineWarning }}
          </div>
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="公开报名">
          <el-switch
            v-model="newFormInline.isPublicRegistration"
            :disabled="terminalLocked"
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
            :disabled="terminalLocked"
            inline-prompt
            active-text="要求"
            inactive-text="不要求"
          />
        </el-form-item>
      </re-col>

      <re-col>
        <el-divider content-position="left" class="form-section">
          说明文字
        </el-divider>
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

<style scoped>
.form-section {
  margin: 4px 0 12px;
  font-size: 13px;
  font-weight: 600;
}

.form-field-warn {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-color-warning);
}
</style>
