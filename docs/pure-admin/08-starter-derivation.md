# 08 · Starter Derivation · 从 starter 派生业务项目 / 与 NestJS 后端对接

## 本文适用任务

- 从本 starter（`u-admin-web-starter`）派生具体业务项目（如 `srvf-admin-web`、`u-studio-admin-web`、`token-admin-web`、`health-admin-web`）
- 把派生项目接 NestJS 后端
- 评估"用户 / 字典 / 组织 / 活动 / 附件 / 审计"等业务模块的对接策略
- 决定多产品复用策略（多 clone vs monorepo vs 单前端多模块）

## 必须先读

- 主入口 §0.5 后端 4 大红线
- `02-ai-rules.md` §13.1 文件改动矩阵
- `04-auth-permission.md`、`05-http-api.md`、`06-mock-risk.md`、`07-max-ts-modules.md`
- `09-pr-roadmap.md` PR-1 ~ PR-8 路线

## 禁止事项

- ⛔ 禁止把本 starter 仓库直接当业务仓库开发 SRVF / U Studio / U Agents 等业务
- ⛔ 禁止以前端模板字段反推后端 Prisma schema / API 路径 / RBAC 模型（主入口红线 1~4）
- ⛔ 禁止把"为前端方便"作为后端建表 / 加字段 / 改返回结构的立项理由
- ⛔ 禁止第一阶段引入 monorepo 复杂度
- ⛔ 禁止"三个后台同时启动 / 同前端区分菜单"
- ⛔ 禁止把演示角色名（admin / common）保留为业务正式角色

## 相关关键文件路径

- 本 starter：`<coding-root>/u-admin-web-starter`（占位符见 `docs/external-refs.md`）
- 上游母版（只读）：`<refs-root>/pure-admin-thin-max-ts`
- 完整版参考（只读）：`<refs-root>/vue-pure-admin`
- 派生项目时的关键文件：`package.json`、`README.md`、`.env*`、`vite.config.ts`、`src/router/modules/<业务>-*.ts`

---

## 11. 与 NestJS 后端的对接策略

### 11.0 ⛔ 强约束（先于一切对接）

- **Swagger / OpenAPI 是唯一接口契约。** 任何与 Swagger 不符的前端调用都视为前端 bug，**改前端**。
- **前端不得定义后端模型。** 字段、枚举、状态机、分页、错误码均以后端 Prisma schema + Swagger 为准。
- 前端做**体验层校验**（必填、长度、正则、UI 联动）；后端做**最终业务校验**（唯一性、状态机、权限、关联完整性、并发安全）。
- 任何"为前端方便"而要求后端建表 / 加字段 / 改返回结构的诉求，必须经人类批准并以"业务需求"立项，**而非以前端模板为由**（违反红线 1~4）。

### 11.1 接入总流程

1. NestJS 输出 `openapi.json`（建议放 `docs/openapi.json` 或 CI 拉取）；
2. 前端在 `src/utils/http/index.ts` 响应拦截器**一次性**适配后端返回结构（详见 `05-http-api.md` §7.5）；
3. 在 `src/api/<业务模块>.ts` 写业务 API 函数 + TS 类型（手写或由 `openapi-typescript` 生成到 `src/api/__generated__/`）；
4. 业务 view 只 import `src/api/*`，不在 view 内散写 axios。
5. 错误码 / BizCode：建议在 `src/utils/message.ts` 周围加 `bizCodeToMessage` 字典；映射表由后端提供。

### 11.2 各业务模块对接状态总览

> 「现状」= 本 starter 是否有前端现成模块；「第一阶段动作」= 第一阶段做什么；「等待后端」= 等什么。

