# Setup Notes · PR-3 本地运行与构建验证记录

> 本文件由 PR-3 生成，记录 starter 第一次在本地完成 `pnpm install` / `typecheck` / `lint` / `build` / `dev` 的真实结果。
> 仅作存档，不是规则文档。规则仍以 `02-ai-rules.md`、`09-pr-roadmap.md` PR-3 节为准。

## 本文适用任务

- 想知道 starter 在某次 verification run 当下的"现状快照"
- 排查"我本地 install / build / lint 不通过"时，对照本文件看上一次成功跑通时的环境与命令
- 评估 PR-3 是否达成 DoD

## 必须先读

- `docs/pure-admin-max-ts-baseline.md` 主入口
- `docs/archive/09-pr-roadmap.md` §17.2 PR-3 节
- `docs/archive/10-review-log.md` §18.5 PR-2 调整记录

## 禁止事项

- 禁止以本文件作为规则源——规则在 02-ai-rules、09-pr-roadmap、10-review-log
- 禁止把本文件当成"问题修复指南"——本文件只描述现状

## 相关关键文件路径

- `package.json`（脚本入口）
- `pnpm-lock.yaml`（首次安装后未变化）
- `build/plugins.ts`（PR-2 关键改动）
- `.env`（PR-2 关键改动）
- `mock/asyncRoutes.ts`（PR-2 关键改动 + 已知 lint 残留）

---

## 1. 当前环境

| 项          | 值                                                                |
| ----------- | ----------------------------------------------------------------- |
| Node        | `v22.15.0`                                                        |
| pnpm        | `10.14.0`                                                         |
| OS          | `Darwin MacBook-Pro.local 25.4.0 / arm64`（macOS, Apple Silicon） |
| HEAD commit | `499cee4` (`chore: close template pollution sources`)             |
| 分支        | `main`（与 `origin/main` 对齐）                                   |
| 验证时间    | 2026-05-15                                                        |

环境符合 `package.json` 中 `engines: node ^20.19.0 || >=22.13.0、pnpm >=9` 的要求。

## 2. 安装结果

```
pnpm install
```

| 项                        | 结果                                                                            |
| ------------------------- | ------------------------------------------------------------------------------- |
| 退出码                    | 0（成功）                                                                       |
| 耗时                      | 4m 38.6s（首次安装、无缓存）                                                    |
| `pnpm-lock.yaml` 是否变化 | ❌ **未变化**（行数 7581 / md5 = `dff50cebb5bc6dfc5e326a5bf1ab8423`，前后一致） |
| `node_modules`            | ✅ 生成（约 797M）                                                              |
| `husky prepare` 是否触发  | ✅ 已触发（`.husky/_/` 钩子已写入）                                             |

→ **install 成功且 lockfile 未污染**，符合 PR-3 期望。

## 3. 检查命令结果

### 3.1 `pnpm typecheck`

```
> u-admin-web-starter@7.0.0 typecheck
> vue-tsc --noEmit --skipLibCheck
```

- 退出码：**0** ✅
- 输出：无错误、无警告（vue-tsc 静默成功）

### 3.2 `pnpm lint` ✅ **最终通过**（首次失败 → 已修复）

#### 首次运行 ❌

```
> u-admin-web-starter@7.0.0 lint:eslint
> eslint --cache --max-warnings 0 src mock build --fix

<coding-root>/u-admin-web-starter/mock/asyncRoutes.ts
  97:7  error  'tenantManagementRouter' is assigned a value but never used.
              Allowed unused vars must match /^_/u
              @typescript-eslint/no-unused-vars

✖ 1 problem (1 error, 0 warnings)
```

（日志中 `<coding-root>` 为路径占位符，定义见 `docs/external-refs.md`）

- 退出码：**1**
- 失败阶段：`lint:eslint`（`lint:prettier` 与 `lint:stylelint` 未执行）

#### 失败根因

