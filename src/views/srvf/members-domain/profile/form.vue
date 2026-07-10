<script setup lang="ts">
import { ref, computed } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";

/** 下拉选项（字典共用；为空数组 = 单选退化文本输入 / 多选退化 allow-create，不臆造 code） */
export type ProfileOption = { label: string; value: string };

/**
 * 队员档案弹窗表单模型（字段对齐后端 Create/Update DTO，见 @/api/srvf-member-profile）。
 * **本轮（3b）= Create DTO 全字段减 medicalNotes**（共 37：必填 10 + 可选 27）。
 * medicalNotes（高敏感医疗嵌套数组）本轮不放进表单、不提交，留作后续。
 * 系统字段（id / memberId / 时间戳）由后端维护，前端不提交。
 */
export type ProfileFormModel = {
  isEdit: boolean;
  /* 必填 10 */
  realName: string;
  /** 性别字典 code（typeCode=gender；必填） */
  genderCode: string;
  /** 出生日期（YYYY-MM-DD；必填） */
  birthDate: string;
  /** 证件类型字典 code（typeCode=document_type；必填） */
  documentTypeCode: string;
  documentNumber: string;
  mobile: string;
  email: string;
  /** 加入日期（YYYY-MM-DD；必填） */
  joinedDate: string;
  /** 加入来源字典 code（typeCode=join_source；必填） */
  joinSourceCode: string;
  /** 是否授权个人信息使用（必填；switch） */
  privacyConsentSigned: boolean;
  /* 可选 27（medicalNotes 除外） */
  /** 民族字典 code（typeCode=ethnicity） */
  ethnicityCode: string;
  /** 政治面貌字典 code（typeCode=political_status） */
  politicalStatusCode: string;
  isVeteran: boolean;
  /** 婚姻状况字典 code（typeCode=marital_status） */
  maritalStatusCode: string;
  /** 学历字典 code（typeCode=education） */
  educationCode: string;
  major: string;
  /** 工作性质字典 code（typeCode=work_nature） */
  workNatureCode: string;
  residenceArea: string;
  workArea: string;
  landline: string;
  qq: string;
  wechat: string;
  /** 身高 cm（undefined = 未填） */
  heightCm: number | undefined;
  /** 体重 kg（undefined = 未填） */
  weightKg: number | undefined;
  /** 血型字典 code（typeCode=blood_type） */
  bloodTypeCode: string;
  eyesight: string;
  hasVehicle: boolean;
  vehicleType: string;
  /** 运动频率字典 code（typeCode=exercise_frequency） */
  exerciseFrequencyCode: string;
  /** 主运动项目字典 code（typeCode=exercise_sport） */
  exerciseSportCode: string;
  /** 运动方式 codes（多选；typeCode=exercise_method） */
  exerciseMethods: string[];
  /** 急救知识等级字典 code（typeCode=first_aid_knowledge） */
  firstAidKnowledgeCode: string;
  /** 急救技能 codes（多选；typeCode=first_aid_skill） */
  firstAidSkills: string[];
  otherSkills: string;
  noCriminalRecordSigned: boolean;
  /** 隐私授权时间（YYYY-MM-DDTHH:mm:ss） */
  privacyConsentSignedAt: string;
  volunteerNo: string;
};

