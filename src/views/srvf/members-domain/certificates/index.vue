<script setup lang="ts">
import { onMounted } from "vue";
import { useCertificates } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";

defineOptions({
  name: "SrvfCertificates"
});

const {
  canRead,
  loading,
  columns,
  dataList,
  memberId,
  memberOptions,
  memberLoading,
  certStatusTagType,
  dict,
  loadMembers,
  onSearch
} = useCertificates();

onMounted(() => {
  if (canRead) loadMembers();
});
</script>

<template>
  <div class="main">
    <template v-if="canRead">
      <el-card shadow="never" class="mb-2">
        <div class="flex items-center gap-2">
          <span class="text-sm">选择队员：</span>
          <el-select
            v-model="memberId"
            filterable
            clearable
            class="w-80"
            placeholder="按姓名 / 编号搜索队员"
            :loading="memberLoading"
            @change="onSearch"
          >
            <el-option
              v-for="m in memberOptions"
              :key="m.value"
              :label="m.label"
              :value="m.value"
            />
          </el-select>
        </div>
      </el-card>
      <PureTableBar title="队员证书" :columns="columns" @refresh="onSearch">
        <template v-slot="{ size, dynamicColumns }">
          <el-empty v-if="!memberId" description="请先选择一名队员查看其证书" />
          <pure-table
            v-else
            row-key="id"
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
            <template #certStatusCode="{ row }">
              <el-tag :type="certStatusTagType(row.certStatusCode)">
                {{ dict.label("cert_status", row.certStatusCode) }}
              </el-tag>
            </template>
            <template #isInternal="{ row }">
              <el-tag :type="row.isInternal ? 'warning' : 'info'">
                {{ row.isInternal ? "内部" : "外部" }}
              </el-tag>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </template>
    <el-empty
      v-else
      description="您没有查看证书的权限（certificate.read.record）"
    />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
