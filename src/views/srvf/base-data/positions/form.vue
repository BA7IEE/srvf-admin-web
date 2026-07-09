<script setup lang="ts">
import { ref } from "vue";
import type { FormRules } from "element-plus";
import {
  POSITION_CATEGORY_LABEL,
  type PositionCategory,
  type PolicyStatus
} from "@/api/srvf-position";

export type PositionFormModel = {
  code: string;
  name: string;
  categoryCode: PositionCategory;
  rank: number;
  isLeadership: boolean;
  allowMultiple: boolean;
  allowConcurrent: boolean;
  sortOrder: number;
  status: PolicyStatus;
  description: string;
};

const props = withDefaults(
  defineProps<{
    formInline?: PositionFormModel;
    isEdit?: boolean;
  }>(),
  {
    formInline: () => ({
      code: "",
      name: "",
      categoryCode: "STAFF" as PositionCategory,
      rank: 0,
      isLeadership: false,
      allowMultiple: true,
      allowConcurrent: false,
      sortOrder: 0,
      status: "ACTIVE" as PolicyStatus,
      description: ""
    }),
    isEdit: false
  }
);

const form = props.formInline;
const formRef = ref();

const rules: FormRules = {
  code: [
    { required: true, message: "请输入职务 code", trigger: "blur" },
    {
      pattern: /^[a-z][a-z0-9-]*$/,
      message: "kebab 格式：小写字母开头,仅小写字母/数字/连字符",
      trigger: "blur"
    }
  ],
  name: [{ required: true, message: "请输入职务名称", trigger: "blur" }],
  categoryCode: [
    { required: true, message: "请选择职务类别", trigger: "change" }
  ]
};

const categoryOptions = Object.keys(POSITION_CATEGORY_LABEL).map(code => ({
  value: code,
  label: `${POSITION_CATEGORY_LABEL[code]} ${code}`
}));

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="职务 code" prop="code">
          <el-input
            v-model="form.code"
            clearable
            placeholder="如 team-leader"
            :disabled="props.isEdit"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" clearable placeholder="如 队长" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="类别" prop="categoryCode">
          <el-select v-model="form.categoryCode" class="w-full">
            <el-option
              v-for="opt in categoryOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" class="w-full">
            <el-option label="启用 ACTIVE" value="ACTIVE" />
            <el-option label="停用 INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="职级排序" prop="rank">
          <el-input-number v-model="form.rank" :min="0" class="w-full!" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" class="w-full!" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="领导职务" prop="isLeadership">
          <el-switch v-model="form.isLeadership" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="多人在任" prop="allowMultiple">
          <el-switch v-model="form.allowMultiple" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="允许兼任" prop="allowConcurrent">
          <el-switch v-model="form.allowConcurrent" />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="备注" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="可空；说明该职务用途或任命规则"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
