# 10 · Review Log · Review 修订记录与版本历史

## 本文适用任务

- 想知道 baseline 文档是怎么演进到今天这个版本的
- 想知道某条规则 / 红线为何存在（来源 review / 来源用户裁决）
- 想知道哪些 review 建议被采纳、哪些被驳回、原因是什么
- 想知道目前还有哪些 Open Questions 卡住后续 PR

## 必须先读

- 主入口 `docs/pure-admin-max-ts-baseline.md`（当前版本号、专题索引）
- `02-ai-rules.md`（AI 硬规则的最终形态）
- `09-pr-roadmap.md`（PR 路线的最终形态）

## 禁止事项

- 禁止把本文件作为"操作指南"——本文件是历史档案，操作请回到主入口 / 各专题
- 禁止根据"未采纳建议"试图绕过现有红线
- 禁止以"过去 v0.1 是这么写的"为由违反当前规则

## 相关关键文件路径

- 本文件（仅文档）
- 历史 baseline 内容已收敛进各专题文档

---

## 18. Review 修订记录

### 18.1 v0.2（首次 5-agent review 后大改）

**触发**：5-agent 并行 review（事实核查 / 前端架构 / 后端契约边界 / AI 开发规则 / 落地路线）。

#### 18.1.1 v0.2 review 关键结论（评分）

| Agent          | 维度                             | 评分           |
| -------------- | -------------------------------- | -------------- |
| 1 事实核查     | 事实准确度                       | 82 / 100       |
| 2 前端架构     | 架构准确度 / 可执行性 / 框架深度 | 88 / 82 / 85   |
| 3 后端契约边界 | 后端契约保护度                   | **62 / 100** ⚠ |
| 4 AI 开发规则  | AI 行为约束强度                  | **62 / 100** ⚠ |
| 5 落地路线     | 落地可执行性                     | **68 / 100** ⚠ |

**核心矛盾**：v0.1 事实和架构准确度合格，但**后端契约边界、AI 约束、落地路线**三块严重欠缺，是"AI 驱动、后端先行"模式最关键的部分。v0.2 聚焦修订这三块。

#### 18.1.2 v0.2 修订章节清单

| 章节（旧编号） | 修订类型     | 摘要                                                                               |
| -------------- | ------------ | ---------------------------------------------------------------------------------- |
| §0.5           | **新增**     | 后端 4 大红线（裁决 1~4）                                                          |
| §5.2           | 重写         | 静态/动态路由说明；§5.2.1 asyncRoutes 禁用红线（裁决 2）；§5.2.2 双 whiteList 说明 |
| §5.3           | 小幅补充     | 拍平机制因果："为 keep-alive 二级限制"                                             |
| §6.6.1         | 新增         | 三层权限决策树                                                                     |
| §6.6.2         | 新增         | 演示角色名禁作正式角色（裁决 3）                                                   |
| §6.7           | 重写         | 升级为 P0 红线（裁决 3）                                                           |
| §7.5           | 重写         | NestJS 返回结构 / `expires` 适配步骤                                               |
| §7.6           | 新增         | refresh token 适配规则（裁决 7：不倒逼后端）                                       |
| §8.5           | 重写         | mock 硬规则（裁决 4）                                                              |
| §10            | **整章重写** | 12 个模块逐一标"处理 / 是否影响后端 / 风险 / 建议"                                 |
| §11            | **整章重写** | 强约束 + 业务模块对接状态总览 + 各模块对接规则                                     |
| §13.1          | 重写         | 文件改动矩阵补 store 命名 / `.env` 硬编码禁止 / mock 新增禁止 / Tailwind v4 警告   |
| §13.2.1        | 新增         | AI 命令权限（禁 `pnpm add/remove/update/clean:cache`，裁决 5）                     |
| §13.2.2        | 新增         | 底座 / 工程文件改动必须单独 PR                                                     |
| §13.3          | 重写         | 14 条通用硬规则                                                                    |
| §13.4          | **新增**     | AI 任务接入 8 步 Checklist                                                         |
| §14            | **整章重写** | 必做 / 暂缓三级 / 禁止提前做 / 永不反推矩阵                                        |
| §16            | 重写         | 三级分级（🔴/🟡/🟢）阅读清单                                                       |
| §17            | **整章重写** | PR-1 ~ PR-8 拆分路线 + 多产品复用策略 + 第一阶段 DoD 汇总                          |
| §18            | **新增**     | 本节（Review 修订记录）                                                            |

