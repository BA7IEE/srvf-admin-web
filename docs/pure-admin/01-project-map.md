# 01 · Project Map · 项目定位 / 技术栈 / 目录结构 / 工程命令

## 本文适用任务

- 第一次接触本仓库，需要建立"项目长什么样"的整体认知
- 评估某个目录/文件应不应该改、属于底座层还是业务层
- 排查"这个依赖为什么在 / 这个脚本干嘛用"
- 在 starter 与上游 `pure-admin-thin-max-ts` 之间对比差异

## 必须先读

- 本仓库根 `package.json`
- 本仓库根 `README.md`（Repository Notice）
- `docs/pure-admin-max-ts-baseline.md`（主入口的 §TL;DR、§红线、§专题索引）
- `02-ai-rules.md`（哪些目录 AI 不能改）

## 禁止事项

- 禁止根据本目录映射结论修改业务代码（这只是认知文档）
- 禁止把 "上游 thin-max-ts" 当成本仓库的代码事实来源——以本仓库 `git log` 为准
- 禁止把"底座层"目录当业务层使用（详见 §13.1 文件改动矩阵）

## 相关关键文件路径

- `package.json`
- `vite.config.ts`、`tsconfig.json`、`build/**`
- `src/` 全部子目录
- `mock/`、`public/platform-config.json`、`.env*`
- `types/router.d.ts`

---

## 1. 项目定位

### 1.1 在 Pure Admin 体系里的位置

本仓库的"上游母版"是 Pure Admin 作者 `xiaoxian521` 出售的付费精简版 `pure-admin-thin-max-ts`（参见根目录 `README.md`：
> 注：若购买者在公司使用了 …… 不可售卖或公开源代码 ……）。

它有以下特征：

- **精简版（thin）**：剥离了 vue-pure-admin 的示例性页面（表格演示、组件库、可视化、富文本……）。
- **Max（高级版）**：在精简版上回填了"高级业务底座"——`字典管理 / 租户管理 / 租户套餐 / 日历排班 / 按钮权限 / 页面权限`，以及"前端动态路由格式自动展开"与"菜单风格"两项 Max-Ts 独有功能。
- **TypeScript**：所有 `.ts/.tsx/.vue<setup lang="ts">`，无 JS 业务文件（`tsconfig.json: "exclude": ["**/*.js", …]`）。
- **非国际化版本**：当前仓库无 `locales/` 目录，也无 `vue-i18n` 依赖（与完整版差异点之一）。
- **永久同步上游**：vue-pure-admin 提交 1~2 次后，Max-Ts 会快速同步。上游 → starter 的同步策略见 `11-upstream-sync.md`。

### 1.2 与 vue-pure-admin 完整版的关系

| 维度 | pure-admin-thin-max-ts | vue-pure-admin |
| --- | --- | --- |
| 定位 | 业务底座 / 起点项目 | 完整范式参考库 / 演示库 |
| `src/views/` 模块 | 7 个（welcome/login/error/permission/schedule/dict/tenant） | 26+ 个（含表格、表单、可视化、编辑器、able 等 65+ 页面） |
| `src/router/modules/` | 仅 home / error / remaining 三个静态模块 | 23 个分模块路由 |
| `src/api/` | `user / system / routes`（演示用） | 业务、列表、地图、mock 等更完整 |
| 国际化 | ❌（无 i18n） | ✅ `vue-i18n` |
| 富文本/编辑器 | ❌ | ✅ `wangEditor / vditor / codemirror` |
| 流程图/甘特/思维导图 | ❌ | ✅ `logicflow / vue-flow / ganttastic / mind` |
| Excel/PDF/MQTT 等 | ❌ | ✅ `xlsx / mqtt / cropperjs / vxe-table` |
| 多租户启用开关 | ✅（`.env` 中 `VITE_ENABLE_TENANT`） | ❌ |
| 菜单风格 / 前端展开动态路由 | ✅（Max-Ts 独有） | ❌ |

vue-pure-admin 完整版**仅作只读参考**，禁止直接复制依赖；具体策略见 `07-max-ts-modules.md`。

### 1.3 为什么适合作为长期后台前端底座

- 主流程稳定：登录 / 路由守卫 / token 刷新 / 多标签 / keep-alive / 三级以上自动拍平 / 动态路由白屏防护，全部已实现且与作者上游保持升级一致性。
- 体积小：相比完整版砍掉大量演示模块，编译速度与心智负担都低。
- 类型清晰：`types/router.d.ts` 定义了完整的路由 meta、按钮权限字段，是后续业务路由的规范源。
- AI 友好：目录强约束、命名一致，AI 可以"按目录套范式"。

### 1.4 它不是业务系统本身