| 业务模块                       | starter 现状                                                                             | 第一阶段动作                                                                                            | 等待后端                                                        | 备注                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **登录 / Token**               | ✅ `src/views/login/`、`src/api/user.ts`、`src/utils/auth.ts`、`src/utils/http/index.ts` | **必做**：接 NestJS `/auth/login`；适配返回结构与 `expires`；按 `05-http-api.md` §7.6 决定 refresh 适配 | 否（已具备）                                                    | 见 `09-pr-roadmap.md` PR-4                                                    |
| **当前用户信息**               | ✅ Pinia `user` store + setToken 写入                                                    | **必做**：把登录返回字段映射到 store                                                                    | 后端返回结构                                                    | 注意角色名替换（`04-auth-permission.md` §6.6.2）                              |
| **用户管理（列表/详情/启停）** | ⚠️ 无（thin-max-ts 不带 `system/user` 页）                                               | **暂缓**第一阶段；可参考 vue-pure-admin `src/views/system/user/` 作为范式                               | 后端 `/users` CRUD API + Prisma `User` 模型                     | 字段以后端为准；分页参数 (`page/pageSize` 与否) 也以后端为准                  |
| **字典管理**                   | ✅ `src/views/dict/` + mock `/dict-*`（演示）                                            | **暂缓**接真接口；菜单先隐藏；UI 占位用 `*.demo.ts` 常量                                                | 后端 `dict_types / dict_items` schema                           | 见 `07-max-ts-modules.md` §10.1、裁决 6                                       |
| **组织架构（队伍/分队/队员）** | ❌ 无                                                                                    | **可前移 UI 骨架**（裁决 8）；只做菜单 + 占位页                                                         | 后端"组织 / 部门 / 分队 / 岗位"模型（由 NestJS 设计）           | 不硬编码真实层级；不固定字段；参考 vue-pure-admin `system/dept/` 仅作交互范式 |
| **活动 / 训练 / 出勤日历**     | ⚠️ `src/views/schedule/` 是简化排班演示                                                  | **可前移 UI 占位**（裁决 7）；只做菜单 + 静态页                                                         | 后端 `Activity / Event / Attendance` 模型                       | 不设计活动数据库；不定义状态流；接真 API 前不引入真实数据                     |
| **附件 / 文件管理**            | ❌ 无（无 upload 组件）                                                                  | **不前移**；待后端附件 API + 对象存储确定后再做                                                         | 后端 `Attachment / FileObject` 模型 + 上传策略                  | 可参考 vue-pure-admin `src/views/components/upload/` 作为范式                 |
| **审计日志**                   | ❌ 无                                                                                    | **不前移**                                                                                              | 后端 `AuditLog` 模型                                            | 可参考 vue-pure-admin `src/views/monitor/logs/system/` 作为范式               |
| **角色 / 权限管理**            | ❌ 无对应管理页（仅 mock 演示）                                                          | **不前移**；前端只消费登录返回                                                                          | 后端 RBAC 模型（红线 4）                                        | 不允许提前定义按钮 code 体系                                                  |
| **菜单管理（动态菜单）**       | ⚠️ `src/router/asyncRoutes.ts` 演示（红线 2 + 裁决 2）                                   | **禁止启用**                                                                                            | 无（第一阶段一律禁启 asyncRoutes，与后端是否已有菜单 API 无关） | 不补 `getMenuList`、不切 import                                               |

### 11.3 登录对接（PR-4 操作手册）

- `src/api/user.ts:getLogin` URL → NestJS `/auth/login`（或 Swagger 指定的实际路径）；
- `UserResult.data` 字段同 NestJS 真实返回（如 `accessToken / refreshToken / expiresIn / user.{id,username,roles[],permissions[]}`），**改前端类型不改后端**；
- `src/utils/auth.ts:setToken` 按 `05-http-api.md` §7.5 适配 `expires` / `expiresIn`；
- 决定 refresh 策略后按 `05-http-api.md` §7.6 处理；
- 关 `mock/login.ts`（不删，仍可作演示参考）；
- 配 `vite.config.ts: server.proxy` 把 `/auth/*`、`/users/*` 等代理到 NestJS。

### 11.4 字典对接（暂缓但要明确边界，裁决 6）

- **现阶段**：菜单隐藏 `dictManagementRouter`，源码保留；
- **如需 UI 占位**：建立 `src/constants/<模块>.demo.ts` 临时常量，文件头注释清楚 `TEMPORARY / DEMO`；
- **接真接口时**：API 路径、字段、状态值全部来自 NestJS Swagger，**前端 mapper 适配 mock 风格 → 后端真实结构**；
- **禁止**：把 demo 常量当成正式字典；把 mock `dictId/label/value/status/color/sort/remark/createTime` 当成后端字段。

