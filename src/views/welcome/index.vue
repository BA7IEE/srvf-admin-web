<script setup lang="ts">
defineOptions({
  name: "Welcome"
});

const groups = [
  { title: "SRVF · 基础数据", path: "/srvf/base-data/dictionaries" },
  { title: "SRVF · 队员", path: "/srvf/members-domain/members" },
  { title: "SRVF · 活动", path: "/srvf/activities-domain/activities" },
  { title: "SRVF · 系统", path: "/srvf/system/users" }
];
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <span class="text-lg font-medium">SRVF Admin · 工作台占位</span>
      </template>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="本页面为静态占位页，字段、流程、权限、状态机以后端业务确认和 API 契约为准。"
      />
      <p class="mt-4 text-sm text-gray-500">
        欢迎使用 SRVF
        内部管理后台。当前阶段仅完成静态菜单骨架，所有业务页面均为占位，不调用任何后端
        API。
      </p>

      <el-row :gutter="16" class="mt-4">
        <el-col
          v-for="g in groups"
          :key="g.path"
          :xs="24"
          :sm="12"
          :md="6"
          class="mb-3"
        >
          <el-card shadow="hover">
            <div class="text-base font-medium">{{ g.title }}</div>
            <div class="mt-1 text-xs text-gray-400">{{ g.path }}</div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>
