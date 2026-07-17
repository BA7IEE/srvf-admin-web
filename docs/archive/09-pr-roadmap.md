# 09 · PR Roadmap · 第一阶段落地路线 / PR-1 ~ PR-8 / DoD

## 本文适用任务

- 在派生业务项目（如 `srvf-admin-web`）中按 PR-1 ~ PR-8 顺序推进第一阶段
- 评估某个改动该归属哪个 PR
- 判断"第一阶段最小可用"达成与否
- 给出每个 PR 的修改范围 / 禁止范围 / DoD 验收点

## 必须先读

- 主入口 §0.5 后端 4 大红线
- `02-ai-rules.md` §13.1 矩阵 + §13.4 8 步 Checklist
- `04-auth-permission.md`、`05-http-api.md`、`06-mock-risk.md`、`08-starter-derivation.md`

## 禁止事项

- ⛔ 禁止把多个 PR 合并提交（每个 PR 只做一件事）
- ⛔ 禁止跳过 PR 顺序（PR-4 必须先于 PR-5）
- ⛔ 禁止在第一阶段做"暂缓 / 永不"事项（详见 §14.2、§14.3）
- ⛔ 禁止在派生项目第一阶段引入 monorepo / 三产品同启
- ⛔ 禁止在任一 PR 中"为前端方便"反推后端

## 相关关键文件路径

- `.env / .env.development`
- `mock/asyncRoutes.ts`
- `build/plugins.ts`
- `vite.config.ts`（`server.proxy`）
- `src/api/user.ts`、`src/utils/auth.ts`、`src/utils/http/index.ts`
- `src/router/modules/<业务>-*.ts`
- `src/views/welcome/index.vue`

---

## 14. 第一阶段落地建议

> 第一阶段定义：在派生业务项目里，把 starter 改成「业务后台最小可用版」。
>
> **第一阶段最小可用**的边界：
>
> - ✅ 能用 NestJS 真账号登录、获取真实角色 / 权限；
> - ✅ 侧边栏只显示业务核心菜单（含组织 / 日历占位）；
> - ✅ 业务列表 / 表单 / 弹窗范式可复用；
> - ✅ 演示模块（dict / tenant / schedule / permission）源码保留但菜单隐藏；
> - ❌ 不要求完整 RBAC / 字典管理 / 角色分配等管理后台页；
> - ❌ 不要求多产品同时启用（先把一个业务跑通）；
> - ❌ 不要求富文本 / Excel / 流程图等重交互。

### 14.1 必做（按 §17.2 的 PR 顺序执行）

详见下方 §17.2 PR-1 ~ PR-8。

### 14.2 暂缓（第二阶段及之后，按"何时触发"分类）

#### 14.2.1 二阶段必做（等后端对应 API 就绪后立即做）

- **字典接真接口**：等 NestJS `dict_types / dict_items`（或同等模型）落地。
- **用户管理页（system/user）**：等 NestJS 用户 CRUD API。
- **组织架构接真接口**：等 NestJS 组织模型确认。
- **活动日历接真接口**：等 NestJS `Activity / Event / Attendance` 模型确认。
- **响应错误码统一处理**：在 `src/utils/http/index.ts` 响应拦截器加 NestJS `BizCode → message` 映射（由人类拍板）。

#### 14.2.2 三阶段或更后（业务规模上来再考虑）

- 角色 / 权限管理页（先用后端默认 RBAC 即可）；
- 附件管理 / 上传组件（等附件需求明确 + 对象存储就绪）；
- 审计日志页；
- Excel 导出 / CSV 导出（看是否真有报表需求）；
- 富文本编辑器 / 流程图 / 思维导图等重交互（按需）。

#### 14.2.3 永不（不在本 starter 体系业务范围）

- 国际化（i18n）；
- 多语言切换 UI；
- 多租户 SaaS 化；
- 前端单元 / e2e 测试体系（如有需要由人类专项立项）；
- 组件库 Storybook。

### 14.3 禁止提前做（任何阶段都不允许"凭前端模板自作主张"）