### 11.5 组织架构对接（裁决 8）

- **现阶段**：建立 `src/views/<业务>-org/` 菜单 + 占位页（参考 vue-pure-admin `src/views/system/dept/` 的**交互范式**，不抄字段）；
- **禁止**：硬编码真实队伍层级；提前固定"部门/分队/岗位"字段；引入"多租户 + 多部门"双层级。
- **接真接口**：后端给"部门树"接口（一维 + parentId 或直接树），前端 `handleTree` 转树。

### 11.6 活动日历对接（裁决 7）

- **现阶段**：建立 `src/views/<业务>-calendar/` 菜单 + 静态占位（参考 `src/views/schedule/`）；
- **禁止**：设计真实活动数据库 schema；定义正式活动状态机；硬编码真实活动数据。
- **接真接口**：后端 `Activity / Event / Attendance` 模型确认后，API 推荐 `GET /activities?start=YYYY-MM-DD&end=...`，字段以 Swagger 为准。

### 11.7 附件 / 审计 / 角色 / 菜单管理

- **第一阶段不前移**，避免凭空设计。
- 待业务场景与后端 schema 确认后再立项。
- 参考范式见 `07-max-ts-modules.md` §12.2。

### 11.8 Swagger / OpenAPI 工作流

- 流程：
  1. NestJS 产出 `openapi.json` → 提交到本仓库（如 `docs/openapi.json`）；
  2. 可选：`openapi-typescript` 生成 `src/api/__generated__/schemas.ts`；
  3. 业务 API 函数 import 生成类型；
  4. 若契约破坏（字段重命名、类型变化），CI 在前端报错。
- **此流程的接入由人类决策**，本文档此处只做记录。

---

## 14.4 永不从前端模板反推的事项

| 事项                     | 永不允许反推到后端                                                              | 替代做法                                    |
| ------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------- |
| 多租户 / 套餐 / 套餐菜单 | tenant 表、package 表、租户菜单 RBAC                                            | 后端单租户；SaaS 化由后端独立立项           |
| 菜单管理（动态路由）     | 23 字段菜单表、`MenuData` 结构                                                  | 后端如需菜单 API，自行设计字段              |
| 权限 code                | `permission:btn:add` 字符串、`*:*:*` 通配                                       | 后端 BizCode / Scope 由 NestJS 独立设计     |
| 字典字段                 | `dictId/label/value/status/color/sort/remark/createTime`                        | 后端字典 schema 独立设计                    |
| 日历 / 排班字段          | `上午/中午/晚上` 简化模型、事件类型、状态机（draft / published / cancelled 等） | 后端 Activity / Event / Attendance 独立设计 |
| API 路径风格             | `/dict-tree / /tenant-list / /get-async-routes`                                 | 后端 REST 风格由 NestJS 决定                |
| 返回结构                 | `{ code: 0, message, data }` 强假设                                             | 后端返回什么，前端拦截器适配什么            |

---

## 17.3 多产品复用策略（从 starter 派生业务项目）

- **第一阶段推荐**：**每个产品独立克隆一份本 starter**，各自独立 git 仓库，互不影响。
  - 优点：独立升级；独立部署；不互相干扰；可分别决定何时合并上游。
  - 操作：
    ```bash
    git clone git@github.com:BA7IEE/u-admin-web-starter.git srvf-admin-web
    cd srvf-admin-web
    git remote remove origin
    # 在 GitHub 上创建 Private 仓库 srvf-admin-web 之后
    git remote add origin git@github.com:BA7IEE/srvf-admin-web.git
    # 改 package.json: name → srvf-admin-web；改 README.md Repository Notice
    git push -u origin main
    ```
  - 上游同步（starter → 业务项目）：见 `11-upstream-sync.md`。

- **不推荐方案**：
  - ❌ **monorepo（`apps/srvf / apps/u-studio / apps/u-agents`）**：第一阶段不必引入 monorepo 复杂度。
  - ❌ **同一前端多业务模块（侧边栏区分三个产品）**：会让路由、权限、API 路径互相打架，且违背"单一职责"。

