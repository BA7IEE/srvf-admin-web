<script setup lang="ts">
import { ref } from "vue";
import type { FormRules } from "element-plus";
import type { MemberOptionItem } from "@/api/srvf-position-assignment";
import type { OrgOptionItem } from "@/api/srvf-organization";
import type { SupervisionScopeMode } from "@/api/srvf-supervision";

export type SupervisionFormModel = {
  supervisorMemberId: string;
  organizationId: string;
  scopeMode: SupervisionScopeMode;
  startedAt: string;
  endedAt: string;
  note: string;
};

const props = withDefaults(
  defineProps<{
    formInline?: SupervisionFormModel;
    memberOptions?: MemberOptionItem[];
    orgOptions?: OrgOptionItem[];
    /** 覆盖范围预演结果（展示型,非阻塞;父级调 coverage-preview 后写回同一份 options.props） */
    coveragePreview?: string[] | null;
    coverageLoading?: boolean;
  }>(),
  {
    formInline: () => ({
      supervisorMemberId: "",
      organizationId: "",
      scopeMode: "TREE" as SupervisionScopeMode,
      startedAt: "",
      endedAt: "",
      note: ""
    }),
    memberOptions: () => [],
    orgOptions: () => [],
    coveragePreview: null,
    coverageLoading: false
  }
);

const emit = defineEmits<{
  (e: "preview-coverage"): void;
}>();

const form = props.formInline;
const formRef = ref();

const rules: FormRules = {
  supervisorMemberId: [
    { required: true, message: "请选择分管人", trigger: "change" }
  ],
  organizationId: [
    { required: true, message: "请选择被分管组织", trigger: "change" }
  ],
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
  <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="分管人" prop="supervisorMemberId">
          <el-select
            v-model="form.supervisorMemberId"
            filterable
            placeholder="选择队员（与职务正交,不要求持职务）"
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
        <el-form-item label="被分管组织" prop="organizationId">
          <el-select
            v-model="form.organizationId"
            filterable
            placeholder="选择组织"
            class="w-full"
            @change="emit('preview-coverage')"
          >
            <el-option
              v-for="opt in props.orgOptions"
              :key="opt.id"
              :label="opt.label"
              :value="opt.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="覆盖范围">
          <el-radio-group
            v-model="form.scopeMode"
            @change="emit('preview-coverage')"
          >
            <el-radio value="TREE">含全部下级 TREE</el-radio>
            <el-radio value="EXACT">仅该节点 EXACT</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-alert
          v-if="props.coverageLoading"
          type="info"
          :closable="false"
          title="正在计算覆盖范围…"
        />
        <el-alert
          v-else-if="props.coveragePreview"
          class="mb-2"
          type="success"
          show-icon
          :closable="false"
          :title="`将覆盖 ${props.coveragePreview.length} 个组织：${props.coveragePreview.join('、')}`"
        />
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
        <el-form-item label="任期止">
          <el-date-picker
            v-model="form.endedAt"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="可空"
            class="w-full!"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="备注">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="2"
            placeholder="可空"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
