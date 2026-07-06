<script setup lang="ts">
import { useRouter } from "vue-router";

defineOptions({
  name: "Welcome"
});

const router = useRouter();

/**
 * 登录默认落地页：常用功能导览（全部为已上线真实页面）。
 * 日常处理待办请直接进「审批工作台」；如需登录即落工作台，
 * 由人工把 .env 的 VITE_HIDE_HOME 翻为 true（本页随之退出侧栏）。
 */
const entries = [
  {
    title: "审批工作台",
    desc: "待审报名、考勤一级审核与终审，登录后从这里开工",
    path: "/srvf/workbench/approvals"
  },
  {
    title: "活动列表",
    desc: "创建与发布活动，进入活动详情处理报名和考勤",
    path: "/srvf/activities-domain/activities"
  },
  {
    title: "队员列表",
    desc: "队员档案、证书、保险、履历与贡献值",
    path: "/srvf/members-domain/members"
  },
  {
    title: "组织架构",
    desc: "组织节点维护、成员归属、在任职务与分管",
    path: "/srvf/base-data/organizations"
  },
  {
    title: "内容发布",
    desc: "文章与公告的撰写、封面配图和发布",
    path: "/srvf/content-domain/contents"
  },
  {
    title: "通知中心",
    desc: "站内通知、微信推送与紧急短信兜底",
    path: "/srvf/notification-domain/notifications"
  }
];
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <span class="text-lg font-medium">欢迎使用 SRVF 运营系统</span>
      </template>
      <p class="text-sm text-gray-500">
        这里是常用功能入口。各页面按账号权限显示，如缺少所需功能请联系管理员开通。
      </p>

      <el-row :gutter="16" class="mt-4">
        <el-col
          v-for="entry in entries"
          :key="entry.path"
          :xs="24"
          :sm="12"
          :md="8"
          class="mb-3"
        >
          <el-card
            shadow="hover"
            class="entry-card"
            @click="router.push(entry.path)"
          >
            <div class="text-base font-medium">{{ entry.title }}</div>
            <div class="mt-1 text-xs text-gray-400">{{ entry.desc }}</div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<style scoped>
.entry-card {
  cursor: pointer;
}
</style>