- PR-2 把 `mock/asyncRoutes.ts` data 数组中的 `tenantManagementRouter` 注释掉；
- 但按 **裁决 1**（不物理删除多租户源码），保留了 L97-124 的 `const tenantManagementRouter = {...}` 定义；
- ESLint `@typescript-eslint/no-unused-vars` 规则在 `--max-warnings 0` 严格模式下把"未引用 const"判为 error；
- 规则允许"以下划线开头的 unused var"（`/^_/u` 例外）。

属 PR-2 的副作用：裁决 1 要求"源码保留"，ESLint 严格模式不接受 unused const，二者冲突。

#### 修复方案：**方案 A（最小重命名）**

由人类裁决后，PR-3 实施候选方案 A：

- `const tenantManagementRouter` → `const _tenantManagementRouter`（下划线前缀符合 lint 例外）；
- 同步把 data 数组旁的注释 `// tenantManagementRouter` 改为 `// _tenantManagementRouter`；
- **对象内容、行数、源码定义体完全保留**；
- 仍**不**恢复进 data 数组——裁决 1「禁止启用」边界完整保留。

候选方案 B~E（块注释 / `void` hack / `eslint-disable` / 改 eslint config）均未采纳：
B 字面合规但可读性差；C 是 hack；D 违反 `02-ai-rules.md §13.3 第 8 条`（禁 `// eslint-disable`）；E 违反 §13.1（`eslint.config.js` 是 ❌ 文件）+ §13.3 第 8 条。

#### 修复后再跑 ✅

| 阶段             | 退出码            |
| ---------------- | ----------------- |
| `lint:eslint`    | 0                 |
| `lint:prettier`  | 0                 |
| `lint:stylelint` | 0                 |
| 总体 `pnpm lint` | **0** ✅ 零错零警 |

所有规则全部通过，且**未使用任何 `// eslint-disable`、`// @ts-ignore`、ESLint 配置放宽**。

### 3.3 `pnpm build`

```
✓ built in 3.05s
🎉 恭喜打包完成（总用时 00 分 02 秒，打包后的大小为 2.4 MB）
```

- 退出码：**0** ✅
- 耗时：3.05s
- 产物大小：约 2.6M（含 favicon / logo / platform-config.json / static/）
- 关键 bundle：
  - `static/js/es-lSKRhO11.js`：891.89 kB（gzip 280.50 kB）
  - `static/js/layout-CtRyJSLB.js`：377.03 kB（gzip 173.51 kB）
  - `static/js/index-ehpiPKsq.js`：289.41 kB（gzip 100.24 kB）

→ **build 成功**，说明 PR-2 的代码改动在编译层面无副作用，仅 ESLint 严格规则不通过（见 3.2）。

## 4. dev 验证结果

```
pnpm dev
```

| 项                                         | 结果                                                   |
| ------------------------------------------ | ------------------------------------------------------ |
| 启动耗时                                   | 1236ms（vite 8.0.3）                                   |
| 启动状态                                   | ✅ ready，HTTP 200 @ `http://localhost:8848/`          |
| 浏览器内验证                               | **未做自动浏览器验证**（AI 无浏览器交互能力）          |
| `Vary: Origin` / `Content-Type: text/html` | ✅ 首屏 200                                            |
| 首屏 HTML grep `tenant`                    | 无命中（属正常，因为 `v-if` 在客户端运行时才决定渲染） |

### 4.1 由人类手动验证的 4 项 DoD

由于 AI 无法触发浏览器登录流程，下列 4 项需由人类在 `pnpm dev` 后**手动访问 http://localhost:8848/ 验证**：

- [ ] 默认登录页可进入（路由 `/login`）；
- [ ] 默认账号 `admin / admin123` 可登录并跳转首页；
- [ ] **多租户输入框**已隐藏（登录页不再有"租户"输入框）；
- [ ] 侧边栏**不再显示"租户管理"菜单**；
- [ ] 浏览器 DevTools Console 无明显运行时报错（NetworkError 除外，因后端未对接）。

## 5. 生产 mock 检查（`pnpm build` 产物）

