# 02 · AI Rules · AI 开发硬规则 / 阅读清单

## 本文适用任务

- AI 接到**任意**前端任务（哪怕只是改一行文案）
- 评估某个改动是否触犯底座规则
- 决定改动是否需要单独 PR、是否要先输出风险评估
- 决定本次任务必须先读哪几份文档 / 哪几个源码文件

## 读取方式（Harness 2.0-FE 起）

- **恒读层 = 根 `AGENTS.md`**（唯一规则入口；Claude Code 另读根 `CLAUDE.md`）。本文件是**触碰才读的细则层**：按 §13 各节与 §16 映射取用，不要求每会话通读。
- 红线 1~4 全文见主入口 `docs/pure-admin-max-ts-baseline.md` §0.5。

## 禁止事项（文字单点在 AGENTS.md §1，机械闸兜底）

- 依赖变更 / husky 绕闸（`--no-verify` / `HUSKY=0`）/ 抑制注释（`@ts-*` / `eslint-disable`）/ 源码 `VITE_*` fallback 均由 `guard.mjs` + husky 机械拦截；细则见 §13.2.1 与 §13.3，禁止以「提速 / 临时跑通」为理由绕过或违反。
- 全量档任务禁止跳过 §13.4 preflight（档位定义见 §13.4）。

## 相关关键文件路径

- 本文件
- `eslint.config.js / stylelint.config.js / .prettierrc.js / commitlint.config.js / .husky/`
- `package.json`（lint / typecheck / build 脚本入口）
- 主入口 §0.5「后端 4 大红线」

---

## 13. AI 开发硬规则

### 13.1 文件改动矩阵（2.0-FE 对齐版 · 2026-07-17 true-up）

四档标记，与 `.claude/settings.json` 三档 + guard 纪律一一对应（`harness-doctor.mjs` 机械核对 ⚠️/❌ 行与 settings 的覆盖一致性）：

- ✅ **自由区**：可自由新建 / 修改，仍守 §13.3 纪律与红线；
- 🟡 **纪律区**：无静态闸（2.0-FE 移出 deny/ask），由 guard 内容规则 + 文档纪律约束，改前按备注自查；
- ⚠️ **逐次确认（ask）**：人在场逐条批；无人值守等同拒绝；
- ❌ **拒绝（deny）**：AI 不可改；人改版本化 `settings.json` 才能动，走 §13.2.2 单独 PR。

