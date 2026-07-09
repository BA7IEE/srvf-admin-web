const Layout = () => import("@/layout/index.vue");

/**
 * 组织与人事（IA v2 新支柱,蓝图 §5;P1-A 先落组织架构迁入 + 会籍只读两页,
 * 后续 P1-B/C/D 的职务/任职/督导/角色绑定按蓝图逐步补入本组或系统管理组）。
 * meta.auths 为细权限码门控意图标注（fork 范式）;实际守卫在页面级 canRead + 空态。
 */
export default [
  {
    path: "/srvf/org-hr",
    name: "SrvfOrgHr",
    component: Layout,
    redirect: "/srvf/base-data/organizations",
    meta: {
      icon: "ri/community-line",
      title: "组织与人事",
      rank: 4
    },
    children: [
      {
        // 组织架构（自「系统管理」组迁入;路径与组件不变,仅菜单归组调整）
        path: "/srvf/base-data/organizations",
        name: "SrvfOrganizations",
        component: () =>
          import("@/views/srvf/base-data/organizations/index.vue"),
        meta: {
          icon: "ri/organization-chart",
          title: "组织架构",
          auths: ["org.read.node"]
        }
      },
      {
        path: "/srvf/org-hr/memberships",
        name: "SrvfMemberships",
        component: () => import("@/views/srvf/org-hr/memberships/index.vue"),
        meta: {
          icon: "ri/exchange-2-line",
          title: "归属总表",
          auths: ["membership.list.record"]
        }
      },
      {
        // IA v3：体检页退出侧栏,入口收敛到「归属总表」页头按钮（同一份数据的检查视图）。
        path: "/srvf/org-hr/membership-conflicts",
        name: "SrvfMembershipConflicts",
        component: () =>
          import("@/views/srvf/org-hr/membership-conflicts/index.vue"),
        meta: {
          icon: "ri/first-aid-kit-line",
          title: "归属体检",
          auths: ["membership.list.record"],
          showLink: false,
          activePath: "/srvf/org-hr/memberships"
        }
      },
      {
        // P1-C 任职总表(全新建,fork 亦无;任命创建入口在组织架构页「在任职务」面板)
        path: "/srvf/org-hr/position-assignments",
        name: "SrvfPositionAssignments",
        component: () =>
          import("@/views/srvf/org-hr/position-assignments/index.vue"),
        meta: {
          icon: "ri/user-star-line",
          title: "任命记录",
          auths: ["position-assignment.read.record"]
        }
      },
      {
        // P1-D(2/3) 督导/分管(自 7.11.0 fork 移植 + 补 v0.36 分页/coverage-preview;
        // 与职务正交,不要求分管人持职务)
        path: "/srvf/org-hr/supervision-assignments",
        name: "SrvfSupervisionAssignments",
        component: () =>
          import("@/views/srvf/org-hr/supervision-assignments/index.vue"),
        meta: {
          icon: "ri/eye-line",
          title: "分管总表",
          auths: ["supervision-assignment.read.record"]
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
