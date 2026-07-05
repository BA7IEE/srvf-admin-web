# 08 下一步开发计划

## 一、当前优先级

| 优先级 | 任务                                            | 状态            | 说明                                                                                      |
| ------ | ----------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------- |
| P0     | 移除真实登录后对 `/get-async-routes` 的生产依赖 | LOCAL_TEST_PASS | `7.0.1-p0.routes` 已完成源码层修复，并已由用户本地验证通过                                |
| P1     | 工作台接 `GET admin/v1/meta/dashboard-summary`  | LOCAL_TEST_PASS | `7.1.0-p1.meta-workbench` 已完成并由用户本地验证通过                                      |
| P1     | 登录页旧预填密码处理                            | LOCAL_TEST_PASS | 已清空旧密码预填并由用户本地验证通过                                                      |
| P1     | memberships-read 队员组织归属只读接线           | NEXT            | 建议下一轮先做开发前分析；不删除旧 department                                             |
| P1     | 对齐后端 v0.37 scoped-authz 能力                | TODO            | positions / role-bindings / supervision / authz explain / action-state batch 后续切片推进 |
| P0     | 核对当前上传包与前序 v7.8.0 通过包血缘          | TODO            | 当前包缺少 `scoped_authz_smoke.py`，如要继承历史 Playwright 能力需单独核对                |
| P2     | 参考 pure-admin 优化 UI 细节                    | TODO            | 只读参考，不复制 mock 和业务模型                                                          |

## 二、下一轮建议任务

| 项       | 内容                                                                                 |
| -------- | ------------------------------------------------------------------------------------ |
| 任务名称 | `P1.2 memberships-read` 开发前分析                                                   |
| 目标     | 对照真实后端 memberships 相关接口，为队员详情新增“组织归属”只读 Tab 制定最小开发范围 |
| 涉及方向 | members cockpit、memberships API、organizations memberships、权限/空态处理           |
| 输出形式 | 只读分析：影响文件、接口字段风险、UI 归位、验证清单                                  |
| 风险     | 旧 department 页面仍存在，不能直接删除；memberships 是终态方向但需小步迁移           |

## 三、暂缓任务

| 任务                            | 暂缓原因                                        | 重启条件                            |
| ------------------------------- | ----------------------------------------------- | ----------------------------------- |
| positions / position-rules      | 需要先完成 members / organizations 归属显示基础 | memberships-read 稳定后             |
| role-bindings + authz diagnosis | 涉及 scoped 判权解释，测试矩阵较大              | scoped-authz 缺口表与基础 UI 完成后 |
| action-state batch 全站铺开     | 按钮状态影响面大                                | 先在报名/考勤单页试点               |
| 大规模 UI 重构                  | scoped-authz 对齐前不应大改结构                 | 缺口表完成并明确页面切片            |

## 四、给新聊天的下一步指令

```text
请基于最新 validated 完整包继续，只分析不改代码：对照真实后端 srvf-nest-api v0.37 current-state、docs/handoff/admin-web.md 和 live /api/docs-json，分析 P1.2 memberships-read 最小开发范围。重点检查 src/api、members cockpit、旧 department Tab、organizations memberships 入口、权限与空态。不要启用 asyncRoutes，不恢复 /get-async-routes，不删除旧 department，不改依赖。
```
