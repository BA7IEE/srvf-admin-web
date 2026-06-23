<script setup lang="ts">
import { ref } from "vue";

/** 招新轮次表单模型。create:year/name/capacity；edit:capacity/meetingInfo/qqGroup(year/name 只读)。 */
export type CycleFormModel = {
  isEdit: boolean;
  year: number | undefined;
  name: string;
  capacity: number | undefined;
  meetingInfo: string;
  qqGroup: string;
};

// formInline 由 ReDialog 经 props 注入(运行时必有);声明为可选 + 默认工厂以满足 h() 调用处类型
const props = withDefaults(defineProps<{ formInline?: CycleFormModel }>(), {
  formInline: () => ({
    isEdit: false,
    year: undefined,
    name: "",
    capacity: undefined,
    meetingInfo: "",
    qqGroup: ""
  })
});
const model = ref(props.formInline);
const formRef = ref();

const rules = {
  year: [{ required: true, message: "请填写年度", trigger: "blur" }],
  name: [{ required: true, message: "请填写轮次名称", trigger: "blur" }]
};

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="96px">
    <!-- 编辑态:年度/名称只读展示(UpdateCycleDto 不含此两字段) -->
    <el-form-item v-if="model.isEdit" label="轮次">
      <span>{{ model.year }} · {{ model.name }}</span>
    </el-form-item>
    <template v-else>
      <el-form-item label="年度" prop="year">
        <el-input-number v-model="model.year" :min="2000" :max="2100" />
      </el-form-item>
      <el-form-item label="轮次名称" prop="name">
        <el-input
          v-model="model.name"
          maxlength="100"
          placeholder="如:2026 年春季招新"
        />
      </el-form-item>
    </template>
    <el-form-item label="容量">
      <el-input-number v-model="model.capacity" :min="0" placeholder="不限" />
    </el-form-item>
    <template v-if="model.isEdit">
      <el-form-item label="见面会信息">
        <el-input
          v-model="model.meetingInfo"
          type="textarea"
          :rows="2"
          maxlength="500"
        />
      </el-form-item>
      <el-form-item label="QQ 群">
        <el-input v-model="model.qqGroup" maxlength="100" />
      </el-form-item>
    </template>
  </el-form>
</template>
