# SRVF Frontend Derivation Record

## 1. Source

- Starter repository: `BA7IEE/u-admin-web-starter`（Private）
- Starter commit at derivation time: `fd24cd4` (`chore: record starter setup verification`)
- Derived repository: `BA7IEE/srvf-admin-web`（Private）
- Derivation date: 2026-05-15

## 2. Purpose

This repository is the SRVF-specific admin frontend.

- 业务范围：深圳公益救援队 SRVF 内部管理后台。
- 与上游 starter 的关系：上游 starter (`u-admin-web-starter`) 仍保留为"通用前端后台母版"，禁止在 starter 内开发 SRVF 业务。SRVF 业务全部在本仓库内推进。
- 上游同步规则继承自 starter 的 `docs/pure-admin/11-upstream-sync.md`：starter → 本仓库的同步通过 `git cherry-pick` 单条进行，禁止 `git merge / pull` 整段合并。

## 3. Backend Contract Source

Backend repository: `srvf-nest-api`（NestJS 11 + Prisma 6 + JWT + Swagger，本地 `http://localhost:3000`）

- Frontend must follow backend Swagger / OpenAPI and NestJS DTOs.
- 后端 OpenAPI 文档地址：`http://localhost:3000/api/docs`、`http://localhost:3000/api/docs-json`、`http://localhost:3000/api/docs-yaml`。
- 任何前端字段、枚举、API 路径、错误码与后端不一致时，**改前端**，**不要求后端凑前端**（沿 starter `docs/pure-admin-max-ts-baseline.md §0.5` 后端 4 大红线）。

## 4. PR-4 Open Questions Resolved

> 调研对象：`srvf-nest-api` v0.10.0；调研时间：2026-05-15；详细证据路径见调研对话存档（不在本文件展开）。

| Question            | Decision                                                                                                                                                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1 Response wrapper | 成功 `{ code: 0, message: "ok", data: T }`；失败 `{ code: <BizCode>, message, data: null }` + 对应 HTTP status；分页 `PageResultDto<T> = { items, total, page, pageSize }`（**注意：mock 用 `list / currentPage`，与后端 `items / page` 字段名不一致**） |
| Q2 refresh-token    | **不支持**。前端必须降级：accessToken 过期 → 直接 logOut；不允许"为前端方便"倒逼后端实现 refresh                                                                                                                                                         |
| Q3 expires format   | 字段名 `expiresIn`；格式 = **JWT duration 字符串**（如 `"7d"`、`"15m"`），原样回传 `JWT_EXPIRES_IN` 配置值；既不是 unix ms 也不是 ISO 字符串。前端在 `setToken` 时解析为本地过期时间戳                                                                   |
| Q4 roles            | enum `Role { SUPER_ADMIN, ADMIN, USER }`；后端是**单角色字段 `role`**（非数组 `roles`）；登录返回**不带身份字段**，需 `GET /api/users/me` 取 `UserResponseDto`；前端 store `roles` 写成 `[user.role]`                                                    |
| Q5 API prefix       | `globalPrefix = "/api"`；登录 `POST /api/auth/login`；本人资料 `GET /api/users/me`；Swagger `/api/docs`；端口 `3000`。Vite proxy 推荐 `'/api' → http://localhost:3000` **不要 rewrite**（后端就用 `/api` 前缀）                                          |

### 4.x 额外固化结论

| 项                  | 结论                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 登录限流            | `@LoginThrottle()` 启用，默认 5 次/分钟。命中 HTTP 429 + `{code: 42900, message: "请求过于频繁，请稍后再试", data: null}`；**不返回 `Retry-After` / `X-RateLimit-*` 头** |
| 登录失败            | HTTP 401 + `{code: 10004, message: "账号或密码错误", data: null}`（防账号枚举，所有失败路径统一）                                                                        |
| 未登录 / token 过期 | HTTP 401 + `{code: 40100, message: "未登录或登录已失效", data: null}`                                                                                                    |
| JWT payload         | 极简 `{sub, username}`，不含 role；每请求查库取最新角色（`jwt.strategy.ts:validate`）                                                                                    |
| Token 类型          | 响应含 `tokenType: "Bearer"`；前端 `formatToken` 拼 `Authorization: Bearer <token>`                                                                                      |
| 多重身份登录        | 后端支持 `username` 或 `memberNo` 任一字符串作 `username` 字段值；前端 DTO 仍叫 `username`，UI 文案可改                                                                  |
| 细粒度权限（可选）  | `GET /api/v2/rbac/me/permissions` 返回 `MyPermissionsResponseDto`（有效权限点集 + 业务角色摘要）；第一阶段不消费，留待二阶段                                             |

