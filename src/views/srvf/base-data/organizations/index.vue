<script setup lang="ts">
defineOptions({
  name: "SrvfOrganizations"
});
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <span class="text-lg font-medium">组织架构</span>
      </template>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="本页面为静态占位页，字段、流程、权限、状态机以后端业务确认和 API 契约为准。"
      />
      <p class="mt-4 text-sm text-gray-500">
        SRVF 基础数据底座——组织节点入口。
      </p>
      <p class="mt-2 text-sm text-gray-500">
        未来可能方向（非承诺，等后端契约就绪后由独立 PR 落地）：
      </p>
      <ul class="mt-2 list-disc pl-6 text-sm text-gray-500">
        <li>组织节点树形浏览</li>
        <li>节点新增 / 调整顺序（仅 UI 范式，层级假设由业务确认）</li>
        <li>节点启停</li>
      </ul>
    </el-card>
  </div>
</template>
