# srvf-admin-web

> 深圳公益救援队(SRVF)业务后台前端——派生自私有 `u-admin-web-starter`(Pure Admin Max-Ts 底座),已全面接入真实 `srvf-nest-api` 后端(3-call 登录 · 30+ 业务页真接 · srvf-kit 原语层)。**本仓永不公开**:上游 Max-Ts 为付费授权件,不可售卖或公开源代码。

## 接手入口(人与 AI 同源)

1. **唯一恒读规则入口 = [`AGENTS.md`](./AGENTS.md)**(Harness 2.0-FE:读取协议 / 铁律速查 / 决策锁 / 红区机器闸 / 后端协作 / 文档索引)。Claude Code 另读 [`CLAUDE.md`](./CLAUDE.md)。
2. 动手前跑 `/srvf-preflight <任务一句话>`,产出 `02-ai-rules.md` §13.4 八步 checklist。
3. 细则**触碰才读**,全索引见 AGENTS.md §6;历史决策与已完成规划冻结于 [`docs/archive/`](./docs/archive/)(背景层,不当当前事实)。

## 权威源(冲突时从高到低)

1. 后端 live `/api/docs-json`(dev 代理 `/api → :3000`)——字段 / 枚举 / RBAC 码唯一真相
2. 后端 handoff `../srvf-nest-api/docs/handoff/admin-web.md`——任务→端点图 / 轴模型 / gap-ledger
3. `AGENTS.md` > 专题文档 > 蓝图;`docs/archive/**` 仅历史

## 仓外参考资产

统一登记于 [`docs/external-refs.md`](./docs/external-refs.md)(占位符 `<coding-root>` / `<refs-root>` 的唯一定义处;`harness-doctor` [4] 段做存在性巡检)。

## 常用命令

```bash
pnpm install --frozen-lockfile        # 依赖恢复(裸命令;fresh worktree 先跑)
pnpm dev                              # 主 checkout :8848;worktree 自起自动落 :8849
pnpm typecheck && pnpm lint           # 零错零警才算过
pnpm build
node .claude/hooks/harness-doctor.mjs # 漂移巡检([1]矩阵 [2]契约冻结 [3]拍平反模式 [4]外部参考)
node .claude/hooks/harness.test.mjs   # 动 .claude/hooks/** 后必跑
```

## 核心铁律速览(全文见 AGENTS.md §1~§3)

- 红线 1~4:禁前端发明 / 反推后端字段、schema、RBAC 码、状态机;缺接口 → 后端 gap-ledger 登记后 STOP。
- 禁启用 `asyncRoutes`、禁补 `getMenuList`;菜单 = 前端静态路由 + `permissions[]` 过滤;mock 非契约。
- 依赖变更 human-only;`.env*` 与工程配置属机器闸红区;auth 五件走申报制(AGENTS.md §2)。
- 业务改动不回流 starter;上游同步只走 starter → 本仓 cherry-pick(`docs/pure-admin/11-upstream-sync.md`)。

## 派生与授权

- starter:`BA7IEE/u-admin-web-starter`(GitHub Private),base commit `fd24cd4`;派生史冻结于 `docs/archive/srvf-frontend-derivation.md`。
- 上游母版 [pure-admin-thin-max-ts](https://github.com/xiaoxian521/pure-admin-thin-max-ts):**付费授权**,仅购买者可用,不可售卖或公开源代码(购买者所在公司及其离职员工同样受限)——此即本仓「永不公开」铁律的根因。
