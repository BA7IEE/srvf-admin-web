<script setup lang="ts">
defineOptions({
  name: "SrvfRbac"
});
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <span class="text-lg font-medium">角色权限</span>
      </template>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="本页面为静态占位页，字段、流程、权限、状态机以后端业务确认和 API 契约为准。"
      />
      <p class="mt-4 text-sm text-gray-500">
        SRVF 系统——角色权限占位（红线 4：前端不定义 RBAC 模型）。
      </p>
      <p class="mt-2 text-sm text-gray-500">
        未来可能方向（非承诺，等 RBAC v2 readiness 后由独立 PR 落地）：
      </p>
      <ul class="mt-2 list-disc pl-6 text-sm text-gray-500">
        <li>角色列表浏览</li>
        <li>角色权限分配占位</li>
        <li>用户角色绑定浏览</li>
      </ul>
    </el-card>
  </div>
</template>
