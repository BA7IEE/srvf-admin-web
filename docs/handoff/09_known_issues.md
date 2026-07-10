# 09 已知问题

## P0

1. `scripts/check_handoff_docs.py` 当前递归扫描整个仓库，包含 `.git`、`node_modules`、`.claude/worktrees/**/node_modules`，会把依赖 README 中的示例私钥/密码文本误判为错误。需要修复排除规则后再恢复 strict 自检。
2. 当前只完成直接 typecheck/build，未做 `main@1aba0da` 浏览器/dev 后端冒烟。#34~#80 范围很大，必须补一次真实运行验证。

## P1

1. `pnpm typecheck` 在当前环境会触发 pnpm 依赖状态检查并尝试 install，无 TTY 下中止。直接 `./node_modules/.bin/vue-tsc --noEmit --skipLibCheck` 已通过，但 pnpm 入口仍需环境层处理。
2. `docs/srvf-admin-vnext-blueprint.md` 是 2026-07-06 快照；主线 #37~#80 已完成大量条目，蓝图附录 B 的未消费路径应重新对账。
3. Auth 专线 #51 已改动 `src/api/user.ts`、`src/store/modules/user.ts`、`src/utils/http/index.ts`。后续任何 auth 调整仍需按 CLAUDE.md §4 三要素声明。

## P2

1. 旧 zip 包口径仍散落在历史 handoff/README 记录中；新聊天应以 `main@1aba0da` 为准。
2. `.agents/`、`.codex/` 当前未跟踪，可能来自 Codex/Claude 工具层；本次未纳入交接修改。
3. 参考包和完整版目录只能只读参考，不进入交付链。

## 附:自动化验证已知陷阱（2026-07-10,非产品缺陷）

- **EP `.hidden-columns` 幽灵按钮**:Element Plus 会把每个 `<el-table-column>` 的插槽内容在内部隐藏容器 `div.hidden-columns` 里用空 scope 渲染一份副本,且排在表格 DOM 最前。用脚本按文本 `.find()` 定位行操作按钮会点中该副本——表现为「跳 /undefined、编辑弹空表单、事件双触发」,酷似真 bug（曾被排查数小时后证伪:真实用户点的可见行内按钮一直正常）。**规避**:行操作探针一律限定 `tbody tr` 祖先,如 `.el-table tbody tr .el-button`。
- **worktree dev 三坑**（详见 Claude 项目记忆 srvf-preview-stale-hmr-error-logs）:日志缓冲回放旧编译错误;开着 dev 切分支会毒化 vite optimizer 缓存(`rm -rf node_modules/.vite` 后重启);截图工具可能发白幽灵而 DOM 正常——以 typecheck/build+DOM 查询为准。
