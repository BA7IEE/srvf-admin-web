# 12 · Official Docs Index · Pure Admin 官方文档索引与 FAQ 裁决

## 本文适用任务

- 需要查 Pure Admin 框架使用细节（路由 / 菜单 / 主题 / Tailwind / 构建插件 / vite 等）
- 排查 FAQ 中已记录的常见问题（路径、Node 版本、husky、动态路由等）
- 评估上游官方新版本变更对本项目的影响
- 在做新功能前，验证"官方推荐写法"是什么

## 必须先读

- 主入口 `docs/pure-admin-max-ts-baseline.md`（特别是 §0.5 后端 4 大红线）
- `02-ai-rules.md`（§13.1 文件改动矩阵、§13.4 8 步 Checklist）
- `11-upstream-sync.md`（官方版本升级 / 同步策略）

## 禁止事项

- ⛔ 禁止把官方文档作为**后端契约 / RBAC / 数据库模型 / API 路径**依据（详见下文 §5）
- ⛔ 禁止把官方文档全文复制进本仓库（版权 + 同步成本）
- ⛔ 禁止在没有人类批准的情况下，按官方 changelog 自行升级依赖（违反 `02-ai-rules.md §13.2.1`）
- ⛔ 禁止"因为官方支持 X，所以本项目也要做 X" —— 本项目业务优先级以 SRVF / 业务派生项目为准
- ⛔ 禁止用官方文档示例的 `admin / common` 角色 / `*:*:*` 权限作正式角色 / 权限 code（红线 4）
- ⛔ 禁止在本文件中写**任何未经实际抓取验证的链接**——所有 URL 必须直接来自官网 SSR HTML 提取（详见 §7 维护方式）

## 相关关键文件路径

- 本文件（仅索引 + 项目内裁决）
- `package.json`（与官方推荐版本对齐时需查阅）
- `docs/pure-admin/setup-notes.md`（实际环境记录，需与官方版本要求对齐）

---

## 1. 文档定位

**Pure Admin 官方文档是 Pure Admin 前端框架的使用说明**，定位严格限定：

- ✅ 前端工程组织（目录、路由、布局、组件、插件）；
- ✅ 前端构建、打包、部署；
- ✅ Tailwind / 主题 / 暗黑模式等 UI 能力；
- ✅ FAQ / 排错；
- ✅ 上游版本变更说明。

**它不是**：

- ❌ SRVF（或任何派生业务项目）的后端 API 规范；
- ❌ 数据库设计依据；
- ❌ RBAC 后端权限模型依据；
- ❌ API 契约来源；
- ❌ 业务字段 / 枚举 / 状态机来源。

所有"后端的事"以 NestJS Swagger / Prisma schema / 业务方拍板为准（详见主入口 §0.5 后端 4 大红线 + `08-starter-derivation.md`）。

---

## 2. 官方文档总入口（真实链接）

> 下表中所有 URL **均通过 `curl https://pure-admin.cn/pages/introduction/` 拉到的官网 SSR HTML 实际抓取得到**——VuePress sidebar 中的真实 `<a href>`。本文件**禁止收录任何未经此方式验证的链接**（§7）。
>
> 抓取时间：2026-05-15。下次维护时由人类按 §7 流程重新抓取。

### 2.1 指南 / 入门

| 中文标题（来自官网 sidebar） | URL                                       |
| ---------------------------- | ----------------------------------------- |
| 指南（介绍页）               | https://pure-admin.cn/pages/introduction/ |
| 快速开始                     | https://pure-admin.cn/pages/start/        |
| 目录结构                     | https://pure-admin.cn/pages/directory/    |
| vscode文件夹详解             | https://pure-admin.cn/pages/vscode/       |

### 2.2 平台核心配置

| 中文标题   | URL                                     |
| ---------- | --------------------------------------- |
| 平台配置   | https://pure-admin.cn/pages/config/     |
| 布局       | https://pure-admin.cn/pages/layout/     |
| 路由和菜单 | https://pure-admin.cn/pages/routerMenu/ |
| HTTP请求   | https://pure-admin.cn/pages/request/    |
| 打包和部署 | https://pure-admin.cn/pages/build/      |

### 2.3 UI / 样式

