# 29 文档冲突地图

## 一、冲突表

| ID    | 旧口径                                                             | 新口径                                                                                                            | 以哪个文档为准                                                                                                    | 状态                 | 说明                                                                                  |
| ----- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| C-001 | README 写 PR-4 NestJS 登录对接暂停，禁止真实 API，禁止改 auth 主链 | PR-4 已上线；真实登录链路已接 `/api/auth/v1/login`、`/api/admin/v1/me`、`/api/system/v1/rbac/me/permissions`      | `CLAUDE.md`、`AGENTS.md`、`docs/srvf-api-contract-readiness.md`、`docs/srvf-api-integration-guide.md`、本 handoff | 已处理               | README 已更新，原文归档到 `docs/archive/old_docs/README_before_handoff_20260705.md`   |
| C-002 | 部分旧文档权限码数量写 155 / 163                                   | 后端 current-state v0.37.0 写 195 权限码、320 routes、35 modules                                                  | 后端 `srvf-nest-api/docs/current-state.md` + live `/api/docs-json`                                                | 生效                 | 旧数量只能看作历史，精确值需实时核对                                                  |
| C-003 | 前端存在 `/get-async-routes` 生产主链调用                          | `7.0.1-p0.routes` 已改为静态菜单初始化并删除 `src/api/routes.ts`；用户本地验证 Network 未出现 `/get-async-routes` | `src/router/utils.ts` + `17_test_evidence.md` + 本 handoff                                                        | 已处理并本地验证通过 | 不得恢复该接口到生产主链                                                              |
| C-004 | 当前上传包是 `git-main_c2001c9`                                    | 用户前序确认通过的是 `v7.8.0_scoped-authz-browser-smoke` 包；当前 `7.0.1-p0.routes` 已单独本地验证通过            | `23_package_lineage.md`                                                                                           | 部分缓解，仍待核对   | 当前包可作为下一轮开发基准，但不能自动继承 v7.8.0 的 Playwright scoped-authz 测试资产 |
| C-005 | 旧队员 department 单归属页面仍存在                                 | 后端 admin-web 文档要求 memberships 作为终态组织归属方向                                                          | 后端 `docs/handoff/admin-web.md`                                                                                  | 待迁移               | 不一定立即删除旧接口，但新增功能应按 memberships 设计                                 |
| C-007 | dashboard-summary 缺权限块是否显示为 0                             | 后端语义是缺权限 block 静默省略，不能显示成 0                                                                     | 后端 `MetaController` / `meta.dto.ts` + 用户本地验证                                                              | 已处理并本地验证通过 | 工作台只渲染实际存在 block；用户确认未把缺权限 block 渲染成 `0`                       |
| C-006 | 登录页预填旧密码 `admin123`                                        | `7.1.0-p1.meta-workbench` 已清空默认密码；真实后端开发账号仍为 `admin / ChangeMe123456`                           | `src/views/login/index.vue` + 用户本地验证反馈                                                                    | 已处理并本地验证通过 | 用户确认密码框为空，不再预填旧密码                                                    |

## 二、冲突处理规则

- 发现冲突先登记，不要直接按旧文档开发。
- 涉及后端事实时，以后端 current-state + live OpenAPI 为准。
- 涉及包血缘时，以 `23_package_lineage.md` 为准。
- 涉及下一步任务时，以 `08_next_steps.md` 和 `12_task_board.md` 为准。

## 三、当前唯一可信口径

- 当前项目状态：`01_current_state.md`。
- 机器可读状态：`project_state.json`。
- 包血缘：`23_package_lineage.md`。
- 旧文档冲突：本文件。
- 后端接口：`srvf-nest-api` live `/api/docs-json`。
