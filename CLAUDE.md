# CLAUDE.md — Claude Code 入口(Harness 2.0-FE)

> **恒读 = 根 [`AGENTS.md`](./AGENTS.md)**(唯一规则入口:读取协议 §0 / 铁律速查 §1 / 决策锁 §2 / 红区与机器闸 §3 / 后端协作 §4 / 流程验证 §5 / 文档索引 §6)。本文件只承载 Claude Code 专属事项,体积由 `node .claude/hooks/readtax.mjs` 守护(≤2,000 字符);v1 全文冻结于 [`docs/archive/harness-v1/`](./docs/archive/harness-v1/)。

## Claude Code 专属

- **skills**:开工先 `/srvf-preflight <任务一句话>`(按 02-ai-rules §13.4 分级产出 preflight);下发无人值守任务用 `srvf-goal-author` 起草 goal。
- **权限三档**:`.claude/settings.json`(deny > ask > allow;修改本文件时不得把头注 never-allow 清单中的模式移入 allow)。allow 已覆盖日常 git / gh / pnpm;弹窗多半说明正触碰真敏感面,先自查是否越界再请求放行。
- **hooks**:PreToolUse `guard.mjs`(依赖 human-only / 绕闸 / 抑制注释 / VITE\_\* fallback / platform-config 值域 / package.json scripts 区),Stop `verify.mjs`(改过 `src/**` 代码则 typecheck 不绿不收工),husky pre-commit `readtax.mjs`。动 `.claude/hooks/**` 后必跑 `node .claude/hooks/harness.test.mjs`。
- **memory**:Claude Code 自身 `memory/` 机制与仓库铁律无关;仓库级约束只写权威源文档,不依赖个人记忆。
- 本文件与 `AGENTS.md` 冲突时,以 `AGENTS.md` 为准。

## 项目性质(给每个新会话的一句话)

维护者是非职业程序员,靠 AI 长期维护;本仓是从私有 starter 派生的 SRVF(深圳公益救援队)业务后台,**永不公开**。优先级是稳定、清晰、可维护、AI 友好——按既有范式加页,业务实质优先于视觉打磨;后端字段/枚举/RBAC 码一律以 live 契约为准,不前端发明。