| 中文标题       | URL                                      |
| -------------- | ---------------------------------------- |
| 图标           | https://pure-admin.cn/pages/icon/        |
| 主题和暗黑模式 | https://pure-admin.cn/pages/theme/       |
| 国际化         | https://pure-admin.cn/pages/i18n/        |
| Tailwind CSS   | https://pure-admin.cn/pages/tailwindcss/ |

### 2.4 权限 / 类型 / 登录

| 中文标题     | URL                                     |
| ------------ | --------------------------------------- |
| RBAC权限     | https://pure-admin.cn/pages/RBAC/       |
| 类型声明     | https://pure-admin.cn/pages/typescript/ |
| 单点登录     | https://pure-admin.cn/pages/sso/        |
| 自定义免登录 | https://pure-admin.cn/pages/nologin/    |

### 2.5 构建 / 优化 / 对接

| 中文标题             | URL                                     |
| -------------------- | --------------------------------------- |
| 打包优化             | https://pure-admin.cn/pages/buildgood/  |
| Vite预构建           | https://pure-admin.cn/pages/optimize/   |
| 对接平台的前后端项目 | https://pure-admin.cn/pages/opensource/ |
| 函数工具库           | https://pure-admin.cn/pages/utils/      |
| 组件库               | https://pure-admin.cn/pages/components/ |
| Vite插件             | https://pure-admin.cn/pages/viteplugin/ |

### 2.6 FAQ / 跟踪 / AI / 工具

| 中文标题                             | URL                                                |
| ------------------------------------ | -------------------------------------------------- |
| 常见问题（FAQ）                      | https://pure-admin.cn/pages/FAQ/                   |
| 常见问题 · 快速入门-新手必看（锚点） | https://pure-admin.cn/pages/FAQ/#快速入门-新手必看 |
| 非平台问题跟踪记录                   | https://pure-admin.cn/pages/track/                 |
| AI                                   | https://pure-admin.cn/pages/ai/                    |
| Git常用命令                          | https://pure-admin.cn/pages/git/                   |
| 技术网站推荐                         | https://pure-admin.cn/pages/recommendation/        |

### 2.7 营销 / 商务（非技术文档，仅作存档）

| 中文标题                             | URL                                  |
| ------------------------------------ | ------------------------------------ |
| 赞助                                 | https://pure-admin.cn/pages/sponsor/ |
| 高级服务（含 Max-Ts 等付费版本说明） | https://pure-admin.cn/pages/service/ |

**已抓取链接总数：30 个真实链接 + 1 个真实锚点；未确认链接：0 个。**

---

## 3. 任务类型阅读表

