# 17 测试证据

## 7.1.0-p1.meta-workbench 本地验证证据

| 时间                                    | 命令 / 验证项                                            | 结果                 | 说明                                                                                              |
| --------------------------------------- | -------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------- |
| 2026-07-05 P1 development               | `python scripts/check_handoff_docs.py --root . --strict` | PASS                 | 0 error(s), 0 warning(s)                                                                          |
| 2026-07-05 P1 development               | `rg -n "@/api/routes                                     | getAsyncRoutes\(     | /get-async-routes" src/api src/router/utils.ts src/router/index.ts src/views src/store src/utils` | PASS                      | 无生产调用链；仅 `src/router/asyncRoutes.ts` 历史注释若全量搜 getAsyncRoutes 会命中 |
| 2026-07-05 P1 development               | `rg -n "dashboard-summary                                | resolve-labels" src` | PASS                                                                                              | 仅命中新 API 与工作台说明 |
| 2026-07-05 user local validation report | `pnpm typecheck`                                         | PASS_BY_USER         | 用户本地验证通过                                                                                  |
| 2026-07-05 user local validation report | `pnpm build`                                             | PASS_BY_USER         | 用户本地验证通过                                                                                  |
| 2026-07-05 user local validation report | `pnpm dev`                                               | PASS_BY_USER         | 用户本地启动成功，端口 `http://localhost:8850/`，验证后已停止                                     |
| 2026-07-05 user local validation report | 登录页密码框                                             | PASS_BY_USER         | 密码框为空，不再预填 `admin123`                                                                   |
| 2026-07-05 user local validation report | 真实后端登录 `admin / ChangeMe123456`                    | PASS_BY_USER         | 登录成功                                                                                          |
| 2026-07-05 user local validation report | `GET /api/admin/v1/meta/dashboard-summary`               | PASS_BY_USER         | Network 出现该请求，状态 200                                                                      |
| 2026-07-05 user local validation report | `/get-async-routes` Network 检查                         | PASS_BY_USER         | 未出现                                                                                            |
| 2026-07-05 user local validation report | 工作台摘要                                               | PASS_BY_USER         | 待审报名 `0`、考勤待一级审核 `1`、考勤待终审 `2`、进行中活动 `0`                                  |
| 2026-07-05 user local validation report | 权限裁剪 block 语义                                      | PASS_BY_USER         | 只渲染后端返回的 `registrations / attendanceSheets / activities`；未把缺权限 block 渲染为 `0`     |
| 2026-07-05 user local validation report | 报名审批 / 考勤审批                                      | PASS_BY_USER         | 报名审批为空态，考勤审批加载 1 条记录                                                             |
| 2026-07-05 user local validation report | 控制台                                                   | PASS_BY_USER         | 无 error / warn / issue                                                                           |

## 当前结论

`7.1.0-p1.meta-workbench` 当前为 `LOCAL_TEST_PASS`，可作为下一轮开发基准。

## 7.0.1-p0.routes 证据

- 用户本地 `pnpm install --frozen-lockfile`、`pnpm typecheck`、`pnpm build`、`pnpm dev`、真实后端登录、Network 检查和刷新菜单均通过。
- P0 `/get-async-routes` 问题仍关闭，本轮未恢复该依赖。

## 历史用户反馈

用户前序反馈 `srvf-admin-web_v7.8.0_scoped-authz-browser-smoke_full_20260703.zip` 已通过：`pnpm typecheck`、`pnpm build`、`pnpm dev`、静态源码守护、Playwright 浏览器冒烟。该包未在本轮上传物中，需后续核血缘。
