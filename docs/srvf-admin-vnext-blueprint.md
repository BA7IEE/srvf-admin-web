# SRVF Admin vNext 蓝图（后端 v0.37.0 重估）

> **版本**：v1.0 · 2026-07-06
> **性质**：本仓当前的**开发路线单一来源**（现状判定 · 差距矩阵 · IA v2 · Phase 0~3 路线图）。任何新业务页动工前，先在本文件找到它的定位与阶段，再按 `CLAUDE.md` §6 / `02-ai-rules.md` §13.4 走 preflight。
> **数据源**：live `/api/docs-json`（v0.37.0 · 232 paths / 320 operations / 195 权限码）+ `../srvf-nest-api` 源码与 `docs/handoff/admin-web.md`（轴模型/踩坑/缺口台账）+ 本仓 main(`88ab63a`) 全量盘点 + ChatGPT 平行轨两个包（v7.1.0-p1 zip、v7.11.0 fork）+ 参考库（vue-pure-admin / pure-admin-thin-max-ts / SRVF UI 设计稿）。
> **对账快照**：2026-07-06 结构级对账（方法+路径逐条比对 live 契约），方法与局限见附录 A，未消费清单见附录 B。快照会过期——执行各 Phase 时以当时的 live `/api/docs-json` 复核。
> **体验层后续**：本文 Phase 0~3 与 67 条差距已全部落地（2026-07-10）；体验层的下一程（IA v3 / 工作台 v2 / 流程显性化 / 术语系统）见 **`srvf-admin-ux-upgrade-blueprint.md`**（产品化升级蓝图）。

---

## 0. 一句话结论

**本前端不是"整体过时"，而是"缺一根支柱 + 欠一层行为校准"**：已上线的 30+ 页面结构级对账 **105/105 全绿**（不存在接口失效），真正的差距是**覆盖面**——admin/system 面 232 条路径中 **67 条未消费**，其中约 57 条集中在后端 v0.34~v0.35 长出的**组织·职务·任职·分管·角色绑定·分域授权**治理层与**附件链**。正确打法：**保底座、补支柱、逐项校准、最后上体验层**，不推倒重来。

## 1. 现状判定（2026-07-06 对账数字）

| 维度       | 事实                                                                                                                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 后端       | v0.37.0 · 232 paths / 320 operations / 195 权限码 / 35 模块；handoff gap-ledger **8 项全关**；后端交接文档原话："后端能力早已就绪，前端是主要工作量所在"                                                                                      |
| 前端页面   | 7 组任务式 IA · 30+ 页**全部真接后端、零占位**（2026-06-28 PR #24 起多轮扩展；`88ab63a` 已合流 meta 工作台）                                                                                                                                  |
| 契约对齐   | 严格对账（方法+路径）捕获 112 条调用：**105 ✅ / 7 条异常全部是 starter 遗留 demo**（`src/api/system.ts` 的 `/dict-tree`、`/tenant-*`，无 SRVF 页面引用）。宽松路径对账 120 条结构路径中 118 条存在、2 条为 JSDoc 注释痕迹                    |
| 权限码消费 | 126 / 195；未消费的 69 码与未消费的 67 路径高度重合（同一批域）                                                                                                                                                                               |
| 认证       | 3-call 登录（login → me + rbac/me/permissions）+ 主动预刷新已稳定；**未接** `/auth/v1/logout(-all)`，**无** 40100 被动刷新重试（fork 有实现待移植）                                                                                           |
| 平行轨     | v7.1.0-p1 zip 与 main **逐字节一致**（已合流，勿再找增量）；**v7.11.0 fork**（`<refs-root>/srvf-admin-web_v7.0.1-fork`，占位符见 `docs/external-refs.md`，以内部 `VERSION` 为准）有 4 个组织人事页面 + scoped-authz 范式 + 考勤表单重构可移植 |

> 结论：**"过时"的实质 = 覆盖面差距 + 少量行为层校准（参数语义/错误码 UX/生命周期动作），而非已接页面失效。**

## 2. 后端能力图要点（前端必须内化的部分）

### 2.1 轴模型 = IA 铁律

后端把一切建成沿"所有权轴"嵌套的子资源，URL 树本身就是任务驱动的信息架构：