| 任务                   | 优先读官方文档                                    | 本地对应文档                                                     | 是否可照搬                                                                                                                                     | 风险等级 |
| ---------------------- | ------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 新手入门 / 环境安装    | 指南 + 快速开始（§2.1）+ FAQ 快速入门锚点（§2.6） | `01-project-map.md`、`setup-notes.md`                            | ⚠️ 大部分可参考；Node / pnpm 版本以 `package.json: engines` 为准                                                                               | 🟢 低    |
| 目录结构理解           | 目录结构 + vscode文件夹详解（§2.1）               | `01-project-map.md` §3                                           | ✅ 基本一致；本地有"底座层 / 业务层 / 环境层"分类                                                                                              | 🟢 低    |
| 改路由 / 菜单          | 路由和菜单（§2.2）                                | `03-router-menu.md`                                              | ⚠️ 框架机制可照搬；但**禁用 asyncRoutes**与"两套 whiteList"必须按本地裁决（裁决 2）                                                            | 🟠 中    |
| 改 http 请求           | HTTP请求（§2.2）                                  | `05-http-api.md`                                                 | ⚠️ axios 封装结构一致；**响应结构、错误码、refresh 适配以后端 Swagger 为准**（不照搬官方 mock 假设）                                           | 🟠 中    |
| 接后端 API             | HTTP请求 + 对接平台的前后端项目（§2.5）           | `05-http-api.md`、`08-starter-derivation.md` §11                 | ❌ **不照搬**。一切以 NestJS Swagger 为准                                                                                                      | 🔴 高    |
| 做权限按钮             | RBAC权限（§2.4）                                  | `04-auth-permission.md` §6.6                                     | ⚠️ `Auth/Perms/v-auth/v-perms` 用法可照搬；**演示 `admin/common/*:*:*` 不可作正式角色**（裁决 3）                                              | 🟠 中    |
| 做布局 / 菜单样式      | 布局 + 平台配置（§2.2）                           | `01-project-map.md` §3.7、`03-router-menu.md` §5.7               | ✅ 大部分照搬；layout 源码本地禁改（`02-ai-rules.md §13.1` ❌）                                                                                | 🟢 低    |
| 做主题 / 暗黑模式      | 主题和暗黑模式（§2.3）                            | `01-project-map.md` §3.7、`03-router-menu.md` §5.7               | ✅ 通过 `public/platform-config.json` 或主题面板配置                                                                                           | 🟢 低    |
| 做 Tailwind 样式       | Tailwind CSS（§2.3）                              | `01-project-map.md` §2.2                                         | ⚠️ **注意 Tailwind v4 与 v3 语法差异巨大**（v4 用 `@theme/@utility/@custom-variant`，无 `tailwind.config.js`）；官方文档需确认与本项目版本一致 | 🟠 中    |
| 做 CRUD 页面           | 组件库（§2.5）                                    | `07-max-ts-modules.md` §9 范式表；优先参考 vue-pure-admin 完整版 | ⚠️ 交互范式可照搬；**字段 / API / 角色 / 字典必须按后端**（红线 1~4）                                                                          | 🟠 中    |
| 做打包 / 部署          | 打包和部署（§2.2）+ 打包优化（§2.5）              | `01-project-map.md` §4、`06-mock-risk.md` §8.5 第 4 条           | ✅ 命令照搬；**生产 `enableProd: false`** 必改（裁决 4）                                                                                       | 🟢 低    |
| 排查 FAQ 报错          | 常见问题 / 非平台问题跟踪（§2.6）                 | `setup-notes.md`、`10-review-log.md`                             | ✅ 大部分照搬                                                                                                                                  | 🟢 低    |
| 上游更新同步           | 指南介绍页 changelog 段 + FAQ                     | `11-upstream-sync.md`                                            | ⚠️ 阅读官方 changelog，但同步必须走本地高风险文件清单 + 单独 PR                                                                                | 🔴 高    |
| 动态路由               | 路由和菜单 + FAQ 内动态路由段                     | `03-router-menu.md` §5.2.1                                       | ❌ **第一阶段一律禁用 asyncRoutes**（裁决 2）；只读官方文档作排错参考，不实施                                                                  | 🔴 高    |
| SSO / 免登录           | 单点登录 + 自定义免登录（§2.4）                   | `src/utils/sso.ts`（上游 starter 自带，默认 `main.ts` 注释）     | ⚠️ 若启用，按官方文档；但 token / role 来源仍以 NestJS 为准                                                                                    | 🟠 中    |
| 组件库使用             | 组件库（§2.5）+ 函数工具库（§2.5）                | `07-max-ts-modules.md` §9.7                                      | ✅ `Re*` / `@pureadmin/table` / `ReDialog` 等用法照搬                                                                                          | 🟢 低    |
| 图标接入               | 图标（§2.3）                                      | `01-project-map.md` §2.2（`@iconify` + `unplugin-icons`）        | ✅ 照搬                                                                                                                                        | 🟢 低    |
| 类型声明扩展           | 类型声明（§2.4）                                  | `01-project-map.md` §3.15、`types/router.d.ts`                   | ✅ 照搬                                                                                                                                        | 🟢 低    |
| 国际化（i18n）         | 国际化（§2.3）                                    | `02-ai-rules.md §13.3 第 7 条`                                   | ❌ **第一阶段不启用**；**禁止**自行 `pnpm add vue-i18n`                                                                                        | 🔴 高    |
| Vite 插件 / 自定义构建 | Vite插件 + Vite预构建（§2.5）                     | `01-project-map.md` §3.1 build/ + §13.2.2 单独 PR                | ⚠️ 改构建配置必须单独 PR；AI 不得自行动手                                                                                                      | 🟠 中    |
| Git 工作流 / 常用命令  | Git常用命令（§2.6）                               | `02-ai-rules.md §13.2.2` + `11-upstream-sync.md`                 | ⚠️ 普通命令可照搬；但**禁止** `git reset --hard` / `git push --force` / `--no-verify` 等破坏性操作                                             | 🟠 中    |

