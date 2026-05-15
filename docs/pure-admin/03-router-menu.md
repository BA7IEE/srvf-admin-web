# 03 · Router & Menu · 路由与菜单系统

## 本文适用任务

- 新增 / 修改业务静态路由（`src/router/modules/srvf-*.ts` 类）
- 调整菜单显示 / 隐藏（侧栏菜单顺序 / showLink / rank / icon）
- 排查路由守卫 / 白名单 / token 注入相关问题
- 判断"动态菜单"是不是该启用（剧透：第一阶段一律不启用）

## 必须先读

- `02-ai-rules.md` §13.1 文件改动矩阵（路由相关文件几乎全是 ❌）
- 主入口 §0.5 红线 2（不从 mock 反推 API、不为前端动态菜单倒逼后端）
- `types/router.d.ts`（`CustomizeRouteMeta` 全字段）

## 禁止事项

- ⛔ 禁止启用 `src/router/asyncRoutes.ts` 任何逻辑（裁决 2）
- ⛔ 禁止修改 `src/views/login/index.vue` 的 `initRouter` import 指向 `@/router/asyncRoutes`
- ⛔ 禁止新增或修改 `getMenuList` 以补齐动态菜单链路——`getMenuList` 不存在不是 bug
- ⛔ 禁止扩展 `mock/asyncRoutes.ts` 字段以模拟后端菜单表
- ⛔ 禁止修改 `src/router/asyncRoutes.ts` 任意行
- ⛔ 禁止引入 `VITE_DYNAMIC_ROUTES` / `VITE_ASYNC_ROUTES` 等动态路由开关
- ⛔ 禁止在 `src/router/modules/` 目录放工具脚本（`import.meta.glob` 会把它当路由收）
- ⛔ 禁止单独修改两套 whiteList 中的任一处而不同步另一处

## 相关关键文件路径

- `src/router/index.ts`（守卫 + 创建实例）
- `src/router/utils.ts`（默认 initRouter / 拍平 / 过滤）
- `src/router/asyncRoutes.ts`（**第一阶段禁用**）
- `src/router/modules/home.ts / error.ts / remaining.ts`
- `src/views/login/index.vue`（登录后 `initRouter()` 调用点）
- `src/utils/http/index.ts:74`（请求白名单）
- `types/router.d.ts`（`CustomizeRouteMeta`）

---

## 5. 路由与菜单系统

### 5.1 路由入口

- `src/router/index.ts` 是唯一入口；`createRouter` 在这里产出，`router.beforeEach` / `afterEach` 也在这里。

### 5.2 静态路由 vs 动态路由

- **静态路由**：`src/router/modules/*.ts`
  - 自动收集：`import.meta.glob("./modules/**/*.ts", { eager: true })`，**除 `remaining.ts`** 之外都自动作为静态路由（`src/router/index.ts:44-49`）。
  - 当前包含：
    - `home.ts`：`/`（Layout）+ `/welcome`
    - `error.ts`：`/error/403,404,500`
  - 想加"永远存在 / 不依赖后端权限"的菜单，请加到这里。
  - **加载顺序**：`home.ts` → `error.ts` → 最后 `remaining.ts`（被 `src/router/index.ts:79` 用 `concat(...remainingRouter)` 追加在最后）。`remaining.ts` 必须最后注册，否则 `/redirect/:path(.*)` 等通配会过早匹配业务路由。
- **不参与菜单的路由**：`src/router/modules/remaining.ts`
  - `/login` `/access-denied` `/server-error` `/redirect/:path`
- **动态路由（默认实现）**：通过 `src/router/utils.ts:initRouter()` 在登录后异步加载，请求 `getAsyncRoutes()`（`src/api/routes.ts`，对应 mock `/get-async-routes`）。
  - `src/views/login/index.vue` 引用的就是这一份（`import { initRouter } from "@/router/utils"`）。
