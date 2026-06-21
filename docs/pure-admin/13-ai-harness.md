# 13 · AI Harness · 让规则从「纸面」变「机械」

> 本文件记录 srvf-admin-web 的 **AI harness**（`.claude/` 配置 + hooks + 子目录 CLAUDE.md + slash 命令）。
> harness 属于**工程级改动**，按 §13.2.2 应单独 PR；本文件是其「为什么这样设计」的权威说明。
> 维护人：human DRI（见 §13A.5）。AI 不得自行扩张本 harness 的拦截范围而不经人类批准。

## 13A.1 为什么需要 harness

CLAUDE.md / AGENTS.md / `02-ai-rules.md` 已经把红线写得很全，但这些规则此前**只靠模型每次会话通读约 18KB 文本并记住**来执行。随着上下文增长 / 压缩，早期指令会被摘要掉（参见 Agent SDK《How the agent loop works》：持久规则应放 CLAUDE.md，而非一次性 prompt）。

行业结论（《How Claude Code works in large codebases》）：**「harness 与模型同样重要」**，且 **hooks 让规则确定性执行，比依赖模型记忆更可靠**。本 harness 的目标，是把 §13.1 矩阵与命令禁令**从纸面规则变成机械护栏**——让「错误路径」直接不可达，而不只是「不被鼓励」（呼应《I'm going back to writing code by hand》：把护栏写进模型每次都读的地方）。

设计原则（《Harness design for long-running apps》）：**用最简方案，仅在必要时增加复杂度**。本仓当前处于 PR-4 暂停 / 纯静态阶段，因此**刻意不引入** planner / generator / evaluator 等长任务编排，只做「护栏 + 校验 + 就近上下文」三件事。

## 13A.2 组成清单