`mock/`、`src/api/`、`src/views/tenant`、`src/views/dict` 中的数据与字段都是 Pure Admin 作者为了演示而造的，**绝不能作为后端字段、表结构、接口路径的依据**（见主入口"后端 4 大红线"）。

### 1.5 与 NestJS 后端之间的边界

- 后端：API、字段、枚举、错误码、权限规则、分页、审计、附件 …… **以后端为唯一真相**（NestJS + Prisma + PostgreSQL + Swagger）。
- 前端：路由、菜单、布局、表格表单、按钮显隐、token 注入、错误提示。
- 共同契约：**Swagger / OpenAPI**。前端按 Swagger 生成或手写 TS 类型，不允许反过来要求后端"凑前端模板"。

---

## 2. 技术栈总览（基于 `package.json` 实测）

> 版本号引用自上游版本 `7.0.0`。starter 当前与上游一致。

### 2.1 框架与构建

- Vue：`vue ^3.5.32`（Vue 3，Composition API + `<script setup>`）。
- 路由：`vue-router ^5.0.4`。
- 状态：`pinia ^3.0.4`。
- 构建：`vite ^8.0.3` + `@vitejs/plugin-vue ^6.0.5` + `@vitejs/plugin-vue-jsx ^5.1.5`。
- 语言：`typescript ^6.0.2`、`vue-tsc ^3.2.6`。
- Node 引擎：`node ^20.19.0 || >=22.13.0`、`pnpm >=9`，强制 pnpm（`"preinstall": "npx only-allow pnpm"`）。

### 2.2 UI / 组件 / 样式

- Element Plus：`element-plus ^2.13.6`，按需 import 集中在 `src/plugins/elementPlus.ts`。
- 表格：`@pureadmin/table ^3.3.0`。
- 描述列表：`@pureadmin/descriptions ^1.2.1`（已 import 类型但 `main.ts` 默认注释）。
- 工具：`@pureadmin/utils ^2.6.4`。
- Tailwind：`tailwindcss ^4.2.2` + `@tailwindcss/vite ^4.2.2`，入口 `src/style/tailwind.css`（**v4 语法 `@theme/@utility/@custom-variant` 与 v3 差异巨大**）。
- SCSS：`sass ^1.99.0`，入口 `src/style/index.scss`。
- 图标：`@iconify/vue 4.2.0` + `@iconify/json` + `unplugin-icons ^23.0.1`。
- 图表：`echarts ^6.0.0`（`main.ts` 默认注释）。
- 工具组件：`@imengyu/vue3-context-menu` `vue-tippy` `sortablejs` `@vueuse/core` `@vueuse/motion`。

### 2.3 网络与存储

- `axios 1.14.0`（固定版本，作者刻意锁定）。
- 序列化：`qs ^6.15.0`。Cookie：`js-cookie ^3.0.5`。
- 本地存储：`localforage ^1.10.0` + `@pureadmin/utils.storageLocal` 二次封装。
- 响应式存储：`responsive-storage ^2.2.0`（驱动 `$storage` 全局对象）。

### 2.4 体验与 DX

- `nprogress ^0.2.0`、`dayjs ^1.11.20`、`pinyin-pro ^3.28.0`、`mitt ^3.0.1`。
- 工程：`husky ^9 + lint-staged ^16 + eslint ^10 + stylelint ^17 + prettier ^3 + commitlint`。
- Mock：`vite-plugin-fake-server ^2.2.3`（**默认 `enableProd: true`**，生产前必关，见 `06-mock-risk.md`）。
- 调试：`code-inspector-plugin`（Alt+Shift 点元素跳源码）。
- 其它：`vite-plugin-cdn-import` `vite-plugin-compression` `vite-plugin-remove-console` `vite-plugin-router-warn` `rollup-plugin-visualizer`。

### 2.5 国际化

- 当前仓库**没有 i18n 依赖**。第一阶段强烈不建议启用（见 `02-ai-rules.md` §13.3）。

---

## 3. 目录结构理解

> 「底座层」= AI 默认**不应**修改；「业务层」= AI 可在严格规范内增删；「环境层」= 由人类手动决定。

### 3.1 根目录