---

## 4. FAQ「快速入门，新手必看」对本项目的裁决

> 锚点：https://pure-admin.cn/pages/FAQ/#快速入门-新手必看（已验证真实存在）

1. **完整版作参考库，不作业务底座**：实际业务项目不直接用 `vue-pure-admin` 完整版，完整版只作为 `vue-pure-admin/` 只读参考；具体业务用本仓库 `u-admin-web-starter`（Max-Ts 精简 + Max 合一版）或派生项目。
2. **使用 pnpm，不换 npm / yarn**：项目 `preinstall: "npx only-allow pnpm"` 强制。`02-ai-rules.md §13.2.1` 已硬约束。
3. **提交 / 打包前必须跑** `pnpm typecheck` 与 `pnpm lint`：`02-ai-rules.md §13.3 第 8 条`；提交前再 `pnpm build`。
4. **husky 不删除**：husky 钩子（commit-msg / pre-commit）在 `node_modules` 安装后会自动启用。不允许 `git commit --no-verify` 绕过（`02-ai-rules.md §13.3 第 12 条`）。
5. **不走 monorepo**：starter + 多业务仓库独立 clone 派生（`08-starter-derivation.md §17.3`）。
6. **正式项目目录路径不要使用中文**：FAQ 明确建议中文路径可能导致 vite / pnpm / 部分工具识别异常。本仓库 starter / srvf-admin-web / srvf-nest-api 均在英文路径下；唯一例外是上游参考目录 `/Users/dengwang/Documents/coding/SRVF-web-admin参考/`，仅用于历史只读，**不在该路径下做长期项目开发**。
7. **第一阶段禁用 asyncRoutes**：FAQ 关于动态路由的章节**只作为排错参考**；本仓库 + 派生项目第一阶段一律不启用（裁决 2、`03-router-menu.md §5.2.1`）。即便人类后续启用，前端字段也**不得反推后端菜单表**（红线 2）。
8. **`rank: 0` 仅 home 可用**：FAQ 明确规则。后续业务静态菜单（`src/router/modules/<业务>-*.ts`）`meta.rank` **必须从非 0 开始**（如 1、2、3…）；同一层级 rank 不重复。同等规则见 `03-router-menu.md §5.4` meta 字段表。
9. **Node / pnpm 版本要求**：FAQ 给出 Node 与 pnpm 版本下限；本项目 `package.json: engines` 是事实来源（`node ^20.19.0 || >=22.13.0`、`pnpm >=9`）。`setup-notes.md` 已记录验证环境（Node v22.15.0 / pnpm 10.14.0）。如 FAQ 后续要求升级，按 `02-ai-rules.md §13.2.1` 由人类决定是否升 `engines` 字段。

### 不在 FAQ 但等价的硬规则补充

- **不在生产环境保留 `enableProd: true`**：FAQ 未必显式提，但 `06-mock-risk.md §8.5` 已升级为 P0。
- **不为 mock URL 反推后端 API 路径**：红线 2。
- **不为 mock 角色名（admin / common）做正式 RBAC**：红线 4。

---

## 5. 禁止反推清单（与主入口 §0.5 红线对齐）

以下"官方文档某节 → 本项目后端 / SRVF 实现"的反推路径**全部禁止**：

| 官方文档节                                         | 不允许反推到                                                                                                                  |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| RBAC权限（§2.4）                                   | SRVF 后端 `Permission / Role` 表 / 字段名 / 字符串 code 体系（红线 4）                                                        |
| 对接平台的前后端项目（§2.5，含官方 Node 后端示例） | `srvf-nest-api` 模块组织、字段、API 路径                                                                                      |
| 官方 mock 接口                                     | 后端真实 API 路径、字段名、返回结构（红线 2）                                                                                 |
| 官方菜单管理示例字段（`MenuData` 23 字段）         | 后端菜单管理表（红线 2、`03-router-menu.md §5.2.1`）                                                                          |
| 完整版多租户能力                                   | 后端 `tenant / package` 表（红线 3、`07-max-ts-modules.md §10.2`）                                                            |
| 官方示例角色名 `admin / common`                    | SRVF 真实角色（实际是 `SUPER_ADMIN / ADMIN / USER`，但前端不得在 review 完成前硬编码任何业务角色——以后端 Prisma schema 为准） |
| 官方支持某可选能力（如 i18n / SSE / WebSocket）    | 默认本项目也必须实现——业务优先级由用户决定，不跟官方                                                                          |
| FAQ 中提到的字段 / 示例                            | 后端字段命名（一切以 Swagger / Prisma 为准）                                                                                  |

