# SRVF Static Menu Skeleton Plan

> **📦 SUPERSEDED（2026-07-06 标注）**：本方案是后端 v0.10.0 时代的 PR-5-A 产物，已被实际落地超越——7 组任务式 IA 于 2026-06-28 起上线并全部接真 API，§1 前提中「PR-4 暂停 / 只做占位 / 契约未就绪」均已失效。现行 IA 与下一步见 `docs/srvf-admin-vnext-blueprint.md` §5。本文仅作历史参考。

> **版本**：v0.2（基于 srvf-admin-web HEAD `39056fc` + srvf-nest-api HEAD `fc8241d` 的只读调研重写）
> 本文档为 **PR-5-A**（方案）成果，后续 **PR-5-B**（落地实现）必须严格以本文档为边界。
> 本轮**只写方案、不写代码**；调研结论以"当前事实"为准，不预判任何尚未确认的后端契约。

---

## 0. 调研基线（Snapshot）

| 维度            | 值                                                                                |
| --------------- | --------------------------------------------------------------------------------- |
| 前端仓 HEAD     | `39056fc` `docs: add full version reference rules`                                |
| 前端工作树      | clean（仅本文档 untracked）                                                       |
| 后端仓 HEAD     | `fc8241d` `chore(storage): extend StorageProvider interface for C-7.5 v1.0 (#86)` |
| 后端工作树      | clean                                                                             |
| 后端版本        | `0.10.0`（v0.10.0 段已收 attachments 主模块；C-7.5 Provider 实装挂起）            |
| 后端总 API 端点 | 131（v1 14 + V2 79 + RBAC 16 + attachments 22）                                   |
| 完整版参考库    | 仅作 UI 范式只读，不参与菜单决策（见 §4）                                         |

> 后端 v0.10.0 状态权威来源：`srvf-nest-api/docs/handoff/v0.10.0.md`。

---

## 1. Current Preconditions

- **PR-4 NestJS 登录对接暂停。** 详见 `docs/srvf-api-contract-readiness.md` §3。10 项 readiness checklist + 人类显式批准前不得重启。
- **后端 API contract readiness 未完成。** refresh-token 不支持 / 业务模块全面 RBAC 接入仍待后续批次 / Provider 实装挂起 / 401-429 UX / RBAC 内置 ADMIN 角色未拍板等仍在进行中。
- **PR-5 只做静态菜单与占位页。** 仅注册前端静态路由 + layout-only 页面骨架，不调任何 axios，不消费 Pinia user store 的角色字段做真权限判定。
- **不定义正式业务字段。** 字段、枚举、状态机以后端 Prisma schema + Swagger 为准（红线 1）。
- **不设计后端权限模型。** RBAC 由后端拍板（红线 4）；`meta.roles` 仅作 sidebar 静态显隐占位。
- **不设计活动状态机。** 活动 / 考勤 / 报名 / 证书状态字典由后端 `dictionaries` + service 层定义（裁决 7、参见 Prisma `Activity.statusCode`、`AttendanceSheet.statusCode`、`Certificate.certStatusCode` 等均为字典 code）。
- **所有业务含义均为 placeholder。** 占位页需显眼标注"占位"字样。

---

## 2. 前端当前代码核对结果

### 2.1 现有静态路由模块

`src/router/modules/` 共 3 个文件：

| 文件           | 关键字段                                                                                                            | 备注                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `home.ts`      | `path: "/"`, `name: "Home"`, `redirect: "/welcome"`, `meta.icon: "ep/home-filled"`, `meta.rank: 0`, child `Welcome` | `rank: 0` 直接写字面量（与完整版用 `enums.ts` 抽离不同） |
| `error.ts`     | `path: "/error"`, `redirect: "/error/403"`, `meta.icon: "ri/information-line"`, `meta.rank: 9`                      | 含 403/404/500 子路由                                    |
| `remaining.ts` | 数组导出，含 `/login` `/access-denied` `/server-error` `/redirect/:path`                                            | `showLink: false` 全部不在菜单                           |

→ **前端事实 A**：本仓库**未引入** `enums.ts`，`rank` 字段直接写数字字面量。PR-5-B 沿用此风格（不引入 enums 抽离）。

### 2.2 `types/router.d.ts:CustomizeRouteMeta` 字段（必读）

确认 meta 支持：`title`（必填）/ `icon` / `extraIcon` / `showLink` / `showParent` / `roles` / `auths` / `keepAlive` / `frameSrc` / `frameLoading` / `transition` / `hiddenTag` / `fixedTag` / `dynamicLevel` / `activePath` / `loaded`（内部用）。`rank` **只在 `RouteConfigsTable.meta` 顶层有效**，对子路由无效。

→ **前端事实 B**：PR-5-B 写法严格按此类型，**不**给子菜单写 `rank`，**不**写 `loaded`。

### 2.3 `Layout` 与 `component` 导入方式

`home.ts:2` 用 `const Layout = () => import("@/layout/index.vue");` —— 顶层路由用 `Layout`，子路由用 `() => import("@/views/...")`。

→ **前端事实 C**：PR-5-B `srvf.ts` 顶层走 Layout，子路由走 `@/views/srvf/<page>/index.vue` 动态 import。

### 2.4 Welcome 页面当前状态

`src/views/welcome/index.vue` 只有 19 行：`<h1>Max-Ts（非国际化版本）</h1>` + `<el-link>` 介绍链接。`defineOptions({ name: "Welcome" })`。

→ **前端事实 D**：welcome 当前内容是 Pure Admin Max-Ts demo 文案，与 SRVF 业务无关。`02-ai-rules.md §13.1` 矩阵明确"`src/views/welcome/index.vue` ✅ 可改占位文案"。PR-5-B 可直接**替换**为 SRVF dashboard 占位（不必"追加"），但**不得**改 `defineOptions.name` 与路由 name `Welcome`。

### 2.5 `src/views/` 已有目录

`dict/ error/ login/ permission/ schedule/ tenant/ welcome/` —— 全是 starter 继承的 Max-Ts demo。

- `dict/`：字典 demo 页（裁决 6：源码保留作范式参考，菜单已隐藏）
- `tenant/`：多租户 demo（裁决 1：源码保留，永久禁启用；`tenantManagementRouter` 已 `_` 重命名隐藏）
- `permission/`：按钮/页面权限 demo（v0.1 mock 演示）
- `schedule/`：Element Calendar 排班 demo（裁决 7：可作日历 UI 范式参考）

→ **前端事实 E**：这些目录仅"参考"，**不**直接复用——SRVF 业务页面必须新建在 `src/views/srvf/` 下，避免与 demo 命名/路由名冲突。

### 2.6 哪些只能参考，不能直接复用