## 5. Next PRs（在本仓库内推进，不再在 starter 内推进）

### PR-2.1: Vite proxy（底座单独 PR，按 `02-ai-rules.md §13.2.2` 处理）

修改范围：

- `vite.config.ts`：`server.proxy` 加 `'/api': { target: 'http://localhost:3000', changeOrigin: true }`（**不要 rewrite**）

禁止范围：

- 不接 NestJS 真实账号；
- 不改 `src/utils/http/**`；
- 不改 `src/api/**`；
- 不写业务页面；
- 不动 `package.json` 依赖字段。

DoD：

- [ ] `pnpm dev` 启动时 proxy 配置已加载（即使后端未启动也应出现 proxy error 日志而非配置错）；
- [ ] `pnpm lint && pnpm typecheck && pnpm build` 全绿。

### PR-4: NestJS login integration

修改范围（每项均需对照 `docs/pure-admin/02-ai-rules.md §13.1` 矩阵）：

- `src/api/user.ts`（业务层）：
  - `getLogin` URL `'/login'` → `'/api/auth/login'`；
  - `UserResult.data` 类型改为 `{ accessToken, tokenType: "Bearer", expiresIn: string }`；
  - 删除或停用 `refreshTokenApi`（后端无 refresh）；
  - 新增 `getCurrentUser` 调 `GET /api/users/me` 取 `UserResponseDto`。
- `src/utils/auth.ts`（底座单独 PR 评估）：
  - `setToken` 加 `parseExpiresIn(s: string)` 把 `"7d"` 解析为本地 ms 时间戳；
  - 把 `roles` 改为 `[user.role]` 单值数组写入存储；
  - `permissions` 暂留 `[]`。
- `src/store/modules/user.ts`（底座单独 PR 评估）：
  - `loginByUsername` 改两步流程：① POST `/api/auth/login` 拿 token；② GET `/api/users/me` 拿身份；
  - 去掉 `handRefreshToken` 或留 stub 不再调；
- `src/utils/http/index.ts`（底座单独 PR 评估）：
  - 响应拦截器：HTTP 401 / `code === 40100` 时强制 `logOut()` + 跳 `/login`；
  - HTTP 429 / `code === 42900` 时显示"请求过于频繁"提示，不死循环；
  - 不需要重写 `{code, message, data}` 结构——后端已天然对齐。
- `mock/asyncRoutes.ts` 角色名（演示用）：
  - 把所有 `roles: ["admin"]` / `["common"]` 替换为 `["SUPER_ADMIN"]` 或后端真实角色名（或在 PR-5 静态路由里写新角色名后，本 mock 可继续保留作历史范式）。

禁止范围：

- ⛔ Do not enable asyncRoutes.（不切 `src/views/login/index.vue` 的 import；不补 `getMenuList`；详见 `docs/pure-admin/03-router-menu.md §5.2.1`）
- ⛔ Do not introduce refresh-token.（后端不支持，前端用降级方案）
- ⛔ Do not derive backend permissions from frontend mock.（红线 4）
- ⛔ Do not modify package.json dependencies / devDependencies / engines / pnpm.（`02-ai-rules.md §13.2.1`）
- ⛔ Do not run `pnpm add/remove/update/clean:cache`.

DoD（沿 starter `docs/pure-admin/09-pr-roadmap.md` PR-4 节）：

- [ ] 用 NestJS 真账号成功登录并跳转首页；
- [ ] localStorage `user-info` 含真实 `role`（如 `SUPER_ADMIN`）；cookie `authorized-token` 含 `accessToken` 与解析后的 `expires(ms)`；不含 `refreshToken`；
- [ ] HTTP 401 时强制 logOut + 跳 `/login`，不死循环；
- [ ] HTTP 429 时显示"请求过于频繁"提示；
- [ ] 错账号 / 错密码登录显示"账号或密码错误"；
- [ ] 刷新页面登录态保持（在 `expiresIn` 未过期时）；
- [ ] `pnpm lint && pnpm typecheck && pnpm build` 全绿。

## 6. 后续 PR 顺序（与 starter `09-pr-roadmap.md` 对齐）

