# SRVF API 对接说明(srvf-nest-api `v0.32.0` ↔ srvf-admin-web)

> **2026-07-05 状态提示**：真实后端当前权威状态以 `srvf-nest-api/docs/current-state.md` 与 live `/api/docs-json` 为准。后端 current-state 已滚动到 v0.37.0，记录 320 条预期路由、195 个权限码、35 个模块。本文件保留 auth/RBAC 接线流程参考价值，但文中历史权限码数量如 155 / 163 只能视为当时快照，不能作为当前精确值。

> **来源**:由 srvf-nest-api 维护方核证;v0.29.0 首版(2026-06-22),**v0.32.0 复核(2026-06-28)**。
> 本文是 [`srvf-api-contract-readiness.md`](./srvf-api-contract-readiness.md) §6 readiness 清单的**回答 + 接线规格**——清单冻结在后端 v0.10.0,彼时缺的(refresh-token / 稳定 RBAC / 稳定登录)早在 v0.29.0 **均已具备**。
> **范围**:聚焦**登录 / 鉴权接线**。**PR-4 已上线(2026-06-22,PR #6)**,§4 的 3-call 登录是现行主流程;auth 主流程文件后续仅经**单独人审 PR** 改动。
> **后台主开发现状(2026-06-28,PR #24 已合并 main)**:工作台 / 招募与入队 / 活动 / 队员 / 内容发布 / 系统管理 **六组任务式 IA 已落地并接真 API**;**仅「通知中心」(v0.32.0 统一通知)待建**。CMS 真实上传 / CORS 待后端 COS provider 配置后单独验收。
>
> 📍 **2026-06-23**:**任务→端点能力图 / 轴模型 / 踩坑 / 缺口台账**已收口到后端 canonical
> `../srvf-nest-api/docs/handoff/admin-web.md`(改契约同 PR 更新、防漂)。本文聚焦**登录 / 鉴权接线**;
> "某页面该调哪些接口、按任务还是按资源设计"读那份,别在两处各维护一份。

---

## 0. 一句话

后端返回信封 `{code:0,message:'ok',data}` 与本仓 `code===0` 判定**天然吻合**;dev proxy `/api → :3000` 已就位,无需改。
**唯一要写的桥接**:后端 JWT payload 极简(`{sub,username}`),把 **token / 身份 / 权限拆成 3 个端点**,
而 pure-admin 期望一次登录拿全 `roles[]+permissions[]+expires` → 登录改成 **3-call 组合**(§5)。其余直接接。

---

## 1. readiness 清单(§6)逐条答 —— 核证于后端 v0.29.0(2026-06-22;v0.30→v0.32 登录 / 鉴权契约无变更)

| 清单项                                           | 结论                                                                                                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| backend decides whether refresh-token will exist | ✅ **存在** `POST /api/auth/v1/refresh`(rotation always + family revoke + reuse detection + 绝对过期)                                                         |
| if no refresh-token, logout-on-expiry strategy   | N/A(已存在)                                                                                                                                                   |
| RBAC v2 permission API 作为前端权限源            | ✅ **确认** `GET /api/system/v1/rbac/me/permissions`(Slow-4 后单轨稳定,**163** 权限码;较 v0.29 +8:招新敏感 `read.sensitive` +1、统一通知 `notification.*` +7) |
| `/api/users/me` 为登录后用户信息唯一源           | ✅ **已改为 `GET /api/admin/v1/me`**(Route B 删除了 `/api/users/me` legacy;9 字段身份,不内联权限)                                                             |
| login response structure stable                  | ✅ `LoginResponseDto` 自 P0-E 冻结 5 字段,「扩展后禁止再增字段」                                                                                              |
| `expiresIn` format stable                        | ⚠️ 稳定,但**是 JWT 配置时长字符串 `"15m"`、不是时间戳**(见 §4 gotcha B)                                                                                       |
| 401 / 429 / 10004 frontend behavior              | ✅ 已明确(见 §4 错误表)                                                                                                                                       |
| Swagger/OpenAPI reflects current auth contract   | ✅ `/api/docs-json`(+ `/api/docs-yaml`)100% + contract snapshot 锁定                                                                                          |
| at least one test account exists                 | ✅ seed 建默认 SUPER_ADMIN;dev 默认 `admin` / `ChangeMe123456`(见 §8)                                                                                         |
| humans explicitly approve restarting PR-4        | ✅ 维护者 2026-06-22 明确批准重启 PR-4                                                                                                                        |

> 即:§6 十项**技术前提全部满足**,人工批准已给。可重启 PR-4。

---

## 2. 契约速查(全部经 dev proxy `/api`;后端 globalPrefix 就是 `/api`,不 rewrite)

**成功信封**:`{ "code": 0, "message": "ok", "data": <T> }`
**失败信封**:HTTP **4xx** + `{ "code": <bizcode>, "message": "<中文>" }`(**无 data**;axios 会 reject,见 §4 gotcha A)

| 用途     | 方法 路径                                | 入参(JSON body)        | `data` 出参                                                                                                       |
| -------- | ---------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 登录     | `POST /api/auth/v1/login`                | `{username, password}` | `{accessToken, tokenType:"Bearer", expiresIn:"15m", refreshToken, refreshExpiresAt:"<ISO>"}`                      |
| 刷新     | `POST /api/auth/v1/refresh`              | `{refreshToken}`       | 同登录(新 access + 新 refresh;rotation always)                                                                    |
| 注销     | `POST /api/auth/v1/logout`               | `{refreshToken}`       | `null`(幂等:不存在/已撤销/已过期均 200)                                                                           |
| 注销全部 | `POST /api/auth/v1/logout-all`           | —(需登录)              | `{revokedCount}`                                                                                                  |
| 身份     | `GET /api/admin/v1/me`                   | —                      | `{id, username, email?, nickname?, avatar?, role, status, …}`(`role`=SUPER_ADMIN/ADMIN/USER,**仅展示非授权依据**) |
| 权限     | `GET /api/system/v1/rbac/me/permissions` | —                      | `{permissions: string[], roles: [{code, displayName}]}`                                                           |

- 登录入参约束:`username` 3–32 位 `[a-zA-Z0-9_-]`(后端内部 `trim+lowercase`);`password` 明文(后端 bcrypt 比对)。
- `accessToken` 是裸 JWT(响应不带 `Bearer` 前缀);前端 `formatToken` 拼 `Bearer <token>` 不变。
- `refreshToken` 是不透明随机串(非 JWT),勿解析。

---

## 3. 错误码 → 前端行为

| code                | HTTP | 含义                                            | 前端行为                                   |
| ------------------- | ---- | ----------------------------------------------- | ------------------------------------------ |
| `10004`             | 401  | 账号或密码错误(5 类登录失败同响应,防枚举)       | 登录页提示 `message`;**不**触发自动刷新    |
| `10007`             | 401  | refresh 无效/已过期(4 子原因同响应)             | 清 token → 跳登录                          |
| `40100`             | 401  | 未登录 / access 失效(JwtGuard)                  | **触发 refresh→重放**;refresh 也失败才登出 |
| `30100`             | 403  | RBAC 判权失败                                   | 跳 403 页                                  |
| `40000`             | 400  | 参数错误                                        | 表单 / 通用提示                            |
| `TOO_MANY_REQUESTS` | 429  | 限流(**无** `Retry-After` / `X-RateLimit-*` 头) | 提示稍后再试                               |

> 完整错误码目录见后端 `src/common/exceptions/biz-code.constant.ts` 或 `/api/docs-json`(每端点 `ApiBizErrorResponse` 列了可能码)。

### 两个必须注意的 gotcha

**gotcha A — biz 失败是 HTTP 4xx,axios 会 reject(不是 resolved 的 `{code:!0}`)**
后端把 BizException 映射成**非 2xx HTTP**(登录失败=401、refresh 失败=401、未登录=401、判权=403)。
pure-admin 现有 `getLogin(data).then(d => if(d.code===0))` 只看**成功**响应;**失败会进 `.catch`**,
拿到的是 axios error,业务体在 `err.response.data.{code,message}`。所以:

- 登录失败:在 login 的 `.catch` / http error 拦截器读 `err.response.data.code/message` 提示。
- http 拦截器的「401 自动刷新」**必须排除 `/api/auth/v1/login` 与 `/api/auth/v1/refresh`**(这俩的 401 是凭证失败,不该去刷新,否则死循环)。

**gotcha B — `expiresIn` 是 `"15m"` 时长字符串,不是时间戳**
pure-admin 的 `auth.ts` 存 `expires`(access 过期时刻,用于「到点前主动刷新」)。后端**不直接给 access 过期时间戳**,
只给:`expiresIn`(JWT 配置时长字符串,如 `"15m"`)+ `refreshExpiresAt`(refresh **family** 的 ISO 绝对死期)。
所以前端要:

- `expires = Date.now() + parseDurationMs(expiresIn)`(`"15m"`→`900_000`;建议提前 30–60s 刷)。
- `refreshExpiresAt` 单独记:到此时刻整个 family 死,refresh 也会回 `10007` → **强制重登**(不是再刷新)。
- 即**两个计时器**:access(15m 主动刷)+ refresh family 绝对死期(到点强制重登)。

---

## 4. 登录 3-call 桥接(核心改动 · PR-4 重启的主体)

后端登录只回 token;身份与权限分两个 authed 端点取。`src/store/modules/user.ts` 的 `loginByUsername` 改成:

```ts
// 1) 登录拿 token
const r1 = await getLogin({ username, password }); // POST /api/auth/v1/login
const t = r1.data; // {accessToken, tokenType, expiresIn, refreshToken, refreshExpiresAt}

// 2) 存 token —— expires 自己算(gotcha B);refreshExpiresAt 单独记
setToken({
  accessToken: t.accessToken,
  refreshToken: t.refreshToken,
  expires: Date.now() + parseDurationMs(t.expiresIn) // "15m" → 900_000
  // 建议在 DataInfo 里加一个 refreshExpiresAt 字段承载 family 绝对死期(到点强制重登)
});

// 3) 并行取 身份 + 权限,组装进 user store 期望形状
const [me, perm] = await Promise.all([
  getAdminMe(), // GET /api/admin/v1/me
  getMyPermissions() // GET /api/system/v1/rbac/me/permissions
]);
this.username = me.data.username;
this.nickname = me.data.nickname ?? me.data.username;
this.avatar = me.data.avatar ?? "";
this.permissions = perm.data.permissions; // string[] 真实权限码
this.roles = perm.data.roles.map(r => r.code); // 业务角色 code[]
```

**要改/新增的文件**(PR-4 重启范围;均在本仓 §4 prohibition 名单内,故须人工已批准后由前端会话改):

- `src/api/user.ts`:`getLogin` 指向 `/api/auth/v1/login`;`refreshTokenApi` 指向 `/api/auth/v1/refresh`;新增 `getAdminMe()`(`/api/admin/v1/me`)+ `getMyPermissions()`(`/api/system/v1/rbac/me/permissions`);更新 `UserResult` / `RefreshTokenResult` 类型(见 §2 出参)。
- `src/store/modules/user.ts`:`loginByUsername` 改 3-call 组合(上方);`handRefreshToken` 走 `/api/auth/v1/refresh` + 重算 `expires`。
- `src/utils/auth.ts`:`setToken` 用算出的 `expires`;增 `refreshExpiresAt` 承载 + 到点强制重登判定;`parseDurationMs` 工具。
- `src/utils/http/index.ts`:401 自动刷新**排除** login/refresh 两端点;error 拦截器读 `err.response.data.{code,message}` 做 biz 错误映射(§3)。
- `mock/login.ts` / `mock/refreshToken.ts`:接真后端后停用(或仅 dev 占位),`mock/asyncRoutes.ts` 见 §6。

---

## 5. RBAC 映射(别用 mock 占位码)

- `permissions[]` = `rbac/me/permissions` 的 `permissions`:**真实点格式**码(如 `recruitment-application.read.record`、`rbac.role.read`、`content.create.record`、`notification.publish.record`),共 **163** 个;**不是** mock 里的 `*:*:*` / `permission:btn:add`。
- **SUPER_ADMIN 返回全集**(实体化全部 163 码,**不是** `["*"]` / 空数组);其它用户返回聚合并集。
- `v-auth` / `hasPerms` 是纯字符串 `includes`,直接喂真实码即可;但页面里写的码**必须是后端真值**——逐个可从 `/api/docs-json` 端点 summary 的 `[rbac: <code>]` 后缀查到,或读后端 `prisma/seed.ts` 的 `*_PERMISSION_SEED`。
- **菜单/页面可见性建议用权限码驱动**(163 细粒度);`roles[]`(业务角色摘要 code,如 `ops-admin`/`apd-chief`)用于粗粒度;系统三档身份(`admin/me.role`)仅展示。
- **招新报名「敏感字段分级」(后端 GAP-006 S3,已发 v0.31.0)**:`recruitment-application.read.record` 现为**普通查看**(脱敏列表/脱敏详情/公示名单/工作台 stats);新增 `recruitment-application.read.sensitive` = **敏感查看**(报名详情明文证件号/手机 + 取证件照 signed-URL)。前端据此**分级渲染**:报名详情页**字段集不变**,但「明文证件号/手机」与「取证件照」按钮应 `v-auth="'recruitment-application.read.sensitive'"` 门控——无该码时详情自动返脱敏值、取证件照端点返 `30100`。当前内置 `biz-admin` 同持两码(行为与改前一致);分级仅在将来细分子角色时生效。
- **统一通知模块(后端 GAP-005,**S1–S5 全切片已发 v0.32.0**)— 阶段 4「通知中心」接线**:新增 **7 码**(全绑 `biz-admin`)= S1 站内信 `notification.{read,create,update,delete,publish}.record`(5)+ S2 `notification.update.template`(微信模板配置)+ S5 `notification.send.sms`(短信兜底)。**通知管理页**(`admin/v1/notifications`,镜像 content「撰写/发布」):列表/详情 `notification.read.record`、新建 `create`、编辑 `update`、软删 `delete`、发布/撤回/归档(状态机 draft→published→archived)`publish`;可见档 **4 选 1**(member/formal_member/department/management,**去 public**;department 档须填活跃部门 orgId 数组,否则 31012);类型 ∈ `notification_type` 字典(activity-reminder/recruitment/emergency/general);非法跃迁 31030。**渠道勾选** `channels`(in-app 恒发 / wechat / sms):勾 wechat → publish 时后端向已订阅会员推送;勾 sms 仅声明可兜底,**短信永不随 publish 自动发**,须在详情页显式「发送短信」→ `POST …/notifications/{id}/send-sms`(`confirmed:false` 预览 recipientCount → `true` 真发,**计费二次确认**;未声明 sms/未发布 → 31013)。**微信模板配置**:`admin/v1/notification-wechat-templates`(各类型 templateId + 启用)。**producer 系统定向**(发号/入队/报名审批/活动取消/考勤终审)由后端业务事务外自动触发,**admin 面无新操作**。**会员侧站内信**(`app/v1/notifications` feed / 未读红点 / 标记已读)是小程序面,**后台不调**。
- **后端没有菜单树端点**(无 `/get-async-routes` 同类):本仓 `getMenuList` 现为空是预期。**菜单仍由前端静态定义**(见 `docs/srvf-static-menu-skeleton-plan.md`)+ **用 `permissions[]` / `roles[]` 过滤**;不要等后端给菜单树(本期没有)。`src/router/asyncRoutes.ts` 的 P0 禁令不受影响。`7.0.1-p0.routes` 已移除生产主链对 `/get-async-routes` 的调用。

---

## 6. OpenAPI 代码生成(推荐:只生成类型)

`/api/docs-json` 是完整 spec。Vue + axios + pure-admin 下最省事:**`openapi-typescript` 只生成类型**,业务请求继续用本仓 `http` 包装器(类型来自生成的 `.d.ts`):

```bash
pnpm dlx openapi-typescript http://localhost:3000/api/docs-json -o src/types/srvf-api.d.ts
```

- **不建议**引第二套请求运行时(orval / @hey-api / @umijs/openapi)——会与本仓 `src/utils/http` 拦截器/refresh 逻辑重叠。
- 注:引入新 devDependency 受本仓 §4「不改 package.json deps」约束,需人工放行;只跑一次 `pnpm dlx` 生成类型则不写 deps。

---

## 7. 测试账号

后端 seed 建默认 SUPER_ADMIN(`prisma/seed.ts`,v1 唯一允许创建 SUPER_ADMIN 的入口):

- 由 env `SUPER_ADMIN_USERNAME` / `SUPER_ADMIN_PASSWORD` 指定;
- **非 production 默认**:`admin` / `ChangeMe123456`(APP_ENV=production 时禁用默认,必须显式设 env)。
- 联调:确保后端已跑 seed,用你后端 `.env` 里的 `SUPER_ADMIN_*`(未设则上面的 dev 默认)登录验证全链。

---

## 8. 接线顺序建议(小步,每步可验)

1. `src/api/user.ts` 路径 + 类型对齐后端(§2);保留 mock 兜底直到联调通。
2. `user store` 改 3-call 登录(§4)→ 用 `admin`/`ChangeMe123456` 登录,断言能进首页、`permissions` 非空。
3. `http` 拦截器:401 刷新排除 login/refresh + biz 错误读取(§3 gotcha A)。
4. token 计时器:`expires` 由 `expiresIn` 算 + `refreshExpiresAt` 强制重登(§4 gotcha B)→ 验主动刷新与过期重登。
5. 菜单/按钮:把页面 `v-auth` 占位码换成后端真实码(§5)→ 验不同账号可见性。
6. 各业务页:按 `/api/docs-json` 接 `admin/v1/*`(成员/组织/活动/考勤/证书/字典/保险/招新/入队/CMS 等)。

---

> 后端契约权威源:`/api/docs-json` + srvf-nest-api `docs/current-state.md`。本文随后端版本演进复核;后端若改 auth/RBAC 契约会在其 CHANGELOG + current-state 标注。