| 文件 / 目录                                                                                                                                                                      | AI 可改？                               | 备注                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `src/views/srvf/**` 业务页                                                                                                                                                       | ✅                                      | 两种被许可范式（A 列表三件套 / B 详情作战室），见 `src/views/srvf/CLAUDE.md`；优先复用 `@/srvf-kit` 原语                           |
| `src/api/srvf-*.ts`                                                                                                                                                              | ✅                                      | 类型对齐后端 live `/api/docs-json`                                                                                                 |
| `src/store/modules/srvf*.ts`                                                                                                                                                     | ✅                                      | **命名必须有业务前缀**（如 `srvfTeam.ts`），禁止 `data.ts` / `state.ts` 等无意义命名；不可改既有 store                             |
| `src/constants/<业务模块>.ts`、`src/types/business/` 等业务侧目录                                                                                                                | ✅                                      | UI 临时占位常量必须 `*.demo.ts` 命名或文件头注 `TEMPORARY / DEMO`（裁决 6）                                                        |
| `src/views/welcome/index.vue`                                                                                                                                                    | ✅                                      | 可改占位文案，不要改路由名                                                                                                         |
| `src/router/modules/srvf-*.ts` / 业务静态路由                                                                                                                                    | ✅                                      | meta.roles 用后端真实角色名                                                                                                        |
| `docs/pure-admin-max-ts-baseline.md` 与 `docs/pure-admin/**`                                                                                                                     | ✅                                      | 由人类批准后更新，必须保留章节结构（`13-ai-harness.md` 除外，见 ⚠️ 行）                                                            |
| `src/router/modules/home.ts`、`error.ts`、`remaining.ts`                                                                                                                         | 🟡                                      | 仅在新增「绝对静态路由」时追加，不改既有                                                                                           |
| `mock/**`                                                                                                                                                                        | 🟡                                      | 业务 mock 禁新增；仅 `*.demo.ts` 临时占位、且 PR 描述明确「接真 API 后立即删除」时允许（裁决 4）；mock 非契约                      |
| `src/layout/**`、`src/style/**`                                                                                                                                                  | 🟡                                      | 主题 / 多标签 / keep-alive / 暗黑核心，Tailwind v4 语法差异大；改前评估影响面并写进 PR，优先 mitt 事件 / 业务子组件扩展            |
| `src/api/user.ts`、`src/store/modules/user.ts`                                                                                                                                   | 🟡                                      | auth 申报制（AGENTS.md §2）：可随业务 PR 改，但必须显式申报「改了哪个 / 改了什么 / 影响面」                                        |
| `public/platform-config.json`                                                                                                                                                    | ⚠️ 改值可（guard 守）/ 增删字段不可     | `guard.mjs` 动态判定：顶层字段不变=放行，增删字段=拒绝，存疑=询问（13-ai-harness §13A.7）                                          |
| `src/utils/http/**`、`src/utils/auth.ts`                                                                                                                                         | ⚠️                                      | 全局副作用面；ask + 申报制（AGENTS.md §2）                                                                                         |
| `src/views/login/**`                                                                                                                                                             | ⚠️                                      | 登录主线；ask + 申报制（AGENTS.md §2）                                                                                             |
| `src/router/utils.ts`                                                                                                                                                            | ⚠️                                      | 动态路由 / 白屏防护核心                                                                                                            |
| `package.json`                                                                                                                                                                   | ⚠️ scripts 区可（guard 守）/ 依赖区不可 | `guard.mjs` 动态判定：仅 `scripts` 变=放行，依赖/engines/pnpm 等变=拒绝，其余字段/存疑=询问（13-ai-harness §13A.10）；取代静态 ask |
| `.husky/**`                                                                                                                                                                      | ⚠️                                      | worktree 里 `git commit` 执行的是**主 checkout** 的 `.husky/`（AGENTS.md §1）                                                      |
| `.claude/**`、`docs/pure-admin/13-ai-harness.md`                                                                                                                                 | ⚠️                                      | harness 自保护（13-ai-harness §13A.6）；无人值守等同拒绝                                                                           |
| `src/store/modules/permission.ts` / `multiTags.ts` / `app.ts` / `settings.ts` / `epTheme.ts`                                                                                     | ❌                                      | 框架内核 store                                                                                                                     |
| `src/router/index.ts` / `asyncRoutes.ts`                                                                                                                                         | ❌                                      | 登录、动态路由、白屏防护；asyncRoutes 禁用（裁决 2，详见 `03-router-menu.md` §5.2.1）                                              |
| `src/components/Re*/**`                                                                                                                                                          | ❌                                      | 底座组件，要扩展请 wrapper（整目录 deny 属 §13A.6 R3-b 有意加宽）                                                                  |
| `src/plugins/**`                                                                                                                                                                 | ❌                                      | 升级才动                                                                                                                           |
| `src/main.ts` / `App.vue` / `src/config/index.ts`                                                                                                                                | ❌                                      | 入口与全局配置                                                                                                                     |
| `pnpm-lock.yaml`                                                                                                                                                                 | ❌                                      | 依赖变更走人类（§13.2.1）；Read 亦拒（降噪）                                                                                       |
| `vite.config.ts` / `tsconfig.json` / `build/**` / `eslint.config.js` / `stylelint.config.js` / `.prettierrc.js` / `.lintstagedrc` / `commitlint.config.js` / `postcss.config.js` | ❌                                      | 工程级；底座改动必须单独 PR                                                                                                        |
| `.env` / `.env.development` / `.env.production` / `.env.staging`                                                                                                                 | ❌                                      | 由人类改；AI 也不得在源码中硬编码 `VITE_*` 默认值绕过                                                                              |

### 13.2 底座 / 工程文件改动规则

#### 13.2.1 ⛔ AI 命令权限（裁决 5）

**AI 严禁自行执行**以下命令（任何形式）：

- `pnpm add ...`
- `pnpm remove ...`
- `pnpm update ...`
- `pnpm clean:cache`（会清 `pnpm-lock.yaml`）
- `rm pnpm-lock.yaml` / 任何会清除 lockfile 的命令
- 修改 `package.json` 中的 `dependencies / devDependencies / engines / pnpm` 字段
- 升级核心依赖（Vue / Vite / Element Plus / Pinia / TypeScript / Tailwind / axios）
- 替换 UI 库（element-plus → ant-design 等）/ 构建工具（vite → webpack 等）

