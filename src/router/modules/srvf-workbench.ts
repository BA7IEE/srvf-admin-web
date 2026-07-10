const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/srvf/workbench",
    name: "SrvfWorkbenchDomain",
    component: Layout,
    redirect: "/srvf/workbench/approvals",
    meta: {
      icon: "ri/dashboard-3-line",
      title: "工作台",
      rank: 1
    },
    children: [
      {
        // 审批工作台 = 工作台落地页兜底（跨轴横扫待处理报名/考勤；后端暂无聚合 stats 端点）。
        path: "/srvf/workbench/approvals",
        name: "SrvfWorkbench",
        component: () => import("@/views/srvf/workbench/index.vue"),
        meta: {
          icon: "ri/inbox-2-line",
          title: "审批工作台"
        }
      },
      {
        // 使用手册（UX 升级蓝图 §4.7 帮助体系）：隐藏路由,入口在工作台页头与首页导览卡,
        // 不占侧栏(保住「工作台」单子项自动提升的一击直达形态)。
        path: "/srvf/help",
        name: "SrvfHelp",
        component: () => import("@/views/srvf/help/index.vue"),
        meta: {
          title: "使用手册",
          showLink: false,
          activePath: "/srvf/workbench/approvals"
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
