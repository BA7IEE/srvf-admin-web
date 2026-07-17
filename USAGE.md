# SRVF Admin Web 使用与交接说明

本仓库是 SRVF 后台管理前端，当前已接入真实 `srvf-nest-api` 后端，不再是 PR-4 之前的纯静态占位项目。

## 新聊天 / 新 Agent 接手流程

1. 先读 `docs/handoff/00_new_chat_start.md`。
2. 再读 `project_state.json`、`docs/handoff/01_current_state.md`、`docs/handoff/23_package_lineage.md`、`docs/handoff/29_doc_conflict_map.md`。
3. 如涉及代码，继续读 `CLAUDE.md`、`AGENTS.md`、`docs/pure-admin/02-ai-rules.md`、`docs/pure-admin/03-router-menu.md`。
4. 如涉及真实接口，必须以真实后端仓库 `BA7IEE/srvf-nest-api` 的 `docs/current-state.md`、`docs/handoff/admin-web.md` 和 live `/api/docs-json` 为准。
5. 先输出当前基线、风险、涉及文件和验证方案，再修改。

## 当前版本

- 当前 handoff / 代码基准：`git-main-1aba0da-handoff-20260710`。
- 当前 Git HEAD：`1aba0da` (`feat(layout): navbar 挂全局实体搜索入口 (#80)`)。
- 当前包状态：未重新打包，以 Git checkout `main@1aba0da` 为准。
- 当前验证状态：`BUILD_PASS`，已直接通过 `vue-tsc` 与 `vite build`。
- 历史 validated 包：`srvf-admin-web_v7.1.0-p1.meta-workbench_validated_full_20260705.zip` 只作历史，不再作为当前下一步入口（原件已迁存 `<refs-root>/`，登记与占位符见 `docs/external-refs.md`）。
- 主线增量：相对 `c2001c9` 已合入 #34~#80，包括组织人事、RBAC 治理、Auth 专线、队员账号闭环、字典主从布局、srvf-kit 原语层。
- 本次未改：`src/**`、`package.json`、`pnpm-lock.yaml`、`.env*`、路由主链、权限主链、后端契约。

## 已确认验证

本次 Codex 直接确认：

```bash
./node_modules/.bin/vue-tsc --noEmit --skipLibCheck
./node_modules/.bin/vite build
```

结果：

- 直接 `vue-tsc` 通过。
- 直接 `vite build` 通过。

当前未确认：

- `pnpm typecheck`：在当前环境触发 pnpm 依赖状态检查并尝试 install，无 TTY 下中止。
- `python scripts/check_handoff_docs.py --root . --strict`：脚本误扫 `.git` / `node_modules` / `.claude/worktrees/**/node_modules`，当前不可作为 strict 证据。
- `pnpm dev` / 浏览器 / 真实后端登录：本次未运行。

## 后续验证建议

后续开发前仍建议执行：

```bash
./node_modules/.bin/vue-tsc --noEmit --skipLibCheck
./node_modules/.bin/vite build
pnpm dev
```

并补：

- 真实后端登录。
- 字典主从布局浏览器检查。
- 全局搜索入口检查。
- 队员账号 tab、组织人事、RBAC 治理面关键页面冒烟。
- 修复 `scripts/check_handoff_docs.py` 排除规则后，再跑 strict 自检。

## 下一步建议

不要再按旧 `P1.2 memberships-read` 入口继续；该线已被 #37~#60 覆盖。下一轮优先做 `main@1aba0da` 浏览器冒烟和 handoff 自检脚本修复。