**AI 允许在明确任务下执行**：

- `pnpm dev`（启动开发服务）
- `pnpm build`（构建验证）
- `pnpm typecheck`（类型检查）
- `pnpm lint`（lint 检查）
- `pnpm preview`（预览打包结果）

**依赖恢复**：`pnpm install --frozen-lockfile`（**裸命令**——尾随管道 / 重定向会被 guard 当包名拦）随时可跑，fresh worktree 先跑它再 typecheck / commit；不带 `--frozen-lockfile` 的 `pnpm install` 仅允许在「首次安装」或「人类明确要求」时执行，不得用它间接更新依赖。

所有依赖变动都必须以 PR 描述形式向人类提出，由**人类手动执行命令**。

**直接编辑 `package.json` 的 `dependencies / devDependencies / engines / pnpm` 字段视同 `pnpm add / update`，同样禁止**——已机械化：guard 对 `package.json` 动态判（仅 `scripts` 区变更放行，依赖区变更直接拒绝，其余询问，见 13-ai-harness §13A.10）。

#### 13.2.2 底座 / 工程文件改动必须单独 PR

- 修改 §13.1 矩阵中 ❌ 文件 → **必须单独提交 PR**，不得与业务改动混在同一 PR；
- PR 描述必须包含：
  1. **修改原因**（业务诉求是什么）；
  2. **风险评估**（影响哪些功能 / 是否破坏升级路径 / 回滚方式）；
  3. **与 vue-pure-admin 上游的对比**（是否会让以后无法 cherry-pick 上游更新，见 `11-upstream-sync.md`）；
  4. **最小变更范围**（行数、影响文件清单）。
- AI 在拿不到这 4 项之前不得动手。

### 13.3 通用硬规则

1. **新页面前必先扫 vue-pure-admin 完整版** + 本项目已有范式：先查 `14-full-version-reference-index.md`（能力速查 → 路径，全量枚举），范式策略与红线见 `07-max-ts-modules.md` §12。
2. **不得反推后端**：所有字段、枚举、状态、API 路径、错误码以 NestJS Swagger 为准（主入口红线 1~4）。
3. **不得把 mock 当真实接口**；**禁止新增业务 mock**；临时 UI 占位 mock 必须 `*.demo.ts` 命名（裁决 4，详见 `06-mock-risk.md`）。
4. **不得每个页面发明新范式**：优先沿用 `src/views/srvf/**` 的两种被许可范式（A 列表三件套 / B 详情作战室，见 `src/views/srvf/CLAUDE.md`）与 `@/srvf-kit` 原语。
5. **TypeScript**：业务代码（`src/views/srvf*/`、`src/api/srvf*.ts`、`src/store/modules/srvf*.ts`）必须通过 `pnpm typecheck` 且**禁止 `any`**；如需绕过，先输出评估让人类决定（不靠 `// @ts-ignore`、`// eslint-disable` 一笔带过）。
6. **路由 name 与组件 `defineOptions.name` 必须一致**（详见 `03-router-menu.md` §5.5）。
7. **i18n 暂不启用**：业务文案直接写中文。**禁止**自行 `pnpm add vue-i18n`、自行启用 i18n 分支。
8. **改动收尾必须跑**：`pnpm lint && pnpm typecheck`，零错误零警告（项目 lint 用 `--max-warnings 0`，禁止 `// eslint-disable` 绕过；Stop 钩子会对 `src/**` 改动自动兜底 typecheck）；**build 由 PR 的 CI 机械把关**（`.github/workflows/ci.yml`，合并前 `gh pr checks` 全绿；本地 `pnpm build` 仅用于自诊）。
9. **多租户模板不得启用**：`.env: VITE_ENABLE_TENANT=false`；不得重新引入租户菜单 / 租户模型（演示 views 四目录已于 Phase 0-b 经维护者拍板物理删除，原裁决 1「源码保留」由该拍板取代）。
10. **asyncRoutes 第一阶段禁止启用**（裁决 2）：不切 import、不补 `getMenuList`、不为前端动态菜单倒逼后端。`getMenuList` 不存在不是 bug，不允许补。详见 `03-router-menu.md` §5.2.1。
11. **演示角色名不得作为正式角色**（裁决 3）：`admin / common / *:*:* / permission:btn:add` 等仅为演示，真码逐端点查 live 契约。详见 `04-auth-permission.md`。
12. **commit 必须符合 commitlint 规则**（`commitlint.config.js`）；不要用 `--no-verify` 绕过 husky。
13. **不得在源码中硬编码 `VITE_*` 默认值**绕过 `.env`；配置必须读 `.env` 或 `public/platform-config.json`。任何 `import.meta.env.VITE_*` 取值不得在源码侧附带默认值 / fallback；若需默认值，写入 `.env` 并由人类确认。
14. **底座升级走人类**：作者上游有更新时，**禁止直接 merge / pull 上游到 starter**；必须按 `11-upstream-sync.md` 流程评估，AI 不得自行 cherry-pick。

