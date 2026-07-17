# 11 · Upstream Sync · 作者上游 → starter → 业务项目 同步策略

## 本文适用任务

- 评估是否要把作者 `pure-admin-thin-max-ts` 的新版本同步进本 starter
- 把 starter 的改动 cherry-pick 到派生的业务项目（如 `srvf-admin-web`）
- 评估某个上游变更属于"高风险 / 可参考 / 可安全同步"哪一类
- 决定要不要为同步操作单独开 PR

## 必须先读

- 主入口 §0.5 后端 4 大红线
- `02-ai-rules.md` §13.2.1 AI 命令权限、§13.2.2 底座单独 PR
- `08-starter-derivation.md` §17.3 多产品复用策略

## 禁止事项

- ⛔ **禁止直接 `git merge` / `git pull` 上游到 starter** —— 必须先做只读评估
- ⛔ **禁止直接把 starter 当作上游 push 到作者的 `pure-admin-thin-max-ts` 仓库**
- ⛔ 禁止把上游 mock / tenant / asyncRoutes 演示代码污染业务项目
- ⛔ 禁止 AI 自行 cherry-pick 上游 commit（无论是 starter 还是业务项目）
- ⛔ 禁止把"上游有这个字段"作为后端反推依据（违反主入口红线 1~4）
- ⛔ 禁止以"上游升级了"作为绕过 `package.json` / 依赖变动审批的理由
- ⛔ 禁止把上游覆盖业务项目（业务项目 ≠ starter 的镜像）

## 相关关键文件路径

- 上游母版（只读）：`<refs-root>/pure-admin-thin-max-ts`（占位符见 `docs/external-refs.md`）
- 本 starter：`<coding-root>/u-admin-web-starter`（GitHub：`BA7IEE/u-admin-web-starter`，Private）
- 完整版参考（只读）：`<refs-root>/vue-pure-admin`
- 派生业务项目：分别独立 clone（如 `srvf-admin-web` / `u-studio-admin-web` / `token-admin-web` / `health-admin-web`）

---

## 11-1. 三层仓库关系

```
[上游母版]                              [本 starter]                         [派生业务项目]
pure-admin-thin-max-ts        →        u-admin-web-starter            →     srvf-admin-web
（作者付费私有仓库；只读）              （我的私有母版；BA7IEE）              u-studio-admin-web
                                                                            token-admin-web
                                                                            health-admin-web
                                                                            ...（每个产品独立 clone + 独立 Private 仓库）
```

- **作者上游**只作"参考 / 同步来源"，**不直接在该目录开发**；
- **本 starter** 是稳定的"母版"，**不直接做业务**，业务派生到独立仓库；
- **业务项目**根据需要再决定是否同步 starter；上游的改动**不一定**经 starter，但**至少要经过一次人类评估**（见下文同步链路）。

## 11-2. 同步链路

### 11-2.1 上游 → starter

**严格只读评估流程**：

1. 在另一目录里把上游 `pure-admin-thin-max-ts` 拉到最新（如直接读 `<refs-root>/pure-admin-thin-max-ts`，不要 push 改动回去）。
2. 用 `git diff` 或 `diff -ru` 对比上游与 starter 的差异（仅看，不动）。
3. 按 §11-3 高风险文件清单 + §11-4 分类，逐项判定每个变化的处置。
4. **由人类决定**哪些可同步、哪些禁同步、哪些需要单独 PR。
5. **AI 不得自行 cherry-pick / merge / pull** 上游 commit。

### 11-2.2 starter → 业务项目

业务项目（如 `srvf-admin-web`）的同步策略：

- 业务项目第一阶段建议**不同步 starter**——专注业务自己第一阶段 PR-1 ~ PR-8 跑通。
- 业务项目第二阶段及之后，若 starter 有新版本：
  1. 业务项目侧 `git remote add starter git@github.com:BA7IEE/u-admin-web-starter.git`；
  2. `git fetch starter`；
  3. `git diff main..starter/main -- <文件>` 评估差异；
  4. 仅 `git cherry-pick <commit-sha>` 单条变更，且按 §11-3、§11-4 走分类流程；
  5. **绝对不要 `git merge starter/main` 整段合**，否则会把 starter 的演示模块（tenant / dict / schedule / permission）反复带进业务项目。

### 11-2.3 业务项目之间互不同步

- `srvf-admin-web` 和 `u-studio-admin-web` 互相**不同步**；
- 共用代码请回到 starter，再各自从 starter cherry-pick；
- 这是"独立 clone"复用策略的核心代价：复用通过 starter 中转，不在业务项目间直连。

## 11-3. 高风险文件清单（同步时务必小心）

下列文件一旦上游有变化，**默认归类为高风险**，必须单独 PR 评估：

- `package.json`（依赖、scripts、engines、pnpm 字段任何变化）
- `pnpm-lock.yaml`（任何变化）
- `vite.config.ts`
- `build/**`（`plugins.ts / utils.ts / optimize.ts / compress.ts / info.ts / cdn.ts`）
- `src/router/index.ts`、`src/router/utils.ts`、`src/router/asyncRoutes.ts`
- `src/router/modules/home.ts / error.ts / remaining.ts`
- `src/store/modules/user.ts / permission.ts / multiTags.ts / app.ts / settings.ts / epTheme.ts`
- `src/utils/http/index.ts`、`src/utils/http/types.d.ts`、`src/utils/auth.ts`
- `src/layout/**`（含 `hooks/`、`components/`）
- `mock/**`（含 `login.ts / refreshToken.ts / system.ts / asyncRoutes.ts`）
- `.env / .env.development / .env.production / .env.staging`
- `public/platform-config.json`
- `eslint.config.js / stylelint.config.js / .prettierrc.js / commitlint.config.js / .husky/**`
- `tsconfig.json`

