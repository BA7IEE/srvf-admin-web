<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";
import type { DictItemTreeNode } from "@/api/srvf-dict";

/** 字典条目弹窗表单模型（对齐后端 Create/UpdateDictItemDto） */
export type DictItemFormModel = {
  /** true=编辑：code / parentId 后端禁改，置灰只读 */
  isEdit: boolean;
  /** 所属类型显示名（只读展示，typeId 由 hook 注入提交） */
  typeLabel: string;
  code: string;
  label: string;
  parentId: string | null;
  sortOrder: number;
};

const props = withDefaults(
  defineProps<{
    formInline?: DictItemFormModel;
    /** 父级候选：当前类型完整条目树（hook 注入，与右侧树表同源，不受分页/展开状态影响） */
    parentTreeData?: DictItemTreeNode[];
  }>(),
  {
    formInline: () => ({
      isEdit: false,
      typeLabel: "",
      code: "",
      label: "",
      parentId: null,
      sortOrder: 0
    }),
    parentTreeData: () => []
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const rules: FormRules = {
  code: [
    { required: true, message: "请输入条目 code", trigger: "blur" },
    {
      pattern: /^[a-z0-9][a-z0-9_-]*$/,
      message: "小写字母 / 数字 / 下划线 / 中横线，字母或数字开头",
      trigger: "blur"
    }
  ],
  label: [{ required: true, message: "请输入显示名", trigger: "blur" }]
};

/** el-tree-select 字段映射：label=label、children=children（与右侧树表同源数据） */
const treeProps = {
  label: "label",
  children: "children"
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
    label-width="82px"
  >
    <el-row :gutter="30">
      <re-col>
        <el-form-item label="所属类型">
          <el-input :model-value="newFormInline.typeLabel" disabled />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="条目 code" prop="code">
          <el-input
            v-model="newFormInline.code"
            :disabled="newFormInline.isEdit"
            clearable
            placeholder="同类型下唯一，如 mountain_rescue"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="显示名" prop="label">
          <el-input
            v-model="newFormInline.label"
            clearable
            placeholder="请输入显示名"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="父级条目">
          <el-tree-select
            v-model="newFormInline.parentId"
            :disabled="newFormInline.isEdit"
            class="w-full!"
            :data="parentTreeData"
            :props="treeProps"
            node-key="id"
            :render-after-expand="false"
            clearable
            filterable
            placeholder="留空 = 顶级条目；可选当前类型下任意已有条目"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="排序">
          <el-input-number
            v-model="newFormInline.sortOrder"
            :min="0"
            class="w-full!"
            controls-position="right"
            placeholder="排序权重（默认 0）"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