### 13.4 开工 preflight（分级 · 2026-07-17 起）

先**分型**再走查（Claude 可用 `/srvf-preflight` 一键产出）：

| 档位       | 适用任务                                                         | 要求                                                                                                                                       |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **全量档** | 新业务页 / 契约对接 / 触 ⚠️·❌ 邻域 / **无人值守 goal 一律全量** | 下表 Step 1~8 全走并显式输出各步结论，外加 AGENTS.md §2 申报与回滚点声明                                                                   |
| **轻量档** | 常规小改（文案 / 样式 / 局部逻辑，零契约面）                     | Step 1 一行红线自查 + Step 4 文件清单（标 §13.1 档位）；收尾跑 `pnpm lint && pnpm typecheck`（Stop 钩兜底）；`pnpm build` 由 PR 的 CI 承接 |
| **零码档** | 纯 docs / 分析 / 评审，零 `src/**` 代码改动                      | 声明「零码任务」+ 回滚点即可；Step 7~8 免（husky 与 Stop 钩自动兜底）                                                                      |

**不变量**：任何 PR 合并前 lint+typecheck+build 三绿——由 CI（`.github/workflows/ci.yml`）在 PR 上机械把关，合并前 `gh pr checks` 须全绿；guard / verify / husky 机械闸对所有档位一视同仁。

全量档 8 步如下：

| Step  | 动作                                                                                                                                                                                                                                                                                                             | 输出                                                                                                                                 |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **1** | 读主入口 §0 / §0.5、本文件 §13、§16 阅读清单，确认本任务不踩任何红线                                                                                                                                                                                                                                             | 列出「本任务涉及的红线编号 + 风险等级」；并明确写：本任务是否涉及后端字段 / 表 / API 路径定义？若涉及，逐项列出。                    |
| **2** | 用关键词在 `vue-pure-admin/src/views/` 全文搜索相似范式                                                                                                                                                                                                                                                          | 给出参考路径清单（即使没找到也要写「未找到，原因是 X」）                                                                             |
| **3** | 在本仓 `src/views/srvf/**` 找最相似的现有范式（范式 A 列表三件套 / 范式 B 详情作战室，见 `src/views/srvf/CLAUDE.md`）。**并读后端 `../srvf-nest-api/docs/handoff/admin-web.md` 能力图判定任务范式**：沿轴下钻（详情页 / 作战室，`activityId`/`memberId` 走路由）还是跨轴横扫（工作台）——**不是默认套 CRUD 列表** | 给出参考路径 + 复用范式说明；**显式答：「本页是任务页还是资源页？是否在用『选择父级』下拉看子资源？」若是 → STOP，改父级详情页内嵌** |
| **4** | 列出涉及的文件改动清单，每条标注 §13.1 矩阵中的 ✅ / 🟡 / ⚠️ / ❌                                                                                                                                                                                                                                                | 若含 ❌ → 触发 §13.2.2 单独 PR 流程；含 ⚠️ → 有人值守逐次批 + 风险评估；含 🟡 → 写明所循纪律                                         |
| **5** | 列出复用的 `Re*` 组件、`@/srvf-kit` 原语、`@pureadmin/table`、`ReDialog` 等；列出**不**新增的依赖                                                                                                                                                                                                                | 若需要新依赖 → 暂停等人类批准（§13.2.1）                                                                                             |
| **6** | 列出新增 `src/api/<模块>.ts` 的接口与类型，逐条对照 live `/api/docs-json`（缺则写「待后端确认」）                                                                                                                                                                                                                | 显式说明 mock 边界（裁决 4）                                                                                                         |
| **7** | 执行 `pnpm lint && pnpm typecheck`，零错误零警告                                                                                                                                                                                                                                                                 | 贴执行结果                                                                                                                           |
| **8** | build 交给 PR 的 CI 把关（合并前 `gh pr checks` 全绿；本地 `pnpm build` 仅自诊用）；若涉及路由 / 菜单 / 权限，跑一遍 `pnpm dev` 自查                                                                                                                                                                             | 贴构建结果 + 自查描述                                                                                                                |

