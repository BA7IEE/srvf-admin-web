<script setup lang="ts">
import { ref } from "vue";
import type { FormRules } from "element-plus";
import type { PositionOptionItem, PolicyStatus } from "@/api/srvf-position";
import FormLabelTip from "@/views/srvf/components/form-label-tip.vue";

export type PositionRuleFormModel = {
  nodeTypeCode: string;
  positionId: string;
  required: boolean;
  minCount: number | null;
  maxCount: number | null;
  requireMembership: boolean;
  allowConcurrent: boolean;
  status: PolicyStatus;
};

const props = withDefaults(
  defineProps<{
    formInline?: PositionRuleFormModel;
    isEdit?: boolean;
    nodeTypeOptions?: Array<{ label: string; value: string }>;
    positionOptions?: PositionOptionItem[];
  }>(),
  {
    formInline: () => ({
      nodeTypeCode: "",
      positionId: "",
      required: false,
      minCount: null,
      maxCount: null,
      requireMembership: true,
      allowConcurrent: false,
      status: "ACTIVE" as PolicyStatus
    }),
    isEdit: false,
    nodeTypeOptions: () => [],
    positionOptions: () => []
  }
);

const form = props.formInline;
const formRef = ref();

const rules: FormRules = {
  nodeTypeCode: [
    { required: true, message: "请选择或输入组织类别 code", trigger: "change" }
  ],
  positionId: [{ required: true, message: "请选择职务", trigger: "change" }]
};

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item prop="nodeTypeCode">
          <template #label>
            <FormLabelTip
              label="组织类别"
              tip="这条规则约束哪一类组织（如中队、职能部门）；类别在「字典管理」的组织节点类别里维护"
            />
          </template>
          <!-- node_type 字典项;拉不到时 allow-create 退化手填 code。唯一键,编辑禁改 -->
          <el-select
            v-model="form.nodeTypeCode"
            class="w-full"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入 node_type code"
            :disabled="props.isEdit"
          >
            <el-option
              v-for="opt in props.nodeTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="职务" prop="positionId">
          <!-- 唯一键,编辑禁改 -->
          <el-select
            v-model="form.positionId"
            class="w-full"
            filterable
            placeholder="选择职务"
            :disabled="props.isEdit"
          >
            <el-option
              v-for="opt in props.positionOptions"
              :key="opt.id"
              :label="opt.label"
              :value="opt.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="minCount">
          <template #label>
            <FormLabelTip
              label="人数下限"
              tip="该类组织此职务至少应有几人在任；留空表示不限"
            />
          </template>
          <el-input-number
            v-model="form.minCount"
            :min="0"
            :value-on-clear="null"
            class="w-full!"
            placeholder="可空"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="maxCount">
          <template #label>
            <FormLabelTip
              label="人数上限"
              tip="该类组织此职务最多允许几人同时在任；留空表示不限"
            />
          </template>
          <el-input-number
            v-model="form.maxCount"
            :min="0"
            :value-on-clear="null"
            class="w-full!"
            placeholder="可空"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item prop="required">
          <template #label>
            <FormLabelTip
              label="必设"
              tip="打开后，该类组织必须设置此职务，缺人时体检会提示"
            />
          </template>
          <el-switch v-model="form.required" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item prop="requireMembership">
          <template #label>
            <FormLabelTip
              label="要求归属"
              tip="打开后，被任命人必须先在该组织（或其上级）有在编归属"
            />
          </template>
          <el-switch v-model="form.requireMembership" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item prop="allowConcurrent">
          <template #label>
            <FormLabelTip
              label="允许兼任"
              tip="打开后，已有其他职务的人也可以被任命此职务"
            />
          </template>
          <el-switch v-model="form.allowConcurrent" />
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
    </el-row>
  </el-form>
</template>
