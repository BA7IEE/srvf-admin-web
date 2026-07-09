# srvf-admin-web

> SRVF admin web frontend derived from `u-admin-web-starter`.

## Repository Notice

This repository is the SRVF-specific admin frontend derived from the private `u-admin-web-starter`.

- This repository must remain private.
- This repository is a business project, not the upstream starter.
- The upstream starter baseline is `u-admin-web-starter`.
- Backend API contracts, roles, permissions, business rules, and data models are defined by `srvf-nest-api`.
- Do not derive backend schemas from Pure Admin / Max-Ts demo pages, mock data, tenant features, or asyncRoutes.
- Do not enable asyncRoutes.
- Do not restore tenant management menu entries from the starter.
- 业务派生记录见 `docs/srvf-frontend-derivation.md`；底座规则继承自 starter 的 `docs/pure-admin-max-ts-baseline.md` 主入口及 `docs/pure-admin/01~11-*.md` 11 份专题文档。

---

## ⚠️ 当前状态

> 更新：2026-07-10。2026-07-05 的 `7.1.0-p1.meta-workbench` handoff 已过期；当前以 Git `main@1aba0da` / `origin/main` 为准。

- ✅ **PR-4 NestJS 登录集成已上线**：真实登录主链为 `POST /api/auth/v1/login` → `GET /api/admin/v1/me` + `GET /api/system/v1/rbac/me/permissions`。
- ✅ **Vite proxy 已配置**：`/api → http://localhost:3000`，不 rewrite。
- ✅ **真实 SRVF 数据页允许开发**：通过 `@/utils/http` 调 `/api/admin/v1/*` 与 `/api/system/v1/*`，并用真实 RBAC 权限码门控。
- ✅ **主线已推进到 #80**：相对旧 handoff 基线 `c2001c9` 已合入 #34~#80，覆盖组织人事、RBAC 治理、Auth 专线、队员账号闭环、字典主从布局和 srvf-kit 原语层。
- ✅ **本次直接验证通过**：`./node_modules/.bin/vue-tsc --noEmit --skipLibCheck` 与 `./node_modules/.bin/vite build` 通过。
- ⚠️ **尚未补当前主线浏览器冒烟**：本次未跑 `pnpm dev`、真实后端登录或页面验证，当前状态只能标 `BUILD_PASS`。
- ⚠️ **后端权威版本**：以真实后端仓库 [BA7IEE/srvf-nest-api](https://github.com/BA7IEE/srvf-nest-api) 的 `docs/current-state.md`、`docs/handoff/admin-web.md` 和 live `/api/docs-json` 为准；当前前端文档已知快照为 v0.37.0 / 195 权限码。
- ⚠️ **handoff 自检脚本需修复**：当前会误扫 `.git`、`node_modules`、`.claude/worktrees/**/node_modules`，导致依赖 README 示例文本误报。

## 当前允许工作

允许：

- ✅ 修复真实登录、token、路由守卫、权限过滤等主链问题，但必须声明涉及文件和影响范围；
- ✅ 真实 SRVF list / detail 页面接线；
- ✅ 静态菜单、占位页、布局型 UI、文档更新；
- ✅ 后端契约已确认的组织、活动、成员、通知、内容、系统页；
- ✅ `pnpm dev / typecheck / build / preview`。

禁止：

- ⛔ 启用 `src/router/asyncRoutes.ts`；
- ⛔ 新增或实现 `getMenuList`；
- ⛔ 把 `/get-async-routes` 当成真实后端接口；
- ⛔ 从 Pure Admin demo / mock / tenant 反推 SRVF 后端字段、权限码、状态机；
- ⛔ 未授权修改依赖或公开仓库；
- ⛔ 写入真实 `.env`、密钥、私钥、证书或用户隐私数据。

## 长期 handoff 入口

新聊天或新 Agent 接手时，必须先读：

1. `docs/handoff/00_new_chat_start.md`
2. `project_state.json`
3. `docs/handoff/01_current_state.md`
4. `docs/handoff/23_package_lineage.md`
5. `docs/handoff/29_doc_conflict_map.md`
6. `docs/handoff/30_handoff_self_check.md`
7. `docs/srvf-admin-vnext-blueprint.md`
8. `../srvf-nest-api/docs/handoff/admin-web.md`

## AI 开发前必读

| #   | 文件                                      | 用途                                                                           |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| 0   | `docs/handoff/00_new_chat_start.md`       | 新聊天 / 新 Agent 接手入口，先判断版本血缘、当前状态、冲突与下一步             |
| 1   | `project_state.json`                      | 机器可读当前状态、包血缘和下一步任务                                           |
| 2   | `CLAUDE.md`                               | Claude Code 标准入口（PR-4 已上线、auth 主链高风险声明、禁止项）               |
| 3   | `AGENTS.md`                               | 非 Claude AI agent（ChatGPT / Codex / Cursor / Copilot）的对应入口             |
| 4   | `docs/pure-admin-max-ts-baseline.md`      | 主入口认知文档 v0.3（继承自 starter）                                          |
| 5   | `docs/pure-admin/02-ai-rules.md`          | AI 硬规则（§13.1 文件矩阵 + §13.4 8 步 Checklist）                             |
| 6   | `docs/pure-admin/03-router-menu.md`       | 路由 / 菜单规则，尤其 asyncRoutes P0 禁令                                      |
| 7   | **`docs/srvf-frontend-derivation.md`**    | SRVF 派生记录（starter base、后端调研、PR 顺序）                               |
| 8   | **`docs/srvf-api-contract-readiness.md`** | PR-4 从历史暂停到已上线的决策记录                                              |
| 9   | **`docs/srvf-api-integration-guide.md`**  | 登录 / 鉴权接线说明；精确接口数量以后端 current-state 和 `/api/docs-json` 为准 |
| 10  | **`docs/srvf-admin-vnext-blueprint.md`**  | v0.37 重估蓝图；注意它是 2026-07-06 快照，#37~#80 后需重新核对                 |
| 11  | `docs/handoff/29_doc_conflict_map.md`     | 旧文档冲突地图，避免被 README / 历史权限数量误导                               |

## 派生来源

- **starter**：`BA7IEE/u-admin-web-starter`（Private）
- **starter base commit**：`fd24cd4` (`chore: record starter setup verification`)
- **官方文档索引同步自 starter commit**：`ebcddc0`
- **完整版参考规则同步自 starter commit**：`0669f46`
- **上游同步规则**：见 starter 的 `docs/pure-admin/11-upstream-sync.md`（cherry-pick，禁 merge）

## 完整版参考库

GitHub 参考：[pure-admin/vue-pure-admin](https://github.com/pure-admin/vue-pure-admin)

本地路径：`/Users/dengwang/Documents/coding/SRVF-web-admin参考/vue-pure-admin`

说明：

- 本地完整版 `vue-pure-admin` **只作为 UI / 组件 / 页面范式参考**；
- ⛔ **不直接开发**（不在该目录写代码）；
- ⛔ **不修改**（read-only）；
- ⛔ **不作为业务需求来源**（不能因为完整版有某个页面就说"本项目也要做这个业务"）；
- ⛔ **不作为后端契约来源**（完整版的 API / mock / RBAC / tenant / 动态菜单 schema 都不能反推到任何业务后端）；
- ✅ 本仓库可以读取完整版作为 UI 范式参考，但必须遵守 **Full Version Reference Rule**（见 `CLAUDE.md` §9 / `AGENTS.md` §9）；
- 参考细则见 `docs/pure-admin/07-max-ts-modules.md` 与 `docs/pure-admin/12-official-docs-index.md`。

---

# 使用前须知

[pure-admin-thin-max-ts](https://github.com/xiaoxian521/pure-admin-thin-max-ts) 仅供购买者（个人、公司）使用且使用者不可售卖或公开源代码，违者追究法律责任、踢出此私有仓库且不退购买费！  
注：若购买者在公司使用了 [pure-admin-thin-max-ts](https://github.com/xiaoxian521/pure-admin-thin-max-ts)，离职后，公司也不可售卖或公开源代码，违者追究其公司法律责任，最高面临`5万元`罚款！

## 介绍

[点击查看介绍](https://pure-admin.cn/pages/service/#max-ts-版本)

## 视频教程

- [点击查看Max-Ts版本如何精简代码](https://www.alipan.com/s/Knab1ih5vUV)
- 视频提取码: `20zk`

## 版本选择

当前是非国际化`max-ts`版本，如果您需要国际化`max-ts`版本 [请点击](https://github.com/xiaoxian521/pure-admin-thin-max-ts/tree/i18n)

## 温馨提示

当您看到类似 `This repository has been archived` 的提示时，请不要疑惑，这是我将该仓库进行了存档处理，防止大家误提交代码到该仓库。当有新功能或者需要维护时，我会取消存档将功能加上后重新进行存档 🙏
