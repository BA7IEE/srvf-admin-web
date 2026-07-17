# Pure Admin Max-Ts 前端底座认知基线（baseline · v0.3 主入口）

> 本文件是 AI 与协作者**修改本项目前必须先阅读的主入口**。
> 它已被拆成"主入口 + 专题文档"渐进式加载结构：本文件保留 TL;DR / 红线 / 索引 / PR 摘要 / Open Questions；细节散落到 `docs/pure-admin/01~11-*.md`。
> 任何与本文档冲突的需求都应优先回到本文档对齐。

当前版本：**v0.3**（专题拆分 + 渐进式加载；v0.2.1 的 10 条句级补丁全部继承）。
版本历史与 review 沿革见 `docs/archive/10-review-log.md`。

---

## 0. TL;DR

- **本仓库 `u-admin-web-starter` 派生自付费模板 `pure-admin-thin-max-ts`（Pure Admin Max-Ts v7.0.0）**，定位为"管理后台前端**底座（scaffold）**"。
- 它适合做：
  - 通用后台前端的**起点项目**（登录、路由、菜单、权限、布局、主题、请求封装、Mock）；
  - **后端驱动**型业务系统（NestJS / Java / Go 等）的统一前端基座；
  - 中后台 CRUD、字典管理、租户管理、日历排班、报表看板等通用范式。
- 它**不适合**做：
  - 业务系统本身的"事实来源"——mock 数据、字段、表结构都是演示，**不能反过来定义后端**；
  - 重前端富交互产品（编辑器/绘图/IM 等）——这些请去 vue-pure-admin 完整版对应示例。
- 对"以 AI 为主要开发力"用户的最大价值：
  - **统一了 AI 修改前端的"地图"**：每个目录的作用、可改/不可改边界已经预先设计；
  - **降低 AI 漂移**：登录、路由、权限、请求拦截、token 刷新主流程已稳定；
  - **可持续同步上游**：避免被 AI 改坏底座后无法升级（同步策略见 `docs/pure-admin/11-upstream-sync.md`）。
- 核心原则（默念三遍）：
  1. **后端 API（NestJS Swagger / OpenAPI）是契约的事实来源**，前端只做适配。
  2. **底座目录只读为主，业务代码加在 `src/views/<业务模块>/` 与 `src/api/<业务模块>.ts`。**
  3. **mock 不是真接口**，业务模块必须尽早接 NestJS 真实 API。
  4. **每个新页面前，先去 vue-pure-admin 完整版搜相似范式**，再考虑自创。

---

## 0.5 后端 4 大红线（P0，置顶硬约束）

> 这 4 条是**最高优先级**的硬约束。任何违反这 4 条的行为（无论 AI 还是协作者）**必须立刻停止**并回到本文档对齐。

### 红线 1：不从前端反推数据库

- **禁止**根据本仓库的任何前端字段、表单、列表列定义反向设计 NestJS Prisma schema。
- 后端模型由 NestJS 后端独立设计，前端做"适配层"，**字段不一致时改前端**。
- 反面案例：看到 `src/views/tenant/list/utils/hook.tsx` 用了 `accountCount/expireTime/packageId/contactMobile`，就要求后端建一张同名同字段的 `tenants` 表 ❌。

### 红线 2：不从 mock 反推 API

- `mock/*.ts` 中的 URL（如 `/login`、`/dict-tree`、`/tenant-list`、`/get-async-routes`）**仅为演示**。
- NestJS 真实 API 路径以 Swagger / OpenAPI 为准，**前端去适配**。
- 反面案例：让后端实现 `/dict-tree`、`/tenant-package-menu` 这些 mock 路径 ❌。

### 红线 3：不从 Max-Ts 多租户反推 tenant 模型

- 第一阶段是**单一后台**，**不是 SaaS**，**不需要**多租户。
- `VITE_ENABLE_TENANT` 必须设为 `false`；`tenantManagementRouter` 必须从菜单中隐藏。
- `src/views/tenant/list/` 与 `src/views/tenant/package/` 的源码作为"参考范式"保留，**不删除**；后续是否物理删除以单独 PR 决策。
- 反面案例：因为模板有租户/套餐/套餐菜单 RBAC，就建 `Tenant / TenantPackage / TenantPackageMenu` 三表 ❌。

