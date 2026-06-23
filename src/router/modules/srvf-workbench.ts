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
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
