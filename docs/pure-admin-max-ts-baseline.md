# Pure Admin Max-Ts 前端底座认知基线（baseline）

> 本文档是 AI 与协作者**修改本项目前必须先阅读的基础文档**。
> 它不是教程，而是给"以 AI 为主要开发力的非专业前端"用户搭建的一份长期可靠的边界与规则书。
> 任何与本文档冲突的需求都应优先回到本文档对齐。

---

## 0. TL;DR

- **pure-admin-thin-max-ts 是 [vue-pure-admin](https://pure-admin.cn) 体系内"精简版 + Max 版"合一的 TypeScript 模板**，定位为"管理后台前端**底座（scaffold）**"。
- 它适合做：
  - 通用后台前端的**起点项目**（登录、路由、菜单、权限、布局、主题、请求封装、Mock）。
  - **后端驱动**型业务系统（NestJS / Java / Go 等）的统一前端基座。
  - 中后台 CRUD、字典管理、租户管理、日历排班、报表看板等通用范式。
- 它**不适合**做：
  - 业务系统本身的"事实来源"。它的 mock 数据、字段、表结构都是演示用，**不能反过来定义后端**。
  - 重前端富交互产品（编辑器/绘图/IM 等）。这些请直接参考 vue-pure-admin 完整版的对应示例。
- 对"不懂代码但依赖 AI 开发"的最大价值：
  - **统一了 AI 修改前端时的"地图"**：每个目录的作用、可改/不可改边界已经被作者预先设计好。
  - **降低 AI 漂移**：登录、路由、权限、请求拦截、token 刷新这套主流程已经稳定，AI 只需要在 `views/` 与 `api/` 增量加业务页面。
  - **永久同步上游**：避免被 AI 改坏底座后无法升级。
- 后续开发的核心原则（必须默念三遍）：
  1. **后端 API（NestJS Swagger / OpenAPI）是契约的事实来源**，前端只做适配。
  2. **底座目录只读为主，业务代码加在 `src/views/<业务模块>/` 与 `src/api/<业务模块>.ts`。**
  3. **mock 不是真接口**，业务模块必须尽早接 NestJS 真实 API。
  4. **每个新页面前，先去 vue-pure-admin 完整版搜相似范式**，再考虑自创。

---

## 0.5 后端 4 大红线（P0，置顶硬约束）

> 这 4 条是**最高优先级**的硬约束。任何违反这 4 条的行为（无论 AI 还是协作者）**必须立刻停止**并回到本文档对齐。

### 红线 1：不从前端反推数据库

- **禁止**根据 `pure-admin-thin-max-ts` 的任何前端字段、表单、列表列定义反向设计 NestJS Prisma schema。
- 后端模型由 NestJS 后端独立设计，前端做"适配层"，**字段不一致时改前端**。
- 反面案例：看到 `src/views/tenant/list/utils/hook.tsx` 用了 `accountCount/expireTime/packageId/contactMobile`，就要求后端建一张同名同字段的 `tenants` 表 ❌。

### 红线 2：不从 mock 反推 API

- `mock/*.ts` 中的 URL（如 `/login`、`/dict-tree`、`/tenant-list`、`/get-async-routes`）**仅为演示**。
- NestJS 真实 API 路径以 Swagger / OpenAPI 为准，**前端去适配**（必要时在 `src/api/*.ts` 写 URL 映射）。
- 反面案例：让后端实现 `/dict-tree`、`/tenant-package-menu` 这些 mock 路径 ❌。

### 红线 3：不从 Max-Ts 多租户反推 tenant 模型

- 第一阶段 SRVF 是**单一后台**，**不是 SaaS**，**不需要**多租户。
- `VITE_ENABLE_TENANT` 必须设为 `false`；`tenantManagementRouter` 必须从菜单中隐藏。
- `src/views/tenant/list/` 与 `src/views/tenant/package/` 的源码作为"参考范式"保留，**不删除**；后续是否物理删除以单独 PR 决策。
- 反面案例：因为模板有租户/套餐/套餐菜单 RBAC，就建 `Tenant / TenantPackage / TenantPackageMenu` 三表 ❌。

### 红线 4：不从前端 permissions / auths 反推后端 RBAC

- 前端的 `roles: ["admin","common"]`、`permissions: ["*:*:*"]`、`auths: ["permission:btn:add"]` 等命名**只是 UI 显隐 key**。
- 它们**不等于**后端 BizCode；**不等于**后端 Permission 表；**不是**SRVF RBAC 设计依据。
- 后端 RBAC（角色 / 权限 / 范围 / 业务码）由 NestJS 独立设计；前端在登录后**接收并适配**，不反向定义。
- 反面案例：因为 mock 返回 `"*:*:*"`，就给 NestJS 设计"通配权限字符串"模型 ❌。

---

## 1. 项目定位

### 1.1 在 Pure Admin 体系里的位置

`pure-admin-thin-max-ts` 是 Pure Admin 作者 `xiaoxian521` 出售的付费精简版（参见根目录 `README.md`：
> 注：若购买者在公司使用了 …… 不可售卖或公开源代码 ……）。
它有以下特征：

- **精简版（thin）**：剥离了 vue-pure-admin 的示例性页面（表格演示、组件库、可视化、富文本……）。
- **Max（高级版）**：在精简版上回填了"高级业务底座"——`字典管理 / 租户管理 / 租户套餐 / 日历排班 / 按钮权限 / 页面权限`，以及"前端动态路由格式自动展开"与"菜单风格"两项 Max-Ts 独有功能。
- **TypeScript**：所有 `.ts/.tsx/.vue<setup lang="ts">`，无 JS 业务文件（`tsconfig.json: "exclude": ["**/*.js", …]`）。
- **非国际化版本**：当前仓库无 `locales/` 目录，也无 `vue-i18n` 依赖（参见 `package.json`，与完整版差异点之一）。
  - 国际化版本作者另开分支：`pure-admin-thin-max-ts/tree/i18n`。
- **永久同步上游**：vue-pure-admin 提交 1~2 次后，Max-Ts 会快速同步。

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

参考库本身在工作目录的 `vue-pure-admin/` 下，仅作只读参考。

### 1.3 为什么适合作为长期后台前端底座

- 主流程稳定：登录 / 路由守卫 / token 刷新 / 多标签 / keep-alive / 三级以上自动拍平 / 动态路由白屏防护，全部已实现且与作者上游保持升级一致性（`src/router/index.ts`, `src/router/utils.ts`）。
- 体积小：相比完整版砍掉大量演示模块，编译速度与心智负担都低。
- 类型清晰：`types/router.d.ts` 定义了完整的路由 meta、按钮权限字段，是后续业务路由的规范源。
- AI 友好：目录强约束、命名一致，AI 可以"按目录套范式"。

### 1.4 它不是业务系统本身

`mock/`、`src/api/`、`src/views/tenant`、`src/views/dict` 中的数据与字段都是 Pure Admin 作者为了演示而造的（参见 `mock/system.ts` 里的"高级套餐 / 普通套餐"、`mock/login.ts` 里的 admin/common），**绝不能作为后端字段、表结构、接口路径的依据**。

### 1.5 与我的 NestJS 后端之间的边界

- 后端：API、字段、枚举、错误码、权限规则、分页、审计、附件 …… **以后端为唯一真相**（NestJS + Prisma + PostgreSQL + Swagger）。
- 前端：路由、菜单、布局、表格表单、按钮显隐、token 注入、错误提示。
- 共同契约：**Swagger / OpenAPI**。前端按 Swagger 生成或手写 TS 类型，但不允许反过来要求后端"凑前端模板"。

---

## 2. 技术栈总览（基于 `package.json` 实测）

> 以下版本号引用自 `pure-admin-thin-max-ts/package.json` 当前版本 `7.0.0`。

### 2.1 框架与构建

- Vue：`vue ^3.5.32`（Vue 3，Composition API + `<script setup>`）。
- 路由：`vue-router ^5.0.4`（注意作者用的是 `vue-router 5` 的最新结构）。
- 状态：`pinia ^3.0.4`。
- 构建：`vite ^8.0.3` + `@vitejs/plugin-vue ^6.0.5` + `@vitejs/plugin-vue-jsx ^5.1.5`。
- 语言：`typescript ^6.0.2`、`vue-tsc ^3.2.6`。
- Node 引擎：`node ^20.19.0 || >=22.13.0`、`pnpm >=9`，包管理器强制 pnpm（`"preinstall": "npx only-allow pnpm"`）。

### 2.2 UI / 组件 / 样式

- Element Plus：`element-plus ^2.13.6`，**按需 import** 集中在 `src/plugins/elementPlus.ts`（已注册全套组件 + 插件）。
- 表格：`@pureadmin/table ^3.3.0`（作者自封装表格）。
- 描述列表：`@pureadmin/descriptions ^1.2.1`（已 import 类型但 `main.ts` 默认注释掉了 `use(PureDescriptions)`）。
- 工具：`@pureadmin/utils ^2.6.4`（贯穿全项目的 `storageLocal/cloneDeep/isAllEmpty/...`）。
- Tailwind：`tailwindcss ^4.2.2` + `@tailwindcss/vite ^4.2.2`，入口 `src/style/tailwind.css`（v4 语法 `@theme/@utility/@custom-variant`）。
- SCSS：`sass ^1.99.0`，入口 `src/style/index.scss`，其余子文件见 §3.5。
- 图标：`@iconify/vue 4.2.0` + `@iconify/json` + `unplugin-icons ^23.0.1`（在线/离线图标全套），离线本地字体图标在 `src/assets/iconfont/`。
- 图表：`echarts ^6.0.0`（封装在 `src/plugins/echarts.ts`，`main.ts` 默认注释）。
- 工具组件：`@imengyu/vue3-context-menu` `vue-tippy` `sortablejs` `@vueuse/core` `@vueuse/motion`。

### 2.3 网络与存储

- `axios 1.14.0`（注意是固定版本，作者刻意锁定）。
- 序列化：`qs ^6.15.0`。
- Cookie：`js-cookie ^3.0.5`。
- 本地存储：`localforage ^1.10.0`（注意 LocalStorage 已经在 `@pureadmin/utils.storageLocal` 中再封装）。
- 响应式存储：`responsive-storage ^2.2.0`（驱动 `$storage` 全局对象，用于"用户偏好持久化"）。

### 2.4 体验与 DX

- 进度条：`nprogress ^0.2.0`。
- 时间：`dayjs ^1.11.20`。
- 拼音：`pinyin-pro ^3.28.0`。
- 全局事件总线：`mitt ^3.0.1`。
- 工程：`husky ^9 + lint-staged ^16 + eslint ^10 + stylelint ^17 + prettier ^3 + commitlint`。
- Mock：`vite-plugin-fake-server ^2.2.3`（dev + prod 都启用，见 `build/plugins.ts` 中 `enableProd: true`）。
- 调试：`code-inspector-plugin`（Alt+Shift 点元素跳源码）。
- 其它：`vite-plugin-cdn-import` `vite-plugin-compression` `vite-plugin-remove-console` `vite-plugin-router-warn` `rollup-plugin-visualizer`。

### 2.5 国际化

- 当前仓库**没有 i18n 依赖**。如果将来需要英文，建议切换到作者的 i18n 分支或自行接入 vue-i18n，但**第一阶段强烈不建议启用**。

---

## 3. 目录结构理解

> 所有路径基于 `pure-admin-thin-max-ts/`。
> 「底座层」= AI 默认**不应**修改；「业务层」= AI 可在严格规范内增删；「环境层」= 由人类手动决定。

### 3.1 根目录

| 路径 | 性质 | 作用 | AI 注意事项 |
| --- | --- | --- | --- |
| `package.json` | 底座 | 锁版本、脚本、依赖 | **不得擅自加依赖**（违反"硬规则"） |
| `pnpm-lock.yaml` | 底座 | 锁文件 | 禁止手改 |
| `vite.config.ts` | 底座 | Vite 主配置 | 仅由维护者改 |
| `build/` | 底座 | `plugins/cdn/compress/info/optimize/utils.ts` | 升级 vite 插件时才会动 |
| `tsconfig.json` | 底座 | 路径别名 `@/* @build/*` | 别名是 §13 硬规则之一 |
| `eslint.config.js / stylelint.config.js / .prettierrc.js / commitlint.config.js / .lintstagedrc / .husky/` | 底座 | 工程规范 | 不要随便禁用规则 |
| `.env / .env.development / .env.production / .env.staging` | 环境层 | 端口、base、路由模式、租户/首页开关、CDN、压缩 | 见 §3.10 |
| `.browserslistrc / .editorconfig / .nvmrc / .npmrc / .dockerignore / Dockerfile / .markdownlint.json / .stylelintignore / .gitignore` | 环境层 | 工程基础设施 | 一般不动 |
| `index.html` | 底座 | 入口 HTML | 不动 |
| `mock/` | 底座（演示） | Mock API 见 §8 | 业务上线前**必须替换为真实 API** |
| `public/` | 环境层 | `favicon / logo / platform-config.json` | 见 §3.9 |
| `src/` | 业务 + 底座混合 | 见 §3.2~3.8 | 按"目录矩阵"区分 |
| `types/` | 底座 | 全局 d.ts | 见 §13 |
| `LICENSE / README.md / Dockerfile` | 文档 | 不动 |

### 3.2 `src/api/` — API 层（业务层）

```
src/api/
├── routes.ts        # getAsyncRoutes：拉动态路由的占位 API
├── system.ts        # 字典、租户演示 API
└── user.ts          # getLogin / refreshTokenApi 与 UserResult 类型
```

- **作用**：所有对后端的 HTTP 调用都集中在这里。
- **属于哪层**：业务层。
- **是否建议业务开发时修改**：是，新增业务模块时**必须**在此目录加文件，例如 `src/api/srvf/user.ts`。
- **AI 注意事项**：
  - 不准在 `views/*.vue` 里直接 `axios.get(...)` 散写请求。
  - 类型 `UserResult / RefreshTokenResult` 等需要与后端 Swagger 对齐，而不是抄前端模板。

### 3.3 `src/assets/` — 静态资源（业务/底座混合）

```
src/assets/
├── iconfont/        # 本地字体图标（main.ts 已 import iconfont.js + iconfont.css）
├── login/           # 登录页背景、插画、头像
├── status/          # 403/404/500 插图
├── svg/             # 暗夜、全屏、回到顶部 等 SVG（被 svg-loader 当组件用）
├── table-bar/       # PureTableBar 操作图标
└── user.jpg         # 默认头像
```

- 业务用图标可继续放在这里，但若要替换 logo / 登录背景请同时改 `public/logo.svg`。

### 3.4 `src/components/` — 全局组件（底座层）

```
src/components/
├── ReAuth/          # <Auth value="..."> 包裹按钮，仅当 router meta.auths 满足时渲染（src/components/ReAuth/src/auth.tsx）
├── RePerms/         # <Perms value="..."> 包裹按钮，按"登录返回 permissions"判断（src/components/RePerms/src/perms.tsx）
├── ReDialog/        # 函数式 addDialog（views/dict、views/tenant 均依赖）
├── ReFloatButton/   # 悬浮按钮
├── ReIcon/          # IconifyIconOffline / IconifyIconOnline / FontIcon
├── RePureTableBar/  # 列表页操作栏（搜索/刷新/列设置/全屏）
├── ReSegmented/     # 分段控件
├── ReText/          # 文本省略 + tooltip
└── ReCol/           # 栅格
```

- **底座层，AI 不要乱改其源码**；要扩展请用 wrapper 包一层。
- `Auth / Perms` 已在 `main.ts` 全局注册，业务页面直接 `<Auth value="...">`、`<Perms value="...">` 即可。
- 同名指令在 `src/directives/`：`v-auth` `v-perms`（参见 `src/directives/auth/index.ts` 与 `src/directives/perms/index.ts`）。

### 3.5 `src/config/` — 平台运行时配置（底座层）

```
src/config/index.ts
```

- 通过 axios fetch `public/platform-config.json` → 注入到 `app.config.globalProperties.$config` → `setConfig`。
- 同时 export `responsiveStorageNameSpace`，用于本地存储命名空间（当前为 `responsivemaxts-`）。
- **AI 注意事项**：业务页面想读全局配置请 `getConfig('XXX')`，不要硬编码。

### 3.6 `src/directives/` — 自定义指令（底座层）

```
src/directives/
├── auth/      # v-auth = ["btn.add"]，源自 router meta.auths
├── perms/     # v-perms = ["btn.add"]，源自 useUserStoreHook().permissions
├── copy/      # v-copy 复制
├── longpress/ # 长按
├── optimize/  # 防抖/节流
├── ripple/    # 涟漪
└── index.ts   # 统一导出，main.ts 自动注册
```

### 3.7 `src/layout/` — 布局（底座层）

```
src/layout/
├── index.vue                          # 总布局入口
├── frame.vue                          # iframe 嵌套页（meta.frameSrc）
├── redirect.vue                       # 路由重定向占位
├── types.ts                           # setType, routerArrays, menuType
├── hooks/                             # useNav / useTag / useLayout / useDataThemeChange / useBoolean / useMultiFrame
└── components/
    ├── lay-content/                   # 主内容容器
    ├── lay-navbar/                    # 顶部 navbar
    ├── lay-tag/                       # 多标签栏（Chrome 风格等）
    ├── lay-sidebar/                   # 侧边栏：NavVertical / NavHorizontal / NavMix / NavDouble + 各 Sidebar* 子组件
    ├── lay-setting/                   # 主题设置面板（菜单风格、主题色、灰度、色弱、水印、tags 风格 …）
    ├── lay-panel/                     # 通用面板
    ├── lay-notice/                    # 通知中心
    ├── lay-search/                    # 菜单搜索
    ├── lay-frame/                     # 单 frame 容器
    └── lay-footer/                    # 底部
```

- **AI 永远不要随便改 layout**，否则会破坏主题、菜单、多标签、keep-alive、响应式收起。
- 业务页面想改顶栏/侧栏行为时，先评估是否能通过 `platform-config.json` 或 `lay-setting` 已有开关实现。

### 3.8 `src/plugins/` — Vue 插件（底座层）

```
src/plugins/
├── echarts.ts       # useEcharts 按需注册 ECharts（main.ts 中默认注释，需要图表时再打开）
└── elementPlus.ts   # useElementPlus 注册 Element Plus 全部组件 + 指令插件
```

### 3.9 `src/router/` — 路由（底座层）

```
src/router/
├── index.ts          # createRouter、beforeEach 守卫、resetRouter、constantRoutes、constantMenus
├── utils.ts          # ascending/filterTree/filterNoPermissionTree/findRouteByPath/handleAsyncRoutes/initRouter/formatTwoStageRoutes/...
├── asyncRoutes.ts    # Max-Ts 的"前端处理动态路由格式功能" → menuToRoute / menuDataToRoutes / 自定义 initRouter（基于 getMenuList）
└── modules/
    ├── home.ts       # / + /welcome
    ├── error.ts      # /error/403,404,500
    └── remaining.ts  # /login /access-denied /server-error /redirect/:path
```

- `src/router/index.ts` 通过 `import.meta.glob("./modules/**/*.ts", { eager: true })` 自动收集除 `remaining.ts` 外的静态路由（`src/router/index.ts:44-49`）。
- 详见 §5。

### 3.10 `.env*` — 环境变量（环境层）

| 文件 | 关键变量 |
| --- | --- |
| `.env` | `VITE_PORT=8848` `VITE_HIDE_HOME=false` `VITE_ENABLE_TENANT=true` |
| `.env.development` | `VITE_PUBLIC_PATH=/` `VITE_ROUTER_HISTORY="hash"` |
| `.env.production` | `VITE_PUBLIC_PATH=/` `VITE_ROUTER_HISTORY="hash"` `VITE_CDN=false` `VITE_COMPRESSION="none"` |
| `.env.staging` | 同 production，但 `VITE_CDN=true` |

- 注意：`VITE_HIDE_HOME` 与 `VITE_ENABLE_TENANT` **只读 `.env`**（其他模式不会覆盖）。

### 3.11 `src/store/` — 状态（底座层为主）

```
src/store/
├── index.ts       # createPinia + setupStore
├── utils.ts       # 从外面 re-export 常用工具，避免循环依赖
├── types.ts       # setType/appType/userType/multiType/cacheType
└── modules/
    ├── app.ts          # 设备/侧栏/视口
    ├── settings.ts     # title/fixedHeader/hiddenSideBar
    ├── multiTags.ts    # 多标签栏数据
    ├── permission.ts   # wholeMenus/flatteningRoutes/cachePageList
    ├── epTheme.ts      # Element Plus 主题色
    └── user.ts         # 当前用户 + login/logout/handRefreshToken
```

- 业务可以新建 `src/store/modules/srvf*.ts`，但**绝不能改 user/permission/multiTags/app/settings/epTheme**。

### 3.11 `src/style/` — 样式（底座层）

```
src/style/
├── index.scss        # 入口（聚合 theme/transition/element-plus/sidebar/dark）
├── tailwind.css      # Tailwind v4 @theme/@utility/@custom-variant
├── element-plus.scss # 覆盖 Element Plus 样式
├── sidebar.scss      # 侧边栏（21KB，菜单风格核心样式都在这里）
├── theme.scss        # 主题
├── dark.scss         # 暗黑
├── transition.scss   # 动画
├── reset.scss        # 重置
└── login.css         # 登录页
```

### 3.12 `src/utils/` — 工具（底座层）

```
src/utils/
├── auth.ts                # token / userKey / multipleTabsKey / setToken / removeToken / formatToken / hasPerms
├── http/
│   ├── index.ts           # PureHttp 类（拦截器 + 刷新 token 队列）
│   └── types.d.ts         # PureHttpRequestConfig / PureHttpResponse / 自定义回调
├── localforage/           # 包装 localforage
├── progress/              # NProgress 封装
├── globalPolyfills.ts     # 全局 polyfill
├── responsive.ts          # 响应式存储 injectResponsiveStorage
├── message.ts             # 全局 message
├── mitt.ts                # 事件总线（layout 用得多）
├── sso.ts                 # 单点登录占位（main.ts 默认注释）
├── tree.ts                # buildHierarchyTree / handleTree
├── propTypes.ts / preventDefault.ts / print.ts
```

### 3.13 `src/views/` — 视图（业务层）

```
src/views/
├── welcome/              # 占位首页
├── login/                # 登录页（+ utils/rule.ts + motion.ts + static.ts）
├── error/                # 403/404/500
├── permission/           # 页面级 + 按钮级权限演示
├── dict/                 # 字典管理（树 + 表 + 弹窗）
├── tenant/list/          # 租户列表
├── tenant/package/       # 租户套餐
└── schedule/             # 日历排班
```

- **业务层主战场。** 后续 SRVF / U Studio / U Agents 等业务都加在这里。
- 每个模块约定：
  - `index.vue` 主页
  - `tree.vue` 等子页面
  - `form/` 表单
  - `utils/hook.tsx` 列表逻辑、列定义、对话框
  - `utils/rule.ts` 校验规则
  - `utils/types.ts` 表单 props 类型
- 这一规范请 AI **抄抄抄**，新模块照此结构开。

### 3.14 `types/` — 全局类型（底座层）

```
types/
├── index.d.ts           # 入口
├── router.d.ts          # 路由 meta、RouteConfigsTable、CustomizeRouteMeta（必读）
├── directives.d.ts
├── global.d.ts
├── global-components.d.ts
├── shims-vue.d.ts
└── shims-tsx.d.ts
```

- `types/router.d.ts` 中的 `CustomizeRouteMeta` 是所有路由 meta 的事实来源（title/icon/showLink/roles/auths/keepAlive/frameSrc/transition/...）。

---

## 4. 启动、构建与工程命令

来源：`package.json`。

| 任务 | 命令 | 说明 |
| --- | --- | --- |
| 安装 | `pnpm install` | 强制 pnpm（`preinstall: only-allow pnpm`） |
| 开发 | `pnpm dev` | 等价于 `pnpm serve`；端口默认 8848（`VITE_PORT`） |
| 构建生产 | `pnpm build` | `rimraf dist && vite build`，内存 8GB |
| 构建预发 | `pnpm build:staging` | `vite build --mode staging` |
| 构建分析 | `pnpm report` | 触发 `rollup-plugin-visualizer`，输出 `report.html` |
| 预览 | `pnpm preview` 或 `pnpm preview:build` | 本地预览打包结果（mock 在 prod 模式仍会启用） |
| 类型检查 | `pnpm typecheck` | `vue-tsc --noEmit --skipLibCheck` |
| ESLint | `pnpm lint:eslint` | `--max-warnings 0`（0 警告） |
| Prettier | `pnpm lint:prettier` | 写回 src 下所有支持文件 |
| Stylelint | `pnpm lint:stylelint` | css/scss/vue 内 style |
| 全部 Lint | `pnpm lint` | 三件套合一 |
| SVG 压缩 | `pnpm svgo` | 压缩所有 SVG |
| 清缓存 | `pnpm clean:cache` | 清 eslint cache / lockfile / node_modules / pnpm store |

**AI 改完代码后建议依次跑**：

```
pnpm lint
pnpm typecheck
pnpm dev   # 本地肉眼回归
```

提交前再 `pnpm build` 验证生产构建。

---

## 5. 路由与菜单系统

### 5.1 路由入口

- `src/router/index.ts` 是唯一入口；`createRouter` 在这里产出，`router.beforeEach`/`afterEach` 也在这里。

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
  1. NestJS 后端独立设计并实现菜单管理 API（不是因为前端有 `MenuData` 接口就反推一张 23 字段的菜单表，参见红线 1）；
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

### 5.6 Max-Ts "前端处理动态路由格式"

文件：`src/router/asyncRoutes.ts`。
- 后端只需返回**一维菜单列表**（`MenuData[]`，按 `parentId / id` 拼父子关系）；
- 前端通过 `handleTree(data, "id", "parentId", "children")` → `menuToRoute()` → `cleanObject()` 自动生成路由树；
- 子节点中 `menuType=3`（按钮）会被聚合到父路由的 `meta.auths`；
- 平台规定**顶层 rank=0 仅 `home` 可用**，其他必须从非 0 开始（`src/router/asyncRoutes.ts:131`）。

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

如果实在要改，请同时在 PR/对话里输出 §13 的"风险评估"。

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
- 登录成功后 `views/login/index.vue` 调 `initRouter()`（默认是 `@/router/utils` 那一份），再 `router.push(getTopMenu(true).path)`。

### 6.2 Token 存储

来源：`src/utils/auth.ts`。

- `accessToken / expires / refreshToken` 三个字段，序列化后存 **Cookie** `authorized-token`（key = `TokenKey`），过期时间用 `(expires - now) / 86400000` 天数。
- `multiple-tabs`：会话 cookie，用于"多标签共享登录态"；浏览器全关后 cookie 销毁，重新登录。
- `user-info`（key = `userKey`）：localStorage，存 `avatar / username / nickname / roles / permissions / refreshToken / expires`。
- 路由守卫（`src/router/index.ts:150-`）通过 `Cookies.get(multipleTabsKey)` + `storageLocal().getItem(userKey)` 双条件判断是否已登录。

### 6.3 Token 注入

`src/utils/http/index.ts`：

- 请求拦截器先看 `beforeRequestCallback`（请求级）→ `PureHttp.initConfig.beforeRequestCallback`（全局级）→ 否则进入 token 流程。
- 白名单：`/refresh-token`、`/login` 直接放行。
- 有 token 且未过期 → `Authorization: Bearer <token>`（`formatToken`）。
- 过期 → 标记 `isRefreshing`，调 `useUserStoreHook().handRefreshToken({ refreshToken })`，期间其他请求被 push 到 `PureHttp.requests` 队列，刷新成功后批量重放；失败则 `logOut()` + 提示"登录已过期"。

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
│     · 实现：<Auth value="..."> 或 v-auth
│     · 适用：菜单结构稳定、按钮固定挂在某页面下
│
└── 页面内某按钮显隐，且与"当前登录用户实时权限"绑定（api-based）
      · 数据源：登录返回 user.permissions[]（pinia store）
      · 实现：<Perms value="..."> 或 v-perms
      · 适用：权限高度动态、跨页面通用 code
```

一般 SRVF 后台用「meta.roles + Perms」组合即可。第一阶段不必启用 meta.auths（要靠菜单管理 API 喂数据，参见 §5.2.1）。

### 6.6.2 ⛔ 演示角色名不得作为 SRVF 正式角色（裁决 3）

- mock 中的 `roles: ["admin"]` / `["common"]`、`permissions: ["*:*:*"]` / `["permission:btn:add"]` 等**仅为演示**。
- SRVF 正式角色名必须由 NestJS 后端独立设计后给出（如 `srvf_superadmin / srvf_captain / srvf_member`，具体以后端为准）。
- 接入 NestJS 登录的同时，必须**全量替换**：
  - `mock/asyncRoutes.ts` 中所有 `roles: ["admin", "common"]` → 替换为后端真实角色名（或在生产前删除整个 mock 链路）；
  - `src/router/modules/*` 中如有 `meta.roles`，按 NestJS 真实角色名重写。
- **绝不允许**保留 `admin / common` 一直跑到上线。

### 6.7 前端权限 vs 后端权限的边界（⛔ P0 红线，裁决 3）

- **前端**：仅决定**看不看得见 / 点不点得到**，目的是体验。
- **后端**：**最终安全闸**——任何写操作必须在 NestJS controller / service 层校验 `JwtAuthGuard / RolesGuard / PermissionsGuard / BizCode`。
- 前端 `roles / auths / permissions` 三个字段只是 **UI 显隐 key**，它们：
  - **不等于**后端 BizCode；
  - **不等于**后端 Permission 表；
  - **不是**SRVF RBAC 设计依据。
- 后端权限模型（角色 / 权限 / 范围 / 业务码）由 NestJS 独立设计。前端按登录返回结构**适配**，**不反向定义**。
- **绝不能**因为前端模板里写了 `permissions = ["permission:btn:add"]`，就反过来让后端建一个 `permissions` 字符串列。

---

## 7. 请求封装与 API 管理

### 7.1 axios 封装

文件：`src/utils/http/index.ts`，类型：`src/utils/http/types.d.ts`。

- 默认配置 `timeout: 10000`、`Content-Type: application/json`、`paramsSerializer = qs.stringify`。
- 暴露三件套：`request<T>(method, url, param?, axiosConfig?)`、`post<T,P>` 、`get<T,P>`。
- 注意：**当前没有默认 baseURL**，依赖 vite proxy 与浏览器同源。
- 响应拦截器**不做错误码统一处理**——直接 `return response.data`；业务调用方需要自己检查 `code === 0`。

### 7.2 baseURL / 代理

- `vite.config.ts` 中 `server.proxy = {}` 默认空。
- 接 NestJS 时建议两条路：
  - 开发：在 `vite.config.ts` 加 `proxy: { "/api": { target: "http://localhost:3000", changeOrigin: true, rewrite: p => p.replace(/^\/api/, "") } }`（由人类一次性配置，**不要让 AI 凭空改**）。
  - 生产：通过反向代理在网关层处理。
- 或者在 `src/utils/http/index.ts` 的 `defaultConfig` 中加 `baseURL: import.meta.env.VITE_API_BASE` 等环境变量（建议人类介入决策）。**注意：这是底座层改动，AI 改之前必须先写风险评估。**

### 7.3 请求拦截器 / 响应拦截器 / 错误处理

详见 §6.3。

- 缺陷：**没有响应级"全局错误提示"**——业务调用层要自己 catch + `message(...)`。后续接 NestJS 时建议增加：
  - 响应拦截器对 401 强制登出；
  - 5xx 统一 `message` 报错；
  - NestJS 的 `BizCode` 错误码统一转 message 文案。
- 这些改动属于底座升级，必须经人类同意。

### 7.4 API 文件组织

- 一个业务模块 = 一个 `.ts` 文件，例：`src/api/srvf-user.ts`。
- 每个 API 函数返回 `Promise<具体类型>`，类型放同一文件或同名 `.d.ts`。
- **禁止在 `views/*.vue` 内直接调 axios / fetch**。
- 文件内必须 export `type XxxResult = { code, message, data: ... }`（对齐后端统一返回结构）。

### 7.5 对接 NestJS Swagger / 统一返回结构（裁决 7 必读）

- 后端 Swagger 是契约真相。前端可：
  1. **手写**：把 `getDictDetail / getTenantList` 这种演示函数全部替换成真实 NestJS 接口路径（如 `/api/v1/users`）。
  2. **生成**：基于 OpenAPI 用 `openapi-typescript` 或 `swagger-typescript-api` 生成 `src/api/__generated__/`，业务再 import（推荐，后续可加 CI 校验）。
- **统一返回结构对齐**：
  - thin-max-ts **假设**了 `{ code: 0, message, data }`（见 `src/api/user.ts:3-24`），**但这只是 mock 的格式，不是 NestJS 一定的格式**。
  - NestJS 项目的真实返回**可能**是 `{ code, message, data }` / `{ code, msg, data }` / `{ success, data, error }` / `{ data, meta, errors }` ……
  - **接登录的同一个 PR 里必须一次性确认并适配**，禁止"先接着、慢慢改"：
    1. 从 Swagger / 后端文档确认真实返回结构；
    2. 在 `src/utils/http/index.ts` 的响应拦截器（约 L126-138）**一次性适配**（如把 `{ data, meta }` 重写为 `{ code: 0, message: "", data }`），让业务层永远拿到同一种结构；
    3. 在 `src/api/user.ts` 的 `UserResult` 类型同步改字段；
    4. 在 `src/utils/auth.ts:setToken` 处适配 token 过期时间格式：
       - 若后端返回 `expires` 是 **ISO/日期字符串** → 保留 `new Date(data.expires).getTime()`；
       - 若返回 **unix ms 数字** → 改 `expires = data.expires`，并把 `DataInfo<Date>` 改成 `DataInfo<number>`（作者已在源文件中给出注释）；
       - 若返回 **`expiresIn` 秒数**（OAuth 2 风格） → `expires = Date.now() + data.expiresIn * 1000`。
- **绝不能让后端去凑前端**——出现字段或结构不一致时，**改前端拦截器与类型**。

### 7.6 refresh token 适配规则（裁决 7）

`src/utils/http/index.ts` 当前已实现"token 过期 → 单 refresh + 多请求队列重放"逻辑（`isRefreshing` 标志 + `PureHttp.requests` 队列）。

**前端刷新队列是前端内部优化，refresh-token 是后端架构选择；两者独立。后端无 refresh 时前端降级，禁止反推后端实现 refresh。**

接入 NestJS 时必须做适配判断：

| NestJS 是否有 refresh-token | 前端处置 |
| --- | --- |
| ✅ 有 | 把 `refreshTokenApi`（`src/api/user.ts`）URL 与请求体改为后端真实接口；保留队列逻辑 |
| ❌ 无（仅短时效 accessToken） | 前端**降级**：删除 / 注释 `httpInterceptorsRequest` 中 `expired === true` 分支的刷新流程，过期直接 `logOut()`；同时 `mock/refreshToken.ts` 可保留但不再被调 |
| ⚠️ 后端要专门为前端设计 refresh | **不允许**。后端不实现 refresh，是后端的选择，前端用降级方案，**不得倒逼后端实现 refresh 仅仅为了配合 thin-max-ts 模板** |

**禁止**因为模板自带刷新队列，就要求后端必须实现 `/refresh-token`。这是变相违反红线 1。

---

## 8. Mock 体系

### 8.1 文件位置

```
mock/
├── login.ts        # /login（admin / common 两种角色返回）
├── refreshToken.ts # /refresh-token
├── system.ts       # 字典 / 租户 / 套餐
└── asyncRoutes.ts  # /get-async-routes（permission/schedule/dict/tenant 四个动态路由）
```

### 8.2 启用方式

- 由 `vite-plugin-fake-server` 接管，配置在 `build/plugins.ts`：
  ```ts
  vitePluginFakeServer({
    logger: false,
    include: "mock",
    infixName: false,
    enableProd: true
  })
  ```
- **`enableProd: true` 意味着 production 也会走 mock**（用于演示）。**生产环境接真后端前必须将 `enableProd` 改为 `false` 或卸载该插件**。

### 8.3 关闭方式

- 临时关闭：删除 `build/plugins.ts` 中 `vitePluginFakeServer({...})` 这一项。
- 单条接口替换：在 `src/api/*.ts` 中改 URL 指向真实后端，`vite.config.ts` 的 `server.proxy` 把 `/login` 等代理到 NestJS。
- 后续推荐：**业务模块只允许走真接口，演示模块单独 namespace**（如 mock 全部加 `/mock/...` 前缀，proxy 也只代理非 `/mock/...`）。

### 8.4 当前 mock 一览

| URL | 方法 | 文件 | 说明 |
| --- | --- | --- | --- |
| `/login` | POST | `mock/login.ts` | 返回 admin / common 两套用户 |
| `/refresh-token` | POST | `mock/refreshToken.ts` | 刷新 token（**用于触发 §6.3 队列重放，必须保留可替换**） |
| `/get-async-routes` | GET | `mock/asyncRoutes.ts` | 返回 4 个动态路由（permission/schedule/dict/tenant） |
| `/dict-tree` | GET | `mock/system.ts` | 字典左侧树 |
| `/dict-detail` | POST | `mock/system.ts` | 字典明细 |
| `/tenant-list` | POST | `mock/system.ts` | 租户列表 |
| `/tenant-package` | POST | `mock/system.ts` | 租户套餐 |
| `/tenant-package-menu` | POST | `mock/system.ts` | 租户套餐菜单权限 |
| `/tenant-package-menu-ids` | POST | `mock/system.ts` | 根据角色 id 查菜单 |
| `/tenant-package-simple` | GET | `mock/system.ts` | 简化套餐下拉 |

### 8.5 ⛔ Mock 硬规则（裁决 4，P0）

1. **mock 只能服务演示，不得服务业务真相**。任何 SRVF 业务模块都禁止把 mock 作为接口契约依据。
2. **默认禁止新增任何 mock**；仅在 UI 无法初始化或缺少临时数据会导致页面无法编译 / 无法进入的极端情况下，才允许新增 `*.demo.ts` 临时占位，且必须满足以下条件：
   - 文件名 / URL / 文件头注释中**显式标记** `temporary` 或 `demo`（例如 `mock/srvfTeam.demo.ts`、URL 加前缀 `/demo/...`）；
   - PR 描述里写"接 NestJS 真接口后立即删除"+ 预计接入 PR 编号；
3. **接真 API 后不得继续依赖 mock**。同一个模块不能"页面 A 走真接口、页面 B 还在 mock"，要全切。
4. **生产环境必须关闭 mock**：`build/plugins.ts` 中 `vitePluginFakeServer({ enableProd: false })`——这是第一阶段 PR-2 的必改项。
5. mock 字段不是后端字段。**绝不能因为 mock 里有 `packageId/expireTime/contactMobile/dictId/menuType` 等字段，就反推后端要建这些字段**（红线 1、红线 2、红线 3）。
6. 即便短期保留 mock 文件作为参考范式，**也不得将其 URL 暴露给业务调用方**，业务侧只看 `src/api/*.ts`。

---

## 9. 组件与页面范式

### 9.1 表格列表页（最常用）

参考：`src/views/dict/index.vue`、`src/views/tenant/list/index.vue`。

- 模板拆分：
  - `index.vue`：搜索表单 + `<PureTableBar>`（来自 `@/components/RePureTableBar`）+ 表格 + 分页。
  - `utils/hook.tsx`：`columns / pagination / dataList / loading / onSearch / openDialog / handleDelete / ...`。
  - `utils/types.ts`：表单 props 类型。
  - `utils/rule.ts`：Element Plus 表单校验。
- 表格组件用 `@pureadmin/table` 的 `<PureTable>`，列内可用 JSX `cellRenderer`（参见 `src/views/dict/utils/hook.tsx`）。

### 9.2 搜索表单

- 顶部 `el-form inline` 形式，提交触发 `onSearch()` → 重置触发 `resetForm()`（参见 `src/views/tenant/list/index.vue` 模板部分）。

### 9.3 新增 / 编辑弹窗

- 用 `addDialog`（来自 `@/components/ReDialog`）以**函数式**打开 dialog，避免每个页面写 `el-dialog`。
- 表单组件单独放在 `views/<模块>/form/index.vue`，通过 props 接收初始值。
- 参考：`src/views/dict/utils/hook.tsx` → `openDialog` 系列函数。

### 9.4 树形

- 字典页（`src/views/dict/tree.vue`）和租户套餐菜单都是 `el-tree`。
- 树数据建议用 `@/utils/tree.ts:handleTree(data, "id", "parentId", "children")` 把一维列表转树。

### 9.5 详情页 / Drawer / Dialog

- thin-max-ts 自带的"详情"模式较少，主要用 `el-drawer` / `el-dialog`。
- **如果业务需要"详情页/抽屉/向导步骤"**，应到 vue-pure-admin 完整版查范式：
  - `schema-form/form/drawer.vue`
  - `schema-form/form/dialog.vue`
  - `schema-form/form/steps.vue`

### 9.6 状态开关 / Tag 颜色

参考 `src/views/tenant/hooks.ts:usePublicHooks()` —— 暗色 / 亮色下 `el-switch` 与 `el-tag` 的统一配色，可直接复用。

### 9.7 Tabs / Drawer / Dialog / 日历 / 上传 / 权限按钮 / 图表看板

| 范式 | thin-max-ts 内 | vue-pure-admin 完整版补丁 |
| --- | --- | --- |
| Tabs | 顶部多标签自带 | `src/views/components/tabs/*`（演示） |
| Drawer | `el-drawer` 直接用 | `src/views/schema-form/form/drawer.vue` |
| Dialog | `@/components/ReDialog` 函数式 | `src/views/schema-form/form/dialog.vue` |
| 日历 | `src/views/schedule/` Element Calendar | 无 |
| 上传 | 无（需自封装） | `src/views/components/upload/*` |
| 权限按钮 | `Auth / Perms` 组件 + `v-auth / v-perms` 指令 | 同上 |
| 图表 | `ECharts` 已引入但 `main.ts` 默认注释 | `src/views/components/echarts/*` |
| Excel 导出 | 无 | `src/views/table/high/excel/index.vue`（需要 `xlsx`） |

### 9.8 新页面应优先参考的文件

| 想做的事 | 先看 |
| --- | --- |
| 列表 + 搜索 + 弹窗 CRUD | `src/views/tenant/list/index.vue` + `utils/hook.tsx` |
| 树 + 表格联动 | `src/views/dict/index.vue` + `tree.vue` |
| 日历 / 时间轴 | `src/views/schedule/index.vue` |
| 按钮权限 | `src/views/permission/button/index.vue` 与 `perms.vue` |
| 页面权限 | `src/views/permission/page/index.vue` |
| Element Plus 风格 | `src/views/login/index.vue` |
| 表单校验 | `src/views/login/utils/rule.ts`、`src/views/tenant/list/utils/rule.ts` |

---

## 10. Max-Ts 特有能力盘点（v0.2 重写）

> 每个模块给出：「**第一阶段处理**」、「**是否允许影响后端设计**」、「**风险级别**」、「**处理建议**」。
> 第一阶段处理类目：`启用` / `隐藏保留` / `禁止启用` / `UI 占位`。

### 10.1 字典管理（`src/views/dict/`）

- 路径：`src/views/dict/` + `src/api/system.ts:getDictTree/getDictDetail` + `mock/system.ts:/dict-tree, /dict-detail`
- **第一阶段处理**：`隐藏保留`。菜单暂不挂出，源码作为字典页范式参考；若 UI 临时需要字典枚举，**只能使用 demo/placeholder 命名**（参见裁决 6）。
- **是否允许影响后端设计**：❌ 不允许。`dictId / label / value / status / color / sort / remark / createTime` 字段是 mock 演示，**不是**后端字典 schema。
- **风险级别**：🟠 中高（容易被 AI 套字段反推后端字典表）。
- **处理建议**：
  - 正式字典以后端 `dict_types / dict_items`（或同等 schema）为准，由 NestJS 单独设计；
  - 前端不得先硬编码正式字典常量；
  - 如确需 UI 占位，文件命名 `*.demo.ts` 或在文件头注释 `// TEMPORARY / DEMO – replace once backend dict API ready`；
  - 第二阶段后端字典 API 就绪后才接入。

### 10.2 多租户管理（`src/views/tenant/*`，⛔ P0 红线 3）

- 路径：`src/views/tenant/list/`、`src/views/tenant/package/`、`.env: VITE_ENABLE_TENANT=true`、`mock/system.ts:/tenant-*`、`mock/asyncRoutes.ts:tenantManagementRouter`
- **第一阶段处理**：`禁止启用`，但**保留源码**（裁决 1）。具体动作：
  - 改 `.env: VITE_ENABLE_TENANT=false`；
  - 在 `mock/asyncRoutes.ts` 中**隐藏**（注释或从 `data` 数组移除）`tenantManagementRouter`，让侧边栏不出现"租户管理"菜单；
  - `src/views/tenant/*` 源码保留作为参考范式；
  - 是否物理删除 → 后续单独 PR 决策，**不要在第一阶段顺手删**。
- **是否允许影响后端设计**：❌ 严禁。后端不是多租户架构，前端启用 / 反推都违反红线 3。
- **风险级别**：🔴 高（最容易污染后端的模块）。
- **处理建议**：
  - 第一阶段就把"是否多租户"问题钉死为「单租户」，避免 AI 看到模板后摇摆；
  - 后续若 SRVF 真的需要 SaaS 多组织能力（不在第一阶段范围），由后端先确定模型再回头看这个模块。

### 10.3 租户套餐菜单 RBAC（`mock/system.ts:/tenant-package-menu*`）

- **第一阶段处理**：`禁止启用`，随租户管理一同隐藏。
- **是否允许影响后端设计**：❌ 严禁（红线 3 + 红线 4）。
- **风险级别**：🔴 高。
- **处理建议**：连同 §10.2 一起处理。

### 10.4 日历排班（`src/views/schedule/`）

- 路径：`src/views/schedule/` + `mock/asyncRoutes.ts:scheduleRouter`
- **第一阶段处理**：`UI 占位`。可前移为 SRVF「活动 / 训练 / 出勤」日历入口（裁决 7）。
- **是否允许影响后端设计**：❌ 不允许。schedule mock 字段（上午/中午/晚上的简单排班）与 SRVF 真实活动模型差距很大。
- **风险级别**：🟠 中（业务需求驱动而非模板字段驱动）。
- **处理建议**：
  - 可建立 `src/views/srvf-calendar/`（或参考 schedule 直接改造其内容），仅做**静态 UI 占位**；
  - 不设计真实活动数据库 schema、不定义正式活动状态机；
  - 字段、状态、关系等待 NestJS Activity / Event / Attendance 等真实模型确定后再接入。

### 10.5 前端处理动态路由格式（`src/router/asyncRoutes.ts`，⛔ P0 红线，裁决 2）

- **第一阶段处理**：`禁止启用`。
- **是否允许影响后端设计**：❌ 严禁。`MenuData` 接口的 23 个字段是前端展示需要，不得让后端先建一张超大菜单管理表。
- **风险级别**：🔴 高。
- **处理建议**：
  - 第一阶段使用静态路由 `src/router/modules/srvf-*.ts` + 路由 meta.roles；
  - 不修改 `src/views/login/index.vue` 的 import；
  - `getMenuList` 不存在不是 bug，不允许补；
  - 后续如确需动态菜单，由人类发起单独批次（NestJS 设计独立菜单 API → 前端切换 → review）。

### 10.6 按钮 / 页面权限演示（`src/views/permission/`）

- 路径：`src/views/permission/page/`、`src/views/permission/button/`
- **第一阶段处理**：`隐藏保留`。SRVF 第一阶段用 meta.roles + `<Perms>` 已够。
- **是否允许影响后端设计**：❌ 不允许（红线 4）。
- **风险级别**：🟠 中。
- **处理建议**：作为权限 UI 范式参考，不挂菜单；待后端权限模型稳定后再决定是否需要等价页面。

### 10.7 新款菜单布局（vertical / horizontal / mix / double）

- 路径：`src/layout/components/lay-sidebar/Nav*.vue` + `app.layout`
- **第一阶段处理**：`启用`，默认 `Layout: "double"` 即可（`public/platform-config.json`）。
- **是否允许影响后端设计**：✅ 无关。
- **风险级别**：🟢 低。
- **处理建议**：保留即可。

### 10.8 菜单风格（popular / classic）

- 路径：`MenuStyle: "popular"`（默认）；`useDataThemeChange.setMenuStyleVariables` + `src/style/sidebar.scss`
- **第一阶段处理**：`启用`，保留 `popular`。
- **是否允许影响后端设计**：✅ 无关。
- **风险级别**：🟢 低。
- **处理建议**：业务无需关心。

### 10.9 页头主题快捷操作（`src/layout/components/lay-setting/`）

- **第一阶段处理**：`启用`。
- **是否允许影响后端设计**：✅ 无关。
- **风险级别**：🟢 低。
- **处理建议**：保留，业务用户可自由切换；如需关闭整个面板入口，由人类决策。

### 10.10 `@pureadmin/table` 高级表格 + `RePureTableBar`

- **第一阶段处理**：`启用`。
- **是否允许影响后端设计**：✅ 无关（仅是 UI 组件）；但列定义、字段对接以后端为准。
- **风险级别**：🟢 低。
- **处理建议**：业务列表页统一沿用，详见 §9。

### 10.11 响应式存储 `$storage`

- 路径：`responsive-storage` + `src/utils/responsive.ts` + `src/config/index.ts:responsiveStorageNameSpace`（值 `"responsivemaxts-"`）
- **第一阶段处理**：`启用`。
- **是否允许影响后端设计**：✅ 无关。
- **风险级别**：🟢 低。
- **处理建议**：业务避免硬编码命名空间字符串，统一通过 `responsiveStorageNameSpace()`。

### 10.12 iframe 嵌套页（`src/layout/frame.vue` + `meta.frameSrc`）

- **第一阶段处理**：`隐藏保留`。
- **是否允许影响后端设计**：✅ 无关。
- **风险级别**：🟢 低。
- **处理建议**：业务需要内嵌外部系统时再启用。

---

## 11. 与 SRVF NestJS 后端的对接策略（v0.2 重写）

### 11.0 ⛔ 强约束（先于一切对接）

- **Swagger / OpenAPI 是唯一接口契约。** 任何与 Swagger 不符的前端调用都视为前端 bug，**改前端**。
- **前端不得定义后端模型。** 字段、枚举、状态机、分页、错误码均以后端 Prisma schema + Swagger 为准。
- 前端做**体验层校验**（必填、长度、正则、UI 联动）；后端做**最终业务校验**（唯一性、状态机、权限、关联完整性、并发安全）。
- 任何"为前端方便"而要求后端建表 / 加字段 / 改返回结构的诉求，必须经人类批准并以"业务需求"立项，**而非以前端模板为由**（违反红线 1~4）。

### 11.1 接入总流程

1. NestJS 输出 `openapi.json`（建议放 `docs/openapi.json` 或 CI 拉取）；
2. 前端在 `src/utils/http/index.ts` 响应拦截器**一次性**适配后端返回结构（参见 §7.5 详细步骤）；
3. 在 `src/api/<业务模块>.ts` 写业务 API 函数 + TS 类型（手写或由 `openapi-typescript` 生成到 `src/api/__generated__/`）；
4. 业务 view 只 import `src/api/*`，不在 view 内散写 axios。
5. 错误码 / BizCode：建议在 `src/utils/message.ts` 周围加 `bizCodeToMessage` 字典；映射表由后端提供。

### 11.2 各业务模块对接状态总览

> 「现状」= thin-max-ts 是否有前端现成模块；「第一阶段动作」= 第一阶段做什么；「等待后端」= 等什么。

| 业务模块 | thin-max-ts 现状 | 第一阶段动作 | 等待后端 | 备注 |
| --- | --- | --- | --- | --- |
| **登录 / Token** | ✅ `src/views/login/`、`src/api/user.ts`、`src/utils/auth.ts`、`src/utils/http/index.ts` | **必做**：接 NestJS `/auth/login`；适配返回结构与 `expires`；按 §7.6 决定 refresh 适配 | 否（已具备） | 见 §6、§7、PR-4 |
| **当前用户信息** | ✅ Pinia `user` store + setToken 写入 | **必做**：把登录返回字段映射到 store | 后端返回结构 | 注意角色名替换（§6.6.2） |
| **用户管理（列表/详情/启停）** | ⚠️ 无（thin-max-ts 不带 `system/user` 页） | **暂缓**第一阶段；可参考 vue-pure-admin `src/views/system/user/` 作为范式 | 后端 `/users` CRUD API + Prisma `User` 模型 | 字段以后端为准；分页参数 (`page/pageSize` 与否) 也以后端为准 |
| **字典管理** | ✅ `src/views/dict/` + mock `/dict-*`（演示） | **暂缓**接真接口；菜单先隐藏；UI 占位用 `*.demo.ts` 常量 | 后端 `dict_types / dict_items` schema | 见 §10.1、裁决 6 |
| **组织架构（队伍/分队/队员）** | ❌ 无 | **可前移 UI 骨架**（裁决 8）；只做菜单 + 占位页 | 后端"组织 / 部门 / 分队 / 岗位"模型（由 NestJS 设计） | 不硬编码真实层级；不固定字段；参考 vue-pure-admin `system/dept/` 仅作交互范式 |
| **活动 / 训练 / 出勤日历** | ⚠️ `src/views/schedule/` 是简化排班演示 | **可前移 UI 占位**（裁决 7）；只做菜单 + 静态页 | 后端 `Activity / Event / Attendance` 模型 | 不设计活动数据库；不定义状态流；接真 API 前不引入真实数据 |
| **附件 / 文件管理** | ❌ 无（无 upload 组件） | **不前移**；待后端附件 API + 对象存储确定后再做 | 后端 `Attachment / FileObject` 模型 + 上传策略 | 可参考 vue-pure-admin `src/views/components/upload/` 作为范式 |
| **审计日志** | ❌ 无 | **不前移** | 后端 `AuditLog` 模型 | 可参考 vue-pure-admin `src/views/monitor/logs/system/` 作为范式 |
| **角色 / 权限管理** | ❌ 无对应管理页（仅 mock 演示） | **不前移**；前端只消费登录返回 | 后端 RBAC 模型（红线 4） | 不允许提前定义按钮 code 体系 |
| **菜单管理（动态菜单）** | ⚠️ `src/router/asyncRoutes.ts` 演示（红线 2 + 5） | **禁止启用** | 无（第一阶段一律禁启 asyncRoutes，与后端是否已有菜单 API 无关） | 不补 `getMenuList`、不切 import |

### 11.3 登录对接（PR-4 操作手册）

- `src/api/user.ts:getLogin` URL → NestJS `/auth/login`（或 Swagger 指定的实际路径）；
- `UserResult.data` 字段同 NestJS 真实返回（如 `accessToken / refreshToken / expiresIn / user.{id,username,roles[],permissions[]}`），**改前端类型不改后端**；
- `src/utils/auth.ts:setToken` 按 §7.5 适配 `expires` / `expiresIn`；
- 决定 refresh 策略后按 §7.6 处理；
- 关 `mock/login.ts`（不删，仍可作演示参考）；
- 配 `vite.config.ts: server.proxy` 把 `/auth/*`、`/users/*` 等代理到 NestJS。

### 11.4 字典对接（暂缓但要明确边界，裁决 6）

- **现阶段**：菜单隐藏 `dictManagementRouter`，源码保留；
- **如需 UI 占位**：建立 `src/constants/<模块>.demo.ts` 临时常量，文件头注释清楚 `TEMPORARY / DEMO`；
- **接真接口时**：API 路径、字段、状态值全部来自 NestJS Swagger，**前端 mapper 适配 mock 风格 → 后端真实结构**；
- **禁止**：把 demo 常量当成正式字典；把 mock `dictId/label/value/status/color/sort/remark/createTime` 当成后端字段。

### 11.5 组织架构对接（裁决 8）

- **现阶段**：建立 `src/views/srvf-org/` 菜单 + 占位页（参考 vue-pure-admin `src/views/system/dept/` 的**交互范式**，不抄字段）；
- **禁止**：硬编码真实队伍层级；提前固定"部门/分队/岗位"字段；引入"多租户 + 多部门"双层级。
- **接真接口**：后端给"部门树"接口（一维 + parentId 或直接树），前端 `handleTree` 转树。

### 11.6 活动日历对接（裁决 7）

- **现阶段**：建立 `src/views/srvf-calendar/` 菜单 + 静态占位（参考 `src/views/schedule/`）；
- **禁止**：设计真实活动数据库 schema；定义正式活动状态机；硬编码 SRVF 真实活动数据。
- **接真接口**：后端 `Activity / Event / Attendance` 模型确认后，API 推荐 `GET /activities?start=YYYY-MM-DD&end=...`，字段以 Swagger 为准。

### 11.7 附件 / 审计 / 角色 / 菜单管理

- **第一阶段不前移**，避免凭空设计。
- 待业务场景与后端 schema 确认后再立项。
- 参考范式见 §12.2。

### 11.8 Swagger / OpenAPI 工作流

- 流程：
  1. NestJS 产出 `openapi.json` → 提交到本仓库（如 `docs/openapi.json`）；
  2. 可选：`openapi-typescript` 生成 `src/api/__generated__/schemas.ts`；
  3. 业务 API 函数 import 生成类型；
  4. 若契约破坏（字段重命名、类型变化），CI 在前端报错。
- **此流程的接入由人类决策**，本文档此处只做记录。

---

## 12. vue-pure-admin 完整版参考策略

### 12.1 使用流程（铁律）

```
准备做一个新页面：
  ① 在 vue-pure-admin/src/views/ 全文搜索相似关键词（例如 "user"、"role"、"calendar"、"upload"）。
  ② 找到相似页面 →
       a. 复制其交互结构、列定义、表单字段顺序；
       b. 改 API 为 NestJS 真接口；
       c. 改字段类型为后端 Prisma 模型；
       d. 改权限标识为后端 BizCode / Permission；
       e. 用 thin-max-ts 已有的 ReDialog / PureTableBar / Auth / Perms 替换示例里的组件。
  ③ 没有完全相似的：找相似 CRUD 范式（user/role/menu/dept 任选）。
  ④ 还不行：在 thin-max-ts 现有 dict/tenant/schedule 中找最近的范式。
  ⑤ 都不行：才允许新创建范式，并把新范式纳入本文档 §9。
```

### 12.2 完整版"最值得参考的清单"

> 路径都是 `vue-pure-admin/...`

| 想要做的事 | 直接看 |
| --- | --- |
| 用户管理（含分配角色） | `src/views/system/user/index.vue` |
| 角色管理（含菜单权限分配） | `src/views/system/role/index.vue` |
| 菜单管理（树 + 表单） | `src/views/system/menu/index.vue` |
| 部门树（组织架构） | `src/views/system/dept/index.vue` |
| 系统日志 + 详情页 | `src/views/monitor/logs/system/index.vue` |
| 在线用户 | `src/views/monitor/online/index.vue` |
| 表格基础 | `src/views/table/base/*` |
| 表格高级（拖拽 / Excel / 打印） | `src/views/table/high/*` |
| 虚拟滚动表格 | `src/views/table/virtual/*` |
| Schema Form | `src/views/schema-form/form/base.vue` |
| 抽屉表单 | `src/views/schema-form/form/drawer.vue` |
| 对话框表单 | `src/views/schema-form/form/dialog.vue` |
| 向导步骤 | `src/views/schema-form/form/steps.vue` |
| 富文本（WangEditor） | `src/views/editor/index.vue` |
| Markdown（Vditor） | `src/views/markdown/index.vue` |
| 流程图（LogicFlow） | `src/views/flow-chart/index.vue` |
| 节点编辑（Vue Flow） | `src/views/vue-flow/*` |
| 甘特图 | `src/views/ganttastic/*` |
| 上传组件 | `src/views/components/upload/*` |
| 国际化范式 | `src/plugins/i18n.ts` 与各 view 的 t() 使用 |

### 12.3 引入完整版依赖时的硬规则

- **不要全量复制完整版 `package.json`**（会带来 60+ 演示页用的依赖）；
- 只复制单页用到的依赖（例如要做 Excel 导出 → 才加 `xlsx`）；
- 加依赖前**必须**在本文档 §15 风险清单里 +1 条记录。

---

## 13. AI 开发硬规则（v0.2 重写）

### 13.1 文件改动矩阵

| 文件 / 目录 | AI 可改？ | 备注 |
| --- | --- | --- |
| `src/views/<新业务模块>/` | ✅ 可自由新建 | 必须沿用 §3.13 范式 |
| `src/api/<新业务模块>.ts` | ✅ 可自由新建 | 类型按后端 Swagger |
| `src/store/modules/<新业务模块>.ts` | ✅ 可自由新建 | **命名必须有业务前缀**（如 `srvfTeam.ts`、`uStudioApps.ts`），禁止用 `data.ts`、`state.ts` 等无意义命名；不可改既有 store |
| `src/constants/<业务模块>.ts` 、`src/types/business/` 等业务侧目录 | ✅ 新建 | UI 临时占位常量必须 `*.demo.ts` 命名或文件头注 `TEMPORARY / DEMO`（裁决 6） |
| `src/views/welcome/index.vue` | ✅ 可改占位文案 | 不要改路由名 |
| `src/router/modules/srvf-*.ts` / 业务静态路由 | ✅ 可新建 | meta.roles 用 NestJS 真实角色名 |
| `src/views/dict/* / tenant/* / schedule/* / permission/*` | ⚠️ 改前先评估 | Max-Ts 演示模块；裁决 1：源码保留为参考 |
| `src/router/modules/home.ts / error.ts / remaining.ts` | ⚠️ 仅在新增"绝对静态路由"时追加 | 不要改既有 |
| `mock/**` | ❌ | 业务 mock 禁止新增；仅 `*.demo.ts` 临时占位、且 PR 描述明确"接真 API 后立即删除"时允许（裁决 4）。 |
| `public/platform-config.json` | ⚠️ AI 不得改默认值；改值不改字段 | 由人类决策 |
| `src/components/Re*/` | ❌ 不可改 | 底座组件，要扩展请 wrapper |
| `src/layout/**` | ❌ 不可改源码 | 改动等同破坏整套主题 / 多标签 / keep-alive；扩展用 mitt 事件 / 业务子组件 |
| `src/router/index.ts / utils.ts / asyncRoutes.ts` | ❌ 不可改 | 影响登录、动态路由、白屏防护；asyncRoutes 第一阶段绝对禁用（裁决 2） |
| `src/utils/http/**` | ❌ 不可改（除接 NestJS 时的"一次性适配"由人类拍板） | 改动 = 全局副作用 |
| `src/utils/auth.ts` | ❌ 不可改（除 token 字段适配） | token 主流程 |
| `src/store/modules/user.ts / permission.ts / multiTags.ts / app.ts / settings.ts / epTheme.ts` | ❌ 不可改 | 同上 |
| `src/style/**` | ❌ 不可改 | 主题 / 暗黑 / 侧栏样式核心；Tailwind v4 与 v3 语法差异巨大（§3.11） |
| `src/plugins/elementPlus.ts / echarts.ts` | ❌ 不可改 | 升级才动 |
| `src/main.ts / App.vue / src/config/index.ts` | ❌ 不可改 | 入口与全局配置 |
| `package.json / pnpm-lock.yaml` | ❌ 不可改 | 依赖变更走人类（见 §13.2.1） |
| `vite.config.ts / build/** / tsconfig.json / eslint.config.js / stylelint.config.js / .prettierrc.js / .lintstagedrc / .husky/** / commitlint.config.js` | ❌ 不可改 | 工程级；底座改动必须单独 PR |
| `.env / .env.development / .env.production / .env.staging` | ❌ AI 不得直接改 | 由人类改；AI 也不得在源码中硬编码 `VITE_*` 默认值绕过 |
| `docs/pure-admin-max-ts-baseline.md`（本文件） | ✅ 由人类批准后更新 | 必须保留章节结构 |

### 13.2 底座文件 / 工程文件改动规则

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
  3. **与 vue-pure-admin 上游的对比**（是否会让以后无法 cherry-pick 上游更新）；
  4. **最小变更范围**（行数、影响文件清单）。
- AI 在拿不到这 4 项之前不得动手。

### 13.3 通用硬规则（v0.2）

1. **新页面前必先扫 vue-pure-admin 完整版** + 本项目已有范式（参见 §12.1）。
2. **不得反推后端**：所有字段、枚举、状态、API 路径、错误码以 NestJS Swagger 为准（红线 1~4）。
3. **不得把 mock 当真实接口**；**禁止新增业务 mock**；临时 UI 占位 mock 必须 `*.demo.ts` 命名（裁决 4）。
4. **不得每个页面发明新范式**：优先沿用 `dict / tenant/list / schedule` 的目录范式。
5. **TypeScript**：业务代码（`src/views/srvf*/`、`src/api/srvf*.ts`、`src/store/modules/srvf*.ts`）必须通过 `pnpm typecheck` 且**禁止 `any`**；如需绕过，先输出评估让人类决定（不靠 `// @ts-ignore`、`// eslint-disable` 一笔带过）。
6. **路由 name 与组件 `defineOptions.name` 必须一致**（参见 §5.5）。
7. **i18n 暂不启用**：业务文案直接写中文。**禁止**自行 `pnpm add vue-i18n`、自行启用 i18n 分支。
8. **每次改动后必须跑**：`pnpm lint && pnpm typecheck`，零错误零警告（项目 lint 用 `--max-warnings 0`，禁止 `// eslint-disable` 绕过）；**提交前再跑 `pnpm build`**。
9. **多租户模板不得启用**：`.env: VITE_ENABLE_TENANT=false`；`tenantManagementRouter` 必须隐藏；源码保留（裁决 1）。
10. **asyncRoutes 第一阶段禁止启用**（裁决 2）：不切 import、不补 `getMenuList`、不为前端动态菜单倒逼后端。
11. **演示角色名不得作为正式角色**（§6.6.2）：`admin / common / *:*:* / permission:btn:add` 等仅为演示，接 NestJS 时全量替换。
12. **commit 必须符合 commitlint 规则**（`commitlint.config.js`）；不要用 `--no-verify` 绕过 husky。
13. **不得在源码中硬编码 `VITE_*` 默认值**绕过 `.env`；配置必须读 `.env` 或 `public/platform-config.json`。任何 `import.meta.env.VITE_*` 取值不得在源码侧附带默认值 / fallback；若需默认值，写入 `.env` 并由人类确认。
14. **底座升级走人类**：作者上游有更新时，由人类执行升级合并 PR，AI 不得自行 cherry-pick。

### 13.4 AI 任务接入 8 步 Checklist（每次开工必做）

AI 接到任意前端任务后，**第一件事**是按下面 8 步走，并在 PR / 对话中显式列出每步的结论。跳步等同违反硬规则。

| Step | 动作 | 输出 |
| --- | --- | --- |
| **1** | 读 §0 / §0.5 / §13 / §14 / §16，确认本任务不踩任何红线 | 列出"本任务涉及的红线编号 + 风险等级"；并明确写：本任务是否涉及后端字段 / 表 / API 路径定义？若涉及，逐项列出。 |
| **2** | 用关键词在 `vue-pure-admin/src/views/` 全文搜索相似范式 | 给出参考路径清单（即使没找到也要写"未找到，原因是 X"） |
| **3** | 在 `pure-admin-thin-max-ts/src/views/` 中找最相似的现有范式（dict/tenant/list/schedule/permission/login） | 给出参考路径 + 复用范式说明 |
| **4** | 列出涉及的文件改动清单，每条标注 §13.1 矩阵中的 ✅ / ⚠️ / ❌ | 若含 ❌ → 触发 §13.2.2 单独 PR 流程；含 ⚠️ → 写风险评估 |
| **5** | 列出复用的 `Re*` 组件、`@pureadmin/table`、`ReDialog` 等；列出**不**新增的依赖 | 若需要新依赖 → 暂停等人类批准（§13.2.1） |
| **6** | 列出新增 `src/api/<模块>.ts` 的接口与类型，逐条对照 NestJS Swagger（缺则写"待后端确认"） | 显式说明 mock 边界（裁决 4） |
| **7** | 执行 `pnpm lint && pnpm typecheck`，零错误零警告 | 贴执行结果 |
| **8** | 执行 `pnpm build` 验证产物；若涉及路由 / 菜单 / 权限，跑一遍 `pnpm dev` 自查 | 贴构建结果 + 自查截图 / 描述 |

如果任务很小（如只改一个文案、一个图标），可在 PR 描述里一句话说明"Step 1~6 评估结论：无风险"，但 Step 7~8 仍必须执行。

---

## 14. 第一阶段落地建议（v0.2 重写）

> 第一阶段定义：把 thin-max-ts 改成「SRVF 内部后台的最小可用版」。
>
> **第一阶段最小可用**的边界：
> - ✅ 能用 NestJS 真账号登录、获取真实角色 / 权限；
> - ✅ 侧边栏只显示 SRVF 核心菜单（含组织 / 日历占位）；
> - ✅ 业务列表 / 表单 / 弹窗范式可复用；
> - ✅ 演示模块（dict / tenant / schedule / permission）源码保留但菜单隐藏；
> - ❌ 不要求完整 RBAC / 字典管理 / 角色分配等管理后台页；
> - ❌ 不要求多产品同时启用（先把 SRVF 一个跑通）；
> - ❌ 不要求富文本 / Excel / 流程图等重交互。

### 14.1 必做（按 §17 的 PR 顺序执行）

1. **文档 v0.2 修订**（PR-1，本次）：固化 §0.5 红线、§13 硬规则、§14、§17。
2. **关闭模板污染源**（PR-2）：
   - `.env: VITE_ENABLE_TENANT=false`；
   - `mock/asyncRoutes.ts` 注释 `tenantManagementRouter`（**仅菜单隐藏，源码保留**）；
   - `build/plugins.ts: vitePluginFakeServer({ enableProd: false })`；
   - `vite.config.ts: server.proxy` 加 NestJS 后端代理（如 `/api → http://localhost:3000`）。
3. **本地运行 / 构建验证**（PR-3）：`pnpm install && pnpm dev / build / typecheck / lint` 全绿；自测默认登录通畅。
4. **NestJS 登录对接**（PR-4）：见 §11.3。
5. **SRVF 静态菜单骨架**（PR-5）：建 `src/router/modules/srvf-*.ts`；用真实角色名写 `meta.roles`。
6. **字典页面改造**（PR-6）：菜单隐藏 `dictManagementRouter`；如需 UI 占位用 `*.demo.ts`；不接真接口。
7. **组织架构页面骨架**（PR-7）：建 `src/views/srvf-org/` 占位（裁决 8）。
8. **活动日历 UI 占位**（PR-8）：建 `src/views/srvf-calendar/` 占位（裁决 7）。

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

#### 14.2.3 永不（不在 SRVF / U Studio / U Agents 业务范围）

- 国际化（i18n）；
- 多语言切换 UI；
- 多租户 SaaS 化；
- 前端单元 / e2e 测试体系（如有需要由人类专项立项）；
- 组件库 Storybook。

### 14.3 禁止提前做（任何阶段都不允许"凭前端模板自作主张"）

1. ⛔ 多租户管理启用 / 反推 tenant 表（红线 3、§10.2）；
2. ⛔ 租户套餐菜单 RBAC 反推后端 schema（红线 3 + 红线 4、§10.3）；
3. ⛔ 启用 `src/router/asyncRoutes.ts` / 补 `getMenuList` / 反推菜单管理表（红线 2、§5.2.1、§10.5）；
4. ⛔ 把 `admin / common / *:*:* / permission:btn:add` 当作 SRVF 正式角色名 / 权限 code（红线 4、§6.6.2）；
5. ⛔ 按 mock 字段（`dictId/label/value/status/color`、`packageId/expireTime/contactMobile` 等）反推后端字段（红线 1、红线 2）；
6. ⛔ 前端国际化（i18n）；
7. ⛔ 升级 Vue / Vite / Element Plus / TypeScript 等核心依赖（§13.2.1）；
8. ⛔ 把"三个后台（SRVF / U Studio / U Agents）"同时启动 / 同前端区分菜单（先把 SRVF 一个跑通，多产品策略见 §17）；
9. ⛔ 前端定义 BizCode 体系（后端独立设计）；
10. ⛔ 提前做"前端按钮权限 code 体系"（等后端 RBAC 与 BizCode 落地）。

### 14.4 永不从前端模板反推的事项（裁决 1~4 复盘）

| 事项 | 永不允许反推到后端 | 替代做法 |
| --- | --- | --- |
| 多租户 / 套餐 / 套餐菜单 | tenant 表、package 表、租户菜单 RBAC | 后端单租户；SaaS 化由后端独立立项 |
| 菜单管理（动态路由） | 23 字段菜单表、`MenuData` 结构 | 后端如需菜单 API，自行设计字段 |
| 权限 code | `permission:btn:add` 字符串、`*:*:*` 通配 | 后端 BizCode / Scope 由 NestJS 独立设计 |
| 字典字段 | `dictId/label/value/status/color/sort/remark/createTime` | 后端字典 schema 独立设计 |
| 日历 / 排班字段 | `上午/中午/晚上` 简化模型、事件类型、状态机（draft / published / cancelled 等） | 后端 Activity / Event / Attendance 独立设计 |
| API 路径风格 | `/dict-tree / /tenant-list / /get-async-routes` | 后端 REST 风格由 NestJS 决定 |
| 返回结构 | `{ code: 0, message, data }` 强假设 | 后端返回什么，前端拦截器适配什么 |

---

## 15. 风险清单

| # | 风险 | 来源 | 缓解 |
| --- | --- | --- | --- |
| R1 | 前端模板污染后端设计（多租户 / 套餐 / 字典字段反推） | `views/tenant`、`mock/system.ts` | §11.9 + §13.3.4 硬规则；删 tenant 菜单 |
| R2 | AI 乱改底座（layout / router / http / store） | AI 默认行为 | §13.1 矩阵 + §13.2 强制评估 |
| R3 | mock 误导（生产仍走 mock） | `build/plugins.ts:enableProd=true` | 上线前关 `enableProd` 或卸插件 |
| R4 | 权限只做前端隐藏（v-auth / v-perms） | `src/components/ReAuth`, `RePerms` | 后端最终校验；本文档 §6.7 |
| R5 | 动态路由过早接入（前端展开 menuList） | `src/router/asyncRoutes.ts` | 第一阶段不启用，见 §10、§14.3 |
| R6 | 多租户误启用 | `.env: VITE_ENABLE_TENANT=true` 默认 | 立即改为 false |
| R7 | 国际化误启用 | thin-max-ts 当前无 i18n | 不要随手 `pnpm add vue-i18n` |
| R8 | 页面范式不统一 | 不同 AI 不同写法 | §9.8 范式表 + §13.3.5 |
| R9 | 依赖升级风险（vite 8 / vue 3.5 / tailwind 4 / typescript 6 / eslint 10 / element-plus 2.13） | `package.json` 均为较新版本 | 升级走人类；CI 跑 `lint + typecheck + build` |
| R10 | 从完整版迁移代码时引入不兼容逻辑 | 复制 vue-pure-admin 页面时连组件 + 依赖一起带 | §12.3 硬规则；只复制源码 + 必要依赖 |
| R11 | token 刷新风暴 | `src/utils/http/index.ts` 队列 | 后端 refresh 接口必须稳定，否则全站 logout |
| R12 | 三级菜单 keep-alive 不生效 | `formatTwoStageRoutes` 拍平 | 业务避免依赖三级 keep-alive |
| R13 | 自动收集 `router/modules/**/*.ts` | `import.meta.glob` 包含所有 ts 文件 | 不要在 `router/modules/` 放工具脚本 |
| R14 | `responsive-storage` 命名空间冲突 | `responsivemaxts-` | 业务不要硬编码这个前缀 |
| R15 | `vite-plugin-fake-server: enableProd: true` 在线上仍开 | `build/plugins.ts` | 接真后端前关闭 |

---

## 16. 后续 AI 最小阅读清单（v0.2 分级）

> 按"任意改动 / 相关任务 / 必要时参考"三级。AI 每次开工前，**至少**读 🔴 级。

### 🔴 每次必读（不分任务类型）

1. `pure-admin-thin-max-ts/docs/pure-admin-max-ts-baseline.md`（**本文件**，重点 §0 / §0.5 / §13 / §14 / §17）
2. `pure-admin-thin-max-ts/.env`（确认 `VITE_ENABLE_TENANT` 当前值与 `VITE_HIDE_HOME`）
3. `pure-admin-thin-max-ts/public/platform-config.json`
4. `pure-admin-thin-max-ts/types/router.d.ts`（路由 meta 字段规范）
5. `pure-admin-thin-max-ts/package.json`（确认依赖版本，**禁止**自行更改）

### 🟡 相关任务必读（按任务类型选取）

| 任务类型 | 必读 |
| --- | --- |
| **改路由 / 菜单** | `src/router/index.ts`、`router/utils.ts`、`router/asyncRoutes.ts`、`router/modules/home.ts`、`router/modules/remaining.ts`、`router/modules/error.ts` |
| **改登录 / Token / 接 NestJS** | `src/views/login/index.vue`、`src/api/user.ts`、`src/utils/auth.ts`、`src/utils/http/index.ts`、`src/utils/http/types.d.ts`、`src/store/modules/user.ts`、`mock/login.ts`、`mock/refreshToken.ts` |
| **改权限 / 按钮显隐** | `src/store/modules/permission.ts`、`src/components/ReAuth/src/auth.tsx`、`src/components/RePerms/src/perms.tsx`、`src/directives/auth/index.ts`、`src/directives/perms/index.ts`、`src/utils/auth.ts:hasPerms`、本文件 §6 |
| **新增业务列表 / 表单页** | `src/views/tenant/list/index.vue` + `utils/hook.tsx`、`src/views/dict/index.vue` + `utils/hook.tsx`、`src/components/ReDialog/index.vue`、`src/components/RePureTableBar/src/bar.tsx` |
| **改 layout / 主题** | 谨慎触碰；先读 §3.7 + 本文件 §13.1 矩阵 ❌ 行；如确需修改，先输出 §13.2.2 单独 PR 评估 |
| **改 vite / 构建** | 同上，禁止 AI 自行动手；走 §13.2.1 + §13.2.2 流程 |

### 🟢 必要时参考（视情况查阅）

- `vue-pure-admin/src/views/<对应模块>`（完整版相似页面，§12.2 清单）
- `pure-admin-thin-max-ts/src/main.ts`、`App.vue`、`src/config/index.ts`（全局注册与平台配置加载流程）
- `build/plugins.ts`（构建插件，重点关注 `vitePluginFakeServer.enableProd`）
- `src/style/index.scss` / `src/style/tailwind.css`（样式入口，Tailwind v4 语法差异见 §3.11）
- `vite.config.ts`（仅查阅 `server.proxy` 配置）
- `src/store/modules/multiTags.ts` / `app.ts` / `settings.ts` / `epTheme.ts`（多标签、设备、主题）
- `src/layout/hooks/*`（layout 内部钩子）

---

## 17. 最终结论 + PR 拆分路线（v0.2 重写）

### 17.1 最终结论

- **`pure-admin-thin-max-ts` 适合作为长期后台前端底座**——结构清晰、主流程稳定、可永久同步上游。
- **应该这样用**：
  - 仅在 `src/views/`、`src/api/`、`src/store/modules/`（新模块）里写业务；
  - 通过 vue-pure-admin 完整版查范式，再适配后端契约；
  - 把 NestJS Swagger 当作前端类型与契约的事实来源；
  - 用 §13 矩阵约束 AI 不要碰底座；
  - **每个 PR 只做一件事**（见 §17.2）。
- **不应该这样用**：
  - 不要把 mock 当生产 API；
  - 不要根据 Pure Admin 模板反推后端表结构、不要启用多租户、不要开启动态菜单（红线 1~4）；
  - 不要在没有需求时启用国际化、富文本编辑器等"未来功能"；
  - 不要让 AI 升级依赖或改 vite/eslint 配置（§13.2.1）。
- **本文件本身是"硬约束"**——任何违反规则的行为都应当被立即停下来重新对齐。

### 17.2 PR 拆分路线（第一阶段 8 个 PR）

> 每个 PR 都有「目标」「修改范围」「禁止范围」「DoD（完成判定）」。AI 必须按顺序、独立提 PR，不得合并。

#### PR-1：文档 v0.2 修订

- **目标**：固化 §0.5 红线、§10 / §11 / §13 / §14 / §17 重写、新增 §18 修订记录。
- **修改范围**：仅 `pure-admin-thin-max-ts/docs/pure-admin-max-ts-baseline.md`。
- **禁止范围**：任何业务代码、配置、依赖、`.env`、`README.md`。
- **DoD**：
  - [ ] 本文件 §0.5、§5.2.1、§6.6.2、§10、§11、§13.2.1、§13.4、§14、§17、§18 都按本轮裁决齐备；
  - [ ] git diff 仅触及一份 `.md`；
  - [ ] 已在 PR 描述中链接 5-agent review 汇总。

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
  - `src/utils/auth.ts`：`setToken` 中 `expires` 适配（§7.5）；如后端无 refresh，按 §7.6 降级；
  - `src/utils/http/index.ts`：响应拦截器一次性适配 NestJS 返回结构（**底座文件，按 §13.2.2 单独 PR 评估**）；
  - 必要时改 `mock/login.ts`（标记为 demo 不再调用）；
  - `mock/asyncRoutes.ts` 中角色名：把 `["admin"]` / `["common"]` 替换为 NestJS 真实角色名（或直接删整段 mock 待 PR-5 替换为静态路由）。
- **禁止范围**：禁止启用 `src/router/asyncRoutes.ts`；禁止反向定义后端字段；禁止"为前端方便"要求后端建/改字段（红线 1~4）。
- **DoD**：
  - [ ] 使用 NestJS 真账号能成功登录并跳转首页；
  - [ ] localStorage `user-info` 与 cookie `authorized-token` 字段无误；
  - [ ] 401 / 网络错误时 UI 行为正确（提示 + 不死循环）；
  - [ ] 刷新页面登录态保持；
  - [ ] `pnpm lint && pnpm typecheck && pnpm build` 全绿。

#### PR-5：SRVF 静态菜单骨架

- **目标**：建立 SRVF 第一阶段菜单骨架（首页 / 队伍 / 队员 / 活动日历 / 字典占位 / 系统设置占位 等），完全静态。
- **修改范围**：
  - 新建 `src/router/modules/srvf-*.ts`（如 `srvf-team.ts`、`srvf-member.ts`、`srvf-calendar.ts`）；
  - 新建对应 `src/views/srvf-*/index.vue` 占位页（最低限度可显示标题即可，使用 §9 列表范式骨架）；
  - 改 `src/views/welcome/index.vue` 为 SRVF dashboard 占位（标题、欢迎语，不接入数据）。
- **禁止范围**：禁止启用 `asyncRoutes.ts`；禁止接真 API；禁止硬编码字典 / 角色名；mock 不得新增。
- **DoD**：
  - [ ] 侧边栏显示 SRVF 核心菜单；
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

- **目标**：建立 SRVF 组织架构 UI 骨架。
- **修改范围**：
  - 新建 `src/router/modules/srvf-org.ts`；
  - 新建 `src/views/srvf-org/index.vue` 占位页（参考 vue-pure-admin `src/views/system/dept/` 的**交互范式**，不抄字段）；
  - 不接真接口。
- **禁止范围**：禁止硬编码真实队伍 / 分队 / 岗位字段；禁止设计后端表结构。
- **DoD**：
  - [ ] 菜单显示"组织架构"；
  - [ ] 页面占位可正常加载；
  - [ ] lint / typecheck / build 全绿。

#### PR-8：活动日历 UI 占位（裁决 7）

- **目标**：SRVF 活动 / 训练 / 出勤日历 UI 骨架。
- **修改范围**：
  - 新建 `src/router/modules/srvf-calendar.ts`；
  - 新建 `src/views/srvf-calendar/index.vue`（参考 `src/views/schedule/`，仅 UI 骨架）；
  - 静态数据占位即可，不接 API。
- **禁止范围**：禁止设计活动数据库 schema；禁止定义状态机；禁止反推后端 Activity / Event 模型。
- **DoD**：
  - [ ] 菜单显示"活动日历"；
  - [ ] 页面可显示 Element Calendar；
  - [ ] lint / typecheck / build 全绿。

### 17.3 多产品复用策略（SRVF / U Studio / U Agents）

- **第一阶段推荐**：**每个产品独立克隆一份 `pure-admin-thin-max-ts`**，各自独立 git 仓库，互不影响。
  - 优点：独立升级；独立部署；不互相干扰；可分别决定何时合并上游。
  - 操作：`git clone … srvf-web-admin && cd srvf-web-admin && git remote remove origin && git init`（或保留原 remote 改 fork）；改 `package.json:name`。
- **不推荐方案**：
  - ❌ **monorepo（`apps/srvf / apps/u-studio / apps/u-agents`）**：第一阶段不必引入 monorepo 复杂度。
  - ❌ **同一前端多业务模块（侧边栏区分三个产品）**：会让路由、权限、API 路径互相打架，且违背"单一职责"。
- **当后续真的需要"共享组件 / hooks"时**，再讨论 monorepo + workspace 方案。

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

## 18. Review 修订记录

### 18.1 v0.2（本轮）

**触发**：5-agent 并行 review（事实核查 / 前端架构 / 后端契约边界 / AI 开发规则 / 落地路线）。

#### 18.1.1 本轮 review 关键结论（评分）

| Agent | 维度 | 评分 |
| --- | --- | --- |
| 1 事实核查 | 事实准确度 | 82 / 100 |
| 2 前端架构 | 架构准确度 / 可执行性 / 框架深度 | 88 / 82 / 85 |
| 3 后端契约边界 | 后端契约保护度 | **62 / 100** ⚠ |
| 4 AI 开发规则 | AI 行为约束强度 | **62 / 100** ⚠ |
| 5 落地路线 | 落地可执行性 | **68 / 100** ⚠ |

**核心矛盾**：v0.1 事实和架构准确度合格，但**后端契约边界、AI 约束、落地路线**三块严重欠缺，是 SRVF 这种"AI 驱动、后端先行"模式最关键的部分。本轮聚焦修订这三块。

#### 18.1.2 本轮修订章节清单

| 章节 | 修订类型 | 摘要 |
| --- | --- | --- |
| §0.5 | **新增** | 后端 4 大红线（裁决 1~4） |
| §5.2 | 重写 | 静态/动态路由说明；§5.2.1 asyncRoutes 禁用红线（裁决 2）；§5.2.2 双 whiteList 说明 |
| §5.3 | 小幅补充 | 拍平机制因果："为 keep-alive 二级限制" |
| §6.6.1 | 新增 | 三层权限决策树 |
| §6.6.2 | 新增 | 演示角色名禁作正式角色（裁决 3） |
| §6.7 | 重写 | 升级为 P0 红线（裁决 3） |
| §7.5 | 重写 | NestJS 返回结构 / `expires` 适配步骤 |
| §7.6 | 新增 | refresh token 适配规则（裁决 7：不倒逼后端） |
| §8.5 | 重写 | mock 硬规则（裁决 4） |
| §10 | **整章重写** | 12 个模块逐一标"处理 / 是否影响后端 / 风险 / 建议" |
| §11 | **整章重写** | 强约束 + 业务模块对接状态总览 + 各模块对接规则 |
| §13.1 | 重写 | 文件改动矩阵补 store 命名 / `.env` 硬编码禁止 / mock 新增禁止 / Tailwind v4 警告 |
| §13.2.1 | 新增 | AI 命令权限（禁 `pnpm add/remove/update/clean:cache`，裁决 5） |
| §13.2.2 | 新增 | 底座 / 工程文件改动必须单独 PR |
| §13.3 | 重写 | 14 条通用硬规则 |
| §13.4 | **新增** | AI 任务接入 8 步 Checklist |
| §14 | **整章重写** | 必做 / 暂缓三级 / 禁止提前做 / 永不反推矩阵 |
| §16 | 重写 | 三级分级（🔴/🟡/🟢）阅读清单 |
| §17 | **整章重写** | PR-1 ~ PR-8 拆分路线 + 多产品复用策略 + 第一阶段 DoD 汇总 |
| §18 | **新增** | 本节（Review 修订记录） |

#### 18.1.3 采纳的 review 建议

- ✅ **裁决 1**：多租户用"必须关闭 + 必须隐藏 + 源码保留"，未采纳"第一阶段物理删除"
- ✅ **裁决 2**：asyncRoutes / `getMenuList` / 切 import 全部升级为 P0 红线
- ✅ **裁决 3**：前端 roles / auths / permissions 仅是 UI 显隐 key
- ✅ **裁决 4**：mock 升级为 P0；新业务模块默认禁新增 mock；临时 mock 必须 `*.demo.ts`
- ✅ **裁决 5**：AI 命令权限明文细则
- ✅ **裁决 6**：拒绝把 `src/constants/srvf-dict.ts` 当必做正式字典；只允许 `*.demo.ts` 占位
- ✅ **裁决 7**：活动日历仅 UI 占位，不设计活动模型
- ✅ **裁决 8**：组织架构仅 UI 骨架，不固定字段
- ✅ Agent 1：明确"`getMenuList` 不存在不是 bug、不要补"
- ✅ Agent 1：补 router/modules 加载顺序（home → error → remaining）
- ✅ Agent 2：双 whiteList 说明（§5.2.2）
- ✅ Agent 2：三层权限决策树（§6.6.1）
- ✅ Agent 2：拍平因果（keep-alive 二级限制，§5.3）
- ✅ Agent 2：Tailwind v4 与 v3 语法差异警告
- ✅ Agent 2：`isRefreshing` 单 refresh 多请求队列说明（已在 §6.3 + §7.6 间接补强）
- ✅ Agent 3：所有"反推后端"路径升级为红线（§0.5、§13.3、§14.4）
- ✅ Agent 3：返回结构 / `expires` / `expiresIn` 适配明文（§7.5）
- ✅ Agent 3：拒绝倒逼后端实现 refresh（§7.6）
- ✅ Agent 3：演示角色名生命周期（§6.6.2）
- ✅ Agent 4：AI 命令权限（§13.2.1）
- ✅ Agent 4：底座单独 PR（§13.2.2）
- ✅ Agent 4：硬规则增加"禁止 i18n / 禁止硬编码 VITE_*  / 禁止 `// eslint-disable` 绕过"
- ✅ Agent 4：阅读清单分级（§16）
- ✅ Agent 4：8 步任务接入 checklist（§13.4）
- ✅ Agent 5：PR-1 ~ PR-8 拆分（§17.2）
- ✅ Agent 5：每个 PR 添加 DoD（§17.2 + §17.4）
- ✅ Agent 5：多产品复用推荐多 clone（§17.3）
- ✅ Agent 5：第一阶段 / 二阶段 / 三阶段 / 永不 四级分类（§14.2）

#### 18.1.4 未采纳的 review 建议（明确原因）

| 建议 | 来源 | 未采纳原因 |
| --- | --- | --- |
| **第一阶段物理删除 `src/views/tenant/` 等多租户源码** | Agent 3 | 用户裁决 1 拍板：源码保留作参考；是否物理删除以单独 PR 决策。 |
| **第一阶段建立 `src/constants/srvf-dict.ts` 静态字典常量** | Agent 5 | 用户裁决 6 拍板：正式字典以后端为准；前端不得先硬编码正式字典；UI 占位只能 `*.demo.ts`。 |
| **改 `package.json: name` 为 `srvf-web-admin` 作为 PR-1** | Agent 5 | 多产品复用决定为"独立 clone"（§17.3），改名由 clone 后的独立仓库自行处理，不在 baseline PR-1 范围。 |
| **完整 `vite proxy` 配置示例完全照抄** | Agent 5 | 已给最小示意，具体 path 与 changeOrigin / rewrite 规则等待 NestJS 真实路径确认，避免抄错。 |
| **新增 `eslint.config.js` 放宽规则** | Agent 2（间接） | `--max-warnings 0` 是有意为之，本文档明确要求"改代码满足规则，禁止 disable"。 |
| **直接在 `src/views/welcome/` 放 SRVF 业务数据** | 个别建议 | welcome 占位仅放 dashboard 框架，不放真实业务数据，避免污染（§17.2 PR-5）。 |
| **monorepo 复用方案作为第一阶段** | Agent 5 提及但未推荐 | §17.3 明确不推荐第一阶段引入 monorepo。 |

#### 18.1.5 仍待确认事项（Open Questions）

1. **NestJS 返回结构**：是否 `{ code, message, data }` / `{ data, meta }` / `{ success, data, error }`？由后端确认后才能写 §7.5 的拦截器适配代码。
2. **NestJS 是否有 refresh-token 机制**：决定 §7.6 走"保留"还是"降级"。
3. **NestJS `expires` 字段格式**：日期字符串 / unix ms / `expiresIn` 秒数？决定 `setToken` 改法。
4. **后端真实角色名**：决定 PR-4 / PR-5 中 `mock/asyncRoutes.ts` 与 `src/router/modules/srvf-*.ts` 的 `meta.roles` 写法。
5. **后端 API 路径前缀**：`/api/v1/*`? `/v1/*`? 直接 `/`? 决定 `vite.config.ts: server.proxy` 配置。
6. **NestJS 是否提供 BizCode / 错误码映射表**：决定是否 / 何时建 `src/utils/message.ts` 周围的 `bizCodeToMessage`。
7. **SRVF 组织架构 / 活动模型最终字段**：决定 PR-7 / PR-8 占位页未来如何接真接口。
8. **后端是否提供菜单管理 API**：决定动态菜单（§5.2.1、§10.5）的 long-term 走向，但**第一阶段一律禁用**。
9. **U Studio / U Agents 是否需要独立后端**：决定多产品克隆策略的细节（独立账号体系？独立 NestJS？）。
10. **CI / 部署目标**：是否 Docker、是否反代、是否 Nginx，决定 §17 的扩展节点。

### 18.2 历史版本

| 版本 | 日期 | 作者 | 摘要 |
| --- | --- | --- | --- |
| v0.1 | 初版 | AI（Claude）+ 人类审定 | 建立完整 17 章 baseline 骨架 |
| v0.2 | 本轮 | AI（Claude）按 5-agent review + 8 条人类裁决修订 | 新增 §0.5 / §13.4 / §18；重写 §10 / §11 / §13 / §14 / §17；补充 §5 / §6 / §7 / §8 / §16 |