1. ⛔ 多租户管理启用 / 反推 tenant 表（主入口红线 3、`07-max-ts-modules.md` §10.2）；
2. ⛔ 租户套餐菜单 RBAC 反推后端 schema（红线 3 + 4、`07-max-ts-modules.md` §10.3）；
3. ⛔ 启用 `src/router/asyncRoutes.ts` / 补 `getMenuList` / 反推菜单管理表（红线 2、`03-router-menu.md` §5.2.1、`07-max-ts-modules.md` §10.5）；
4. ⛔ 把 `admin / common / *:*:* / permission:btn:add` 当作正式角色名 / 权限 code（红线 4、`04-auth-permission.md` §6.6.2）；
5. ⛔ 按 mock 字段（`dictId/label/value/status/color`、`packageId/expireTime/contactMobile` 等）反推后端字段（红线 1、2）；
6. ⛔ 前端国际化（i18n）；
7. ⛔ 升级 Vue / Vite / Element Plus / TypeScript 等核心依赖（`02-ai-rules.md` §13.2.1）；
8. ⛔ 把"三个后台（SRVF / U Studio / U Agents）"同时启动 / 同前端区分菜单（先把一个跑通，多产品策略见 `08-starter-derivation.md` §17.3）；
9. ⛔ 前端定义 BizCode 体系（后端独立设计）；
10. ⛔ 提前做"前端按钮权限 code 体系"（等后端 RBAC 与 BizCode 落地）。

---

## 17. PR 拆分路线 + 验收

### 17.1 最终结论

- **本 starter 适合作为长期后台前端底座**——结构清晰、主流程稳定、可永久同步上游（见 `11-upstream-sync.md`）。
- **应该这样用**：
  - 仅在 `src/views/`、`src/api/`、`src/store/modules/`（新模块）里写业务；
  - 通过 vue-pure-admin 完整版查范式，再适配后端契约；
  - 把 NestJS Swagger 当作前端类型与契约的事实来源；
  - 用 `02-ai-rules.md` §13 矩阵约束 AI 不要碰底座；
  - **每个 PR 只做一件事**（见 §17.2）。
- **不应该这样用**：
  - 不要把 mock 当生产 API；
  - 不要根据 Pure Admin 模板反推后端表结构、不要启用多租户、不要开启动态菜单（主入口红线 1~4）；
  - 不要在没有需求时启用国际化、富文本编辑器等"未来功能"；
  - 不要让 AI 升级依赖或改 vite/eslint 配置（`02-ai-rules.md` §13.2.1）。

### 17.2 PR 拆分路线（第一阶段 8 个 PR）

> 每个 PR 都有「目标」「修改范围」「禁止范围」「DoD（完成判定）」。AI 必须按顺序、独立提 PR，不得合并。

#### PR-1：文档初始化

- **目标**：在派生项目仓库固化 baseline + 专题文档（即从 starter 继承的本目录 `docs/`）；如有项目特化的派生说明，新增项目侧的派生说明文件（不动 starter 体系）。
- **修改范围**：仅 `docs/**`。
- **禁止范围**：任何业务代码、配置、依赖、`.env`、根 `README.md`（除非派生项目身份调整）。
- **DoD**：
  - [ ] `docs/pure-admin-max-ts-baseline.md` 主入口完整；
  - [ ] `docs/pure-admin/01~11-*.md` 11 份专题文档齐备；
  - [ ] git diff 仅触及 `docs/`；
  - [ ] PR 描述链接 review 汇总（如有）。

#### PR-2：模板污染源关闭

- **目标**：把模板默认开启的"会污染后端"或"不上线"开关关掉。
- **修改范围**：
  - `.env`：`VITE_ENABLE_TENANT=false`；
  - `mock/asyncRoutes.ts`：注释 `tenantManagementRouter` 出现在 `data` 数组中的那一项（仅菜单隐藏，源码保留）；
  - `build/plugins.ts`：`vitePluginFakeServer({ ..., enableProd: false })`；
  - `vite.config.ts`：`server.proxy` 加 NestJS 后端代理（如 `'/api': { target: 'http://localhost:3000', changeOrigin: true, rewrite: p => p.replace(/^\/api/, '') }`）——具体路径由后端确认。
- **禁止范围**：不删 `src/views/tenant/*`；不改 mock 其余条目；不改业务页面；不动 `src/utils/http`。
- **DoD**：
  - [ ] `pnpm dev` 后侧栏无"租户管理"菜单；
  - [ ] `pnpm build` 后产物中 mock 不再被 ship 到生产（grep 不到 mock URL，或 fake-server 已禁用）；
  - [ ] `vite.config.ts: server.proxy` 配置可被 `pnpm dev` 加载（即使后端未启动，proxy 错误日志可见即可）。

#### PR-3：本地运行与构建验证