- **活动轴** `activities/:id` → `registrations` / `attendance-sheets`
- **队员轴** `members/:id` → `memberships`（多归属）/ `certificates` / `profile` / `emergency-contacts` / `insurances` / `registrations`（跨轴只读）/ `attendance-records`（跨轴只读）/ `contribution-summary`（capped 值）/ `position-assignments`（双轴只读）/ `supervision-scope`（只读）

✅ 正模式：沿轴下钻（进活动看报名/考勤）或跨轴横扫（按 `statusCode` 扫全队待办）。
⛔ 反模式：把嵌套子资源拍平成顶级菜单 + 手选父级下拉（如"报名页选活动"）。memberships / 任职**不做**顶级"归属管理/任职管理"菜单——它们是队员 360 的 tab 与组织架构面板。

### 2.2 版本演进线（v0.32 → v0.37）

| 版本     | 新能力                                                                                                                                                                      | 前端现状                                               |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| v0.32~33 | 通知全切片（站内/微信/短信兜底）、招新 OCR 三图                                                                                                                             | 通知已接；OCR 三图查看已有 api 封装、批量门槛/导出未接 |
| v0.34    | 组织 reparent+闭包表、memberships 多归属、职务+职务规则、任职（preview/revoke/history）、督导、角色绑定（scoped）                                                           | **全部未接**（fork 接了 4/6 域的基础面）               |
| v0.35    | AuthzService 判权大脑、authz explain 诊断、**考勤终审权改道**（22074/22075）、公告导入、participation 三模块分域判权                                                        | 未接；终审 UX 未适配                                   |
| v0.36    | F1-F5 前端对接批次：搜索/选择器、resolve-labels、扁平列表增强（q/expand/组织过滤）、role-bindings 分页、action-state 批量判定、memberships 总表+transfer、tree-with-summary | 专为前端造的，基本未消费                               |
| v0.37    | `meta/dashboard-summary`、组织轴 memberships 过滤参数、action-state 回显补全                                                                                                | dashboard-summary 已接（`srvf-meta.ts`）               |

### 2.3 角色体系（8 个内置角色）

| 角色                                                                                 | 特点                                                                          |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| super-admin                                                                          | 全权限兜底（终审仍受 22074 自审拒约束）                                       |
| ops-admin(94) / biz-admin(73) / member(9)                                            | 传统全局角色；**biz-admin 自 2026-07-03 起不再天然持考勤终审权**              |
| org-admin(57) / group-manager(22) / org-supervisor(4) / attendance-final-reviewer(3) | **seed 零持有**的派生角色，靠"职务→角色 policy"或显式 role-binding@scope 生效 |

### 2.4 踩坑表（9 条，全部来自后端 handoff，Phase 0 的行为校准来源）

| #   | 规则                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 登录是 3-call；别假设 login 返回身份/权限                                                                                                                                      |
| 2   | 字段以 live `/api/docs-json` 为准，任何手写指南（含本文件）都可能漂                                                                                                            |
| 3   | 权限码用真实码，禁臆造                                                                                                                                                         |
| 4   | 贡献值用 `contribution-summary` 的 capped 值（北京日封顶 1.5），前端别裸 SUM                                                                                                   |
| 5   | 菜单=前端静态+`permissions[]` 过滤，后端**零菜单端点**（asyncRoutes/getMenuList 禁区不是过时文档，是双方架构约定）                                                             |
| 6   | App(app/v1) ≠ Admin；唯一例外=账号级自助端点（如改密 `PUT /app/v1/me/password`）                                                                                               |
| 7   | 附件走 `upload-url → 直传 COS/Local → confirm-upload` 三步链；signed-URL ~15min 时效，不可存档复用                                                                             |
| 8   | 考勤终审 2026-07-03 改道：仅 SUPER_ADMIN 或 attendance-final-reviewer scoped 绑定可终审；新错误码 **22074**（自审拒）/ **22075**（同人拒）必须给专用文案，别混进通用"权限不足" |
| 9   | `GET /organizations/:orgId/memberships` 缺省**三态混返**（ACTIVE/ENDED/SUSPENDED 全历史）——组织成员页必须显式传 `status=ACTIVE`                                                |

