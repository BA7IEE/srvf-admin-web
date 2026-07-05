const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/srvf/content-domain",
    name: "SrvfContentDomain",
    component: Layout,
    redirect: "/srvf/content-domain/contents",
    meta: {
      icon: "ri/article-line",
      title: "内容发布",
      rank: 6
    },
    children: [
      {
        path: "/srvf/content-domain/contents",
        name: "SrvfContents",
        component: () =>
          import("@/views/srvf/content-domain/contents/index.vue"),
        meta: {
          icon: "ri/file-text-line",
          title: "内容列表"
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
