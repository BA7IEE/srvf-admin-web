<script setup lang="ts">
defineOptions({
  name: "SrvfUsers"
});
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <span class="text-lg font-medium">用户管理</span>
      </template>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="本页面为静态占位页，字段、流程、权限、状态机以后端业务确认和 API 契约为准。"
      />
      <p class="mt-4 text-sm text-gray-500">
        SRVF 系统——用户管理占位（PR-4 暂停 + RBAC v2 readiness 前不接 API）。
      </p>
      <p class="mt-2 text-sm text-gray-500">
        未来可能方向（非承诺，等 PR-4 与 RBAC v2 readiness 后由独立 PR 落地）：
      </p>
      <ul class="mt-2 list-disc pl-6 text-sm text-gray-500">
        <li>用户列表浏览</li>
        <li>用户状态启停</li>
        <li>密码重置占位</li>
      </ul>
    </el-card>
  </div>
</template>
