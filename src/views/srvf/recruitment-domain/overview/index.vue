<script setup lang="ts">
import { bizErrorMessage } from "@/api/srvf-error";
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { hasPerms } from "@/utils/auth";
import { message } from "@/utils/message";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { SrvfPageIntro, SrvfPermEmpty } from "@/srvf-kit";
import {
  getRecruitmentCycles,
  getCycleStats,
  type RecruitmentCycle,
  type RecruitmentCycleStats
} from "@/api/srvf-recruitment";
import {
  getTeamJoinCycles,
  getTeamJoinApplications,
  TJ_APP_STATUS_LABEL,
  type TeamJoinCycle
} from "@/api/srvf-team-join";

defineOptions({
  name: "SrvfRecruitmentOverview"
});

/**
 * 招新总览（UX 升级蓝图 §4.5-C 流程四件套之「漏斗」）：把「两道门」连成一条可视链路——
 * 门一(招新):公开报名 → 核验/考核 → 评定 → 发放队员编号(成为志愿者);
 * 门二(入队):入队申请 → 考核与综合评定 → 一键入队(成为正式队员)。
 * 数据来源纪律:门一 = 后端专用聚合 `cycles/:id/stats`;门二 = 各状态列表分页 total
 * (后端 handoff 明示 team-join 计数「可用各列表分页 total 自拼」),不发明统计端点。
 */
const router = useRouter();

const canReadRecruitment = hasPerms("recruitment-application.read.record");
const canReadTeamJoin = hasPerms("team-join-application.read.record");

/* ----------------------------- 门一 · 招新 ----------------------------- */
const recCycles = ref<RecruitmentCycle[]>([]);
const recCycleId = ref("");
const recStats = ref<RecruitmentCycleStats | null>(null);
const recLoading = ref(false);

type FunnelBlock = { label: string; value: number; hint?: string };

const recFunnel = computed<FunnelBlock[]>(() => {
  const s = recStats.value;
  if (!s) return [];
  return [
    {
      label: "待人工处理",
      value: s.pending.manualTotal,
      hint: "报名后需人工核验的申请"
    },
    { label: "门槛追踪中", value: s.threshold.tracking, hint: "考核项进行中" },
    { label: "待评定", value: s.pending.pendingEvaluation },
    { label: "评定通过", value: s.evaluation.passed },
    { label: "公示中", value: s.issuance.inPublicity },
    {
      label: "已发编号",
      value: s.issuance.promoted,
      hint: "已建立队员档案,成为志愿者"
    }
  ];
});

async function loadRecCycles() {
  try {
    const { code, data } = await getRecruitmentCycles({
      page: 1,
      pageSize: 50
    });
    if (code === 0) {
      recCycles.value = data.items;
      if (!recCycleId.value && data.items.length) {
        recCycleId.value = data.items[0].id;
        await loadRecStats();
      }
    }
  } catch (error: any) {
    message(bizErrorMessage(error, "加载招新轮次失败"), { type: "error" });
  }
}

async function loadRecStats() {
  if (!recCycleId.value) return;
  recLoading.value = true;
  try {
    const { code, data } = await getCycleStats(recCycleId.value);
    if (code === 0) recStats.value = data;
  } catch (error: any) {
    recStats.value = null;
    message(bizErrorMessage(error, "加载招新阶段人数失败"), { type: "error" });
  } finally {
    recLoading.value = false;
  }
}

function goRecCockpit() {
  const cycle = recCycles.value.find(c => c.id === recCycleId.value);
  if (!cycle) return;
  useMultiTagsStoreHook().handleTags("push", {
    path: "/srvf/recruitment-domain/cycles/:id",
    name: "SrvfRecruitmentCycleCockpit",
    params: { id: cycle.id },
    meta: { title: `招新 · ${cycle.name}` }
  });
  router.push(`/srvf/recruitment-domain/cycles/${cycle.id}`);
}

/* ----------------------------- 门二 · 入队 ----------------------------- */
const tjCycles = ref<TeamJoinCycle[]>([]);
const tjCycleId = ref("");
const tjLoading = ref(false);
/** statusCode → 数量（各状态一次 pageSize=1 查询取 total 自拼,后端 handoff 背书） */
const tjCounts = ref<Record<string, number>>({});

/** 门二漏斗阶段顺序（contract 闭集 TJ_APP_STATUS_LABEL 的业务推进序;rejected 单列尾注） */
const TJ_FUNNEL_ORDER = ["joining", "pending_evaluation", "approved", "joined"];

const tjFunnel = computed<FunnelBlock[]>(() =>
  TJ_FUNNEL_ORDER.map(code => ({
    label: TJ_APP_STATUS_LABEL[code] ?? code,
    value: tjCounts.value[code] ?? 0
  }))
);
const tjRejected = computed(() => tjCounts.value["rejected"] ?? 0);

async function loadTjCycles() {
  try {
    const { code, data } = await getTeamJoinCycles({ page: 1, pageSize: 50 });
    if (code === 0) {
      tjCycles.value = data.items;
      if (!tjCycleId.value && data.items.length) {
        tjCycleId.value = data.items[0].id;
        await loadTjCounts();
      }
    }
  } catch (error: any) {
    message(bizErrorMessage(error, "加载入队轮次失败"), { type: "error" });
  }
}

