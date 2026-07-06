<script lang="ts">
/** 表单下拉选项（value = 后端字典 code / Member.id）。 */
export type AttendanceFormOption = { label: string; value: string };

/** 可导入的已通过报名名单项。 */
export type AttendanceRegistrationImportOption = {
  registrationId: string;
  memberId: string;
  label: string;
};

/** 单条考勤记录表单模型；提交前由 hook 归一化为后端 `AttendanceRecordInputDto`。 */
export type AttendanceRecordFormModel = {
  memberId: string;
  roleCode: string;
  checkInAt: Date | string | null;
  checkOutAt: Date | string | null;
  /** 空 = 省略，后端按签到/签退自动计算 */
  serviceHours: string;
  attendanceStatusCode: string;
  note: string;
  registrationId: string;
  /** 空 = 省略，后端按贡献值规则预填 */
  contributionPoints: string;
};

export type AttendanceSheetFormModel = {
  records: AttendanceRecordFormModel[];
};

export function createEmptyRecord(): AttendanceRecordFormModel {
  return {
    memberId: "",
    roleCode: "",
    checkInAt: null,
    checkOutAt: null,
    serviceHours: "",
    attendanceStatusCode: "",
    note: "",
    registrationId: "",
    contributionPoints: ""
  };
}
</script>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormItemRule } from "element-plus";

/**
 * 考勤单据提交/编辑表单——移植自 7.11.0 fork 的考勤选人 UX 重构：
 * 队员下拉预取（宿主 hook 里一次拉 ≤1000 ACTIVE 队员）+ 本地搜索/手输 Member.id 兜底、
 * "导入已通过报名名单"一键铺满、批量字段只覆盖已填写项。字段/校验规则不臆造，
 * 严格对齐 `AttendanceRecordInputDto`（memberId/roleCode/checkInAt/checkOutAt/
 * attendanceStatusCode 必填，其余可选留空交后端）。
 */