### 红线 4：不从前端 permissions / auths 反推后端 RBAC

- 前端的 `roles: ["admin","common"]`、`permissions: ["*:*:*"]`、`auths: ["permission:btn:add"]` 等命名**只是 UI 显隐 key**。
- 它们**不等于**后端 BizCode；**不等于**后端 Permission 表；**不是** RBAC 设计依据。
- 后端 RBAC（角色 / 权限 / 范围 / 业务码）由 NestJS 独立设计；前端在登录后**接收并适配**，不反向定义。
- 反面案例：因为 mock 返回 `"*:*:*"`，就给 NestJS 设计"通配权限字符串"模型 ❌。

---

## 1. AI 通用硬规则摘要（详见 `docs/pure-admin/02-ai-rules.md`）

1. **新页面前必先扫 vue-pure-admin 完整版** + 本项目已有范式。
2. **不得反推后端**：所有字段、枚举、状态、API 路径、错误码以 NestJS Swagger 为准（红线 1~4）。
3. **不得把 mock 当真实接口**；**禁止新增业务 mock**；临时 UI 占位 mock 必须 `*.demo.ts` 命名（裁决 4）。
4. **不得每个页面发明新范式**：优先沿用 `dict / tenant/list / schedule` 的目录范式。
5. **TypeScript 业务代码禁止 `any`**；通过 `pnpm typecheck` + `pnpm lint`（`--max-warnings 0`）；**禁止 `// eslint-disable` / `// @ts-ignore` 绕过**。
6. **路由 name 与组件 `defineOptions.name` 必须一致**。
7. **i18n 暂不启用**；**禁止**自行 `pnpm add vue-i18n`。
8. **每次改动后必须跑** `pnpm lint && pnpm typecheck`；提交前再跑 `pnpm build`。
9. **多租户模板不得启用**：`.env: VITE_ENABLE_TENANT=false`；`tenantManagementRouter` 必须隐藏；**源码保留**（裁决 1）。
10. **asyncRoutes 第一阶段禁止启用**（裁决 2）：不切 import、不补 `getMenuList`、不为前端动态菜单倒逼后端。`getMenuList` 不存在不是 bug，不允许补。
11. **演示角色名不得作为正式角色**（裁决 3）：`admin / common / *:*:* / permission:btn:add` 仅为演示，接 NestJS 时全量替换。
12. **commit 必须符合 commitlint**；不要 `--no-verify` 绕过 husky。
13. **不得在源码中硬编码 `VITE_*` 默认值** 或 `import.meta.env.VITE_*` 附带 fallback；配置必须在 `.env` 或 `public/platform-config.json`。
14. **底座升级走人类**；上游同步必须先评估（见 `docs/pure-admin/11-upstream-sync.md`），AI 不得自行 cherry-pick。

### AI 命令权限（裁决 5）

- ⛔ AI 严禁自行执行：`pnpm add / remove / update / clean:cache`、`rm pnpm-lock.yaml`、直接编辑 `package.json` 的 `dependencies / devDependencies / engines / pnpm` 字段（视同 `pnpm add / update`）、升级核心依赖、替换 UI 库或构建工具；
- ✅ AI 允许在明确任务下执行：`pnpm dev / build / typecheck / lint / preview`；
- ⚠️ `pnpm install` 仅允许在首次安装或人类明确要求时执行。

### AI 任务接入 8 步 Checklist（每次开工必做，详见 `02-ai-rules.md` §13.4）

