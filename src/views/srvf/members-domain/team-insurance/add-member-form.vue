<script setup lang="ts">
import { ref } from "vue";

/** 覆盖名单单加队员:选一名队员。memberOptions 由父预解析(getMembers ACTIVE)。 */
export type AddMemberFormModel = { memberId: string };
type MemberOption = { label: string; value: string };

const props = withDefaults(
  defineProps<{
    formInline?: AddMemberFormModel;
    memberOptions?: MemberOption[];
  }>(),
  {
    formInline: () => ({ memberId: "" }),
    memberOptions: () => []
  }
);
const model = ref(props.formInline);
const formRef = ref();

const rules = {
  memberId: [{ required: true, message: "请选择队员", trigger: "change" }]
};

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="64px">
    <el-form-item label="队员" prop="memberId">
      <el-select
        v-model="model.memberId"
        filterable
        placeholder="选择要加入名单的队员"
        class="w-full!"
      >
        <el-option
          v-for="o in memberOptions"
          :key="o.value"
          :label="o.label"
          :value="o.value"
        />
      </el-select>
    </el-form-item>
  </el-form>
</template>