- **目标**：在干净环境验证 PR-1 + PR-2 后项目仍能跑通。
- **修改范围**：**仅文档**（如 `docs/setup-notes.md` 记录运行步骤）或者**无代码变更**——这是验证性 PR。
- **禁止范围**：任何业务 / 底座代码改动。
- **DoD**：
  - [ ] `pnpm install` 通过；
  - [ ] `pnpm dev` 启动无错；默认登录（admin/admin123 或 common/admin123）可登入；
  - [ ] `pnpm typecheck` 零错；
  - [ ] `pnpm lint` 零错零警；
  - [ ] `pnpm build` 成功。

#### PR-4：NestJS 登录对接

- **目标**：用 NestJS 真账号登录，并打通响应结构 / 角色 / Token 适配。
- **修改范围**：
  - `src/api/user.ts`：`getLogin`（与 `refreshTokenApi` 如适用）URL 与类型；
  - `src/utils/auth.ts`：`setToken` 中 `expires` 适配（`05-http-api.md` §7.5）；如后端无 refresh，按 `05-http-api.md` §7.6 降级；
  - `src/utils/http/index.ts`：响应拦截器一次性适配 NestJS 返回结构（**底座文件，按 `02-ai-rules.md` §13.2.2 单独 PR 评估**）；
  - 必要时改 `mock/login.ts`（标记为 demo 不再调用）；
  - `mock/asyncRoutes.ts` 中角色名：把 `["admin"]` / `["common"]` 替换为 NestJS 真实角色名（或直接删整段 mock 待 PR-5 替换为静态路由）。
- **禁止范围**：禁止启用 `src/router/asyncRoutes.ts`；禁止反向定义后端字段；禁止"为前端方便"要求后端建/改字段（主入口红线 1~4）。
- **DoD**：
  - [ ] 使用 NestJS 真账号能成功登录并跳转首页；
  - [ ] localStorage `user-info` 与 cookie `authorized-token` 字段无误；
  - [ ] 401 / 网络错误时 UI 行为正确（提示 + 不死循环）；
  - [ ] 刷新页面登录态保持；
  - [ ] `pnpm lint && pnpm typecheck && pnpm build` 全绿。

#### PR-5：业务静态菜单骨架

- **目标**：建立业务第一阶段菜单骨架（首页 / 队伍 / 队员 / 活动日历 / 字典占位 / 系统设置占位 等，具体看业务），完全静态。
- **修改范围**：
  - 新建 `src/router/modules/<业务>-*.ts`（如 `srvf-team.ts`、`srvf-member.ts`、`srvf-calendar.ts`）；
  - 新建对应 `src/views/<业务>-*/index.vue` 占位页（最低限度可显示标题即可，使用 `07-max-ts-modules.md` §9 列表范式骨架）；
  - 改 `src/views/welcome/index.vue` 为业务 dashboard 占位（标题、欢迎语，不接入数据）。
- **禁止范围**：禁止启用 `asyncRoutes.ts`；禁止接真 API；禁止硬编码字典 / 角色名；mock 不得新增。
- **DoD**：
  - [ ] 侧边栏显示业务核心菜单；
  - [ ] 点击每个菜单可进入占位页；
  - [ ] 静态路由 `meta.roles` 使用 NestJS 真实角色名；
  - [ ] 三项 lint / typecheck / build 全绿。

#### PR-6：字典页面改造（隐藏 + 占位策略）

- **目标**：隐藏字典菜单；提供"占位字典"基础结构（裁决 6）。
- **修改范围**：
  - 把 `mock/asyncRoutes.ts:dictManagementRouter` 从菜单数组移除（注释而非删除）；
  - 不接入真接口；
  - 如某业务真的需要"角色 / 装备状态"枚举占位，新建 `src/constants/<模块>.demo.ts`，文件头注释 `// TEMPORARY / DEMO`。
- **禁止范围**：禁止把 demo 常量当成正式字典；禁止反推后端字典字段；禁止在文件名上去掉 `.demo`。
- **DoD**：
  - [ ] 字典菜单不再出现；
  - [ ] 如有 demo 常量，文件名 / 注释明确；
  - [ ] lint / typecheck / build 全绿。

#### PR-7：组织架构页面骨架（裁决 8）

- **目标**：建立业务组织架构 UI 骨架。
- **修改范围**：
  - 新建 `src/router/modules/<业务>-org.ts`；
  - 新建 `src/views/<业务>-org/index.vue` 占位页（参考 vue-pure-admin `src/views/system/dept/` 的**交互范式**，不抄字段）；
  - 不接真接口。
