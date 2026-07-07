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
    // 系统管理 = 账号与权限面：用户/角色权限/权限点/角色绑定 + 审计/短信日志/系统设置。
    // 基础数据（字典/职务/贡献值/附件配置）已拆出为独立组（srvf-base-data.ts,C 档 IA 调整）。
    path: "/srvf/system",
    name: "SrvfSystem",
    component: Layout,
    redirect: "/srvf/system/users",
    meta: {
      icon: "ri/settings-3-line",
      title: "系统管理",
      rank: 8
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
        // 权限点管理（RBAC 管理面 2/3：蓝图 §3 标注"谨慎评估，需独立决策"，用户已明确选择开做）
        path: "/srvf/system/permissions",
        name: "SrvfPermissions",
        component: () => import("@/views/srvf/system/permissions/index.vue"),
        meta: {
          icon: "ri/key-2-line",
          title: "权限点管理",
          roles: ["SUPER_ADMIN"]
        }
      },
      {
        // 角色绑定（C 档自「组织与人事」迁入:后端 handoff §2.6 定位其为「系统管理配置面,
        // 与角色与权限并列」,蓝图 IA v2 §5 同;权限四入口就此聚拢。路径与组件不变）
        path: "/srvf/org-hr/role-bindings",
        name: "SrvfRoleBindings",
        component: () => import("@/views/srvf/org-hr/role-bindings/index.vue"),
        meta: {
          icon: "ri/user-follow-line",
          title: "角色绑定",
          auths: ["role-binding.read.record"]
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
        path: "/srvf/system/settings",
        name: "SrvfSystemSettings",
        component: () => import("@/views/srvf/system/settings/index.vue"),
        meta: {
          icon: "ri/tools-line",
          title: "系统设置"
        }
      }
    ]
  },
  {
    // 一次性运维工具组：后端 handoff（announcement-import,PR11）明确「平时不用,不建议加进导航树」，
    // 整组 showLink:false——不进侧栏、无菜单高亮，只能靠直接 URL 访问。
    path: "/srvf/tools",
    name: "SrvfTools",
    component: Layout,
    redirect: "/srvf/tools/announcement-import",
    meta: {
      title: "运维工具",
      showLink: false
    },
    children: [
      {
        path: "/srvf/tools/announcement-import",
        name: "SrvfAnnouncementImport",
        component: () =>
          import("@/views/srvf/tools/announcement-import/index.vue"),
        meta: {
          title: "公告导入（一次性工具）",
          showLink: false
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
