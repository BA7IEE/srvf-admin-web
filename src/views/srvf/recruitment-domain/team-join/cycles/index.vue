<script setup lang="ts">
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useTeamJoinCycles } from "./utils/hook";

import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SrvfTeamJoinCycles"
});

const {
  canRead,
  canCreate,
  canUpdate,
  loading,
  columns,
  dataList,
  pagination,
  statusMeta,
  onSearch,
  openDialog,
  handleToggleStatus,
  openCockpit,
  handleSizeChange,
  handleCurrentChange
} = useTeamJoinCycles();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <template v-if="canRead">
      <PureTableBar title="入队轮次" :columns="columns" @refresh="onSearch">
        <template #buttons>
          <el-button
            v-if="canCreate"
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新建')"
          >
            新建入队轮
          </el-button>
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            row-key="id"
            adaptive
            :adaptiveConfig="{ offsetBottom: 108 }"
            align-whole="center"
            table-layout="auto"
            :loading="loading"
            :size="size"
            :data="dataList"
            :columns="dynamicColumns"
            :pagination="pagination"
            :paginationSmall="size === 'small' ? true : false"
            :header-cell-style="{
              background: 'var(--el-fill-color-light)',
              color: 'var(--el-text-color-primary)'
            }"
            @page-size-change="handleSizeChange"
            @page-current-change="handleCurrentChange"
          >
            <template #statusCode="{ row }">
              <el-tag :type="statusMeta(row.statusCode).type">
                {{ statusMeta(row.statusCode).text }}
              </el-tag>
            </template>
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                :size="size"
                @click="openCockpit(row)"
              >
                管理
              </el-button>
              <el-button
                v-if="canUpdate"
                class="reset-margin"
                link
                type="primary"
                :size="size"
                @click="openDialog('编辑', row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="canUpdate"
                class="reset-margin"
                link
                :type="row.statusCode === 'open' ? 'warning' : 'success'"
                :size="size"
                @click="handleToggleStatus(row)"
              >
                {{ row.statusCode === "open" ? "关闭" : "开启" }}
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </template>
    <SrvfPermEmpty
      v-else
      action="查看入队轮"
      code="team-join-cycle.read.record"
    />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
