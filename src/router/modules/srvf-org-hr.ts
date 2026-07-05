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
          title: "会籍总表",
          auths: ["membership.list.record"]
        }
      },
      {
        path: "/srvf/org-hr/membership-conflicts",
        name: "SrvfMembershipConflicts",
        component: () =>
          import("@/views/srvf/org-hr/membership-conflicts/index.vue"),
        meta: {
          icon: "ri/first-aid-kit-line",
          title: "归属体检",
          auths: ["membership.list.record"]
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