#### 18.1.3 v0.2 采纳的 review 建议

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
- ✅ Agent 2：双 whiteList 说明
- ✅ Agent 2：三层权限决策树
- ✅ Agent 2：拍平因果（keep-alive 二级限制）
- ✅ Agent 2：Tailwind v4 与 v3 语法差异警告
- ✅ Agent 2：`isRefreshing` 单 refresh 多请求队列说明（间接补强）
- ✅ Agent 3：所有"反推后端"路径升级为红线
- ✅ Agent 3：返回结构 / `expires` / `expiresIn` 适配明文
- ✅ Agent 3：拒绝倒逼后端实现 refresh
- ✅ Agent 3：演示角色名生命周期
- ✅ Agent 4：AI 命令权限
- ✅ Agent 4：底座单独 PR
- ✅ Agent 4：硬规则增加"禁止 i18n / 禁止硬编码 VITE\_\* / 禁止 `// eslint-disable` 绕过"
- ✅ Agent 4：阅读清单分级
- ✅ Agent 4：8 步任务接入 checklist
- ✅ Agent 5：PR-1 ~ PR-8 拆分
- ✅ Agent 5：每个 PR 添加 DoD
- ✅ Agent 5：多产品复用推荐多 clone
- ✅ Agent 5：第一阶段 / 二阶段 / 三阶段 / 永不 四级分类

#### 18.1.4 v0.2 未采纳的 review 建议（明确原因）

| 建议                                                       | 来源                 | 未采纳原因                                                                       |
| ---------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| **第一阶段物理删除 `src/views/tenant/` 等多租户源码**      | Agent 3              | 裁决 1：源码保留作参考；是否物理删除以单独 PR 决策。                             |
| **第一阶段建立 `src/constants/srvf-dict.ts` 静态字典常量** | Agent 5              | 裁决 6：正式字典以后端为准；前端不得先硬编码正式字典；UI 占位只能 `*.demo.ts`。  |
| **改 `package.json: name` 为 `srvf-web-admin` 作为 PR-1**  | Agent 5              | 多产品复用决定为"独立 clone"，改名由 clone 后的独立仓库自行处理。                |
| **完整 `vite proxy` 配置示例完全照抄**                     | Agent 5              | 已给最小示意，具体 path 与 changeOrigin / rewrite 规则等待 NestJS 真实路径确认。 |
| **新增 `eslint.config.js` 放宽规则**                       | Agent 2（间接）      | `--max-warnings 0` 是有意为之，本文档明确要求"改代码满足规则，禁止 disable"。    |
| **直接在 `src/views/welcome/` 放业务数据**                 | 个别建议             | welcome 占位仅放 dashboard 框架，不放真实业务数据。                              |
| **monorepo 复用方案作为第一阶段**                          | Agent 5 提及但未推荐 | `08-starter-derivation.md` §17.3 明确不推荐第一阶段引入 monorepo。               |

#### 18.1.5 v0.2 仍待确认事项（Open Questions）

