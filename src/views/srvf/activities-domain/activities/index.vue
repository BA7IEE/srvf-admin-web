<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useActivities } from "./utils/hook";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import { SrvfListPage } from "@/srvf-kit";
import SimpleEntry from "./simple/entry.vue";

defineOptions({
  name: "SrvfActivities"
});

const route = useRoute();
const router = useRouter();
const quickCreate = route.query.create === "1";

/** 快捷发起交由本人单场次入口；创建成功直接读取 simple-draft。 */
function consumeQuickCreate() {
  if (route.query.create !== "1") return;
  router.replace({ path: route.path });
}

const {
  canUpdate,
  canDelete,
  canPublish,
  canCancel,
  canComplete,
  stateBlocked,
  stateTip,
  loading,
  columns,
  dataList,
  pagination,
  statusMeta,
  onSearch,
  openDialog,
  openCockpit,
  handleDelete,
  handlePublish,
  handleComplete,
  handleCancel,
  handleSizeChange,
  handleCurrentChange
} = useActivities();

onMounted(() => {
  consumeQuickCreate();
  onSearch();
});
</script>

<template>
  <SrvfListPage
    :can-read="true"
    title="活动列表"
    intro="先筹备本人的单场次活动；下方列表用于查看当前有权访问的活动。草稿可从本设备入口或已收藏的详情链接重新打开。"
    :columns="columns"
    :loading="loading"
    :data-list="dataList"
    :pagination="pagination"
    empty-action="查看活动"
    @refresh="onSearch"
    @page-size-change="handleSizeChange"
    @page-current-change="handleCurrentChange"
  >
    <template #banner><SimpleEntry :quick-create="quickCreate" /></template>
    <template #statusCode="{ row }">
      <el-tag :type="statusMeta(row.statusCode).type">
        {{ statusMeta(row.statusCode).text }}
      </el-tag>
    </template>
    <template #isPublicRegistration="{ row }">
      <el-tag :type="row.isPublicRegistration ? 'success' : 'info'">
        {{ row.isPublicRegistration ? "公开" : "非公开" }}
      </el-tag>
    </template>
    <template #operation="{ row, size }">
      <el-button
        class="reset-margin"
        link
        :size="size"
        @click="openCockpit(row)"
      >
        管理
      </el-button>
      <el-button
        v-if="canUpdate"
        class="reset-margin"
        link
        :size="size"
        :icon="useRenderIcon(EditPen)"
        @click="openDialog('编辑', row)"
      >
        编辑
      </el-button>
      <!--
        按钮态由后端逐条裁决：被状态机拒掉时置灰并说明「不是权限问题」。
        查不到就维持原有的码门 + 状态判断，不因增强接口失败而灰掉按钮。
      -->
      <el-tooltip
        v-if="canPublish && row.statusCode === 'draft'"
        :content="stateTip(row.id, 'activity.publish.record')"
        :disabled="!stateBlocked(row.id, 'activity.publish.record')"
      >
        <span class="inline-block">
          <el-button
            class="reset-margin"
            link
            type="success"
            :size="size"
            :disabled="stateBlocked(row.id, 'activity.publish.record')"
            @click="handlePublish(row)"
          >
            发布
          </el-button>
        </span>
      </el-tooltip>
      <!--
        完结:唯一完结通路(考勤提交不再推进状态)。
        显示条件必须同时满足后端 complete 的两个前置(published + phase 已结束),
        否则点了必返 20030。
      -->
      <el-button
        v-if="
          canComplete && row.statusCode === 'published' && row.phase === 'ended'
        "
        class="reset-margin"
        link
        type="primary"
        :size="size"
        @click="handleComplete(row)"
      >
        完结
      </el-button>
      <el-tooltip
        v-if="canCancel && row.statusCode !== 'cancelled'"
        :content="stateTip(row.id, 'activity.cancel.record')"
        :disabled="!stateBlocked(row.id, 'activity.cancel.record')"
      >
        <span class="inline-block">
          <el-button
            class="reset-margin"
            link
            type="warning"
            :size="size"
            :disabled="stateBlocked(row.id, 'activity.cancel.record')"
            @click="handleCancel(row)"
          >
            取消
          </el-button>
        </span>
      </el-tooltip>
      <el-button
        v-if="canDelete"
        class="reset-margin"
        link
        type="danger"
        :size="size"
        :icon="useRenderIcon(Delete)"
        @click="handleDelete(row)"
      >
        删除
      </el-button>
    </template>
  </SrvfListPage>
</template>