const props = withDefaults(
  defineProps<{
    formInline?: ProfileFormModel;
    /** 字典下拉集合：typeCode → options（空 = 单选退化文本 / 多选退化 allow-create） */
    dictOptions?: Record<string, ProfileOption[]>;
    /**
     * 是否持敏感明文权限（member-profile.read.sensitive）。后端 v0.39.0 §F&A-3：无此权限者，
     * 编辑回填的 documentNumber / mobile 是掩码值——编辑态禁用这两输入并提示，避免掩码回写。
     * 默认 true：新建态 / 未传时不误禁（新建须录入真实值；掩码回写剔除已在 hook 侧兜底）。
     */
    canReadSensitive?: boolean;
  }>(),
  {
    canReadSensitive: true,
    formInline: () => ({
      isEdit: false,
      realName: "",
      genderCode: "",
      birthDate: "",
      documentTypeCode: "",
      documentNumber: "",
      mobile: "",
      email: "",
      joinedDate: "",
      joinSourceCode: "",
      privacyConsentSigned: false,
      ethnicityCode: "",
      politicalStatusCode: "",
      isVeteran: false,
      maritalStatusCode: "",
      educationCode: "",
      major: "",
      workNatureCode: "",
      residenceArea: "",
      workArea: "",
      landline: "",
      qq: "",
      wechat: "",
      heightCm: undefined,
      weightKg: undefined,
      bloodTypeCode: "",
      eyesight: "",
      hasVehicle: false,
      vehicleType: "",
      exerciseFrequencyCode: "",
      exerciseSportCode: "",
      exerciseMethods: [],
      firstAidKnowledgeCode: "",
      firstAidSkills: [],
      otherSkills: "",
      noCriminalRecordSigned: false,
      privacyConsentSignedAt: "",
      volunteerNo: ""
    }),
    dictOptions: () => ({})
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

/**
 * 敏感字段锁：仅「编辑态 且 无敏感明文权限」时为 true。此时 documentNumber / mobile 的回填值是
 * 后端掩码（110101********1234 / 138****1234），禁用输入并提示，提交侧再剔除避免掩码回写覆盖真值。
 * 新建态恒 false（须录入真实值）；持 read.sensitive 者恒 false（见明文可正常编辑）。
 */
const sensitiveLocked = computed(
  () => newFormInline.value.isEdit && !props.canReadSensitive
);

/** typeCode → options（空数组时单选退化为文本输入，多选退化为 allow-create 自由码） */
const opts = (type: string): ProfileOption[] => props.dictOptions?.[type] ?? [];

/** 仅前端必填存在性校验（10 必填里 9 个文本 / 下拉 / 日期；privacyConsentSigned 为 switch 恒有值）。
 *  格式 / 字典合法性 / 业务规则一律由后端裁决，前端不复刻。 */
const rules: FormRules = {
  realName: [{ required: true, message: "请输入真实姓名", trigger: "blur" }],
  genderCode: [
    { required: true, message: "请选择 / 输入性别", trigger: "change" }
  ],
  birthDate: [{ required: true, message: "请选择出生日期", trigger: "change" }],
  documentTypeCode: [
    { required: true, message: "请选择 / 输入证件类型", trigger: "change" }
  ],
  documentNumber: [
    { required: true, message: "请输入证件号", trigger: "blur" }
  ],
  mobile: [{ required: true, message: "请输入本人手机", trigger: "blur" }],
  email: [{ required: true, message: "请输入邮箱", trigger: "blur" }],
  joinedDate: [
    { required: true, message: "请选择加入日期", trigger: "change" }
  ],
  joinSourceCode: [
    { required: true, message: "请选择 / 输入加入来源", trigger: "change" }
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
    label-width="110px"
  >
    <el-row :gutter="30">
      <!-- ===== 必填身份 ===== -->
      <re-col>
        <el-divider content-position="left">必填身份</el-divider>
      </re-col>

      <re-col :value="12">
        <el-form-item label="真实姓名" prop="realName">
          <el-input
            v-model="newFormInline.realName"
            clearable
            maxlength="64"
            placeholder="真实姓名（必填；≤ 64）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="性别" prop="genderCode">
          <el-select
            v-if="opts('gender').length"
            v-model="newFormInline.genderCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择性别（gender 字典）"
          >
            <el-option
              v-for="o in opts('gender')"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.genderCode"
            clearable
            maxlength="64"
            placeholder="性别字典 code（type=gender）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="出生日期" prop="birthDate">
          <el-date-picker
            v-model="newFormInline.birthDate"
            class="w-full!"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择出生日期"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="证件类型" prop="documentTypeCode">
          <el-select
            v-if="opts('document_type').length"
            v-model="newFormInline.documentTypeCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择证件类型（document_type 字典）"
          >
            <el-option
              v-for="o in opts('document_type')"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.documentTypeCode"
            clearable
            maxlength="64"
            placeholder="证件类型字典 code（type=document_type）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="证件号" prop="documentNumber">
          <el-input
            v-model="newFormInline.documentNumber"
            :disabled="sensitiveLocked"
            clearable
            maxlength="64"
            placeholder="证件号（必填；≤ 64；高敏感）"
          />
          <div v-if="sensitiveLocked" class="sensitive-field-hint">
            已脱敏显示，需「敏感信息查看」权限方可编辑；保存不会覆盖后端真实值
          </div>
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="本人手机" prop="mobile">
          <el-input
            v-model="newFormInline.mobile"
            :disabled="sensitiveLocked"
            clearable
            maxlength="32"
            placeholder="本人手机（必填；≤ 32；高敏感）"
          />
          <div v-if="sensitiveLocked" class="sensitive-field-hint">
            已脱敏显示，需「敏感信息查看」权限方可编辑；保存不会覆盖后端真实值
          </div>
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="newFormInline.email"
            clearable
            maxlength="256"
            placeholder="邮箱（必填；≤ 256）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="加入日期" prop="joinedDate">
          <el-date-picker
            v-model="newFormInline.joinedDate"
            class="w-full!"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择加入日期"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="加入来源" prop="joinSourceCode">
          <el-select
            v-if="opts('join_source').length"
            v-model="newFormInline.joinSourceCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择加入来源（join_source 字典）"
          >
            <el-option
              v-for="o in opts('join_source')"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.joinSourceCode"
            clearable
            maxlength="64"
            placeholder="加入来源字典 code（type=join_source）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="隐私授权" prop="privacyConsentSigned">
          <el-switch
            v-model="newFormInline.privacyConsentSigned"
            inline-prompt
            active-text="已授权"
            inactive-text="未授权"
          />
        </el-form-item>
      </re-col>

      <!-- ===== 个人 ===== -->
      <re-col>
        <el-divider content-position="left">个人</el-divider>
      </re-col>

      <re-col :value="12">
        <el-form-item label="民族">
          <el-select
            v-if="opts('ethnicity').length"
            v-model="newFormInline.ethnicityCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择民族（ethnicity 字典）"
          >
            <el-option
              v-for="o in opts('ethnicity')"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.ethnicityCode"
            clearable
            maxlength="64"
            placeholder="民族字典 code（type=ethnicity）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="政治面貌">
          <el-select
            v-if="opts('political_status').length"
            v-model="newFormInline.politicalStatusCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择政治面貌（political_status 字典）"
          >
            <el-option
              v-for="o in opts('political_status')"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.politicalStatusCode"
            clearable
            maxlength="64"
            placeholder="政治面貌字典 code（type=political_status）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="退伍军人">
          <el-switch
            v-model="newFormInline.isVeteran"
            inline-prompt
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="婚姻状况">
          <el-select
            v-if="opts('marital_status').length"
            v-model="newFormInline.maritalStatusCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择婚姻状况（marital_status 字典）"
          >
            <el-option
              v-for="o in opts('marital_status')"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.maritalStatusCode"
            clearable
            maxlength="64"
            placeholder="婚姻状况字典 code（type=marital_status）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="学历">
          <el-select
            v-if="opts('education').length"
            v-model="newFormInline.educationCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择学历（education 字典）"
          >
            <el-option
              v-for="o in opts('education')"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.educationCode"
            clearable
            maxlength="64"
            placeholder="学历字典 code（type=education）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="专业">
          <el-input
            v-model="newFormInline.major"
            clearable
            maxlength="128"
            placeholder="所学专业（可空；≤ 128）"
          />
        </el-form-item>
      </re-col>

      <!-- ===== 工作 / 居住 ===== -->
      <re-col>
        <el-divider content-position="left">工作 / 居住</el-divider>
      </re-col>

      <re-col :value="12">
        <el-form-item label="工作性质">
          <el-select
            v-if="opts('work_nature').length"
            v-model="newFormInline.workNatureCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择工作性质（work_nature 字典）"
          >
            <el-option
              v-for="o in opts('work_nature')"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.workNatureCode"
            clearable
            maxlength="64"
            placeholder="工作性质字典 code（type=work_nature）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="居住区">
          <el-input
            v-model="newFormInline.residenceArea"
            clearable
            maxlength="64"
            placeholder="居住区行政区粒度（可空；≤ 64）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="工作区">
          <el-input
            v-model="newFormInline.workArea"
            clearable
            maxlength="64"
            placeholder="工作区行政区粒度（可空；≤ 64）"
          />
        </el-form-item>
      </re-col>

      <!-- ===== 联系 ===== -->
      <re-col>
        <el-divider content-position="left">联系</el-divider>
      </re-col>

      <re-col :value="12">
        <el-form-item label="座机">
          <el-input
            v-model="newFormInline.landline"
            clearable
            maxlength="32"
            placeholder="座机（可空；≤ 32）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="QQ">
          <el-input
            v-model="newFormInline.qq"
            clearable
            maxlength="32"
            placeholder="QQ（可空；≤ 32）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="微信">
          <el-input
            v-model="newFormInline.wechat"
            clearable
            maxlength="64"
            placeholder="微信（可空；≤ 64）"
          />
        </el-form-item>
      </re-col>

      <!-- ===== 身体（高敏感医疗） ===== -->
      <re-col>
        <el-divider content-position="left">身体（高敏感医疗）</el-divider>
      </re-col>

      <re-col :value="12">
        <el-form-item label="身高 (cm)">
          <el-input-number
            v-model="newFormInline.heightCm"
            class="w-full!"
            :min="0"
            controls-position="right"
            placeholder="身高 cm（可空）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="体重 (kg)">
          <el-input-number
            v-model="newFormInline.weightKg"
            class="w-full!"
            :min="0"
            controls-position="right"
            placeholder="体重 kg（可空）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="血型">
          <el-select
            v-if="opts('blood_type').length"
            v-model="newFormInline.bloodTypeCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择血型（blood_type 字典）"
          >
            <el-option
              v-for="o in opts('blood_type')"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.bloodTypeCode"
            clearable
            maxlength="64"
            placeholder="血型字典 code（type=blood_type）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="视力">
          <el-input
            v-model="newFormInline.eyesight"
            clearable
            maxlength="32"
            placeholder="视力（可空；≤ 32）"
          />
        </el-form-item>
      </re-col>

      <!-- ===== 车辆 ===== -->
      <re-col>
        <el-divider content-position="left">车辆</el-divider>
      </re-col>

      <re-col :value="12">
        <el-form-item label="拥有车辆">
          <el-switch
            v-model="newFormInline.hasVehicle"
            inline-prompt
            active-text="有"
            inactive-text="无"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="车辆类型">
          <el-input
            v-model="newFormInline.vehicleType"
            clearable
            maxlength="64"
            placeholder="车辆类型（hasVehicle=有 时填；≤ 64）"
          />
        </el-form-item>
      </re-col>

      <!-- ===== 运动 / 急救 ===== -->
      <re-col>
        <el-divider content-position="left">运动 / 急救</el-divider>
      </re-col>

      <re-col :value="12">
        <el-form-item label="运动频率">
          <el-select
            v-if="opts('exercise_frequency').length"
            v-model="newFormInline.exerciseFrequencyCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择运动频率（exercise_frequency 字典）"
          >
            <el-option
              v-for="o in opts('exercise_frequency')"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.exerciseFrequencyCode"
            clearable
            maxlength="64"
            placeholder="运动频率字典 code（type=exercise_frequency）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="主运动项目">
          <el-select
            v-if="opts('exercise_sport').length"
            v-model="newFormInline.exerciseSportCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择主运动项目（exercise_sport 字典）"
          >
            <el-option
              v-for="o in opts('exercise_sport')"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.exerciseSportCode"
            clearable
            maxlength="64"
            placeholder="主运动项目字典 code（type=exercise_sport）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="运动方式">
          <el-select
            v-model="newFormInline.exerciseMethods"
            class="w-full!"
            multiple
            filterable
            :allow-create="!opts('exercise_method').length"
            :reserve-keyword="false"
            placeholder="运动方式（多选；exercise_method 字典；无字典时可输入码）"
          >
            <el-option
              v-for="o in opts('exercise_method')"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="急救知识等级">
          <el-select
            v-if="opts('first_aid_knowledge').length"
            v-model="newFormInline.firstAidKnowledgeCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择急救知识等级（first_aid_knowledge 字典）"
          >
            <el-option
              v-for="o in opts('first_aid_knowledge')"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.firstAidKnowledgeCode"
            clearable
            maxlength="64"
            placeholder="急救知识等级字典 code（type=first_aid_knowledge）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="急救技能">
          <el-select
            v-model="newFormInline.firstAidSkills"
            class="w-full!"
            multiple
            filterable
            :allow-create="!opts('first_aid_skill').length"
            :reserve-keyword="false"
            placeholder="急救技能（多选；first_aid_skill 字典；无字典时可输入码）"
          >
            <el-option
              v-for="o in opts('first_aid_skill')"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </el-form-item>
      </re-col>

      <re-col>
        <el-form-item label="其他特长">
          <el-input
            v-model="newFormInline.otherSkills"
            type="textarea"
            :rows="2"
            maxlength="2000"
            show-word-limit
            placeholder="其他特长（可空；≤ 2000）"
          />
        </el-form-item>
      </re-col>

      <!-- ===== 声明 / 其它 ===== -->
      <re-col>
        <el-divider content-position="left">声明 / 其它</el-divider>
      </re-col>

      <re-col :value="12">
        <el-form-item label="无犯罪声明">
          <el-switch
            v-model="newFormInline.noCriminalRecordSigned"
            inline-prompt
            active-text="已签"
            inactive-text="未签"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="隐私授权时间">
          <el-date-picker
            v-model="newFormInline.privacyConsentSignedAt"
            class="w-full!"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            placeholder="选择隐私授权时间（可空）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="义工号">
          <el-input
            v-model="newFormInline.volunteerNo"
            clearable
            maxlength="32"
            placeholder="义工号（可空；≤ 32；不参与登录 / 权限）"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>

<style scoped>
.sensitive-field-hint {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-color-info);
}
</style>
