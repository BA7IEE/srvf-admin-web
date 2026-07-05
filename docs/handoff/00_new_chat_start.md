# 00 新聊天接手入口

## 一、当前接手结论

| 项                      | 当前状态                                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 当前 handoff / 代码版本 | `7.1.0-p1.meta-workbench`                                                                                         |
| 最新 validated 完整包   | `srvf-admin-web_v7.1.0-p1.meta-workbench_validated_full_20260705.zip`                                             |
| 最新 validated 增量包   | `srvf-admin-web_v7.1.0-p1.meta-workbench_validated_delta_20260705.zip`                                            |
| 源码等同包              | `srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip`                                                       |
| 上一验证基准            | `srvf-admin-web_v7.0.1-p0.routes_validated_full_20260705.zip`                                                     |
| 当前验证状态            | LOCAL_TEST_PASS：用户本地 typecheck/build/dev/真实后端登录/Network/工作台摘要验证通过                             |
| 后端权威基准            | `BA7IEE/srvf-nest-api`，以后端 `docs/current-state.md`、`docs/handoff/admin-web.md` 和 live `/api/docs-json` 为准 |

## 二、已验证事实

- P0 `/get-async-routes` 生产链路已移除，用户本地 Network 未出现 `/get-async-routes`。
- P1.1 工作台已接 `GET /api/admin/v1/meta/dashboard-summary`，用户本地 Network 返回 200。
- 登录页密码框为空，不再预填 `admin123`。
- 用户本地 `pnpm typecheck` 通过。
- 用户本地 `pnpm build` 通过。
- 用户本地 `pnpm dev` 启动成功，实际端口 `http://localhost:8850/`。
- 真实后端登录 `admin / ChangeMe123456` 成功。
- 工作台摘要显示：待审报名 `0`、考勤待一级审核 `1`、考勤待终审 `2`、进行中活动 `0`。
- 下方“报名审批”为空态正常，“考勤审批”加载 1 条记录。
- 控制台无 error / warn / issue。

## 三、必须先读文件

1. `project_state.json`
2. `docs/handoff/01_current_state.md`
3. `docs/handoff/23_package_lineage.md`
4. `docs/handoff/24_validation_matrix.md`
5. `docs/handoff/29_doc_conflict_map.md`
6. `docs/handoff/30_handoff_self_check.md`
7. `CLAUDE.md`
8. `AGENTS.md`

## 四、下一步建议

建议下一轮先做 `P1.2 memberships-read` 开发前分析：

- 对照后端 memberships / organizations memberships 接口。
- 队员详情新增“组织归属”Tab，只读接 memberships。
- 不删除旧 department。
- 不做 positions / role-bindings / supervision / action-state 大模块。
- 不启用 asyncRoutes，不恢复 `/get-async-routes`。
- 不改依赖。

## 五、给下一位 AI 的最小指令

```text
请基于 `srvf-admin-web_v7.1.0-p1.meta-workbench_validated_full_20260705.zip` 继续，只分析不改代码。先读取 project_state.json 与 docs/handoff/00/01/23/24/29/30，再对照真实后端 srvf-nest-api v0.37 的 admin-web handoff，分析 P1.2 memberships-read 的最小开发范围。不要恢复 /get-async-routes，不启用 asyncRoutes，不删除旧 department。
```
