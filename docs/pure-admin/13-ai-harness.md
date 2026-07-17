# 13 · AI Harness · 让规则从「纸面」变「机械」

> 本文件记录 srvf-admin-web 的 **AI harness**（`.claude/` 配置 + hooks + 子目录 CLAUDE.md + slash 命令）。
> harness 属于**工程级改动**，按 §13.2.2 应单独 PR；本文件是其「为什么这样设计」的权威说明。
> 维护人：human DRI（见 §13A.5）。AI 不得自行扩张本 harness 的拦截范围而不经人类批准。

## 13A.1 为什么需要 harness

CLAUDE.md / AGENTS.md / `02-ai-rules.md` 已经把红线写得很全，但这些规则此前**只靠模型每次会话通读约 18KB 文本并记住**来执行。随着上下文增长 / 压缩，早期指令会被摘要掉（参见 Agent SDK《How the agent loop works》：持久规则应放 CLAUDE.md，而非一次性 prompt）。

行业结论（《How Claude Code works in large codebases》）：**「harness 与模型同样重要」**，且 **hooks 让规则确定性执行，比依赖模型记忆更可靠**。本 harness 的目标，是把 §13.1 矩阵与命令禁令**从纸面规则变成机械护栏**——让「错误路径」直接不可达，而不只是「不被鼓励」（呼应《I'm going back to writing code by hand》：把护栏写进模型每次都读的地方）。

设计原则（《Harness design for long-running apps》）：**用最简方案，仅在必要时增加复杂度**。本仓当前处于 PR-4 暂停 / 纯静态阶段，因此**刻意不引入** planner / generator / evaluator 等长任务编排，只做「护栏 + 校验 + 就近上下文」三件事。

## 13A.2 组成清单