1. **NestJS 返回结构**：是否 `{ code, message, data }` / `{ data, meta }` / `{ success, data, error }`？由后端确认后才能写 `05-http-api.md` §7.5 的拦截器适配代码。
2. **NestJS 是否有 refresh-token 机制**：决定 `05-http-api.md` §7.6 走"保留"还是"降级"。
3. **NestJS `expires` 字段格式**：日期字符串 / unix ms / `expiresIn` 秒数？决定 `setToken` 改法。
4. **后端真实角色名**：决定 PR-4 / PR-5 中 `mock/asyncRoutes.ts` 与 `src/router/modules/<业务>-*.ts` 的 `meta.roles` 写法。
5. **后端 API 路径前缀**：`/api/v1/*`? `/v1/*`? 直接 `/`? 决定 `vite.config.ts: server.proxy` 配置。
6. **NestJS 是否提供 BizCode / 错误码映射表**：决定是否 / 何时建 `src/utils/message.ts` 周围的 `bizCodeToMessage`。
7. **业务侧组织架构 / 活动模型最终字段**：决定 PR-7 / PR-8 占位页未来如何接真接口。
8. **后端是否提供菜单管理 API**：决定动态菜单（`03-router-menu.md` §5.2.1）的 long-term 走向，但**第一阶段一律禁用**。
9. **U Studio / U Agents 是否需要独立后端**：决定多产品克隆策略的细节（独立账号体系？独立 NestJS？）。
10. **CI / 部署目标**：是否 Docker、是否反代、是否 Nginx，决定 `09-pr-roadmap.md` §17 的扩展节点。

### 18.2 v0.2.1（定向回归 review 后的小补丁）

**触发**：3-agent 回归 review（后端契约 / AI 约束 / 落地路线），10 条 Blocking 全部按裁决落地。

#### 18.2.1 v0.2.1 落地的 10 条 sentence-level 补丁（BL-1 ~ BL-10）

| 编号  | 位置                                                | 补丁要点                                                                                                                  |
| ----- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| BL-1  | §5.2.1（现 `03-router-menu.md`）                    | "即便后续由人类批准启用 asyncRoutes，也必须由后端先独立设计菜单 schema / API；前端字段不得反推后端表结构"                 |
| BL-2  | §11.2 菜单管理行（现 `08-starter-derivation.md`）   | "等待后端"列改为"无（第一阶段一律禁启 asyncRoutes，与后端是否已有菜单 API 无关）"                                         |
| BL-3  | §14.4 日历行（现 `08-starter-derivation.md` §14.4） | 追加"、事件类型、状态机（draft / published / cancelled 等）"                                                              |
| BL-4  | §7.6 表格上方（现 `05-http-api.md`）                | "前端刷新队列是前端内部优化，refresh-token 是后端架构选择；两者独立。后端无 refresh 时前端降级，禁止反推后端实现 refresh" |
| BL-5  | §13.4 Step 1 输出列（现 `02-ai-rules.md`）          | 追加"并明确写：本任务是否涉及后端字段 / 表 / API 路径定义？若涉及，逐项列出"                                              |
| BL-6  | §13.2.1 末尾（现 `02-ai-rules.md`）                 | "直接编辑 `package.json` 的 `dependencies / devDependencies / engines / pnpm` 字段视同 `pnpm add / update`，同样禁止"     |
| BL-7  | §13.3 第 13 条（现 `02-ai-rules.md`）               | "任何 `import.meta.env.VITE_*` 取值不得在源码侧附带默认值 / fallback；若需默认值，写入 `.env` 并由人类确认"               |
| BL-8  | §13.1 `mock/**` 行（现 `02-ai-rules.md`）           | 权限由 ⚠️ 改为 ❌；备注与 §8.5 对齐                                                                                       |
| BL-9  | §5.2.1 新增（现 `03-router-menu.md`）               | 5 条 asyncRoutes 禁止触发项清单                                                                                           |
| BL-10 | §8.5 第 2 条（现 `06-mock-risk.md`）                | 首句改为"默认禁止新增任何 mock；仅在极端情况下允许 `*.demo.ts` 临时占位"                                                  |

### 18.3 v0.3（专题拆分 + 渐进式加载）

**触发**：单体 1611 行的 baseline 难以让 AI 按需加载，且 starter 已派生使用，需要在仓库层面做分章节专题化。

#### 18.3.1 拆分动作

