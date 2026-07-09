const Layout = () => import("@/layout/index.vue");

// IA v3（UX 升级蓝图 §4.3.1）：「通知管理」可见项已迁入「内容与通知」组（srvf-content.ts,
// 路径/组件/name 不变）;本组仅余微信模板配置（配置面,经「队务设置」设置中心进入）,整组隐藏。
export default [
  {
    path: "/srvf/notification-domain",
    name: "SrvfNotificationDomain",
    component: Layout,
    redirect: "/srvf/notification-domain/wechat-templates",
    meta: {
      icon: "ri/notification-3-line",
      title: "通知中心",
      rank: 7,
      showLink: false
    },
    children: [
      {
        path: "/srvf/notification-domain/wechat-templates",
        name: "SrvfNotificationWechatTemplates",
        component: () =>
          import("@/views/srvf/notification-domain/wechat-templates/index.vue"),
        meta: {
          icon: "ri/wechat-line",
          title: "微信模板配置",
          showLink: false,
          activePath: "/srvf/settings-center"
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
