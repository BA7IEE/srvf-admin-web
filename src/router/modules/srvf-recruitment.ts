const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/srvf/recruitment-domain",
    name: "SrvfRecruitmentDomain",
    component: Layout,
    redirect: "/srvf/recruitment-domain/overview",
    meta: {
      icon: "ri/user-add-line",
      title: "招新",
      rank: 5
    },
    children: [
      {
        // 招新总览（UX 升级蓝图 §4.5-C）：两道门 funnel 看板,把招新→入队连成一条链路。
        path: "/srvf/recruitment-domain/overview",
        name: "SrvfRecruitmentOverview",
        component: () =>
          import("@/views/srvf/recruitment-domain/overview/index.vue"),
        meta: {
          icon: "ri/funds-line",
          title: "招新总览"
        }
      },
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
          title: "招新详情",
          showLink: false,
          activePath: "/srvf/recruitment-domain/cycles"
        }
      },
      {
        path: "/srvf/recruitment-domain/team-join",
        name: "SrvfTeamJoinCycles",
        component: () =>
          import("@/views/srvf/recruitment-domain/team-join/cycles/index.vue"),
        meta: {
          icon: "ri/shield-star-line",
          title: "入队轮次"
        }
      },
      {
        // 入队作战室（轮次详情页：入队申请审核 tab）：由入队轮次列表行「管理」进入,非侧栏菜单项。
        path: "/srvf/recruitment-domain/team-join/:id",
        name: "SrvfTeamJoinCycleCockpit",
        component: () =>
          import("@/views/srvf/recruitment-domain/team-join/cycles/cockpit.vue"),
        meta: {
          title: "入队详情",
          showLink: false,
          activePath: "/srvf/recruitment-domain/team-join"
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