- 主入口 `docs/pure-admin-max-ts-baseline.md` 由单体瘦身为 200~400 行的"导航 / 红线 / 索引 / PR 摘要"。
- 新增 `docs/pure-admin/01~11-*.md` 11 份专题文档，承接细节。
- 每份专题文档统一带 4 段头：本文适用任务 / 必须先读 / 禁止事项 / 相关关键文件路径。
- v0.2.1 的 10 条补丁与所有红线、AI 规则、PR 路线、未采纳清单等全部在专题文档中保留。

#### 18.3.2 章节迁移映射

| 原主入口章节              | 迁移到                           |
| ------------------------- | -------------------------------- |
| §0、§0.5、§17 摘要        | 主入口（保留）                   |
| §1 / §2 / §3 / §4         | `01-project-map.md`              |
| §5                        | `03-router-menu.md`              |
| §6                        | `04-auth-permission.md`          |
| §7                        | `05-http-api.md`                 |
| §8                        | `06-mock-risk.md`                |
| §9 / §10 / §12            | `07-max-ts-modules.md`           |
| §11、§14.4、§17.3         | `08-starter-derivation.md`       |
| §14、§17（PR 路线 + DoD） | `09-pr-roadmap.md`               |
| §13、§16                  | `02-ai-rules.md`                 |
| §15（风险清单）           | `09-pr-roadmap.md` 末尾          |
| §18（本节）               | `10-review-log.md`（**本文件**） |
| 新增上游同步策略          | `11-upstream-sync.md`            |

#### 18.3.3 v0.3 未触碰范围

- 业务代码（`src/**`、`mock/**`、`build/**`）：未触碰；
- 配置（`vite.config.ts / tsconfig / package.json / pnpm-lock.yaml`）：未触碰；
- `.env*` / `public/**` / `types/**`：未触碰；
- 根 `README.md`：未触碰；
- 任何依赖（无 pnpm 命令执行）：未触碰；
- v0.2 / v0.2.1 的所有裁决：完整保留，仅文本位置改变。

### 18.4 历史版本

| 版本   | 触发 / 范围         | 摘要                                                                                    |
| ------ | ------------------- | --------------------------------------------------------------------------------------- |
| v0.1   | 初版                | 建立 17 章 baseline 骨架（单体长文档）                                                  |
| v0.2   | 5-agent review      | 新增 §0.5 / §13.4 / §18；重写 §10 / §11 / §13 / §14 / §17；补充 §5 / §6 / §7 / §8 / §16 |
| v0.2.1 | 3-agent 回归 review | 10 条 sentence-level 补丁（BL-1 ~ BL-10），无章节增删                                   |
| v0.3   | 渐进式加载改造      | 主入口瘦身 + `docs/pure-admin/01~11-*.md` 11 份专题；新增上游同步策略章                 |

### 18.6 PR-3 实际验证记录（本地运行与构建）

> 仅追加。本节为 PR-3 实际执行结果存档；操作明细见 `docs/pure-admin/setup-notes.md`。

#### 18.6.1 验证环境

| 项        | 值                                    |
| --------- | ------------------------------------- |
| Node      | v22.15.0                              |
| pnpm      | 10.14.0                               |
| OS        | Darwin / arm64（macOS Apple Silicon） |
| 起始 HEAD | `499cee4`（PR-2 提交）                |
| 验证日期  | 2026-05-15                            |

#### 18.6.2 检查结果

