# 02 · AI Rules · AI 开发硬规则 / 阅读清单

## 本文适用任务

- AI 接到**任意**前端任务（哪怕只是改一行文案）
- 评估某个改动是否触犯底座规则
- 决定改动是否需要单独 PR、是否要先输出风险评估
- 决定本次任务必须先读哪几份文档 / 哪几个源码文件

## 必须先读

- 主入口 `docs/pure-admin-max-ts-baseline.md`（TL;DR、后端 4 大红线）
- 本文件全文
- 与本任务匹配的专题文档（见下文 §16 任务类型 → 必读映射）

## 禁止事项

- 禁止跳过 §13.4「8 步 Checklist」直接动手
- 禁止用 `// eslint-disable` / `// @ts-ignore` 绕过 lint 与类型检查
- 禁止以"提速 / 临时跑通"为理由违反 §13.3 任何一条硬规则
- 禁止 `--no-verify` 绕过 husky / commitlint

## 相关关键文件路径

- 本文件
- `eslint.config.js / stylelint.config.js / .prettierrc.js / commitlint.config.js / .husky/`
- `package.json`（lint / typecheck / build 脚本入口）
- 主入口 §0.5「后端 4 大红线」

---

## 13. AI 开发硬规则

### 13.1 文件改动矩阵

| 文件 / 目录 | AI 可改？ | 备注 |
| --- | --- | --- |
| `src/views/<新业务模块>/` | ✅ 可自由新建 | 必须沿用 `01-project-map.md` §3.14 范式 |
| `src/api/<新业务模块>.ts` | ✅ 可自由新建 | 类型按后端 Swagger |
| `src/store/modules/<新业务模块>.ts` | ✅ 可自由新建 | **命名必须有业务前缀**（如 `srvfTeam.ts`、`uStudioApps.ts`），禁止用 `data.ts`、`state.ts` 等无意义命名；不可改既有 store |
| `src/constants/<业务模块>.ts`、`src/types/business/` 等业务侧目录 | ✅ 新建 | UI 临时占位常量必须 `*.demo.ts` 命名或文件头注 `TEMPORARY / DEMO`（裁决 6） |
| `src/views/welcome/index.vue` | ✅ 可改占位文案 | 不要改路由名 |
| `src/router/modules/srvf-*.ts` / 业务静态路由 | ✅ 可新建 | meta.roles 用 NestJS 真实角色名 |
| `src/views/dict/* / tenant/* / schedule/* / permission/*` | ⚠️ 改前先评估 | Max-Ts 演示模块；裁决 1：源码保留为参考 |
| `src/router/modules/home.ts / error.ts / remaining.ts` | ⚠️ 仅在新增"绝对静态路由"时追加 | 不要改既有 |
| `mock/**` | ❌ | 业务 mock 禁止新增；仅 `*.demo.ts` 临时占位、且 PR 描述明确"接真 API 后立即删除"时允许（裁决 4） |
| `public/platform-config.json` | ⚠️ AI 不得改默认值；改值不改字段 | 由人类决策 |
| `src/components/Re*/` | ❌ 不可改 | 底座组件，要扩展请 wrapper |
| `src/layout/**` | ❌ 不可改源码 | 改动等同破坏整套主题 / 多标签 / keep-alive；扩展用 mitt 事件 / 业务子组件 |
| `src/router/index.ts / utils.ts / asyncRoutes.ts` | ❌ 不可改 | 影响登录、动态路由、白屏防护；asyncRoutes 第一阶段绝对禁用（裁决 2） |
| `src/utils/http/**` | ❌ 不可改（除接 NestJS 时的"一次性适配"由人类拍板） | 改动 = 全局副作用 |
| `src/utils/auth.ts` | ❌ 不可改（除 token 字段适配） | token 主流程 |
| `src/store/modules/user.ts / permission.ts / multiTags.ts / app.ts / settings.ts / epTheme.ts` | ❌ 不可改 | 同上 |
| `src/style/**` | ❌ 不可改 | 主题 / 暗黑 / 侧栏样式核心；Tailwind v4 与 v3 语法差异巨大 |
| `src/plugins/elementPlus.ts / echarts.ts` | ❌ 不可改 | 升级才动 |
| `src/main.ts / App.vue / src/config/index.ts` | ❌ 不可改 | 入口与全局配置 |
| `package.json / pnpm-lock.yaml` | ❌ 不可改 | 依赖变更走人类（见 §13.2.1） |
| `vite.config.ts / build/** / tsconfig.json / eslint.config.js / stylelint.config.js / .prettierrc.js / .lintstagedrc / .husky/** / commitlint.config.js` | ❌ 不可改 | 工程级；底座改动必须单独 PR |
| `.env / .env.development / .env.production / .env.staging` | ❌ AI 不得直接改 | 由人类改；AI 也不得在源码中硬编码 `VITE_*` 默认值绕过 |
| `docs/pure-admin-max-ts-baseline.md` 与 `docs/pure-admin/**` | ✅ 由人类批准后更新 | 必须保留章节结构 |