- **禁止范围**：禁止硬编码真实队伍 / 分队 / 岗位字段；禁止设计后端表结构。
- **DoD**：
  - [ ] 菜单显示"组织架构"；
  - [ ] 页面占位可正常加载；
  - [ ] lint / typecheck / build 全绿。

#### PR-8：活动日历 UI 占位（裁决 7）

- **目标**：业务活动 / 训练 / 出勤日历 UI 骨架。
- **修改范围**：
  - 新建 `src/router/modules/<业务>-calendar.ts`；
  - 新建 `src/views/<业务>-calendar/index.vue`（参考 `src/views/schedule/`，仅 UI 骨架）；
  - 静态数据占位即可，不接 API。
- **禁止范围**：禁止设计活动数据库 schema；禁止定义状态机；禁止反推后端 Activity / Event 模型。
- **DoD**：
  - [ ] 菜单显示"活动日历"；
  - [ ] 页面可显示 Element Calendar；
  - [ ] lint / typecheck / build 全绿。

### 17.4 第一阶段验收（DoD 汇总）

第一阶段完成的统一标志：

- [ ] PR-1 ~ PR-8 全部合并；
- [ ] 默认菜单显示：首页 / 队伍 / 队员 / 活动日历 / 组织架构（其他 Max-Ts 演示模块全部隐藏）；
- [ ] 用 NestJS 真账号登录可达，role / permissions 由后端返回；
- [ ] `enableProd=false`、`VITE_ENABLE_TENANT=false`；
- [ ] `pnpm lint && pnpm typecheck && pnpm build` 在 CI 全绿；
- [ ] 后端 NestJS Swagger 已采集到 `docs/openapi.json`（或类似位置）；
- [ ] 没有任何"为前端方便"而出现的后端字段 / 表 / 路径变更。

---

## 风险清单（沿用 v0.2）

| #   | 风险                                                                                         | 来源                                          | 缓解                                                  |
| --- | -------------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------- |
| R1  | 前端模板污染后端设计（多租户 / 套餐 / 字典字段反推）                                         | `views/tenant`、`mock/system.ts`              | 主入口红线 + `02-ai-rules.md` §13.3；隐藏 tenant 菜单 |
| R2  | AI 乱改底座（layout / router / http / store）                                                | AI 默认行为                                   | `02-ai-rules.md` §13.1 矩阵 + §13.2 强制评估          |
| R3  | mock 误导（生产仍走 mock）                                                                   | `build/plugins.ts:enableProd=true`            | 上线前关 `enableProd` 或卸插件                        |
| R4  | 权限只做前端隐藏（v-auth / v-perms）                                                         | `src/components/ReAuth`, `RePerms`            | 后端最终校验；`04-auth-permission.md` §6.7            |
| R5  | 动态路由过早接入                                                                             | `src/router/asyncRoutes.ts`                   | 第一阶段不启用，见 `03-router-menu.md` §5.2.1         |
| R6  | 多租户误启用                                                                                 | `.env: VITE_ENABLE_TENANT=true` 默认          | 立即改为 false                                        |
| R7  | 国际化误启用                                                                                 | starter 当前无 i18n                           | 不要随手 `pnpm add vue-i18n`                          |
| R8  | 页面范式不统一                                                                               | 不同 AI 不同写法                              | `07-max-ts-modules.md` §9.8                           |
| R9  | 依赖升级风险（vite 8 / vue 3.5 / tailwind 4 / typescript 6 / eslint 10 / element-plus 2.13） | `package.json` 均为较新版本                   | 升级走人类；CI 跑 `lint + typecheck + build`          |
| R10 | 从完整版迁移代码时引入不兼容逻辑                                                             | 复制 vue-pure-admin 页面时连组件 + 依赖一起带 | `07-max-ts-modules.md` §12.3                          |
| R11 | token 刷新风暴                                                                               | `src/utils/http/index.ts` 队列                | 后端 refresh 接口必须稳定，否则全站 logout            |
| R12 | 三级菜单 keep-alive 不生效                                                                   | `formatTwoStageRoutes` 拍平                   | 业务避免依赖三级 keep-alive                           |
| R13 | 自动收集 `router/modules/**/*.ts`                                                            | `import.meta.glob` 包含所有 ts 文件           | 不要在 `router/modules/` 放工具脚本                   |
| R14 | `responsive-storage` 命名空间冲突                                                            | `responsivemaxts-`                            | 业务不要硬编码这个前缀                                |
| R15 | `vite-plugin-fake-server: enableProd: true` 在线上仍开                                       | `build/plugins.ts`                            | 接真后端前关闭                                        |
