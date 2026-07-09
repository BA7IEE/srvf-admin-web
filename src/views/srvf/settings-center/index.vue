<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { hasPerms } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";
import { SrvfPageIntro } from "@/srvf-kit";

defineOptions({
  name: "SrvfSettingsCenter"
});

const router = useRouter();
const userRoles = useUserStoreHook().roles ?? [];

/**
 * 队务设置 · 设置中心（IA v3,UX 升级蓝图 §4.3.2）。
 * 原「系统管理」「基础数据」两组 + 附件库/微信模板 共 14 个配置运维页的统一入口:
 * 卡片按权限裁剪(与各路由 meta.auths / meta.roles 同口径),分区呈现,点击进入原页面。
 * 各页路径/组件/权限门控不变——本页只是导航壳,不承载任何业务逻辑。
 */
type SettingEntry = {
  title: string;
  desc: string;
  path: string;
  /** 细权限码门控(与路由 meta.auths 同值) */
  auths?: string[];
  /** 系统角色门控(与路由 meta.roles 同值) */
  roles?: string[];
};

type SettingSection = {
  title: string;
  /** 分区级提示(如「平台参数」的管理员专用围栏) */
  note?: string;
  entries: SettingEntry[];
};

const SECTIONS: SettingSection[] = [
  {
    title: "账号与权限",
    entries: [
      {
        title: "系统账号",
        desc: "创建登录账号、重置密码、调整系统角色",
        path: "/srvf/system/users",
        roles: ["SUPER_ADMIN", "ADMIN"]
      },
      {
        title: "角色权限",
        desc: "定义每个角色拥有哪些权限点",
        path: "/srvf/system/rbac",
        roles: ["SUPER_ADMIN"]
      },
      {
        title: "权限点管理",
        desc: "系统权限最小单元（技术配置，日常无需改动）",
        path: "/srvf/system/permissions",
        roles: ["SUPER_ADMIN"]
      },
      {
        title: "角色绑定",
        desc: "把角色授予具体的人，并限定生效范围",
        path: "/srvf/org-hr/role-bindings",
        auths: ["role-binding.read.record"]
      }
    ]
  },
  {
    title: "基础数据",
    entries: [
      {
        title: "字典管理",
        desc: "业务下拉选项的数据源（活动类型、证件类型等）",
        path: "/srvf/base-data/dictionaries"
      },
      {
        title: "职务定义",
        desc: "队内有哪些职务（中队长、组长等），任命的前提",
        path: "/srvf/base-data/positions",
        auths: ["position.read.definition"]
      },
      {
        title: "职务规则",
        desc: "每类组织可设哪些职务、人数上下限",
        path: "/srvf/base-data/position-rules",
        auths: ["position-rule.read.record"]
      },
      {
        title: "贡献值规则",
        desc: "各类活动、各考勤角色按时长门槛的记分规则",
        path: "/srvf/base-data/contribution-rules"
      }
    ]
  },
  {
    title: "消息与附件",
    entries: [
      {
        title: "微信模板配置",
        desc: "各类通知对应的微信推送模板与启用开关",
        path: "/srvf/notification-domain/wechat-templates"
      },
      {
        title: "附件配置",
        desc: "上传文件的类型、格式与大小限制",
        path: "/srvf/system/attachment-config"
      },
      {
        title: "附件库",
        desc: "全站上传文件的总台账（按归属对象管理）",
        path: "/srvf/content-domain/attachments"
      }
    ]
  },
  {
    title: "平台参数",
    note: "管理员专用：涉及云服务凭证与留痕数据，配置错误会影响全队使用，修改前请确认。",
    entries: [
      {
        title: "系统设置",
        desc: "存储 / 短信 / 微信 / 实名核验的云服务配置",
        path: "/srvf/system/settings"
      },
      {
        title: "审计日志",
        desc: "系统操作留痕，异常追溯用",
        path: "/srvf/system/audit-logs",
        roles: ["SUPER_ADMIN"]
      },
      {
        title: "短信日志",
        desc: "短信发送记录与失败原因排查",
        path: "/srvf/system/sms-logs"
      }
    ]
  }
];

/** 卡片可见性 = 与对应路由完全同口径的权限裁剪（auths 走 hasPerms,roles 走角色交集） */
function entryVisible(entry: SettingEntry): boolean {
  if (entry.auths && !hasPerms(entry.auths)) return false;
  if (entry.roles && !entry.roles.some(r => userRoles.includes(r)))
    return false;
  return true;
}

const visibleSections = computed(() =>
  SECTIONS.map(s => ({ ...s, entries: s.entries.filter(entryVisible) })).filter(
    s => s.entries.length > 0
  )
);
</script>

<template>
  <div class="main">
    <SrvfPageIntro
      class="mb-2"
      title="全队的配置与运维项都收在这里：按分区找到要改的项，点击进入。日常业务（活动、队员、招新、通知）请走左侧菜单。"
    />
    <el-card
      v-for="section in visibleSections"
      :key="section.title"
      shadow="never"
      class="mb-3"
    >
      <template #header>
        <span class="text-base font-medium">{{ section.title }}</span>
      </template>
      <el-alert
        v-if="section.note"
        :title="section.note"
        type="warning"
        show-icon
        :closable="false"
        class="mb-3"
      />
      <el-row :gutter="16">
        <el-col
          v-for="entry in section.entries"
          :key="entry.path"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
          class="mb-3"
        >
          <el-card
            shadow="hover"
            class="setting-card"
            @click="router.push(entry.path)"
          >
            <div class="text-sm font-medium">{{ entry.title }}</div>
            <div class="setting-card__desc mt-1 text-xs">{{ entry.desc }}</div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}

.setting-card {
  height: 100%;
  cursor: pointer;
}

.setting-card__desc {
  color: var(--el-text-color-secondary);
}
</style>