### 13.2 底座 / 工程文件改动规则

#### 13.2.1 ⛔ AI 命令权限（裁决 5）

**AI 严禁自行执行**以下命令（任何形式）：

- `pnpm add ...`
- `pnpm remove ...`
- `pnpm update ...`
- `pnpm clean:cache`（会清 `pnpm-lock.yaml`）
- `rm pnpm-lock.yaml` / 任何会清除 lockfile 的命令
- 修改 `package.json` 中的 `dependencies` / `devDependencies` / `engines` / `pnpm` 字段
- 升级核心依赖（Vue / Vite / Element Plus / Pinia / TypeScript / Tailwind / axios）
- 替换 UI 库（element-plus → ant-design 等）/ 构建工具（vite → webpack 等）

**AI 允许在明确任务下执行**：

- `pnpm dev`（启动开发服务）
- `pnpm build`（构建验证）
- `pnpm typecheck`（类型检查）
- `pnpm lint`（lint 检查）
- `pnpm preview`（预览打包结果）

**`pnpm install`**：仅允许在"首次安装"或"人类明确要求"时执行；不得用 `pnpm install` 间接更新依赖。

所有依赖变动都必须以 PR 描述形式向人类提出，由**人类手动执行命令**。

**直接编辑 `package.json` 的 `dependencies / devDependencies / engines / pnpm` 字段视同 `pnpm add / update`，同样禁止。**

#### 13.2.2 底座 / 工程文件改动必须单独 PR

- 修改 §13.1 矩阵中 ❌ 文件 → **必须单独提交 PR**，不得与业务改动混在同一 PR；
- PR 描述必须包含：
  1. **修改原因**（业务诉求是什么）；
  2. **风险评估**（影响哪些功能 / 是否破坏升级路径 / 回滚方式）；
  3. **与 vue-pure-admin 上游的对比**（是否会让以后无法 cherry-pick 上游更新，见 `11-upstream-sync.md`）；
  4. **最小变更范围**（行数、影响文件清单）。
- AI 在拿不到这 4 项之前不得动手。

### 13.3 通用硬规则

