# 05 · HTTP & API · 请求封装与 API 管理

## 本文适用任务

- 接入 NestJS 真接口（PR-4 登录对接是第一站）
- 新增业务 API 函数与类型
- 适配 NestJS 返回结构 / 错误码 / token 过期格式 / refresh-token 机制
- 配置 `vite.config.ts: server.proxy` 把请求代理到 NestJS

## 必须先读

- 主入口 §0.5 红线 2（不从 mock 反推 API）
- `02-ai-rules.md` §13.2.1（AI 命令权限：不得改 `package.json` 间接加请求库）
- `04-auth-permission.md`（token 注入流程）

## 禁止事项

- ⛔ 禁止在 `views/*.vue` 内直接 `axios.get(...)` / `fetch(...)`
- ⛔ 禁止假设后端返回结构一定是 `{ code: 0, message, data }`——必须以 Swagger 为准
- ⛔ 禁止"为前端方便"要求后端实现 / 修改字段（违反主入口红线 1）
- ⛔ 禁止仅因模板有刷新队列，就要求后端实现 `/refresh-token`（裁决 7）
- ⛔ AI 不得改 `src/utils/http/**` 主流程；接 NestJS 的"一次性适配"必须人类拍板 + 单独 PR（§13.2.2）
- ⛔ 禁止把 mock 路径（`/dict-tree / /tenant-list / /get-async-routes`）作为后端 API 真实路径

## 相关关键文件路径

- `src/utils/http/index.ts`（PureHttp 类，拦截器 + 队列）
- `src/utils/http/types.d.ts`
- `src/api/user.ts`、`src/api/system.ts`、`src/api/routes.ts`
- `src/utils/auth.ts:setToken`
- `vite.config.ts`（`server.proxy`）
- `src/utils/message.ts`（未来可加 `bizCodeToMessage`）

---

## 7. 请求封装与 API 管理

### 7.1 axios 封装

文件：`src/utils/http/index.ts`，类型：`src/utils/http/types.d.ts`。

- 默认配置 `timeout: 10000`、`Content-Type: application/json`、`paramsSerializer = qs.stringify`。
- 暴露三件套：`request<T>(method, url, param?, axiosConfig?)`、`post<T,P>`、`get<T,P>`。
- 注意：**当前没有默认 baseURL**，依赖 vite proxy 与浏览器同源。
- 响应拦截器**不做错误码统一处理**——直接 `return response.data`；业务调用方需要自己检查 `code === 0`。
- 拦截器支持**两层钩子**：
  - 请求级 `beforeRequestCallback`（传给 `post/get/request`）
  - 全局级 `PureHttp.initConfig.beforeRequestCallback`
  - 响应也有同样两层（`beforeResponseCallback`）

### 7.2 baseURL / 代理

- `vite.config.ts` 中 `server.proxy = {}` 默认空。
- 接 NestJS 时建议两条路：
  - 开发：在 `vite.config.ts` 加 `proxy: { "/api": { target: "http://localhost:3000", changeOrigin: true, rewrite: p => p.replace(/^\/api/, "") } }`（由人类一次性配置，**不要让 AI 凭空改**——这是 ❌ 文件，按 `02-ai-rules.md` §13.2.2 单独 PR）。
  - 生产：通过反向代理在网关层处理。
- 或者在 `src/utils/http/index.ts` 的 `defaultConfig` 中加 `baseURL: import.meta.env.VITE_API_BASE` 等环境变量（建议人类介入决策）。**注意：这是底座层改动，必须先写风险评估。** 此外 `02-ai-rules.md` §13.3 第 13 条规定 `import.meta.env.VITE_*` 不得在源码侧写 fallback。

### 7.3 请求拦截器 / 响应拦截器 / 错误处理

详见 `04-auth-permission.md` §6.3。

- 缺陷：**没有响应级"全局错误提示"**——业务调用层要自己 catch + `message(...)`。后续接 NestJS 时建议增加：
  - 响应拦截器对 401 强制登出；
  - 5xx 统一 `message` 报错；
  - NestJS 的 `BizCode` 错误码统一转 message 文案。