| 目录                     | 参考                                   | 不能复用什么                                                                                                                   |
| ------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/views/dict/`        | 树+表格联动结构、`utils/hook.tsx` 范式 | mock 字段 `dictId / label / value / status / color / sort / remark / createTime`（与后端 `DictType / DictItem` schema 不一致） |
| `src/views/tenant/list/` | 表格+搜索+弹窗范式                     | tenant 模型（永久禁用）                                                                                                        |
| `src/views/permission/`  | `<Auth>` `<Perms>` 组件用法            | mock role `admin / common`、权限 code `permission:btn:add`、`*:*:*`                                                            |
| `src/views/schedule/`    | Element Calendar 用法                  | 排班字段 `上午/中午/晚上 / 工号`（与后端 `Activity / AttendanceRecord` schema 完全不同）                                       |

PR-5-B 占位页**不**引入上述 demo 页面的 hook / utils / form 子模块。

---

## 3. 后端项目只读调研摘要

### 3.1 后端模块清单（`srvf-nest-api/src/modules/`）

按 controller 文件数排序：

| Module                   | controller 数 | 端点数 | 主要 `@Controller(...)` 路径                                                                              |
| ------------------------ | ------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| `auth`                   | 1             | 1      | `auth`                                                                                                    |
| `users`                  | 1             | 10     | `users`                                                                                                   |
| `dictionaries`           | 1（双 class） | 13     | `v2/dict-types` + `v2/dict-items`                                                                         |
| `organizations`          | 1             | 7      | `v2/organizations`                                                                                        |
| `members`                | 1             | 6      | `v2/members`                                                                                              |
| `member-profiles`        | 1             | 3      | `v2/members/:memberId/profile`                                                                            |
| `member-departments`     | 1             | 3      | `v2/members/:memberId/department`                                                                         |
| `emergency-contacts`     | 1             | 4      | `v2/members/:memberId/emergency-contacts`                                                                 |
| `certificates`           | 1             | 9      | `v2/members/:memberId/certificates`                                                                       |
| `activities`             | 1             | 7      | `v2/activities`                                                                                           |
| `activity-registrations` | 2             | 10     | `v2/activities/:activityId/registrations` + `v2/users/me`                                                 |
| `attendances`            | 3             | 11     | `v2/activities/:activityId/attendance-sheets` + `v2/attendance-sheets` + `v2/users/me/attendance-records` |
| `contribution-rules`     | 1             | 5      | `v2/contribution-rules`                                                                                   |
| `audit-logs`             | 1             | 2      | `v2/audit-logs`                                                                                           |
| `attachments`            | 1             | 7      | `v2/attachments`                                                                                          |
| `attachment-configs`     | 3             | 17     | `v2/attachment-type-configs` + `v2/attachment-mime-configs` + `v2/attachment-size-limit-configs`          |
| `permissions`（RBAC）    | 5             | 16     | `v2/permissions` + `v2/roles` + `v2/roles/:id/permissions` + `v2/users/:userId/roles` + `v2/rbac`         |
| `health`                 | 1             | 3      | `health`                                                                                                  |
| `ai`                     | —             | 0      | 仅 `README.md`，无业务代码                                                                                |

合计 **131 个端点**（`/api/...` 前缀）。

### 3.2 Prisma model 清单

V2 第一阶段 + V2.x 增量已落地 model：`User / Role(enum) / UserStatus(enum) / DictType / DictTypeStatus(enum) / DictItem / DictItemStatus(enum) / Organization / OrganizationStatus(enum) / Member / MemberStatus(enum) / MemberDepartment / MemberProfile / EmergencyContact / Certificate / Activity / ActivityRegistration / AttendanceSheet / AttendanceRecord / ContributionRule / ContributionRuleStatus(enum) / AuditLog / RbacRole / Permission / RolePermission / UserRole / Attachment / AttachmentAccessLevel(enum) / AttachmentTypeConfig / AttachmentTypeConfigStatus(enum) / AttachmentMimeConfig / AttachmentMimeConfigStatus(enum) / AttachmentSizeLimitConfig`。

### 3.3 关键状态机（**前端不得反推/复刻**）

| Model 字段                              | 取值来源                                                                          | 备注                      |
| --------------------------------------- | --------------------------------------------------------------------------------- | ------------------------- |
| `Activity.statusCode`                   | `dictionaries.activity_status`                                                    | 由后端字典 + service 维护 |
| `ActivityRegistration.statusCode`       | `dictionaries.registration_status`（4 态：`pending / pass / reject / cancelled`） | schema 不固化             |
| `AttendanceSheet.statusCode`            | 3→5 态（含 APD 终审 `pending_final_review / approved / final_rejected`）          | service 维护              |
| `AttendanceRecord.attendanceStatusCode` | 3 态 `present / late / early_leave`                                               | 字典                      |
| `AttendanceRecord.roleCode`             | 7 项扁平字典                                                                      | 字典                      |
| `Certificate.certStatusCode`            | 4 态闭集 `pending / verified / expired / rejected`                                | 字典                      |
| `Role(enum)`                            | `SUPER_ADMIN / ADMIN / USER`（v1 永久）                                           | enum，永不变（A-4）       |

→ **后端事实 F**：上述状态机由后端 Prisma + service + dictionaries 定义；前端 PR-5-B 占位页 **不复刻、不展示具体取值**。

### 3.4 后端不稳定 / 挂起项

| 项                            | 状态                                                                                                                | 影响前端 PR-5-B                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Provider 实装**（C-7.5）    | 挂起（HEAD `fc8241d` 即"扩展 StorageProvider 接口 v1.0"）；`attachments` 主模块已 land 但 `accessUrl` 占位恒返 null | 附件**不上独立顶级菜单**；附件交互留待 Provider 接通后由独立 PR 接入到队员/证书/活动详情页 |
| **业务模块全面 RBAC 接入**    | 79 个 V2 接口仍 `@Roles(SUPER_ADMIN, ADMIN)` 未接 `rbac.can()`；attachments 是首个范例                              | 前端 PR-5-B `meta.roles` 仅作 sidebar 显隐占位，不消费 RBAC `permissions[]`                |
| **ADMIN 内置角色**            | Q12 挂起                                                                                                            | 前端不预设业务级 ADMIN-only 菜单分支                                                       |
| **AI 模块**                   | 仅 `src/modules/ai/README.md`                                                                                       | 不在 PR-5-B 菜单中体现                                                                     |
| **培训 / 装备 / 财务 / 通知** | BizCode 段位 `240xx-290xx` 仍未规划任何 module                                                                      | **前端不预先建培训/证书等独立菜单**——证书已并入队员主线                                    |
| **审计 `audit-logs`**         | 仅 2 端点（read；写入由各业务模块 fail-fast 写入；不审 audit 自身）                                                 | 前端 placeholder 占位允许，仅 SUPER_ADMIN 可见提示                                         |

---

## 4. Full Version Reference Notes（降低决策权重）

完整版位于 `<refs-root>/vue-pure-admin`（占位符见 `docs/external-refs.md`）。本 PR 已扫描：

- `src/router/modules/`（24 个静态模块文件）
- `src/views/`（多个顶级目录：`system/dept`、`system/role`、`system/user`、`monitor/logs` 等）
- `src/router/enums.ts`（rank 编号约定）

**决策原则**：完整版**仅作 UI / 组件 / 页面范式只读参考**。**菜单本身不由完整版决定**——SRVF 菜单由 §3 后端事实 + SRVF 第一阶段基础数据底座驱动。

允许参考的方向（仅 PR-5-B 实施期遇到具体范式问题时按需扫）：

- `src/views/system/dept/`：树形组织 UI（PR-7 可参考，不抄字段）
- `src/views/system/user/`：列表 + 弹窗 + 角色分配 UI（PR-5-B 不抄字段，不抄 API）
- `src/views/monitor/logs/system/`：列表 + 详情抽屉 UI（审计日志参考）

禁止反推（与 `CLAUDE.md §9` + `07-max-ts-modules.md §12.4.3` 一致）：

- ⛔ 不复制完整版字段 / API / mock；
- ⛔ 不复制完整版 RBAC code 体系；
- ⛔ 不把完整版菜单当 SRVF 业务需求（"完整版有 X 所以我们也做"是错的）；
- ⛔ 不修改完整版（read-only）。

---

## 5. 后端事实来源表（菜单决策依据）

| 业务域                | 后端证据（路径 + 端点数）                                                                                                                             | 当前成熟度                                                    | 是否适合 PR-5-B 菜单占位                                                                      | 理由                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 仪表盘                | （前端层占位；不依赖后端模块）                                                                                                                        | n/a                                                           | ✅ 上                                                                                         | SRVF 工作台入口，placeholder dashboard                                   |
| **字典**              | `dictionaries.controller.ts` 13 端点 + Prisma `DictType / DictItem` 双表                                                                              | ✅ 已有 API                                                   | ✅ 上                                                                                         | 后端 V2 第一阶段核心；前端 placeholder 一个空表格说明"接 Swagger 后接入" |
| **组织**              | `organizations.controller.ts` 7 端点 + Prisma `Organization`（树）                                                                                    | ✅ 已有 API                                                   | ✅ 上                                                                                         | V2 第一阶段核心 + 裁决 8（前端不设计层级假设）                           |
| **队员**              | `members.controller.ts` 6 + `member-profiles.controller.ts` 3 + `member-departments.controller.ts` 3 + `emergency-contacts.controller.ts` 4 = 16 端点 | ✅ 已有 API                                                   | ✅ 上                                                                                         | 第一阶段人员底座闭环                                                     |
| **证书**              | `certificates.controller.ts` 9 端点 + Prisma `Certificate`（4 态状态机由后端字典）                                                                    | ✅ 已有 API                                                   | ✅ 上（**作为"队员"分组内子菜单**，不独立顶级）                                               | 与队员强耦合（`/v2/members/:memberId/certificates`）                     |
| **活动**              | `activities.controller.ts` 7 端点 + Prisma `Activity`                                                                                                 | ✅ 已有 API                                                   | ✅ 上                                                                                         | V2 批次 3                                                                |
| **活动报名**          | `activity-registrations.controller.ts` 10 端点 + Prisma `ActivityRegistration`（4 态）                                                                | ✅ 已有 API                                                   | ✅ 上（**作为"活动"分组内子菜单**）                                                           | 与活动强耦合                                                             |
| **考勤**              | `attendances.controller.ts` 11 端点 + Prisma `AttendanceSheet` + `AttendanceRecord` + APD 终审字段                                                    | ✅ 已有 API                                                   | ✅ 上（**作为"活动"分组内子菜单**）                                                           | 与活动强耦合                                                             |
| **贡献值规则**        | `contribution-rules.controller.ts` 5 端点 + Prisma `ContributionRule`                                                                                 | ✅ 已有 API（5-A 已实装）                                     | ✅ 上（**作为"基础数据"分组内子菜单**）                                                       | 运营后台规则维护，SUPER_ADMIN/ADMIN 用                                   |
| **审计日志**          | `audit-logs.controller.ts` 2 端点（read） + Prisma `AuditLog`（不可改不可删 A-1）                                                                     | ✅ 已有 API（read-only）                                      | ✅ 上（**作为"系统"分组内子菜单**）                                                           | 只 SUPER_ADMIN 可见，placeholder 提示                                    |
| **附件**              | `attachments.controller.ts` 7 + `attachment-configs.controller.ts` 17 = 24 端点；**Provider 实装挂起，accessUrl 占位 null**                           | ⚠️ schema + 接口 / Provider 未通                              | ⚠️ **不独立顶级菜单**（PR-5-B 不上；Provider 实装后由独立 PR 接入到队员/证书/活动详情子模块） | 业务上是"嵌入式资源"非"独立管理域"                                       |
| **用户管理**          | `users.controller.ts` 10 端点（admin CRUD + me + role + status + password）                                                                           | ✅ 已有 API                                                   | ⚠️ **作为"系统"分组内 placeholder**（PR-5-B 不接 API；与 PR-4 + RBAC v2 readiness 同步）      | SUPER_ADMIN/ADMIN 操作，前端等 PR-4                                      |
| **RBAC（角色/权限）** | `permissions / rbac-roles / role-permissions / user-roles / rbac` 共 16 端点 + Prisma `RbacRole / Permission / RolePermission / UserRole`             | ✅ 已有 schema + CRUD API；业务模块全面 RBAC 接入仍待后续批次 | ⚠️ **作为"系统"分组内 placeholder**（PR-5-B 不接，等 PR-4 + RBAC v2 readiness）               | 红线 4：前端不定义 RBAC 模型                                             |
| 培训记录              | 后端**无** `training` module；BizCode 段位 `240xx-290xx` 未规划                                                                                       | ❌ 未发现证据                                                 | ❌ **不上**（v0.1 已删）                                                                      | 不预判业务                                                               |
| 装备 / 仓库 / 车辆    | 后端**无**对应 module                                                                                                                                 | ❌ 未发现证据                                                 | ❌ **不上**                                                                                   | `research.md` 显式 `[暂不做]`                                            |
| 财务 / 通知           | 后端**无**对应 module                                                                                                                                 | ❌ 未发现证据                                                 | ❌ **不上**                                                                                   | 未规划                                                                   |
| 多租户                | 后端**无**                                                                                                                                            | ❌（前端 demo 已永久禁用）                                    | ❌ **不上**                                                                                   | 裁决 1 + 红线 3                                                          |
| 动态菜单管理          | 后端**无**（A-1 / 裁决 2）                                                                                                                            | ❌                                                            | ❌ **永远不上**                                                                               | 红线 2                                                                   |

---

## 6. PR-5-B 菜单策略：从 v0.1 的 9 个**收敛**到「**4 容器 + 11 叶子**」

### 6.1 推荐菜单结构

```
首页 (Welcome,            rank: 0,  已存在)
├─ (无子菜单,welcome 占位 SRVF dashboard)

