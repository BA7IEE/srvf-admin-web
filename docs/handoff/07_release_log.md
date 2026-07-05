# 07 发布记录

## 7.1.0-p1.meta-workbench — 工作台摘要接线，本地验证通过

| 项                      | 内容                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| 日期                    | 2026-07-05                                                             |
| 类型                    | code_patch + validation_docs_sync                                      |
| 基于                    | `srvf-admin-web_v7.0.1-p0.routes_validated_full_20260705.zip`          |
| 已验证代码完整包        | `srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip`            |
| 已验证代码增量包        | `srvf-admin-web_v7.1.0-p1.meta-workbench_delta_20260705.zip`           |
| 当前文档同步完整包      | `srvf-admin-web_v7.1.0-p1.meta-workbench_validated_full_20260705.zip`  |
| 当前文档同步增量包      | `srvf-admin-web_v7.1.0-p1.meta-workbench_validated_delta_20260705.zip` |
| 已验证代码完整包 SHA256 | `67a4ba7c3d18b283aa3381acf627b7dd037c5199230076a8335abfc9bbdd8b45`     |
| 验证状态                | LOCAL_TEST_PASS：用户本地验证通过                                      |

### 本轮目标

- 接入后端 v0.37 `GET /api/admin/v1/meta/dashboard-summary` 工作台摘要。
- 预置 `POST /api/admin/v1/meta/resolve-labels` API 封装，供后续 scoped-authz 页面复用。
- 工作台顶部按后端返回的可选 block 渲染摘要卡片；缺权限 block 不显示为 0。
- 清空登录页旧密码 `admin123`，避免端测误触发 401。
- 不修改路由主链、权限主链、依赖、`.env*` 或 scoped-authz 大模块。

### 主要变更

- `src/api/srvf-meta.ts`：新增 meta API 类型与请求封装。
- `src/views/srvf/workbench/index.vue`：新增工作台摘要卡片区，失败时不影响下方报名/考勤横扫列表。
- `src/views/login/index.vue`：默认 `password` 从 `admin123` 改为空字符串。
- handoff 文档：同步版本、包血缘、任务台账、API 合同和验证矩阵。

### 用户本地验证结果

- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `pnpm dev`：启动成功，端口 `http://localhost:8850/`，验证后已停止。
- 登录页密码框为空，不再预填 `admin123`。
- 使用 `admin / ChangeMe123456` 登录真实后端成功。
- Network 出现 `GET /api/admin/v1/meta/dashboard-summary`，状态 `200`。
- Network 未出现 `/get-async-routes`。
- 工作台顶部摘要正常显示：待审报名 `0`、考勤待一级审核 `1`、考勤待终审 `2`、进行中活动 `0`。
- dashboard-summary 响应只包含后端返回的 `registrations / attendanceSheets / activities`，没有把缺权限 block 渲染成 `0`。
- “报名审批”正常加载为空态，“考勤审批”正常加载 1 条记录。
- 控制台无 error / warn / issue。

### 下一步

进入 `P1.2 memberships-read` 开发前分析。

## 7.0.1-p0.routes — P0 route init patch，本地验证通过

| 项                 | 内容                                                           |
| ------------------ | -------------------------------------------------------------- |
| 代码包日期         | 2026-07-05 07:52 EDT / 2026-07-05 19:52 CST                    |
| 用户验证反馈       | 2026-07-05 user local validation report                        |
| 类型               | code_patch + validation_docs_sync                              |
| 代码包基于         | `srvf-admin-web_v7.0.0-docs.1_handoff_full_20260705.zip`       |
| 已验证代码完整包   | `srvf-admin-web_v7.0.1-p0.routes_full_20260705.zip`            |
| 已验证代码增量包   | `srvf-admin-web_v7.0.1-p0.routes_delta_20260705.zip`           |
| 当前文档同步完整包 | `srvf-admin-web_v7.0.1-p0.routes_validated_full_20260705.zip`  |
| 当前文档同步增量包 | `srvf-admin-web_v7.0.1-p0.routes_validated_delta_20260705.zip` |
| 验证状态           | LOCAL_TEST_PASS：用户本地验证通过                              |

