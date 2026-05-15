# 04 · Auth & Permission · 登录 / Token / 权限体系

## 本文适用任务

- 接入 NestJS 真账号登录
- 排查 token 注入 / 刷新 / 多标签登录态问题
- 添加业务按钮的"显隐"控制（`Auth` / `Perms` / `v-auth` / `v-perms`）
- 决定页面访问权限（`meta.roles`）应该用什么角色名
- 评估"前端权限"与"后端 RBAC"的边界

## 必须先读

- 主入口 §0.5 红线 4（不从前端 permissions/auths 反推后端 RBAC）
- `02-ai-rules.md` §13.3 硬规则 9~11
- `05-http-api.md`（token 刷新机制相关）

## 禁止事项

- ⛔ 禁止把 `roles: ["admin","common"]` / `permissions: ["*:*:*"]` / `auths: ["permission:btn:add"]` 当成 SRVF 正式角色 / 权限 code（裁决 3）
- ⛔ 禁止以 mock 中的命名风格反推后端 `Permission / Role` 表
- ⛔ 禁止把"前端权限隐藏"当成最终安全闸 —— 后端必须做真校验
- ⛔ 禁止改 `src/utils/auth.ts` 主流程（除 token 字段适配，且必须单独 PR）
- ⛔ 禁止改 `src/store/modules/user.ts / permission.ts` 既有结构
- ⛔ 接 NestJS 后保留 `admin / common` 演示角色名跑到上线

## 相关关键文件路径

- `src/views/login/index.vue`
- `src/api/user.ts`
- `src/utils/auth.ts`
- `src/store/modules/user.ts`
- `src/store/modules/permission.ts`
- `src/router/index.ts`（守卫中的角色判断）
- `src/router/utils.ts:filterNoPermissionTree`
- `src/components/ReAuth/src/auth.tsx`、`src/components/RePerms/src/perms.tsx`
- `src/directives/auth/index.ts`、`src/directives/perms/index.ts`
- `mock/login.ts`、`mock/asyncRoutes.ts`

---

## 6. 登录、Token 与权限体系

### 6.1 登录

- 页面：`src/views/login/index.vue`（已含主题切换、暗黑、租户输入框开关 `VITE_ENABLE_TENANT`）。
- API：`src/api/user.ts:getLogin → POST /login`。
- Mock：`mock/login.ts`（admin / common 两种角色返回不同 `roles` 与 `permissions`）。
- Store action：`src/store/modules/user.ts:loginByUsername(data)` →
  1. `getLogin(data)`；
  2. `code === 0` 时 `setToken(data.data)`（`src/utils/auth.ts`）；
  3. 否则 reject。
- 登录成功后 `views/login/index.vue` 调 `initRouter()`（**默认是 `@/router/utils` 那一份，禁止切到 `@/router/asyncRoutes`**），再 `router.push(getTopMenu(true).path)`。

### 6.2 Token 存储

来源：`src/utils/auth.ts`。

- `accessToken / expires / refreshToken` 三个字段，序列化后存 **Cookie** `authorized-token`（key = `TokenKey`），过期时间用 `(expires - now) / 86400000` 天数。
- `multiple-tabs`：会话 cookie，用于"多标签共享登录态"；浏览器全关后 cookie 销毁，重新登录。
- `user-info`（key = `userKey`）：localStorage，存 `avatar / username / nickname / roles / permissions / refreshToken / expires`。
- 路由守卫（`src/router/index.ts:150-`）通过 `Cookies.get(multipleTabsKey)` + `storageLocal().getItem(userKey)` 双条件判断是否已登录。

### 6.3 Token 注入

`src/utils/http/index.ts`：

- 请求拦截器先看 `beforeRequestCallback`（请求级）→ `PureHttp.initConfig.beforeRequestCallback`（全局级）→ 否则进入 token 流程。
- 白名单：`/refresh-token`、`/login` 直接放行（**与路由白名单是两套，详见 `03-router-menu.md` §5.2.2**）。
- 有 token 且未过期 → `Authorization: Bearer <token>`（`formatToken`）。
- 过期 → 标记 `isRefreshing`，调 `useUserStoreHook().handRefreshToken({ refreshToken })`，期间其他请求被 push 到 `PureHttp.requests` 队列，刷新成功后批量重放；失败则 `logOut()` + 提示"登录已过期"。
- 详细的"前端刷新队列 vs 后端是否支持 refresh"适配规则见 `05-http-api.md` §7.6。

