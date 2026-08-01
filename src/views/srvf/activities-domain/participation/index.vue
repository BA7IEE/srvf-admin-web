<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import dayjs from "dayjs";
import { message } from "@/utils/message";
import { bizErrorMessage } from "@/api/srvf-error";
import { hasPerms } from "@/utils/auth";
import { SrvfPageIntro, SrvfPermEmpty, SrvfRemoteSelect } from "@/srvf-kit";
import { getOrgOptions, type OrgOptionItem } from "@/api/srvf-organization";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import {
  getParticipationOverview,
  DURATION_BUCKETS,
  type ParticipationOverviewMonth
} from "@/api/srvf-meta";
import MonthlyChart from "./monthly-chart.vue";

defineOptions({ name: "SrvfParticipationOverview" });

/**
 * 参与月报（隐藏叶页，从工作台入口进）。
 *
 * 端点本身只要登录，但**数据范围是两项读权限可见组织范围的交集**
 * （`attendance.read.sheet` ∩ `activity-registration.read.record`）。
 * 交集为空时后端返空数组而不是报错——所以入口与本页都按两码同时持有显隐，
 * 否则无权的人会看到一张空表，误以为「这几个月没人参加活动」。
 */
const canRead =
  hasPerms("attendance.read.sheet") &&
  hasPerms("activity-registration.read.record");

const dict = useSrvfDictStoreHook();
dict.ensureType("activity_type");

const loading = ref(false);
const months = ref<ParticipationOverviewMonth[]>([]);

/** 默认看最近 12 个自然月 */
const dateRange = ref<[string, string]>([
  dayjs().subtract(11, "month").startOf("month").format("YYYY-MM-DD"),
  dayjs().endOf("month").format("YYYY-MM-DD")
]);
const organizationId = ref("");
const includeDescendants = ref(true);
const activityTypeCode = ref("");

const orgOptions = ref<OrgOptionItem[]>([]);
async function loadOrgs(q?: string) {
  try {
    const { code, data } = await getOrgOptions({
      status: "ACTIVE",
      limit: 100,
      ...(q ? { q } : {})
    });
    if (code === 0) orgOptions.value = data.items;
  } catch {
    // 组织下拉拉不到不影响主表，静默降级为「不按组织筛」
  }
}

const orgSelectOptions = computed(() =>
  orgOptions.value.map(o => ({ label: o.label, value: o.id }))
);

const activityTypeOptions = computed(() => [
  { value: "", label: "全部活动类型" },
  ...dict.options("activity_type")
]);

async function onSearch() {
  if (!canRead) return;
  loading.value = true;
  try {
    const { code, data } = await getParticipationOverview({
      dateFrom: dateRange.value?.[0],
      dateTo: dateRange.value?.[1],
      ...(organizationId.value
        ? {
            organizationId: organizationId.value,
            includeDescendants: includeDescendants.value
          }
        : {}),
      ...(activityTypeCode.value
        ? { activityTypeCode: activityTypeCode.value }
        : {})
    });
    if (code === 0) months.value = data.months;
  } catch (error: any) {
    message(bizErrorMessage(error, "加载参与月报失败"), { type: "error" });
  } finally {
    loading.value = false;
  }
}

function onReset() {
  dateRange.value = [
    dayjs().subtract(11, "month").startOf("month").format("YYYY-MM-DD"),
    dayjs().endOf("month").format("YYYY-MM-DD")
  ];
  organizationId.value = "";
  includeDescendants.value = true;
  activityTypeCode.value = "";
  onSearch();
}

/* ------------------------------- 图表数据投影 ------------------------------- */
const chartMonths = computed(() => months.value.map(m => m.month));
const chartActivityCounts = computed(() =>
  months.value.map(m => m.activityCount)
);
const chartParticipationCounts = computed(() =>
  months.value.map(m => m.participationCount)
);
const chartAttendanceRates = computed(() =>
  months.value.map(m => m.averageAttendanceRate)
);

function pct(v: number) {
  return `${(v * 100).toFixed(2)}%`;
}

onMounted(() => {
  if (!canRead) return;
  loadOrgs();
  onSearch();
});
</script>

<template>
  <div class="main">
    <SrvfPageIntro
      title="参与月报"
      description="按月看活动数、参与人次、到场率与服务时长分布。数据与每个活动详情里的「参与核对」同源，都来自已终审的考勤单——两处对不上时以活动详情为准。"
    />

    <SrvfPermEmpty
      v-if="!canRead"
      action="查看参与月报"
      code="attendance.read.sheet + activity-registration.read.record"
    />

    <template v-else>
      <el-card shadow="never" class="mb-3">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="活动日期">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              start-placeholder="开始"
              end-placeholder="结束"
              :clearable="false"
            />
          </el-form-item>
          <el-form-item label="组织">
            <SrvfRemoteSelect
              v-model="organizationId"
              :options="orgSelectOptions"
              placeholder="全部组织"
              class="w-52!"
            />
          </el-form-item>
          <el-form-item>
            <el-checkbox
              v-model="includeDescendants"
              :disabled="!organizationId"
            >
              含下级组织
            </el-checkbox>
          </el-form-item>
          <el-form-item label="活动类型">
            <el-select v-model="activityTypeCode" class="w-40!">
              <el-option
                v-for="o in activityTypeOptions"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="onSearch">
              查询
            </el-button>
            <el-button @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never" class="mb-3">
        <template #header>
          <span class="card-title">趋势</span>
        </template>
        <MonthlyChart
          :months="chartMonths"
          :activity-counts="chartActivityCounts"
          :participation-counts="chartParticipationCounts"
          :attendance-rates="chartAttendanceRates"
          :loading="loading"
        />
      </el-card>

      <el-card shadow="never">
        <template #header>
          <span class="card-title">按月明细</span>
        </template>
        <el-table
          v-loading="loading"
          :data="months"
          border
          size="small"
          row-key="month"
        >
          <el-table-column label="月份" prop="month" min-width="90" fixed />
          <el-table-column label="活动数" prop="activityCount" min-width="80" />
          <el-table-column
            label="已完结"
            prop="completedActivityCount"
            min-width="80"
          />
          <el-table-column
            label="参与人次"
            prop="participationCount"
            min-width="90"
          />
          <el-table-column label="服务时长" min-width="100">
            <template #default="{ row }"
              >{{ row.totalServiceHours }} h</template
            >
          </el-table-column>
          <el-table-column label="到场率" min-width="90">
            <template #default="{ row }">
              {{ pct(row.averageAttendanceRate) }}
            </template>
          </el-table-column>
          <el-table-column label="缺席率" min-width="90">
            <template #default="{ row }">{{ pct(row.noShowRate) }}</template>
          </el-table-column>
          <el-table-column
            v-for="b in DURATION_BUCKETS"
            :key="b.key"
            :label="b.label"
            min-width="90"
          >
            <template #default="{ row }">
              {{ row.durationHistogram[b.key] }}
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="这段时间没有命中的活动" />
          </template>
        </el-table>
        <div class="table-note">
          到场率与缺席率<b>只统计已完结的活动</b>——没完结的活动考勤还没终审，
          算进去只会把比率拉低。参与人次是逐活动的到场人数相加，
          同一个人参加两个活动算两次。
        </div>
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.card-title {
  font-weight: 600;
}

.filter-form {
  margin-bottom: -18px;
}

.table-note {
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}
</style>
