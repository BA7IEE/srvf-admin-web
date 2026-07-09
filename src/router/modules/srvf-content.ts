const Layout = () => import("@/layout/index.vue");

/**
 * 内容与通知（IA v3,UX 升级蓝图 §4.3.1）：原「内容发布」「通知中心」两组合一——
 * 对干部而言都是「对外/对内发东西」一件事。通知管理路由自 srvf-notification.ts 迁入本组
 * （路径/组件/name 不变）;附件库与微信模板属配置运维面,转入「队务设置」设置中心
 * （showLink:false + activePath,书签/页签不断链）。
 */
export default [
  {
    path: "/srvf/content-domain",
    name: "SrvfContentDomain",
    component: Layout,
    redirect: "/srvf/content-domain/contents",
    meta: {
      icon: "ri/article-line",
      title: "内容与通知",
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
        // 通知管理（自 srvf-notification.ts 迁入;绝对路径跨前缀挂靠,与「角色绑定挂系统组」同范式）
        path: "/srvf/notification-domain/notifications",
        name: "SrvfNotifications",
        component: () =>
          import("@/views/srvf/notification-domain/notifications/index.vue"),
        meta: {
          icon: "ri/mail-send-line",
          title: "通知管理"
        }
      },
      {
        // 通用附件库：跨业务对象的附件横切台账,属运维面 → 设置中心「消息与附件」区进入。
        path: "/srvf/content-domain/attachments",
        name: "SrvfAttachments",
        component: () =>
          import("@/views/srvf/content-domain/attachments/index.vue"),
        meta: {
          icon: "ri/folder-open-line",
          title: "附件库",
          showLink: false,
          activePath: "/srvf/settings-center"
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
