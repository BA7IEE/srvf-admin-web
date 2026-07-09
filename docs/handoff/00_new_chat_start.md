# 00 新聊天接手入口

## 一、当前接手结论

| 项                | 当前状态                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| 当前代码基准      | `main@1aba0da` / `origin/main`，2026-07-10 checkout                                                             |
| 当前 handoff 版本 | `git-main-1aba0da-handoff-20260710`                                                                             |
| 最新包状态        | 未重新打包；以当前 Git checkout 为准                                                                            |
| 相对旧基线        | `c2001c9..1aba0da` 合入 #34~#80，共 256 文件、+21957/-6030                                                      |
| 当前验证状态      | BUILD_PASS：直接执行 `vue-tsc` 与 `vite build` 通过；未做浏览器/dev 后端冒烟                                    |
| 后端权威基准      | `../srvf-nest-api/docs/handoff/admin-web.md` + live `/api/docs-json`；文档仍以 v0.37.0/195 权限码为当前已知基准 |

## 二、当前主线事实

- Phase 0~3 蓝图主线已完成大部分：行为校准、组织人事支柱、附件/招新/公告补件、体验层快赢已合入。
- 字典主从布局已完成：#71 改为左侧类型导航 + 右侧条目树表，#72 补分组行视觉层级。
- 队员账号闭环已完成：#68/#69/#70 覆盖开号、绑定、解绑、退号重开、启停、批量开号、最近登录与授权入口。
- RBAC 治理面已完成：#52~#54 角色 CRUD/角色权限绑定、权限点 CRUD、用户-角色分配。
- Auth 专线已合入：#51 修改 `src/api/user.ts`、`src/store/modules/user.ts`、`src/utils/http/index.ts`，接入 40100 被动刷新重试与真实 logout 撤销端点。此为历史代码事实，本次 handoff 未改 auth 文件。
- srvf-kit 表现层原语已开始抽取：#74~#80 包含权限空态、状态标签、详情壳、说明块、远程选择器、列表壳/组合式、全局搜索与最近访问入口。

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
3. 若继续做产品开发，先基于当前 `main@1aba0da` 和 live `/api/docs-json` 重新选一个小切片，不使用 2026-07-05 的 zip 包任务名。

## 六、给下一位 AI 的最小指令

```text
请基于当前 srvf-admin-web Git checkout `main@1aba0da` 继续。先读 CLAUDE.md、AGENTS.md、project_state.json、docs/handoff/00/01/23/24/29/30、docs/srvf-admin-vnext-blueprint.md，以及后端 ../srvf-nest-api/docs/handoff/admin-web.md。注意 2026-07-05 handoff 已过期：#34~#80 已合入，字典主从布局、组织人事、RBAC 治理、队员账号闭环和 srvf-kit 原语层均已在主线。不要恢复 /get-async-routes，不启用 asyncRoutes，不改依赖；涉及 auth 主线必须按 CLAUDE.md §4 声明。
```