---

## 6. 路径与环境注意事项

### 路径

- ✅ **正式长期项目目录全英文路径**：
  - `/Users/dengwang/Documents/coding/u-admin-web-starter`
  - `/Users/dengwang/Documents/coding/srvf-admin-web`
  - `/Users/dengwang/Documents/coding/srvf-nest-api`
- ⚠️ **历史参考目录可有中文**（不在该路径下做长期开发）：
  - `/Users/dengwang/Documents/coding/SRVF-web-admin参考/`（上游母版只读 + vue-pure-admin 完整版只读，仅作历史参考）
- ⛔ **不要把正式项目放在带中文路径的目录下**（FAQ 明确建议）。

### Node / pnpm 版本

| 来源                    | 要求                                                           |
| ----------------------- | -------------------------------------------------------------- |
| `package.json: engines` | `node ^20.19.0 \|\| >=22.13.0`、`pnpm >=9`                     |
| 本项目验证环境          | `node v22.15.0`、`pnpm 10.14.0`（见 `setup-notes.md` §1）      |
| 官方 FAQ（§2.6）        | 由官方维护，可能与上面有差异；**以本项目 `package.json` 为准** |

- 切换 Node 推荐用 `nvm` / `fnm`；本项目 `.nvmrc` 已存在。
- pnpm 由 `preinstall: only-allow pnpm` 强制；用 yarn / npm 会被项目主动拒绝。

---

## 7. 后续维护方式

### 维护操作流程

- 官方文档索引（本文件）**可随上游更新而维护**，但**不复制官网全文**——仅维护"索引 + 项目内裁决"。
- 每次上游 Pure Admin 版本变更或本项目 `package.json` 升级时，由人类：
  1. **实际抓取**官网 sidebar（不是凭记忆 / 不是猜路径）：
     ```bash
     curl -sL -A "Mozilla/5.0" https://pure-admin.cn/pages/introduction/ -o /tmp/pa-intro.html
     python3 -c "import re;\
       html=open('/tmp/pa-intro.html',encoding='utf-8').read();\
       pat=re.compile(r'<a[^>]+href=\"(/pages/[^\"]+/)\"[^>]*>(.+?)</a>',re.S);\
       seen={};\
       [seen.setdefault(h, re.sub(r'<[^>]+>','',t).strip()) for h,t in pat.findall(html)];\
       [print(h,'->',t) for h,t in seen.items()]"
     ```
  2. 用抓到的 `(href, 中文标题)` 真实对应表，对照本文件 §2 修订；
  3. **如果官网新增 / 改名 / 删除某条目**，本文件 §2 必须同步；
  4. 评估对本项目影响（按 `11-upstream-sync.md` §11-3 高风险文件清单 + §11-4 分类）；
  5. 若 §3 任务阅读表受影响，仅微调；**不要扩写**。

### 抓取硬约束

- **所有 URL 必须来自实际抓取**；
- ⛔ **禁止**写"基于常见路径推断"、"可能 404"、"待确认但先写链接"等表述；
- ⛔ **禁止** AI 凭空猜测官网新路径；
- 如某条目无法在官网 sidebar 中验证（如官方删除），从本文件 §2 中**移除**，不要留半截链接；
- 抓取时间应记录在 §2 开头，便于回溯（当前：2026-05-15）。

### 边界

- 官方文档变更**不得直接改变后端契约**——任何后端行为变化必须经 srvf-nest-api 仓库的 Swagger / Prisma schema 拍板，再回头适配前端。
- 本文件不是规则源——所有硬规则仍以 `02-ai-rules.md` / `03-router-menu.md` / `04-auth-permission.md` / `05-http-api.md` / `06-mock-risk.md` / `08-starter-derivation.md` / `09-pr-roadmap.md` / `11-upstream-sync.md` 为准；本文件只做"官方文档 → 本项目"的映射 + 裁决索引。