### 2.5 其他关键事实

- **认证**：auth/v1 共 11 端点（账密/OTP 短信/微信登录三路 + refresh + logout/logout-all + 找回密码 + 微信绑定）。accessToken 15min；refreshToken 90 天绝对死期 + family rotation。前端已实现主动预刷新；`logout(-all)` 未接、40100 被动刷新重试未实现（→ Auth 专线）。
- **统计端点**：只有 `GET /admin/v1/meta/dashboard-summary`（按权限出块）与 `GET /recruitment/cycles/:id/stats`；没有通用 /stats——仪表盘想要更多聚合须先登 gap-ledger，禁止前端拼 N 个列表凑数。
- **工作台扁平端点**（`/admin/v1/registrations`、`/admin/v1/attendance-sheets`）目前 **GLOBAL-only**：纯 scoped 持有者调用会得 30100，页面要优雅降级。
- **内容附件有专用子资源**：`POST /contents/{id}/attachments/upload-url|confirm`、`DELETE /contents/{id}/attachments/{attachmentId}`——内容封面/插图走这套，不走通用 attachments。**前端已实现**（`src/api/srvf-content.ts` + 内容页封面/附件 drawer `content-media.vue`；2026-07-06 Phase 0 审计确认）。

## 3. 差距矩阵（后端域 × 前端 × 行动）

| 后端域                                                | 前端现状                                                   | 行动                                                                         | 阶段          |
| ----------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------- |
| 活动/报名/考勤                                        | ✅ 作战室已接                                              | 校准：终审 22074/22075 文案、扁平列表增强参数、代报名/导出 CSV 补动作        | P0            |
| 通知 / 内容                                           | ✅ 全生命周期已接（发布/撤回/归档 + 内容封面附件链）       | 无——Phase 0 审计（2026-07-06）确认已完成                                     | —             |
| 队员 360 六子资源                                     | ✅ 已接                                                    | 校准 + 贡献值 capped 展示                                                    | P0            |
| **memberships 多归属**                                | ❌ 无（仍用已废弃单部门 `/department`）                    | 新建（先只读切片）                                                           | P1-A          |
| **职务 / 职务规则**                                   | ❌ 无                                                      | 移植 fork 两页                                                               | P1-B          |
| **任职 position-assignments**                         | ❌ 无（fork 也没有）                                       | 新建（preview→任命、revoke、history、双轴视图）                              | P1-C          |
| **督导 supervision**                                  | ❌ 无                                                      | 移植 fork + 补 coverage-preview / page                                       | P1-D          |
| **角色绑定 role-bindings**                            | ❌ 无（现有 `system/rbac` 页只是角色→码静态只读）          | 移植 fork + 补 /page、preview、batch                                         | P1-D          |
| **authz 诊断**                                        | ❌ 无                                                      | 移植 fork 的 explain 抽屉 + scoped-authz util；action-state/batch 按钮态按需 | P1-D          |
| 组织架构增强                                          | ⚠️ 仅基础 CRUD                                             | 升级：tree-with-summary、move、右侧三面板（成员 ACTIVE/在任职务/被谁分管）   | P1-A/C        |
| **附件域（通用 attachments）**                        | ⚠️ 附件配置页 + 内容子资源链已接；通用附件库（5 路径）未接 | 新建通用附件库页（by-owner / upload-url / confirm-upload）                   | P2            |
| 招新工作台件                                          | ⚠️ 部分                                                    | 补 cycles/:id/stats 卡、promote-precheck 弹窗、batch-mark-threshold、export  | P2            |
| 公告导入                                              | ❌ 无                                                      | 一次性工具页（preview→execute）                                              | P2            |
| RBAC 管理面（roles/permissions 写操作、user-roles）   | ⚠️ 只读 roles + reload                                     | 谨慎评估：默认保持只读+reload；若要开放 assign 走单独决策                    | P2 评估       |
| 选择器族（`*/options`、tree-options、resolve-labels） | ⚠️ 零散                                                    | 统一薄封装，表单选人/选活动/选组织一律用后端选择器端点                       | P0 起随用随建 |
| Mobile-\* / Open-\* / health                          | 不属于本后台                                               | 忽略（小程序面见后端 `docs/handoff/miniapp.md`）                             | —             |

