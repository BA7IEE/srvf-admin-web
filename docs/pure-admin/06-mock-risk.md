# 06 · Mock Risk · Mock 体系与硬规则

## 本文适用任务

- 排查"为什么我看到这个数据"——是不是 mock 的
- PR-2 中关闭生产 mock
- 评估是否要新增一个临时 `*.demo.ts` 占位
- 检查 mock 字段是否被业务代码当成"真实字段"用

## 必须先读

- 主入口 §0.5 红线 2（不从 mock 反推 API）
- 主入口 §0.5 红线 1 / 红线 3 / 红线 4（mock 字段不是后端字段、mock 角色 / 权限不是后端 RBAC）
- `02-ai-rules.md` §13.3 第 3 条硬规则（mock 禁新增）

## 禁止事项

- ⛔ 禁止把 mock URL（`/login / /dict-tree / /tenant-list / /get-async-routes` 等）当成后端 API 真实路径
- ⛔ 禁止根据 mock 字段反推后端字段、表结构、状态机、枚举值
- ⛔ 默认禁止新增任何 mock（包括为新业务模块创建 mock 文件）
- ⛔ 禁止在生产环境保留 `vitePluginFakeServer({ enableProd: true })`
- ⛔ 禁止把 mock 路径**暴露给业务调用方**（业务侧只 import `src/api/*.ts`）
- ⛔ 禁止 `mock/asyncRoutes.ts` 扩字段以"模拟后端菜单管理表"

## 相关关键文件路径

- `mock/login.ts`
- `mock/refreshToken.ts`
- `mock/system.ts`
- `mock/asyncRoutes.ts`
- `build/plugins.ts`（`vitePluginFakeServer` 配置）
- `vite.config.ts`（`server.proxy` 用来切真接口）
- `src/api/*.ts`（业务唯一允许接触的接口入口）

---

## 8. Mock 体系

### 8.1 文件位置

```
mock/
├── login.ts        # /login（admin / common 两种角色返回）
├── refreshToken.ts # /refresh-token
├── system.ts       # 字典 / 租户 / 套餐
└── asyncRoutes.ts  # /get-async-routes（permission/schedule/dict/tenant 四个动态路由）
```

### 8.2 启用方式

- 由 `vite-plugin-fake-server` 接管，配置在 `build/plugins.ts`：

  ```ts
  vitePluginFakeServer({
    logger: false,
    include: "mock",
    infixName: false,
    enableProd: true
  })
  ```

- **`enableProd: true` 意味着 production 也会走 mock**（用于演示）。**生产环境接真后端前必须将 `enableProd` 改为 `false`**——这是第一阶段 PR-2 的必改项。

### 8.3 关闭方式

- 临时关闭：把 `build/plugins.ts` 中 `vitePluginFakeServer({...})` 的 `enableProd` 改成 `false`。
- 单条接口替换：在 `src/api/*.ts` 中改 URL 指向真实后端，`vite.config.ts` 的 `server.proxy` 把 `/login` 等代理到 NestJS。
- 后续推荐：**业务模块只允许走真接口，演示模块单独 namespace**（如 mock 全部加 `/mock/...` 前缀，proxy 也只代理非 `/mock/...`）。

### 8.4 当前 mock 一览

| URL | 方法 | 文件 | 说明 |
| --- | --- | --- | --- |
| `/login` | POST | `mock/login.ts` | 返回 admin / common 两套用户 |
| `/refresh-token` | POST | `mock/refreshToken.ts` | 刷新 token（**用于触发 §6.3 队列重放，必须保留可替换**） |
| `/get-async-routes` | GET | `mock/asyncRoutes.ts` | 返回 4 个动态路由（permission/schedule/dict/tenant） |
| `/dict-tree` | GET | `mock/system.ts` | 字典左侧树 |
| `/dict-detail` | POST | `mock/system.ts` | 字典明细 |
| `/tenant-list` | POST | `mock/system.ts` | 租户列表 |
| `/tenant-package` | POST | `mock/system.ts` | 租户套餐 |
| `/tenant-package-menu` | POST | `mock/system.ts` | 租户套餐菜单权限 |
| `/tenant-package-menu-ids` | POST | `mock/system.ts` | 根据角色 id 查菜单 |
| `/tenant-package-simple` | GET | `mock/system.ts` | 简化套餐下拉 |

### 8.5 ⛔ Mock 硬规则（裁决 4，P0）

1. **mock 只能服务演示，不得服务业务真相**。任何业务模块都禁止把 mock 作为接口契约依据。
2. **默认禁止新增任何 mock**；仅在 UI 无法初始化或缺少临时数据会导致页面无法编译 / 无法进入的极端情况下，才允许新增 `*.demo.ts` 临时占位，且必须满足以下条件：
   - 文件名 / URL / 文件头注释中**显式标记** `temporary` 或 `demo`（例如 `mock/srvfTeam.demo.ts`、URL 加前缀 `/demo/...`）；
   - PR 描述里写"接 NestJS 真接口后立即删除"+ 预计接入 PR 编号；
3. **接真 API 后不得继续依赖 mock**。同一个模块不能"页面 A 走真接口、页面 B 还在 mock"，要全切。
4. **生产环境必须关闭 mock**：`build/plugins.ts` 中 `vitePluginFakeServer({ enableProd: false })`——第一阶段 PR-2 必改。
5. mock 字段不是后端字段。**绝不能因为 mock 里有 `packageId/expireTime/contactMobile/dictId/menuType` 等字段，就反推后端要建这些字段**（主入口红线 1、2、3）。
6. 即便短期保留 mock 文件作为参考范式，**也不得将其 URL 暴露给业务调用方**，业务侧只看 `src/api/*.ts`。