### 6.4 用户信息

- Pinia 存储：`src/store/modules/user.ts:useUserStore`，state 中 `avatar/username/nickname/roles/permissions/isRemembered/loginDay`。
- 主组件可通过 `useUserStoreHook()` 直接拿；layout 顶栏头像也来源于此。

### 6.5 页面权限

- 由路由 meta `roles: string[]` 控制；`src/router/index.ts:152` 在 beforeEach 中调用 `isOneOfArray(to.meta?.roles, userInfo?.roles)`；
- 同时 `src/router/utils.ts:filterNoPermissionTree` 在菜单层做过滤。

### 6.6 按钮权限

两种机制并存（**前端只做"显隐"，后端做真校验**）：

| 机制 | 数据源 | 用法 |
| --- | --- | --- |
| `Auth` 组件 / `v-auth` 指令 | 当前路由 `meta.auths` | `<Auth value="permission:btn:add">`；`v-auth="['xxx']"` |
| `Perms` 组件 / `v-perms` 指令 | 登录返回 `permissions[]` | `<Perms value="...">`；`v-perms="['xxx']"`；`permissions === ['*:*:*']` 表示全开 |

### 6.6.1 三层权限决策树（强烈推荐遵循）

> 这是 §6.4~6.6 的"如何选用"指南，AI 不准跨层乱选。

```
要控制什么？
├── 整个页面是否可访问 → 路由 meta.roles（页面级）
│     · 数据源：登录返回 user.roles[]
│     · 实现：路由守卫 + filterNoPermissionTree
│     · 适用：菜单/页面进入控制
│
├── 页面内某按钮显隐，且与"该按钮所在的菜单"绑定（meta-based）
│     · 数据源：路由 meta.auths[]（由菜单管理 / mock 配置）
│     · 实现:<Auth value="..."> 或 v-auth
│     · 适用：菜单结构稳定、按钮固定挂在某页面下
│
└── 页面内某按钮显隐，且与"当前登录用户实时权限"绑定（api-based）
      · 数据源：登录返回 user.permissions[]（pinia store）
      · 实现：<Perms value="..."> 或 v-perms
      · 适用：权限高度动态、跨页面通用 code
```

一般 SRVF 后台用「meta.roles + Perms」组合即可。第一阶段不必启用 meta.auths（要靠菜单管理 API 喂数据，参见 `03-router-menu.md` §5.2.1）。

### 6.6.2 ⛔ 演示角色名不得作为正式角色（裁决 3）

- mock 中的 `roles: ["admin"]` / `["common"]`、`permissions: ["*:*:*"]` / `["permission:btn:add"]` 等**仅为演示**。
- 正式角色名必须由 NestJS 后端独立设计后给出（如 `srvf_superadmin / srvf_captain / srvf_member`，具体以后端为准）。
- 接入 NestJS 登录的同时，必须**全量替换**：
  - `mock/asyncRoutes.ts` 中所有 `roles: ["admin", "common"]` → 替换为后端真实角色名（或在生产前删除整个 mock 链路）；
  - `mock/login.ts` 返回的 `roles` 字段（如保留 mock 演示）；
  - `src/router/modules/srvf-*.ts` 等业务静态路由的 `meta.roles`。
- **绝不允许**保留 `admin / common` 一直跑到上线。

### 6.7 前端权限 vs 后端权限的边界（⛔ P0 红线，裁决 3）

- **前端**：仅决定**看不看得见 / 点不点得到**，目的是体验。
- **后端**：**最终安全闸**——任何写操作必须在 NestJS controller / service 层校验 `JwtAuthGuard / RolesGuard / PermissionsGuard / BizCode`。
- 前端 `roles / auths / permissions` 三个字段只是 **UI 显隐 key**，它们：
  - **不等于**后端 BizCode；
  - **不等于**后端 Permission 表；
  - **不是** RBAC 设计依据。
- 后端权限模型（角色 / 权限 / 范围 / 业务码）由 NestJS 独立设计。前端按登录返回结构**适配**，**不反向定义**。
- **绝不能**因为前端模板里写了 `permissions = ["permission:btn:add"]`，就反过来让后端建一个 `permissions` 字符串列。
