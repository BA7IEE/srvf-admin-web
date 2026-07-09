<script setup lang="ts">
defineOptions({
  name: "SrvfRemoteSelect"
});

withDefaults(
  defineProps<{
    /** 选项数据源（{label, value}[]，父层负责拉取；本组件不发请求） */
    options?: Array<{ label: string; value: string }>;
    /** 占位符 */
    placeholder?: string;
    /** 是否可清空，默认 true（现有页面均为 clearable） */
    clearable?: boolean;
    /** 是否可搜索过滤，默认 true（现有页面均为 filterable） */
    filterable?: boolean;
    /** 允许输入值不在选项中时临时创建（退化场景，默认 false，按需开启） */
    allowCreate?: boolean;
    /**
     * 选项为空时的兜底文案：传入后，零选项态整体退化为禁用 el-input + 该文案占位
     * （对齐「代报名选队员」的既有退化写法）；不传则按普通下拉展示（可能暂无选项）。
     */
    emptyHint?: string;
  }>(),
  {
    options: () => [],
    placeholder: "",
    clearable: true,
    filterable: true,
    allowCreate: false,
    emptyHint: undefined
  }
);

const modelValue = defineModel<string>({ default: "" });
</script>

<template>
  <el-input
    v-if="emptyHint && !options.length"
    v-model="modelValue"
    disabled
    :placeholder="emptyHint"
  />
  <el-select
    v-else
    v-model="modelValue"
    class="w-full!"
    :clearable="clearable"
    :filterable="filterable"
    :allow-create="allowCreate"
    :placeholder="placeholder"
  >
    <el-option
      v-for="opt in options"
      :key="opt.value"
      :label="opt.label"
      :value="opt.value"
    />
  </el-select>
</template>
