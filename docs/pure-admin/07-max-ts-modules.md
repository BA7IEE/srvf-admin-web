# 07 · Max-Ts Modules · 组件 / 页面范式 / Max-Ts 特有能力盘点

## 本文适用任务

- 新增业务列表 / 表单 / 弹窗 / 树形 / 日历页面，先来这里找范式
- 评估某个 Max-Ts 模块（字典 / 租户 / 排班 / 动态路由 / 主题 / 按钮权限演示）在第一阶段如何处理
- 决定是去 vue-pure-admin 完整版抄一份还是从 thin-max-ts 范式起步

## 必须先读

- 主入口 §0.5 后端 4 大红线（特别是不反推后端字段 / 模型）
- `02-ai-rules.md` §13.1 文件改动矩阵（演示模块属 ⚠️，改前先评估）
- `06-mock-risk.md`（裁决 1 / 4：tenant 源码保留但禁启用、mock 禁新增）

## 禁止事项

- ⛔ 禁止**物理删除** Max-Ts 演示模块源码（裁决 1：保留作参考，是否删由后续单独 PR 决策）
- ⛔ 禁止启用多租户运行入口（`VITE_ENABLE_TENANT=true` 视同启用）
- ⛔ 禁止根据 schedule / dict / tenant 演示字段反推后端模型
- ⛔ 禁止"为了发挥 Max-Ts 演示能力"启用 asyncRoutes（详见 `03-router-menu.md` §5.2.1）
- ⛔ 全量复制 vue-pure-admin 完整版的 `package.json`（会带 60+ 演示依赖）

## 相关关键文件路径

- `src/views/welcome / login / error / permission / dict / tenant / schedule`
- `src/components/Re*`、`src/components/RePureTableBar`、`src/components/ReDialog`
- `mock/system.ts`、`mock/asyncRoutes.ts`
- `src/router/asyncRoutes.ts`（禁启用）
- 完整版参考库：`vue-pure-admin/src/views/<对应模块>`

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

| 范式       | thin-max-ts 内                                | vue-pure-admin 完整版补丁                             |
| ---------- | --------------------------------------------- | ----------------------------------------------------- |
| Tabs       | 顶部多标签自带                                | `src/views/components/tabs/*`（演示）                 |
| Drawer     | `el-drawer` 直接用                            | `src/views/schema-form/form/drawer.vue`               |
| Dialog     | `@/components/ReDialog` 函数式                | `src/views/schema-form/form/dialog.vue`               |
| 日历       | `src/views/schedule/` Element Calendar        | 无                                                    |
| 上传       | 无（需自封装）                                | `src/views/components/upload/*`                       |
| 权限按钮   | `Auth / Perms` 组件 + `v-auth / v-perms` 指令 | 同上                                                  |
| 图表       | `ECharts` 已引入但 `main.ts` 默认注释         | `src/views/components/echarts/*`                      |
| Excel 导出 | 无                                            | `src/views/table/high/excel/index.vue`（需要 `xlsx`） |

### 9.8 新页面应优先参考的文件

| 想做的事                | 先看                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| 列表 + 搜索 + 弹窗 CRUD | `src/views/tenant/list/index.vue` + `utils/hook.tsx`                   |
| 树 + 表格联动           | `src/views/dict/index.vue` + `tree.vue`                                |
| 日历 / 时间轴           | `src/views/schedule/index.vue`                                         |
| 按钮权限                | `src/views/permission/button/index.vue` 与 `perms.vue`                 |
| 页面权限                | `src/views/permission/page/index.vue`                                  |
| Element Plus 风格       | `src/views/login/index.vue`                                            |
| 表单校验                | `src/views/login/utils/rule.ts`、`src/views/tenant/list/utils/rule.ts` |

---

## 10. Max-Ts 特有能力盘点