## 4. 按角色的任务流（"真正实用"的验收视角）

每个 Phase 的验收不是"接口通了"，而是**对应角色的闭环跑通**：

| 角色            | 高频闭环                                                                          | 依赖页面/能力                                        |
| --------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 值班/队部管理员 | 开工清待办：待审报名→批、待审考勤→批、待终审→转给有权者                           | 工作台卡片 + 扁平列表下钻（statusCode 预置筛选）     |
| 活动负责人      | 建活动→发布→审报名→交考勤单→一级审→终审→贡献值自动落                              | 活动作战室（终审按钮态与 22074/22075 文案是关键 UX） |
| 人事/组织管理者 | 挂靠/转隶（transfer 单事务）/任命（preview 预检）/免职/数据体检（conflicts）      | 组织与人事支柱（P1 全部）                            |
| 权限管理员      | "他为什么不能终审？"5 分钟内有答案；给任职绑 attendance-final-reviewer            | 角色绑定页 + explain 诊断抽屉                        |
| 招募负责人      | 报名审核（脱敏/明文两档）→OCR 验证件→标门槛（可批量）→评定→公示→precheck→一键发号 | 招新作战室 + P2 补件                                 |
| 内容/通知编辑   | 写→传封面→发布→撤回/归档；紧急短信兜底（计费二次确认）                            | 内容/通知全生命周期 + 附件子资源                     |
| 后勤            | 队保单一键覆盖全员 ACTIVE；证书核验                                               | 已有页校准（跨队员证书待核验队列=后端缺口，见 §10）  |

## 5. IA v2（演进式，不推倒）

```
工作台            [已有→校准] dashboard-summary 卡 + 三类待办下钻
活动运营          [已有→校准] 活动列表 + 作战室(报名/考勤)
队员              [已有→扩展] 列表 + 360(新增 tab: 组织归属/任职/分管范围) + 队保单
组织与人事 ★新支柱  组织架构(升级: 计数树/move/三面板) · 会籍总表+迁移+冲突体检 · 任职总表
招募与入队        [已有→校准] 招新/入队作战室 + P2 工作台件
内容与公告        [已有→扩展] 内容(全生命周期+封面) · 公告导入 · 附件库
通知中心          [已有] 通知(全生命周期) · 微信模板
系统管理          [已有→扩展] 用户 · 角色与权限(静态只读) · ★角色绑定 · ★权限诊断 · 审计/短信日志 · 附件配置 · 四单例设置
基础数据          [已有→扩展] 字典 · 贡献值规则 · ★职务定义 · ★职务规则
```

- **菜单门控统一到 `meta.auths`（细权限码）**，替换系统页残留的 `meta.roles` 粗门控（派生角色 seed 零持有，roles 门控天然不兼容）。fork 的写法（如 `auths: ["position.read.definition"]`）即范式。
- **scoped 用户降级**：菜单按码过滤的前提是 `/rbac/me/permissions` 对派生角色返回其码——**未确认**，P1-A 实装前先 live 验证；工作台扁平列表对纯 scoped 用户返 30100，页面要给"按组织轴查看"的替代入口而非报错。

## 6. 路线图

### Phase 0 · 行为校准（2026-07-06 审计后收敛为 0-a 落地 + 0-b 待办）

> 审计结论：v1.0 原清单第 3 项（通知/内容 unpublish/archive）与"内容封面附件链"在 #24~#34 期间**已实现**——蓝图曾基于盘点摘要高估缺口，本节按实况收敛。`statusCode`、作战室跳转、`resolve-labels` 封装亦已在位。

**Phase 0-a（本轮落地）**：

1. 考勤终审专用文案：22074（自审拒）/ 22075（同人拒）/ 30100（终审权来源提示）——`finalReviewErrorMessage`（`src/api/srvf-attendance.ts`），作战室与工作台两处终审 catch 接入；
2. 工作台摘要卡可点下钻：切 tab + 预置 `statusCode` 重查（"进行中活动"卡跳活动列表）；
3. 横扫列表消费 `q` 关键词（契约 F2；memberQ/activityQ/organizationId/expand 等留待有场景再消费）。