| 文件                                                 | 类型                            | 机械化了哪条规则                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/settings.json` → `permissions.deny`         | 静态护栏                        | **Harness 2.0-FE(2026-07-17,§13A.8)起 = 框架内核清单**:既有 store 五件（permission/multiTags/app/settings/epTheme）、`router/index.ts` + `asyncRoutes.ts`、`Re*` 底座组件、`plugins/**`、`main.ts`/`App.vue`/`config/index.ts`、构建与工程配置（`vite.config.ts`/`tsconfig.json`/`build/**`/eslint/stylelint/prettier/postcss/commitlint/`.lintstagedrc`）、`.env*` 的 Edit/Write 一律拒绝；`pnpm-lock.yaml`（Edit/Write + Read）与 `dist`（Read）拒绝（降噪）；Bash 面新增 force-push 全变体。`package.json` 与 `.husky/**` 降为 ask；layout / style / mock / 演示 views / 三个基础路由 module / `api/user.ts` / `store/modules/user.ts` 移出静态闸（仍受 guard 内容规则 + `AGENTS.md` 纪律约束）。 |
| `.claude/settings.json` → `permissions.ask`          | 交互护栏                        | **Harness 2.0-FE 起 = 真敏感清单(2026-07-17 P1 后 16 条)**:auth 主线 4 项（`src/utils/http/**`、`src/utils/auth.ts`、`src/views/login/**`、`src/router/utils.ts`）、`.husky/**`、`.claude/**`（harness 自保护，§13A.6）、本文件，以及 Bash 面 `git branch -D` 两条。改动前先询问人类，无人值守等同拒绝。（`platform-config.json` 与 `package.json` 由 `guard.mjs` 动态守，见 §13A.7 / §13A.10。）                                                                                                                                                                                                                                                                                                    |
| `.claude/hooks/guard.mjs`                            | PreToolUse                      | deny 无法表达的动态规则：`pnpm add/remove/update/clean:cache` 等依赖变更与他源 install（§13.2.1）、`--no-verify` / `HUSKY=0`（§13.3.12）、新增 `@ts-ignore` / `@ts-nocheck` / `@ts-expect-error` / `eslint-disable`（§13.3.5 & §13.3.8 · R1-e；token 在源码里拆串构造，故 guard.mjs 不会自我拦截）、源码中硬编码 `VITE_*` fallback（§13.3.13）、`public/platform-config.json` 改值放行 / 增删顶层字段拒绝 / 存疑询问（§13A.7，取代其静态 ask）、`package.json` 仅 scripts 区变更放行 / 依赖区变更拒绝 / 其余询问（§13A.10，取代其静态 ask）。每次决定都附带**指向具体文档章节的原因**，便于模型纠偏。                                                                                                |
| `.claude/hooks/verify.mjs`                           | Stop                            | §13.3.8「每次改动后跑 typecheck」。会话内 `src/**` 代码（含 `.cts`/`.mts`/`.cjs`/`.mjs`，R2-b）有改动时，结束前自动跑 `pnpm typecheck`，失败则要求修复。（eslint 已由 husky + lint-staged 在提交时保证；typecheck/`vue-tsc` 是会话内缺口。已重构为可单测：导出纯函数 + 仅在直接运行时才触发 Stop 副作用，便于 `harness.test.mjs` 注入驱动。）                                                                                                                                                                                                                                                                                                                                                        |
| `.claude/hooks/harness-doctor.mjs`                   | 漂移巡检（B）                   | 解析 §13.1 ❌/⚠️ 行，逐条核对 `settings.json` deny/ask 是否仍覆盖（缺失=结构漂移→非零退出；多余=附加保护，仅 INFO）；并比对 readiness §6「冻结基线」与 `../srvf-nest-api` 当前版本（落后仅 WARN，不翻退出码）；**[3]** 扫 `src/views/srvf/**/index.vue` 的「`el-select` + 请先选择」拍平反模式（嵌套子资源被拍平成菜单+手选父级；WARN，不翻退出码，详后端 `docs/handoff/admin-web.md` §1 轴模型）。复审/手动跑：`node .claude/hooks/harness-doctor.mjs`。                                                                                                                                                                                                                                            |
| `.claude/hooks/harness.test.mjs`                     | 回归自测（C）                   | 锁定 guard / verify 行为，防止日后改动悄悄削弱护栏。覆盖 guard（依赖 install·`--no-verify`/`-n`·抑制四种含 `@ts-expect-error`·`VITE_*` fallback·放行 install/dlx/ci）与 verify（分类正则·fail-open 判定·端到端 Stop 退出 0/2）。跑：`node .claude/hooks/harness.test.mjs`（退出 0=全绿）。                                                                                                                                                                                                                                                                                                                                                                                                           |
| `.claude/settings.json` → `permissions.allow`        | 白名单（2.0-FE 新增）           | 日常开发面零弹窗（30 条）：git 常规读写（push 非 force、pull 仅 `--ff-only`）、`gh pr` 链（merge 仅 `--squash`）、`pnpm dev/build/preview/typecheck/lint*/install --frozen-lockfile`、三个 harness 自检脚本。头注 `_comment_never_allow` 列明永不入 allow 的模式（force-push / reset --hard / branch -D / rm -rf / gh repo·release delete / 依赖变更）。                                                                                                                                                                                                                                                                                                                                             |
| `.claude/hooks/readtax.mjs`                          | husky pre-commit（2.0-FE 新增） | 恒读层字符预算：`AGENTS.md` ≤12,000 / `CLAUDE.md` ≤2,000（String.length）；超限 exit 1 拦提交，防唯一恒读源再发胖。预算调整 = 改脚本常量 = 有 diff 可审。手动跑：`node .claude/hooks/readtax.mjs`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `.github/workflows/ci.yml`                           | CI 独立把关（P1 · 2026-07-17）  | §13.3.8「PR 合并前三绿」的独立机械把关：每个 PR 云端自动跑 `install --frozen-lockfile` + `lint`（autofix 模式，跑完 `git diff --exit-code` 拦格式漂移）+ `typecheck` + `build`，与本地 AI 自证解耦；合并前 `gh pr checks` 须全绿。取代「提交前手动 build」仪式（§13A.10）。                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `src/router/modules/CLAUDE.md`                       | 子目录上下文                    | 就近重申路由模块本地规则（`srvf-*.ts`、真实角色名、`name` 一致、`asyncRoutes` 禁用），随导航按需加载、不被压缩丢弃。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `src/views/srvf/CLAUDE.md`                           | 子目录上下文                    | 就近重申业务页规则（占位 / 仅布局 / 不发 API / 不发明后端字段）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `docs/pure-admin/14-full-version-reference-index.md` | 参考索引（渐进式披露）          | §13.3.1「新页面前必先扫完整版」+ §12.4 完整版参考策略：把本地完整版 **208 演示页 / 26 个 `Re*` 组件 / 「能力→路径」速查 / 重依赖清单**做成**全量可检索索引**（07 是 curated shortlist，14 是 complete enumeration），让「先查范式、再动手」可机械检索而非靠记忆。`AGENTS.md` §6（14-index 行）、`02-ai-rules.md` §13.3.1 与 §16「新增业务页」行、`07` §12 均指向它。属只读参考、非拦截护栏（改它仍走本文件 §13A.6 ask 网关 + §13.2.2 单独 PR）。                                                                                                                                                                                                                                                     |
| `.claude/commands/srvf-preflight.md`                 | Slash 命令                      | 一键产出 §13.4 分级 preflight（全量八步 / 轻量 / 零码；渐进式披露，不占满每次会话）。用法：`/srvf-preflight <任务一句话>`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

## 13A.3 失效模式（重要）

- **guard.mjs 出错 → fail-open（放行）**：动态护栏遇任何内部异常都放行，避免卡死会话；`permissions.deny` 静态规则始终是被保护文件的硬底线。
- **verify.mjs 出错 → fail-open（放行 Stop）**：git / typecheck 工具异常不阻塞结束；输入 `stop_hook_active` 为真时不二次拦截，避免死循环。
- 四个 hook 脚本（guard / verify / harness-doctor / harness.test）只用 Node 内置模块（`.mjs`），**不引入任何依赖**，不改 `package.json`。
- **harness-doctor 退出码**：仅当「§13.1 ↔ settings 结构漂移」（某 ❌/⚠️ 行无 deny/ask 覆盖）时置非零；版本落后只 WARN，不翻退出码（冻结基线本就该滞后实时后端，见 §13A.5 + readiness §6）。

## 13A.4 人类如何临时放行（授权例外）

deny / ask / allow 写在**版本化**的 `settings.json` 里，所有 agent 共享。**注意 Claude Code 的权限优先级是 `deny` > `ask` > `allow`——`deny` 永远压过 `allow`**：在 `.claude/settings.local.json` 里加 `allow` **并不能**重新打开一个被 `deny` 的文件。同理，hooks 跨配置文件**累加合并**，本地设置也**无法**注销项目级 `Stop` 钩子。

因此当人类确有授权需要改某个 ❌ 文件时（例如 PR-4 恢复、或 §13.1 允许的「接 NestJS 时一次性 http 适配」），唯一可靠的做法是**直接编辑版本化的 `settings.json`**——把对应的 `deny` 行删除或改窄。建议放在一个单独的、人类审过的 PR 里改（§13.2.2），用完即恢复，不要长期留在主干。

临时关闭 Stop 校验：从 `settings.json` 删除 `Stop` 钩子（同样要改版本化文件，本地覆盖无效）。

## 13A.5 维护节奏

按 large-codebases 与 harness-design 两篇的建议：**每 3~6 个月、或每次重大模型升级后复审一次 harness**，剥离不再「吃重」的脚手架（例如模型已能稳定自查类型时，verify 钩子的价值会下降）。复审要点：

1. deny / ask 清单是否仍与 §13.1 矩阵逐行一致（矩阵变了就同步）；
2. guard.mjs 的命令 / 内容规则是否有误杀或漏网；
3. PR-4 恢复后，哪些 deny 需要下放到 ask 或移除；
4. 是否有新红线还停留在「纸面」，应补成机械护栏。

> 上述第 1 点与「后端冻结版本是否过时」已机械化为 `harness-doctor.mjs`：复审时先跑 `node .claude/hooks/harness-doctor.mjs`，无结构漂移即第 1 点通过、版本 WARN 则按 readiness §6 用**当前后端版本**复核清单。**改动 `guard.mjs` / `verify.mjs` 后必须跑** `node .claude/hooks/harness.test.mjs`（C 回归自测，退出 0 = 未削弱护栏）。

## 13A.6 自我保护（A · ask 机制）+ 有意加宽（R3-b）

harness 自身（2.0-FE 起整并为 `.claude/**` 一条——覆盖 settings.json / hooks / skills / commands / launch.json / worktrees——以及本文件 `docs/pure-admin/13-ai-harness.md`）被纳入 `permissions.ask`——**任何对护栏自身的改动都会先弹出询问**，无人值守（unattended）等同拒绝。这样，一个上下文被压缩丢失、或被诱导的 agent 无法「悄悄」削弱护栏；真正的 harness 维护必须在**有人值守**下逐条批准。

- **为何用 ask 而非 deny**：deny 会把人类也一起锁死（§13A.4：`deny` > `ask` > `allow`，且本地 `allow` 无法翻案），连授权维护都得先改版本化文件才动得了手；ask 让**当场的人类**逐条放行，兼顾「默认不可达」与「授权可改」。
- **如何 attended 批量改 harness**：有人值守的会话里，对 `.claude/**` 的每次 Edit/Write 都会触发一次 ask，人类确认即可；改完后跑 `node .claude/hooks/harness.test.mjs` + `node .claude/hooks/harness-doctor.mjs` 自证「未削弱、无漂移」，再按 §13.2.2 走单独 PR。若改的是 `guard.mjs` 的「抑制注释正则」，注意它会扫自己：抑制 token 必须**拆串构造**（如 `"@ts-" + "ignore"`），否则会拦下你对它自身的编辑（本仓已据此根治，见 `guard.mjs` 的 `SUPPRESS_TOKENS`）。
- **R3-b 有意加宽**：`settings.json` 的 `src/components/Re*/**` 与 `src/plugins/**` 比 §13.1 字面（`Re*/`、`elementPlus.ts / echarts.ts`）更宽，是**有意为之**——整个 `Re*` 底座组件目录、整个 plugins 目录都不可改。`harness-doctor.mjs` 据此仍判为「已覆盖」，不报缺失。

## 13A.7 platform-config.json：可改值 · 禁增删字段（guard 动态守）

`public/platform-config.json` 原为静态 ⚠️ ask（任何改动都问人类）。复审（§13A.5）后判定：它是**设计来被配置的运行时旋钮**（`EpThemeColor`、`Layout`、`DarkMode` 等），改「值」低风险且可逆、版本化可回滚，真正要守的是**别动配置结构**。于是把它从静态 ask 下放给 `guard.mjs` 动态判定：

- 读盘上**旧文件** → 用 `Write` 的 `content` 或 `Edit` 的 `old→new` 重建改后 JSON → 比**顶层字段集合**。
- 字段集不变（只改值）→ **allow**（无人值守也放行，例如把 `EpThemeColor` 设成品牌红）。
- 增 / 删顶层字段 → **deny**（结构是人类的事）。
- 读不到 / 解析不出 → **ask**（退回旧行为，安全地板不降）。

因为它不再在 `settings.json` 里，`harness-doctor.mjs` 用一张 `GUARD_ENFORCED` 名单认领它，报告为 `← guard.mjs（改值 allow / 增删字段 deny）`，不当漂移；`harness.test.mjs` 锁定四种判定（改值 / 增字段 / 删字段 / 坏 JSON）。§13.1 矩阵该行措辞已同步。

> 边界提醒：这是**放宽**（value 改动从 ask → allow），按 §13.2.2 单独 PR、有人值守逐条批准落地——正是 §13A.6 的自我保护机制在起作用。

> 本 harness **不修改任何既有源码 / 工程配置文件**，全部为新增文件；回滚 = 删除上述新增文件。（例外记录：2.0-FE 在 `.husky/pre-commit` 追加了一行 readtax 调用，经维护者 goal 拍板，见 §13A.8。）

## 13A.8 Harness 2.0-FE 权限反转记录（2026-07-17 拍板）

六月设防期的「零 allow + 42 条 ask 覆盖日常开发面」在七组 IA 上线后成为纯摩擦（每条 Bash 都弹窗、views/layout/style 等主战场逐次询问）。维护者四拍板后反转为三档：**deny 53**（框架内核逐字保留 + force-push 全变体；`package.json` / `.husky/**` 两项降 ask）· **ask 18**（真敏感清单，见 §13A.2）· **allow 30**（日常 git / gh / pnpm / harness 自检）。**决策语义零放宽，只改投递方式**（方法论承接姊妹仓 `docs/archive/reviews/harness-2.0-t0-review.md`）：原 deny 行的人工授权语义改由 ask 当场逐条批；`guard.mjs` / `verify.mjs` 逐字未动（`harness.test.mjs` 55 用例全绿自证）。

- 恒读文档同步收口：根 `AGENTS.md` 成为唯一恒读源（六节，含铁律速查 + 决策锁 + 本清单文档版），`CLAUDE.md` 瘦为 Claude 专属薄入口；v1 双文档冻结于 `docs/archive/harness-v1/`。guard 报错信息自 2026-07-17 复审起直指 `AGENTS.md` §1（v1 编号指针退役，重定向表迁至 `docs/archive/harness-v1/README.md`）。
- **true-up 已完成（2026-07-17 Fable 5 复审，见 §13A.9）**：`02-ai-rules.md` §13.1 矩阵已对齐 2.0-FE 三档实况并新增 🟡 纪律区标记（layout / style / mock / 基础路由 module / `user.ts` 两件等无静态闸行），`harness-doctor.mjs` 11 处过渡期 MISS 全部转真绿（exit 0）。

## 13A.9 Fable 5 复审记录（2026-07-17 · §13A.5「重大模型升级后复审」首次触发）

复审结论：harness 机制按「防什么」分三类——**授权闸门**（deny/ask/guard/verify/决策锁/红线 1~4，与模型能力无关）原样保留；**事实供给**（契约真相、端口、上限等模型不可先验的知识）更值钱，持续策展；**弱模型流程规训**（每任务全量仪式、重复禁令、v1 指针）退役或分级。本轮落地（单独 PR，决策语义仅动流程档位）：

1. §13.1 矩阵 true-up 到 2.0-FE 实况（四档标记 ✅/🟡/⚠️/❌），doctor 转真绿；
2. §13.4 preflight 分级（全量 / 轻量 / 零码；「PR 合并前 lint+typecheck+build 三绿」不变量与全部机械闸不动；无人值守一律全量档）；
3. 禁令去重：重复声明收敛为「AGENTS §1 单点 + 机械闸 + 02 细则层」，baseline / 12-index 同步改指；
4. v1 指针退役：guard / doctor / preflight 命令 / goal-author / 蓝图 / 子目录 CLAUDE.md / `srvf-account.ts` 七处「CLAUDE.md §N」改指现行节号，AGENTS §6 重定向表迁入 `docs/archive/harness-v1/README.md`。

P1 处置（同日维护者拍板，落地记录见 §13A.10）：② `package.json` scripts 区 guard 动态判与 ③ CI **已落地**；① 输出仪式收窄**撤销**——维护者为「下指令即离场」型用法，书面人话报告即其唯一审计界面，收窄属倒退；④ `CLAUDE.md` 分层放宽**暂缓**——收益集中于有人值守场景，当前用法收益小。

## 13A.10 P1 落地记录（2026-07-17 · ② package.json 动态守 + ③ CI）

裁定依据（维护者自述）：「下指令即离场、不盯过程、不读代码」——安全感来源应为**独立机械验证 + 事后人话报告**，而非过程中弹窗（人不在场时 ask = 任务趴窝）。

- **② `package.json`**：静态 ask 下放 `guard.mjs` 三态判（复制 §13A.7 范式）——读盘上旧文件 → 重建改后 JSON → 比顶层字段变化：仅 `scripts` 变 → **allow**；`dependencies` / `devDependencies` / `peerDependencies` / `optionalDependencies` / `bundledDependencies` / `engines` / `pnpm` / `overrides` / `resolutions` / `packageManager` 任一变 → **deny**；其余字段变或解析失败 → **ask**（安全地板）。决策语义两向变化：scripts 面 ask→allow（放宽），依赖面 ask→**deny**（收紧——此前理论上可被误批）。doctor `GUARD_ENFORCED` 认领；`harness.test.mjs` 新增 7 用例。
- **③ CI**：`.github/workflows/ci.yml`（新增文件，回滚=删除）于每个 PR 云端跑 `install --frozen-lockfile` + `lint` + `git diff --exit-code` + `typecheck` + `build`。「提交前手动 build」仪式退役，把关点移至合并前 `gh pr checks` 全绿；本地 build 仅用于自诊。