SRVF · 基础数据 (rank: 10)
├─ 字典管理 (SrvfDictionaries)            ← 后端 dictionaries 13 端点
├─ 组织架构 (SrvfOrganizations)           ← 后端 organizations 7 端点
└─ 贡献值规则 (SrvfContributionRules)     ← 后端 contribution-rules 5 端点

SRVF · 队员 (rank: 11)
├─ 队员列表 (SrvfMembers)                 ← 后端 members 6 端点
└─ 证书 (SrvfCertificates)                ← 后端 certificates 9 端点

SRVF · 活动 (rank: 12)
├─ 活动列表 (SrvfActivities)              ← 后端 activities 7 端点
├─ 报名记录 (SrvfRegistrations)           ← 后端 activity-registrations 10 端点
└─ 考勤管理 (SrvfAttendances)             ← 后端 attendances 11 端点

SRVF · 系统 (rank: 13)
├─ 用户管理 (SrvfUsers)                   ← 后端 users 10 端点 (placeholder, 等 PR-4)
├─ 角色权限 (SrvfRbac)                    ← 后端 RBAC 16 端点 (placeholder, 等 PR-4 + RBAC v2)
└─ 审计日志 (SrvfAuditLogs)               ← 后端 audit-logs 2 端点 read-only

异常页面 (Error,          rank: 9,  已存在)
```

→ **总计**：4 个新顶级容器（base-data / members / activities / system）+ 11 个叶子页 = 11 个新 `src/views/srvf/<page>/index.vue`。

### 6.2 与 v0.1 的差异对照

| v0.1 章节                                | v0.2 处理                                           | 理由                                                 |
| ---------------------------------------- | --------------------------------------------------- | ---------------------------------------------------- |
| `dashboard` 独立子菜单 `/srvf/dashboard` | **取消独立子菜单**，复用 `welcome` 改占位 dashboard | 减少 sidebar 层级；welcome 是平台首页                |
| `dictionaries`                           | ✅ 保留（归入"基础数据"分组）                       | 后端 13 端点                                         |
| `organizations`                          | ✅ 保留（归入"基础数据"分组）                       | 后端 7 端点                                          |
| `members`                                | ✅ 保留（归入"队员"分组）                           | 后端 16 端点（4 子模块）                             |
| `activities`                             | ✅ 保留（归入"活动"分组）                           | 后端 7 端点                                          |
| `training`                               | ❌ **删除**                                         | 后端无 `training` module；不预判业务                 |
| `certificates`                           | ✅ 保留（归入"队员"分组，不独立顶级）               | 与队员强耦合（`/v2/members/:memberId/certificates`） |
| `attachments`                            | ❌ **删除**                                         | Provider 实装挂起；附件不是独立管理域                |
| `audit-logs`                             | ✅ 保留（归入"系统"分组）                           | 后端 2 read 端点；SUPER_ADMIN 用                     |
| —（v0.1 未列）                           | ➕ **新增** `registrations`                         | 后端 10 端点（与 activities 强耦合）                 |
| —（v0.1 未列）                           | ➕ **新增** `attendances`                           | 后端 11 端点（与 activities 强耦合）                 |
| —（v0.1 未列）                           | ➕ **新增** `contribution-rules`                    | 后端 5 端点（运营后台用）                            |
| —（v0.1 提及"系统设置"未列）             | ➕ **新增** `users` + `rbac`                        | 后端有 API；placeholder 等 PR-4                      |

### 6.3 PR-5-B **不上** sidebar 的内容

| 项                            | 不上的理由                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 培训记录 / 证书培训           | 后端无 module                                                                                                                 |
| 独立附件管理                  | Provider 实装挂起，业务上附件应嵌入到证书/活动/队员详情；上独立菜单会诱导反推附件管理域                                       |
| 紧急联系人 / 队员档案         | 队员详情子页内嵌（`/v2/members/:memberId/emergency-contacts` `/v2/members/:memberId/profile` 均为 nested 路由），不进 sidebar |
| `member-departments` 单独菜单 | 嵌入队员详情/组织树视图                                                                                                       |
| `attachment-configs` 单独菜单 | 运营后台 SUPER_ADMIN 用；PR-5-B 不上，Provider 上线后由独立 PR 进 system 分组                                                 |
| 动态菜单管理                  | 红线 2、裁决 2、A-1，**永远禁止**                                                                                             |
| 多租户菜单                    | 红线 3、裁决 1，**永远禁止**                                                                                                  |

---

## 7. Proposed Router Module

### 7.1 文件位置

- **集中一个模块**：新增 `src/router/modules/srvf.ts`，导出**数组**（4 个顶级 RouteConfigsTable）；
- **不拆多个文件**：first-stage 集中一个文件管理 4 个分组，后续 PR-7 / PR-8 等若需独立大改可拆分；PR-5-B **不预先拆分**。

### 7.2 顶级路由命名（4 个容器）

| `path`                    | `name`                 | `meta.icon`（建议）      | `meta.rank` | `redirect`                           |
| ------------------------- | ---------------------- | ------------------------ | ----------- | ------------------------------------ |
| `/srvf/base-data`         | `SrvfBaseData`         | `ri/database-2-line`     | `10`        | `/srvf/base-data/dictionaries`       |
| `/srvf/members-domain`    | `SrvfMembersDomain`    | `ri/team-line`           | `11`        | `/srvf/members-domain/members`       |
| `/srvf/activities-domain` | `SrvfActivitiesDomain` | `ri/calendar-event-line` | `12`        | `/srvf/activities-domain/activities` |
| `/srvf/system`            | `SrvfSystem`           | `ri/settings-3-line`     | `13`        | `/srvf/system/users`                 |

> 顶级 `path` 不直接用 `/srvf` 单一容器是因为：4 个分组在 sidebar 是平级菜单，单一容器会让所有 SRVF 菜单挤进一个二级（深度 +1）。`-domain` 后缀仅为 path 唯一性，**不**作为业务命名；`meta.title` 用中文"SRVF · 基础数据 / SRVF · 队员 / SRVF · 活动 / SRVF · 系统"。

### 7.3 子路由命名（11 个叶子）

| 容器              | child `path`                            | child `name`            |
| ----------------- | --------------------------------------- | ----------------------- |
| base-data         | `/srvf/base-data/dictionaries`          | `SrvfDictionaries`      |
| base-data         | `/srvf/base-data/organizations`         | `SrvfOrganizations`     |
| base-data         | `/srvf/base-data/contribution-rules`    | `SrvfContributionRules` |
| members-domain    | `/srvf/members-domain/members`          | `SrvfMembers`           |
| members-domain    | `/srvf/members-domain/certificates`     | `SrvfCertificates`      |
| activities-domain | `/srvf/activities-domain/activities`    | `SrvfActivities`        |
| activities-domain | `/srvf/activities-domain/registrations` | `SrvfRegistrations`     |
| activities-domain | `/srvf/activities-domain/attendances`   | `SrvfAttendances`       |
| system            | `/srvf/system/users`                    | `SrvfUsers`             |
| system            | `/srvf/system/rbac`                     | `SrvfRbac`              |
| system            | `/srvf/system/audit-logs`               | `SrvfAuditLogs`         |

约束（与 `03-router-menu.md` §5.4 / §5.5 一致）：

- 子路由**不写** `rank`；顺序由 `children` 数组决定；
- 路由 `name` 必须与对应组件 `defineOptions({ name: ... })` 完全一致；
- `path` 全英文短横线分隔；
- 顶级 `meta.title`：`"SRVF · 基础数据"` `"SRVF · 队员"` `"SRVF · 活动"` `"SRVF · 系统"`；
- 子菜单 `meta.title`：`"字典管理"` `"组织架构"` `"贡献值规则"` `"队员列表"` `"证书"` `"活动列表"` `"报名记录"` `"考勤管理"` `"用户管理"` `"角色权限"` `"审计日志"`。

### 7.4 不做的事

- ⛔ **不启用** `src/router/asyncRoutes.ts`（裁决 2 / `03-router-menu.md §5.2.1` P0）；
- ⛔ **不修改** `src/router/asyncRoutes.ts` / `src/router/index.ts / utils.ts`；
- ⛔ **不改** `src/views/login/index.vue` 的 `initRouter` import；
- ⛔ **不新增 / 不实现** `getMenuList`；
- ⛔ **不恢复** `tenantManagementRouter`；
- ⛔ **不动** `src/router/modules/home.ts / error.ts / remaining.ts`（rank 0 / 9 保持不变，本 PR 不并入这三个文件）。

---

## 8. Proposed Placeholder Pages

### 8.1 文件路径（11 个新页 + 1 个改造页）

```
src/views/srvf/
  base-data/
    dictionaries/index.vue
    organizations/index.vue
    contribution-rules/index.vue
  members-domain/
    members/index.vue
    certificates/index.vue
  activities-domain/
    activities/index.vue
    registrations/index.vue
    attendances/index.vue
  system/
    users/index.vue
    rbac/index.vue
    audit-logs/index.vue

