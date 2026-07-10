<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getDashboardSummary, type DashboardSummary } from "@/api/srvf-meta";

import BellIcon from "~icons/lucide/bell";
import ArrowRightIcon from "~icons/ri/arrow-right-s-line";

/**
 * 待办入口（UX 升级蓝图 §5 U0 / §8 D5,2026-07-10 人工放行）：
 * 原 pure-admin demo 假消息铃铛（data.ts 静态样例）改为真实待办角标——
 * 数据取 `GET /api/admin/v1/meta/dashboard-summary`（后端按权限裁剪出块:
 * key 缺失 = 无权查看,不渲染为 0）;点条目或底部按钮直达审批工作台。
 * 打开下拉时刷新计数;摘要接口失败时静默退化为无角标铃铛,不打扰全局。
 */
const router = useRouter();
const dropdownRef = ref();
const summary = ref<DashboardSummary | null>(null);

type TodoRow = { key: string; label: string; count: number };

const todos = computed<TodoRow[]>(() => {
  const current = summary.value;
  if (!current) return [];
  const rows: TodoRow[] = [];
  if (current.registrations) {
    rows.push({
      key: "registrations",
      label: "待审报名",
      count: current.registrations.pending
    });
  }
  if (current.attendanceSheets) {
    rows.push({
      key: "attendance-first",
      label: "考勤待一级审核",
      count: current.attendanceSheets.pending
    });
    rows.push({
      key: "attendance-final",
      label: "考勤待终审",
      count: current.attendanceSheets.pendingFinalReview
    });
  }
  return rows;
});

const totalPending = computed(() =>
  todos.value.reduce((sum, row) => sum + row.count, 0)
);

async function loadSummary() {
  try {
    const { code, data } = await getDashboardSummary();
    if (code === 0) summary.value = data;
  } catch {
    // 摘要不可用（未登录态/接口异常）→ 静默,铃铛退化为无角标
  }
}

function onVisibleChange(visible: boolean) {
  if (visible) loadSummary();
}

function goWorkbench() {
  dropdownRef.value?.handleClose();
  router.push("/srvf/workbench/approvals");
}

onMounted(loadSummary);
</script>

<template>
  <el-dropdown
    ref="dropdownRef"
    trigger="click"
    placement="bottom-end"
    @visible-change="onVisibleChange"
  >
    <span
      :class="['dropdown-badge', 'navbar-bg-hover', 'select-none', 'mr-1.75']"
    >
      <el-badge :value="totalPending" :max="99" :hidden="totalPending === 0">
        <span class="header-notice-icon">
          <IconifyIconOffline :icon="BellIcon" />
        </span>
      </el-badge>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <div class="todo-panel">
          <div class="todo-panel__title">我的待办</div>
          <el-empty
            v-if="todos.length === 0 || totalPending === 0"
            description="暂无待办"
            :image-size="60"
          />
          <template v-else>
            <div
              v-for="row in todos"
              :key="row.key"
              class="todo-panel__row"
              @click="goWorkbench"
            >
              <span>{{ row.label }}</span>
              <el-tag :type="row.count > 0 ? 'danger' : 'info'" size="small">
                {{ row.count }}
              </el-tag>
            </div>
          </template>
          <div class="todo-panel__footer">
            <el-button type="primary" size="small" text @click="goWorkbench">
              去工作台处理
              <IconifyIconOffline :icon="ArrowRightIcon" />
            </el-button>
          </div>
        </div>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
/* ”铃铛“摇晃衰减动画 */
@keyframes pure-bell-ring {
  0%,
  100% {
    transform-origin: top;
  }

  15% {
    transform: rotateZ(10deg);
  }

  30% {
    transform: rotateZ(-10deg);
  }

  45% {
    transform: rotateZ(5deg);
  }

  60% {
    transform: rotateZ(-5deg);
  }

  75% {
    transform: rotateZ(2deg);
  }
}

.dropdown-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 48px;
  cursor: pointer;

  .header-notice-icon {
    font-size: 16px;
  }

  &:hover {
    .header-notice-icon svg {
      animation: pure-bell-ring 1s both;
    }
  }
}

.todo-panel {
  width: 260px;
  padding: 8px 0 4px;

  .todo-panel__title {
    padding: 4px 16px 8px;
    font-size: 13px;
    font-weight: 600;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .todo-panel__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 16px;
    font-size: 13px;
    cursor: pointer;

    &:hover {
      background: var(--el-fill-color-light);
    }
  }

  .todo-panel__footer {
    display: flex;
    justify-content: flex-end;
    padding: 6px 8px 2px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