| Step | 动作                                                                                                                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | 读主入口 §0 / §0.5 + `02-ai-rules.md` §13 + `09-pr-roadmap.md` + `02-ai-rules.md` §16 阅读清单，确认本任务不踩任何红线；并明确写：本任务是否涉及后端字段 / 表 / API 路径定义？若涉及，逐项列出 |
| 2    | `vue-pure-admin/src/views/` 搜相似范式                                                                                                                                                         |
| 3    | 本仓库 `src/views/` 找最相似的现有范式                                                                                                                                                         |
| 4    | 列出涉及的文件改动清单，每条标 `02-ai-rules.md` §13.1 矩阵中的 ✅ / ⚠️ / ❌                                                                                                                    |
| 5    | 列出复用组件、不新增依赖                                                                                                                                                                       |
| 6    | 列出新增 `src/api/<模块>.ts` 接口与类型，对照 Swagger；显式说明 mock 边界                                                                                                                      |
| 7    | `pnpm lint && pnpm typecheck` 全绿                                                                                                                                                             |
| 8    | `pnpm build` 验证；涉及路由/菜单/权限的跑 `pnpm dev` 自查                                                                                                                                      |

---

## 2. 任务类型 → 必读文档映射（每次开工查这里）

| 任务类型                          | 🔴 每次必读                                                                                                                                                                  | 🟡 相关任务必读                                                                                                                                                                                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 任何前端改动                      | 本主入口（§0 / §0.5 / §1 / §3 PR 摘要）+ `02-ai-rules.md`（重点 §13.1 矩阵、§13.4 Checklist）+ `.env` + `public/platform-config.json` + `types/router.d.ts` + `package.json` | —                                                                                                                                                                                                                                                                        |
| 改路由 / 菜单                     | 同上                                                                                                                                                                         | `03-router-menu.md`、`src/router/index.ts`、`src/router/utils.ts`、`src/router/modules/{home,error,remaining}.ts`（**禁碰 `src/router/asyncRoutes.ts`**）                                                                                                                |
| 改登录 / Token / 接 NestJS        | 同上                                                                                                                                                                         | `04-auth-permission.md`、`05-http-api.md`、`08-starter-derivation.md`、`src/views/login/index.vue`、`src/api/user.ts`、`src/utils/auth.ts`、`src/utils/http/index.ts`、`src/utils/http/types.d.ts`、`src/store/modules/user.ts`、`mock/login.ts`、`mock/refreshToken.ts` |
| 改权限 / 按钮显隐                 | 同上                                                                                                                                                                         | `04-auth-permission.md`、`src/store/modules/permission.ts`、`src/components/ReAuth/src/auth.tsx`、`src/components/RePerms/src/perms.tsx`、`src/directives/auth/index.ts`、`src/directives/perms/index.ts`、`src/utils/auth.ts:hasPerms`                                  |
| 新增业务列表 / 表单页             | 同上                                                                                                                                                                         | `07-max-ts-modules.md` §9 范式表、`src/views/tenant/list/index.vue` + `utils/hook.tsx`、`src/views/dict/index.vue` + `utils/hook.tsx`、`src/components/ReDialog/index.vue`、`src/components/RePureTableBar/src/bar.tsx`                                                  |
| 改 layout / 主题                  | 同上                                                                                                                                                                         | `01-project-map.md` §3.7、`02-ai-rules.md` §13.1 ❌ 行；改前必须输出 §13.2.2 单独 PR 评估                                                                                                                                                                                |
| 改 vite / 构建                    | 同上                                                                                                                                                                         | 同上；走 `02-ai-rules.md` §13.2.1 + §13.2.2 流程                                                                                                                                                                                                                         |
| 同步上游                          | 同上                                                                                                                                                                         | `11-upstream-sync.md` 必读全文                                                                                                                                                                                                                                           |
| 派生业务项目（如 srvf-admin-web） | 同上                                                                                                                                                                         | `08-starter-derivation.md`、`09-pr-roadmap.md`、`11-upstream-sync.md`                                                                                                                                                                                                    |
| Mock / 字典占位                   | 同上                                                                                                                                                                         | `06-mock-risk.md`、`07-max-ts-modules.md` §10.1                                                                                                                                                                                                                          |
| 查官方文档 / 排查 FAQ             | 同上                                                                                                                                                                         | `12-official-docs-index.md` 必读 §3 阅读表 + §5 禁止反推清单                                                                                                                                                                                                             |