| 路径 | 性质 | 作用 | AI 注意事项 |
| --- | --- | --- | --- |
| `package.json` | 底座 | 锁版本、脚本、依赖 | **不得擅自加依赖** |
| `pnpm-lock.yaml` | 底座 | 锁文件 | 禁止手改 |
| `vite.config.ts` | 底座 | Vite 主配置 | 仅由维护者改 |
| `build/` | 底座 | `plugins/cdn/compress/info/optimize/utils.ts` | 升级 vite 插件时才会动 |
| `tsconfig.json` | 底座 | 路径别名 `@/* @build/*` | 见 `02-ai-rules.md` |
| `eslint.config.js / stylelint.config.js / .prettierrc.js / commitlint.config.js / .lintstagedrc / .husky/` | 底座 | 工程规范 | 不要随便禁用规则 |
| `.env / .env.development / .env.production / .env.staging` | 环境层 | 端口、base、路由模式、租户/首页开关、CDN、压缩 | 见 §3.10 |
| `.browserslistrc / .editorconfig / .nvmrc / .npmrc / .dockerignore / Dockerfile / .markdownlint.json / .stylelintignore / .gitignore` | 环境层 | 工程基础设施 | 一般不动 |
| `index.html` | 底座 | 入口 HTML | 不动 |
| `mock/` | 底座（演示） | Mock API 见 `06-mock-risk.md` | 业务上线前**必须替换为真实 API** |
| `public/` | 环境层 | `favicon / logo / platform-config.json` | 见 §3.9 |
| `src/` | 业务 + 底座混合 | 见 §3.2~3.13 | 按"目录矩阵"区分 |
| `types/` | 底座 | 全局 d.ts | 见 §3.14 |
| `LICENSE / README.md / Dockerfile` | 文档 | 不动 |

### 3.2 `src/api/` — API 层（业务层）

```
src/api/
├── routes.ts        # getAsyncRoutes：拉动态路由的占位 API
├── system.ts        # 字典、租户演示 API
└── user.ts          # getLogin / refreshTokenApi 与 UserResult 类型
```

- 所有对后端的 HTTP 调用集中在这里。
- 新增业务模块时**必须**在此目录加文件（如 `src/api/srvf/user.ts`）。
- 禁止在 `views/*.vue` 内直接 `axios.get(...)` 散写请求。
- 类型 `UserResult / RefreshTokenResult` 等需要与后端 Swagger 对齐，不是抄前端模板。

### 3.3 `src/assets/` — 静态资源

```
src/assets/
├── iconfont/        # 本地字体图标（main.ts 已 import）
├── login/           # 登录页背景、插画、头像
├── status/          # 403/404/500 插图
├── svg/             # SVG（被 svg-loader 当组件用）
├── table-bar/       # PureTableBar 操作图标
└── user.jpg
```

### 3.4 `src/components/` — 全局组件（底座层）

```
src/components/
├── ReAuth/          # <Auth> 包裹按钮，基于 meta.auths
├── RePerms/         # <Perms> 包裹按钮，基于登录返回 permissions
├── ReDialog/        # 函数式 addDialog
├── ReFloatButton/
├── ReIcon/          # IconifyIconOffline / IconifyIconOnline / FontIcon
├── RePureTableBar/  # 列表页操作栏
├── ReSegmented/
├── ReText/
└── ReCol/
```

**底座层，AI 不要乱改其源码**；要扩展请用 wrapper 包一层。`Auth / Perms` 已在 `main.ts` 全局注册。

### 3.5 `src/config/` — 平台运行时配置（底座层）

- `src/config/index.ts`：通过 axios fetch `public/platform-config.json` → 注入到 `app.config.globalProperties.$config`。
- 同时 export `responsiveStorageNameSpace`，当前为 `responsivemaxts-`。
- 业务页面想读全局配置请 `getConfig('XXX')`，不要硬编码。

### 3.6 `src/directives/` — 自定义指令（底座层）

```
src/directives/
├── auth/      # v-auth = ["btn.add"]，源自 router meta.auths
├── perms/     # v-perms = ["btn.add"]，源自 useUserStoreHook().permissions
├── copy/ longpress/ optimize/ ripple/
└── index.ts
```

### 3.7 `src/layout/` — 布局（底座层）

```
src/layout/
├── index.vue / frame.vue / redirect.vue / types.ts
├── hooks/  # useNav / useTag / useLayout / useDataThemeChange / useBoolean / useMultiFrame
└── components/  # lay-content / lay-navbar / lay-tag / lay-sidebar / lay-setting / lay-panel / lay-notice / lay-search / lay-frame / lay-footer
```

**AI 永远不要随便改 layout**，否则会破坏主题、菜单、多标签、keep-alive、响应式收起。业务想改顶栏 / 侧栏行为时，先评估能否通过 `platform-config.json` 或 `lay-setting` 已有开关实现。

### 3.8 `src/plugins/` — Vue 插件（底座层）

```
src/plugins/
├── echarts.ts       # main.ts 中默认注释
└── elementPlus.ts   # 全部 Element Plus 组件 + 指令插件
```

### 3.9 `src/router/` — 路由（底座层）

```
src/router/
├── index.ts / utils.ts / asyncRoutes.ts
└── modules/  # home.ts / error.ts / remaining.ts
```

