---
name: srvf-goal-author
description: 当用户要把 srvf-admin-web(前端)的一项工作交给 runner 会话无人值守自驱、说"出 goal / 给我 goal+loop 提示词 / 写个提示词我去跑 / 让它自己跑 PR-5/7/8"时使用。结合会话上下文与仓库实况,起草一段**自包含的 goal+loop 文本**(背景 / DoD / 探针队列 / 授权 / 禁止域 + 内嵌 loop 协议)交用户复制下发。只起草不执行;拍板未齐先穷尽访谈补齐再写;runner 在本仓 .claude/ harness 护栏内自驱。
---

# srvf-goal-author — 把前端工作固化为可自驱的 goal+loop 文本

[定位]
本仓现处 **PR-4 暂停 / 纯静态阶段**,能做的只有 PR-5 菜单骨架 / PR-7 组织占位 / PR-8 日历占位 / 占位页 / 文档(CLAUDE.md §5、srvf-api-contract-readiness §5)。协作模式:**goal+loop 文本 = 维护者立项 + 拍板 + 授权记录**;runner 会话在 `.claude/` harness 护栏内无人值守自驱,终版报告回传主会话核验。本 skill 只管起草侧:**只准备文本、不替用户下发、不替 runner 动代码**。用户是非职业开发者:决策用人话问、每题给推荐;工程细节自行代决并写进 goal。
本仓没有后端那种 `process §7.1 循环` 可引用,所以 loop 纪律必须**内嵌进 goal 文本**——这正是"goal+**loop**"的由来。

[第一性原则]

1. **拍板先行**:goal 不留未决问题(runner 中途只能人话简报停)。"挑哪个先例 / 菜单层级与 rank / 占位字段口径 / 目录与路由命名"等未拍 → **逐题穷尽访谈,一次问一个,每题给推荐,能查代码或文档自答的先查再问**;纯占位无可拍之事则直接写。**严禁反推后端**:后端字段 / 枚举 / 状态 / 接口 / 角色一律标 `placeholder` 或"待后端确认",绝不替后端定义(红线 1~4)。
2. **侦察先行**:写前核实况——`git` HEAD 与工作树、`gh pr list`、`docs/pure-admin/09-pr-roadmap.md`、`docs/srvf-static-menu-skeleton-plan.md`、`src/router/modules/`、`src/views/`;复用先例给精确 `file:line`;先去 `vue-pure-admin/src/views/` 找 UI 范式(只借布局 / 组合,不抄 API / RBAC / mock)。
3. **目标导向,不教过程**:goal 写"什么必须为真"(DoD)与"什么不许碰"(禁止域),执行打法交给内嵌 loop。规则不复述——点名引用 CLAUDE.md §4/§5/§6、02-ai-rules §13.1 矩阵 / §13.3 / §13.4、13-ai-harness;怪癖在仓库文档与项目 memory 里,runner 自取。
4. **DoD 可自证**:每条终态用命令 / 产出物自证——`pnpm lint && pnpm typecheck`(零错零警)、`pnpm build`,必要时 `pnpm dev` 自查路由 / 菜单;外加"路由 name===组件 defineOptions.name""菜单出现在侧栏""页面纯布局、零 API 调用"等可核验判据。
5. **探针驱动 + 幂等**:任务队列每项带"探针"(已完成判据,如"路由 srvf-xxx 已注册且 lint/typecheck 绿");探针已满足则跳过 → 同一 goal 文本中断后重跑即续命,不重复造。
6. **边界要硬 + 借力 harness**:禁止域只写真实约束——§13.1 的 ❌ 文件、禁加依赖(pnpm add/remove/update)、禁开 asyncRoutes / 补 getMenuList、禁碰登录 / token(PR-4)、禁恢复 tenant 菜单、禁把 mock 当契约。这些 harness 已机械拦截:**撞到拦截 = 该停下发人话简报的信号,不是绕路的理由**(同理禁 --no-verify、禁 ts/eslint 抑制注释、禁给 VITE\_\* 在源码里写兜底)。

[goal+loop 文本骨架](必填仅 ★;其余按信息量取舍,迷你 goal 三段即可)
★ **背景**:已拍板事实 + 日期 + 当前阶段(PR-4 暂停)+ 本 goal 属 PR-几。
★ **DoD + 探针队列**:逐条终态各附自证命令 / 判据(原则 4);任务 T1…Tn,每项 = 做什么 + 触及的 ✅ 文件 + 探针(未满足才做)。
★ **授权域**:runner 可自由新建 / 改的 ✅ 文件——`src/router/modules/srvf-*.ts`、`src/views/srvf/**`(嵌套于单一 srvf/ 目录,与子目录 CLAUDE.md 一致)、`src/api/srvf-*.ts`(占位)、`src/store/modules/srvf*.ts`。
★ **禁止域**:§13.1 ❌ + 禁依赖 / asyncRoutes / 反推后端 / mock 当契约 / PR-4(原则 6)。
**LOOP 协议**:整段抄进 goal(见下)。

[LOOP 协议范式](内嵌进 goal,让 runner 自驱)
每轮:① 先按 `/srvf-preflight` 走 §13.4 八步 → ② 选队列里探针未满足的**最小**一项 → ③ 仅在授权域内实施,复用 `vue-pure-admin` 范式 + `Re*` 组件,不发明新范式 → ④ 验证 `pnpm lint && pnpm typecheck`(零错零警),必要时 `pnpm build` / `pnpm dev`(harness Stop 钩子也会自动 typecheck)→ ⑤ 输出轮末报告(改了哪些文件 + 做了什么 + **本次未做** + 验证结果)→ ⑥ 回到 ①。
熔断:同一失败修复 ≤2 轮;需碰 ⚠️/❌ 文件、需加依赖、或需替后端做决策 → 按人话简报停,转下一项或停机;连续 2 轮零推进 → 停机报告。
幂等:全程不下发、不合并、不删分支;同一 goal 文本重跑按探针续命;终态达成 → 输出终版报告。

人话简报(runner 撞边界 / 需拍板时用):

## 需要拍板:<一句话标题>

- 做什么 / 不做会怎样 / 最坏与回退:各一句
- 推荐:<A / B>,回"按推荐"即生效
- 背景 + 证据(file:line)+ 触发规则(§13.1 哪行 / 哪条红线)
- 拍板前只读、不动代码

[交付]
goal+loop 整段放代码块,附"复制给 runner 会话运行";给主会话留 2-4 条"跑完回传核验点"(终版报告贴回后据此元核验);含 ⚠️ 文件或不可逆动作的,提醒用户发送前扫一眼授权 / 禁止段。**只起草,是否下发由用户定**。

[工作流程]
理解目标 → 侦察(实况 + 先例)→ 访谈拍板(穷尽,人话 + 推荐,见原则 1)→ 起草 goal+loop(骨架 + 内嵌 LOOP)→ 交付 + 核验点。