- **动态路由（Max-Ts 前端展开版，第一阶段禁止启用）**：`src/router/asyncRoutes.ts:initRouter()`，会请求 `getMenuList` → `menuDataToRoutes` + `cleanObject` 自动从一维菜单列表生成树状路由。

#### 5.2.1 ⛔ P0 红线（裁决 2）

- **第一阶段绝对禁止启用** `src/router/asyncRoutes.ts:initRouter()`。
- 禁止把 `src/views/login/index.vue` 中的 `import { initRouter } from "@/router/utils"` 改为 `"@/router/asyncRoutes"`。
- `getMenuList` 在 `src/api/system.ts` 中**不存在**——这**不是 bug，不需要补**。它是 Max 完整版才有的演示链路占位（`/system/menu/list`），Max-Ts 精简版没有同步过来。
- 启用动态菜单必须单独设计批次：
  1. NestJS 后端独立设计并实现菜单管理 API（不是因为前端有 `MenuData` 接口就反推一张 23 字段的菜单表，参见主入口红线 1）；
  2. `MenuData` 接口（`src/router/asyncRoutes.ts:21-46`）所列字段仅作前端展示需要，**后端可只返回必要子集**；
  3. 由人类批准后再切换 import 指向。
- **不得为了启用前端动态菜单，反向强迫后端先建菜单管理表。**
- 即便后续由人类批准启用 asyncRoutes，也必须由后端先独立设计菜单 schema / API；前端字段不得反推后端表结构。
- **第一阶段禁止以下任何触发项**：
  1. 修改 `src/views/login/index.vue` 的 `initRouter` import 指向 `@/router/asyncRoutes`；
  2. 新增或修改 `getMenuList` 以补齐动态菜单链路；
  3. 扩展 `mock/asyncRoutes.ts` 字段以模拟后端菜单表；
  4. 修改 `src/router/asyncRoutes.ts` 任意逻辑；
  5. 引入 `VITE_DYNAMIC_ROUTES` / `VITE_ASYNC_ROUTES` 等动态路由开关。

### 5.2.2 路由白名单 vs 请求白名单（不可混淆）

项目存在**两套独立 whiteList**，作用完全不同：

| 名字 | 位置 | 作用 | 默认值 |
| --- | --- | --- | --- |
| **路由白名单** | `src/router/index.ts:118` `const whiteList = ["/login"]` | 未登录时可访问的路由路径；其他路由都会被守卫拦截重定向到 `/login` | `["/login"]` |
| **请求免 token 白名单** | `src/utils/http/index.ts:74` `const whiteList = ["/refresh-token", "/login"]` | 哪些请求 URL **跳过 token 注入**（避免循环刷新） | `["/refresh-token", "/login"]` |

业务新增"免 token 接口"（如公开公告、健康检查、验证码）时：

- 若该接口对应"页面"也免登录访问 → **两处都加**；
- 若仅是"接口"免 token、页面仍需登录 → **只加 http 的 whiteList**；
- 反之不允许。AI 改这两处任一项，必须在 PR 说明里写清"为什么不同步改另一处"。

### 5.3 三级 / 四级菜单自动拍平

`src/router/index.ts:59` 中：

```ts
export const constantRoutes = formatTwoStageRoutes(
  formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity))))
);
```

- `formatFlatteningRoutes`：把多级嵌套拍成一维（用于 `addRoute`）。
- `formatTwoStageRoutes`：再装回二级（keep-alive 只支持到二级）。
- `buildHierarchyTree`：处理 `parentId` 转树。
- 业务路由如果用了三级以上嵌套，会被这两步自动拍平。
- **为何拍平**：Vue 的 `<keep-alive>` 仅能精确缓存直接子级路由，三级以上无法命中。因此框架先 `formatFlatteningRoutes` 拍一维，再 `formatTwoStageRoutes` 还原为二级，确保所有业务路由 keep-alive 都能生效。**业务路由设计时应尽量不超过三级嵌套**，且不要试图"反扁平"。

