export default {
  path: "/error",
  redirect: "/error/403",
  meta: {
    icon: "ri/information-line",
    // demo 异常页不进生产侧栏（403/404/500 仍可由守卫/直链到达）
    showLink: false,
    title: "异常页面",
    rank: 9
  },
  children: [
    {
      path: "/error/403",
      name: "403",
      component: () => import("@/views/error/403.vue"),
      meta: {
        title: "403"
      }
    },
    {
      path: "/error/404",
      name: "404",
      component: () => import("@/views/error/404.vue"),
      meta: {
        title: "404"
      }
    },
    {
      path: "/error/500",
      name: "500",
      component: () => import("@/views/error/500.vue"),
      meta: {
        title: "500"
      }
    }
  ]
} satisfies RouteConfigsTable;
