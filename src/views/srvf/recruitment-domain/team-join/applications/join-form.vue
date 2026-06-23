<script setup lang="ts">
import { ref } from "vue";

/** 一键入队表单：从候选部门选定单一 organizationId。orgOptions 由父预解析(id→名称)。 */
export type JoinFormModel = { organizationId: string };
type OrgOption = { label: string; value: string };

const props = withDefaults(
  defineProps<{ formInline?: JoinFormModel; orgOptions?: OrgOption[] }>(),
  {
    formInline: () => ({ organizationId: "" }),
    orgOptions: () => []
  }
);
const model = ref(props.formInline);
const formRef = ref();

const rules = {
  organizationId: [
    { required: true, message: "请选择入队部门", trigger: "change" }
  ]
};

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="96px">
    <el-form-item label="入队部门" prop="organizationId">
      <el-select
        v-model="model.organizationId"
        placeholder="从候选部门选定单一部门"
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
    <div class="join-hint">入队后单事务设部门 + 级别 level-1,终态 joined。</div>
  </el-form>
</template>

<style scoped lang="scss">
.join-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