### 5.4 meta 字段

来源：`types/router.d.ts:CustomizeRouteMeta`。常用字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` 必填 | 菜单/标签页标题 |
| `icon` | `string \| FunctionalComponent` | 菜单图标（支持 iconify `ep/ri/...` 名） |
| `extraIcon` | 同上 | 菜单右侧图标 |
| `rank` | `number` | **只对顶级路由有效**，菜单升序排序 |
| `showLink` | `boolean` | 是否显示在菜单（默认 true） |
| `showParent` | `boolean` | 是否显示父级菜单 |
| `roles` | `string[]` | 页面级权限（角色名） |
| `auths` | `string[]` | 按钮级权限（meta-based） |
| `keepAlive` | `boolean` | 缓存页面（注意拍平到二级） |
| `frameSrc` | `string` | iframe 内嵌外链 |
| `frameLoading` | `boolean` | iframe 首加载动画 |
| `transition` | `{ name?, enterTransition?, leaveTransition? }` | 进出场动画（推荐 animate.css 写法） |
| `hiddenTag` | `boolean` | 不出现在多标签 |
| `fixedTag` | `boolean` | 固定在多标签且不可关 |
| `dynamicLevel` | `number` | 同名路由最大打开数 |
| `activePath` | `string` | 用 query/params 传参时高亮哪个菜单 |
| `loaded` | `boolean` | 框架内部用，业务不要写 |

### 5.5 name 唯一性

- `vue-router` 4+ 要求每个路由 `name` 唯一。
- 在动态路由拼装中（`src/router/utils.ts:328-330`），如果父级没有 `name`，框架会自动取**第一个子级 name + "Parent"** 作为父级 name，避免重复。
- 页面组件的 `defineOptions({ name: "..." })` **必须与路由 name 完全一致**，否则 `keep-alive` / 标签页关闭后无法精确清理（参考 `src/views/dict/index.vue` 的 `name: "SystemDict"` 对应 mock 的 `name: "SystemDict"`）。

### 5.6 Max-Ts "前端处理动态路由格式"（理解性，禁止启用）

文件：`src/router/asyncRoutes.ts`。

- 后端只需返回**一维菜单列表**（`MenuData[]`，按 `parentId / id` 拼父子关系）；
- 前端通过 `handleTree(data, "id", "parentId", "children")` → `menuToRoute()` → `cleanObject()` 自动生成路由树；
- 子节点中 `menuType=3`（按钮）会被聚合到父路由的 `meta.auths`；
- 平台规定**顶层 rank=0 仅 `home` 可用**，其他必须从非 0 开始（`src/router/asyncRoutes.ts:131`）。

**此机制第一阶段一律禁启用**（裁决 2），与后端是否已经有菜单 API 无关。

### 5.7 Max-Ts "菜单风格"

- 主题面板里的"菜单风格"（`MenuStyle: "popular" | "classic" | ...`）由 `src/layout/hooks/useDataThemeChange.ts` 中的 `setMenuStyleVariables / setMenuStyleThemeColor` 控制；
- 通过 CSS 变量 `--pure-menu-style-color / --pure-menu-style-bg` 切换；
- 样式根源在 `src/style/sidebar.scss`（21KB）。
- 默认值在 `public/platform-config.json`：`"MenuStyle": "popular"`。

### 5.8 AI 不应随便改的路由文件

- `src/router/index.ts`
- `src/router/utils.ts`
- `src/router/asyncRoutes.ts`
- `src/router/modules/home.ts` / `error.ts` / `remaining.ts`
- `src/layout/index.vue` 及其 components/、hooks/、types.ts

如果实在要改，请同时按 `02-ai-rules.md` §13.2.2 输出"修改原因 / 风险评估 / 上游对比 / 最小变更"四项，并走单独 PR。
