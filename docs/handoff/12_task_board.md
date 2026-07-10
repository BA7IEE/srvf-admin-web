# 12 任务台账

## 状态枚举

```text
TODO / IN_PROGRESS / CODE_DONE / BUILD_PASS / LOCAL_TEST_PASS / DEPLOY_PASS / USER_CONFIRMED / BLOCKED / CANCELLED / ARCHIVED
```

## 当前任务表

| ID    | 任务                           | 优先级 | 状态            | 关联范围                                        | 测试状态                                                                            | 备注                                                  |
| ----- | ------------------------------ | ------ | --------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------- |
| T-016 | UX 产品化系列 #81~#93          | P0     | LOCAL_TEST_PASS | 蓝图+13 个 PR（IA v3/术语/流程/向导/手册/迁移） | 逐 PR :8849+live 实测,见 `17_test_evidence.md`                                      | 2026-07-10 收官;体验路线单一来源=ux-upgrade-blueprint |
| T-017 | 刷新 handoff 至 `main@2cca7a3` | P0     | CODE_DONE       | `docs/handoff/**`、根状态文件                   | 见 `17_test_evidence.md`                                                            | 本次任务                                              |
| T-018 | 五任务无提示测试（真人）       | P0     | TODO            | 蓝图 §6 验收                                    | 待执行                                                                              | 非技术干部;卡壳点进 backlog                           |
| T-013 | handoff 自检脚本排除规则修复   | P0     | TODO            | `scripts/check_handoff_docs.py`                 | 当前 FAIL_NOISY                                                                     | 需排除 `.git` / `node_modules` / `.claude/worktrees`  |
| T-019 | 字典数据技术文案人工修订       | P1     | TODO            | 字典管理页（纯数据）                            | —                                                                                   | 「待 APD 审核」「Demo work nature」等                 |
| T-020 | 旧 perm-empty 垫片文件删除     | P1     | CODE_DONE       | `src/views/srvf/components/perm-empty.vue`      | 2026-07-10 用户手打路径授权删除;删除前核验发现并切换残余 15 处 import 到 @/srvf-kit | 全站权限空态就此单一实现                              |
| T-010 | 刷新 handoff 至 `main@1aba0da` | P0     | ARCHIVED        | 上一轮                                          | —                                                                                   | 已被 T-017 取代                                       |
| T-014 | 当前主线浏览器/dev 冒烟        | P0     | ARCHIVED        | —                                               | —                                                                                   | 已由 T-016 逐 PR 冒烟覆盖                             |
| T-015 | 字典主从布局验收               | P1     | ARCHIVED        | #71/#72                                         | 本轮 UX 系列已在浏览器多次经过该页                                                  | —                                                     |

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