1. **新页面前必先扫 vue-pure-admin 完整版** + 本项目已有范式（详见 `07-max-ts-modules.md`）。
2. **不得反推后端**：所有字段、枚举、状态、API 路径、错误码以 NestJS Swagger 为准（主入口红线 1~4）。
3. **不得把 mock 当真实接口**；**禁止新增业务 mock**；临时 UI 占位 mock 必须 `*.demo.ts` 命名（裁决 4，详见 `06-mock-risk.md`）。
4. **不得每个页面发明新范式**：优先沿用 `dict / tenant/list / schedule` 的目录范式。
5. **TypeScript**：业务代码（`src/views/srvf*/`、`src/api/srvf*.ts`、`src/store/modules/srvf*.ts`）必须通过 `pnpm typecheck` 且**禁止 `any`**；如需绕过，先输出评估让人类决定（不靠 `// @ts-ignore`、`// eslint-disable` 一笔带过）。
6. **路由 name 与组件 `defineOptions.name` 必须一致**（详见 `03-router-menu.md` §5.5）。
7. **i18n 暂不启用**：业务文案直接写中文。**禁止**自行 `pnpm add vue-i18n`、自行启用 i18n 分支。
8. **每次改动后必须跑**：`pnpm lint && pnpm typecheck`，零错误零警告（项目 lint 用 `--max-warnings 0`，禁止 `// eslint-disable` 绕过）；**提交前再跑 `pnpm build`**。
9. **多租户模板不得启用**：`.env: VITE_ENABLE_TENANT=false`；`tenantManagementRouter` 必须隐藏；**源码保留（裁决 1，禁止物理删除）**。
10. **asyncRoutes 第一阶段禁止启用**（裁决 2）：不切 import、不补 `getMenuList`、不为前端动态菜单倒逼后端。`getMenuList` 不存在不是 bug，不允许补。详见 `03-router-menu.md` §5.2.1。
11. **演示角色名不得作为正式角色**（裁决 3）：`admin / common / *:*:* / permission:btn:add` 等仅为演示，接 NestJS 时全量替换。详见 `04-auth-permission.md`。
12. **commit 必须符合 commitlint 规则**（`commitlint.config.js`）；不要用 `--no-verify` 绕过 husky。
13. **不得在源码中硬编码 `VITE_*` 默认值**绕过 `.env`；配置必须读 `.env` 或 `public/platform-config.json`。任何 `import.meta.env.VITE_*` 取值不得在源码侧附带默认值 / fallback；若需默认值，写入 `.env` 并由人类确认。
14. **底座升级走人类**：作者上游有更新时，**禁止直接 merge / pull 上游到 starter**；必须按 `11-upstream-sync.md` 流程评估，AI 不得自行 cherry-pick。

### 13.4 AI 任务接入 8 步 Checklist（每次开工必做）

AI 接到任意前端任务后，**第一件事**是按下面 8 步走，并在 PR / 对话中显式列出每步的结论。跳步等同违反硬规则。

| Step | 动作 | 输出 |
| --- | --- | --- |
| **1** | 读主入口 §0 / §0.5、本文件 §13、`09-pr-roadmap.md`、§16 阅读清单（本文件下方），确认本任务不踩任何红线 | 列出"本任务涉及的红线编号 + 风险等级"；并明确写：本任务是否涉及后端字段 / 表 / API 路径定义？若涉及，逐项列出。 |
| **2** | 用关键词在 `vue-pure-admin/src/views/` 全文搜索相似范式 | 给出参考路径清单（即使没找到也要写"未找到，原因是 X"） |
| **3** | 在本仓库 `src/views/` 中找最相似的现有范式（dict/tenant/list/schedule/permission/login） | 给出参考路径 + 复用范式说明 |
| **4** | 列出涉及的文件改动清单，每条标注 §13.1 矩阵中的 ✅ / ⚠️ / ❌ | 若含 ❌ → 触发 §13.2.2 单独 PR 流程；含 ⚠️ → 写风险评估 |
| **5** | 列出复用的 `Re*` 组件、`@pureadmin/table`、`ReDialog` 等；列出**不**新增的依赖 | 若需要新依赖 → 暂停等人类批准（§13.2.1） |
| **6** | 列出新增 `src/api/<模块>.ts` 的接口与类型，逐条对照 NestJS Swagger（缺则写"待后端确认"） | 显式说明 mock 边界（裁决 4） |
| **7** | 执行 `pnpm lint && pnpm typecheck`，零错误零警告 | 贴执行结果 |
| **8** | 执行 `pnpm build` 验证产物；若涉及路由 / 菜单 / 权限，跑一遍 `pnpm dev` 自查 | 贴构建结果 + 自查描述 |