**Phase 0-b（待办，涉及 ask-gated 文件，需人工在场）**：`src/api/system.ts` 7 条 demo URL、`mock/` 与 starter 遗留 views（dict/tenant/schedule/permission）确认无引用后一并归档。

**DoD**：对账保持全绿；0-a 三项真后端点验；`pnpm lint/typecheck/build` 全绿。

### Phase 1 · 组织人事支柱（3~4 个 PR，大头）

- **P1-A memberships 只读切片**：队员 360"组织归属"tab + 组织架构成员面板（显式 `status=ACTIVE`）+ 会籍总表 + conflicts 体检页（全只读，低风险起步）。
- **P1-B 职务体系**：移植 fork `base-data/positions` + `position-rules` 两页（复核 v0.36 后新增的 options 端点）。
- **P1-C 任职**：组织架构"在任职务"面板 + 任命弹窗（preview 预检→提交）+ 撤销 + 历史链 + 队员 360"任职"tab + 全局任职总表（expand）。
- **P1-D 治理面**：移植 fork `system/role-bindings` + `base-data/supervision-assignments` + explain 抽屉/scoped-authz util；补 /page 分页、preview、batch、coverage-preview；membership `transfer` 写操作。

**DoD**：§4 中"人事/组织管理者"与"权限管理员"两条闭环真实后端跑通；权限码消费 126 → ~180。

### Phase 2 · 附件链与内容闭环（1~2 个 PR）

通用附件库页（by-owner + upload-url/confirm-upload 三步链）+ 招新工作台件（stats/precheck/批量门槛/export）+ 公告导入工具页。内容封面已实现（contents 子资源链，见 §2.5），不在本阶段。导出一律用后端 CSV，**不为 xlsx 加依赖**。

**DoD**：上传→引用→signed-URL 过期重取全链路演示；招募负责人闭环含批量件。

### Phase 3 · 体验层（持续小步）

SRVF 品牌 tokens（设计稿 `srvf-tokens.css`：救援红 #C4001B / 盾蓝 #19478A / 金 #C9A24A + 状态三色）→ 工作台按设计稿升级（KPI 卡 + 出勤堆叠柱 + 活动日历，echarts 已有零新依赖）→ 移植 fork v7.11.0 考勤选人 UX（预取 1000+本地搜索+导入已通过报名+批量填充）→ 打印用原生 window.print 范式。需新依赖的（cropperjs/qrcode/编辑器/地图）逐个由人工单独 PR 决策（§13.2.1）。

### Auth 专线（独立小 PR · 需人工先把 settings.json 相关 deny 翻 ask · 按 CLAUDE.md §4 三要素申明）

1. diff fork 的 `src/utils/http/index.ts` 移植 40100 被动刷新重试路径（现仅主动预刷新）；
2. 登出接入 `POST /auth/v1/logout`（现只清本地）；
3. live 实测 refresh family rotation（防登出风暴）。

## 7. 权限治理速览（新增域的心智模型）

- **`system/rbac` 页 ≠ 角色绑定**：前者是"角色→权限码"的静态定义（只读+reload 足矣）；**role-bindings 是"主体(user/member) → 角色 @ scope"的实际授予**，是 scoped-authz 判权的数据源。
- **判权顺序**（终审为例）：无权限→30100 ＞ 有权限但自审→22074 ＞ 同人→22075（`ATTENDANCE_ALLOW_SAME_REVIEWER=true` 可放开）。
- **explain 是排查工具不是业务流**：不要在每个操作前调；入口放角色绑定页 + "为什么不能操作"一键诊断。
- **scoped-authz 已生效范围**：考勤终审 + participation 三模块点动作；其余业务面仍全局判权（扁平跨轴列表与新建活动 GLOBAL-only）。

## 8. 可复用资产清单

