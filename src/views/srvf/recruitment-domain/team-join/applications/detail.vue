<script setup lang="ts">
import dayjs from "dayjs";
import {
  GATE_LABEL,
  TJ_APP_STATUS_LABEL,
  type TeamJoinApplication
} from "@/api/srvf-team-join";

/** 入队申请详情(只读)：成员/状态/贡献值/候选部门 + gates 实况表。 */
defineProps<{
  app: TeamJoinApplication | null;
}>();

function fmtDate(t?: string | null) {
  return t ? dayjs(t).format("YYYY-MM-DD") : "—";
}
function fmtDt(t?: string | null) {
  return t ? dayjs(t).format("YYYY-MM-DD HH:mm") : "—";
}
</script>

<template>
  <div v-if="app" class="tj-detail">
    <el-descriptions title="申请信息" :column="2" border size="small">
      <el-descriptions-item label="队员">
        {{ app.memberDisplayName ?? app.memberNo ?? app.memberId }}
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <span :title="app.statusCode">
          {{ TJ_APP_STATUS_LABEL[app.statusCode] ?? "未知状态" }}
        </span>
      </el-descriptions-item>
      <el-descriptions-item label="通用门槛">
        {{ app.generalGatesSatisfied ? "已满足" : "未满足" }}
      </el-descriptions-item>
      <el-descriptions-item label="贡献值">
        {{ app.contributionPoints ?? "—" }}
        <el-tag
          v-if="app.contributionSatisfied != null"
          :type="app.contributionSatisfied ? 'success' : 'info'"
          size="small"
          class="ml-1"
        >
          {{ app.contributionSatisfied ? "达标" : "未达标" }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="候选部门数">
        {{ app.targetOrganizationIds.length }}
      </el-descriptions-item>
      <el-descriptions-item label="选定部门">
        {{ app.selectedOrganizationId ?? "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="综合评估">
        {{ fmtDt(app.evaluatedAt) }}
      </el-descriptions-item>
      <el-descriptions-item label="评估有效期至">
        {{ fmtDate(app.evaluationExtendedUntil) }}
      </el-descriptions-item>
      <el-descriptions-item label="评估备注" :span="2">
        {{ app.evaluationNote ?? "—" }}
      </el-descriptions-item>
      <el-descriptions-item label="入队时间" :span="2">
        {{ fmtDt(app.joinedAt) }}
      </el-descriptions-item>
    </el-descriptions>

    <div class="tj-detail__gates-title">
      考核 gate 实况（{{ app.gates.length }} 项）
    </div>
    <el-table :data="app.gates" border size="small" row-key="code">
      <el-table-column label="考核项" min-width="140">
        <template #default="{ row }">
          {{ GATE_LABEL[row.code] ?? row.code }}
        </template>
      </el-table-column>
      <el-table-column label="类别" min-width="90">
        <template #default="{ row }">
          <el-tag :type="row.professional ? 'warning' : 'info'" size="small">
            {{ row.professional ? "专业队" : "通用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="结果" min-width="90">
        <template #default="{ row }">
          <span v-if="!row.marked">未标记</span>
          <el-tag v-else :type="row.passed ? 'success' : 'danger'" size="small">
            {{ row.passed ? "通过" : "未通过" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="当前满足" min-width="90">
        <template #default="{ row }">
          <el-tag :type="row.satisfied ? 'success' : 'info'" size="small">
            {{ row.satisfied ? "是" : "否" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="完成日" min-width="120">
        <template #default="{ row }">{{
          fmtDate(row.completionDate)
        }}</template>
      </el-table-column>
      <el-table-column label="延长期至" min-width="120">
        <template #default="{ row }">{{ fmtDate(row.extendedUntil) }}</template>
      </el-table-column>
    </el-table>
  </div>
  <el-empty v-else description="暂无详情" />
</template>

<style scoped lang="scss">
.tj-detail__gates-title {
  margin: 18px 0 10px;
  font-weight: 600;
}
</style>
