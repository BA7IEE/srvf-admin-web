# 20 文档同步检查清单

## 一、本轮 handoff refresh 已检查

- [x] `VERSION` 更新为 `git-main-1aba0da-handoff-20260710`。
- [x] `changed_files.txt` 更新为本次文档同步清单。
- [x] `project_state.json` 更新为 `main@1aba0da` / `BUILD_PASS`。
- [x] `00_new_chat_start.md` / `01_current_state.md` 已更新。
- [x] `07_release_log.md` / `08_next_steps.md` 已更新。
- [x] `09_known_issues.md` / `10_package_manifest.md` 已更新。
- [x] `11_decision_log.md` / `12_task_board.md` 已更新。
- [x] `13_code_map.md` / `15_api_contracts.md` 已更新。
- [x] `16_environment_snapshot.md` / `17_test_evidence.md` 已更新。
- [x] `18_rollback_and_recovery.md` / `23_package_lineage.md` 已更新。
- [x] `24_validation_matrix.md` / `28_user_feedback_log.md` 已更新。
- [x] `29_doc_conflict_map.md` / `30_handoff_self_check.md` 已更新。

## 二、改动边界

- [x] 本次未修改 `src/**`。
- [x] 本次未修改 `package.json` / `pnpm-lock.yaml`。
- [x] 本次未修改 `.env*`。
- [x] 本次未启用 `asyncRoutes`。
- [x] 本次未恢复 `/get-async-routes`。
- [x] 本次未修改 auth 高风险文件，只登记 #51 历史事实。

## 三、验证

- [x] 直接 `vue-tsc` 通过。
- [x] 直接 `vite build` 通过。
- [ ] `pnpm typecheck` 入口通过：当前被 pnpm 依赖状态检查阻塞。
- [ ] handoff strict 自检通过：当前脚本误扫依赖目录。
- [ ] 浏览器/dev 后端冒烟。

## 四、当前未完成但不阻塞本次 docs sync 的事项

- [ ] 修复 `scripts/check_handoff_docs.py` 排除规则。
- [ ] 重新跑 handoff strict 自检。
- [ ] 基于 live `/api/docs-json` 重跑前后端 API 对账。
