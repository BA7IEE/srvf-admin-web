# 12 任务台账

## 状态枚举

```text
TODO / IN_PROGRESS / CODE_DONE / BUILD_PASS / LOCAL_TEST_PASS / DEPLOY_PASS / USER_CONFIRMED / BLOCKED / CANCELLED / ARCHIVED
```

## 任务表

| ID    | 任务                               | 优先级 | 状态            | 关联文件                                                     | 测试状态                                            | 关联包                                                                                                               | 备注                                  |
| ----- | ---------------------------------- | ------ | --------------- | ------------------------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| T-001 | 初始化 handoff 文档体系            | P0     | CODE_DONE       | `docs/handoff/*`、`project_state.json`、`README.md`          | handoff 自检通过                                    | `srvf-admin-web_v7.0.0-docs.1_handoff_full_20260705.zip` / `srvf-admin-web_v7.0.0-docs.1_handoff_delta_20260705.zip` | 只改文档                              |
| T-002 | 修复 `/get-async-routes` 残留依赖  | P0     | LOCAL_TEST_PASS | `src/router/utils.ts`、删除 `src/api/routes.ts`              | 用户本地 typecheck/build/dev/真实登录/刷新验证通过  | `srvf-admin-web_v7.0.1-p0.routes_full_20260705.zip` / `srvf-admin-web_v7.0.1-p0.routes_delta_20260705.zip`           | 主链风险已小步修复并验证              |
| T-006 | 本地验证 P0 路由补丁               | P0     | LOCAL_TEST_PASS | 全项目                                                       | 用户本地验证通过                                    | `srvf-admin-web_v7.0.1-p0.routes_full_20260705.zip`                                                                  | Network 未出现 `/get-async-routes`    |
| T-004 | 核对当前包与 v7.8.0 通过包血缘     | P0     | TODO            | package manifest、git commit、测试文件                       | 未测试                                              | 待定                                                                                                                 | 当前包缺少 scoped_authz_smoke.py      |
| T-003 | 对齐后端 v0.37 scoped-authz 缺口表 | P1     | TODO            | API 层、路由、系统管理页、队员/组织页                        | 未测试                                              | 待定                                                                                                                 | 先做缺口表，再开发                    |
| T-008 | P1.2 memberships-read 开发前分析   | P1     | NEXT            | members cockpit、memberships API、旧 department Tab          | 未测试                                              | 待定                                                                                                                 | 只分析，不改代码；不删除旧 department |
| T-005 | 工作台 dashboard-summary 接线      | P1     | LOCAL_TEST_PASS | `src/api/srvf-meta.ts`、`src/views/srvf/workbench/index.vue` | 用户本地 typecheck/build/dev/真实后端工作台验证通过 | `srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip`                                                          | 后端 v0.37 新接口；按 block 动态渲染  |
| T-007 | 登录页旧预填密码处理               | P1     | LOCAL_TEST_PASS | `src/views/login/index.vue`                                  | 用户本地验证密码框为空                              | `srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip`                                                          | 已清空旧密码预填                      |

## 当前进行中任务

- 暂无进行中任务。下一步建议启动 T-008：P1.2 memberships-read 开发前分析。

## 已完成且用户确认任务

- `7.1.0-p1.meta-workbench`：用户反馈 `pnpm typecheck`、`pnpm build`、`pnpm dev`、真实后端登录、dashboard-summary Network、工作台摘要、报名/考勤列表和控制台均通过。
- `7.0.1-p0.routes`：用户反馈 `pnpm install --frozen-lockfile`、`pnpm typecheck`、`pnpm build`、`pnpm dev`、真实后端登录、Network 检查、刷新菜单均通过。
- 前序用户反馈 `srvf-admin-web_v7.8.0_scoped-authz-browser-smoke_full_20260703.zip` 测试通过；本轮未拿到该包，不能直接验血缘。

## 阻塞任务

| ID    | 阻塞原因                                         | 需要谁处理         | 解除条件                                  |
| ----- | ------------------------------------------------ | ------------------ | ----------------------------------------- |
| T-004 | 缺少 v7.8.0 通过包与当前 c2001c9 的 git/文件对照 | 用户或下一轮开发者 | 上传/定位 v7.8.0 包或提供 git commit 差异 |
