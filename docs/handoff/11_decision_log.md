# 11 决策记录

| ID    | 日期       | 决策                                                                                                 | 类型 | 状态 | 不得回退点                                                           |
| ----- | ---------- | ---------------------------------------------------------------------------------------------------- | ---- | ---- | -------------------------------------------------------------------- |
| D-001 | 2026-07-05 | 以 `srvf-admin-web_git-main_c2001c9_20260705.zip` 作为本轮前端分析和文档补齐基准                     | 版本 | 生效 | 不把参考包或历史聊天当作当前文件事实                                 |
| D-002 | 2026-07-05 | 真实后端以 `BA7IEE/srvf-nest-api` 当前 main 的 `docs/current-state.md` 和 live `/api/docs-json` 为准 | 接口 | 生效 | 不从 pure-admin mock 或旧 README 定义后端契约                        |
| D-003 | 2026-07-05 | PR-4 已上线，README 旧的 PR-4 暂停口径废弃                                                           | 文档 | 生效 | 不回退到禁止真实 API 的状态                                          |
| D-004 | 2026-07-05 | 大参考包只读参考，不进入版本血缘                                                                     | 架构 | 生效 | 不直接覆盖当前仓库                                                   |
| D-005 | 2026-07-05 | 下一步先修 `/get-async-routes` 残留依赖，再做 scoped-authz 扩展                                      | 技术 | 生效 | 不在主链风险未修时做大规模 UI 重构                                   |
| D-006 | 2026-07-05 | P0 修复采用静态菜单初始化方案：删除 `src/api/routes.ts`，`initRouter()` 不再请求后端菜单树           | 技术 | 生效 | 不恢复 `/get-async-routes` 生产主链，不启用 `asyncRoutes`            |
| D-007 | 2026-07-05 | 用户本地验证通过后，将 `7.0.1-p0.routes` 标记为 LOCAL_TEST_PASS，可作为下一轮开发基准                | 验证 | 生效 | 不再把该版本标记为未验证，除非后续复现失败                           |
| D-008 | 2026-07-05 | P1.1 先接 meta-workbench，不展开 scoped-authz 大模块                                                 | 技术 | 生效 | 不把 memberships / positions / role-bindings / action-state 混入本轮 |
| D-009 | 2026-07-05 | 用户本地验证通过后，将 `7.1.0-p1.meta-workbench` 标记为 LOCAL_TEST_PASS                              | 验证 | 生效 | 不再把该版本标记为未验证，除非后续复现失败                           |

## D-003 详情：PR-4 状态纠偏

- 背景：README 仍写 PR-4 暂停，但 AGENTS、CLAUDE、集成文档和源码均显示真实登录已上线。
- 结论：当前以 PR-4 已上线为准。
- 影响：auth 文件是活跃代码，但仍属于高风险主链，修改必须声明影响。
- 相关文件：`README.md`、`AGENTS.md`、`CLAUDE.md`、`docs/srvf-api-contract-readiness.md`、`docs/srvf-api-integration-guide.md`。

## D-006 详情：P0 路由初始化补丁

- 背景：真实后端没有 `/get-async-routes` 菜单树接口，生产 mock 不启用时登录后可能失败。
- 结论：前端继续使用 `src/router/modules/*.ts` 静态路由，`initRouter()` 只负责初始化静态菜单和权限过滤。
- 影响：`src/router/utils.ts` 是 route 主链高风险文件；本次只改初始化分支，不改登录请求、token、http refresh 或业务页面。
- 验证：源码中不再存在生产调用链；仍需本地 `typecheck/build/dev` 和真实登录冒烟。

## D-007 详情：P0 路由补丁本地验证通过

- 背景：当前环境无法运行 pnpm，需用户本地完成构建和浏览器验证。
- 用户反馈：`pnpm install --frozen-lockfile` 已补跑，`pnpm typecheck` 通过，`pnpm build` 通过，`pnpm dev` 启动成功，真实后端登录成功，Network 未出现 `/get-async-routes`，刷新菜单正常。
- 结论：`7.0.1-p0.routes` 可作为下一轮开发基准。
- 备注：一次 401 来自页面预填旧密码 `admin123`，不代表补丁失败。

## D-008 详情：P1.1 meta-workbench 小切片

- 背景：后端 v0.37 新增 `dashboard-summary`，且 `resolve-labels` 可为后续 scoped-authz 页面复用。
- 结论：本轮只做 meta API、工作台摘要卡片、登录页旧密码清空。
- 约束：缺权限 block 不显示为 0；摘要失败不影响下方横扫；不恢复 `/get-async-routes`；不改依赖。
- 验证：用户本地 `pnpm typecheck`、`pnpm build`、`pnpm dev`、真实后端登录、dashboard-summary Network、工作台摘要和控制台验证均通过。

## D-009 详情：P1.1 meta-workbench 本地验证通过

- 背景：当前环境无法运行 pnpm，需用户本地完成构建和浏览器验证。
- 用户反馈：`pnpm typecheck` 通过，`pnpm build` 通过，`pnpm dev` 启动成功，登录页密码为空，真实后端登录成功，`GET /api/admin/v1/meta/dashboard-summary` 返回 200，Network 未出现 `/get-async-routes`，工作台摘要与报名/考勤列表正常，控制台无 error/warn/issue。
- 结论：`7.1.0-p1.meta-workbench` 可作为下一轮开发基准。
- 备注：当前 validated 包仅同步验证文档，源码等同 `srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip`。
