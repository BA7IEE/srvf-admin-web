# AGENTS.md — SRVF 前端 AI 协作铁律(Harness 2.0-FE)

> 所有 AI 编码助手(Claude Code / Codex / Cursor / 其他 Agent)在本仓的**唯一恒读规则入口**。
> Harness 2.0-FE 起(维护者 2026-07-17 拍板):细则留在 `docs/`(触碰才读,§6 索引);v1 双文档全文冻结于 [`docs/archive/harness-v1/`](docs/archive/harness-v1/)。
> 本文件与 `CLAUDE.md` 体积由 `node .claude/hooks/readtax.mjs` 守护(≤12,000 / ≤2,000 字符,husky pre-commit 拦超限);**决策语义零放宽,只改投递方式**。

## 0. 读取协议与权威源

**恒读层**(每会话开工必读):本文件;Claude Code 另读 `CLAUDE.md`(Claude 专属事项)。
**触碰才读**(改到哪个主题读哪篇;§6 全索引):

- 动手前流程:`docs/pure-admin/02-ai-rules.md`(§13.1 文件矩阵 · §13.4 分级 preflight)
- 新业务页:后端能力图 `../srvf-nest-api/docs/handoff/admin-web.md`(**必读**,见 §4)→ 仓内蓝图(§6)→ 完整版范式索引 `docs/pure-admin/14-full-version-reference-index.md`(先查范式再动手,只抄交互不抄契约)
- 路由/菜单:`docs/pure-admin/03-router-menu.md`(§5.2.1 asyncRoutes 禁令)
- harness 本体:`docs/pure-admin/13-ai-harness.md`

**背景层**(不主动读):`docs/archive/**`(历史证据与已完成规划,不当当前事实;PR-4 决策史、vnext 蓝图、ChatGPT 轨墓碑等均冻结于此,索引见其 README)。

**权威源冲突顺序**(高 → 低):

1. 后端 live `/api/docs-json` + 代码现状 + GitHub 现状(字段/枚举/RBAC 码唯一真相)
2. 后端 handoff `admin-web.md`(任务设计权威:任务→端点图 / 轴模型 / 踩坑 / gap-ledger)
3. 本文件(长期铁律)> `02-ai-rules.md` 等专题文档
4. 两份蓝图(路线图,非圣经)> `archive/**`(仅历史)

发现文档-代码冲突 / 蓝图-handoff 互冲 → **暂停上报,不擅自调和**(先例:公告导入页,蓝图要建常规页、handoff 判一次性工具,问过用户才动)。

## 1. 铁律速查(主题 → 一句话;多数已机械化,见 §3)