> 每个模块给出：「**第一阶段处理**」、「**是否允许影响后端设计**」、「**风险级别**」、「**处理建议**」。
> 第一阶段处理类目：`启用` / `隐藏保留` / `禁止启用` / `UI 占位`。

### 10.1 字典管理（`src/views/dict/`）

- 路径：`src/views/dict/` + `src/api/system.ts:getDictTree/getDictDetail` + `mock/system.ts:/dict-tree, /dict-detail`
- **第一阶段处理**：`隐藏保留`。菜单暂不挂出，源码作为字典页范式参考；若 UI 临时需要字典枚举，**只能使用 demo/placeholder 命名**（裁决 6）。
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
  - 在 `mock/asyncRoutes.ts` 中**隐藏**（注释或从 `data` 数组移除）`tenantManagementRouter`；
  - `src/views/tenant/*` 源码保留作为参考范式；
  - 是否物理删除 → 后续单独 PR 决策，**第一阶段不要顺手删**。
- **是否允许影响后端设计**：❌ 严禁。后端不是多租户架构，前端启用 / 反推都违反红线 3。
- **风险级别**：🔴 高（最容易污染后端的模块）。
- **处理建议**：第一阶段就把"是否多租户"问题钉死为「单租户」；后续若真需要 SaaS 多组织能力（不在第一阶段范围），由后端先确定模型再回头看此模块。

### 10.3 租户套餐菜单 RBAC（`mock/system.ts:/tenant-package-menu*`）

- **第一阶段处理**：`禁止启用`，随租户管理一同隐藏。
- **是否允许影响后端设计**：❌ 严禁（红线 3 + 红线 4）。
- **风险级别**：🔴 高。
- **处理建议**：连同 §10.2 一起处理。

### 10.4 日历排班（`src/views/schedule/`）

- 路径：`src/views/schedule/` + `mock/asyncRoutes.ts:scheduleRouter`
- **第一阶段处理**：`UI 占位`。可前移为业务"活动 / 训练 / 出勤"日历入口（裁决 7）。
- **是否允许影响后端设计**：❌ 不允许。schedule mock 字段（上午/中午/晚上的简单排班）与真实活动模型差距很大。
- **风险级别**：🟠 中。
- **处理建议**：
  - 可建立 `src/views/<业务>-calendar/`（或参考 schedule 直接改造其内容），仅做**静态 UI 占位**；
  - 不设计真实活动数据库 schema、不定义正式活动状态机；
  - 字段、状态、关系等待 NestJS Activity / Event / Attendance 等真实模型确定后再接入。

### 10.5 前端处理动态路由格式（`src/router/asyncRoutes.ts`，⛔ P0 红线，裁决 2）

- **第一阶段处理**：`禁止启用`。
- **是否允许影响后端设计**：❌ 严禁。`MenuData` 接口的 23 个字段是前端展示需要，不得让后端先建一张超大菜单管理表。
- **风险级别**：🔴 高。
- **处理建议**：详见 `03-router-menu.md` §5.2.1。

### 10.6 按钮 / 页面权限演示（`src/views/permission/`）

- 路径：`src/views/permission/page/`、`src/views/permission/button/`
- **第一阶段处理**：`隐藏保留`。第一阶段用 meta.roles + `<Perms>` 已够。
- **是否允许影响后端设计**：❌ 不允许（红线 4）。
- **风险级别**：🟠 中。
- **处理建议**：作为权限 UI 范式参考，不挂菜单；待后端权限模型稳定后再决定是否需要等价页面。

### 10.7 新款菜单布局（vertical / horizontal / mix / double）

- 路径：`src/layout/components/lay-sidebar/Nav*.vue` + `app.layout`
- **第一阶段处理**：`启用`，默认 `Layout: "double"`（`public/platform-config.json`）。
- **是否允许影响后端设计**：✅ 无关。
- **风险级别**：🟢 低。
- **处理建议**：保留即可。

### 10.8 菜单风格（popular / classic）

