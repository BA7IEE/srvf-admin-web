<script setup lang="ts">
import { computed } from "vue";
import dayjs from "dayjs";
import {
  THRESHOLD_CODES,
  THRESHOLD_LABEL,
  APP_STATUS_LABEL,
  type RecruitmentApplication
} from "@/api/srvf-recruitment";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

/** 证件类型 code → 中文（document_type 字典;不可用时退回原 code） */
const dict = useSrvfDictStoreHook();
dict.ensureType("document_type");

type ThresholdCode = (typeof THRESHOLD_CODES)[number];

/** 招新报名详情(drawer 内只读 PII + 门槛开关)。marked/可编辑由父 hook 控制,toggle 经 emit 回父处理。 */
const props = defineProps<{
  app: RecruitmentApplication | null;
  canMark: boolean;
}>();
const emit = defineEmits<{
  (e: "mark", code: ThresholdCode, completed: boolean): void;
}>();

/** 仅 verified/pending_evaluation 可标门槛（后端口径） */
const THRESHOLD_EDITABLE_STATUS = ["verified", "pending_evaluation"];
const markEnabled = computed(
  () =>
    props.canMark &&
    !!props.app &&
    THRESHOLD_EDITABLE_STATUS.includes(props.app.statusCode)
);

function fmt(t?: string | null) {
  return t ? dayjs(t).format("YYYY-MM-DD HH:mm") : "—";
}
function marked(code: string) {
  return props.app?.thresholdMarks?.[code] === true;
}
function onToggle(code: ThresholdCode, val: boolean) {
  emit("mark", code, val);
}
</script>

<template>
  <div v-if="app" class="app-detail">
    <el-descriptions title="报名信息" :column="2" border size="small">
      <el-descriptions-item label="临时编号">
        {{ app.tempNo ?? "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <span :title="app.statusCode">
          {{ APP_STATUS_LABEL[app.statusCode] ?? "未知状态" }}
        </span>
      </el-descriptions-item>
      <el-descriptions-item label="姓名">
        {{ app.realName ?? "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="证件类型">
        {{ dict.label("document_type", app.documentTypeCode) }}
      </el-descriptions-item>
      <el-descriptions-item label="证件号">
        {{ app.idCardNumber ?? "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="手机">
        {{ app.phone ?? "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="性别">
        {{ app.genderCode ?? "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="年龄段">
        {{ app.ageGroup ?? "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="城市/区">
        {{ app.cityDistrict ?? "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="是否外籍">
        {{ app.isForeigner ? "是" : "否" }}
      </el-descriptions-item>
      <el-descriptions-item label="核验结果">
        {{ app.verifyOutcome ?? "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="淘汰阶段">
        {{ app.eliminationStage ?? "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="评定备注" :span="2">
        {{ app.evaluationNote ?? "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="报名时间" :span="2">
        {{ fmt(app.createdAt) }}
      </el-descriptions-item>
    </el-descriptions>

    <!-- 门槛跟踪（巡山×2/培训/红十字/BSAFE；末次完成自动→待综合评定） -->
    <div class="app-detail__thresholds-title">
      入队门槛<span v-if="!markEnabled" class="app-detail__hint"
        >（仅核验通过/待综合评定态可标）</span
      >
    </div>
    <div class="app-detail__thresholds">
      <div
        v-for="code in THRESHOLD_CODES"
        :key="code"
        class="app-detail__threshold"
      >
        <span class="app-detail__threshold-label">
          {{ THRESHOLD_LABEL[code] }}
        </span>
        <el-switch
          v-if="markEnabled"
          :model-value="marked(code)"
          @change="(val: any) => onToggle(code, !!val)"
        />
        <el-tag v-else :type="marked(code) ? 'success' : 'info'" size="small">
          {{ marked(code) ? "已完成" : "未完成" }}
        </el-tag>
      </div>
    </div>
  </div>
  <el-empty v-else description="暂无详情" />
</template>

<style scoped lang="scss">
.app-detail__thresholds-title {
  margin: 18px 0 10px;
  font-weight: 600;
}

.app-detail__hint {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.app-detail__thresholds {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}

.app-detail__threshold {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 120px;
}

.app-detail__threshold-label {
  min-width: 48px;
}
</style>
