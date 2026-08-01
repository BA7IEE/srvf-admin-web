<script setup lang="ts">
import { SrvfListPage, SrvfStatusTag, SrvfRemoteSelect } from "@/srvf-kit";
import { useCertificateWorkbench, STATS_CARDS } from "./utils/hook";

defineOptions({
  name: "SrvfCertificateWorkbench"
});

const {
  canRead,
  canVerify,
  canReject,
  canReadMember,
  searchForm,
  orgSelectOptions,
  standardOptions,
  categoryOptions,
  levelOptions,
  onFilterApply,
  onReset,
  columns,
  dataList,
  loading,
  pagination,
  onRefresh,
  handleSizeChange,
  handleCurrentChange,
  stats,
  statsLoading,
  filterByStatus,
  certStatusLabels,
  CERT_STATUS_TAG,
  openMemberCertificates,
  handleVerify,
  handleReject
} = useCertificateWorkbench();

/** 只有四态是真状态，能点着快筛；「60 天内到期」「终身有效」是读数不是状态 */
const FILTERABLE = ["pending", "verified", "expired", "rejected"] as const;

function isFilterable(key: string): key is (typeof FILTERABLE)[number] {
  return (FILTERABLE as readonly string[]).includes(key);
}
</script>

<template>
  <SrvfListPage
    :can-read="canRead"
    title="证书管理"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看证书"
    empty-code="certificate.read.record"
    intro="全队证书横扫台：按状态、组织、标准找出该核验和快到期的证。想按证书编号查，请到队员档案的证书 tab（编号是敏感信息，这里刻意不支持搜）。"
    @refresh="onRefresh"
    @page-size-change="handleSizeChange"
    @page-current-change="handleCurrentChange"
  >
    <template #banner>
      <!-- 统计整块「拿不到就不渲染」：显示 6 个 0 会被读成「全队一张证都没有」 -->
      <el-row v-if="stats" v-loading="statsLoading" :gutter="12" class="mb-3">
        <el-col
          v-for="card in STATS_CARDS"
          :key="card.key"
          :xs="12"
          :sm="8"
          :md="4"
        >
          <el-card
            shadow="never"
            :class="[
              'stat-card',
              isFilterable(card.key) && 'is-clickable',
              searchForm.certStatusCode === card.key && 'is-active'
            ]"
            @click="isFilterable(card.key) && filterByStatus(card.key)"
          >
            <el-statistic :value="stats[card.key]">
              <template #title>
                <span class="stat-card__title">{{ card.label }}</span>
              </template>
            </el-statistic>
            <div class="stat-card__hint">{{ card.hint }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="mb-3">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="关键词">
            <el-input
              v-model="searchForm.q"
              clearable
              placeholder="队员编号 / 姓名 / 标准 / 发证机构"
              class="w-60!"
              @keyup.enter="onFilterApply"
              @clear="onFilterApply"
            />
          </el-form-item>
          <el-form-item label="组织">
            <SrvfRemoteSelect
              v-model="searchForm.organizationId"
              :options="orgSelectOptions"
              placeholder="全部组织"
              class="w-44!"
              @change="onFilterApply"
            />
          </el-form-item>
          <el-form-item>
            <el-checkbox
              v-model="searchForm.includeDescendants"
              :disabled="!searchForm.organizationId"
              @change="onFilterApply"
            >
              含下级组织
            </el-checkbox>
          </el-form-item>
          <el-form-item label="证书标准">
            <SrvfRemoteSelect
              v-model="searchForm.standardCode"
              :options="standardOptions"
              placeholder="全部标准"
              class="w-52!"
              @change="onFilterApply"
            />
          </el-form-item>
          <el-form-item label="类别">
            <el-select
              v-model="searchForm.categoryCode"
              clearable
              placeholder="全部类别"
              class="w-32!"
              @change="onFilterApply"
            >
              <el-option
                v-for="o in categoryOptions"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="等级">
            <el-select
              v-model="searchForm.levelCode"
              clearable
              placeholder="全部等级"
              class="w-36!"
              @change="onFilterApply"
            >
              <el-option
                v-for="o in levelOptions"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="searchForm.certStatusCode"
              clearable
              placeholder="全部状态"
              class="w-32!"
              @change="onFilterApply"
            >
              <el-option label="待核验" value="pending" />
              <el-option label="已核验" value="verified" />
              <el-option label="已失效" value="expired" />
              <el-option label="拒绝" value="rejected" />
            </el-select>
          </el-form-item>
          <el-form-item label="来源">
            <el-select
              v-model="searchForm.sourceCode"
              clearable
              placeholder="全部来源"
              class="w-32!"
              @change="onFilterApply"
            >
              <el-option label="管理端录入" value="ADMIN" />
              <el-option label="招新发号" value="RECRUITMENT" />
            </el-select>
          </el-form-item>
          <el-form-item label="发证日">
            <el-date-picker
              v-model="searchForm.issuedRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              start-placeholder="开始"
              end-placeholder="结束"
              class="w-60!"
              @change="onFilterApply"
            />
          </el-form-item>
          <el-form-item label="到期日">
            <el-date-picker
              v-model="searchForm.expiresRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              start-placeholder="开始"
              end-placeholder="结束"
              class="w-60!"
              @change="onFilterApply"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="onFilterApply">
              查询
            </el-button>
            <el-button @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>
        <div class="filter-note">
          「到期日」区间只匹配有到期日的证书，终身有效的不会出现在结果里。
        </div>
      </el-card>
    </template>

    <template #member="{ row }">
      <el-button
        v-if="canReadMember"
        link
        type="primary"
        @click="openMemberCertificates(row)"
      >
        {{ row.member.displayName }}
      </el-button>
      <span v-else>{{ row.member.displayName }}</span>
      <div class="cell-sub">{{ row.member.memberNo }}</div>
    </template>

    <template #standard="{ row }">
      <div>{{ row.standard.name }}</div>
      <div class="cell-sub">{{ row.standard.code }}</div>
    </template>

    <template #status="{ row }">
      <!-- 用 effectiveStatusCode：后端按今天现算，不依赖每天 09:00 的到期 cron 是否跑过 -->
      <SrvfStatusTag
        :value="row.effectiveStatusCode"
        :label-dict="certStatusLabels"
        :tag-dict="CERT_STATUS_TAG"
      />
    </template>

    <template #operation="{ row, size }">
      <el-button
        v-if="canVerify && row.certStatusCode === 'pending'"
        class="reset-margin"
        link
        type="primary"
        :size="size"
        @click="handleVerify(row)"
      >
        核验
      </el-button>
      <el-button
        v-if="canReject && row.certStatusCode === 'pending'"
        class="reset-margin"
        link
        type="danger"
        :size="size"
        @click="handleReject(row)"
      >
        驳回
      </el-button>
      <el-button
        v-if="canReadMember"
        class="reset-margin"
        link
        :size="size"
        @click="openMemberCertificates(row)"
      >
        查看队员
      </el-button>
    </template>
  </SrvfListPage>
</template>

<style scoped lang="scss">
.filter-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}

.filter-note {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stat-card {
  height: 100%;

  &.is-clickable {
    cursor: pointer;

    &:hover {
      border-color: var(--el-color-primary);
    }
  }

  &.is-active {
    background-color: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
  }

  &__title {
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  &__hint {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--el-text-color-secondary);
  }
}

.cell-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
