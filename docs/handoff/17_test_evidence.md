# 17 测试证据

## main@1aba0da handoff refresh

| 时间       | 命令 / 验证项                                         | 结果       | 说明                                                                                                                    |
| ---------- | ----------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| 2026-07-10 | `./node_modules/.bin/vue-tsc --noEmit --skipLibCheck` | PASS       | 直接调用本地 binary，类型检查通过                                                                                       |
| 2026-07-10 | `./node_modules/.bin/vite build`                      | PASS       | 生产构建通过，Vite 输出 `✓ built in 6.29s`                                                                              |
| 2026-07-10 | `pnpm typecheck`                                      | BLOCKED    | pnpm 触发依赖状态检查并尝试 `install`，无 TTY 下报 `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`                         |
| 2026-07-10 | `python3 scripts/check_handoff_docs.py --root .`      | FAIL_NOISY | 15 error / 158 warning，主要来自误扫 `.git`、`node_modules`、`.claude/worktrees/**/node_modules` 的依赖 README 示例文本 |
| 2026-07-10 | 浏览器/dev 后端冒烟                                   | NOT_RUN    | 本次只做交接文档续写                                                                                                    |

## 当前结论

当前主线可标记为 `BUILD_PASS`，不能标记为 `LOCAL_TEST_PASS` 或 `DEPLOY_PASS`。

## 必补验证

1. `pnpm dev` 启动。
2. 真实后端登录。
3. 菜单与全局搜索入口。
4. 字典主从布局。
5. 队员账号 tab。
6. 组织人事/RBAC 治理面关键列表。
7. Auth #51 的 40100 refresh 与 logout 撤销。

## 历史证据

2026-07-05 `7.1.0-p1.meta-workbench` 曾由用户本地验证通过，但该证据只覆盖旧基线，不能覆盖 #34~#80。