| 文件                                         | 类型          | 机械化了哪条规则                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/settings.json` → `permissions.deny` | 静态护栏      | §13.1 矩阵中除 `mock/**`（该 ❌ 行刻意放进 ask 以保留裁决-4 的 `*.demo.ts` 例外）外的所有 ❌ 文件（auth / token / login / http / user & permission store / 路由核心 / `asyncRoutes` / layout / style / plugins / `main` / `App` / config / `package.json` / lockfile / 工程配置 / `.env*`）的 Edit/Write 一律拒绝；`pnpm-lock.yaml` + `dist` 的 Read 拒绝（降噪，呼应 large-codebases「用 ignore/deny 排除生成物」）。 |
| `.claude/settings.json` → `permissions.ask`  | 交互护栏      | §13.1 矩阵 ⚠️「改前评估」文件（`dict` / `tenant` / `schedule` / `permission` 演示模块、`home`/`error`/`remaining` 路由、`platform-config.json`、`mock/**`）改动前先询问人类。                                                                                                                                                                                                                                          |
| `.claude/hooks/guard.mjs`                    | PreToolUse    | deny 无法表达的动态规则：`pnpm add/remove/update/clean:cache` 等依赖变更与他源 install（§13.2.1）、`--no-verify` / `HUSKY=0`（§13.3.12）、新增 `@ts-ignore` / `@ts-nocheck` / `@ts-expect-error` / `eslint-disable`（§13.3.5 & §13.3.8 · R1-e；token 在源码里拆串构造，故 guard.mjs 不会自我拦截）、源码中硬编码 `VITE_*` fallback（§13.3.13）。每次拒绝都附带**指向具体文档章节的原因**，便于模型纠偏。               |
| `.claude/hooks/verify.mjs`                   | Stop          | §13.3.8「每次改动后跑 typecheck」。会话内 `src/**` 代码（含 `.cts`/`.mts`/`.cjs`/`.mjs`，R2-b）有改动时，结束前自动跑 `pnpm typecheck`，失败则要求修复。（eslint 已由 husky + lint-staged 在提交时保证；typecheck/`vue-tsc` 是会话内缺口。已重构为可单测：导出纯函数 + 仅在直接运行时才触发 Stop 副作用，便于 `harness.test.mjs` 注入驱动。）                                                                          |
| `.claude/hooks/harness-doctor.mjs`           | 漂移巡检（B） | 解析 §13.1 ❌/⚠️ 行，逐条核对 `settings.json` deny/ask 是否仍覆盖（缺失=结构漂移→非零退出；多余=附加保护，仅 INFO）；并比对 readiness §6「冻结基线」与 `../srvf-nest-api` 当前版本（落后仅 WARN，不翻退出码）。复审/手动跑：`node .claude/hooks/harness-doctor.mjs`。                                                                                                                                                  |
| `.claude/hooks/harness.test.mjs`             | 回归自测（C） | 锁定 guard / verify 行为，防止日后改动悄悄削弱护栏。覆盖 guard（依赖 install·`--no-verify`/`-n`·抑制四种含 `@ts-expect-error`·`VITE_*` fallback·放行 install/dlx/ci）与 verify（分类正则·fail-open 判定·端到端 Stop 退出 0/2）。跑：`node .claude/hooks/harness.test.mjs`（退出 0=全绿）。                                                                                                                             |
| `src/router/modules/CLAUDE.md`               | 子目录上下文  | 就近重申路由模块本地规则（`srvf-*.ts`、真实角色名、`name` 一致、`asyncRoutes` 禁用），随导航按需加载、不被压缩丢弃。                                                                                                                                                                                                                                                                                                   |
| `src/views/srvf/CLAUDE.md`                   | 子目录上下文  | 就近重申业务页规则（占位 / 仅布局 / 不发 API / 不发明后端字段）。                                                                                                                                                                                                                                                                                                                                                      |
| `.claude/commands/srvf-preflight.md`         | Slash 命令    | 一键产出 §13.4 8 步 Checklist（渐进式披露，不占满每次会话）。用法：`/srvf-preflight <任务一句话>`。                                                                                                                                                                                                                                                                                                                    |

## 13A.3 失效模式（重要）

- **guard.mjs 出错 → fail-open（放行）**：动态护栏遇任何内部异常都放行，避免卡死会话；`permissions.deny` 静态规则始终是被保护文件的硬底线。
- **verify.mjs 出错 → fail-open（放行 Stop）**：git / typecheck 工具异常不阻塞结束；输入 `stop_hook_active` 为真时不二次拦截，避免死循环。
- 四个 hook 脚本（guard / verify / harness-doctor / harness.test）只用 Node 内置模块（`.mjs`），**不引入任何依赖**，不改 `package.json`。
- **harness-doctor 退出码**：仅当「§13.1 ↔ settings 结构漂移」（某 ❌/⚠️ 行无 deny/ask 覆盖）时置非零；版本落后只 WARN，不翻退出码（冻结基线本就该滞后实时后端，见 §13A.5 + readiness §6）。

## 13A.4 人类如何临时放行（授权例外）

deny / ask 写在**版本化**的 `settings.json` 里，所有 agent 共享。**注意 Claude Code 的权限优先级是 `deny` > `ask` > `allow`——`deny` 永远压过 `allow`**：在 `.claude/settings.local.json` 里加 `allow` **并不能**重新打开一个被 `deny` 的文件。同理，hooks 跨配置文件**累加合并**，本地设置也**无法**注销项目级 `Stop` 钩子。

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

harness 自身（`.claude/settings.json` / `.claude/hooks/**` / `.claude/skills/**` / `.claude/commands/**`，以及本文件 `docs/pure-admin/13-ai-harness.md`）被纳入 `permissions.ask`——**任何对护栏自身的改动都会先弹出询问**，无人值守（unattended）等同拒绝。这样，一个上下文被压缩丢失、或被诱导的 agent 无法「悄悄」削弱护栏；真正的 harness 维护必须在**有人值守**下逐条批准。

- **为何用 ask 而非 deny**：deny 会把人类也一起锁死（§13A.4：`deny` > `ask` > `allow`，且本地 `allow` 无法翻案），连授权维护都得先改版本化文件才动得了手；ask 让**当场的人类**逐条放行，兼顾「默认不可达」与「授权可改」。
- **如何 attended 批量改 harness**：有人值守的会话里，对 `.claude/**` 的每次 Edit/Write 都会触发一次 ask，人类确认即可；改完后跑 `node .claude/hooks/harness.test.mjs` + `node .claude/hooks/harness-doctor.mjs` 自证「未削弱、无漂移」，再按 §13.2.2 走单独 PR。若改的是 `guard.mjs` 的「抑制注释正则」，注意它会扫自己：抑制 token 必须**拆串构造**（如 `"@ts-" + "ignore"`），否则会拦下你对它自身的编辑（本仓已据此根治，见 `guard.mjs` 的 `SUPPRESS_TOKENS`）。
- **R3-b 有意加宽**：`settings.json` 的 `src/components/Re*/**` 与 `src/plugins/**` 比 §13.1 字面（`Re*/`、`elementPlus.ts / echarts.ts`）更宽，是**有意为之**——整个 `Re*` 底座组件目录、整个 plugins 目录都不可改。`harness-doctor.mjs` 据此仍判为「已覆盖」，不报缺失。

> 本 harness **不修改任何既有源码 / 工程配置文件**，全部为新增文件；回滚 = 删除上述新增文件。
