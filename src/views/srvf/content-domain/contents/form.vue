<script setup lang="ts">
import { ref, computed } from "vue";
import { VISIBILITY_OPTIONS, type ContentVisibility } from "@/api/srvf-content";

/** 内容编辑表单。可见性=department 时显示「可见部门」多选;tags 为可创建多选(回车添加)。 */
export type ContentFormModel = {
  title: string;
  summary: string;
  body: string;
  contentTypeCode: string;
  visibilityCode: ContentVisibility;
  visibleOrganizationIds: string[];
  tags: string[];
  pinned: boolean;
};
type Option = { label: string; value: string };

const props = withDefaults(
  defineProps<{
    formInline?: ContentFormModel;
    typeOptions?: Option[];
    orgOptions?: Option[];
  }>(),
  {
    formInline: () => ({
      title: "",
      summary: "",
      body: "",
      contentTypeCode: "",
      visibilityCode: "member",
      visibleOrganizationIds: [],
      tags: [],
      pinned: false
    }),
    typeOptions: () => [],
    orgOptions: () => []
  }
);
const model = ref(props.formInline);
const formRef = ref();

const isDept = computed(() => model.value.visibilityCode === "department");

const rules = {
  title: [{ required: true, message: "请填写标题", trigger: "blur" }],
  body: [{ required: true, message: "请填写正文", trigger: "blur" }],
  contentTypeCode: [
    { required: true, message: "请选择内容类型", trigger: "change" }
  ],
  visibilityCode: [
    { required: true, message: "请选择可见性", trigger: "change" }
  ]
};

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="80px">
    <el-form-item label="标题" prop="title">
      <el-input v-model="model.title" maxlength="200" />
    </el-form-item>
    <el-form-item label="类型" prop="contentTypeCode">
      <el-select
        v-model="model.contentTypeCode"
        filterable
        allow-create
        default-first-option
        placeholder="content_type 字典(查不到可手填码)"
        class="w-full!"
      >
        <el-option
          v-for="o in typeOptions"
          :key="o.value"
          :label="o.label"
          :value="o.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="可见性" prop="visibilityCode">
      <el-select v-model="model.visibilityCode" class="w-full!">
        <el-option
          v-for="o in VISIBILITY_OPTIONS"
          :key="o.value"
          :label="o.label"
          :value="o.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item v-if="isDept" label="可见部门">
      <el-select
        v-model="model.visibleOrganizationIds"
        multiple
        filterable
        placeholder="指定可见部门"
        class="w-full!"
      >
        <el-option
          v-for="o in orgOptions"
          :key="o.value"
          :label="o.label"
          :value="o.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="摘要">
      <el-input
        v-model="model.summary"
        type="textarea"
        :rows="2"
        maxlength="500"
      />
    </el-form-item>
    <el-form-item label="正文" prop="body">
      <el-input v-model="model.body" type="textarea" :rows="10" />
    </el-form-item>
    <el-form-item label="标签">
      <el-select
        v-model="model.tags"
        multiple
        filterable
        allow-create
        default-first-option
        placeholder="输入标签后回车添加"
        class="w-full!"
      />
    </el-form-item>
    <el-form-item label="置顶">
      <el-switch v-model="model.pinned" />
    </el-form-item>
  </el-form>
</template>
