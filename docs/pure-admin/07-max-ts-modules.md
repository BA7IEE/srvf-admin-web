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
- 加依赖前**必须**走 `02-ai-rules.md` §13.2.1（人类执行 `pnpm add`）+ §13.2.2（单独 PR 评估）。