src/views/welcome/index.vue   ← 替换为 SRVF dashboard 占位（保留 defineOptions name "Welcome"）
```

→ 每个分组目录内**只放 `<page>/index.vue`**，不预建 `utils/` `form/` `components/`（裁决 6：UI 临时占位不预制范式）。

### 8.2 每个占位页允许的内容

- 页面标题（中文，与 `meta.title` 一致）；
- 1~3 句业务定位说明（**不引用任何后端真实字段名**）；
- 显眼 placeholder 警告（推荐 `<el-alert type="warning" :closable="false">` 或 `<el-empty>` + 卡片）；
- ≤ 5 条"未来可能方向"（非承诺，措辞 `// TODO: 待后端契约就绪后接入`）；
- 不得出现：真实业务字段 / 真实状态码 / API 调用 / mock 数据 / 新增编辑删除按钮 / `<Auth>` `<Perms>` 组件 / `v-auth` `v-perms` 指令；
- 不得引入：`src/api/srvf-*.ts`（PR-5-B 不新增）/ `mock/*` / `*.demo.ts`。

### 8.3 统一占位文案（**原样写入每个占位页**）

> 本页面为静态占位页，字段、流程、权限、状态机以后端业务确认和 API 契约为准。

PR-5-B 实施时**不得篡改这句文案**（包括标点、空格）。