- **依赖**:human-only——禁 `pnpm add/remove/update/clean:cache`、禁改 `package.json` 依赖区(guard 拦;需求写进 PR 描述由人执行)。
- **绕闸**:禁 `--no-verify` / `HUSKY=0` / `git commit -n`(guard 拦);禁新增 `@ts-ignore` / `@ts-nocheck` / `@ts-expect-error` / `eslint-disable`(guard 拦,修真错;真误报输出评估交人裁)。
- **配置**:禁源码硬编码 `VITE_*` fallback(guard 拦);`public/platform-config.json` 只可改值,增删顶层字段 human-only(guard 动态判)。
- **框架**:禁启用 `asyncRoutes`、禁补 `getMenuList`、禁恢复租户菜单;mock 非契约(演示 URL/字段/角色名全不作数)。
- **红线 1~4**:禁前端反推/发明后端字段、schema、RBAC 码、状态机;缺接口 → 后端 gap-ledger 登记后 STOP。
- **私有**:本仓永不公开(上游 Max-Ts license);业务改动不回流 starter。
- **轴模型**:页面按**任务**设计不按资源——沿轴下钻(`activityId`/`memberId` 走路由进详情页)≠「选择父级下拉看子资源」拍平反模式(doctor [3] 会 WARN)。
- **掩码回写**:无 `*.read.sensitive` 码时敏感字段返**掩码串或 null**(档案证件号/手机、紧急联系人等);编辑表单提交前必须剔除无权字段(值含 `*` 或 null),靠后端「不发 = 保留」;原样回写 = 掩码覆盖真值。
- **options 上限**:`*/options` 类选择器端点 limit 后端硬上限 **100**(docs-json 未标注);`permissionCodes` 等批量入参同样 ≤100/次分片。
- **依赖恢复**:`pnpm install --frozen-lockfile` 必须**裸命令**(尾随管道/重定向会被 guard 当包名拦);fresh worktree 先跑它再 typecheck/commit。
- **端口**:`:8848` = 主 checkout 的 dev;worktree 自起 `pnpm dev` 自动落 `:8849`(`--port` 不透传,别硬指定);渲染验证用 `tests/render/` 的 uv+Playwright harness。
- **后端进程**:本地 `:3000` 是用户自己的进程,502/连接拒绝时**不自启**——收尾已完成代码 → commit+push+开 PR 不合并 → 报告等用户拉起,续跑从被阻步骤开始。
- **提交头**:commitlint 现拒绝提交头里任何拉丁 token——header 纯中文,标识符进 body;拿不准先 `pnpm exec commitlint --edit <tmp文件>` 验,别烧 lint-staged 轮次。
- **提交钩子路径**:worktree 里 `git commit` 执行的是**主 checkout** 的 `.husky/`(`core.hooksPath` 绝对路径)——改 hook 要合并进 main 才对全部 checkout 生效。
- **dev 验证**:日志是缓冲区,会回放已修复的旧错(先看时间戳);跑着 dev 切分支会毒化 vite 缓存(停服 → `rm -rf node_modules/.vite` → 重启);截图可能白幽灵、el-table 有 hidden-columns 幽灵按钮(行内探针限定 `tbody tr`)——判定以 typecheck/build + DOM 查询为准。
- **收尾**:判断给证据(路径:行号);goal 外发现记录上报不顺手修;必须输出「本次未做」;不确定不写成事实。

## 2. 决策锁(重开任一条前,必须先暂停声明本节存在)

