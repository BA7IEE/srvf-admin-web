# 01 当前项目状态

## 一、版本与包状态

| 项                    | 当前值                                                                 |
| --------------------- | ---------------------------------------------------------------------- |
| 当前版本              | `7.1.0-p1.meta-workbench`                                              |
| 最新 validated 完整包 | `srvf-admin-web_v7.1.0-p1.meta-workbench_validated_full_20260705.zip`  |
| 最新 validated 增量包 | `srvf-admin-web_v7.1.0-p1.meta-workbench_validated_delta_20260705.zip` |
| 源码等同包            | `srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip`            |
| 源码等同包 SHA256     | `67a4ba7c3d18b283aa3381acf627b7dd037c5199230076a8335abfc9bbdd8b45`     |
| 基于验证包            | `srvf-admin-web_v7.0.1-p0.routes_validated_full_20260705.zip`          |
| 当前验证状态          | LOCAL_TEST_PASS                                                        |
| 最后更新时间          | `2026-07-05 P1 meta-workbench local validation recorded`               |

## 二、当前阶段

前端已完成：

- PR-4 真实登录接入。
- P0 路由初始化修复：不再请求 `/get-async-routes`。
- P1.1 meta-workbench：工作台接 `GET /api/admin/v1/meta/dashboard-summary`，预置 `POST /api/admin/v1/meta/resolve-labels`。
- 登录页清空旧密码 `admin123`。

当前阶段：`7.1.0-p1.meta-workbench` 已由用户本地验证通过，可作为下一轮开发基准。

## 三、用户本地验证结果

| 验证项              | 结果                                                             |
| ------------------- | ---------------------------------------------------------------- |
| `pnpm typecheck`    | 通过                                                             |
| `pnpm build`        | 通过                                                             |
| `pnpm dev`          | 启动成功，端口 `http://localhost:8850/`，验证后已停止            |
| 登录页              | 密码框为空，不再预填 `admin123`                                  |
| 真实后端登录        | `admin / ChangeMe123456` 成功                                    |
| dashboard-summary   | `GET /api/admin/v1/meta/dashboard-summary` 状态 200              |
| `/get-async-routes` | Network 未出现                                                   |
| 工作台摘要          | 待审报名 `0`、考勤待一级审核 `1`、考勤待终审 `2`、进行中活动 `0` |
| 缺权限 block 语义   | 未把缺权限 block 渲染成 `0`                                      |
| 报名审批            | 正常加载为空态                                                   |
| 考勤审批            | 正常加载 1 条记录                                                |
| 控制台              | 无 error / warn / issue                                          |

## 四、后端权威状态

- 真实后端仓库：`https://github.com/BA7IEE/srvf-nest-api`
- 当前以后端 `docs/current-state.md`、`docs/handoff/admin-web.md` 和 live `/api/docs-json` 为准。
- 2026-07-05 已知后端记录：v0.37.0，320 条预期路由、195 个权限码、35 个模块、39 个 migration。

## 五、当前禁止项

- 不恢复 `/get-async-routes`。
- 不启用 `src/router/asyncRoutes.ts`。
- 不新增 `getMenuList`。
- 不把 pure-admin mock 当成 SRVF 后端契约。
- 不删除旧 department 页面，除非 migrations / memberships 替代方案已验证。
- 不改依赖、`.env*`、token / refresh / HTTP 拦截器，除非任务明确要求。

## 六、下一步建议

进入 `P1.2 memberships-read` 开发前分析：队员详情新增 memberships 只读组织归属，不删除旧 department，不做 scoped-authz 全量展开。
