<script setup lang="ts">
import { computed, ref } from "vue";
import type { FormRules } from "element-plus";
import type { RoleOptionItem } from "@/api/srvf-role";
import type { UserOptionItem } from "@/api/srvf-user";
import type { MemberOptionItem } from "@/api/srvf-position-assignment";
import type { OrgOptionItem } from "@/api/srvf-organization";
import type { ActivityOptionItem } from "@/api/srvf-activity";
import type {
  PrincipalType,
  ScopeType,
  RoleBindingPreviewConflict
} from "@/api/srvf-role-binding";

export type RoleBindingFormModel = {
  principalType: PrincipalType;
  /** SYSTEM 类型不填 */
  principalId: string;
  roleId: string;
  scopeType: ScopeType;
  scopeOrgId: string;
  scopeActivityId: string;
  scopeResourceType: string;
  scopeResourceId: string;
  startedAt: string;
  endedAt: string;
  note: string;
};

/** RESOURCE scope 的资源类型（同 authz explain 的 11 类白名单）。 */
const RESOURCE_TYPE_OPTIONS = [
  { value: "activity", label: "活动 activity" },
  { value: "attendance_sheet", label: "考勤单 attendance_sheet" },
  { value: "attendance_record", label: "考勤记录 attendance_record" },
  { value: "activity_registration", label: "报名 activity_registration" },
  { value: "member", label: "队员 member" },
  { value: "member_profile", label: "队员档案 member_profile" },
  { value: "certificate", label: "证书 certificate" },
  { value: "team_join_application", label: "入队申请 team_join_application" },
  {
    value: "recruitment_application",
    label: "招新申请 recruitment_application"
  },
  { value: "notification", label: "通知 notification" },
  { value: "attachment", label: "附件 attachment" }
];

const props = withDefaults(
  defineProps<{
    formInline?: RoleBindingFormModel;
    roleOptions?: RoleOptionItem[];
    userOptions?: UserOptionItem[];
    memberOptions?: MemberOptionItem[];
    positionAssignmentOptions?: Array<{ id: string; label: string }>;
    orgOptions?: OrgOptionItem[];
    activityOptions?: ActivityOptionItem[];
    /** 预检 conflicts（beforeSure 校验不通过时写回,同一份 options.props,响应式内联展示） */
    conflicts?: RoleBindingPreviewConflict[];
  }>(),
  {
    formInline: () => ({
      principalType: "MEMBER",
      principalId: "",
      roleId: "",
      scopeType: "GLOBAL",
      scopeOrgId: "",
      scopeActivityId: "",
      scopeResourceType: "",
      scopeResourceId: "",
      startedAt: "",
      endedAt: "",
      note: ""
    }),
    roleOptions: () => [],
    userOptions: () => [],
    memberOptions: () => [],
    positionAssignmentOptions: () => [],
    orgOptions: () => [],
    activityOptions: () => [],
    conflicts: () => []
  }
);

const form = props.formInline;
const formRef = ref();

const needsPrincipalId = computed(() => form.principalType !== "SYSTEM");
const needsScopeOrg = computed(
  () =>
    form.scopeType === "ORGANIZATION" || form.scopeType === "ORGANIZATION_TREE"
);
const needsScopeActivity = computed(() => form.scopeType === "ACTIVITY");
const needsScopeResource = computed(() => form.scopeType === "RESOURCE");