### 8.4 Welcome 改造约束

- ✅ 允许**替换** `<template>` 内容为 SRVF dashboard 占位（卡片标题"SRVF Admin · 工作台占位" + 统一占位文案 + 4 个分组入口提示，无真实数据）；
- ⛔ **不改** `defineOptions({ name: "Welcome" })`（路由 name 一致性）；
- ⛔ **不引入** ECharts / 任何图表数据（不调 API）；
- ⛔ **不引入** 新依赖。

### 8.5 组件 `defineOptions.name` 一一对应

| 文件                                             | `defineOptions.name`    |
| ------------------------------------------------ | ----------------------- |
| `welcome/index.vue`                              | `Welcome`（保持）       |
| `srvf/base-data/dictionaries/index.vue`          | `SrvfDictionaries`      |
| `srvf/base-data/organizations/index.vue`         | `SrvfOrganizations`     |
| `srvf/base-data/contribution-rules/index.vue`    | `SrvfContributionRules` |
| `srvf/members-domain/members/index.vue`          | `SrvfMembers`           |
| `srvf/members-domain/certificates/index.vue`     | `SrvfCertificates`      |
| `srvf/activities-domain/activities/index.vue`    | `SrvfActivities`        |
| `srvf/activities-domain/registrations/index.vue` | `SrvfRegistrations`     |
| `srvf/activities-domain/attendances/index.vue`   | `SrvfAttendances`       |
| `srvf/system/users/index.vue`                    | `SrvfUsers`             |
| `srvf/system/rbac/index.vue`                     | `SrvfRbac`              |
| `srvf/system/audit-logs/index.vue`               | `SrvfAuditLogs`         |

---

## 9. Rank Rules

约束（与 `03-router-menu.md §5.4` + `12-official-docs-index.md §3 FAQ 第 8 条` 一致）：

- `home / welcome` `rank: 0` 保持不变（已存在于 `src/router/modules/home.ts:12`）；
- `error` `rank: 9` 保持不变（已存在于 `src/router/modules/error.ts:8`）；
- SRVF 4 个顶级容器 `rank` **从 10 开始连续**：`10 / 11 / 12 / 13`；
- 子菜单**不写** `rank`；顺序由 `children` 决定；
- **同层 rank 不重复**；**rank: 0 仅 home 可用**（FAQ 平台规定）；
- 写法用数字字面量（与 `home.ts / error.ts` 风格一致），**不**引入 `enums.ts`。

---

## 10. Role / Permission Placeholder Rules

### 10.1 `meta.roles` 写法

| 容器 / 叶子                             | `meta.roles`                                     |
| --------------------------------------- | ------------------------------------------------ |
| `/srvf/base-data` 容器 + 子菜单         | 不写（所有登录用户可见）                         |
| `/srvf/members-domain` 容器 + 子菜单    | 不写                                             |
| `/srvf/activities-domain` 容器 + 子菜单 | 不写                                             |
| `/srvf/system` 容器                     | `["SUPER_ADMIN"]`（仅前端 sidebar 静态显隐占位） |
| `/srvf/system/users`                    | `["SUPER_ADMIN", "ADMIN"]`                       |
| `/srvf/system/rbac`                     | `["SUPER_ADMIN"]`                                |
| `/srvf/system/audit-logs`               | `["SUPER_ADMIN"]`                                |

→ 仅占位显隐，**不**作为真实权限判定。真实权限由 PR-4 + RBAC v2 readiness 后由后端 `users.policy.ts` + `rbac.can()` 主导。

### 10.2 第一阶段不接 RBAC

- ⛔ **不接** `GET /api/v2/rbac/me/permissions`（V2 第一阶段不消费）；
- ⛔ **不消费** Pinia user store 的 `permissions[]` 字段；
- ⛔ **不定义** 前端权限点字符串集；
- ⛔ **不使用** `meta.auths`；
- ⛔ **不使用** Pure Admin demo 的 `admin / common` 作 SRVF 正式角色（裁决 3）；
- ⛔ **不使用** `*:*:*` / `permission:btn:add` 等 demo 权限码。