| 检查项                                                          | 结果   | 结论                                                                         |
| --------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| `grep -R "vitePluginFakeServer" dist`                           | 空     | ✅ fake-server 插件**未注入** dist                                           |
| `grep -R "defineFakeRoute" dist` / `grep -R "fake-server" dist` | 空     | ✅ fake-server 客户端 stub 已剥离                                            |
| `grep -R "tenantManagementRouter" dist`                         | 空     | ✅ 演示菜单未进生产                                                          |
| `grep -R "/get-async-routes" dist`                              | 1 hits | ⚠️ src/api/routes.ts:getAsyncRoutes 业务函数引用了此 URL（被 bundle 入生产） |
| `grep -R "/dict-tree" dist`                                     | 1 hits | ⚠️ 同上：src/api/system.ts:getDictTree                                       |
| `grep -R "/dict-detail" dist`                                   | 1 hits | ⚠️ src/api/system.ts:getDictDetail                                           |
| `grep -R "/tenant-list" dist`                                   | 1 hits | ⚠️ src/api/system.ts:getTenantList                                           |
| `grep -R "/tenant-package" dist`                                | 1 hits | ⚠️ src/api/system.ts:getTenantPackage                                        |
| `grep -R "/refresh-token" dist`                                 | 1 hits | ⚠️ src/api/user.ts:refreshTokenApi                                           |

### 5.1 结论

✅ **PR-2 目标已达成**：`enableProd=false` 生效，mock server 已从 dist 中完全剥离；运行时不再有"生产仍走 mock"的污染。

⚠️ **已知残留**：`src/api/*.ts` 中演示性的 mock URL（`/get-async-routes / /dict-tree / /dict-detail / /tenant-list / /tenant-package / /refresh-token`）仍写在业务 API 函数里，被 bundle 进生产产物。

→ 这**不是 PR-2 范畴**。这些 URL 是 `src/api/*.ts` 里业务函数本身的硬编码（如 `http.request("get", "/get-async-routes")`），属于"业务代码引用演示 URL"。应在 **PR-4 接 NestJS** 时按 §11.3 流程改成真实 NestJS API 路径。在那之前，生产环境调用这些 URL 会因后端未实现而返回 404 / 网络错误——这是预期行为。

## 6. 已知问题 / 留待处理

| #     | 问题                                                           | 处理位置                                                                                                                            |
| ----- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| ~~1~~ | ~~PR-3 lint 失败：`tenantManagementRouter` unused~~            | ✅ **PR-3 内已修复**（方案 A 重命名为 `_tenantManagementRouter`，见 §3.2）                                                          |
| 1     | `vite.config.ts: server.proxy` 未配置                          | 已在 `10-review-log.md §18.5.4` 标注 `[-]`；依赖 Open Question #5（后端 API 路径前缀），后置到 PR-4 前                              |
| 2     | `build/utils.ts:59` 硬编码 `VITE_ENABLE_TENANT: "true"` 默认值 | 已在 `10-review-log.md §18.5.3` 留档（BL-7 上游遗留）；不影响 PR-2 实际效果（`.env=false` 经 `wrapperEnv` 覆盖）；留待"底座单独 PR" |
| 3     | `src/api/*.ts` 演示 URL 残留在生产产物                         | 属 PR-4 范畴；接 NestJS 时按 §11.3 替换为真实 API 路径                                                                              |
| 4     | Open Questions #1~#5 未答                                      | 阻塞 PR-4 启动；包括：返回结构、refresh-token、expires 格式、真实角色名、API 路径前缀                                               |

## 7. 下一步

按 `09-pr-roadmap.md` 推进。**PR-3 已达成 DoD**（install / typecheck / lint / build 全绿；dev HTTP 200；生产 mock 已剥离）。建议顺序：

1. ✅ **PR-3 commit + push**：`chore: record starter setup verification`（含 mock lint 修复 + 本 setup-notes.md + 10-review-log.md §18.6）；
2. 推进 Open Questions #1~#5 答题（NestJS 后端侧）；
3. 进入 **PR-4：NestJS 登录对接**（同时补 `vite.config.ts: server.proxy`）；
4. 评估「派生 SRVF 项目」的时机（在 starter 内还是派生项目内继续 PR-4 ~ PR-8）。
