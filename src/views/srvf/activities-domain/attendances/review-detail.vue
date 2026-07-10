<script setup lang="ts">
import dayjs from "dayjs";
import { ref, computed, watch } from "vue";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { resolveLabelMap } from "@/api/srvf-meta";
import { SrvfFlowSteps } from "@/srvf-kit";
import type {
  AttendanceSheetReviewDetail,
  AttendanceReviewMember
} from "@/api/srvf-attendance";

import PrinterLine from "~icons/ri/printer-line";

/** 只读展示组件:审核完整视图（活动摘要 + 单据 + records）。由考勤 tab 的「查看明细」在 drawer 内渲染。 */
const props = defineProps<{
  detail: AttendanceSheetReviewDetail | null;
}>();

/** 共享字典：活动类型 / 活动状态 / 考勤单据状态 / 考勤角色 / 出勤状态 code → 中文（不臆造,查不到退化为原 code） */
const dict = useSrvfDictStoreHook();
dict.ensureTypes([
  "activity_type",
  "activity_status",
  "attendance_sheet_status",
  "attendance_role",
  "attendance_status"
]);

/** 提交人 User.id → 展示名（resolve-labels 单条解析；未命中/失败回落原 id） */
const submitterLabel = ref("");
watch(
  () => props.detail?.sheet.submitterUserId,
  async id => {
    submitterLabel.value = "";
    if (!id) return;
    const map = await resolveLabelMap("user", [id]);
    submitterLabel.value = map[id] ?? "";
  },
  { immediate: true }
);

/**
 * 考勤审批步骤条（UX 升级蓝图 §4.5-B）：把契约状态机
 * pending → pending_final_review → approved（rejected / final_rejected 为驳回分支）
 * 画成 提交 → 一级审核 → 终审 → 生效 四步;仅展示,不承载流转。
 * 终审节点固定提示「提交人本人不能终审」(后端 22074 约束的预防面)。
 */
const sheetFlow = computed(() => {
  const sheet = props.detail?.sheet;
  const steps = [
    {
      title: "提交",
      description: sheet?.submittedAt
        ? dayjs(sheet.submittedAt).format("MM-DD HH:mm")
        : undefined
    },
    {
      title: "一级审核",
      description: sheet?.reviewedAt
        ? dayjs(sheet.reviewedAt).format("MM-DD HH:mm")
        : "待一级审核"
    },
    { title: "终审", description: "提交人本人不能终审" },
    { title: "生效", description: "贡献值正式落分" }
  ];
  switch (sheet?.statusCode) {
    case "pending":
      return { steps, active: 1, status: "process" as const };
    case "pending_final_review":
      return { steps, active: 2, status: "process" as const };
    case "approved":
      return { steps, active: 4, status: "success" as const };
    case "rejected":
      return { steps, active: 1, status: "error" as const };
    case "final_rejected":
      return { steps, active: 2, status: "error" as const };
    default:
      return { steps, active: 0, status: "process" as const };
  }
});

const SHEET_STATUS_TAG: Record<
  string,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  pending: "warning",
  pending_final_review: "warning",
  approved: "success",
  rejected: "danger",
  final_rejected: "danger"
};

function fmt(t?: string | null) {
  return t ? dayjs(t).format("YYYY-MM-DD HH:mm") : "—";
}
/** 队员主语:嵌套 member 显示名 → 编号 → memberId（member 内嵌字段未在 schema 声明,防御取值） */
function memberSubject(member: AttendanceReviewMember, memberId: string) {
  return member?.displayName ?? member?.memberNo ?? memberId;
}

/** 原生 window.print 范式：配合下方全局 @media print 规则，只打印 .attendance-print-area。 */
function handlePrint() {
  window.print();
}
</script>

