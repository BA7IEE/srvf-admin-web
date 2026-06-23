const Layout = () => import("@/layout/index.vue");

// 个人中心：经右上角头像下拉进入,非侧栏菜单项(§5.3:头像下拉,非侧栏)。
export default [
  {
    path: "/srvf/account",
    name: "SrvfAccountRoot",
    component: Layout,
    redirect: "/srvf/account/index",
    meta: {
      title: "个人中心",
      showLink: false,
      rank: 99
    },
    children: [
      {
        path: "/srvf/account/index",
        name: "SrvfAccount",
        component: () => import("@/views/srvf/account/index.vue"),
        meta: {
          title: "个人中心",
          showLink: false
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
