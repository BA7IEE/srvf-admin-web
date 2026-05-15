# srvf-admin-web

> SRVF admin web frontend derived from `u-admin-web-starter`.

## Repository Notice

This repository is the SRVF-specific admin frontend derived from the private `u-admin-web-starter`.

- This repository must remain private.
- This repository is a business project, not the upstream starter.
- The upstream starter baseline is `u-admin-web-starter`.
- Backend API contracts, roles, permissions, business rules, and data models are defined by `srvf-nest-api`.
- Do not derive backend schemas from Pure Admin / Max-Ts demo pages, mock data, tenant features, or asyncRoutes.
- Do not enable asyncRoutes in phase one.
- Do not restore tenant management menu entries from the starter.
- 业务派生记录见 `docs/srvf-frontend-derivation.md`；底座规则继承自 starter 的 `docs/pure-admin-max-ts-baseline.md` 主入口及 `docs/pure-admin/01~11-*.md` 11 份专题文档。

---

## ⚠️ 当前状态

- ✅ **PR-2.1 Vite proxy 已完成**：`/api → http://localhost:3000`（见 `vite.config.ts`）。
- ⛔ **PR-4 NestJS 登录对接暂停**。
- 🗂 **PR-4 尝试代码已归档**：分支 `archive/pr-4-login-attempt-b81afec`（本地 + `origin` 远端），commit `b81afec`。
- ♻️ **main 已 revert PR-4 登录对接代码**：revert commit `6f046cc`。
- 🔒 **不得重启 PR-4**，直到 `docs/srvf-api-contract-readiness.md` §6 Readiness Checklist **全部 10 项确认 + 人类显式批准**。

## 当前允许工作

允许（不依赖后端契约，见 `docs/srvf-api-contract-readiness.md` §5）：

- ✅ PR-5 静态菜单骨架（`src/router/modules/srvf-*.ts` + `src/views/srvf-*/` 占位页）；
- ✅ 占位页面（layout-only，不调 API）；
- ✅ 布局型 UI；
- ✅ 文档；
- ✅ PR-7 组织架构 UI 占位（裁决 8：不定义后端组织模型）；
- ✅ PR-8 活动日历 UI 占位（裁决 7：不定义活动 schema / 状态机）；
- ✅ 不依赖后端契约的静态原型。

禁止：

- ⛔ 接 NestJS 登录 / 真实业务 API；
- ⛔ 改 `src/api/user.ts` / `src/utils/auth.ts` / `src/utils/http/index.ts` / `src/store/modules/user.ts` / `src/views/login/index.vue`（属 PR-4 范畴）；
- ⛔ 启用 `asyncRoutes` / 新增 `getMenuList`；
- ⛔ 定义后端字段、权限、状态机；
- ⛔ 新增依赖（禁止 `pnpm add/remove/update/clean:cache`，禁止改 `package.json` 依赖字段）；
- ⛔ 恢复 `tenantManagementRouter` 到菜单数组；
- ⛔ 把仓库公开。

## AI 开发前必读

| #   | 文件                                        | 用途                                                                                  |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | `CLAUDE.md`                                 | Claude Code 标准入口（身份 / PR-4 暂停 / 必读 / 禁止 / 允许）                         |
| 2   | `AGENTS.md`                                 | 非 Claude AI agent（Cursor / Codex / Copilot）的对应入口                              |
| 3   | `docs/pure-admin-max-ts-baseline.md`        | 主入口认知文档 v0.3（继承自 starter）                                                 |
| 4   | `docs/pure-admin/02-ai-rules.md`            | AI 硬规则（§13.1 文件矩阵 + §13.4 8 步 Checklist）                                    |
| 5   | **`docs/srvf-frontend-derivation.md`**      | SRVF 派生记录（§1 starter base commit + §4 后端 Q1~Q5 调研结论 + §6 PR 顺序表）       |
| 6   | **`docs/srvf-api-contract-readiness.md`**   | PR-4 暂停权威决议（§3 暂停原因 + §4 阻塞清单 + §5 允许工作 + §6 readiness checklist） |
| 7   | `docs/pure-admin/12-official-docs-index.md` | Pure Admin 官方文档真实链接索引                                                       |

## 派生来源

- **starter**：`BA7IEE/u-admin-web-starter`（Private）
- **starter base commit**：`fd24cd4` (`chore: record starter setup verification`)
- **官方文档索引同步自 starter commit**：`ebcddc0`
- **上游同步规则**：见 starter 的 `docs/pure-admin/11-upstream-sync.md`（cherry-pick，禁 merge）

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
