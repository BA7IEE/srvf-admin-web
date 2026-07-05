# 20 文档同步检查清单

## 一、本轮 validation sync 已检查

- [x] `VERSION` 保持为 `7.1.0-p1.meta-workbench`。
- [x] `changed_files.txt` 已更新为验证状态同步清单。
- [x] `project_state.json` 已更新为 `LOCAL_TEST_PASS`。
- [x] `README.md` / `USAGE.md` 已更新。
- [x] `00_new_chat_start.md` / `01_current_state.md` 已更新。
- [x] `07_release_log.md` / `08_next_steps.md` 已更新。
- [x] `10_package_manifest.md` / `12_task_board.md` 已更新。
- [x] `15_api_contracts.md` / `17_test_evidence.md` 已更新。
- [x] `23_package_lineage.md` / `24_validation_matrix.md` 已更新。
- [x] `28_user_feedback_log.md` / `29_doc_conflict_map.md` / `30_handoff_self_check.md` 已更新。

## 二、按改动类型检查

### validation docs sync

- [x] 未修改 `src/` 源码。
- [x] 未恢复 `src/api/routes.ts`。
- [x] 未启用 `src/router/asyncRoutes.ts`。
- [x] 未新增或实现 `getMenuList`。
- [x] 未修改登录 API、token、refresh、HTTP 拦截器或业务页面。
- [x] 未修改依赖。
- [x] 未修改数据库或部署。

### 用户本地验证记录

- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `pnpm dev` 启动成功，实际端口 `http://localhost:8850/`。
- [x] 登录页密码框为空。
- [x] 真实后端登录成功。
- [x] `GET /api/admin/v1/meta/dashboard-summary` 状态 200。
- [x] Network 未出现 `/get-async-routes`。
- [x] 工作台摘要正常显示。
- [x] 报名审批 / 考勤审批正常加载。
- [x] 控制台无 error / warn / issue。

### 安全

- [x] 未写入真实 API Key、数据库密码、私钥、证书。
- [x] `.env*` 仅保留原项目 Vite 公共配置。

## 三、当前未完成但不阻塞 7.1.0 的事项

- [ ] `tests/render/tabs_render_pass.py`：本次用户未跑 Playwright render smoke。
- [ ] v7.8.0 scoped-authz 包血缘核对。
- [ ] P1.2 memberships-read 开发前分析。
