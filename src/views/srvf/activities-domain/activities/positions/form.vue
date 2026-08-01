<script setup lang="ts">
import { ref, computed } from "vue";
import dayjs from "dayjs";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";

/** 下拉选项（字典共用；为空数组 = 退化为文本输入，不臆造 code） */
export type ActivityPositionOption = { label: string; value: string };

/**
 * 活动岗位表单模型（字段对齐后端 Create/Update DTO，见 @/api/srvf-activity-position）。
 *
 * 「名额」与「时段」两项在界面上是**开关 + 输入**的组合，因为契约里它们的
 * 「不填」是有语义的：名额不填 = 不限名额；时段不填 = 沿用活动时间窗。
 * 直接摆两个空输入框，用户没法区分「我没填」和「我要不限」。
 */
export type ActivityPositionFormModel = {
  isEdit: boolean;
  name: string;
  attendanceRoleCode: string;
  /** true = 不限名额（提交 null）；false = 用 capacity 的值 */
  unlimitedCapacity: boolean;
  capacity: number | undefined;
  /** true = 沿用活动时间窗（提交 null）；false = 用下面两个时间 */
  followActivityWindow: boolean;
  startAt: string;
  endAt: string;
  genderRequirementCode: string;
  description: string;
  sortOrder: number;
};

const props = withDefaults(
  defineProps<{
    formInline?: ActivityPositionFormModel;
    /** 考勤角色字典（type=attendance_role；空 = 退化文本输入） */
    attendanceRoleOptions?: ActivityPositionOption[];
    /** 性别限制字典（type=gender_requirement；空 = 退化文本输入） */
    genderRequirementOptions?: ActivityPositionOption[];
    /** 所属活动的时间窗，用于「岗位时段必须落在活动窗内」的即时提示 */
    activityStartAt?: string;
    activityEndAt?: string;
  }>(),
  {
    attendanceRoleOptions: () => [],
    genderRequirementOptions: () => [],
    activityStartAt: "",
    activityEndAt: "",
    formInline: () => ({
      isEdit: false,
      name: "",
      attendanceRoleCode: "",
      unlimitedCapacity: true,
      capacity: undefined,
      followActivityWindow: true,
      startAt: "",
      endAt: "",
      genderRequirementCode: "",
      description: "",
      sortOrder: 0
    })
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

/** 活动窗文案（给时段区当参照，省得用户自己回列表查） */
const activityWindowText = computed(() => {
  if (!props.activityStartAt || !props.activityEndAt) return "";
  const f = (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm");
  return `${f(props.activityStartAt)} ~ ${f(props.activityEndAt)}`;
});

/**
 * 时段的前端即时校验：同空同有 + 落在活动窗内。
 * 只做提示，最终仍由后端裁决（前端不复刻业务规则的权威性）。
 */
const windowWarning = computed(() => {
  const m = newFormInline.value;
  if (m.followActivityWindow) return "";
  if (!m.startAt || !m.endAt)
    return "岗位时段要么都不填（沿用活动时间），要么两个都填";
  if (dayjs(m.endAt).isBefore(dayjs(m.startAt)))
    return "岗位结束时间不能早于开始时间";
  if (props.activityStartAt && dayjs(m.startAt).isBefore(props.activityStartAt))
    return "岗位开始时间早于活动开始时间，后端会拒绝";
  if (props.activityEndAt && dayjs(m.endAt).isAfter(props.activityEndAt))
    return "岗位结束时间晚于活动结束时间，后端会拒绝";
  return "";
});

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: "请输入岗位名称", trigger: "blur" }],
  attendanceRoleCode: [
    { required: true, message: "请选择 / 输入考勤角色", trigger: "change" }
  ],
  capacity: [
    {
      required: !newFormInline.value.unlimitedCapacity,
      message: "请填写名额上限，或改选「不限名额」",
      trigger: "blur"
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
    label-width="98px"
  >
    <el-row :gutter="30">
      <re-col :value="12">
        <el-form-item label="岗位名称" prop="name">
          <el-input
            v-model="newFormInline.name"
            clearable
            maxlength="64"
            placeholder="如「现场指挥」「后勤保障」（同一活动内不重名）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="考勤角色" prop="attendanceRoleCode">
          <el-select
            v-if="attendanceRoleOptions.length"
            v-model="newFormInline.attendanceRoleCode"
            class="w-full!"
            clearable
            filterable
            placeholder="选择考勤角色（决定这个岗位怎么算工时与贡献）"
          >
            <el-option
              v-for="opt in attendanceRoleOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.attendanceRoleCode"
            clearable
            maxlength="64"
            placeholder="考勤角色字典 code（type=attendance_role）"
          />
        </el-form-item>
      </re-col>

      <re-col>
        <el-form-item label="名额" prop="capacity">
          <div class="pos-inline">
            <el-switch
              v-model="newFormInline.unlimitedCapacity"
              inline-prompt
              active-text="不限"
              inactive-text="限额"
            />
            <el-input-number
              v-if="!newFormInline.unlimitedCapacity"
              v-model="newFormInline.capacity"
              :min="1"
              :precision="0"
              controls-position="right"
              placeholder="名额上限"
            />
            <span class="pos-hint">
              {{
                newFormInline.unlimitedCapacity
                  ? "不限名额：报满也能继续报名"
                  : "报满后新报名会自动进入候补"
              }}
            </span>
          </div>
        </el-form-item>
      </re-col>

      <re-col>
        <el-form-item label="岗位时段">
          <div class="pos-block">
            <div class="pos-inline">
              <el-switch
                v-model="newFormInline.followActivityWindow"
                inline-prompt
                active-text="随活动"
                inactive-text="单独设"
              />
              <span class="pos-hint">
                {{
                  newFormInline.followActivityWindow
                    ? "沿用活动时间"
                    : "仅限活动时间窗之内"
                }}
                <template v-if="activityWindowText">
                  （活动：{{ activityWindowText }}）
                </template>
              </span>
            </div>
            <div v-if="!newFormInline.followActivityWindow" class="pos-inline">
              <el-date-picker
                v-model="newFormInline.startAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss"
                placeholder="岗位开始时间"
              />
              <el-date-picker
                v-model="newFormInline.endAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss"
                placeholder="岗位结束时间"
              />
            </div>
            <div v-if="windowWarning" class="pos-warn">{{ windowWarning }}</div>
          </div>
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="性别限制">
          <el-select
            v-if="genderRequirementOptions.length"
            v-model="newFormInline.genderRequirementCode"
            class="w-full!"
            clearable
            filterable
            placeholder="留空 = 不在活动之外额外限制"
          >
            <el-option
              v-for="opt in genderRequirementOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input
            v-else
            v-model="newFormInline.genderRequirementCode"
            clearable
            maxlength="64"
            placeholder="性别限制字典 code（可空）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="排序">
          <el-input-number
            v-model="newFormInline.sortOrder"
            :min="0"
            :precision="0"
            controls-position="right"
          />
          <span class="pos-hint ml-2">数字小的排前面</span>
        </el-form-item>
      </re-col>

      <re-col>
        <el-form-item label="岗位说明">
          <el-input
            v-model="newFormInline.description"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit
            placeholder="这个岗位具体做什么、有什么要求（可空）"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>

<style scoped>
.pos-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.pos-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.pos-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.pos-warn {
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-color-warning);
}
</style>
