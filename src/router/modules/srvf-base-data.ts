const Layout = () => import("@/layout/index.vue");

/**
 * 基础数据（C 档 IA 调整,自「系统管理」拆出;后端 handoff §5.2「一拥挤就拆」+ 蓝图 IA v2 §5 背书）。
 * 全部为低频配置面:字典 / 职务定义 / 职务规则 / 贡献值规则 / 附件配置。
 * 路径与组件均不变（仅菜单归组调整,书签/页签不受影响）。
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
      rank: 9
    },
    children: [
      {
        path: "/srvf/base-data/dictionaries",
        name: "SrvfDictionaries",
        component: () =>
          import("@/views/srvf/base-data/dictionaries/index.vue"),
        meta: {
          icon: "ri/book-2-line",
          title: "字典管理"
        }
      },
      {
        path: "/srvf/base-data/positions",
        name: "SrvfPositions",
        component: () => import("@/views/srvf/base-data/positions/index.vue"),
        meta: {
          icon: "ri/shield-star-line",
          title: "职务定义",
          auths: ["position.read.definition"]
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
          auths: ["position-rule.read.record"]
        }
      },
      {
        path: "/srvf/base-data/contribution-rules",
        name: "SrvfContributionRules",
        component: () =>
          import("@/views/srvf/base-data/contribution-rules/index.vue"),
        meta: {
          icon: "ri/scales-3-line",
          title: "贡献值规则"
        }
      },
      {
        path: "/srvf/system/attachment-config",
        name: "SrvfAttachmentConfig",
        component: () =>
          import("@/views/srvf/system/attachment-config/index.vue"),
        meta: {
          icon: "ri/folder-settings-line",
          title: "附件配置"
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