const props = withDefaults(
  defineProps<{
    formInline?: AttendanceSheetFormModel;
    memberOptions?: AttendanceFormOption[];
    roleOptions?: AttendanceFormOption[];
    statusOptions?: AttendanceFormOption[];
    registrationOptions?: AttendanceRegistrationImportOption[];
    memberOptionsNotice?: string;
    mode?: "create" | "edit";
  }>(),
  {
    formInline: () => ({ records: [createEmptyRecord()] }),
    memberOptions: () => [],
    roleOptions: () => [],
    statusOptions: () => [],
    registrationOptions: () => [],
    memberOptionsNotice: "",
    mode: "create"
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const batchForm = ref({
  roleCode: "",
  attendanceStatusCode: "",
  checkInAt: null as Date | string | null,
  checkOutAt: null as Date | string | null,
  contributionPoints: ""
});

const requiredChange: FormItemRule[] = [
  { required: true, message: "该项为必填", trigger: "change" }
];

const memberIdRules: FormItemRule[] = [
  { required: true, message: "队员为必填", trigger: "change" },
  {
    min: 8,
    max: 64,
    message: "手输时请填写 8-64 位 Member.id",
    trigger: "change"
  }
];

function addRecord() {
  newFormInline.value.records.push(createEmptyRecord());
}

function removeRecord(index: number) {
  if (newFormInline.value.records.length <= 1) {
    newFormInline.value.records = [createEmptyRecord()];
    return;
  }
  newFormInline.value.records.splice(index, 1);
}

function recordHasContent(record: AttendanceRecordFormModel) {
  return Object.values(record).some(
    value => value !== null && String(value).trim() !== ""
  );
}

function defaultRoleCode() {
  return (
    batchForm.value.roleCode ||
    props.roleOptions.find(item => item.value === "member")?.value ||
    props.roleOptions[0]?.value ||
    ""
  );
}

function defaultAttendanceStatusCode() {
  return (
    batchForm.value.attendanceStatusCode ||
    props.statusOptions.find(item => item.value === "present")?.value ||
    props.statusOptions[0]?.value ||
    ""
  );
}

function getBatchContributionPoints() {
  return String(batchForm.value.contributionPoints ?? "").trim();
}

function buildImportedRecord(
  item: AttendanceRegistrationImportOption
): AttendanceRecordFormModel {
  return {
    ...createEmptyRecord(),
    memberId: item.memberId,
    registrationId: item.registrationId,
    roleCode: defaultRoleCode(),
    attendanceStatusCode: defaultAttendanceStatusCode(),
    checkInAt: batchForm.value.checkInAt ?? null,
    checkOutAt: batchForm.value.checkOutAt ?? null,
    contributionPoints: getBatchContributionPoints()
  };
}

async function importApprovedRegistrations() {
  if (!props.registrationOptions.length) return;
  const shouldConfirm = newFormInline.value.records.some(recordHasContent);
  if (shouldConfirm) {
    try {
      await ElMessageBox.confirm(
        "将用已通过报名名单替换当前所有考勤记录，已填写内容不会保留。确定继续吗？",
        "导入已通过报名名单",
        {
          confirmButtonText: "确定导入",
          cancelButtonText: "取消",
          type: "warning"
        }
      );
    } catch {
      return;
    }
  }
  newFormInline.value.records =
    props.registrationOptions.map(buildImportedRecord);
  ElMessage.success(
    `已导入 ${props.registrationOptions.length} 条通过报名记录`
  );
}

function applyBatchFields() {
  const patch: Partial<AttendanceRecordFormModel> = {};
  if (batchForm.value.roleCode) patch.roleCode = batchForm.value.roleCode;
  if (batchForm.value.attendanceStatusCode) {
    patch.attendanceStatusCode = batchForm.value.attendanceStatusCode;
  }
  if (batchForm.value.checkInAt) patch.checkInAt = batchForm.value.checkInAt;
  if (batchForm.value.checkOutAt) patch.checkOutAt = batchForm.value.checkOutAt;
  const contributionPoints = getBatchContributionPoints();
  if (contributionPoints) patch.contributionPoints = contributionPoints;

  if (!Object.keys(patch).length) {
    ElMessage.warning("请先填写至少一个批量字段");
    return;
  }
  if (!newFormInline.value.records.length) {
    newFormInline.value.records = [createEmptyRecord()];
  }
  newFormInline.value.records.forEach(record => {
    Object.assign(record, patch);
  });
  ElMessage.success(
    `已批量应用到 ${newFormInline.value.records.length} 条记录`
  );
}

function clearBatchFields() {
  batchForm.value = {
    roleCode: "",
    attendanceStatusCode: "",
    checkInAt: null,
    checkOutAt: null,
    contributionPoints: ""
  };
}

function handleRegistrationChange(
  record: AttendanceRecordFormModel,
  registrationId: string
) {
  const registration = props.registrationOptions.find(
    item => item.registrationId === registrationId
  );
  if (!registration) return;
  record.memberId = registration.memberId;
}

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    label-width="104px"
    class="attendance-form"
  >
    <el-alert
      class="mb-3"
      type="info"
      show-icon
      :closable="false"
      title="提交规则"
      description="每次提交/编辑都会按 records 整组写入。服务时长留空时由后端根据签到/签退自动计算；贡献值留空时由后端按规则预填。"
    />

    <el-alert
      v-if="memberOptionsNotice"
      class="mb-3"
      type="info"
      show-icon
      :closable="false"
      :title="memberOptionsNotice"
    />

    <div class="attendance-form__tools">
      <el-button
        type="success"
        plain
        :disabled="!registrationOptions.length"
        @click="importApprovedRegistrations"
      >
        导入已通过报名名单
        <span v-if="registrationOptions.length">
          （{{ registrationOptions.length }} 人）
        </span>
      </el-button>
      <span class="attendance-form__tools-tip">
        导入后会自动带入队员与报名记录 ID；可先填写下方批量项，再导入生成完整
        records。
      </span>
    </div>

    <el-card shadow="never" class="attendance-form__batch">
      <template #header>
        <div class="attendance-form__batch-head">
          <span>批量填充</span>
          <span>只覆盖已填写的批量字段；留空字段不会影响现有记录。</span>
        </div>
      </template>

      <el-row :gutter="12">
        <el-col :xs="24" :sm="12" :md="8">
          <el-form-item label="批量考勤角色">
            <el-select
              v-if="roleOptions.length"
              v-model="batchForm.roleCode"
              class="w-full!"
              clearable
              filterable
              placeholder="选择后可批量应用"
            >
              <el-option
                v-for="opt in roleOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-input
              v-else
              v-model="batchForm.roleCode"
              clearable
              maxlength="64"
              placeholder="attendance_role code"
            />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8">
          <el-form-item label="批量出勤状态">
            <el-select
              v-if="statusOptions.length"
              v-model="batchForm.attendanceStatusCode"
              class="w-full!"
              clearable
              filterable
              placeholder="默认建议 present"
            >
              <el-option
                v-for="opt in statusOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-input
              v-else
              v-model="batchForm.attendanceStatusCode"
              clearable
              maxlength="64"
              placeholder="attendance_status code"
            />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8">
          <el-form-item label="批量贡献值">
            <el-input
              v-model="batchForm.contributionPoints"
              clearable
              inputmode="decimal"
              placeholder="如 1.5；留空则不覆盖"
            />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="批量签到时间">
            <el-date-picker
              v-model="batchForm.checkInAt"
              class="w-full!"
              type="datetime"
              placeholder="选择后可批量应用"
            />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="批量签退时间">
            <el-date-picker
              v-model="batchForm.checkOutAt"
              class="w-full!"
              type="datetime"
              placeholder="选择后可批量应用"
            />
          </el-form-item>
        </el-col>

        <el-col :span="24" class="attendance-form__batch-actions">
          <el-button type="primary" plain @click="applyBatchFields">
            应用到全部记录
          </el-button>
          <el-button plain @click="clearBatchFields">清空批量项</el-button>
        </el-col>
      </el-row>
    </el-card>

    <div
      v-for="(record, index) in newFormInline.records"
      :key="index"
      class="attendance-form__record"
    >
      <div class="attendance-form__record-head">
        <span>考勤记录 {{ index + 1 }}</span>
        <el-button link type="danger" @click="removeRecord(index)">
          移除
        </el-button>
      </div>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item
            label="队员"
            :prop="`records.${index}.memberId`"
            :rules="memberIdRules"
          >
            <el-select
              v-if="memberOptions.length"
              v-model="record.memberId"
              class="w-full!"
              clearable
              filterable
              allow-create
              default-first-option
              placeholder="选择队员；未找到可手输 Member.id"
            >
              <el-option
                v-for="opt in memberOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-input
              v-else
              v-model="record.memberId"
              disabled
              placeholder="队员选项不可用，可用「导入已通过报名」带入"
            />
            <div class="attendance-form__field-tip">
              可按姓名/编号搜索已加载队员；手输时必须填写 Member.id。
            </div>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item
            label="考勤角色"
            :prop="`records.${index}.roleCode`"
            :rules="requiredChange"
          >
            <el-select
              v-if="roleOptions.length"
              v-model="record.roleCode"
              class="w-full!"
              clearable
              filterable
              placeholder="选择考勤角色"
            >
              <el-option
                v-for="opt in roleOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-input
              v-else
              v-model="record.roleCode"
              clearable
              maxlength="64"
              placeholder="attendance_role code"
            />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item
            label="签到时间"
            :prop="`records.${index}.checkInAt`"
            :rules="requiredChange"
          >
            <el-date-picker
              v-model="record.checkInAt"
              class="w-full!"
              type="datetime"
              placeholder="选择签到时间"
            />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item
            label="签退时间"
            :prop="`records.${index}.checkOutAt`"
            :rules="requiredChange"
          >
            <el-date-picker
              v-model="record.checkOutAt"
              class="w-full!"
              type="datetime"
              placeholder="选择签退时间"
            />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item
            label="出勤状态"
            :prop="`records.${index}.attendanceStatusCode`"
            :rules="requiredChange"
          >
            <el-select
              v-if="statusOptions.length"
              v-model="record.attendanceStatusCode"
              class="w-full!"
              clearable
              filterable
              placeholder="选择出勤状态"
            >
              <el-option
                v-for="opt in statusOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-input
              v-else
              v-model="record.attendanceStatusCode"
              clearable
              maxlength="64"
              placeholder="attendance_status code"
            />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="服务时长(h)">
            <el-input
              v-model="record.serviceHours"
              clearable
              inputmode="decimal"
              placeholder="留空则后端自动计算"
            />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="贡献值">
            <el-input
              v-model="record.contributionPoints"
              clearable
              inputmode="decimal"
              placeholder="留空则后端按规则预填"
            />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="报名记录">
            <el-select
              v-if="registrationOptions.length"
              v-model="record.registrationId"
              class="w-full!"
              clearable
              filterable
              placeholder="可选；可按姓名/编号/报名短 ID 搜索"
              @change="handleRegistrationChange(record, String($event || ''))"
            >
              <el-option
                v-for="opt in registrationOptions"
                :key="opt.registrationId"
                :label="opt.label"
                :value="opt.registrationId"
              />
            </el-select>
            <el-input
              v-else
              v-model="record.registrationId"
              clearable
              maxlength="64"
              placeholder="可选；关联 ActivityRegistration.id"
            />
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item
            label="备注"
            :prop="`records.${index}.note`"
            :rules="[
              {
                max: 500,
                message: '备注不能超过 500 字',
                trigger: 'blur'
              }
            ]"
          >
            <el-input
              v-model="record.note"
              type="textarea"
              maxlength="500"
              show-word-limit
              :autosize="{ minRows: 2, maxRows: 4 }"
              placeholder="可选"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <el-button type="primary" plain class="w-full!" @click="addRecord">
      添加一条考勤记录
    </el-button>
  </el-form>
</template>

<style scoped lang="scss">
.attendance-form__tools {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.attendance-form__tools-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.attendance-form__batch {
  margin-bottom: 12px;
  background: var(--el-fill-color-extra-light);
}

.attendance-form__batch-head {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;

  span:first-child {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  span:last-child {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.attendance-form__batch-actions {
  display: flex;
  justify-content: flex-end;
}

.attendance-form__record {
  padding: 12px 12px 2px;
  margin-bottom: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.attendance-form__field-tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.attendance-form__record-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 600;
}
</style>
