<script setup lang="ts">
import {
  getSettlementDetail,
  listSettlements,
  reviewSettlement,
  type ReviewAction,
  type ReviewCommand,
  type ReviewStage,
  type SettlementDetail,
  type SettlementListItem
} from "@/api/srvf-settlement-review";
import { bizErrorMessage } from "@/api/srvf-error";
import { hasPerms } from "@/utils/auth";
import { message } from "@/utils/message";
import { SrvfPermEmpty } from "@/srvf-kit";
import { computed, ref, watch } from "vue";
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from "vue-router";
import { postingLabel, statusLabel } from "./settlement-labels";

defineOptions({ name: "SrvfSettlementReviewDetail" });

const route = useRoute();
const id = computed(() => String(route.params.settlementVersionId));
const canRead = computed(() => hasPerms("attendance.read.sheet"));
const detail = ref<SettlementDetail | null>(null);
const row = ref<SettlementListItem | null>(null);
const page = ref(1);
const pageSize = 20;
const loading = ref(false);
const error = ref("");
const stageError = ref("");
const busy = ref(false);
const selected = ref<ReviewAction>();
const note = ref("");
const commandError = ref("");
const pending = ref<{
  id: string;
  stage: ReviewStage;
  action: ReviewAction;
  body: ReviewCommand;
}>();
let request = 0;

const stage = computed(() =>
  detail.value?.version.statusCode === "submitted" &&
  row.value?.statusCode === "submitted"
    ? row.value.reviewStage
    : null
);
const mayReview = computed(() =>
  Boolean(
    detail.value?.results &&
    stage.value &&
    hasPerms(
      stage.value === "first"
        ? "activity.settlement-first-review.record"
        : "activity.settlement-final-review.record"
    )
  )
);

async function lookupVersion(
  activityId: string,
  versionId: string,
  sequence: number
) {
  for (let current = 1; sequence === request; current++) {
    const response = await listSettlements({
      activityId,
      page: current,
      pageSize: 100
    });
    if (response.code !== 0) throw new Error(response.message);
    const match = response.data.items.find(
      item =>
        item.settlementVersionId === versionId && item.activityId === activityId
    );
    if (match) return match;
    if (
      !response.data.items.length ||
      current * response.data.pageSize >= response.data.total
    )
      break;
  }
  return null;
}

async function load(targetPage = page.value) {
  const sequence = ++request;
  const versionId = id.value;
  const activityId = route.query.activityId;
  detail.value = null;
  row.value = null;
  selected.value = undefined;
  error.value = "";
  stageError.value = "";
  if (!canRead.value) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const response = await getSettlementDetail(versionId, targetPage, pageSize);
    if (sequence !== request) return;
    if (response.code !== 0) {
      error.value = response.message;
      return;
    }
    if (
      response.data.version.id !== versionId ||
      response.data.results === undefined
    ) {
      error.value = "未取得指定版本的新版冻结结果契约，不可审核。";
      return;
    }
    detail.value = response.data;
    page.value = targetPage;
    if (typeof activityId === "string") {
      try {
        const match = await lookupVersion(activityId, versionId, sequence);
        if (sequence !== request) return;
        row.value = match;
        if (!match)
          stageError.value = "未从可见列表核实该版本。请从审核列表重新进入。";
      } catch (cause) {
        if (sequence !== request) return;
        stageError.value = bizErrorMessage(cause, "未能核实版本的审核阶段");
      }
    }
  } catch (cause) {
    if (sequence !== request) return;
    error.value = bizErrorMessage(cause, "无法读取指定版本");
  } finally {
    if (sequence === request) loading.value = false;
  }
}

watch([id, () => route.query.activityId, canRead], () => void load(1), {
  immediate: true
});

function canNavigate() {
  return (
    !busy.value &&
    (!pending.value ||
      window.confirm(
        "审核结果尚未确认。离开后请先核查原操作结果，不要重新提交。确认离开？"
      ))
  );
}
onBeforeRouteLeave(canNavigate);
onBeforeRouteUpdate(() => {
  if (!canNavigate()) return false;
  pending.value = undefined;
  commandError.value = "";
  return true;
});

function prepare(action: ReviewAction) {
  selected.value = action;
  note.value = "";
  commandError.value = "";
}