---

## 8. Official Docs vs Full Version Reference

> 本节明确"官方文档（pure-admin.cn）"与"本地完整版（`vue-pure-admin`）"两个不同来源的角色边界，避免混用。

### 8.1 两个来源的定位

| 来源                           | 路径 / URL                                                                               | 用途                                                                            | 不可用作            |
| ------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------- |
| **官方文档**                   | `https://pure-admin.cn/pages/*`（30 条真实链接见 §2）                                    | 理解 Pure Admin **框架机制**（路由、菜单、布局、主题、Tailwind、构建插件、FAQ） | 业务需求 / 后端契约 |
| **完整版参考库**               | `/Users/dengwang/Documents/coding/SRVF-web-admin参考/vue-pure-admin`                     | 观察 **页面 / 组件 / UI 交互范式**                                              | 业务需求 / 后端契约 |
| **Pure Admin Max-Ts 上游母版** | `/Users/dengwang/Documents/coding/SRVF-web-admin参考/pure-admin-thin-max-ts`（付费私有） | starter 的派生来源；通过 cherry-pick 同步（见 `11-upstream-sync.md`）           | 业务需求 / 后端契约 |

### 8.2 共同禁止

无论 **官方文档** 还是 **完整版参考库**，都不能：

- ⛔ 作为**后端契约**来源（API 路径 / 字段命名 / 返回结构 / 错误码）；
- ⛔ 反推**业务需求**（"它有 → 我们也要"是错误推理）；
- ⛔ 反推**后端模型**（schema / 表 / RBAC / tenant / 菜单管理表 / 状态机）；
- ⛔ 反推**业务流程**（如完整版的"角色分配菜单流程"不一定是项目流程）。

### 8.3 各自的合法读取场景

| 场景                                       | 优先读官方文档                               | 优先读完整版参考库                                                 |
| ------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------ |
| 想知道"Pure Admin 的路由是怎么设计的"      | ✅（`/pages/routerMenu/`）                   | ⚠️ 可参考完整版 `src/router/modules/*.ts` 但只看写法               |
| 想知道"`<PureTable>` 的列配置怎么写"       | ⚠️（官方文档不一定有；`/pages/components/`） | ✅（直接读完整版任一 list 页面）                                   |
| 想知道"Tailwind v4 在本项目怎么用"         | ✅（`/pages/tailwindcss/`）                  | ⚠️ 看完整版 `src/style/tailwind.css` 配合                          |
| 想知道"FAQ 中 `rank only home` 是怎么回事" | ✅（`/pages/FAQ/#快速入门-新手必看`）        | —                                                                  |
| 想知道"组织树 + 表格 + 弹窗如何组合"       | ⚠️（官方文档侧重机制不侧重 UI 样例）         | ✅（完整版 `src/views/system/dept/`）                              |
| 想知道"Pure Admin 支持哪些 vite 插件"      | ✅（`/pages/viteplugin/`）                   | ⚠️ 看完整版 `build/plugins.ts` 实际接法                            |
| 想知道"i18n 如何接"                        | ✅（`/pages/i18n/`）                         | ✅（完整版 `src/plugins/i18n.ts`）—— **但第一阶段一律不启用 i18n** |

### 8.4 参考路径决策树

```
我想做的事
├── 框架机制 / 配置语法 / FAQ → 读官方文档（§2 真实链接表）
├── 页面 / 组件 UI 范式      → 读完整版（07-max-ts-modules.md §12.4）
├── 同步上游 Max-Ts 母版     → 读 11-upstream-sync.md
├── 业务字段 / API / 角色    → 读后端 Swagger（不是官方文档，不是完整版！）
└── 派生新业务项目          → 读 08-starter-derivation.md §17.3 + §17.4
```

### 8.5 互不替代

- 官方文档**不可替代**完整版（机制 ≠ 范式）；
- 完整版**不可替代**官方文档（代码 ≠ 配置说明）；
- 两者**都不可替代** NestJS Swagger（前端文档 / 框架 / 范式 ≠ 后端契约）。
