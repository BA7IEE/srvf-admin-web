# 07 发布记录

## main@2cca7a3 — 2026-07-10 UX 产品化系列（#81~#93）

| 项             | 内容                                                         |
| -------------- | ------------------------------------------------------------ |
| 日期           | 2026-07-10                                                   |
| 类型           | feature_series + docs_state_sync                             |
| Git 基准       | `main@2cca7a3` / `origin/main`                               |
| 相对旧 handoff | `1aba0da..2cca7a3`，#81~#93，106 文件，+5854/-3691           |
| 验证状态       | BUILD_PASS + 逐 PR 浏览器/dev 后端冒烟（:8849 + live :3000） |
| 包状态         | 未重新打包；以当前 checkout 为准                             |

### 本轮内容（每 PR 均 lint/typecheck/build + 实测后 squash 合并）

- #81 docs:产品化升级蓝图（体验路线单一来源,读 §4.1 军规与 §8 拍板清单后再动菜单/文案/交互）。
- #82 fix:止血三修——个人中心角色码中文化、考勤「提交人 ID/版本」列改姓名（resolve-labels）、招新详情枚举兜底「未知状态」。
- #83 feat:术语人话化（横扫/作战室/会籍/督导/悬空多主/一键发号/重载权限缓存/阈值三件套等 ~20 词,仅展示层）+ SrvfListPage intro prop + 22 页 PageIntro。
- #84 feat:IA v3——一级菜单 10 组→7 组;14 个配置运维页收进「队务设置」设置中心（新页,四分区卡片,权限同口径裁剪）;内容+通知合组;招新组改名;工作台快捷发起（?create=1 直开新建弹窗）+ 最近访问行。
- #85 feat:SrvfFlowSteps 原语;活动详情生命周期条（draft→published→completed,cancelled 分支红显）;考勤复核四步条（含「提交人本人不能终审」预防提示）;队员档案 11 页签分组重排、默认落「档案」;活动表单三分区。
- #86 feat:招新总览两道门漏斗页（门一=cycles/:id/stats,门二=各状态列表 total 自拼,零新端点）,设为招新组落地页;入队状态标签「评估→评定」统一。
- #87 feat:使用手册页（七篇「怎么做 X」任务指南,贴真实按钮名）,入口=工作台页头+首页卡。
- #88 fix:登录框 demo 预填清除（auth 文件 src/views/login/index.vue,ask 闸人工批准;仅表单初值,不触 token/守卫）。
- #89 fix:铃铛假消息（「小铭 评论了你」demo 数据）改真实待办入口（layout 文件;dashboard-summary 角标+我的待办面板+直达工作台;块级权限裁剪 key 缺失≠0）。
- #90 feat:授权向导——选人→选场景→预演确认;场景 A 任命（preview 预演,真实拦过违规）、场景 B 考勤终审权（POSITION_ASSIGNMENT 绑定+resolvedScope 回显+scoped 边界红线）、场景 C 业务角色（user-roles 通道,4 个派生角色剔除);三入口。
- #91 feat:工作台启用进度卡（字典/组织/职务/职务规则/贡献值规则五项探测,读码门控,全就绪隐身）+ 职务规则/贡献值规则/角色绑定表单 15 处字段提示（FormLabelTip）。
- #92 chore:harness——src/layout/\*\* 编辑闸 deny→ask（逐次人工确认）。
- #93 refactor:19 个列表页迁移 SrvfListPage（kit 采用率 20/29,hook 未动,列插槽逐字保留）;外壳新增 #banner 槽位;6 个结构不适配页明确豁免。

### 已知遗留

- 旧权限空态垫片 `src/views/srvf/components/perm-empty.vue` 已零引用,文件删除待人工（harness 删除闸）。
- 字典**数据**里的技术文案（如考勤状态「待 APD 审核」、字典类型「Demo work nature」）在「队务设置 → 字典管理」页人工修改,不涉代码。
- 蓝图 §6 五任务无提示测试待真人执行（第 ⑤ 条授权链已具备向导支撑）。

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
