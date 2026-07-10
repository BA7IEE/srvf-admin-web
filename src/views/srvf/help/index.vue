<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { SrvfPageIntro } from "@/srvf-kit";

defineOptions({
  name: "SrvfHelp"
});

/**
 * 使用手册（UX 升级蓝图 §4.7 帮助体系）：按「你想做什么」组织的任务指南,
 * 每篇 ≤ 一屏、步骤贴当前界面的真实按钮名。静态内容,随界面演进人工同步。
 */
const router = useRouter();

type Guide = {
  key: string;
  title: string;
  audience: string;
  steps: string[];
  tips?: string[];
  entry?: { label: string; path: string };
};

const GUIDES: Guide[] = [
  {
    key: "activity",
    title: "怎么办一场活动（从发布到考勤生效）",
    audience: "活动负责人",
    steps: [
      "左侧「活动 → 活动列表」，点「新建」填写活动信息（分三段：基本信息 / 报名设置 / 说明文字），保存后是「草稿」。",
      "在列表里点该活动的「管理」进入活动详情——页头的进度条会告诉你现在处于哪一步。",
      "点页头「发布」，队员即可报名；报名在「报名」页签逐条「审核通过 / 审核拒绝」。",
      "活动结束后，切到「考勤」页签点「提交考勤单据」，为每位参加者录入出勤与时长。",
      "考勤要过两道审核：先「一级通过」，再由有终审权的人「终审通过」——通过后贡献值自动落分。注意：提交人本人不能终审自己提交的单据。"
    ],
    tips: [
      "「活动类型」下拉是空的？说明字典还没配：请管理员到「队务设置 → 字典管理」配置 activity_type。"
    ],
    entry: { label: "去活动列表", path: "/srvf/activities-domain/activities" }
  },
  {
    key: "approval",
    title: "怎么清完今天的待办审批",
    audience: "值班/队部管理员",
    steps: [
      "登录后进「工作台」，顶部数字卡就是你的待办：待审报名 / 考勤待一级审核 / 考勤待终审。",
      "点任意数字卡直达对应列表，逐条处理；需要看完整上下文时点「活动详情」进入该活动。",
      "处理完刷新摘要，数字清零即完成。"
    ],
    entry: { label: "去工作台", path: "/srvf/workbench/approvals" }
  },
  {
    key: "recruitment",
    title: "怎么跑一届招新（两道门）",
    audience: "招募负责人",
    steps: [
      "「招新 → 招新总览」一眼看两道门各阶段人数；首次使用先到「招新轮次」新建本年度轮次。",
      "门一（招新）：进轮次「管理」页处理报名——实名核验、标考核门槛、评定，最后「发放队员编号」（俗称发号），通过者即成为志愿者、出现在「队员列表」。",
      "门二（入队）：到「入队轮次」新建轮次，志愿者提交入队申请后，标考核、综合评定，最后「一键入队」选定部门，成为正式队员。"
    ],
    tips: ["发放编号前系统会先预检，外籍或资料不全者会列为「需手动建档」。"],
    entry: { label: "去招新总览", path: "/srvf/recruitment-domain/overview" }
  },
  {
    key: "notify",
    title: "怎么发一条通知（含紧急短信）",
    audience: "通知/宣传员",
    steps: [
      "「内容与通知 → 通知管理」，点「新建通知」填标题、正文、可见范围与渠道，保存后是草稿。",
      "点「发布」：站内消息立刻送达；勾了微信的会向已订阅的队员推送。",
      "需要短信兜底（如紧急召集）：发布后在该条通知的行操作里点「发送短信」——短信按条计费，系统会先显示人数请你二次确认。"
    ],
    tips: ["勾选「短信」渠道只是声明可以发短信，发布本身永远不会自动发短信。"],
    entry: {
      label: "去通知管理",
      path: "/srvf/notification-domain/notifications"
    }
  },
  {
    key: "member",
    title: "怎么查一位队员的全部情况",
    audience: "任何干部",
    steps: [
      "最快：按 Ctrl/Cmd + K 打开全局搜索，输入姓名或编号，回车直达其档案。",
      "档案页默认打开「档案」页签；组织归属、任职、证书、活动履历、考勤记录、贡献值都在同页的其他页签里。",
      "贡献值取的是按规则封顶后的正式数字，考勤终审通过后自动更新。"
    ],
    entry: { label: "去队员列表", path: "/srvf/members-domain/members" }
  },
  {
    key: "grant",
    title: "怎么任命职务、给人授权",
    audience: "系统/人事管理员",
    steps: [
      "任命职务：「组织与人事 → 组织架构」找到对应队/组，行内「更多 → 在任职务」发起任命（前提：「队务设置 → 职务定义」里已定义该职务）。",
      "给账号授权限：「队务设置 → 系统账号」行内「业务角色绑定」授予全局角色；需要限定范围（如只管某中队）则用「队务设置 → 角色绑定」。",
      "考勤终审权比较特殊：需要在「角色绑定」里把 attendance-final-reviewer 绑到对应任职上；范围化授权目前只对考勤终审与活动/报名/考勤的单点操作生效。",
      "拿不准某人为什么能/不能做某事：「角色绑定」页的「权限诊断」可以直接查。"
    ],
    entry: { label: "去队务设置", path: "/srvf/settings-center" }
  },
  {
    key: "setup",
    title: "第一次启用系统要配什么",
    audience: "系统管理员",
    steps: [
      "全部配置入口都在左侧「队务设置」里，按分区从上往下配：",
      "① 基础数据：字典（活动类型、证件类型等下拉选项）→ 职务定义与职务规则 → 贡献值规则。",
      "② 账号与权限：创建干部的登录账号、按分工授予角色。",
      "③ 平台参数（谨慎）：存储 / 短信 / 微信 / 实名核验的云服务配置，配置错误会影响全队使用。",
      "配完后新建一场测试活动走一遍报名→考勤流程，验证下拉选项与记分是否符合预期。"
    ],
    entry: { label: "去队务设置", path: "/srvf/settings-center" }
  }
];

const activeGuide = ref<string[]>([GUIDES[0].key]);
</script>

<template>
  <div class="main">
    <SrvfPageIntro
      class="mb-2"
      title="按「你想做什么」查步骤，每篇一分钟读完；步骤里的按钮名与当前界面一致。找不到功能时先试全局搜索（Ctrl/Cmd + K）。"
    />
    <el-card shadow="never">
      <el-collapse v-model="activeGuide">
        <el-collapse-item
          v-for="g in GUIDES"
          :key="g.key"
          :name="g.key"
          class="guide-item"
        >
          <template #title>
            <span class="guide-title">{{ g.title }}</span>
            <el-tag size="small" type="info" class="ml-2">
              {{ g.audience }}
            </el-tag>
          </template>
          <ol class="guide-steps">
            <li v-for="(s, i) in g.steps" :key="i">{{ s }}</li>
          </ol>
          <el-alert
            v-for="(t, i) in g.tips ?? []"
            :key="i"
            :title="t"
            type="info"
            show-icon
            :closable="false"
            class="mt-2"
          />
          <div v-if="g.entry" class="mt-3">
            <el-button
              type="primary"
              plain
              size="small"
              @click="router.push(g.entry.path)"
            >
              {{ g.entry.label }}
            </el-button>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}

.guide-title {
  font-weight: 600;
}

.guide-steps {
  padding-left: 20px;
  margin: 4px 0;

  li {
    margin: 6px 0;
    line-height: 1.7;
    list-style: decimal;
  }
}
</style>