- **当后续真的需要"共享组件 / hooks"时**，再讨论 monorepo + workspace 方案。

### 派生项目身份调整 checklist

派生时必须在第一个 commit 之后立刻调整：

1. `package.json: name` → 业务项目名（如 `srvf-admin-web`）；
2. `package.json: description` → 业务项目描述；
3. `package.json: private: true` 保持不变；
4. `README.md`：替换 Repository Notice，强调"派生自 `u-admin-web-starter`"+ 仍是 Private；
5. 不要立刻改业务代码，先按 `09-pr-roadmap.md` 的 PR 顺序逐项推进。

---

## 17.4 派生初始化完整 checklist

> 本节是 §17.3 多产品复用策略 + 上方"派生项目身份调整 checklist"的**端到端展开**。每次派生新业务项目（如 `u-studio-admin-web` / `token-admin-web` / `health-admin-web`）时**逐条执行**，不要跳步。
>
> 已有派生案例参考：`srvf-admin-web` 基于 `fd24cd4` 派生（详见该仓 `docs/archive/srvf-frontend-derivation.md`）。

### 17.4.1 派生前置条件

派生前必须满足：

- [ ] starter 工作区 clean（`git status --short` 空）；
- [ ] starter HEAD 是 `origin/main` 最新 commit（无未推送变更）；
- [ ] 目标业务项目名已确定（如 `u-studio-admin-web`），且**全英文 + 短横线分隔**（FAQ 规则：禁止中文路径）；
- [ ] 在 GitHub 上**先创建 Private 仓库**（不勾选 README / .gitignore / License；让 starter 的内容直接 push 上去）；
- [ ] 已确认目标本地目录**不存在**（避免覆盖）。

### 17.4.2 派生 11 步执行清单

```bash
# Step 1：clone starter 到新目录（全英文路径）
cd <coding-root>
git clone git@github.com:BA7IEE/u-admin-web-starter.git <业务项目名>
cd <业务项目名>

# Step 2：删除原 origin（指向 starter），并验证
git remote remove origin
git remote -v   # 应为空

# Step 3：添加新 origin 指向自己的 Private 仓库
git remote add origin git@github.com:BA7IEE/<业务项目名>.git
git remote -v

# Step 4：验证远端仓库可达（不是 404）
git ls-remote origin
# 若返回 "Repository not found" → 停下，先去 GitHub 把 Private 仓库建好
# 若返回空（空仓库）→ OK

# Step 5：改 package.json 三字段（手工编辑，禁止改 dependencies / devDependencies / engines / pnpm）
#   - name: "<业务项目名>"
#   - description: "<业务项目描述> based on u-admin-web-starter"
#   - private: true（保持）

# Step 6：改 README.md 顶部 Repository Notice
#   - 改为"<业务项目名> 派生自 u-admin-web-starter"
#   - 必须保留"派生自 u-admin-web-starter"字样
#   - 必须仍标注 Private
#   - 保留原文档其余内容
#   - （建议）顶部加 1 段"当前状态"，便于 AI 5 秒可见

# Step 7：新增派生记录文档 docs/<业务>-frontend-derivation.md
#   §1 Source：starter commit at derivation time（记录 starter 当前 HEAD SHA）
#   §2 Purpose
#   §3 Backend Contract Source（如已有后端仓库，写仓库路径与 Swagger 地址）
#   §4 PR-? Open Questions / 调研结论（如已做契约调研）
#   §5 后续 PRs（不在 starter 内推进的事）
#   §6 PR 顺序表 / 状态
#   §7 已知残留问题（继承自 starter）
#   §8 上游同步规则提醒（cherry-pick + 不 merge）

# Step 8：核查禁止范围（应为空 diff）
git status --short
git diff -- src mock build .env* vite.config.ts pnpm-lock.yaml public tsconfig.json types
# 上面 diff 应全空——派生身份调整不应触碰任何业务代码 / 配置 / lockfile

# Step 9：首次 commit（派生身份）
git add package.json README.md docs/<业务>-frontend-derivation.md
git commit -m "chore: derive <业务项目名> from starter"

# Step 10：push 到新 Private 仓库
git push -u origin main

# Step 11：确认远端属性
gh repo view BA7IEE/<业务项目名> --json visibility,isEmpty,defaultBranchRef
#   visibility 必须是 PRIVATE
#   isEmpty 必须是 false（已 push）
#   defaultBranchRef.name 必须是 main
```

