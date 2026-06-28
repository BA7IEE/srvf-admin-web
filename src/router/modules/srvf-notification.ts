const Layout = () => import("@/layout/index.vue");

// 通知中心(后端 v0.32.0 统一通知:站内信 CRUD + 状态机 + 渠道勾选 + 短信兜底计费确认 + 微信模板配置)。
// 顶级任务组,排在「内容发布」(rank 5)之后;系统管理顺延为 rank 7。
export default [
  {
    path: "/srvf/notification-domain",
    name: "SrvfNotificationDomain",
    component: Layout,
    redirect: "/srvf/notification-domain/notifications",
    meta: {
      icon: "ri/notification-3-line",
      title: "通知中心",
      rank: 6
    },
    children: [
      {
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
        path: "/srvf/notification-domain/wechat-templates",
        name: "SrvfNotificationWechatTemplates",
        component: () =>
          import("@/views/srvf/notification-domain/wechat-templates/index.vue"),
        meta: {
          icon: "ri/wechat-line",
          title: "微信模板配置"
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
