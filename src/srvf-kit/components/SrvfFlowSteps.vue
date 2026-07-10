<script setup lang="ts">
defineOptions({
  name: "SrvfFlowSteps"
});

/**
 * 流程步骤条（UX 升级蓝图 §4.5 流程四件套的共用原语）。
 * el-steps 薄封装：把后端既有状态机「画」在界面上——只做展示,不承载任何流转逻辑;
 * 当前步之前恒为完成态,processStatus=error 用于驳回/取消类分支态。
 */
withDefaults(
  defineProps<{
    steps: Array<{ title: string; description?: string }>;
    /** 当前进行到的步骤下标（el-steps 语义:该下标之前的步骤为完成态;传 steps.length 表示全部完成） */
    active: number;
    /** 当前步骤的状态:process=进行中(默认) / error=驳回、取消等分支态 */
    processStatus?: "wait" | "process" | "finish" | "error" | "success";
  }>(),
  { processStatus: "process" }
);
</script>

<template>
  <el-steps
    :active="active"
    :process-status="processStatus"
    finish-status="success"
    align-center
    class="srvf-flow-steps"
  >
    <el-step
      v-for="step in steps"
      :key="step.title"
      :title="step.title"
      :description="step.description"
    />
  </el-steps>
</template>

<style scoped lang="scss">
.srvf-flow-steps {
  padding: 8px 0 4px;

  :deep(.el-step__description) {
    font-size: 12px;
  }
}
</style>
