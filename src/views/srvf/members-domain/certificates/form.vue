<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";

/** 下拉选项（字典共用；为空数组 = 退化为文本输入，不臆造 code） */
export type CertificateOption = { label: string; value: string };

/**
 * 证书弹窗表单模型（字段对齐后端 Create/Update DTO，见 @/api/srvf-certificate）。
 * 仅含契约里资料字段；系统字段（certStatusCode / verifiedBy / isInternal 等）由后端维护，前端不提交。
 */
export type CertificateFormModel = {
  isEdit: boolean;
  /** 证书大类字典 code（typeCode=cert_type；必填） */
  certTypeCode: string;
  /** 证书子类型 / 等级字典 code（typeCode=cert_sub_type；可空） */
  certSubTypeCode: string;
  /** 颁发机构（自由文本；必填） */
  issuingOrg: string;
  /** 证书编号（中敏感；可空；列表不返回故编辑时留空，不填则不提交） */
  certNumber: string;
  /** 颁发日期（YYYY-MM-DD；后端规范化为 00:00:00.000Z；必填） */
  issuedAt: string;
  /** 到期日（YYYY-MM-DD；可空；留空 = 终身有效） */
  expiredAt: string;
};

const props = withDefaults(
  defineProps<{
    formInline?: CertificateFormModel;
    /** 证书大类字典下拉（type=cert_type；空 = 退化文本输入） */
    certTypeOptions?: CertificateOption[];
    /** 证书子类型字典下拉（type=cert_sub_type；空 = 退化文本输入） */
    certSubTypeOptions?: CertificateOption[];
  }>(),
  {
    formInline: () => ({
      isEdit: false,
      certTypeCode: "",
      certSubTypeCode: "",
      issuingOrg: "",
      certNumber: "",
      issuedAt: "",
      expiredAt: ""
    }),
    certTypeOptions: () => [],
    certSubTypeOptions: () => []
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const rules: FormRules = {
  certTypeCode: [
    { required: true, message: "请选择 / 输入证书类型", trigger: "change" }
  ],
  issuingOrg: [{ required: true, message: "请输入颁发机构", trigger: "blur" }],
  issuedAt: [{ required: true, message: "请选择颁发日期", trigger: "change" }]
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
      <re-col :value="12">
        <el-form-item label="证书类型" prop="certTypeCode">
          <el-select
            v-if="certTypeOptions.length"
            v-model="newFormInline.certTypeCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择证书类型（cert_type 字典）"
          >
            <el-option
              v-for="opt in certTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.certTypeCode"
            clearable
            maxlength="64"
            placeholder="证书类型字典 code（type=cert_type）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="子类型/等级">
          <el-select
            v-if="certSubTypeOptions.length"
            v-model="newFormInline.certSubTypeCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择子类型 / 等级（可空；cert_sub_type 字典）"
          >
            <el-option
              v-for="opt in certSubTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.certSubTypeCode"
            clearable
            maxlength="64"
            placeholder="子类型字典 code（可空；type=cert_sub_type）"
          />
        </el-form-item>
      </re-col>

      <re-col>
        <el-form-item label="颁发机构" prop="issuingOrg">
          <el-input
            v-model="newFormInline.issuingOrg"
            clearable
            maxlength="128"
            placeholder="颁发机构（必填；≤ 128）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="颁发日期" prop="issuedAt">
          <el-date-picker
            v-model="newFormInline.issuedAt"
            class="w-full!"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择颁发日期"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="有效期至">
          <el-date-picker
            v-model="newFormInline.expiredAt"
            class="w-full!"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="留空 = 终身有效"
          />
        </el-form-item>
      </re-col>

      <re-col>
        <el-form-item label="证书编号">
          <el-input
            v-model="newFormInline.certNumber"
            clearable
            maxlength="128"
            :placeholder="
              newFormInline.isEdit
                ? '证书编号（可空；留空不覆盖原值）'
                : '证书编号（可空；≤ 128）'
            "
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
