<script setup lang="ts">
import { ref, computed } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";
import { SrvfRemoteSelect } from "@/srvf-kit";

/** 队员下拉选项（value = Member.id；空数组 = 无读权限，选择器禁用） */
export type MemberOption = { label: string; value: string };

/**
 * 代报名弹窗表单模型（对齐后端 `CreateRegistrationDto`，见 @/api/srvf-registration）。
 * 本轮仅 `memberId`（必填）；`extras`（扩展 Json）本轮不做,不放进表单也不提交。
 */
export type RegistrationFormModel = {
  /** 目标队员 Member.id（必填；8–64） */
  memberId: string;
  /** 活动岗位 id（活动配了岗位就必填，否则后端返 21035；无岗位活动留空） */
  activityPositionId: string;
};

/** 岗位下拉选项（value = activityPositionId；空数组 = 该活动没配岗位） */
export type PositionOption = { label: string; value: string };

const props = withDefaults(
  defineProps<{
    formInline?: RegistrationFormModel;
    /** 队员下拉（数据源 getMembers；空 = 退化为文本输入 id） */
    memberOptions?: MemberOption[];
    /** 该活动的岗位下拉；**非空即代表这个活动按岗位报名，岗位必选** */
    positionOptions?: PositionOption[];
  }>(),
  {
    formInline: () => ({ memberId: "", activityPositionId: "" }),
    memberOptions: () => [],
    positionOptions: () => []
  }
);

/** 有岗位就必选——后端对有岗位活动缺 activityPositionId 直接返 21035 */
const positionRequired = computed(() => props.positionOptions.length > 0);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const rules = computed<FormRules>(() => ({
  memberId: [
    { required: true, message: "请选择 / 输入代报名队员", trigger: "change" }
  ],
  activityPositionId: [
    {
      required: positionRequired.value,
      message: "本活动按岗位报名，请选择岗位",
      trigger: "change"
    }
  ]
}));

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
        <el-form-item label="代报名队员" prop="memberId">
          <SrvfRemoteSelect
            v-model="newFormInline.memberId"
            :options="memberOptions"
            placeholder="选择队员（按显示名 / 编号检索）"
            empty-hint="队员选项不可用（需队员读取权限），请联系管理员"
          />
        </el-form-item>
      </re-col>

      <!-- 岗位:只有配了岗位的活动才出这一项,且此时必选 -->
      <re-col v-if="positionRequired">
        <el-form-item label="报名岗位" prop="activityPositionId">
          <el-select
            v-model="newFormInline.activityPositionId"
            class="w-full!"
            clearable
            filterable
            placeholder="本活动按岗位报名，请选择岗位"
          >
            <el-option
              v-for="opt in positionOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
