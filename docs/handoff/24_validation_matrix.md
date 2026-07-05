# 24 验证矩阵

| 改动类型      | requires_retest | 最低验证                                        | 推荐验证                         | 当前状态                                             |
| ------------- | --------------- | ----------------------------------------------- | -------------------------------- | ---------------------------------------------------- |
| 只改文档      | 否              | `python scripts/check_handoff_docs.py --root .` | 人工读 00/01/23/29/30            | 本轮 validation sync 已执行 handoff 自检             |
| Auth / 登录   | 是              | `pnpm typecheck` + 登录验证                     | refresh / 401 / 过期 / 权限冒烟  | `7.1.0` 登录页旧密码清空已本地验证通过               |
| Router / 菜单 | 是              | `pnpm build` + 页面跳转                         | 生产构建 + 登录后菜单验证        | `/get-async-routes` 未出现，菜单刷新沿用 P0 验证结果 |
| 业务 API 页面 | 是              | `typecheck` + 单页列表验证                      | 后端 seed + 浏览器 CRUD 冒烟     | `7.1.0` 工作台 meta API 已本地验证通过               |
| scoped-authz  | 是              | 权限按钮可用性验证                              | 多角色、多组织、多状态浏览器冒烟 | 未涉及，下一步小切片推进                             |
| 依赖          | 是              | lock diff + build                               | 安全审查 + 回滚方案              | 未涉及                                               |

## 7.1.0-p1.meta-workbench 验证结论

- `pnpm typecheck`：用户本地通过。
- `pnpm build`：用户本地通过。
- `pnpm dev`：用户本地通过，端口 `http://localhost:8850/`。
- 真实后端登录：通过。
- `GET /api/admin/v1/meta/dashboard-summary`：200。
- `/get-async-routes`：未出现。
- 工作台摘要：通过。
- 下方报名/考勤 tabs：通过。
- 控制台：无 error / warn / issue。

当前状态可标记为 `LOCAL_TEST_PASS_BY_USER_MESSAGE`，但未做生产部署验证，不得标记 `DEPLOY_PASS`。
