# 07 发布记录

## main@1aba0da — 2026-07-10 handoff refresh

| 项             | 内容                                             |
| -------------- | ------------------------------------------------ |
| 日期           | 2026-07-10                                       |
| 类型           | docs_state_sync                                  |
| Git 基准       | `main@1aba0da` / `origin/main`                   |
| 相对旧 handoff | `c2001c9..1aba0da`，#34~#80                      |
| 验证状态       | BUILD_PASS（直接 `vue-tsc` + `vite build` 通过） |
| 包状态         | 未重新打包；以当前 checkout 为准                 |

### 本轮目标

- 接续 Claude Code 未完成的交接刷新。
- 把 handoff 从 2026-07-05 `7.1.0-p1.meta-workbench` 口径刷新到当前 `main@1aba0da`。
- 明确 #34~#80 已合入后的真实主线状态，特别是字典主从布局、组织人事、RBAC、账号闭环、srvf-kit 原语层。
- 如实记录当前验证：源码类型检查和构建通过，但 `pnpm` 入口与 handoff 自检脚本存在环境/脚本噪音。

### 主线增量摘要（#34~#80）

- #35：v0.37 重估蓝图，建立差距矩阵、IA v2、Phase 0~3 路线图。
- #36：Phase 0-a 行为校准：终审专用文案、工作台卡片下钻、`q` 关键词横扫。
- #37~#42：组织人事支柱：会籍、职务、任职、角色绑定、督导、权限诊断。
- #43~#45：Phase 2：招新工作台补件、公告导入、通用附件库。
- #46~#49：Phase 3：品牌 tokens、工作台设计稿升级、考勤选人 UX、打印。
- #50：Phase 0-b 清理：归档 starter 遗留 views、`system.ts` demo URL、mock。
- #51：Auth 专线：40100 被动刷新重试 + logout 接入真实撤销端点。
- #52~#54：RBAC 治理面三件套：角色、权限点、用户-角色分配。
- #55~#60：组织人事收尾、审计详情、真实缺陷回填。
- #61~#67：体验层 A~D、错误文案兜底、用户搜索与按用户下钻授权。
- #68~#70：队员账号闭环和账号 tab 增强。
- #71~#72：字典主从布局与树表层级视觉。
- #73~#80：语义翻译层、srvf-kit 表现层/详情壳/远程选择器/列表壳/全局搜索原语与入口。

### Auth 专线声明（历史代码事实）

PR #51 修改过以下 auth 高风险文件：

| 文件                        | 改动                               | 影响面                   |
| --------------------------- | ---------------------------------- | ------------------------ |
| `src/api/user.ts`           | 增补真实 logout / refresh 相关调用 | auth API                 |
| `src/store/modules/user.ts` | 接入真实登出撤销与相关状态处理     | 登录状态、token 生命周期 |
| `src/utils/http/index.ts`   | 40100 被动刷新重试路径             | 全局请求、token refresh  |

本次 handoff refresh 没有修改这些文件。

### 本轮验证

- `./node_modules/.bin/vue-tsc --noEmit --skipLibCheck`：PASS。
- `./node_modules/.bin/vite build`：PASS。
- `pnpm typecheck`：BLOCKED，pnpm 触发依赖状态检查并尝试 install，无 TTY 下中止。
- `python3 scripts/check_handoff_docs.py --root .`：FAIL_NOISY，脚本误扫依赖目录与 Git 对象。
- 浏览器/dev 后端冒烟：未执行。

### 下一步

优先做浏览器/dev 后端冒烟与 handoff 自检脚本排除规则修复。字典主从布局任务本身在主线 #71/#72 已完成。

## 7.1.0-p1.meta-workbench — 历史基准（2026-07-05）

该版本曾作为 handoff 基准，但已被当前 `main@1aba0da` 超越。保留结论如下：

- P0 `/get-async-routes` 生产链路已移除。
- P1.1 工作台接入 `GET /api/admin/v1/meta/dashboard-summary`。
- 登录页旧预填密码已清空。
- 用户当时本地反馈 `pnpm typecheck`、`pnpm build`、`pnpm dev`、真实登录、工作台摘要通过。

旧结论不得再作为“下一步 memberships-read”的任务入口。