### 17.4.3 派生后**绝不允许**立刻做的事

| 行为                                                                             | 禁止理由                                                     | 应该走哪个 PR                                            |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| 直接改 `vite.config.ts: server.proxy`                                            | 是 ❌ 文件，需走 `02-ai-rules.md §13.2.2` 单独 PR + 4 项评估 | PR-2.1（后端 API 路径前缀确认后）                        |
| 改 `src/api/user.ts` / `src/utils/auth.ts` / `src/utils/http/index.ts` 接 NestJS | 是 PR-4 范畴，且依赖后端契约 readiness                       | PR-4（仅当人类批准 + readiness 全过）                    |
| 写 SRVF / U Studio / token / health 等业务页面                                   | 是 PR-5 范畴                                                 | PR-5（静态菜单骨架）→ PR-7（组织骨架）→ PR-8（日历占位） |
| 启用 `src/router/asyncRoutes.ts` / 补 `getMenuList`                              | 红线 2，永远禁止                                             | 无                                                       |
| 改 `package.json` 依赖字段 / 跑 `pnpm add / remove / update`                     | 裁决 5，永远禁止                                             | 由人类执行                                               |
| 把派生项目的业务改动 PR 回 starter                                               | 反向流禁止（见 `11-upstream-sync.md §11-2.4`）               | 无                                                       |

### 17.4.4 派生后**允许**立刻做的事

派生项目第一个 commit（派生身份调整）push 后，允许按 `09-pr-roadmap.md` 顺序推进：

- **PR-2.1**：Vite proxy 配置（依赖后端 API 路径前缀已确认）；
- **PR-3**：本地运行与构建验证（无代码变更，仅记录 `setup-notes.md`）；
- **PR-5**：业务静态菜单骨架（不接 API，仅占位）；
- **PR-7 / PR-8**：组织 / 日历占位页（裁决 7 / 8，UI 占位不设计 schema）。

**绝不允许** PR-2.1 → PR-4 跳号直接接登录。

### 17.4.5 派生案例对照（学习模板）

派生 `srvf-admin-web` 时：

- Step 1~10 已完整执行，初始 commit `3056f1e chore: derive srvf admin web from starter`；
- Step 7 派生记录文档 `docs/archive/srvf-frontend-derivation.md` 详细记录了 starter base commit `fd24cd4`；
- 后续 PR-2.1 (Vite proxy)、PR-3 (验证)、PR-4 抢跑 + revert + 暂停 等全部按上述规则推进。

新派生项目应参考 `srvf-admin-web` 的 `docs/archive/srvf-frontend-derivation.md` 写法。

### 17.4.6 完整版参考库使用约束（派生项目同样适用）

派生项目可以读取本地 `vue-pure-admin` **开源完整版**（路径 `<refs-root>/vue-pure-admin`）作为 **UI 范式参考**，但**必须遵守 starter 的 Full Version Reference Rule**（见 starter `CLAUDE.md` §9 + `AGENTS.md` §9 + `07-max-ts-modules.md` §12.4）：

- ✅ 允许：读取页面结构 / 组件组合 / UI 交互 / 路由 meta 写法 / 目录范式；
- ⛔ 禁止：把完整版的**业务**（API / mock / RBAC / tenant / 动态菜单 / 业务字段 / 状态机 / 菜单名）迁入派生项目；
- ⛔ 禁止：把完整版当作"产品需求"来源——"完整版有这个页所以我们也要做"是错误推理；
- ⛔ 禁止：修改完整版仓库（read-only）。

完整版与 Pure Admin Max-Ts 上游母版的区别参见 `07-max-ts-modules.md` §12.4.5；PR-5 ~ PR-8 各自如何安全使用完整版参见 `07-max-ts-modules.md` §12.4.4。
