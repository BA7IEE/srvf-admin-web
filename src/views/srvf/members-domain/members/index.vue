<script setup lang="ts">
defineOptions({
  name: "SrvfMembers"
});
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <span class="text-lg font-medium">队员列表</span>
      </template>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="本页面为静态占位页，字段、流程、权限、状态机以后端业务确认和 API 契约为准。"
      />
      <p class="mt-4 text-sm text-gray-500">SRVF 队员域——队员列表入口。</p>
      <p class="mt-2 text-sm text-gray-500">
        未来可能方向（非承诺，等后端契约就绪后由独立 PR 落地）：
      </p>
      <ul class="mt-2 list-disc pl-6 text-sm text-gray-500">
        <li>队员列表浏览（详情 / 档案 / 紧急联系人均为后续详情子页）</li>
        <li>队员状态启停</li>
        <li>队员部门归属浏览</li>
      </ul>
    </el-card>
  </div>
</template>
