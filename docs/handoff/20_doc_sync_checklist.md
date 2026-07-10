# 20 文档同步检查清单

## 一、本轮 handoff refresh（git-main-2cca7a3-handoff-20260710,UX 产品化系列收官）已检查

- [x] `VERSION` 更新为 `git-main-2cca7a3-handoff-20260710`。
- [x] `changed_files.txt` 更新为本次文档同步清单。
- [x] `project_state.json` 更新为 `main@2cca7a3` / `BUILD_PASS`。
- [x] `00_new_chat_start.md` / `01_current_state.md` 已更新（含 #81~#93 主线事实与新接手提示词）。
- [x] `07_release_log.md` 新增 UX 产品化系列一节（13 个 PR 逐条+遗留）。
- [x] `08_next_steps.md` 优先级表重写（冒烟已覆盖;新增五任务测试/字典数据文案/垫片删除）。
- [x] `09_known_issues.md` 追加自动化验证陷阱（EP hidden-columns 幽灵/worktree dev 三坑）。
- [x] `11_decision_log.md` 追加 D-015~D-019（体验路线来源/铃铛/向导/layout 闸/列表外壳）。
- [x] `12_task_board.md` 刷新（T-016~T-020;旧 T-010/014/015 归档）。
- [x] `13_code_map.md` 追加本轮新增文件段。
- [x] `17_test_evidence.md` 顶部新增逐 PR 实测证据表 + 验证防坑。
- [x] 未逐一改写的其余 handoff 文档（02~06/10/14~16/18/19/21~30）:内容为规则/架构/环境类,本轮无实质变化;如与本节冲突,以 00/01/07 与蓝图为准。

## 二、改动边界

- [x] 本轮 docs sync 未修改 `src/**`（#81~#93 的代码改动在各自 PR,均已合并并逐 PR 验证）。
- [x] 未修改 `package.json` / `pnpm-lock.yaml` / `.env*`。
- [x] 未启用 `asyncRoutes`、未恢复 `/get-async-routes`。
- [x] auth 文件与 layout 文件的历史改动（#88/#89/#92）已在对应 PR 按 CLAUDE.md §4 申明,本轮 docs sync 不再触碰。

## 三、验证

- [x] 每个代码 PR:`pnpm lint` / `pnpm typecheck` / `pnpm build` 全绿（worktree 直跑）。
- [x] 每个代码 PR::8849 + live :3000 浏览器实测（证据见 17）。
- [ ] handoff strict 自检:脚本仍误扫依赖目录（T-013,遗留）。
- [ ] 五任务无提示测试（真人,T-018）。

## 四、当前未完成但不阻塞本次 docs sync 的事项

- [ ] 修复 `scripts/check_handoff_docs.py` 排除规则（T-013）。
- [ ] 字典数据技术文案人工修订（T-019）。
- [ ] 旧 perm-empty 垫片文件人工删除（T-020）。