| 步骤                  | 结果                | 备注                                                                                                                                            |
| --------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`        | ✅ 成功（4m 38.6s） | **lockfile 未变化**（md5 完全一致，行数 7581 不变）；`node_modules` 约 797M；`husky prepare` 已触发                                             |
| `pnpm typecheck`      | ✅ exit 0           | 零错零警                                                                                                                                        |
| `pnpm lint`（首次）   | ❌ exit 1           | `mock/asyncRoutes.ts:97 'tenantManagementRouter' is assigned a value but never used`（PR-2 副作用）                                             |
| **lint 修复**         | —                   | 采纳方案 A：`tenantManagementRouter` → `_tenantManagementRouter`；同步改 data 数组注释；**对象内容不变、不恢复进 data 数组**（裁决 1 完整保留） |
| `pnpm lint`（修复后） | ✅ exit 0           | eslint + prettier + stylelint 三件套全部通过；**未使用 `// eslint-disable`、未改 `eslint.config.js`**                                           |
| `pnpm build`          | ✅ exit 0（3.24s）  | dist 约 2.6M                                                                                                                                    |
| `pnpm dev`            | ✅ 1236ms ready     | HTTP 200 @ `localhost:8848`；浏览器内行为待人类手动验证                                                                                         |
| `dist` mock 剥离 grep | ✅ 通过             | `vitePluginFakeServer / defineFakeRoute / tenantManagementRouter` 全部 0 命中                                                                   |
| `dist` 演示 URL 残留  | ⚠️ 每个 URL 1 命中  | 属 `src/api/*.ts` 业务函数硬编码 URL，**不是 mock server 注入**；归属 PR-4 替换                                                                 |

#### 18.6.3 PR-3 实际修改清单

| 文件                               | 改动                                                                                                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mock/asyncRoutes.ts`              | `const tenantManagementRouter` → `const _tenantManagementRouter`；data 数组注释中 `// tenantManagementRouter` → `// _tenantManagementRouter`；新增 2 行说明注释（PR-3 修复理由） |
| `docs/pure-admin/setup-notes.md`   | 新增（PR-3 全程验证记录），§3.2 记录首次失败 + 修复方案 + 二次成功；§6 已知问题表标记原 #1 已闭环；§7 下一步移除"待裁决"等待项                                                   |
| `docs/pure-admin/10-review-log.md` | 追加本节 §18.6（仅 append）                                                                                                                                                      |

#### 18.6.4 PR-3 显式未触碰清单

- `src/**`、`src/router/asyncRoutes.ts`、`src/views/login/index.vue`、`src/utils/http/**`、`src/utils/auth.ts`、`src/api/**`、`src/store/**`、`src/views/tenant/**`：全部未触碰；
- `build/**`、`.env*`、`vite.config.ts`、`tsconfig.json`、`public/**`、`types/**`、`README.md`：未触碰；
- `package.json`、`pnpm-lock.yaml`：未触碰（lockfile md5 验证未变化）；
- `eslint.config.js / stylelint.config.js / .prettierrc.js / commitlint.config.js / .husky/**`：未触碰；
- 任何 `pnpm add/remove/update/clean:cache`：未执行；
- 未接 NestJS、未写 SRVF 业务页面、未启用 asyncRoutes、未补 `getMenuList`、未改 proxy、未改依赖。

#### 18.6.5 PR-3 DoD 落地核查

对照 `09-pr-roadmap.md` §17.2 PR-3 的 5 项 DoD：

- [x] `pnpm install` 通过
- [x] `pnpm dev` 启动无错；HTTP 200 @ localhost:8848（默认登录浏览器侧由人类验证 admin/admin123）
- [x] `pnpm typecheck` 零错
- [x] `pnpm lint` 零错零警（修复后）
- [x] `pnpm build` 成功

#### 18.6.6 残留问题（与 §18.5 一致，不重复）

- `vite.config.ts: server.proxy`：后置 PR-4 前（依赖 Open Question #5）；
- `build/utils.ts:59`：上游遗留 BL-7，留作底座单独 PR；
- `src/api/*.ts` 演示 URL：属 PR-4 替换范畴；
- Open Questions #1~#5：未答，阻塞 PR-4 启动。

### 18.5 PR-2 实际调整记录（模板污染源关闭）

> 仅追加。本节为 PR-2 实际执行结果存档，不重写文档主体规则。规则仍以 `02-ai-rules.md`、`06-mock-risk.md`、`09-pr-roadmap.md` PR-2 节为准。

#### 18.5.1 本轮实际修改清单

