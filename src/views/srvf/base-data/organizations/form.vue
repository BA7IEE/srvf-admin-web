<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";

/**
 * 组织节点弹窗表单模型（对齐后端 Create/UpdateOrganizationDto）。
 * 注意：**不含 parentId** —— 父级由上下文决定（工具栏=根 / 行内"新增子节点"=该行 id），
 * 后端禁改父级，前端不暴露、不修改。
 */
export type OrgFormModel = {
  name: string;
  /** 组织缩写（可选） */
  code: string;
  nodeTypeCode: string;
  sortOrder: number;
};

const props = withDefaults(defineProps<{ formInline?: OrgFormModel }>(), {
  formInline: () => ({
    name: "",
    code: "",
    nodeTypeCode: "",
    sortOrder: 0
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const rules: FormRules = {
  name: [{ required: true, message: "请输入节点名", trigger: "blur" }],
  code: [
    {
      pattern: /^[A-Z0-9-]+$/,
      message: "大写字母 / 数字 / 连字符",
      trigger: "blur"
    }
  ],
  nodeTypeCode: [
    { required: true, message: "请输入节点类别字典 code", trigger: "blur" }
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
    label-width="92px"
  >
    <el-row :gutter="30">
      <re-col>
        <el-form-item label="节点名" prop="name">
          <el-input
            v-model="newFormInline.name"
            clearable
            placeholder="请输入节点名"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="组织缩写" prop="code">
          <el-input
            v-model="newFormInline.code"
            clearable
            placeholder="可选；大写字母 / 数字 / 连字符，全局唯一"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="节点类别" prop="nodeTypeCode">
          <el-input
            v-model="newFormInline.nodeTypeCode"
            clearable
            placeholder="节点类别字典 code（type=node_type）"
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