- 路径：`MenuStyle: "popular"`；`useDataThemeChange.setMenuStyleVariables` + `src/style/sidebar.scss`
- **第一阶段处理**：`启用`，保留 `popular`。
- **是否允许影响后端设计**：✅ 无关。
- **风险级别**：🟢 低。

### 10.9 页头主题快捷操作（`src/layout/components/lay-setting/`）

- **第一阶段处理**：`启用`。
- **是否允许影响后端设计**：✅ 无关。
- **风险级别**：🟢 低。

### 10.10 `@pureadmin/table` 高级表格 + `RePureTableBar`

- **第一阶段处理**：`启用`。
- **是否允许影响后端设计**：✅ 无关（仅是 UI 组件）；列定义、字段对接以后端为准。
- **风险级别**：🟢 低。

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
  ⑤ 都不行：才允许新创建范式，并把新范式纳入本文件 §9。
```

### 12.2 完整版"最值得参考的清单"

> 路径都是 `vue-pure-admin/...`

| 想要做的事                      | 直接看                                      |
| ------------------------------- | ------------------------------------------- |
| 用户管理（含分配角色）          | `src/views/system/user/index.vue`           |
| 角色管理（含菜单权限分配）      | `src/views/system/role/index.vue`           |
| 菜单管理（树 + 表单）           | `src/views/system/menu/index.vue`           |
| 部门树（组织架构）              | `src/views/system/dept/index.vue`           |
| 系统日志 + 详情页               | `src/views/monitor/logs/system/index.vue`   |
| 在线用户                        | `src/views/monitor/online/index.vue`        |
| 表格基础                        | `src/views/table/base/*`                    |
| 表格高级（拖拽 / Excel / 打印） | `src/views/table/high/*`                    |
| 虚拟滚动表格                    | `src/views/table/virtual/*`                 |
| Schema Form                     | `src/views/schema-form/form/base.vue`       |
| 抽屉表单                        | `src/views/schema-form/form/drawer.vue`     |
| 对话框表单                      | `src/views/schema-form/form/dialog.vue`     |
| 向导步骤                        | `src/views/schema-form/form/steps.vue`      |
| 富文本（WangEditor）            | `src/views/editor/index.vue`                |
| Markdown（Vditor）              | `src/views/markdown/index.vue`              |
| 流程图（LogicFlow）             | `src/views/flow-chart/index.vue`            |
| 节点编辑（Vue Flow）            | `src/views/vue-flow/*`                      |
| 甘特图                          | `src/views/ganttastic/*`                    |
| 上传组件                        | `src/views/components/upload/*`             |
| 国际化范式                      | `src/plugins/i18n.ts` 与各 view 的 t() 使用 |

### 12.3 引入完整版依赖时的硬规则

- **不要全量复制完整版 `package.json`**（会带来 60+ 演示页用的依赖）；
- 只复制单页用到的依赖（例如要做 Excel 导出 → 才加 `xlsx`）；
- 加依赖前**必须**走 `02-ai-rules.md` §13.2.1（人类执行 `pnpm add`）+ §13.2.2（单独 PR 评估）。

---

## 12.4 Full Version Reference Strategy（完整版参考策略）

> 本节是 `CLAUDE.md` §9 + `README.md` "完整版参考库"小节的**操作展开**。所有派生业务项目（`srvf-admin-web` / `u-studio-admin-web` / `token-admin-web` / `health-admin-web`）使用本地完整版前必须遵守。

### 12.4.1 完整版路径

`/Users/dengwang/Documents/coding/SRVF-web-admin参考/vue-pure-admin`

- 这是**开源 vue-pure-admin 完整版**（与 Pure Admin Max-Ts 同一作者，但功能更完整：60+ 演示页）；
- 在本机以**只读参考库**身份长期存在；
- 不是 git 工作区，不要往该目录写文件 / 提交 / 跑 install 命令。

### 12.4.2 参考前必须做的只读扫描

每次想从完整版"借鉴"某个页面 / 组件前，先用只读命令侦查：

```bash
# 1. 关键字搜索（找候选页面）
grep -rln "el-tree\|PureTable\|ReDialog" /Users/dengwang/Documents/coding/SRVF-web-admin参考/vue-pure-admin/src/views | head

# 2. 列出对应目录结构（看交互范式）
find /Users/dengwang/Documents/coding/SRVF-web-admin参考/vue-pure-admin/src/views/<候选模块>/ -type f

# 3. 读单个文件（只看交互结构，不照搬接口）
head -100 /Users/dengwang/Documents/coding/SRVF-web-admin参考/vue-pure-admin/src/views/<候选模块>/index.vue
```

⛔ 禁止 `cp -R` 整段复制；必须**手敲重写**，因为字段 / API / 角色 / 权限都要换。

### 12.4.3 参考目标 vs 禁止目标

| 维度      | ✅ 参考目标                                                                         | ⛔ 禁止目标                                                    |
| --------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 页面结构  | 模板拆分（`index.vue` / `utils/hook.tsx` / `form/index.vue`）；列定义；表单字段顺序 | 字段命名直接照抄                                               |
| 组件组合  | `<PureTable>` / `<ReDialog>` / `addDialog` / `<Auth>` / `<Perms>` 用法              | 引入完整版自定义组件（如 `ProTable` 等业务级组件）             |
| UI 交互   | 搜索栏 / 分页 / 弹窗开关 / 树+表格联动 / 抽屉表单                                   | 业务流转（如完整版的"角色分配菜单流程"作为业务需求）           |
| 路由 meta | `meta.icon` / `meta.rank` / `meta.title` / `meta.transition` 的写法                 | 完整版的 `meta.auths` 字符串（演示用）                         |
| 接口      | 不可参考                                                                            | 完整版 `src/api/*` 全部是演示接口，**不可作为后端契约**        |
| Mock      | 不可参考                                                                            | 完整版 `mock/*` 全部是演示数据，**不可作为业务真相**           |
| 权限      | 不可参考                                                                            | 完整版 RBAC / 按钮 code 体系（红线 4）                         |
| 多租户    | 不可参考                                                                            | 完整版 tenant / package / package-menu 模型（红线 3）          |
| 动态菜单  | 不可参考                                                                            | 完整版 asyncRoutes / `getMenuList` / `MenuData` 实现（裁决 2） |
| 业务字段  | 不可参考                                                                            | 完整版 dict / dept / activity 字段命名（红线 1）               |
| 国际化    | 不在第一阶段启用                                                                    | 完整版 i18n 体系（`02-ai-rules.md §13.3 第 7 条`）             |

### 12.4.4 PR-5 ~ PR-8 中如何安全使用完整版

#### PR-5 静态业务菜单骨架

**可参考**：

- `vue-pure-admin/src/router/modules/*.ts` 的**写法**（如何用 `meta.icon` / `meta.rank` / `redirect` / `children`）；
- `vue-pure-admin/src/views/<某模块>/index.vue` 的**目录范式**（`index.vue` + `utils/hook.tsx` + `form/`）。

**禁止**：

- 把完整版的 `mock/asyncRoutes.ts` 字段当后端菜单管理接口模型；
- 把完整版的菜单**名字**作为业务菜单名（如完整版的"角色管理 / 系统监控"不一定是 SRVF 需要的）；
- 启用 asyncRoutes（裁决 2，**永远禁止**）。

#### PR-6 字典页面改造

**可参考**：

- `vue-pure-admin/src/views/system/dict/*`（如有）或类似字典 UI 的页面**交互结构**（左侧树 + 右侧表格 + 弹窗）；
- `<el-tree>` + `<PureTable>` + `addDialog` 的组合方式。

**禁止**：

- 复制完整版字典字段命名（`dictId / dictType / label / value / sort / color / status` 等仅是演示）；
- 把完整版字典 API（`/dict-tree` / `/dict-detail`）当 NestJS 真实接口；
- 用完整版字典演示作为"业务需要做字典管理"的依据——业务是否需要字典由产品 / 后端决定，不由前端模板决定。

#### PR-7 组织架构页面骨架

**可参考**：

- `vue-pure-admin/src/views/system/dept/*` 的**交互范式**（树形组织 + 详情面板 + 编辑弹窗）；
- `@/utils/tree.ts:handleTree(data, "id", "parentId", "children")` 的一维转树用法。

**禁止**：

- 复制完整版部门字段（如 `deptName / leader / parentId / sort / status`）——后端模型由 NestJS 独立设计（裁决 8）；
- 在前端硬编码"队伍 → 分队 → 队员"层级假设；
- 把完整版的"多租户 + 多部门"双层级带进派生项目。

#### PR-8 活动日历 UI 占位

**可参考**：

- Pure Admin 自带 `src/views/schedule/`（Max-Ts 已携带）的 Element Calendar 用法；
- 完整版若有更高级的日历 / 甘特，仅作交互参考。

**禁止**：

- 复制完整版排班 / 日历的字段（`上午/中午/晚上` / `工号` 等）；
- 设计活动 schema / 状态机（`draft / published / cancelled` 等）（裁决 7）；
- 硬编码任何业务活动数据。

### 12.4.5 完整版与上游 Pure Admin Max-Ts 的区别（避免混淆）

| 维度                                        | Pure Admin Max-Ts（上游母版）                                                                           | vue-pure-admin（完整版参考）                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 路径                                        | `/Users/dengwang/Documents/coding/SRVF-web-admin参考/pure-admin-thin-max-ts`（**付费私有，purchased**） | `/Users/dengwang/Documents/coding/SRVF-web-admin参考/vue-pure-admin`（**开源**） |
| 与 starter 关系                             | starter 直接派生（仍可 cherry-pick 升级）                                                               | 仅作 UI 范式只读参考                                                             |
| 同步策略                                    | 参见 `11-upstream-sync.md` §11-2.1                                                                      | 不同步，只读                                                                     |
| 可参考代码                                  | 整套（仅 starter 自身）                                                                                 | 仅 UI / 组件 / 页面范式                                                          |
| API / mock / RBAC / tenant / dynamic routes | 不能反推后端                                                                                            | **更不能**反推后端（红线 1~4）                                                   |

### 12.4.6 完整版作为参考的"最值得抄"清单

> 与上方 §12.2 重复，但**强调**只抄交互范式，不抄字段 / 接口 / 权限。

| 想做的事                    | 完整版路径                       | 抄什么                       | 不抄什么                      |
| --------------------------- | -------------------------------- | ---------------------------- | ----------------------------- |
| 用户管理                    | `src/views/system/user/`         | 列表 + 弹窗 + 角色分配 UI 流 | 字段、API、权限 code          |
| 角色管理                    | `src/views/system/role/`         | 角色 + 菜单分配交互          | RBAC 模型、code 体系          |
| 菜单管理                    | `src/views/system/menu/`         | 树 + 表单 UI                 | `MenuData` 23 字段（红线 2）  |
| 部门 / 组织                 | `src/views/system/dept/`         | 树形组织 UI                  | 字段、层级假设                |
| 日志 / 监控                 | `src/views/monitor/logs/system/` | 列表 + 详情抽屉              | 日志字段、查询字段            |
| 上传组件                    | `src/views/components/upload/`   | 上传交互 + 拖拽              | 后端附件 schema               |
| 表格高级                    | `src/views/table/high/*`         | 拖拽 / Excel / 打印交互      | 依赖（`xlsx` 等需单独 PR 加） |
| Schema Form / 抽屉 / 对话框 | `src/views/schema-form/form/*`   | 表单组合方式                 | 业务字段命名                  |
