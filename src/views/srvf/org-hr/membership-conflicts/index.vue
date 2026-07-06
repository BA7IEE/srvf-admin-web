<script setup lang="ts">
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useMembershipConflicts } from "./utils/hook";

defineOptions({
  name: "SrvfMembershipConflicts"
});

const {
  canRead,
  loading,
  total,
  columns,
  dataList,
  typeLabel,
  onSearch,
  goMember
} = useMembershipConflicts();

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <template v-if="canRead">
      <el-alert
        class="mb-2"
        :title="
          loading
            ? '正在体检…'
            : total === 0
              ? '归属数据体检通过：未发现多主/悬空/停用组织类冲突'
              : `发现 ${total} 项归属冲突，请逐项排查处理`
        "
        :type="loading ? 'info' : total === 0 ? 'success' : 'warning'"
        show-icon
        :closable="false"
      />
      <PureTableBar title="归属体检结果" :columns="columns" @refresh="onSearch">
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            row-key="type"
            adaptive
            :adaptiveConfig="{ offsetBottom: 108 }"
            align-whole="center"
            table-layout="auto"
            :loading="loading"
            :size="size"
            :data="dataList"
            :columns="dynamicColumns"
            :header-cell-style="{
              background: 'var(--el-fill-color-light)',
              color: 'var(--el-text-color-primary)'
            }"
          >
            <template #type="{ row }">
              <el-tag type="warning">{{ typeLabel(row.type) }}</el-tag>
            </template>
            <template #operation="{ row }">
              <el-button
                v-if="row.memberId"
                class="reset-margin"
                link
                type="primary"
                :size="size"
                @click="goMember(row)"
              >
                队员档案
              </el-button>
              <span v-else>—</span>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </template>
    <SrvfPermEmpty v-else action="查看会籍" code="membership.list.record" />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