🟢 必要时参考：`vue-pure-admin/src/views/<对应模块>` / `src/main.ts` / `App.vue` / `src/config/index.ts` / `build/plugins.ts` / `src/style/index.scss` / `src/style/tailwind.css` / `vite.config.ts` / `src/store/modules/multiTags.ts` / `app.ts` / `settings.ts` / `epTheme.ts` / `src/layout/hooks/*`。

---

## 3. PR-1 ~ PR-8 路线摘要（详见 `docs/archive/09-pr-roadmap.md`）

> 每个 PR 都有「目标」「修改范围」「禁止范围」「DoD」。**按顺序、独立提，不得合并**。

| PR       | 目标                               | 关键修改范围                                                                                                                                                | 关键禁止                                                           |
| -------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **PR-1** | 文档初始化（baseline + 11 份专题） | `docs/**`                                                                                                                                                   | 任何业务代码、配置、依赖、`.env`、根 `README.md`                   |
| **PR-2** | 模板污染源关闭                     | `.env: VITE_ENABLE_TENANT=false`、`mock/asyncRoutes.ts` 注释 `tenantManagementRouter`、`build/plugins.ts: enableProd=false`、`vite.config.ts: server.proxy` | 不删 `src/views/tenant/*`；不动 `src/utils/http`                   |
| **PR-3** | 本地运行 / 构建验证                | 仅文档或无代码变更                                                                                                                                          | 任何业务 / 底座改动                                                |
| **PR-4** | NestJS 登录对接                    | `src/api/user.ts`、`src/utils/auth.ts`、`src/utils/http/index.ts`（**底座单独 PR 评估**）、`mock/login.ts`、`mock/asyncRoutes.ts` 角色名                    | 禁启用 `asyncRoutes.ts`；禁反向定义后端字段                        |
| **PR-5** | 业务静态菜单骨架                   | `src/router/modules/<业务>-*.ts`、`src/views/<业务>-*/index.vue`、`src/views/welcome/index.vue`                                                             | 禁启用 `asyncRoutes`；禁接真 API；禁硬编码字典/角色；mock 不得新增 |
| **PR-6** | 字典页面改造（隐藏 + 占位）        | `mock/asyncRoutes.ts` 注释 `dictManagementRouter`、可选 `src/constants/<模块>.demo.ts`                                                                      | 禁把 demo 当正式字典；禁反推后端字典字段                           |
| **PR-7** | 组织架构页面骨架                   | `src/router/modules/<业务>-org.ts`、`src/views/<业务>-org/index.vue`                                                                                        | 禁硬编码真实层级；禁设计后端表结构                                 |
| **PR-8** | 活动日历 UI 占位                   | `src/router/modules/<业务>-calendar.ts`、`src/views/<业务>-calendar/index.vue`                                                                              | 禁设计活动 schema / 状态机                                         |

### 第一阶段 DoD 总览

- [ ] PR-1 ~ PR-8 全部合并；
- [ ] 默认菜单显示：首页 / 队伍 / 队员 / 活动日历 / 组织架构（其他 Max-Ts 演示模块全部隐藏）；
- [ ] 用 NestJS 真账号登录可达，role / permissions 由后端返回；
- [ ] `enableProd=false`、`VITE_ENABLE_TENANT=false`；
- [ ] `pnpm lint && pnpm typecheck && pnpm build` 在 CI 全绿；
- [ ] 后端 NestJS Swagger 已采集到 `docs/openapi.json`（或类似位置）；
- [ ] 没有任何"为前端方便"而出现的后端字段 / 表 / 路径变更。

### 永不从前端模板反推（详见 `08-starter-derivation.md` §14.4）

多租户字段、菜单管理 23 字段表、权限 code、字典字段、日历事件类型 / 状态机、API 路径风格、返回结构——**都以后端为准**。

---

## 4. Open Questions（卡住 PR-4 之后的关键问题）

> 完整列表见 `docs/archive/10-review-log.md` §18.1.5。以下 5 个是**第一阶段必答**。

