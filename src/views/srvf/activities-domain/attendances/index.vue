<script setup lang="ts">
defineOptions({
  name: "SrvfAttendances"
});
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <span class="text-lg font-medium">考勤管理</span>
      </template>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="本页面为静态占位页，字段、流程、权限、状态机以后端业务确认和 API 契约为准。"
      />
      <p class="mt-4 text-sm text-gray-500">
        SRVF 活动域——考勤管理占位（与活动强耦合）。
      </p>
      <p class="mt-2 text-sm text-gray-500">
        未来可能方向（非承诺，等后端契约就绪后由独立 PR 落地）：
      </p>
      <ul class="mt-2 list-disc pl-6 text-sm text-gray-500">
        <li>考勤表浏览</li>
        <li>考勤记录浏览</li>
        <li>个人考勤记录入口</li>
      </ul>
    </el-card>
  </div>
</template>
