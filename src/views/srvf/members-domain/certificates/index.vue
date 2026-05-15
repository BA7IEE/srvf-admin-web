<script setup lang="ts">
defineOptions({
  name: "SrvfCertificates"
});
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <span class="text-lg font-medium">证书</span>
      </template>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="本页面为静态占位页，字段、流程、权限、状态机以后端业务确认和 API 契约为准。"
      />
      <p class="mt-4 text-sm text-gray-500">
        SRVF 队员域——证书占位（与队员强耦合，后续接入时挂在队员详情子页）。
      </p>
      <p class="mt-2 text-sm text-gray-500">
        未来可能方向（非承诺，等后端契约就绪后由独立 PR 落地）：
      </p>
      <ul class="mt-2 list-disc pl-6 text-sm text-gray-500">
        <li>证书列表浏览</li>
        <li>证书状态浏览（状态机由后端字典维护，前端不复刻）</li>
        <li>到期提示占位</li>
      </ul>
    </el-card>
  </div>
</template>