| 文件                               | 改动                                                                                                               | 对应裁决 / 红线                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `build/plugins.ts` L43-48          | `vitePluginFakeServer({ ..., enableProd: true → false })`；保留开发环境 mock                                       | 裁决 4、`06-mock-risk.md` §8.5 第 4 条 |
| `.env` L7-9                        | `VITE_ENABLE_TENANT = true → false`，注释说明"PR-2 starter 第一阶段一律禁用多租户运行入口；源码保留作参考"         | 裁决 1、主入口红线 3                   |
| `mock/asyncRoutes.ts` L134-141     | data 数组中 `tenantManagementRouter` 注释；`const tenantManagementRouter`（L97-124）**保留作为参考范式，禁止删除** | 裁决 1、主入口红线 3                   |
| `docs/pure-admin/10-review-log.md` | 追加本节 §18.5（仅 append）                                                                                        | ——                                     |

#### 18.5.2 本轮显式**未触碰**清单（按红线 / 裁决保留）

- `src/router/asyncRoutes.ts`、`src/api/system.ts`、`src/views/login/index.vue`、`src/utils/http/**`、`src/utils/auth.ts`、`src/store/**`、`src/views/tenant/**` 等 src 全域：未触碰；
- `package.json`、`pnpm-lock.yaml`、`vite.config.ts`、`tsconfig.json`、`public/platform-config.json`、`README.md`：未触碰；
- 任何 `pnpm add/remove/update/install/clean:cache`：未执行；
- `src/router/asyncRoutes.ts` 中的 `getMenuList` import：保留，不补 `getMenuList`、不切 login import（裁决 2）。

#### 18.5.3 残留的上游污染源（不在 PR-2 授权范围，需后续单独 PR）

| 残留点                                                      | 性质                                                                                                                                                                                                       | 处置建议                                                                  |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `build/utils.ts:59` `VITE_ENABLE_TENANT: "true"` 默认值兜底 | 技术上违反 BL-7（`VITE_*` 不得在源码侧附带 fallback），但 `build/**` 是 ❌ 文件且**不在 PR-2 授权范围**；当 `.env` 提供值时此默认值会被 `wrapperEnv` L63-71 循环覆盖，**不影响 PR-2 关闭多租户的实际效果** | 留作后续"底座 PR"按 `02-ai-rules.md` §13.2.2 单独评估；不在本阶段强行处理 |

#### 18.5.4 PR-2 DoD 落地核查

对照 `09-pr-roadmap.md` §17.2 PR-2 的 DoD：

- [x] `pnpm dev` 后侧栏无"租户管理"菜单 —— **逻辑预期满足**（`mock/asyncRoutes.ts` data 数组已移除 `tenantManagementRouter`）；实际跑 `pnpm dev` 由人类验证或下一轮 PR-3 验证 PR。
- [x] `pnpm build` 后产物中 mock 不再被 ship 到生产 —— **逻辑预期满足**（`enableProd: false`）；实际产物校验由 PR-3 完成。
- [-] `vite.config.ts: server.proxy` 配置可被 `pnpm dev` 加载 —— **本轮未做**。理由：依赖 Open Question #5（后端 API 路径前缀），未确认前不动 `vite.config.ts`，避免抄错 + 避免动 ❌ 文件无评估。建议作为 PR-2.1 或 PR-4 前置步骤，由人类回答 #5 后单独提。

#### 18.5.5 PR-2 边界自检

- 是否启用 `asyncRoutes`：❌ 未启用，未碰 `src/router/asyncRoutes.ts`、未补 `getMenuList`、未改 `src/views/login/index.vue` 的 import；
- 是否反推后端：❌ 未提任何后端字段 / 表 / 接口要求；
- 是否新增 mock：❌ 未新增任何 mock 文件；
- 是否硬编码 `VITE_*` fallback：❌ 未在源码侧新增 fallback（残留的 `build/utils.ts:59` 属上游遗留，见 §18.5.3）；
- 是否改 `package.json` 依赖字段 / 执行 pnpm 写命令：❌ 未发生。