### 10.3 与后端 `Role` enum 对齐

前端 `meta.roles` 取值集 **必须**严格等于 Prisma `enum Role { SUPER_ADMIN, ADMIN, USER }`（详见 `srvf-frontend-derivation.md §4 Q4`），不允许出现其他大小写或额外角色名（如 `member / operator / ops-admin`——这些是后端 `RbacRole` 表中的扩展角色，第一阶段前端不消费）。

---

## 11. Icons and UI Style

### 11.1 图标

- 使用 Pure Admin 已携带的 iconify 图标体系（`ep/*` `ri/*` `ant-design:*`），按 `meta.icon: string`；
- ⛔ **不为图标引入新依赖**（不 `pnpm add @iconify-icons/*` 单包）。

### 11.2 推荐图标（PR-5-B 可按已有 iconify 集合替换）

| 路由                      | 推荐 iconify name         |
| ------------------------- | ------------------------- |
| `/srvf/base-data`         | `ri/database-2-line`      |
| ↳ dictionaries            | `ri/book-2-line`          |
| ↳ organizations           | `ri/organization-chart`   |
| ↳ contribution-rules      | `ri/scales-3-line`        |
| `/srvf/members-domain`    | `ri/team-line`            |
| ↳ members                 | `ri/user-3-line`          |
| ↳ certificates            | `ri/medal-line`           |
| `/srvf/activities-domain` | `ri/calendar-event-line`  |
| ↳ activities              | `ri/flag-line`            |
| ↳ registrations           | `ri/user-add-line`        |
| ↳ attendances             | `ri/checkbox-circle-line` |
| `/srvf/system`            | `ri/settings-3-line`      |
| ↳ users                   | `ri/user-settings-line`   |
| ↳ rbac                    | `ri/shield-keyhole-line`  |
| ↳ audit-logs              | `ri/file-list-3-line`     |

实际可用图标以 starter `node_modules/@iconify-icons/ri/*` + Element Plus iconify 已注册集合为准；如出现"图标不显示"问题，PR-5-B 实施期用已有图标替换，不引入新包。

### 11.3 UI 风格

- 简洁卡片布局（`<el-card>` + `<el-alert>` / `<el-empty>`）；
- ⛔ 不做复杂表格；不做业务表单；不做真实 dashboard 数据；不做图表。

---

## 12. PR-5-B Allowed Changes

PR-5-B 实施时**仅允许**以下文件改动：

- ✅ **新增** `src/router/modules/srvf.ts`（数组导出，4 个顶级 RouteConfigsTable）；
- ✅ **新增** `src/views/srvf/<group>/<page>/index.vue` × 11（见 §8.1）；
- ✅ **替换** `src/views/welcome/index.vue` 的 `<template>` 内容为 SRVF dashboard 占位（保留 `defineOptions.name = "Welcome"`）；

可选：

- ✅ 使用项目已有 iconify 图标（不新增依赖）；
- ✅ 使用 Element Plus 已注册的 `<el-card> <el-alert> <el-empty> <el-row> <el-col>` 等占位组件（不新增依赖）。

---

## 13. PR-5-B Forbidden Changes

PR-5-B 实施期间，以下行为**全部禁止**（任一触发立即停手回看本文档）：

- ⛔ **不接 API** —— 不调 `srvf-nest-api` 任一端点，不实例化 axios `request`；
- ⛔ **不新增 `src/api/srvf-*.ts`** —— 业务 API 文件归 PR-6+ 各自业务 PR；
- ⛔ **不新增 mock**；不引入完整版 `mock/*`；
- ⛔ **不定义正式字段** —— 占位页不出现 `memberNo / displayName / activityTypeCode / certStatusCode / contributionPoints` 等业务字段；
- ⛔ **不复刻状态机** —— 不写 `pending / pass / reject / cancelled / pending_final_review / approved / final_rejected / present / late / early_leave / verified / expired / rejected` 等任何后端字典 code；
- ⛔ **不定义正式字典项** —— 不新增 `src/constants/srvf-*.ts`；如需 demo 文案，避免出现"看起来像最终字典"的常量列表；
- ⛔ **不设计组织层级** —— 不硬编码"队 → 分队 → 队员"等假设（后端 `Organization` 用 `nodeTypeCode` 字典 + `parentId` 自由树）；
- ⛔ **不设计活动状态机** —— 见上一条；
- ⛔ **不接 RBAC** —— 不调 `GET /api/v2/rbac/me/permissions`，不消费 user store `permissions[]`，不写 `meta.auths`；
- ⛔ **不启用 `asyncRoutes`** —— 不切 import；不新增 `getMenuList`；
- ⛔ **不修改** `src/router/asyncRoutes.ts` / `src/router/index.ts / utils.ts` / `src/router/modules/home.ts / error.ts / remaining.ts`；
- ⛔ **不修改登录 / token / http / user store** —— `src/views/login/index.vue` / `src/api/user.ts` / `src/utils/auth.ts` / `src/utils/http/index.ts` / `src/store/modules/user.ts` 全部不动（属 PR-4 范畴，PR-4 暂停）；
- ⛔ **不恢复多租户菜单** —— `tenantManagementRouter` 不复活；不改 `mock/asyncRoutes.ts`；
- ⛔ **不修改依赖** —— 不跑 `pnpm add/remove/update/clean:cache`；不改 `package.json` 的 `dependencies / devDependencies / engines / pnpm` 字段（裁决 5）；
- ⛔ **不修改底座 / 工程文件** —— `vite.config.ts / build/** / tsconfig.json / eslint.config.js / .env*` 全部不动；
- ⛔ **不修改根级 AI 入口** —— `CLAUDE.md / AGENTS.md / README.md` 不动；
- ⛔ **不修改** `docs/pure-admin/**` / `docs/srvf-api-contract-readiness.md` / `docs/srvf-frontend-derivation.md`；
- ⛔ **不复制完整版** —— 不 `cp -R`；如需参考完整版具体页面，**手敲重写**；
- ⛔ **不绕过校验** —— 不 `// eslint-disable` / `// @ts-ignore` / `--no-verify` / 硬编码 `import.meta.env.VITE_*` 默认值；
- ⛔ **不 force push / 不 git reset --hard**。

---

## 14. PR-5-B DoD

PR-5-B 完成判定（必须全部满足）：

