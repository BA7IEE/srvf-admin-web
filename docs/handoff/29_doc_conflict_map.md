# 29 文档冲突地图

## 一、冲突表

| ID    | 旧口径                                    | 新口径                                                          | 以哪个文档为准                                   | 状态   | 说明                    |
| ----- | ----------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------ | ------ | ----------------------- |
| C-001 | README/历史文档写 PR-4 暂停               | PR-4 已上线，auth 文件是 active code                            | `CLAUDE.md` / `AGENTS.md`                        | 已处理 | 历史暂停只作决策记录    |
| C-002 | 权限码数量 155 / 163 / 195                | 当前已知后端 **v0.39.0 为 198 权限码**（biz-admin 74）          | 后端 current-state / live docs                   | 生效   | 动工前重新查 live       |
| C-003 | `/get-async-routes` 是生产菜单接口        | 这是 pure-admin mock，不是 SRVF 后端接口                        | 代码与本 handoff                                 | 已处理 | 不得恢复                |
| C-004 | 当前下一步是 `P1.2 memberships-read`      | 主线已完成 #37~#98 组织人事/RBAC/UX 产品化系列/档案掩码适配     | `main@075eded` + 本 handoff                      | 已纠偏 | 旧下一步废弃            |
| C-005 | 字典主从布局进行中                        | #71/#72 已合入主线                                              | Git log / 当前源码                               | 已纠偏 | 后续只需浏览器验收      |
| C-006 | `7.1.0-p1.meta-workbench` 是最新基准      | 最新基准是 Git `main@075eded`(#94~#98)                          | `23_package_lineage.md`                          | 已纠偏 | 2026-07-05 zip 只作历史 |
| C-007 | 多份文档「当前基准=main@1aba0da/2cca7a3」 | 基线已刷至 `main@075eded`(20260710 第三次 re-baseline,#94~#98)  | `VERSION` / `project_state.json` / 00/01/07      | 已纠偏 | 2026-07-10 全量清扫     |
| C-009 | Auth 文件仍不可作为业务 PR 触碰           | 松绑后可改但必须声明文件/内容/影响面；#51 已按该线动过 3 个文件 | `CLAUDE.md` / `AGENTS.md` / `11_decision_log.md` | 生效   | 本次未改 auth           |
| C-008 | handoff 自检失败说明当前仓库有私钥        | 已修:#96 排除依赖目录后普通+strict 双 0/0 PASS                  | `17_test_evidence.md`                            | 已处理 | 非密钥泄露              |

## 二、冲突处理规则

- 发现冲突先登记，不直接按旧文档开发。
- 涉及后端事实时，以 live `/api/docs-json` 和后端 handoff 为准。
- 涉及当前前端事实时，以 Git `main@075eded` 和源码为准。
- 涉及下一步任务时，以 `08_next_steps.md` 和 `12_task_board.md` 为准。

## 三、当前唯一可信口径

- 当前项目状态：`01_current_state.md`。
- 机器可读状态：`project_state.json`。
- 包/基线血缘：`23_package_lineage.md`。
- 文档冲突：本文件。
- 后端接口：live `/api/docs-json`。