- 这些改动属于底座升级，必须经人类同意。

### 7.4 API 文件组织

- 一个业务模块 = 一个 `.ts` 文件，例：`src/api/srvf-user.ts`。
- 每个 API 函数返回 `Promise<具体类型>`，类型放同一文件或同名 `.d.ts`。
- **禁止在 `views/*.vue` 内直接调 axios / fetch**。
- 文件内必须 export `type XxxResult = { code, message, data: ... }`（对齐后端统一返回结构）——具体结构以 NestJS Swagger 为准，见 §7.5。

### 7.5 对接 NestJS Swagger / 统一返回结构（裁决 7 必读）

- 后端 Swagger 是契约真相。前端可：
  1. **手写**：把 `getDictDetail / getTenantList` 这种演示函数全部替换成真实 NestJS 接口路径（如 `/api/v1/users`）。
  2. **生成**：基于 OpenAPI 用 `openapi-typescript` 或 `swagger-typescript-api` 生成 `src/api/__generated__/`，业务再 import（推荐，后续可加 CI 校验）。

- **统一返回结构对齐**：
  - thin-max-ts **假设**了 `{ code: 0, message, data }`（见 `src/api/user.ts:3-24`），**但这只是 mock 的格式，不是 NestJS 一定的格式**。
  - NestJS 项目的真实返回**可能**是 `{ code, message, data }` / `{ code, msg, data }` / `{ success, data, error }` / `{ data, meta, errors }` ……
  - **接登录的同一个 PR 里必须一次性确认并适配**，禁止"先接着、慢慢改"：
    1. 从 Swagger / 后端文档确认真实返回结构；
    2. 在 `src/utils/http/index.ts` 的响应拦截器（约 L126-138）**一次性适配**（如把 `{ data, meta }` 重写为 `{ code: 0, message: "", data }`），让业务层永远拿到同一种结构；
    3. 在 `src/api/user.ts` 的 `UserResult` 类型同步改字段；
    4. 在 `src/utils/auth.ts:setToken` 处适配 token 过期时间格式：
       - 若后端返回 `expires` 是 **ISO/日期字符串** → 保留 `new Date(data.expires).getTime()`；
       - 若返回 **unix ms 数字** → 改 `expires = data.expires`，并把 `DataInfo<Date>` 改成 `DataInfo<number>`（作者已在源文件中给出注释）；
       - 若返回 **`expiresIn` 秒数**（OAuth 2 风格） → `expires = Date.now() + data.expiresIn * 1000`。

- **绝不能让后端去凑前端**——出现字段或结构不一致时，**改前端拦截器与类型**。

### 7.6 refresh token 适配规则（裁决 7）

`src/utils/http/index.ts` 当前已实现"token 过期 → 单 refresh + 多请求队列重放"逻辑（`isRefreshing` 标志 + `PureHttp.requests` 队列）。

**前端刷新队列是前端内部优化，refresh-token 是后端架构选择；两者独立。后端无 refresh 时前端降级，禁止反推后端实现 refresh。**

接入 NestJS 时必须做适配判断：

| NestJS 是否有 refresh-token | 前端处置 |
| --- | --- |
| ✅ 有 | 把 `refreshTokenApi`（`src/api/user.ts`）URL 与请求体改为后端真实接口；保留队列逻辑 |
| ❌ 无（仅短时效 accessToken） | 前端**降级**：删除 / 注释 `httpInterceptorsRequest` 中 `expired === true` 分支的刷新流程，过期直接 `logOut()`；同时 `mock/refreshToken.ts` 可保留但不再被调 |
| ⚠️ 后端要专门为前端设计 refresh | **不允许**。后端不实现 refresh，是后端的选择，前端用降级方案，**不得倒逼后端实现 refresh 仅仅为了配合 thin-max-ts 模板** |

**禁止**因为模板自带刷新队列，就要求后端必须实现 `/refresh-token`。这是变相违反主入口红线 1。
