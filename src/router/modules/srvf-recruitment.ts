const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/srvf/recruitment-domain",
    name: "SrvfRecruitmentDomain",
    component: Layout,
    redirect: "/srvf/recruitment-domain/cycles",
    meta: {
      icon: "ri/user-add-line",
      title: "招募与入队",
      rank: 4
    },
    children: [
      {
        path: "/srvf/recruitment-domain/cycles",
        name: "SrvfRecruitmentCycles",
        component: () =>
          import("@/views/srvf/recruitment-domain/cycles/index.vue"),
        meta: {
          icon: "ri/user-search-line",
          title: "招新轮次"
        }
      },
      {
        // 招新作战室（轮次详情页：报名审核 tab）：由招新轮次列表行「管理」进入,非侧栏菜单项。
        path: "/srvf/recruitment-domain/cycles/:id",
        name: "SrvfRecruitmentCycleCockpit",
        component: () =>
          import("@/views/srvf/recruitment-domain/cycles/cockpit.vue"),
        meta: {
          title: "招新作战室",
          showLink: false,
          activePath: "/srvf/recruitment-domain/cycles"
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