- **3-call 登录**:真实登录 = `POST /api/auth/v1/login` → `GET /api/admin/v1/me` + `GET /api/system/v1/rbac/me/permissions`(PR #6 上线 2026-06-22);禁回 mock 登录流。
- **auth 申报制**:5 个 auth 文件(`src/api/user.ts` / `src/utils/auth.ts` / `src/utils/http/index.ts` / `src/store/modules/user.ts` / `src/views/login/index.vue`)可随业务 PR 改,但每次必须显式申报——改了哪个 / 改了什么 / 影响面(登录态 · token 生命周期 · 路由守卫);未申报的改动不允许。
- **platform-config**:只改值;增删顶层字段 human-only(guard 机械执行)。
- **依赖 human-only**:全部依赖变更(含核心库升级、UI 库/构建器替换)由人执行,AI 只能提案。
- **私有仓**:永不公开、永不反向流 starter(同步只 starter → 本仓 cherry-pick)。
- **演示角色名**:`admin` / `common` / `*:*:*` / `permission:btn:*` 类演示码永不作正式 RBAC 码;真码逐端点查 live 契约(有的端点仅登录态无码)。

## 3. 红区与机器闸(`.claude/settings.json` + hooks 的文档版)

**权限三档**(deny > ask > allow,先匹配先赢;头注列有 never-allow 清单):

- 🔴 **deny(框架内核;人改版本化 settings 才能动)**:既有 store 五件(permission/multiTags/app/settings/epTheme)、`router/index.ts` + `asyncRoutes.ts`、`components/Re*/**`、`plugins/**`、`main.ts` / `App.vue` / `config/index.ts`、`vite.config.ts` / `tsconfig.json` / `build/**`、eslint/stylelint/prettier/commitlint/postcss 配置、`.lintstagedrc`、`.env*`、`pnpm-lock.yaml`(含 Read)、`dist`(Read);Bash 面:force push 全变体。
- 🟡 **ask(真敏感;人在场逐次批,无人值守等同拒绝)**:`src/utils/http/**`、`src/utils/auth.ts`、`src/views/login/**`、`src/router/utils.ts`、`.husky/**`、`.claude/**`(harness 自保护)、`docs/pure-admin/13-ai-harness.md`;Bash 面:`git branch -D|--delete`。`package.json` 由 guard 动态守:仅 scripts 区变 allow / 依赖区变 deny / 其余 ask(13A.10)。
- 🟢 **allow(日常开发面,零弹窗)**:git 常规读写(push 非 force、`git branch` 仅只读形态)、`gh pr`(merge 仅 `--squash`)、`pnpm dev/build/preview/typecheck/lint*/install --frozen-lockfile`、harness 自检脚本。业务面(`views/srvf/**` / 业务路由 `modules/srvf-*.ts` / `api/srvf-*.ts` / `store` 业务件)为 ✅ 自由区,layout / style / mock / 基础路由 module 为 🟡 纪律区——均仍受 guard 内容规则与本文件纪律约束。

**hooks**(全部 fail-open,静态 deny 是硬底线):`guard.mjs`(PreToolUse:§1「依赖/绕闸/配置」行)· `verify.mjs`(Stop:会话改过 `src/**` 代码则 `pnpm typecheck` 不绿不让收工)· `readtax.mjs`(husky pre-commit:恒读双文档字符预算)。手动巡检:`node .claude/hooks/harness.test.mjs`(改 hooks 后必跑,全绿 = 未削弱)、`node .claude/hooks/harness-doctor.mjs`(§13.1↔settings 漂移巡检)。

## 4. 与后端协作

- **任务设计权威** = `../srvf-nest-api/docs/handoff/admin-web.md`:按任务→端点图设计页面,先判「任务页 vs 资源页」;轴模型、踩坑、gap-ledger 都在里面;改哪个域读哪节。
- **字段真相** = 后端 live `/api/docs-json`(dev 代理 `/api → :3000`)。禁凭记忆/蓝图写字段名,写 API 封装前先直连核对(先例:猜 `thresholdCode`,真名是 `code`)。
- **缺接口** → 在 handoff gap-ledger 登记后 STOP;不得前端代定任何后端概念(红线 1~4)。
- 后端版本号/权限码数量**不写进本文件**,以 handoff 与 live 契约为准。

## 5. 流程与验证

- **开工**:按 `02-ai-rules.md` §13.4 **分级 preflight**——新页/契约/敏感面走全量八步,常规小改红线自查+收尾验证,零码任务声明即可,无人值守一律全量(Claude 可用 `/srvf-preflight`);全量档声明允许/禁触文件清单;无人值守 goal 在授权域内自决连续推进,goal 外新发现记录上报不顺手修。
- **并行**:一任务 = 一 worktree 分支 = 一 PR,写集不相交;不动别人的 worktree。fresh worktree 先 `pnpm install --frozen-lockfile`(裸命令)。
- **验证**:`pnpm lint && pnpm typecheck` 零错零警;build 由 PR 的 CI 把关(`.github/workflows/ci.yml`),合并前 `gh pr checks` 全绿;UI 改动起本 worktree 的 dev(→:8849)真验,登录用后端 docs §8 dev 默认账号(不读姊妹仓 `.env`)。
- **提交/合并**:husky = lint-staged + commitlint(头纯中文)+ readtax;PR 走 squash;验证净的单 PR 可直接合,**多 PR brief 的显式 stop-gate 优先于「不问就合」**。
- **harness 改动**:动 `.claude/hooks/**` 后必跑 `node .claude/hooks/harness.test.mjs`;`guard.mjs` / `verify.mjs` 语义变更 = 维护者拍板级,不得顺手改。

## 6. 文档索引

- `docs/pure-admin/02-ai-rules.md` —— 每次动手前(§13.1 矩阵 / §13.4 分级 preflight / §16 任务→必读映射)。
- `docs/pure-admin/03-router-menu.md` —— 改路由/菜单。
- `docs/pure-admin/13-ai-harness.md` —— 改 harness / 权限 / hooks(「为什么这样设计」的权威说明;§13A.8 反转记录 · §13A.9 复审记录)。
- `docs/pure-admin/14-full-version-reference-index.md` —— 建新页前查范式(208 演示页 / 26 个 `Re*` 组件能力速查;完整版只读,只抄交互)。
- `docs/srvf-admin-ux-upgrade-blueprint.md` —— 新业务规划定位(IA v3 / 工作台 v2 / 七条军规;与 handoff 冲突按 §0 处理;前作 vnext 蓝图已入 archive)。
- `docs/pure-admin-max-ts-baseline.md` 与 `docs/pure-admin/` 其余各篇 —— starter 底座专题(项目图 / http / mock 风险 / 模块 / 上游同步 / 官方索引)。
