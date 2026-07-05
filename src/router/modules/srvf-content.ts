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
      },
      {
        // 通用附件库（P2(3/3)）：与内容封面/附件专用子资源共享同一张 Attachment 表，
        // 是跨业务对象的附件横切管理面，与内容页并列放在同一导航组。
        path: "/srvf/content-domain/attachments",
        name: "SrvfAttachments",
        component: () =>
          import("@/views/srvf/content-domain/attachments/index.vue"),
        meta: {
          icon: "ri/folder-open-line",
          title: "附件库"
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
