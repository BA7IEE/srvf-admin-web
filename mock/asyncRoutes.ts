// 模拟后端动态生成路由
import { defineFakeRoute } from "vite-plugin-fake-server/client";

/**
 * roles：页面级别权限。
 *
 * PR-4：角色名已映射为 srvf-nest-api 的真实 Role enum（裁决 3）：
 *   - SUPER_ADMIN：超级管理员
 *   - ADMIN：管理员
 *   - USER：普通用户
 *
 * 说明：本 mock 文件在 starter 阶段被禁用（`mock/asyncRoutes.ts` data 数组中已隐藏
 * 演示路由的注册），第一阶段一律不启用 `src/router/asyncRoutes.ts`（裁决 2）。
 * 但 mock 内 roles 字段仍按后端真实角色名保持，避免历史演示路径残留 admin/common
 * 字面量，污染后续派生项目（裁决 3：演示角色名不得作为正式角色）。
 */

const permissionRouter = {
  path: "/permission",
  meta: {
    title: "权限管理",
    icon: "ep:lollipop",
    rank: 10
  },
  children: [
    {
      path: "/permission/page/index",
      name: "PermissionPage",
      meta: {
        title: "页面权限",
        roles: ["SUPER_ADMIN", "ADMIN", "USER"]
      }
    },
    {
      path: "/permission/button",
      meta: {
        title: "按钮权限",
        roles: ["SUPER_ADMIN", "ADMIN", "USER"]
      },
      children: [
        {
          path: "/permission/button/router",
          component: "permission/button/index",
          name: "PermissionButtonRouter",
          meta: {
            title: "路由返回按钮权限",
            auths: [
              "permission:btn:add",
              "permission:btn:edit",
              "permission:btn:delete"
            ]
          }
        },
        {
          path: "/permission/button/login",
          component: "permission/button/perms",
          name: "PermissionButtonLogin",
          meta: {
            title: "登录接口返回按钮权限"
          }
        }
      ]
    }
  ]
};

const scheduleRouter = {
  path: "/schedule",
  meta: {
    icon: "ri:calendar-todo-line",
    title: "日历排班",
    rank: 11
  },
  children: [
    {
      path: "/schedule/index",
      name: "Schedule",
      meta: {
        title: "日历排班",
        roles: ["SUPER_ADMIN", "ADMIN"]
      }
    }
  ]
};

const dictManagementRouter = {
  path: "/dict",
  meta: {
    icon: "ri:book-2-line",
    title: "字典管理",
    rank: 12
  },
  children: [
    {
      path: "/dict/index",
      name: "SystemDict",
      meta: {
        title: "字典管理",
        roles: ["SUPER_ADMIN", "ADMIN"]
      }
    }
  ]
};

// PR-3：重命名为下划线前缀（符合 ESLint `@typescript-eslint/no-unused-vars`
// 允许 `/^_/u` 例外），源码保留作为参考范式；不恢复进 data 数组（裁决 1）。
const _tenantManagementRouter = {
  path: "/tenant",
  meta: {
    icon: "ri:home-gear-line",
    title: "租户管理",
    rank: 13
  },
  children: [
    {
      path: "/tenant/list/index",
      name: "TenantList",
      meta: {
        icon: "ri:list-check",
        title: "租户列表",
        roles: ["SUPER_ADMIN", "ADMIN"]
      }
    },
    {
      path: "/tenant/package/index",
      name: "TenantPackage",
      meta: {
        icon: "ri:file-paper-line",
        title: "租户套餐",
        roles: ["SUPER_ADMIN", "ADMIN"]
      }
    }
  ]
};

export default defineFakeRoute([
  {
    url: "/get-async-routes",
    method: "get",
    response: () => {
      return {
        code: 0,
        message: "操作成功",
        data: [
          permissionRouter,
          scheduleRouter,
          dictManagementRouter
          // PR-2：starter 第一阶段隐藏「租户管理」菜单入口（裁决 1）。
          // 上方 `_tenantManagementRouter` 定义保留作为参考范式，禁止删除源码；
          // 是否物理删除以后续单独 PR 决策。
          // _tenantManagementRouter
        ]
      };
    }
  }
]);