详细路由机制见 `03-router-menu.md`。

### 3.10 `.env*` — 环境变量（环境层）

| 文件 | 关键变量 |
| --- | --- |
| `.env` | `VITE_PORT=8848` `VITE_HIDE_HOME=false` `VITE_ENABLE_TENANT=true` |
| `.env.development` | `VITE_PUBLIC_PATH=/` `VITE_ROUTER_HISTORY="hash"` |
| `.env.production` | `VITE_PUBLIC_PATH=/` `VITE_ROUTER_HISTORY="hash"` `VITE_CDN=false` `VITE_COMPRESSION="none"` |
| `.env.staging` | 同 production，但 `VITE_CDN=true` |

注意：`VITE_HIDE_HOME` 与 `VITE_ENABLE_TENANT` **只读 `.env`**（其他模式不会覆盖）。

### 3.11 `src/store/` — 状态（底座层为主）

```
src/store/
├── index.ts / utils.ts / types.ts
└── modules/  # app.ts / settings.ts / multiTags.ts / permission.ts / epTheme.ts / user.ts
```

业务可以新建 `src/store/modules/srvf*.ts`（**命名必须带业务前缀**），但**绝不能改 user/permission/multiTags/app/settings/epTheme**。

### 3.12 `src/style/` — 样式（底座层）

```
src/style/
├── index.scss  # 入口
├── tailwind.css  # Tailwind v4 @theme/@utility/@custom-variant（**v4 ≠ v3，不要照 v3 教程**）
├── element-plus.scss / sidebar.scss (21KB) / theme.scss / dark.scss / transition.scss / reset.scss / login.css
```

### 3.13 `src/utils/` — 工具（底座层）

```
src/utils/
├── auth.ts       # token / setToken / removeToken / formatToken / hasPerms
├── http/         # PureHttp 拦截器 + 刷新 token 队列
├── localforage/ progress/
├── globalPolyfills.ts / responsive.ts / message.ts / mitt.ts / sso.ts / tree.ts / propTypes.ts / preventDefault.ts / print.ts
```

### 3.14 `src/views/` — 视图（业务层）

```
src/views/
├── welcome/ login/ error/
├── permission/  # 页面级 + 按钮级权限演示
├── dict/        # 字典管理
├── tenant/list/ tenant/package/   # 多租户演示（裁决 1：禁用但保留源码）
└── schedule/    # 日历排班演示
```

**业务层主战场。** 每个模块约定：

- `index.vue` 主页
- `tree.vue` 等子页面
- `form/` 表单
- `utils/hook.tsx` 列表逻辑、列定义、对话框
- `utils/rule.ts` 校验规则
- `utils/types.ts` 表单 props 类型

新模块照此结构开。

### 3.15 `types/` — 全局类型（底座层）

```
types/
├── index.d.ts / router.d.ts / directives.d.ts
├── global.d.ts / global-components.d.ts
├── shims-vue.d.ts / shims-tsx.d.ts
```

`types/router.d.ts` 中的 `CustomizeRouteMeta` 是所有路由 meta 的事实来源（title/icon/showLink/roles/auths/keepAlive/frameSrc/transition/...）。

---

## 4. 启动、构建与工程命令

来源：`package.json`。

| 任务 | 命令 | 说明 |
| --- | --- | --- |
| 安装 | `pnpm install` | 强制 pnpm（`preinstall: only-allow pnpm`） |
| 开发 | `pnpm dev` | 等价 `pnpm serve`；默认端口 8848 |
| 构建生产 | `pnpm build` | `rimraf dist && vite build`，内存 8GB |
| 构建预发 | `pnpm build:staging` | `vite build --mode staging` |
| 构建分析 | `pnpm report` | 触发 `rollup-plugin-visualizer`，输出 `report.html` |
| 预览 | `pnpm preview` / `pnpm preview:build` | 本地预览打包结果 |
| 类型检查 | `pnpm typecheck` | `vue-tsc --noEmit --skipLibCheck` |
| ESLint | `pnpm lint:eslint` | `--max-warnings 0`（0 警告） |
| Prettier | `pnpm lint:prettier` | 写回 src 下所有支持文件 |
| Stylelint | `pnpm lint:stylelint` | css/scss/vue 内 style |
| 全部 Lint | `pnpm lint` | 三件套合一 |
| SVG 压缩 | `pnpm svgo` | 压缩所有 SVG |
| 清缓存 | `pnpm clean:cache` | 清 eslint cache / lockfile / node_modules / pnpm store —— **AI 禁止执行** |

**AI 改完代码后建议依次跑**：

```
pnpm lint
pnpm typecheck
pnpm dev   # 本地肉眼回归
```

提交前再 `pnpm build` 验证生产构建。