如果任务很小（如只改一个文案、一个图标），可在 PR 描述里一句话说明"Step 1~6 评估结论：无风险"，但 Step 7~8 仍必须执行。

---

## 16. 后续 AI 最小阅读清单（分级）

> 按"任意改动 / 相关任务 / 必要时参考"三级。AI 每次开工前，**至少**读 🔴 级。

### 🔴 每次必读（不分任务类型）

1. `docs/pure-admin-max-ts-baseline.md`（**主入口**，重点 §TL;DR、§红线、§专题索引、§PR 摘要）
2. `docs/pure-admin/02-ai-rules.md`（**本文件**，重点 §13.1 矩阵、§13.4 Checklist）
3. `.env`（确认 `VITE_ENABLE_TENANT` 当前值与 `VITE_HIDE_HOME`）
4. `public/platform-config.json`
5. `types/router.d.ts`（路由 meta 字段规范）
6. `package.json`（确认依赖版本，**禁止**自行更改）

### 🟡 相关任务必读（按任务类型选取）

| 任务类型 | 必读 |
| --- | --- |
| **改路由 / 菜单** | `03-router-menu.md`、`src/router/index.ts`、`src/router/utils.ts`、`src/router/modules/home.ts / remaining.ts / error.ts`（第一阶段**不读** `asyncRoutes.ts`，禁改） |
| **改登录 / Token / 接 NestJS** | `04-auth-permission.md`、`05-http-api.md`、`08-starter-derivation.md`、`src/views/login/index.vue`、`src/api/user.ts`、`src/utils/auth.ts`、`src/utils/http/index.ts`、`src/utils/http/types.d.ts`、`src/store/modules/user.ts`、`mock/login.ts`、`mock/refreshToken.ts` |
| **改权限 / 按钮显隐** | `04-auth-permission.md`、`src/store/modules/permission.ts`、`src/components/ReAuth/src/auth.tsx`、`src/components/RePerms/src/perms.tsx`、`src/directives/auth/index.ts`、`src/directives/perms/index.ts`、`src/utils/auth.ts:hasPerms` |
| **新增业务列表 / 表单页** | `07-max-ts-modules.md` §9 范式表、`src/views/tenant/list/index.vue` + `utils/hook.tsx`、`src/views/dict/index.vue` + `utils/hook.tsx`、`src/components/ReDialog/index.vue`、`src/components/RePureTableBar/src/bar.tsx` |
| **改 layout / 主题** | 谨慎触碰；先读 `01-project-map.md` §3.7 + 本文件 §13.1 矩阵 ❌ 行；如确需修改，先输出 §13.2.2 单独 PR 评估 |
| **改 vite / 构建** | 同上，禁止 AI 自行动手；走 §13.2.1 + §13.2.2 流程 |
| **同步上游** | `11-upstream-sync.md` 必读全文 |

### 🟢 必要时参考（视情况查阅）

- `vue-pure-admin/src/views/<对应模块>`（完整版相似页面，见 `07-max-ts-modules.md` §12.2 清单）
- `src/main.ts`、`App.vue`、`src/config/index.ts`（全局注册与平台配置加载流程）
- `build/plugins.ts`（构建插件，重点关注 `vitePluginFakeServer.enableProd`，详见 `06-mock-risk.md`）
- `src/style/index.scss` / `src/style/tailwind.css`（样式入口，Tailwind v4 语法差异见 `01-project-map.md` §2.2）
- `vite.config.ts`（仅查阅 `server.proxy` 配置）
- `src/store/modules/multiTags.ts` / `app.ts` / `settings.ts` / `epTheme.ts`（多标签、设备、主题）
- `src/layout/hooks/*`（layout 内部钩子）