| 来源                                                                                                     | 资产                                                                                                                                                                                                | 用法                                                                                                      |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **v7.11.0 fork**（`<refs-root>/srvf-admin-web_v7.0.1-fork`）                                             | 4 页面（positions/position-rules/supervision-assignments/role-bindings）、`srvf-{position,supervision,role-binding,authz}.ts`、`srvf-scoped-authz.ts` util + `SrvfAuthzExplainDrawer`、考勤表单重构 | **移植而非重写**；fork 打包早于 v0.36 F1-F5，逐端点对 live docs-json 复核（/page、preview、batch 可能缺） |
| 参考库 Tier-1（零新依赖）                                                                                | welcome 仪表盘范式、`system/dept` 左树右表、`system/role` 权限树抽屉、tabs 详情页、分步表单、timeline、可编辑表格、`RePureTableBar` 批量工具栏、打印                                                | 只抄交互骨架；API/字段/码一律换成后端真实值（CLAUDE.md §9 红线）                                          |
| SRVF UI 设计稿（`<refs-root>/SRVF ADMIN UI参考.zip`，解压版 `<refs-root>/SRVF-ADMIN-WEB-UI-Reference/`） | `srvf-tokens.css` 全套品牌色/字体梯度、dashboard 蓝图（KPI 卡/堆叠柱/日历/待命表）                                                                                                                  | Phase 3 直接引入 tokens；布局按蓝图重排                                                                   |
| 需新依赖（人工 PR 决策）                                                                                 | xlsx（**可先用后端 CSV 替代**）、cropperjs（头像/证件裁剪）、qrcode（签到码）、富文本编辑器、高德地图                                                                                               | 每项单独评估，AI 不得自行添加                                                                             |

## 9. 红线（不变）与本轮文档处置

**继续有效的红线**：字段真相=live `/api/docs-json`；不发明后端字段/枚举/状态/权限码；不加依赖；asyncRoutes/getMenuList 禁区；tenant 菜单隐藏；仓库私有；auth 5 文件改动申明制（+harness deny）；完整版参考只抄交互。

**本轮（2026-07-06 docs PR）处置**：

| 文件                                | 处置                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `CLAUDE.md` / `AGENTS.md`           | §2 增"对齐 v0.37.0 现状"小节；§3 必读清单加本蓝图；§5 收紧"占位"措辞（契约已全量就绪，占位仅限已登 gap-ledger 的真实后端缺口） |
| `srvf-frontend-derivation.md`       | 顶部状态横幅（§4/§5 为 v0.10.0 历史快照）；§6 PR 表刷新为实况；文末 PR-4 段标 RESOLVED                                         |
| `srvf-api-integration-guide.md`     | 顶部加蓝图指针 + "通知中心已上线"修正                                                                                          |
| `srvf-api-contract-readiness.md`    | 标 HISTORICAL（使命完成，仅存决策历史）                                                                                        |
| `srvf-static-menu-skeleton-plan.md` | 标 SUPERSEDED（v0.10.0 时代方案，已被实际落地超越）                                                                            |

## 10. 风险与待核实

1. **refresh rotation 未 live 实测**（Auth 专线第一项）；
2. **派生角色的码是否出现在 `/rbac/me/permissions`**：未确认——P1-A 前先验，决定菜单降级策略；
3. **本地 :3000 有"代码新/种子旧"前科**（曾 155 码无 notification.\*）：每次动工先 `GET /api/system/v1/rbac/me/permissions` 数码数，别只看 info.version；
4. **后端缺口候选（要做先登 gap-ledger，禁止前端拼凑）**：跨队员证书待核验队列（证书仅挂队员轴）；通知按条投递明细（现只有全局 sms-send-logs + readCount）；通用统计端点；
5. `src/api/system.ts` demo 残留与 `mock/` 清理要先确认无路由/组件引用（starter 遗留 dict/tenant 页为 ask-gated，清理走 Phase 0 并保持可回滚）。

---

## 附录 A · 对账方法与局限

- **方法**：脚本扫描 `src/api/*.ts` 提取 `(method, url)`（`http.request<...>("get"|...)` 形式）与所有 `/api/...` 字符串字面量（含模板串，`${...}`→`{}`），按"路径段结构 + 方法"与 live `/api/docs-json`（v0.37.0）逐条比对。
- **结果**：严格对账 112 条调用 → 105 ✅ + 7 条 starter demo（`system.ts`）；宽松路径对账 120 条 → 118 存在 + 2 条 JSDoc 注释痕迹；后端 admin/system 面未消费 **67 条**（附录 B）。
- **局限**：结构级对账**不验证** query/body 参数名、DTO 字段、枚举值与错误码行为——这正是 Phase 0 行为校准仍必要的原因。执行时以当时 live 契约为准重跑。