- [ ] 侧边栏在登录后可见 **4 个 SRVF 顶级菜单**（基础数据 / 队员 / 活动 / 系统），rank 10/11/12/13；
- [ ] 4 个顶级菜单展开共显示 **11 个子菜单**（与 §6.1 完全一致）；
- [ ] 点击每个子菜单可进入对应 `/srvf/<group>/<page>` 占位页；
- [ ] welcome 首页（`/welcome`）替换为 SRVF dashboard 占位，含统一占位文案；
- [ ] 所有 11 个占位页 + welcome 改造页**均出现**统一占位文案："**本页面为静态占位页，字段、流程、权限、状态机以后端业务确认和 API 契约为准。**"；
- [ ] 无真实 API 请求（DevTools Network 面板无对 `srvf-nest-api` 或 `localhost:3000` 的业务请求；登录态校验由 PR-4 范围已有逻辑负责，本 PR 不动）；
- [ ] 无新增 mock（`mock/` 目录 diff 为 0）；
- [ ] 无业务字段定型（grep 占位页不出现 §13 列出的字段名）；
- [ ] 无后端状态字典 code 出现在占位页（grep 不到 `pending / pass / present / verified` 等枚举值）；
- [ ] `pnpm typecheck` 通过；
- [ ] `pnpm lint` 通过（`--max-warnings 0`）；
- [ ] `pnpm build` 通过；
- [ ] 浏览器 DevTools Console 无明显 error（已知 mock asyncRoutes 演示 console.log 除外）。

---

## 15. Relation to Later PRs

| PR                  | 范围                                                  | 与 PR-5 的边界                                                                                            |
| ------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **PR-4**            | NestJS 登录对接                                       | **⛔ 暂停中**。PR-5 期间 PR-4 相关文件 / 调用全不动；等 readiness checklist 10 项 + 人类批准              |
| **PR-5-A**（本 PR） | 方案文档（v0.2）                                      | 仅新增 / 修改 `docs/srvf-static-menu-skeleton-plan.md`                                                    |
| **PR-5-B**          | 落地实现：4 容器 + 11 占位页 + welcome 改造           | 严格按本文档边界，11 个占位页 + welcome 文案 + `srvf.ts` 路由                                             |
| **PR-6**            | 字典页面真接入                                        | PR-5-B 仅占位 `/srvf/base-data/dictionaries`；PR-6 配合后端 `dictionaries.controller.ts` 13 端点接入      |
| **PR-7**            | 组织架构真接入                                        | PR-5-B 仅占位 `/srvf/base-data/organizations`；PR-7 配合后端 `organizations.controller.ts` 接入；裁决 8   |
| **PR-8**            | 活动日历 UI 占位 → 真接入                             | PR-5-B 仅占位 `/srvf/activities-domain/activities`；PR-8 接入活动 + 报名 + 考勤；裁决 7                   |
| **PR-9+**           | 队员 / 证书 / 贡献值规则 / 审计日志 / 用户管理 / RBAC | 各自独立 PR；PR-5-B 仅占位                                                                                |
| **PR-Attach**       | 附件接入                                              | Provider 实装 + ADMIN 内置角色拍板后由独立 PR；附件嵌入到队员/证书/活动详情子模块，**不**作为独立顶级菜单 |

---

## 16. PR-5-A 输出说明（本 PR）

- 本 PR（PR-5-A v0.2）**仅修改** `docs/srvf-static-menu-skeleton-plan.md`；
- 本 PR **不动业务代码、不动 mock、不动配置 / 依赖**；
- 本 PR **不执行 `pnpm` / `npm` / `yarn`**；
- 本 PR **不接 NestJS、不重启 PR-4**；
- 本 PR **不动后端仓库**任何文件（`<coding-root>/srvf-nest-api` 只读）；
- 本 PR **不 force push / 不 reset**；
- 后续 PR-5-B 实施必须以本文件 v0.2 为**唯一边界**，凡越界即视为违反硬规则。

### 16.1 v0.2 vs v0.1 关键差异

1. 新增 §0 调研基线（前端 / 后端 HEAD + 工作树状态）；
2. 新增 §2 前端当前代码核对结果（路由模块 / meta 字段 / Layout / welcome / views 目录）；
3. 新增 §3 后端只读调研摘要（19 module / 131 端点 / 30+ model / 状态机来源 / 不稳定项）；
4. 新增 §5 后端事实来源表（含成熟度、是否上菜单、理由）；
5. §4 完整版参考权重显式下调："菜单本身不由完整版决定"；
6. §6 重写 PR-5-B 菜单：**v0.1 的 9 个平级菜单 → v0.2 的 4 容器 + 11 叶子分组结构**（按后端业务域分组）；
7. §6.2 给出 v0.1→v0.2 逐项差异；§6.3 列出"不上 sidebar"的项及理由；
8. §7 路由命名按分组重写（`base-data / members-domain / activities-domain / system` 4 容器）；
9. §8 占位页按 4 分组组织目录；welcome 改为"替换"而非"追加"；
10. §10 `meta.roles` 给出**容器级 + 叶子级**分级占位；
11. §13 禁止清单增加"不复刻后端状态机 code"条目；
12. §14 DoD 加入"无后端状态字典 code 出现在占位页"grep 校验。

### 16.2 commit message 建议（不要立即 commit，等人类 review）

```
docs: revise srvf static menu skeleton plan to v0.2 (pr-5-a)
```

可选 body：

```
Rewrite PR-5-A based on read-only research of:
- srvf-admin-web HEAD 39056fc (FE actual code structure + router modules + welcome)
- srvf-nest-api HEAD fc8241d v0.10.0 (19 modules / 131 endpoints / 30+ models
  / state machines via dictionaries / Provider C-7.5 pending / business RBAC
  integration pending)

Menu strategy converges from 9 flat placeholder pages to a 4-container +
11-leaf grouping aligned with backend modules:
- SRVF · 基础数据  (dictionaries / organizations / contribution-rules)
- SRVF · 队员      (members / certificates)
- SRVF · 活动      (activities / registrations / attendances)
- SRVF · 系统      (users / rbac / audit-logs, all placeholder pending PR-4)

Drops v0.1's training / attachments / dashboard-as-separate-leaf based on
"no backend evidence" / "Provider pending" / "merge into welcome" rationale.

Full Version Reference权重 explicitly downgraded: menus driven by backend
facts, not by完整版 demo menus.

Refs:
- srvf-nest-api/docs/handoff/v0.10.0.md
- srvf-nest-api/prisma/schema.prisma
- srvf-nest-api/src/modules/*/*.controller.ts (131 endpoints)
- docs/pure-admin/03-router-menu.md §5.2.1 / §5.4 / §5.5
- docs/pure-admin/07-max-ts-modules.md §12.4
- docs/srvf-api-contract-readiness.md §5 / §6
- docs/srvf-frontend-derivation.md §4 Q4 (Role enum)
```

---

## 17. PR-5-B Implementation Record

> 本节由 PR-5-B 实施时追加。仅记录"实际落地结果"，**不**回头改本文 §0~§16 任何方案规定。

### 17.1 实际新增 / 修改文件

