# 12 任务台账

## 状态枚举

```text
TODO / IN_PROGRESS / CODE_DONE / BUILD_PASS / LOCAL_TEST_PASS / DEPLOY_PASS / USER_CONFIRMED / BLOCKED / CANCELLED / ARCHIVED
```

## 当前任务表

| ID    | 任务                           | 优先级 | 状态       | 关联范围                        | 测试状态                 | 备注                                                 |
| ----- | ------------------------------ | ------ | ---------- | ------------------------------- | ------------------------ | ---------------------------------------------------- |
| T-010 | 刷新 handoff 至 `main@1aba0da` | P0     | CODE_DONE  | `docs/handoff/**`、根状态文件   | 见 `17_test_evidence.md` | 本次任务                                             |
| T-011 | 直接类型检查                   | P0     | BUILD_PASS | 全项目                          | `vue-tsc` PASS           | 直接用本地 binary，未走 pnpm 脚本                    |
| T-012 | 生产构建                       | P0     | BUILD_PASS | 全项目                          | `vite build` PASS        | 生成 `dist/`，未产生 git diff                        |
| T-013 | handoff 自检脚本排除规则修复   | P0     | TODO       | `scripts/check_handoff_docs.py` | 当前 FAIL_NOISY          | 需排除 `.git` / `node_modules` / `.claude/worktrees` |
| T-014 | 当前主线浏览器/dev 冒烟        | P0     | TODO       | 登录、菜单、关键 SRVF 页面      | 未运行                   | #34~#80 后必须补                                     |
| T-015 | 字典主从布局验收               | P1     | CODE_DONE  | #71/#72                         | 待浏览器复核             | 代码已在主线                                         |

## 已完成主线任务（按 PR 组）

| 范围                   | 状态      | 说明                  |
| ---------------------- | --------- | --------------------- |
| Phase 0 行为校准       | CODE_DONE | #36                   |
| 组织人事支柱           | CODE_DONE | #37~#42               |
| Phase 2 补件           | CODE_DONE | #43~#45               |
| Phase 3 体验层         | CODE_DONE | #46~#49               |
| Phase 0-b 清理         | CODE_DONE | #50                   |
| Auth 专线              | CODE_DONE | #51，已登记高风险文件 |
| RBAC 治理面            | CODE_DONE | #52~#54               |
| 组织人事收尾与缺陷修复 | CODE_DONE | #55~#60               |
| 体验层 A~D / 用户搜索  | CODE_DONE | #61~#67               |
| 队员账号闭环           | CODE_DONE | #68~#70               |
| 字典主从布局           | CODE_DONE | #71~#72               |
| srvf-kit 原语层        | CODE_DONE | #73~#80               |

## 当前阻塞 / 待办

| ID    | 阻塞原因             | 需要谁处理         | 解除条件                      |
| ----- | -------------------- | ------------------ | ----------------------------- |
| T-013 | 自检脚本误扫依赖目录 | 下一轮开发者       | 修复排除规则并跑通 self-check |
| T-014 | 未运行 dev/browser   | 下一轮开发者或用户 | 完成真实后端冒烟并记录        |
