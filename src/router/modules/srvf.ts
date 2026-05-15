const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/srvf/base-data",
    name: "SrvfBaseData",
    component: Layout,
    redirect: "/srvf/base-data/dictionaries",
    meta: {
      icon: "ri/database-2-line",
      title: "基础数据",
      rank: 10
    },
    children: [
      {
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
      rank: 11
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
        path: "/srvf/members-domain/certificates",
        name: "SrvfCertificates",
        component: () =>
          import("@/views/srvf/members-domain/certificates/index.vue"),
        meta: {
          icon: "ri/medal-line",
          title: "证书"
        }
      }
    ]
  },
  {
    path: "/srvf/activities-domain",
    name: "SrvfActivitiesDomain",
    component: Layout,
    redirect: "/srvf/activities-domain/activities",
    meta: {
      icon: "ri/calendar-event-line",
      title: "活动",
      rank: 12
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
        path: "/srvf/activities-domain/registrations",
        name: "SrvfRegistrations",
        component: () =>
          import("@/views/srvf/activities-domain/registrations/index.vue"),
        meta: {
          icon: "ri/user-add-line",
          title: "报名记录"
        }
      },
      {
        path: "/srvf/activities-domain/attendances",
        name: "SrvfAttendances",
        component: () =>
          import("@/views/srvf/activities-domain/attendances/index.vue"),
        meta: {
          icon: "ri/checkbox-circle-line",
          title: "考勤管理"
        }
      }
    ]
  },
  {
    path: "/srvf/system",
    name: "SrvfSystem",
    component: Layout,
    redirect: "/srvf/system/users",
    meta: {
      icon: "ri/settings-3-line",
      title: "系统",
      rank: 13
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
        path: "/srvf/system/audit-logs",
        name: "SrvfAuditLogs",
        component: () => import("@/views/srvf/system/audit-logs/index.vue"),
        meta: {
          icon: "ri/file-list-3-line",
          title: "审计日志",
          roles: ["SUPER_ADMIN"]
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