<template>
  <div v-if="detail" class="review-detail">
    <div class="review-detail__toolbar no-print">
      <el-button :icon="useRenderIcon(PrinterLine)" @click="handlePrint">
        打印
      </el-button>
    </div>
    <div class="attendance-print-area">
      <!-- 活动摘要 -->
      <el-descriptions title="活动摘要" :column="2" border size="small">
        <el-descriptions-item label="活动">
          {{ detail.activity.title }}
        </el-descriptions-item>
        <el-descriptions-item label="类型">
          {{ dict.label("activity_type", detail.activity.activityTypeCode) }}
        </el-descriptions-item>
        <el-descriptions-item label="地点">
          {{ detail.activity.location || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="活动状态">
          {{ dict.label("activity_status", detail.activity.statusCode) }}
        </el-descriptions-item>
        <el-descriptions-item label="开始">
          {{ fmt(detail.activity.startAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="结束">
          {{ fmt(detail.activity.endAt) }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 审批进度 -->
      <SrvfFlowSteps
        class="mt-4"
        :steps="sheetFlow.steps"
        :active="sheetFlow.active"
        :process-status="sheetFlow.status"
      />

      <!-- 单据详情 -->
      <el-descriptions
        title="单据详情"
        :column="2"
        border
        size="small"
        class="mt-4"
      >
        <el-descriptions-item label="审核状态">
          <el-tag :type="SHEET_STATUS_TAG[detail.sheet.statusCode] ?? 'info'">
            {{ dict.label("attendance_sheet_status", detail.sheet.statusCode) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="提交版次">
          第 {{ detail.sheet.version }} 版
        </el-descriptions-item>
        <el-descriptions-item label="提交人">
          {{ submitterLabel || detail.sheet.submitterUserId }}
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">
          {{ fmt(detail.sheet.submittedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="一级审核备注" :span="2">
          {{ detail.sheet.reviewNote || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="终审备注" :span="2">
          {{ detail.sheet.finalReviewNote || "—" }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 考勤记录 -->
      <div class="review-detail__records-title">
        考勤记录（{{ detail.records.length }} 条）
      </div>
      <el-table :data="detail.records" border size="small" row-key="id">
        <el-table-column label="队员" min-width="140">
          <template #default="{ row }">
            {{ memberSubject(row.member, row.memberId) }}
          </template>
        </el-table-column>
        <el-table-column label="角色" prop="roleCode" min-width="100">
          <template #default="{ row }">
            {{
              row.roleCode ? dict.label("attendance_role", row.roleCode) : "—"
            }}
          </template>
        </el-table-column>
        <el-table-column label="签到" min-width="150">
          <template #default="{ row }">{{ fmt(row.checkInAt) }}</template>
        </el-table-column>
        <el-table-column label="签退" min-width="150">
          <template #default="{ row }">{{ fmt(row.checkOutAt) }}</template>
        </el-table-column>
        <el-table-column
          label="服务时长(h)"
          prop="serviceHours"
          min-width="100"
        >
          <template #default="{ row }">{{ row.serviceHours ?? "—" }}</template>
        </el-table-column>
        <el-table-column
          label="出勤状态"
          prop="attendanceStatusCode"
          min-width="100"
        >
          <template #default="{ row }">
            {{
              row.attendanceStatusCode
                ? dict.label("attendance_status", row.attendanceStatusCode)
                : "—"
            }}
          </template>
        </el-table-column>
        <el-table-column
          label="贡献值"
          prop="contributionPoints"
          min-width="90"
        >
          <template #default="{ row }">{{
            row.contributionPoints ?? "—"
          }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
  <el-empty v-else description="暂无审核明细" />
</template>

<style scoped lang="scss">
.review-detail__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.review-detail__records-title {
  margin: 16px 0 8px;
  font-weight: 600;
}
</style>

<style lang="scss">
/**
 * 原生 window.print 范式（零新依赖）：打印时把 body 内所有内容先整体隐藏，
 * 只让 .attendance-print-area 极其子孙可见，再把它绝对定位回页面左上角——
 * 经典的"只打印页面里某一块"技巧，避免打印出侧栏/顶栏/drawer 遮罩等应用外壳。
 * 未加 scoped：这条规则本来就需要跳出本组件、影响整个 body，属于有意为之的
 * 全局样式，不是作用域泄漏。
 */
@media print {
  body * {
    visibility: hidden;
  }

  .attendance-print-area,
  .attendance-print-area * {
    visibility: visible;
  }

  .attendance-print-area {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }

  .no-print {
    display: none !important;
  }
}
</style>