---

## 16. 后续 AI 最小阅读清单（分级）

### 🔴 恒读层（所有任务）

根 `AGENTS.md`（唯一恒读源，§0 分层读取；Claude Code 另读根 `CLAUDE.md`）。本文件与其余专题文档**触碰才读**（按下表映射取用）；`.env`、`public/platform-config.json`、`types/router.d.ts`、`package.json` 在涉及配置 / 路由 meta / 依赖版本时按需查阅（依赖版本**禁改**，§13.2.1）。

### 🟡 相关任务必读（按任务类型选取）

| 任务类型                       | 必读                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **改路由 / 菜单**              | `03-router-menu.md`、`src/router/index.ts`、`src/router/utils.ts`、`src/router/modules/home.ts / remaining.ts / error.ts`（第一阶段**不读** `asyncRoutes.ts`，禁改）                                                                                                                                                                                                    |
| **改登录 / Token / 接 NestJS** | `04-auth-permission.md`、`05-http-api.md`、`08-starter-derivation.md`、`src/views/login/index.vue`、`src/api/user.ts`、`src/utils/auth.ts`、`src/utils/http/index.ts`、`src/utils/http/types.d.ts`、`src/store/modules/user.ts`                                                                                                                                         |
| **改权限 / 按钮显隐**          | `04-auth-permission.md`、`src/store/modules/permission.ts`、`src/components/ReAuth/src/auth.tsx`、`src/components/RePerms/src/perms.tsx`、`src/directives/auth/index.ts`、`src/directives/perms/index.ts`、`src/utils/auth.ts:hasPerms`                                                                                                                                 |
| **新增业务列表 / 表单页**      | **后端 `../srvf-nest-api/docs/handoff/admin-web.md`（任务→端点图 + 轴模型；先判任务页 vs 资源页）**、`14-full-version-reference-index.md`（完整版能力速查 / 全量枚举 / 重依赖）、`src/views/srvf/CLAUDE.md`（范式 A/B）、范式 A 三件套先例（如 `src/views/srvf/members-domain/members/`）、`@/srvf-kit`（`ListPage` / `useSrvfList` 等原语）、`07-max-ts-modules.md` §9 |
| **改 layout / 主题**           | 谨慎触碰（§13.1 🟡 纪律区）；先读 `01-project-map.md` §3.7 + §13.1 该行备注，评估主题 / 多标签 / keep-alive 影响面并写进 PR，优先 mitt 事件 / 业务子组件扩展                                                                                                                                                                                                            |
| **改 vite / 构建**             | §13.1 ❌ 行，禁止 AI 自行动手；走 §13.2.1 + §13.2.2 流程                                                                                                                                                                                                                                                                                                                |
| **同步上游**                   | `11-upstream-sync.md` 必读全文                                                                                                                                                                                                                                                                                                                                          |

### 🟢 必要时参考（视情况查阅）

- `vue-pure-admin/src/views/<对应模块>`（完整版相似页面，见 `07-max-ts-modules.md` §12.2 清单）
- `src/main.ts`、`App.vue`、`src/config/index.ts`（全局注册与平台配置加载流程）
- `build/plugins.ts`（构建插件，重点关注 `vitePluginFakeServer.enableProd`，详见 `06-mock-risk.md`）
- `src/style/index.scss` / `src/style/tailwind.css`（样式入口，Tailwind v4 语法差异见 `01-project-map.md` §2.2）
- `vite.config.ts`（仅查阅 `server.proxy` 配置）
- `src/store/modules/multiTags.ts` / `app.ts` / `settings.ts` / `epTheme.ts`（多标签、设备、主题）
- `src/layout/hooks/*`（layout 内部钩子）