任何这些文件的上游变化，都要拉一份 `git diff`，按 `02-ai-rules.md` §13.2.2 输出"修改原因 / 风险评估 / 上游对比 / 最小变更"四项，由**人类批准**才能合并。

## 11-4. 同步分类（评估每条上游变化）

| 类型               | 判定标准                                                                                                          | 操作                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **可安全同步**     | 仅文档 / 注释 / 微小 typo 修正 / 不影响行为                                                                       | 直接 cherry-pick（仍由人类执行）                                |
| **可参考但不同步** | 上游引入了演示能力（如 tenant / dict / asyncRoutes 演示扩展）、上游加了新的 i18n 翻译条目、上游加了一个新的演示页 | **不同步**；如确需该能力，业务侧重写并适配后端契约              |
| **高风险单独 PR**  | 命中 §11-3 高风险文件清单                                                                                         | 单独 PR；按 `02-ai-rules.md` §13.2.2 输出 4 项；人类审 + 人类合 |
| **禁止同步**       | 任何违反主入口红线 1~4 的变更（如上游强化了多租户、扩了 `MenuData` 字段、改了 mock 权限字符串"约定"等）           | 拒绝；记录在 `10-review-log.md` 下次升级时回顾                  |
| **需要人类决策**   | 介于以上类别之间，或涉及业务 schema 模型                                                                          | 暂缓；列入待决清单，由人类拍板                                  |

## 11-5. 上游 → starter → 业务项目 各级污染防御

> 必须在每个同步链路节点都执行检查，避免演示代码"漏过去"。

### 同步前必查项

- [ ] 同步的 commit 是否包含 `mock/**` 任何**新增**？（默认拒绝，见 `06-mock-risk.md` §8.5）
- [ ] 是否包含 `src/views/tenant/**` 的扩展？（默认拒绝，与裁决 1 / 红线 3 冲突）
- [ ] 是否包含 `src/router/asyncRoutes.ts` 的任何修改？（默认拒绝，与裁决 2 / 红线 2 冲突）
- [ ] 是否在 `mock/login.ts` 增加新角色名 / 权限通配？（默认拒绝，与裁决 3 / 红线 4 冲突）
- [ ] 是否触碰 §11-3 高风险文件？（命中则走单独 PR）
- [ ] 是否触碰 `package.json` 或 `pnpm-lock.yaml`？（命中则按 `02-ai-rules.md` §13.2.1 由人类执行）
- [ ] 是否会引入新依赖？（默认拒绝；如确需，单独 PR + 人类执行 pnpm 命令）

任何一项不能确认的，**默认拒绝同步**，记录到 `10-review-log.md` 待决清单。

### 业务项目侧的额外检查

- [ ] 这次同步是否会引入"前端反推后端模型"的字段（红线 1）？
- [ ] 这次同步是否引入"以 mock 为契约"的代码（红线 2）？
- [ ] 这次同步是否启用了多租户（红线 3）？
- [ ] 这次同步是否引入"前端定义 RBAC"代码（红线 4）？
- [ ] 这次同步是否改了业务侧 NestJS 对接代码（`src/api/<业务>.ts` / `src/utils/http`）？

业务项目对 starter 的同步**比 starter 对上游更严格**——任何一项命中，强制单独 PR。

## 11-6. 操作模板

### 评估上游单文件差异（只读）

```bash
diff -u "<refs-root>/pure-admin-thin-max-ts/<file>" \
        "<coding-root>/u-admin-web-starter/<file>"
```

### 在 starter 仓库内查上游 hash（只读）

```bash
cd <coding-root>/u-admin-web-starter
git log --oneline --all   # 只看，不要 push 任何上游 ref
```

### 业务项目侧 cherry-pick starter 某个 commit（人类执行）

```bash
cd <业务项目目录>
git remote add starter git@github.com:BA7IEE/u-admin-web-starter.git    # 一次性
git fetch starter
git log starter/main --oneline | head -20                                # 只看
git cherry-pick <commit-sha>                                             # 经人类批准后执行
```

**注意**：以上命令均由**人类执行**或在人类明确批准的对话中执行；AI 不得自行运行。

## 11-7. 启用动态菜单 / asyncRoutes 的同步规则（特别条款）

`src/router/asyncRoutes.ts` 是高风险中的最高风险文件：

- 第一阶段在 starter 与所有业务项目中**一律禁用**（见 `03-router-menu.md` §5.2.1）；
- 上游若提交了与 `asyncRoutes.ts` 相关的改动，**默认拒绝同步**；
- 如果将来人类决定启用动态菜单：
  1. 必须先由后端独立设计菜单管理 API（不是因为上游或前端有 `MenuData` 接口就反推一张菜单表）；
  2. 在业务项目里单独立项 PR，包含完整 4 项评估；
  3. 完成后回写 `10-review-log.md` 当前阶段决策；
  4. starter 是否也启用是单独决策，不强制跟随。

## 11-8. 与作者 issue / 升级文档的关系

- 作者上游可能会发布 release notes / changelog / breaking changes 通告——**由人类阅读并归档到 `10-review-log.md`**；
- AI 在评估上游差异时，可以引用作者 changelog 作为辅证，但**不允许**用 changelog 反推后端模型；
- 如作者发布 v8.x.x 大版本升级，**默认不立即同步**，由人类评估"是否切大版本"（这通常需要重新跑一遍 5-agent 回归 review）。