| PR                               | 范围                                                                                                                             | 状态                    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| PR-1 派生身份调整                | `package.json` + `README.md` + 本文件                                                                                            | **本轮完成**            |
| PR-2.1 Vite proxy                | `vite.config.ts: server.proxy` 加 `/api`                                                                                         | 待启动                  |
| PR-4 NestJS 登录对接             | `src/api/user.ts` / `src/utils/auth.ts` / `src/store/modules/user.ts` / `src/utils/http/index.ts` / `mock/asyncRoutes.ts` 角色名 | 待启动（PR-2.1 完成后） |
| PR-5 SRVF 静态菜单骨架           | `src/router/modules/srvf-*.ts` + `src/views/srvf-*/` 占位 + `src/views/welcome/` SRVF dashboard                                  | 待启动                  |
| PR-6 字典页面改造（隐藏 + 占位） | 同 starter PR-6                                                                                                                  | 待启动                  |
| PR-7 组织架构页面骨架            | `src/router/modules/srvf-org.ts` + `src/views/srvf-org/`                                                                         | 待启动                  |
| PR-8 活动日历 UI 占位            | `src/router/modules/srvf-calendar.ts` + `src/views/srvf-calendar/`                                                               | 待启动                  |

## 7. 已知残留问题（继承自 starter 的 review-log）

| #   | 问题                                                                                    | 处理位置                                                               |
| --- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | `build/utils.ts:59` 硬编码 `VITE_ENABLE_TENANT: "true"` 默认值（BL-7 上游遗留）         | 不影响实际效果（`.env=false` 经 `wrapperEnv` 覆盖）；留待"底座单独 PR" |
| 2   | `src/api/*.ts` 演示 URL 残留在生产产物                                                  | PR-4 时替换为真实 NestJS API                                           |
| 3   | 前端 mock 与后端字段命名差异（`roles[]` vs `role`、`list/currentPage` vs `items/page`） | PR-4 / PR-5 / PR-6 接接口时按后端为准改前端                            |

## 8. 上游同步规则提醒

按 `docs/pure-admin/11-upstream-sync.md`：

- 不允许 `git merge starter/main` 整段合；
- 仅允许 `git remote add starter ... + git cherry-pick <sha>` 单条同步；
- 任一同步必须按高风险文件清单判定 + 走 §13.2.2 单独 PR；
- 上游 starter 的 mock / tenant / asyncRoutes 演示代码**不得**借同步流程污染本仓库。

## PR-2.1 Vite Proxy Actual Changes

- Configured Vite dev proxy for `/api`.
- Target: `http://localhost:3000`.
- No rewrite because the NestJS backend global prefix is `/api`.
- No login integration in this PR.
- No API wrapper changes in this PR.

### 实际改动文件

| 文件                               | 改动                                                                                              | 备注                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `vite.config.ts`                   | `server.proxy` 由 `{}` 改为 `{ "/api": { target: "http://localhost:3000", changeOrigin: true } }` | 仅 dev 生效；不影响 build；属底座单独 PR（`02-ai-rules.md §13.2.2`） |
| `docs/srvf-frontend-derivation.md` | 追加本节 PR-2.1 调整记录                                                                          | 仅 append                                                            |

### 本轮显式未触碰

- `src/**`、`mock/**`、`build/**`、`.env*`、`package.json`、`pnpm-lock.yaml`、`tsconfig.json`、`README.md`、`public/**`、`types/**`：全部未触碰；
- `src/api/user.ts`、`src/utils/auth.ts`、`src/utils/http/index.ts`、`src/store/modules/user.ts`、`src/views/login/index.vue`：归 PR-4，本轮一律不动；
- 未执行任何 `pnpm add/remove/update/clean:cache`；
- 未启用 `asyncRoutes`、未补 `getMenuList`、未改 login `initRouter` import。

### PR-2.1 DoD

- [x] `vite.config.ts: server.proxy` 仅追加 `/api` 单条，未改其他 server 配置；
- [x] `pnpm install`（如需）；`pnpm typecheck / lint / build` 全绿（详见提交报告）；
- [x] `pnpm dev` 启动时 proxy 配置已加载；
- [-] 后端联通验证：取决于本地 NestJS 是否启动；后端启动时 `/api/docs-json` 可经 Vite 代理访问，否则代理日志报 `ECONNREFUSED` 也属预期（不阻塞 PR-2.1 上线）。

### 残留 / 留给 PR-4

- `src/api/*.ts` 中演示 URL（`/login` / `/dict-tree` 等）仍写老路径，**不会**自动走 `/api` 代理——这是预期，待 PR-4 时改 `src/api/user.ts:getLogin` URL 为 `/api/auth/login` 等；
- `src/utils/http/index.ts` 仍无 `baseURL`，依赖前端代码自行写完整路径——也是 PR-4 范畴。

## PR-4 Actual Changes (NestJS Login Integration)

### 1. Modified files