async function submit() {
  if (busy.value || !canRead.value) return;
  if (!pending.value) {
    const version = detail.value?.version;
    if (
      !version ||
      !stage.value ||
      !selected.value ||
      !mayReview.value ||
      loading.value
    )
      return;
    const text = note.value.trim();
    if (selected.value === "return" && !text) return;
    const {
      evidenceSealId,
      evidenceRevision,
      populationRevision,
      workflowRevision,
      contentHash
    } = version;
    pending.value = {
      id: version.id,
      stage: stage.value,
      action: selected.value,
      body: {
        operationKey: crypto.randomUUID(),
        evidenceSealId,
        evidenceRevision,
        populationRevision,
        workflowRevision,
        contentHash,
        ...(text ? { note: text } : {})
      }
    };
  }
  const command = pending.value;
  if (command.id !== id.value) return;
  const permission =
    command.stage === "first"
      ? "activity.settlement-first-review.record"
      : "activity.settlement-final-review.record";
  if (!hasPerms(permission)) return;
  busy.value = true;
  commandError.value = "";
  try {
    const response = await reviewSettlement(
      command.id,
      command.stage,
      command.action,
      command.body
    );
    if (response.code !== 0) {
      commandError.value = response.message;
      return;
    }
    if (
      response.data.settlementVersionId !== command.id ||
      response.data.stageCode !== command.stage ||
      response.data.actionCode !== command.action
    ) {
      commandError.value = "服务回执与原审核不匹配。";
      return;
    }
    pending.value = undefined;
    message(
      command.action === "return"
        ? "已退回此版本"
        : "审核已记录，请以账本状态确认是否入账",
      { type: "success" }
    );
    await load();
  } catch (cause) {
    commandError.value = bizErrorMessage(cause, "未取得审核回执");
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <el-card>
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <RouterLink :to="{ name: 'SrvfWorkbench', query: { task: 'settlement' } }"
        >返回结算审核列表</RouterLink
      >
      <el-button
        v-if="canRead"
        :loading="loading"
        :disabled="busy"
        @click="load()"
        >刷新读面</el-button
      >
    </div>
    <SrvfPermEmpty
      v-if="!canRead"
      action="查看结算审核详情"
      code="attendance.read.sheet"
    />
    <template v-else>
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        :closable="false"
        show-icon
      />
      <el-alert
        v-if="stageError"
        :title="stageError"
        type="warning"
        :closable="false"
        show-icon
      />
      <div v-if="pending" class="my-3">
        <el-alert
          :title="commandError || '正在核对原审核请求'"
          type="warning"
          :closable="false"
          show-icon
        >
          未取得匹配回执前不发起新审核。可刷新读面，或在当前页面用原操作键和原请求重试。
        </el-alert>
        <el-button
          :disabled="loading"
          :loading="busy"
          class="mt-2"
          @click="submit"
          >复用原请求</el-button
        >
      </div>
      <section v-loading="loading" aria-label="结算版本详情">
        <template v-if="detail">
          <h2 class="mb-2 text-lg font-semibold">
            {{ row?.activityTitle || "结算审核" }} · 第
            {{ detail.version.version }} 版
          </h2>
          <div class="mb-3 flex flex-wrap gap-2">
            <el-tag>{{
              stage === "first"
                ? "待一审"
                : stage === "final"
                  ? "待终审"
                  : statusLabel(detail.version.statusCode)
            }}</el-tag>
            <el-tag
              v-if="row"
              :type="
                row.postingBatchStatusCode === 'committed' ? 'success' : 'info'
              "
              >{{ postingLabel(row.postingBatchStatusCode) }}</el-tag
            >
          </div>
          <p v-if="detail.version.returnReason">
            退回原因：{{ detail.version.returnReason }}
          </p>
          <p>
            封场凭证：{{ detail.version.evidenceSealId }}；证据 / 人口 /
            工作流修订：{{ detail.version.evidenceRevision }} /
            {{ detail.version.populationRevision }} /
            {{ detail.version.workflowRevision }}
          </p>
          <p>
            与前版差异：新增 {{ detail.diff.addedItemCount }}，移除
            {{ detail.diff.removedItemCount }}，变更
            {{ detail.diff.changedItemCount }}
          </p>
          <p v-if="detail.gaps.length">
            待核对缺口：{{
              detail.gaps.map(gap => `${gap.gapCode} × ${gap.count}`).join("、")
            }}
          </p>
          <div class="my-4">
            <h3 class="font-semibold">本版本逐人冻结结果</h3>
            <p>同一队员的不同场次分别列出；计算／认定值不代表已入账净分。</p>
            <el-empty
              v-if="detail.results === null"
              description="本版本尚未冻结逐人结果"
            />
            <template v-else>
              <el-table :data="detail.results.items" row-key="id" border>
                <el-table-column label="队员 / 场次" min-width="155">
                  <template #default="{ row: item }"
                    >{{ item.member.label }} / {{ item.session.name }}</template
                  >
                </el-table-column>
                <el-table-column label="结果" min-width="110">
                  <template #default="{ row: item }">
                    {{ item.resultCode }}{{ item.lateFlag ? " · 迟到" : ""
                    }}{{ item.earlyLeaveFlag ? " · 早退" : ""
                    }}{{ item.hasAdjustment ? " · 有人工调整" : "" }}
                  </template>
                </el-table-column>
                <el-table-column label="时长（计算 / 认定）" min-width="190">
                  <template #default="{ row: item }">
                    <span v-if="item.timeResultState === 'legacy'"
                      >{{ item.calculatedServiceHours }} /
                      {{ item.recognizedServiceHours }} 小时（旧制度）</span
                    >
                    <template
                      v-else-if="
                        item.timeResultState === 'ready' && item.timeBuckets
                      "
                    >
                      <div
                        v-for="bucket in item.timeBuckets"
                        :key="bucket.categoryCode"
                      >
                        {{ bucket.categoryCode }}：{{
                          bucket.calculatedSeconds ?? "—"
                        }}
                        / {{ bucket.recognizedSeconds }} 秒
                      </div>
                      <span v-if="!item.timeBuckets.length">无分类时长</span>
                    </template>
                    <span v-else>来源尚不可用</span>
                  </template>
                </el-table-column>
                <el-table-column label="贡献（计算 / 认定）" min-width="145">
                  <template #default="{ row: item }">
                    <span v-if="item.contributionResultState === 'legacy'"
                      >{{ item.calculatedContributionPoints }} /
                      {{ item.recognizedContributionPoints }}</span
                    >
                    <span v-else-if="item.contributionResultState === 'ready'"
                      >{{ item.nativeCalculatedContributionPoints ?? "—" }} /
                      {{ item.nativeRecognizedContributionPoints ?? "—" }}</span
                    >
                    <span v-else>来源尚不可用</span>
                  </template>
                </el-table-column>
              </el-table>
              <el-pagination
                class="mt-2"
                layout="total, prev, next"
                :total="detail.results.total"
                :current-page="page"
                :page-size="pageSize"
                :disabled="loading || busy"
                @current-change="load"
              />
            </template>
          </div>
          <div v-if="mayReview && !pending && !loading && !busy">
            <div class="flex flex-wrap gap-2">
              <el-button type="primary" @click="prepare('approve')">{{
                stage === "first" ? "一审通过" : "终审通过"
              }}</el-button>
              <el-button @click="prepare('return')">{{
                stage === "first" ? "一审退回" : "终审退回"
              }}</el-button>
            </div>
            <el-form
              v-if="selected"
              class="mt-3"
              :aria-label="selected === 'return' ? '确认退回' : '确认通过'"
              @submit.prevent="submit"
            >
              <el-form-item
                :label="
                  selected === 'return'
                    ? '退回原因（必填）'
                    : '审核备注（选填）'
                "
              >
                <el-input
                  v-model="note"
                  type="textarea"
                  :maxlength="500"
                  show-word-limit
                />
              </el-form-item>
              <el-button
                type="primary"
                native-type="submit"
                :disabled="selected === 'return' && !note.trim()"
              >
                确认{{ selected === "return" ? "退回" : "通过" }}第
                {{ detail.version.version }} 版
              </el-button>
              <el-button @click="selected = undefined">取消</el-button>
            </el-form>
          </div>
        </template>
        <p v-else-if="loading">读取指定结算版本…</p>
      </section>
    </template>
  </el-card>
</template>
