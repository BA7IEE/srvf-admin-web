<script setup lang="ts">
import { ref } from "vue";
import type { FormRules } from "element-plus";
import type { OrgTreeNode } from "@/api/srvf-organization";

/**
 * 部门设置表单模型（仅 `organizationId`，对齐后端 `SetMemberDepartmentDto`）。
 * 目标节点须存在且 ACTIVE，由后端裁决；前端不复刻归属规则。
 */
export type DepartmentSetFormModel = {
  /** 目标组织节点 id（必填；≤ 64） */
  organizationId: string;
};

const props = withDefaults(
  defineProps<{
    formInline?: DepartmentSetFormModel;
    /** 组织树（数据源 = srvf-organization getOrgTree；空 = 无 org 读权限/不可达 → 退化文本输入） */
    orgTreeData?: OrgTreeNode[];
  }>(),
  {
    formInline: () => ({ organizationId: "" }),
    orgTreeData: () => []
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const rules: FormRules = {
  organizationId: [
    { required: true, message: "请选择归属部门", trigger: "change" }
  ]
};

/**
 * el-tree-select 字段映射：label=name、children=children；
 * INACTIVE 节点置灰不可选（与字典只取 ACTIVE 一致，是基本可见性门，非归属规则复刻）。
 */
const treeProps = {
  label: "name",
  children: "children",
  disabled: (data: OrgTreeNode) => data.status !== "ACTIVE"
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
    <el-form-item label="归属部门" prop="organizationId">
      <el-tree-select
        v-if="orgTreeData.length"
        v-model="newFormInline.organizationId"
        class="w-full!"
        :data="orgTreeData"
        :props="treeProps"
        node-key="id"
        :render-after-expand="false"
        clearable
        filterable
        placeholder="选择归属组织节点（仅 ACTIVE 可选）"
      />
      <el-input
        v-else
        v-model="newFormInline.organizationId"
        clearable
        maxlength="64"
        placeholder="组织节点 id（无 org 读权限时手填；须存在且 ACTIVE）"
      />
    </el-form-item>
  </el-form>
</template>
