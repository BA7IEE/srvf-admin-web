<script setup lang="ts">
import { ref } from "vue";
import type { FormRules } from "element-plus";
import type { PositionOptionItem } from "@/api/srvf-position";
import type {
  MemberOptionItem,
  PositionAssignmentViolation
} from "@/api/srvf-position-assignment";

export type AssignPositionFormModel = {
  positionId: string;
  memberId: string;
  startedAt: string;
  endedAt: string;
  isConcurrent: boolean;
  appointmentSource: string;
  note: string;
};

const props = withDefaults(
  defineProps<{
    formInline?: AssignPositionFormModel;
    positionOptions?: PositionOptionItem[];
    memberOptions?: MemberOptionItem[];
    /** 预检 violations（由 beforeSure 在校验不通过时写回,与 dialog 同一份 options.props,天然响应式） */
    violations?: PositionAssignmentViolation[];
  }>(),
  {
    formInline: () => ({
      positionId: "",
      memberId: "",
      startedAt: "",
      endedAt: "",
      isConcurrent: false,
      appointmentSource: "",
      note: ""
    }),
    positionOptions: () => [],
    memberOptions: () => [],
    violations: () => []
  }
);

const form = props.formInline;
const formRef = ref();

const rules: FormRules = {
  positionId: [{ required: true, message: "请选择职务", trigger: "change" }],
  memberId: [{ required: true, message: "请选择队员", trigger: "change" }],
  startedAt: [
    { required: true, message: "请选择任期起始日期", trigger: "change" }
  ]
};

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
    <el-alert
      v-if="props.violations.length"
      class="mb-3"
      type="error"
      show-icon
      :closable="false"
      title="预检未通过,以下问题需先解决"
    >
      <ul class="violation-list">
        <li v-for="(v, i) in props.violations" :key="i">
          {{ v.message }}（{{ v.bizCode }}）
        </li>
      </ul>
    </el-alert>
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="职务" prop="positionId">
          <el-select
            v-model="form.positionId"
            filterable
            placeholder="选择职务"
            class="w-full"
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
        <el-form-item label="队员" prop="memberId">
          <el-select
            v-model="form.memberId"
            filterable
            placeholder="选择队员"
            class="w-full"
          >
            <el-option
              v-for="opt in props.memberOptions"
              :key="opt.id"
              :label="`${opt.label}（${opt.memberNo}）`"
              :value="opt.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="任期起" prop="startedAt">
          <el-date-picker
            v-model="form.startedAt"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            class="w-full!"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="任期止" prop="endedAt">
          <el-date-picker
            v-model="form.endedAt"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="可空"
            class="w-full!"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="兼任标记" prop="isConcurrent">
          <el-switch v-model="form.isConcurrent" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="任命来源" prop="appointmentSource">
          <el-input
            v-model="form.appointmentSource"
            clearable
            placeholder="可空,如 manual"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="备注" prop="note">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="2"
            maxlength="200"
            show-word-limit
            placeholder="可空"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<style scoped lang="scss">
.violation-list {
  padding-left: 18px;
  margin: 4px 0 0;
  list-style: disc;
}
</style>
