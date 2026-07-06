<script setup lang="ts">
import { ref } from "vue";
import type { FormRules } from "element-plus";
import type { OrgTreeOptionItem } from "@/api/srvf-organization";

export type MoveFormModel = {
  currentLabel: string;
  parentId: string;
};

const props = withDefaults(
  defineProps<{
    formInline?: MoveFormModel;
    /** 组织树极简投影（getOrgTreeOptions；表单级联选择器专用端点） */
    treeOptions?: OrgTreeOptionItem[];
  }>(),
  {
    formInline: () => ({ currentLabel: "", parentId: "" }),
    treeOptions: () => []
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

/** el-tree-select 字段映射：本端点自带 label 字段（非 name），children 递归。 */
const treeProps = { label: "label", children: "children" };

const rules: FormRules = {
  parentId: [
    { required: true, message: "请选择新的父级组织", trigger: "change" }
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
    label-width="96px"
  >
    <el-form-item label="当前节点">
      <el-input :model-value="newFormInline.currentLabel" disabled />
    </el-form-item>
    <el-form-item label="新父级" prop="parentId">
      <el-tree-select
        v-model="newFormInline.parentId"
        class="w-full!"
        :data="treeOptions"
        :props="treeProps"
        node-key="id"
        :render-after-expand="false"
        check-strictly
        clearable
        filterable
        placeholder="选择新的父级组织"
      />
    </el-form-item>
  </el-form>
</template>