## 附录 B · 后端 admin/system 面前端未消费路径（67 条 · 2026-07-06 快照）

### 组织人事与授权（41）

- positions (3)：`GET,POST /api/admin/v1/positions` · `DELETE,GET,PATCH /api/admin/v1/positions/{id}` · `GET /api/admin/v1/positions/options`
- position-rules (2)：`GET,POST /api/admin/v1/position-rules` · `DELETE,PATCH /api/admin/v1/position-rules/{id}`
- position-assignments (5)：`GET /api/admin/v1/position-assignments` · `GET .../{id}` · `GET .../{id}/history` · `POST .../preview` · `POST .../{id}/revoke`
- supervision-assignments (5)：`GET,POST /api/admin/v1/supervision-assignments` · `GET .../page` · `GET,PATCH .../{id}` · `POST .../coverage-preview` · `POST .../{id}/revoke`
- role-bindings (5)：`GET,POST /api/admin/v1/role-bindings` · `GET .../page` · `GET .../preview` · `POST .../batch` · `DELETE,GET,PATCH .../{id}`
- authz (3)：`POST /api/admin/v1/authz/explain` · `POST .../explain-batch` · `POST .../action-state/batch`
- memberships (4)：`GET /api/admin/v1/memberships` · `GET .../conflicts` · `GET .../{id}` · `POST .../transfer`
- members 子资源 (6)：`GET,POST /api/admin/v1/members/{memberId}/memberships` · `DELETE,PATCH .../memberships/{id}` · `GET .../position-assignments` · `GET .../supervision-scope` · `GET .../certificates/qualification-flag` · `GET /api/admin/v1/members/options`
- organizations 增强 (8)：`GET /api/admin/v1/organizations/options` · `GET .../tree-options` · `GET .../tree-with-summary` · `GET .../{orgId}/members/options` · `GET .../{orgId}/memberships` · `GET .../{orgId}/supervisors` · `GET,POST .../{orgId}/position-assignments` · `POST .../{id}/move`

### 附件（通用 attachments，5）

- attachments (5)：`GET,POST /api/admin/v1/attachments` · `DELETE,GET,PATCH .../{id}` · `GET .../by-owner` · `POST .../upload-url` · `POST .../confirm-upload`

> 勘误（2026-07-06 Phase 0 审计）：v1.0 曾把 `contents/{id}/attachments/*` 3 条误列为未消费——实际前端已接（`srvf-content.ts` + `content-media.vue`），已移除；组织人事类合计相应由 38 更正为 41，总数 67 不变。

### 招新与公告（6）

- recruitment (4)：`GET /api/admin/v1/recruitment/cycles/{id}/stats` · `GET .../{id}/promote-precheck` · `POST /api/admin/v1/recruitment/applications/batch-mark-threshold` · `POST .../export`
- announcement-import (2)：`POST /api/admin/v1/announcement-import/preview` · `POST .../execute`

### RBAC 管理面与用户（9）

- roles (4)：`DELETE,GET,PATCH /api/system/v1/roles/{id}` · `GET .../options` · `POST .../{id}/permissions` · `DELETE .../{id}/permissions/{permissionId}`
- permissions (2)：`GET,POST /api/system/v1/permissions` · `DELETE,PATCH .../{id}`
- users (3)：`GET,POST /api/system/v1/users/{userId}/roles` · `DELETE .../roles/{roleId}` · `GET /api/admin/v1/users/options`

### 零星（6）

- activities (1)：`GET /api/admin/v1/activities/options`
- audit-logs (1)：`GET /api/system/v1/audit-logs/{id}`
- dict-items (1)：`GET /api/system/v1/dict-items/tree`
- health (3，基础设施非业务)：`GET /api/system/v1/health` · `.../live` · `.../ready`

> 归类合计：组织人事与授权 41 + 附件 5 + 招新公告 6 + RBAC/用户 9 + 零星 6 = 67。