1. **NestJS 返回结构**：`{ code, message, data }` / `{ data, meta }` / `{ success, data, error }` ？决定 `05-http-api.md` §7.5 拦截器适配代码 → **卡 PR-4**。
2. **NestJS 是否有 refresh-token 机制**：决定 `05-http-api.md` §7.6 保留 / 降级 → **卡 PR-4**。
3. **NestJS `expires` 字段格式**：ISO 字符串 / unix ms / `expiresIn` 秒数 → 决定 `setToken` 改法 → **卡 PR-4**。
4. **后端真实角色名**：决定 `mock/asyncRoutes.ts` 与 `src/router/modules/<业务>-*.ts` 的 `meta.roles` → **卡 PR-4 / PR-5**。
5. **后端 API 路径前缀**：`/api/v1/*` / `/v1/*` / `/` → 决定 `vite.config.ts: server.proxy` → **卡 PR-2 / PR-4**。

剩余 5 个见 `10-review-log.md`（BizCode 映射 / 业务模型字段 / 菜单 API / 多产品后端策略 / CI 部署）。

---

## 5. 专题文档索引

| #   | 文件                                                                                  | 内容                                                                                                                     |
| --- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 01  | [`docs/pure-admin/01-project-map.md`](./pure-admin/01-project-map.md)                 | 项目定位 / 技术栈 / 目录结构 / 工程命令                                                                                  |
| 02  | [`docs/pure-admin/02-ai-rules.md`](./pure-admin/02-ai-rules.md)                       | AI 开发硬规则（文件改动矩阵、命令权限、单独 PR、8 步 Checklist、阅读清单分级）                                           |
| 03  | [`docs/pure-admin/03-router-menu.md`](./pure-admin/03-router-menu.md)                 | 路由与菜单系统（静态 / 动态 / asyncRoutes 禁用红线 / 双 whiteList / meta 字段 / 拍平因果）                               |
| 04  | [`docs/pure-admin/04-auth-permission.md`](./pure-admin/04-auth-permission.md)         | 登录 / Token / 权限体系（三层权限决策树、演示角色名生命周期、前后端权限边界）                                            |
| 05  | [`docs/pure-admin/05-http-api.md`](./pure-admin/05-http-api.md)                       | 请求封装与 API 管理（NestJS 返回结构 / `expires` / refresh-token 适配）                                                  |
| 06  | [`docs/pure-admin/06-mock-risk.md`](./pure-admin/06-mock-risk.md)                     | Mock 体系与硬规则（默认禁新增、`*.demo.ts` 限制、生产关闭）                                                              |
| 07  | [`docs/pure-admin/07-max-ts-modules.md`](./pure-admin/07-max-ts-modules.md)           | 组件 / 页面范式 / Max-Ts 特有能力盘点 / vue-pure-admin 完整版参考策略                                                    |
| 08  | [`docs/pure-admin/08-starter-derivation.md`](./pure-admin/08-starter-derivation.md)   | 从 starter 派生业务项目 / NestJS 后端对接策略 / 多产品复用                                                               |
| 09  | [`docs/archive/09-pr-roadmap.md`](./archive/09-pr-roadmap.md)                         | 第一阶段落地路线 / PR-1 ~ PR-8 / DoD / 风险清单                                                                          |
| 10  | [`docs/archive/10-review-log.md`](./archive/10-review-log.md)                         | Review 修订记录 v0.2 → v0.2.1 → v0.3 / 采纳与未采纳清单 / Open Questions                                                 |
| 11  | [`docs/pure-admin/11-upstream-sync.md`](./pure-admin/11-upstream-sync.md)             | 上游 → starter → 业务项目 同步策略 / 高风险文件清单 / 同步分类                                                           |
| 12  | [`docs/pure-admin/12-official-docs-index.md`](./pure-admin/12-official-docs-index.md) | Pure Admin 官方文档索引与 FAQ 裁决（不复制官网全文；任务类型 → 官方页 + 本地文档映射；禁止反推清单；路径与环境注意事项） |

---