### 本轮目标

- 移除真实登录 / 刷新路由初始化阶段对 pure-admin mock `/get-async-routes` 的生产依赖。
- 保留前端静态菜单 + 真实登录态 `roles` 过滤。
- 不启用 `src/router/asyncRoutes.ts`。
- 不新增或实现 `getMenuList`。
- 不修改依赖、业务页面、后端契约或 `.env*`。

### 主要变更

- `src/router/utils.ts`：删除 `getAsyncRoutes` / `getConfig().CachingAsyncRoutes` 动态路由请求分支；`initRouter()` 改为 `handleAsyncRoutes([])`。
- `src/api/routes.ts`：删除 pure-admin mock 路由 API 封装，避免 `/get-async-routes` 被误作真实后端接口。
- handoff 文档：同步版本、包血缘、任务台账、验证矩阵和冲突地图。

### 用户本地验证结果

- `pnpm install --frozen-lockfile`：已补跑。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `pnpm dev`：启动成功，实际端口 `http://localhost:8850/`。
- 真实后端登录：`admin / ChangeMe123456` 成功。
- Network XHR/fetch：只出现 `POST /api/auth/v1/login`、`GET /api/admin/v1/me`、`GET /api/system/v1/rbac/me/permissions`。
- 未出现 `/get-async-routes`。
- 刷新页面后菜单正常：首页、工作台、活动、队员、招募与入队、内容发布、通知中心、系统管理。

### 备注

- 控制台一次 401 来自页面预填旧密码 `admin123` 试登失败；改用真实后端开发账号后正常。
- 本次 `validated` 包只同步验证文档，不改源码。

### 下一步

进入后端 v0.37 scoped-authz 缺口表；先分析，不直接大改代码。

## 7.0.0-docs.1 — handoff 文档初始化

| 项            | 内容                                                               |
| ------------- | ------------------------------------------------------------------ |
| 日期          | 2026-07-05 07:15 EDT / 2026-07-05 19:15 CST                        |
| 类型          | docs_only                                                          |
| 基于          | `srvf-admin-web_git-main_c2001c9_20260705.zip`                     |
| 基于包 SHA256 | `e23f33b63137913104901512d94498a6a3a1a454a3f0dbf1cabe8de88efd5492` |
| 最新完整包    | `srvf-admin-web_v7.0.0-docs.1_handoff_full_20260705.zip`           |
| 最新增量包    | `srvf-admin-web_v7.0.0-docs.1_handoff_delta_20260705.zip`          |
| 验证状态      | DRAFT；handoff 自检通过，未运行前端构建                            |

### 本轮目标

- 初始化长期 handoff 体系。
- 修正 README 中 PR-4 已过时口径。
- 登记当前前后端状态、版本血缘、P0 风险和下一步。
- 只补文档，不动生产代码。

### 主要变更

- 新增根 `VERSION`、`USAGE.md`、`project_state.json`、`project_state.example.json`、`changed_files.txt`。
- 新增 `docs/handoff/00` 到 `30` 全套交接文档。
- 新增 `docs/requirements/*` 与 `docs/templates/*`。
- 新增 `scripts/check_handoff_docs.py`，并适配本项目 Vite `.env*` 与模板目录。
- README 当前状态从 PR-4 暂停更新为 PR-4 已上线。
- `docs/srvf-api-integration-guide.md` 追加 v0.37.0 状态提示。

### 测试结果

- 已运行 handoff 自检：通过。
- 未运行 `pnpm typecheck`。
- 未运行 `pnpm build`。
- 未启动前端或后端。

### 下一步

P0 修复生产登录链路中 `/get-async-routes` 残留依赖。