| 类型 | 路径                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------ |
| 新增 | `src/router/modules/srvf.ts`                                                                                 |
| 新增 | `src/views/srvf/base-data/dictionaries/index.vue`                                                            |
| 新增 | `src/views/srvf/base-data/organizations/index.vue`                                                           |
| 新增 | `src/views/srvf/base-data/contribution-rules/index.vue`                                                      |
| 新增 | `src/views/srvf/members-domain/members/index.vue`                                                            |
| 新增 | `src/views/srvf/members-domain/certificates/index.vue`                                                       |
| 新增 | `src/views/srvf/activities-domain/activities/index.vue`                                                      |
| 新增 | `src/views/srvf/activities-domain/registrations/index.vue`                                                   |
| 新增 | `src/views/srvf/activities-domain/attendances/index.vue`                                                     |
| 新增 | `src/views/srvf/system/users/index.vue`                                                                      |
| 新增 | `src/views/srvf/system/rbac/index.vue`                                                                       |
| 新增 | `src/views/srvf/system/audit-logs/index.vue`                                                                 |
| 修改 | `src/views/welcome/index.vue`（替换 template 为 SRVF dashboard 占位；`defineOptions.name = "Welcome"` 保持） |
| 追加 | `docs/srvf-static-menu-skeleton-plan.md`（本节 §17）                                                         |

→ **合计**：1 个新路由模块 + 11 个新占位页 + 1 个 welcome 改造 + 1 个文档追加 = **14 个文件改动**。

### 17.2 实际菜单结构（与 §6.1 / §7.2 / §7.3 一致）

```
首页 (Welcome, rank 0,  已存在)
├─ /welcome  ← 替换为 SRVF dashboard 占位

SRVF · 基础数据 (rank 10) — /srvf/base-data → /srvf/base-data/dictionaries
├─ 字典管理     SrvfDictionaries
├─ 组织架构     SrvfOrganizations
└─ 贡献值规则   SrvfContributionRules

SRVF · 队员 (rank 11) — /srvf/members-domain → /srvf/members-domain/members
├─ 队员列表     SrvfMembers
└─ 证书         SrvfCertificates

SRVF · 活动 (rank 12) — /srvf/activities-domain → /srvf/activities-domain/activities
├─ 活动列表     SrvfActivities
├─ 报名记录     SrvfRegistrations
└─ 考勤管理     SrvfAttendances

SRVF · 系统 (rank 13, meta.roles=["SUPER_ADMIN"]) — /srvf/system → /srvf/system/users
├─ 用户管理     SrvfUsers       (roles: ["SUPER_ADMIN","ADMIN"])
├─ 角色权限     SrvfRbac        (roles: ["SUPER_ADMIN"])
└─ 审计日志     SrvfAuditLogs   (roles: ["SUPER_ADMIN"])

异常页面 (Error, rank 9, 已存在)
```

### 17.3 边界自检（grep）

| 检查项                            | 结果                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 是否接 API                        | **否**。占位页 `<script setup>` 内无 `import` 任何 `@/api/*`、无 `request`、无 `axios`、无 `fetch`                                                                                                                                                                                                                                                                                                                                                                                                   |
| 是否新增 mock                     | **否**。`mock/**` diff 为 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 是否触碰禁止范围                  | **否**。`src/router/asyncRoutes.ts` / `src/router/index.ts` / `src/router/utils.ts` / `src/router/modules/{home,error,remaining}.ts` / `src/views/login/**` / `src/api/**` / `src/utils/auth.ts` / `src/utils/http/**` / `src/store/modules/user.ts` / `package.json` / `pnpm-lock.yaml` / `vite.config.ts` / `.env*` / `tsconfig.json` / `README.md` / `CLAUDE.md` / `AGENTS.md` / `docs/pure-admin/**` / `docs/srvf-api-contract-readiness.md` / `docs/srvf-frontend-derivation.md` 全部 diff 为 0 |
| 是否启用 `asyncRoutes`            | **否**。`src/router/asyncRoutes.ts` 未触碰；`src/views/login/index.vue` import 不变；未新增 `getMenuList`                                                                                                                                                                                                                                                                                                                                                                                            |
| 是否恢复 `tenantManagementRouter` | **否**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 是否定义后端字段 / 状态机 code    | **否**。占位页文案不含 `memberNo / displayName / activityTypeCode / certStatusCode / contributionPoints / pending / pass / present / verified / approved / final_rejected` 等                                                                                                                                                                                                                                                                                                                        |
| 是否新增依赖                      | **否**。仅用项目已有 Element Plus 与 iconify（`ri/*`）；`package.json` 未触碰                                                                                                                                                                                                                                                                                                                                                                                                                        |

### 17.4 检查命令（执行结果填入 commit 报告）

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `git diff -- src/router/asyncRoutes.ts src/router/index.ts src/router/utils.ts src/router/modules/home.ts src/router/modules/error.ts src/router/modules/remaining.ts src/views/login src/api src/utils/auth.ts src/utils/http src/store/modules/user.ts mock build .env* vite.config.ts package.json pnpm-lock.yaml README.md CLAUDE.md AGENTS.md public tsconfig.json types docs/pure-admin docs/srvf-api-contract-readiness.md docs/srvf-frontend-derivation.md`（必须空）

### 17.5 落地差异（v0.2 → 实施）

| #   | 方案 §x                                                  | 实施差异                                                | 原因                                                                                                                                                                                                                                                                                        |
| --- | -------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | §10.1 `/srvf/system` 容器 `meta.roles = ["SUPER_ADMIN"]` | **容器顶层 `meta.roles` 未写**；3 个子菜单 `roles` 保留 | starter 底座类型 `RouteConfigsTable.meta` 顶层仅支持 `title/icon/showLink/rank`（见 `types/router.d.ts:92-101`），不支持 `roles`。`types/router.d.ts` 在禁止修改范围。语义不变：3 个子菜单均带 `roles`，sidebar 对所有子项均无权时自动隐藏父级（Pure Admin sidebar `hasShowingChild` 机制） |

→ 该差异**不影响 PR-5-B DoD**：sidebar 表现一致；其余结构与方案 v0.2 完全一致。

### 17.6 浏览器人工验证（人类执行）

PR-5-B 合并前由人类启动 `pnpm dev`，在浏览器手动验证：

- 登录后侧边栏出现 4 个 SRVF 容器（基础数据 / 队员 / 活动 / 系统）；
- 4 个容器展开共 11 个子菜单；
- 点击每个子菜单进入 `/srvf/<group>/<page>` 占位页；
- `/welcome` 为 SRVF dashboard 占位卡 + 统一占位文案；
- DevTools Network 无对 `srvf-nest-api` / `localhost:3000` 的业务请求；
- DevTools Console 无明显 error。

### 17.7 PR-5-C Menu Label Adjustment

- Removed the redundant `SRVF ·` prefix from top-level sidebar menu labels.
- Final top-level labels:
  - `/srvf/base-data` → `基础数据`
  - `/srvf/members-domain` → `队员`
  - `/srvf/activities-domain` → `活动`
  - `/srvf/system` → `系统`
- Leaf-level labels unchanged (`字典管理 / 组织架构 / 贡献值规则 / 队员列表 / 证书 / 活动列表 / 报名记录 / 考勤管理 / 用户管理 / 角色权限 / 审计日志`)。
- `path / name / component / redirect / rank / roles / icon` all unchanged; only the four top-level `meta.title` strings shortened.
- Reason: this repository is already SRVF-specific; repeating `SRVF` in each sidebar group makes labels too long and noisy for daily admin use.