async function loadTjCounts() {
  if (!tjCycleId.value) return;
  tjLoading.value = true;
  try {
    const codes = [...TJ_FUNNEL_ORDER, "rejected"];
    const results = await Promise.all(
      codes.map(statusCode =>
        getTeamJoinApplications({
          cycleId: tjCycleId.value,
          statusCode,
          page: 1,
          pageSize: 1
        })
          .then(res => (res.code === 0 ? res.data.total : 0))
          .catch(() => 0)
      )
    );
    tjCounts.value = Object.fromEntries(codes.map((c, i) => [c, results[i]]));
  } finally {
    tjLoading.value = false;
  }
}

function goTjCockpit() {
  const cycle = tjCycles.value.find(c => c.id === tjCycleId.value);
  if (!cycle) return;
  useMultiTagsStoreHook().handleTags("push", {
    path: "/srvf/recruitment-domain/team-join/:id",
    name: "SrvfTeamJoinCycleCockpit",
    params: { id: cycle.id },
    meta: { title: `入队 · ${cycle.name}` }
  });
  router.push(`/srvf/recruitment-domain/team-join/${cycle.id}`);
}

onMounted(() => {
  if (canReadRecruitment) loadRecCycles();
  if (canReadTeamJoin) loadTjCycles();
});
</script>

<template>
  <div class="main">
    <SrvfPageIntro
      class="mb-2"
      title="两道门总览：第一道门「招新」把报名者变成持编号的志愿者，第二道门「入队」把志愿者变成正式队员。选择轮次查看各阶段人数，点「去处理」进入对应详情页操作。"
    />

    <!-- 门一 · 招新 -->
    <el-card shadow="never" class="mb-3">
      <template #header>
        <div class="gate-header">
          <span class="gate-title">门一 · 招新（报名 → 发放队员编号）</span>
          <div class="gate-actions">
            <el-select
              v-model="recCycleId"
              placeholder="选择招新轮次"
              size="small"
              style="width: 200px"
              @change="loadRecStats"
            >
              <el-option
                v-for="c in recCycles"
                :key="c.id"
                :label="`${c.year} · ${c.name}`"
                :value="c.id"
              />
            </el-select>
            <el-button
              size="small"
              :disabled="!recCycleId"
              @click="goRecCockpit"
            >
              去处理
            </el-button>
          </div>
        </div>
      </template>
      <template v-if="canReadRecruitment">
        <el-skeleton v-if="recLoading && !recStats" animated :rows="2" />
        <div v-else-if="recFunnel.length" class="funnel">
          <template v-for="(block, i) in recFunnel" :key="block.label">
            <div v-if="i" class="funnel-arrow">→</div>
            <div class="funnel-block" :title="block.hint">
              <div class="funnel-value">{{ block.value }}</div>
              <div class="funnel-label">{{ block.label }}</div>
            </div>
          </template>
        </div>
        <el-empty
          v-else-if="!recLoading"
          description="暂无招新轮次，先到「招新轮次」页新建"
        />
      </template>
      <SrvfPermEmpty
        v-else
        action="查看招新申请"
        code="recruitment-application.read.record"
      />
    </el-card>

    <!-- 门二 · 入队 -->
    <el-card shadow="never">
      <template #header>
        <div class="gate-header">
          <span class="gate-title">门二 · 入队（志愿者 → 正式队员）</span>
          <div class="gate-actions">
            <el-select
              v-model="tjCycleId"
              placeholder="选择入队轮次"
              size="small"
              style="width: 200px"
              @change="loadTjCounts"
            >
              <el-option
                v-for="c in tjCycles"
                :key="c.id"
                :label="`${c.year} · ${c.name}`"
                :value="c.id"
              />
            </el-select>
            <el-button size="small" :disabled="!tjCycleId" @click="goTjCockpit">
              去处理
            </el-button>
          </div>
        </div>
      </template>
      <template v-if="canReadTeamJoin">
        <el-skeleton v-if="tjLoading" animated :rows="2" />
        <template v-else-if="tjCycles.length">
          <div class="funnel">
            <template v-for="(block, i) in tjFunnel" :key="block.label">
              <div v-if="i" class="funnel-arrow">→</div>
              <div class="funnel-block">
                <div class="funnel-value">{{ block.value }}</div>
                <div class="funnel-label">{{ block.label }}</div>
              </div>
            </template>
          </div>
          <div class="funnel-footnote">
            已拒 {{ tjRejected }} 人（不计入推进链）
          </div>
        </template>
        <el-empty v-else description="暂无入队轮次，先到「入队轮次」页新建" />
      </template>
      <SrvfPermEmpty
        v-else
        action="查看入队申请"
        code="team-join-application.read.record"
      />
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}

.gate-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
  justify-content: space-between;
}

.gate-title {
  font-size: 15px;
  font-weight: 600;
}

.gate-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.funnel {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: stretch;
}

.funnel-block {
  flex: 1 1 96px;
  min-width: 96px;
  padding: 12px 8px;
  text-align: center;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.funnel-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.funnel-label {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.funnel-arrow {
  align-self: center;
  color: var(--el-text-color-placeholder);
}

.funnel-footnote {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
