<script setup lang="ts">
import { onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useTeamInsurancePolicies } from "./utils/hook";

import AddFill from "~icons/ri/add-circle-line";
import { SrvfListPage } from "@/srvf-kit";

defineOptions({
  name: "SrvfTeamInsurancePolicies"
});

const {
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  canAddMember,
  canRemoveMember,
  loading,
  columns,
  dataList,
  pagination,
  onSearch,
  openDialog,
  handleDelete,
  openCoverage,
  handleSizeChange,
  handleCurrentChange,
  coverageVisible,
  coveragePolicy,
  coverageList,
  coverageLoading,
  coveragePagination,
  coverageSearch,
  coverageSizeChange,
  coverageCurrentChange,
  handleAddMember,
  handleAddAll,
  handleRemoveMember
} = useTeamInsurancePolicies();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <SrvfListPage
    :can-read="canRead"
    title="队保单"
    intro="管理团队统一购买的保险单，并维护每张保单覆盖哪些队员。"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看队保单"
    empty-code="team-insurance-policy.read.record"
    @refresh="onSearch"
    @page-size-change="handleSizeChange"
    @page-current-change="handleCurrentChange"
  >
    <template #buttons>
      <el-button
        v-if="canCreate"
        type="primary"
        :icon="useRenderIcon(AddFill)"
        @click="openDialog('新建')"
      >
        新建保单
      </el-button>
    </template>
    <template #operation="{ row, size }">
      <el-button
        class="reset-margin"
        link
        :size="size"
        @click="openCoverage(row)"
      >
        覆盖名单
      </el-button>
      <el-button
        v-if="canUpdate"
        class="reset-margin"
        link
        :size="size"
        @click="openDialog('编辑', row)"
      >
        编辑
      </el-button>
      <el-button
        v-if="canDelete"
        class="reset-margin"
        link
        type="danger"
        :size="size"
        @click="handleDelete(row)"
      >
        删除
      </el-button>
    </template>
  </SrvfListPage>

  <!-- 覆盖名单 drawer：某保单的覆盖队员 + 单加/全体一键加/移除 -->
  <el-drawer
    v-model="coverageVisible"
    :title="
      coveragePolicy
        ? `覆盖名单 · ${coveragePolicy.insurerName} ${coveragePolicy.policyNumber}`
        : '覆盖名单'
    "
    size="56%"
    destroy-on-close
  >
    <div class="coverage-actions">
      <el-button
        v-if="canAddMember"
        type="primary"
        :icon="useRenderIcon(AddFill)"
        @click="handleAddMember"
      >
        单加队员
      </el-button>
      <el-button v-if="canAddMember" @click="handleAddAll">
        全体在册一键加
      </el-button>
      <el-button @click="coverageSearch">刷新</el-button>
    </div>
    <el-table
      v-loading="coverageLoading"
      :data="coverageList"
      border
      size="small"
      row-key="id"
    >
      <el-table-column label="队员编号" prop="memberNo" min-width="140" />
      <el-table-column label="姓名" prop="memberDisplayName" min-width="140" />
      <el-table-column label="加入时间" min-width="160">
        <template #default="{ row }">
          {{ row.createdAt ? row.createdAt.slice(0, 10) : "—" }}
        </template>
      </el-table-column>
      <el-table-column
        v-if="canRemoveMember"
        label="操作"
        fixed="right"
        width="100"
      >
        <template #default="{ row }">
          <el-button
            link
            type="danger"
            size="small"
            @click="handleRemoveMember(row)"
          >
            移除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      class="coverage-pager"
      background
      layout="prev, pager, next"
      :total="coveragePagination.total"
      :page-size="coveragePagination.pageSize"
      :current-page="coveragePagination.currentPage"
      @size-change="coverageSizeChange"
      @current-change="coverageCurrentChange"
    />
  </el-drawer>
</template>

<style scoped lang="scss">
.coverage-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.coverage-pager {
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
