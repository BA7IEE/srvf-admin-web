<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";

/** 下拉选项（字典共用；为空数组 = 退化为文本输入，不臆造 code） */
export type EmergencyContactOption = { label: string; value: string };

/**
 * 紧急联系人弹窗表单模型（字段对齐后端 Create/Update DTO，见 @/api/srvf-emergency-contact）。
 * 仅含契约里资料字段；系统字段（id / memberId / createdAt 等）由后端维护，前端不提交。
 */
export type EmergencyContactFormModel = {
  isEdit: boolean;
  /** 联系人姓名（必填；≤ 64；高敏感） */
  contactName: string;
  /** 关系字典 code（typeCode=emergency_relation；必填；≤ 64） */
  relationCode: string;
  /** 联系人主电话（必填；≤ 32；高敏感） */
  phonePrimary: string;
  /** 联系人备用电话（可空；≤ 32） */
  phoneBackup: string;
  /** 联系人地址（可空；≤ 256） */
  address: string;
  /** 优先级（0 = 最高；允许并列；默认 0） */
  priority: number;
};

const props = withDefaults(
  defineProps<{
    formInline?: EmergencyContactFormModel;
    /** 关系字典下拉（type=emergency_relation；空 = 退化文本输入） */
    relationOptions?: EmergencyContactOption[];
  }>(),
  {
    formInline: () => ({
      isEdit: false,
      contactName: "",
      relationCode: "",
      phonePrimary: "",
      phoneBackup: "",
      address: "",
      priority: 0
    }),
    relationOptions: () => []
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const rules: FormRules = {
  contactName: [
    { required: true, message: "请输入联系人姓名", trigger: "blur" }
  ],
  relationCode: [
    { required: true, message: "请选择 / 输入关系", trigger: "change" }
  ],
  phonePrimary: [{ required: true, message: "请输入主电话", trigger: "blur" }]
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
        <el-form-item label="联系人姓名" prop="contactName">
          <el-input
            v-model="newFormInline.contactName"
            clearable
            maxlength="64"
            placeholder="联系人姓名（必填；≤ 64）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="关系" prop="relationCode">
          <el-select
            v-if="relationOptions.length"
            v-model="newFormInline.relationCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择关系（emergency_relation 字典）"
          >
            <el-option
              v-for="opt in relationOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.relationCode"
            clearable
            maxlength="64"
            placeholder="关系字典 code（type=emergency_relation）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="主电话" prop="phonePrimary">
          <el-input
            v-model="newFormInline.phonePrimary"
            clearable
            maxlength="32"
            placeholder="联系人主电话（必填；≤ 32）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="备用电话">
          <el-input
            v-model="newFormInline.phoneBackup"
            clearable
            maxlength="32"
            placeholder="备用电话（可空；≤ 32）"
          />
        </el-form-item>
      </re-col>

      <re-col>
        <el-form-item label="地址">
          <el-input
            v-model="newFormInline.address"
            clearable
            maxlength="256"
            placeholder="联系人地址（可空；≤ 256）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="优先级">
          <el-input-number
            v-model="newFormInline.priority"
            :min="0"
            controls-position="right"
          />
          <span
            style="
              margin-left: 8px;
              font-size: 12px;
              color: var(--el-text-color-secondary);
            "
          >
            0 = 最高（越小越靠前）
          </span>
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