## 6. v0.2.1 关键裁决摘要（合计 8 + 10 条，永久保留）

> 这是历次 review 的"结论汇总卡"。任何动作冲突这 18 条都需要回到本文档对齐。

### 6.1 来自 v0.2 review 的 8 条裁决（用户拍板）

1. **不物理删除多租户源码**（裁决 1）：多租户仅运行态禁用 + 菜单隐藏，源码保留。
2. **asyncRoutes 第一阶段禁止启用**（裁决 2）：不切 import、不补 `getMenuList`、不为前端动态菜单倒逼后端。`getMenuList` 不存在不是 bug。
3. **前端 permissions / auths / roles 仅是 UI 显隐 key**（裁决 3）：不等于后端 BizCode、Permission 表、RBAC 设计依据。
4. **mock 默认禁新增**（裁决 4）：临时 UI 占位必须 `*.demo.ts`；接真 API 后立删；生产 `enableProd=false`。
5. **AI 命令权限明文细则**（裁决 5）：禁 `pnpm add/remove/update/clean:cache`；禁直接改 `package.json` 依赖字段。
6. **正式字典以后端为准**（裁决 6）：不在前端硬编码正式字典；UI 占位只允许 `*.demo.ts`。
7. **活动日历仅 UI 占位**（裁决 7）：不设计活动数据库；不定义状态机。
8. **组织架构仅 UI 骨架**（裁决 8）：不硬编码真实层级；不固定字段。

### 6.2 来自 v0.2.1 回归 review 的 10 条句级补丁（已写入各专题）

1. 即便后续启用 asyncRoutes，前端字段也不得反推后端表结构（`03-router-menu.md` §5.2.1）。
2. 第一阶段一律禁启 asyncRoutes，**与后端是否已有菜单 API 无关**（`08-starter-derivation.md` §11.2 表格）。
3. 日历 / 排班字段反推矩阵新增"事件类型、状态机（draft / published / cancelled 等）"（`08-starter-derivation.md` §14.4）。
4. 前端刷新队列 vs 后端 refresh-token：两者独立；后端无 refresh 时前端降级，不倒逼后端（`05-http-api.md` §7.6）。
5. 8 步 Checklist Step 1 输出明确写"本任务是否涉及后端字段 / 表 / API 路径定义？若涉及逐项列出"（`02-ai-rules.md` §13.4）。
6. 直接编辑 `package.json` 的 `dependencies / devDependencies / engines / pnpm` 字段视同 `pnpm add / update`（`02-ai-rules.md` §13.2.1）。
7. `import.meta.env.VITE_*` 取值不得在源码侧附带默认值 / fallback（`02-ai-rules.md` §13.3 第 13 条）。
8. `mock/**` 权限矩阵升级为 ❌；备注与 §8.5 对齐（`02-ai-rules.md` §13.1）。
9. asyncRoutes 第一阶段禁止触发项 5 条清单（`03-router-menu.md` §5.2.1）。
10. mock 新增条件改为"默认禁止；仅极端情况允许 `*.demo.ts` 占位"（`06-mock-risk.md` §8.5）。

### 6.3 上游同步规则（v0.3 新增，详见 `11-upstream-sync.md`）

- 不允许直接 `git merge` / `git pull` 上游到 starter；
- 每次同步必须先做只读评估；
- 高风险文件清单 + 5 类同步分类；
- 上游 → starter → 业务项目 同步链路；
- 上游 mock / tenant / asyncRoutes 演示代码不得污染业务项目。

---

## 7. 最后提醒

- **本主入口不收录细节**，所有细节都在 `docs/pure-admin/` 下的 11 份专题文档里；
- **AI 每次开工**：先读本主入口的 §0 / §0.5 / §1 / §2 / §3，再按任务类型加载 §2 映射到的专题；
- **本仓库是 starter**：业务在派生项目里做，starter 内不要直接开发业务（见 `08-starter-derivation.md` §17.3）；
- **任何违反 §0.5 红线、§1 硬规则、§6 裁决的行为**都应当被立即停下来重新对齐。
