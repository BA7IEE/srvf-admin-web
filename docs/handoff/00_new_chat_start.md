# 00 新聊天接手入口

## 一、当前接手结论

| 项                | 当前状态                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| 当前代码基准      | `main@2cca7a3` / `origin/main`，2026-07-10 checkout                                                             |
| 当前 handoff 版本 | `git-main-2cca7a3-handoff-20260710`                                                                             |
| 最新包状态        | 未重新打包；以当前 Git checkout 为准                                                                            |
| 相对旧基线        | `1aba0da..2cca7a3` 合入 #81~#93（UX 产品化系列），共 106 文件、+5854/-3691                                      |
| 当前验证状态      | BUILD_PASS + 浏览器/dev 后端冒烟已做：本轮每个 PR 均在 :8849 + live 后端实测后合并（见 17_test_evidence）       |
| 后端权威基准      | `../srvf-nest-api/docs/handoff/admin-web.md` + live `/api/docs-json`；文档仍以 v0.37.0/195 权限码为当前已知基准 |

## 二、当前主线事实

- Phase 0~3 蓝图主线已完成大部分：行为校准、组织人事支柱、附件/招新/公告补件、体验层快赢已合入。
- 字典主从布局已完成：#71 改为左侧类型导航 + 右侧条目树表，#72 补分组行视觉层级。
- 队员账号闭环已完成：#68/#69/#70 覆盖开号、绑定、解绑、退号重开、启停、批量开号、最近登录与授权入口。
- RBAC 治理面已完成：#52~#54 角色 CRUD/角色权限绑定、权限点 CRUD、用户-角色分配。
- Auth 专线已合入：#51 修改 `src/api/user.ts`、`src/store/modules/user.ts`、`src/utils/http/index.ts`，接入 40100 被动刷新重试与真实 logout 撤销端点。此为历史代码事实，本次 handoff 未改 auth 文件。
- srvf-kit 表现层原语已开始抽取：#74~#80 包含权限空态、状态标签、详情壳、说明块、远程选择器、列表壳/组合式、全局搜索与最近访问入口。
- **UX 产品化系列已收官（#81~#93,2026-07-10）**：产品化升级蓝图 `docs/srvf-admin-ux-upgrade-blueprint.md`（#81）+ 全量实施——止血三修（#82）、术语人话化+页头说明全覆盖（#83）、IA v3 一级菜单 10 组→7 组+「队务设置」设置中心+工作台快捷发起（#84）、流程步骤条与队员档案页签重排（#85）、招新总览两道门漏斗页（#86）、使用手册页（#87）、登录预填清除（#88,auth 文件经 ask 闸）、铃铛假消息改真实待办入口（#89,layout 文件）、授权向导三步（#90）、启用进度卡+规则表单字段提示（#91）、layout 编辑闸 deny→ask（#92）、19 个列表页迁移到 SrvfListPage+新增 #banner 槽位（#93,kit 采用率 20/29）。

## 三、必须先读文件

1. `project_state.json`
2. `docs/handoff/01_current_state.md`
3. `docs/handoff/23_package_lineage.md`
4. `docs/handoff/24_validation_matrix.md`
5. `docs/handoff/29_doc_conflict_map.md`
6. `docs/handoff/30_handoff_self_check.md`
7. `CLAUDE.md`
8. `AGENTS.md`
9. `docs/srvf-admin-vnext-blueprint.md`
10. `../srvf-nest-api/docs/handoff/admin-web.md`

## 四、关键参考地址

- 后端 API 仓库：[BA7IEE/srvf-nest-api](https://github.com/BA7IEE/srvf-nest-api)
- 开源前端框架组件写法参考：[pure-admin/vue-pure-admin](https://github.com/pure-admin/vue-pure-admin)

## 五、下一步建议

下一轮不要再按旧 handoff 的 `P1.2 memberships-read` 启动；该线已被 #37~#60 覆盖并继续收尾。建议优先做三件事：

1. 浏览器/dev 后端冒烟：登录、菜单、全局搜索、字典主从、队员账号、组织人事、RBAC 治理面各抽一条路径。
2. 修正 `scripts/check_handoff_docs.py` 递归误扫 `.git` / `node_modules` / `.claude/worktrees/**/node_modules` 的问题，再恢复 strict 自检可信度。
3. 若继续做产品开发，先基于当前 `main@2cca7a3` 和 live `/api/docs-json` 重新选一个小切片，不使用 2026-07-05 的 zip 包任务名。

## 六、给下一位 AI 的最小指令

```text
请基于当前 srvf-admin-web Git checkout `main@2cca7a3` 继续。先读 CLAUDE.md、AGENTS.md、project_state.json、docs/handoff/00/01/23/24/29/30、docs/srvf-admin-vnext-blueprint.md、docs/srvf-admin-ux-upgrade-blueprint.md，以及后端 ../srvf-nest-api/docs/handoff/admin-web.md。注意 2026-07-05 与 1aba0da 两版 handoff 均已过期：#34~#93 已合入——组织人事、RBAC 治理、队员账号闭环、srvf-kit 原语层、UX 产品化系列（IA v3 七组菜单/设置中心/授权向导/使用手册/19 页列表外壳迁移）均在主线。不要恢复 /get-async-routes，不启用 asyncRoutes，不改依赖；涉及 auth 主线必须按 CLAUDE.md §4 声明（src/layout/** 现为 ask 闸,编辑仍需人工逐次确认）。
```
