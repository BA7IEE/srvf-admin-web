const Layout = () => import("@/layout/index.vue");

/**
 * 基础数据（低频配置面:字典 / 职务定义 / 职务规则 / 贡献值规则 / 附件配置）。
 * IA v3（UX 升级蓝图 §4.3）：整组撤出一级导航,统一经「队务设置」设置中心进入;
 * 路径与组件均不变（showLink:false + activePath 指回设置中心,书签/页签不断链）。
 */
export default [
  {
    path: "/srvf/base-data",
    name: "SrvfBaseData",
    component: Layout,
    redirect: "/srvf/base-data/dictionaries",
    meta: {
      icon: "ri/database-2-line",
      title: "基础数据",
      rank: 9,
      showLink: false
    },
    children: [
      {
        path: "/srvf/base-data/dictionaries",
        name: "SrvfDictionaries",
        component: () =>
          import("@/views/srvf/base-data/dictionaries/index.vue"),
        meta: {
          icon: "ri/book-2-line",
          title: "字典管理",
          showLink: false,
          activePath: "/srvf/settings-center"
        }
      },
      {
        path: "/srvf/base-data/positions",
        name: "SrvfPositions",
        component: () => import("@/views/srvf/base-data/positions/index.vue"),
        meta: {
          icon: "ri/shield-star-line",
          title: "职务定义",
          auths: ["position.read.definition"],
          showLink: false,
          activePath: "/srvf/settings-center"
        }
      },
      {
        path: "/srvf/base-data/position-rules",
        name: "SrvfPositionRules",
        component: () =>
          import("@/views/srvf/base-data/position-rules/index.vue"),
        meta: {
          icon: "ri/list-settings-line",
          title: "职务规则",
          auths: ["position-rule.read.record"],
          showLink: false,
          activePath: "/srvf/settings-center"
        }
      },
      {
        path: "/srvf/base-data/contribution-rules",
        name: "SrvfContributionRules",
        component: () =>
          import("@/views/srvf/base-data/contribution-rules/index.vue"),
        meta: {
          icon: "ri/scales-3-line",
          title: "贡献值规则",
          showLink: false,
          activePath: "/srvf/settings-center"
        }
      },
      {
        path: "/srvf/system/attachment-config",
        name: "SrvfAttachmentConfig",
        component: () =>
          import("@/views/srvf/system/attachment-config/index.vue"),
        meta: {
          icon: "ri/folder-settings-line",
          title: "附件配置",
          showLink: false,
          activePath: "/srvf/settings-center"
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