| File                               | Change                                                                                                                                                                                                                                                                                                                |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/api/user.ts`                  | 重写：`getLogin` URL → `/api/auth/login`；新增 `CurrentUserResult` 类型 + `getCurrentUser()` 调 `/api/users/me`；新增 `SrvfRole` / `SrvfUserStatus` 类型；`UserResult.data` 改为 `{accessToken, tokenType, expiresIn}`；`refreshTokenApi` 标记 `@deprecated` 但保留 stub                                              |
| `src/utils/auth.ts`                | `DataInfo.refreshToken` 改为可选；新增 `parseExpiresIn(s)` 严格解析 `\d+(s\|m\|h\|d)`（失败 throw，禁止静默 fallback）；`setToken` 形参兼容 `DataInfo<number \| Date>`（保留 `src/utils/sso.ts` 老调用方）；`setToken` 内部统一把 ms / Date / 字符串日期转 ms                                                         |
| `src/store/modules/user.ts`        | `loginByUsername` 改两步：① POST `/api/auth/login` → 拿 token+expiresIn → 调 `parseExpiresIn` → `setToken` 最小写入 ② GET `/api/users/me` → 拿 user → 映射 `roles=[user.role]` + `permissions=[]` → `setToken` 完整写入；/me 失败时 `removeToken` 清理"半登录"状态；`handRefreshToken` 标记 `@deprecated` 但保留 stub |
| `src/utils/http/index.ts`          | **移除**"过期 → refresh 队列重放"分支（裁决：后端无 refresh）；过期 → `triggerLogoutOnce`；whiteList 加 `/auth/login`；响应拦截器对 HTTP 401（含 40100 / 10004）/ 429（42900）/ 其他非 0 code 统一弹 message（业务侧仍能 reject）；新增 `triggerLogoutOnce` 防止并发 401 时多次提示                                   |
| `mock/asyncRoutes.ts`              | 把所有 `roles: ["admin"]` → `["SUPER_ADMIN", "ADMIN"]`；`roles: ["admin", "common"]` → `["SUPER_ADMIN", "ADMIN", "USER"]`；mock 文件头注释更新说明角色名映射（裁决 3 演示角色名生命周期）；未恢复 `_tenantManagementRouter` 到 data 数组（裁决 1）                                                                    |
| `docs/srvf-frontend-derivation.md` | 追加本节 PR-4 Actual Changes                                                                                                                                                                                                                                                                                          |
| `docs/pure-admin/setup-notes.md`   | 追加 PR-4 真实联调结果                                                                                                                                                                                                                                                                                                |

### 2. expiresIn 解析策略

`src/utils/auth.ts:parseExpiresIn(s)` 严格正则 `^\s*(\d+)\s*([smhd])\s*$`：

- `"30s"` → 30 × 1000 ms
- `"15m"` → 15 × 60 × 1000 ms
- `"1h"` → 60 × 60 × 1000 ms
- `"7d"` → 7 × 24 × 60 × 60 × 1000 ms

**解析失败直接 `throw new Error(...)`，禁止静默给默认值**。这是登录契约错误：后端 JWT_EXPIRES_IN 配置错误或返回值异常应当让登录失败而不是悄悄通过。该错误会经由 `loginByUsername` 的 Promise reject 透传到 `src/views/login/index.vue` 的 catch，触发"登录失败"提示。

### 3. role → roles 映射

后端 `role: "SUPER_ADMIN" | "ADMIN" | "USER"` 单值字段；前端 store 在 `loginByUsername` 第二步取到 `/me` 后，用 `setToken({ ..., roles: [me.role], permissions: [] })` 写入：

- `roles` 始终是**单元素数组**，第一阶段不会出现多角色组合；
- `permissions` 第一阶段固定 `[]`；第二阶段可调 `GET /api/v2/rbac/me/permissions` 填充。
- 路由 meta.roles 已在 `mock/asyncRoutes.ts` 全量替换为后端真实 enum，演示模块本就未启用，但角色名干净已避免污染后续派生项目（裁决 3）。

### 4. 错误码处理表

| HTTP                      | BizCode           | 处理                                                                                                                                                                              |
| ------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2xx + code 0              | —                 | 透传 data 给业务侧                                                                                                                                                                |
| 2xx + code 非 0           | 任意              | 响应拦截器弹 message（10004 → "账号或密码错误"；42900 → "请求过于频繁..."；40100 → 不弹避免双重提示；其它 → backend message）；仍 resolve 给业务，store 判 `code !== 0` 后 reject |
| **HTTP 401** + code 40100 | UNAUTHORIZED      | `triggerLogoutOnce("登录已过期...") → removeToken + logOut + 跳 /login`                                                                                                           |
| HTTP 401 + code 10004     | LOGIN_FAILED      | 仅弹"账号或密码错误"；**不**退出登录（用户本来就没登录）                                                                                                                          |
| HTTP 429 / code 42900     | TOO_MANY_REQUESTS | 弹"请求过于频繁，请稍后再试"，不重试不死循环                                                                                                                                      |
| 其它 4xxxx / 5xxxx        | 任意              | 弹 backend message                                                                                                                                                                |

`triggerLogoutOnce` 单次会话仅触发一次，防止并发 401 时反复弹提示与跳转。

### 5. 已知约束 / 未触碰

- ⛔ 未启用 `src/router/asyncRoutes.ts`；未补 `getMenuList`；未改 `src/views/login/index.vue` 的 `initRouter` import（裁决 2）；
- ⛔ 未引入 refresh-token 任何逻辑（裁决：禁止倒逼后端实现 refresh）；
- ⛔ 未修改 `vite.config.ts / package.json / pnpm-lock.yaml / .env* / build/** / public/** / tsconfig.json / README.md / src/router/asyncRoutes.ts`；
- ⛔ 未写任何 SRVF 业务页面（路由 + 业务页面属 PR-5）；
- ⛔ 未恢复 `_tenantManagementRouter` 到 data 数组（裁决 1）；
- ⛔ 未执行 `pnpm add/remove/update/clean:cache`。

#### 兼容性附注：`src/utils/sso.ts`

`src/utils/sso.ts:40` 老路径调 `setToken(params as DataInfo<Date>)`。为保持向后兼容且不动该文件（非本轮允许范围），`setToken` 形参签名改为 `DataInfo<number> | DataInfo<Date>` 联合类型，函数内部统一把 ms / Date / 字符串日期转 ms 写入 cookie。这只是类型签名扩展，无运行时行为变化。

### 6. PR-4 DoD 落地核查

- [x] `pnpm install`（已在 PR-2.1 完成；本轮 lockfile md5 未变化）；
- [x] `pnpm typecheck` 零错；
- [x] `pnpm lint` 零错零警（eslint + prettier + stylelint 三件套全过；未使用 `// eslint-disable` 或改 eslint config）；
- [x] `pnpm build` 成功（3.65s、2.4M dist）；
- [x] `pnpm dev` 启动正常（HTTP 200 @ localhost:8848）；
- [x] Vite proxy `/api → http://localhost:3000` 转发链路验证（后端未启动时返 502，证明 proxy 已注册并尝试转发）；
- [-] **真实账号联调验证**：本轮 NestJS 后端未在本地启动，AI 无法触发浏览器登录流程并断言 cookie / localStorage 字段。下列 7 项需人类启动后端后手动验证：

#### 由人类手动验证的 PR-4 DoD（启动后端 + 浏览器访问）

> 操作流程：
>
> ```
> cd /Users/dengwang/Documents/coding/srvf-nest-api && pnpm start:dev     # 后端 :3000
> cd /Users/dengwang/Documents/coding/srvf-admin-web && pnpm dev          # 前端 :8848
> 浏览器访问 http://localhost:8848/
> ```

- [ ] 用 NestJS 真账号（如后端 seed 数据中的 SUPER_ADMIN）成功登录并跳转首页；
- [ ] DevTools → Application → Cookies：`authorized-token` 含 `accessToken` 与本地解析后的 `expires` (ms 整数)；不含 `refreshToken`（或为空字符串）；
- [ ] DevTools → Application → Local Storage：`user-info` 含真实 `username / nickname / avatar` + `roles: ["SUPER_ADMIN"]`（或 `["ADMIN"]` / `["USER"]`）+ `permissions: []`；
- [ ] DevTools → Network 面板可见两条请求：① `POST /api/auth/login` 200 + `{code:0, data:{accessToken, tokenType:"Bearer", expiresIn}}`；② `GET /api/users/me` 200 + `{code:0, data: UserResponseDto}`；
- [ ] 输入错误密码 → 见红色 toast "账号或密码错误"（来自响应拦截器 10004 分支），登录页停留；
- [ ] 错误密码连续 5+ 次 → 第 6 次见 "请求过于频繁，请稍后再试" toast（429 限流命中）；
- [ ] 故意改 cookie `authorized-token.expires` 为过去时间戳 → 刷新页面 → 见 "登录已过期，请重新登录" toast + 跳 `/login`；
- [ ] 在 DevTools 删除 cookie 后访问任意业务接口 → 见相同提示与跳转。
