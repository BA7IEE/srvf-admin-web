# SRVF Admin Web 使用与交接说明

本仓库是 SRVF 后台管理前端，当前已接入真实 `srvf-nest-api` 后端，不再是 PR-4 之前的纯静态占位项目。

## 新聊天 / 新 Agent 接手流程

1. 先读 `docs/handoff/00_new_chat_start.md`。
2. 再读 `project_state.json`、`docs/handoff/01_current_state.md`、`docs/handoff/23_package_lineage.md`、`docs/handoff/29_doc_conflict_map.md`。
3. 如涉及代码，继续读 `CLAUDE.md`、`AGENTS.md`、`docs/pure-admin/02-ai-rules.md`、`docs/pure-admin/03-router-menu.md`。
4. 如涉及真实接口，必须以真实后端仓库 `BA7IEE/srvf-nest-api` 的 `docs/current-state.md`、`docs/handoff/admin-web.md` 和 live `/api/docs-json` 为准。
5. 先输出当前基线、风险、涉及文件和验证方案，再修改。

## 当前版本

- 当前 handoff / 交付版本：`7.1.0-p1.meta-workbench`。
- 最新 validated 完整包：`srvf-admin-web_v7.1.0-p1.meta-workbench_validated_full_20260705.zip`。
- 最新 validated 增量包：`srvf-admin-web_v7.1.0-p1.meta-workbench_validated_delta_20260705.zip`。
- 当前验证状态：`LOCAL_TEST_PASS`，用户本地已通过 `pnpm typecheck`、`pnpm build`、`pnpm dev`、真实后端登录、Network 和工作台摘要验证。
- 源码等同：`srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip`。
- 代码改动来源：P1.1 meta-workbench。
- 生产代码改动：新增 `src/api/srvf-meta.ts`，更新 `src/views/srvf/workbench/index.vue`，清空 `src/views/login/index.vue` 旧密码预填。
- 未改：`package.json`、`pnpm-lock.yaml`、`.env*`、路由主链、权限主链、后端契约。

## 已确认本地验证

用户本地已确认：

```bash
pnpm typecheck
pnpm build
pnpm dev
```

结果：

- `pnpm typecheck` 通过。
- `pnpm build` 通过。
- `pnpm dev` 启动成功，实际端口 `http://localhost:8850/`，验证后已停止。
- 登录页密码框为空，不再预填 `admin123`。
- 真实后端登录 `admin / ChangeMe123456` 成功。
- Network 出现 `GET /api/admin/v1/meta/dashboard-summary`，状态 `200`。
- Network 未出现 `/get-async-routes`。
- 工作台顶部摘要正常显示：待审报名 `0`、考勤待一级审核 `1`、考勤待终审 `2`、进行中活动 `0`。
- dashboard-summary 响应只包含后端返回的 `registrations / attendanceSheets / activities`，没有把缺权限 block 渲染成 `0`。
- “报名审批”正常加载为空态，“考勤审批”正常加载 1 条记录。
- 控制台无 error / warn / issue。

## 后续验证建议

后续开发前仍建议执行：

```bash
python scripts/check_handoff_docs.py --root . --strict
rg -n "@/api/routes|getAsyncRoutes\(|/get-async-routes" src/api src/router/utils.ts src/router/index.ts src/views src/store src/utils
pnpm typecheck
pnpm build
```

如启动端口被占用，Vite 会顺延端口；本次用户实测端口为 `http://localhost:8850/`。

## 下一步建议

下一轮建议进入 `P1.2 memberships-read` 的开发前分析：队员详情新增 memberships 只读“组织归属”Tab，不删除旧 department，不做职务/角色绑定/分管大模块。
