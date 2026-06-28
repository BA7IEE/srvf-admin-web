<script setup lang="ts">
import dayjs from "dayjs";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import type {
  AttendanceSheetReviewDetail,
  AttendanceReviewMember
} from "@/api/srvf-attendance";

/** 只读展示组件:审核完整视图（活动摘要 + 单据 + records）。由考勤 tab 的「查看明细」在 drawer 内渲染。 */
defineProps<{
  detail: AttendanceSheetReviewDetail | null;
}>();

/** 共享字典：活动类型 / 活动状态 / 考勤单据状态 code → 中文（不臆造,查不到退化为原 code） */
const dict = useSrvfDictStoreHook();
dict.ensureTypes([
  "activity_type",
  "activity_status",
  "attendance_sheet_status"
]);

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
</script>

<template>
  <div v-if="detail" class="review-detail">
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
      <el-descriptions-item label="版本">
        {{ detail.sheet.version }}
      </el-descriptions-item>
      <el-descriptions-item label="提交人 ID">
        {{ detail.sheet.submitterUserId }}
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
        <template #default="{ row }">{{ row.roleCode || "—" }}</template>
      </el-table-column>
      <el-table-column label="签到" min-width="150">
        <template #default="{ row }">{{ fmt(row.checkInAt) }}</template>
      </el-table-column>
      <el-table-column label="签退" min-width="150">
        <template #default="{ row }">{{ fmt(row.checkOutAt) }}</template>
      </el-table-column>
      <el-table-column label="服务时长(h)" prop="serviceHours" min-width="100">
        <template #default="{ row }">{{ row.serviceHours ?? "—" }}</template>
      </el-table-column>
      <el-table-column
        label="出勤状态"
        prop="attendanceStatusCode"
        min-width="100"
      >
        <template #default="{ row }">
          {{ row.attendanceStatusCode || "—" }}
        </template>
      </el-table-column>
      <el-table-column label="贡献值" prop="contributionPoints" min-width="90">
        <template #default="{ row }">{{
          row.contributionPoints ?? "—"
        }}</template>
      </el-table-column>
    </el-table>
  </div>
  <el-empty v-else description="暂无审核明细" />
</template>

<style scoped lang="scss">
.review-detail__records-title {
  margin: 16px 0 8px;
  font-weight: 600;
}
</style>
