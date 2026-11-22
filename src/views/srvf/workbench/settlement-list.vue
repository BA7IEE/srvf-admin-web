<script setup lang="ts">
import {
  listSettlements,
  type SettlementListItem,
  type SettlementQuery
} from "@/api/srvf-settlement-review";
import {
  getOrgTreeOptions,
  type OrgTreeOptionItem
} from "@/api/srvf-organization";
import { bizErrorMessage } from "@/api/srvf-error";
import { hasPerms } from "@/utils/auth";
import { PureTableBar } from "@/components/RePureTableBar";
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { statusLabel, postingLabel } from "./settlement-labels";

const router = useRouter();
const filters = reactive({
  q: "",
  statusCode: undefined as SettlementQuery["statusCode"],
  reviewStage: undefined as SettlementQuery["reviewStage"],
  organizationId: undefined as string | undefined,
  includeDescendants: false,
  dates: null as [string, string] | null
});
const canReadOrganizations = hasPerms("org.read.node");
const organizations = ref<OrgTreeOptionItem[]>([]);
const organizationError = ref("");
const rows = ref<SettlementListItem[]>([]);
const error = ref("");
const loading = ref(false);
const beijingTime = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  dateStyle: "short",
  timeStyle: "short"
});
const columns: TableColumnList = [
  { label: "活动", prop: "activityTitle", minWidth: 180 },
  { label: "版本", prop: "version", width: 70 },
  { label: "提交人", slot: "submitter", minWidth: 120 },
  { label: "提交时间（北京）", slot: "submittedAt", minWidth: 150 },
  { label: "审核", slot: "review", minWidth: 100 },
  { label: "账本", slot: "posting", minWidth: 120 },
  { label: "操作", slot: "action", width: 110 }
];
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0,
  pageSizes: [20, 50, 100]
});
let applied: Omit<SettlementQuery, "page" | "pageSize"> = {
  expand: "activity"
};
let request = 0;

async function load() {
  const sequence = ++request;
  loading.value = true;
  error.value = "";
  rows.value = [];
  try {
    const response = await listSettlements({
      ...applied,
      page: pagination.currentPage,
      pageSize: pagination.pageSize
    });
    if (sequence !== request) return;
    if (response.code !== 0) {
      error.value = response.message;
      pagination.total = 0;
      return;
    }
    // The existing live API has the same path but not the candidate fields.
    if (
      response.data.items.some(
        item => item.reviewStage === undefined || item.submittedBy === undefined
      )
    ) {
      error.value = "此环境尚未提供新版结算审核契约，暂不可审核。";
      pagination.total = 0;
      return;
    }
    rows.value = response.data.items;
    pagination.total = response.data.total;
  } catch (cause) {
    if (sequence !== request) return;
    pagination.total = 0;
    error.value = bizErrorMessage(cause, "无法加载结算版本");
  } finally {
    if (sequence === request) loading.value = false;
  }
}

function search() {
  applied = {
    expand: "activity",
    q: filters.q.trim() || undefined,
    statusCode: filters.statusCode,
    reviewStage: filters.reviewStage,
    organizationId: filters.organizationId,
    includeDescendants: filters.organizationId
      ? filters.includeDescendants
      : undefined,
    dateFrom: filters.dates
      ? `${filters.dates[0]}T00:00:00.000+08:00`
      : undefined,
    dateTo: filters.dates ? `${filters.dates[1]}T23:59:59.999+08:00` : undefined
  };
  pagination.currentPage = 1;
  void load();
}

function open(row: SettlementListItem) {
  void router.push({
    name: "SrvfSettlementReviewDetail",
    params: { settlementVersionId: row.settlementVersionId },
    query: { activityId: row.activityId }
  });
}

onMounted(async () => {
  void load();
  if (!canReadOrganizations) return;
  try {
    const response = await getOrgTreeOptions();
    if (response.code === 0) organizations.value = response.data;
    else organizationError.value = response.message;
  } catch (cause) {
    organizationError.value = bizErrorMessage(cause, "无法加载组织选项");
  }
});
</script>

<template>
  <el-form inline aria-label="结算筛选" @submit.prevent="search">
    <el-form-item label="关键字">
      <el-input
        v-model="filters.q"
        clearable
        maxlength="200"
        placeholder="活动标题或提交人"
      />
    </el-form-item>
    <el-form-item label="版本状态">
      <el-select v-model="filters.statusCode" clearable style="width: 130px">
        <el-option
          v-for="code in [
            'submitted',
            'returned',
            'approved',
            'voided'
          ] as const"
          :key="code"
          :value="code"
          :label="statusLabel(code)"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="待审阶段">
      <el-select v-model="filters.reviewStage" clearable style="width: 130px">
        <el-option value="first" label="待一审" />
        <el-option value="final" label="待终审" />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="canReadOrganizations"
      label="承办组织"
      :error="organizationError"
    >
      <el-tree-select
        v-model="filters.organizationId"
        :data="organizations"
        node-key="id"
        check-strictly
        filterable
        clearable
        style="width: 190px"
      />
      <el-checkbox
        v-model="filters.includeDescendants"
        :disabled="!filters.organizationId"
        label="含下属"
      />
    </el-form-item>
    <el-form-item label="提交日期（北京时间）">
      <el-date-picker
        v-model="filters.dates"
        type="daterange"
        value-format="YYYY-MM-DD"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="max-width: 100%"
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" native-type="submit">查询</el-button>
    </el-form-item>
  </el-form>
  <el-alert
    v-if="error"
    :title="error"
    type="error"
    :closable="false"
    show-icon
  />
  <PureTableBar title="结算审核版本" :columns="columns" @refresh="load">
    <template #default="{ size, dynamicColumns }">
      <pure-table
        :size="size"
        row-key="settlementVersionId"
        :loading="loading"
        :data="rows"
        :pagination="pagination"
        :columns="dynamicColumns"
        @page-current-change="
          page => {
            pagination.currentPage = page;
            load();
          }
        "
        @page-size-change="
          size => {
            pagination.pageSize = size;
            pagination.currentPage = 1;
            load();
          }
        "
      >
        <template #submitter="{ row }">{{
          row.submittedBy?.nickname || row.submittedBy?.username || "—"
        }}</template>
        <template #submittedAt="{ row }">{{
          row.submittedAt ? beijingTime.format(new Date(row.submittedAt)) : "—"
        }}</template>
        <template #review="{ row }">{{
          row.reviewStage === "first"
            ? "待一审"
            : row.reviewStage === "final"
              ? "待终审"
              : statusLabel(row.statusCode)
        }}</template>
        <template #posting="{ row }">{{
          postingLabel(row.postingBatchStatusCode)
        }}</template>
        <template #action="{ row }"
          ><el-button link type="primary" @click="open(row)"
            >查看本版</el-button
          ></template
        >
      </pure-table>
    </template>
  </PureTableBar>
</template>