const rules: FormRules = {
  principalType: [
    { required: true, message: "请选择主体类型", trigger: "change" }
  ],
  principalId: [
    {
      validator: (_rule, value, callback) => {
        if (needsPrincipalId.value && !value) {
          callback(new Error("请选择主体"));
        } else {
          callback();
        }
      },
      trigger: "change"
    }
  ],
  roleId: [{ required: true, message: "请选择角色", trigger: "change" }],
  scopeType: [{ required: true, message: "请选择 scope", trigger: "change" }],
  scopeOrgId: [
    {
      validator: (_rule, value, callback) => {
        if (needsScopeOrg.value && !value) {
          callback(new Error("请选择组织"));
        } else {
          callback();
        }
      },
      trigger: "change"
    }
  ],
  scopeActivityId: [
    {
      validator: (_rule, value, callback) => {
        if (needsScopeActivity.value && !value) {
          callback(new Error("请选择活动"));
        } else {
          callback();
        }
      },
      trigger: "change"
    }
  ],
  scopeResourceType: [
    {
      validator: (_rule, value, callback) => {
        if (needsScopeResource.value && !value) {
          callback(new Error("请选择资源类型"));
        } else {
          callback();
        }
      },
      trigger: "change"
    }
  ],
  scopeResourceId: [
    {
      validator: (_rule, value, callback) => {
        if (needsScopeResource.value && !value?.trim()) {
          callback(new Error("请填写资源 id"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
};

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
    <el-alert
      v-if="props.conflicts.length"
      class="mb-3"
      type="error"
      show-icon
      :closable="false"
      title="预检未通过,以下问题需先解决"
    >
      <ul class="conflict-list">
        <li v-for="(c, i) in props.conflicts" :key="i">
          {{ c.message
          }}<template v-if="c.bizCode">（{{ c.bizCode }}）</template>
        </li>
      </ul>
    </el-alert>
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="主体类型" prop="principalType">
          <el-select v-model="form.principalType" class="w-full">
            <el-option label="队员 MEMBER" value="MEMBER" />
            <el-option label="用户 USER" value="USER" />
            <el-option
              label="任职 POSITION_ASSIGNMENT"
              value="POSITION_ASSIGNMENT"
            />
            <el-option label="系统 SYSTEM" value="SYSTEM" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col v-if="needsPrincipalId" :span="12">
        <el-form-item label="主体" prop="principalId">
          <el-select
            v-if="form.principalType === 'MEMBER'"
            v-model="form.principalId"
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
          <el-select
            v-else-if="form.principalType === 'USER'"
            v-model="form.principalId"
            filterable
            placeholder="选择用户"
            class="w-full"
          >
            <el-option
              v-for="opt in props.userOptions"
              :key="opt.id"
              :label="
                opt.label === opt.username
                  ? opt.label
                  : `${opt.label}（${opt.username}）`
              "
              :value="opt.id"
            />
          </el-select>
          <el-select
            v-else
            v-model="form.principalId"
            filterable
            placeholder="选择任职记录"
            class="w-full"
          >
            <el-option
              v-for="opt in props.positionAssignmentOptions"
              :key="opt.id"
              :label="opt.label"
              :value="opt.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="角色" prop="roleId">
          <el-select
            v-model="form.roleId"
            filterable
            placeholder="选择角色"
            class="w-full"
          >
            <el-option
              v-for="opt in props.roleOptions"
              :key="opt.id"
              :label="`${opt.label}（${opt.code}）`"
              :value="opt.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Scope" prop="scopeType">
          <el-select v-model="form.scopeType" class="w-full">
            <el-option label="全局 GLOBAL" value="GLOBAL" />
            <el-option label="指定组织 ORGANIZATION" value="ORGANIZATION" />
            <el-option
              label="组织+下级 ORGANIZATION_TREE"
              value="ORGANIZATION_TREE"
            />
            <el-option label="指定活动 ACTIVITY" value="ACTIVITY" />
            <el-option label="指定资源 RESOURCE" value="RESOURCE" />
            <el-option label="仅自己 SELF" value="SELF" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col v-if="needsScopeOrg" :span="12">
        <el-form-item label="Scope 组织" prop="scopeOrgId">
          <el-select
            v-model="form.scopeOrgId"
            filterable
            placeholder="选择组织"
            class="w-full"
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
      <el-col v-if="needsScopeActivity" :span="12">
        <el-form-item label="Scope 活动" prop="scopeActivityId">
          <el-select
            v-model="form.scopeActivityId"
            filterable
            placeholder="选择活动"
            class="w-full"
          >
            <el-option
              v-for="opt in props.activityOptions"
              :key="opt.id"
              :label="opt.label"
              :value="opt.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <template v-if="needsScopeResource">
        <el-col :span="12">
          <el-form-item label="资源类型" prop="scopeResourceType">
            <el-select
              v-model="form.scopeResourceType"
              filterable
              placeholder="选择资源类型"
              class="w-full"
            >
              <el-option
                v-for="opt in RESOURCE_TYPE_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="资源 ID" prop="scopeResourceId">
            <el-input
              v-model="form.scopeResourceId"
              clearable
              placeholder="资源主键 id"
            />
          </el-form-item>
        </el-col>
      </template>
      <el-col :span="12">
        <el-form-item label="任期起">
          <el-date-picker
            v-model="form.startedAt"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="可空,默认后端当前时间"
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

<style scoped lang="scss">
.conflict-list {
  padding-left: 18px;
  margin: 4px 0 0;
  list-style: disc;
}
</style>
