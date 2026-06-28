const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/srvf/activities-domain",
    name: "SrvfActivitiesDomain",
    component: Layout,
    redirect: "/srvf/activities-domain/activities",
    meta: {
      icon: "ri/calendar-event-line",
      title: "活动",
      rank: 2
    },
    children: [
      {
        path: "/srvf/activities-domain/activities",
        name: "SrvfActivities",
        component: () =>
          import("@/views/srvf/activities-domain/activities/index.vue"),
        meta: {
          icon: "ri/flag-line",
          title: "活动列表"
        }
      },
      {
        // 活动作战室（实体详情页）：由活动列表行「管理」router.push 进入，非侧栏菜单项。
        // showLink:false 不进侧栏；activePath 指回活动列表，停留时「活动列表」菜单保持高亮。
        path: "/srvf/activities-domain/activities/:id",
        name: "SrvfActivityCockpit",
        component: () =>
          import("@/views/srvf/activities-domain/activities/cockpit.vue"),
        meta: {
          title: "活动作战室",
          showLink: false,
          activePath: "/srvf/activities-domain/activities"
        }
      }
    ]
  },
  {
    path: "/srvf/members-domain",
    name: "SrvfMembersDomain",
    component: Layout,
    redirect: "/srvf/members-domain/members",
    meta: {
      icon: "ri/team-line",
      title: "队员",
      rank: 3
    },
    children: [
      {
        path: "/srvf/members-domain/members",
        name: "SrvfMembers",
        component: () =>
          import("@/views/srvf/members-domain/members/index.vue"),
        meta: {
          icon: "ri/user-3-line",
          title: "队员列表"
        }
      },
      {
        path: "/srvf/members-domain/team-insurance",
        name: "SrvfTeamInsurancePolicies",
        component: () =>
          import("@/views/srvf/members-domain/team-insurance/index.vue"),
        meta: {
          icon: "ri/shield-check-line",
          title: "队保单"
        }
      },
      {
        // 队员作战室（实体详情页）：由队员列表行「管理」router.push 进入，非侧栏菜单项。
        // showLink:false 不进侧栏；activePath 指回队员列表，停留时「队员列表」菜单保持高亮。
        path: "/srvf/members-domain/members/:id",
        name: "SrvfMemberCockpit",
        component: () =>
          import("@/views/srvf/members-domain/members/cockpit.vue"),
        meta: {
          title: "队员档案",
          showLink: false,
          activePath: "/srvf/members-domain/members"
        }
      }
    ]
  },
  {
    // 系统管理：账号/权限/审计 + 基础数据（字典/组织/贡献值规则,均为 system/v1 配置,折入本组）。
    path: "/srvf/system",
    name: "SrvfSystem",
    component: Layout,
    redirect: "/srvf/system/users",
    meta: {
      icon: "ri/settings-3-line",
      title: "系统管理",
      rank: 7
    },
    children: [
      {
        path: "/srvf/system/users",
        name: "SrvfUsers",
        component: () => import("@/views/srvf/system/users/index.vue"),
        meta: {
          icon: "ri/user-settings-line",
          title: "用户管理",
          roles: ["SUPER_ADMIN", "ADMIN"]
        }
      },
      {
        path: "/srvf/system/rbac",
        name: "SrvfRbac",
        component: () => import("@/views/srvf/system/rbac/index.vue"),
        meta: {
          icon: "ri/shield-keyhole-line",
          title: "角色权限",
          roles: ["SUPER_ADMIN"]
        }
      },
      {
        // 字典管理（路径仍为 /srvf/base-data/*；视图文件未移动,仅在菜单树折入系统管理）
        path: "/srvf/base-data/dictionaries",
        name: "SrvfDictionaries",
        component: () =>
          import("@/views/srvf/base-data/dictionaries/index.vue"),
        meta: {
          icon: "ri/book-2-line",
          title: "字典管理"
        }
      },
      {
        path: "/srvf/base-data/organizations",
        name: "SrvfOrganizations",
        component: () =>
          import("@/views/srvf/base-data/organizations/index.vue"),
        meta: {
          icon: "ri/organization-chart",
          title: "组织架构"
        }
      },
      {
        path: "/srvf/base-data/contribution-rules",
        name: "SrvfContributionRules",
        component: () =>
          import("@/views/srvf/base-data/contribution-rules/index.vue"),
        meta: {
          icon: "ri/scales-3-line",
          title: "贡献值规则"
        }
      },
      {
        path: "/srvf/system/audit-logs",
        name: "SrvfAuditLogs",
        component: () => import("@/views/srvf/system/audit-logs/index.vue"),
        meta: {
          icon: "ri/file-list-3-line",
          title: "审计日志",
          roles: ["SUPER_ADMIN"]
        }
      },
      {
        path: "/srvf/system/sms-logs",
        name: "SrvfSmsLogs",
        component: () => import("@/views/srvf/system/sms-logs/index.vue"),
        meta: {
          icon: "ri/message-2-line",
          title: "短信日志"
        }
      },
      {
        path: "/srvf/system/attachment-config",
        name: "SrvfAttachmentConfig",
        component: () =>
          import("@/views/srvf/system/attachment-config/index.vue"),
        meta: {
          icon: "ri/folder-settings-line",
          title: "附件配置"
        }
      },
      {
        path: "/srvf/system/settings",
        name: "SrvfSystemSettings",
        component: () => import("@/views/srvf/system/settings/index.vue"),
        meta: {
          icon: "ri/tools-line",
          title: "系统设置"
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
