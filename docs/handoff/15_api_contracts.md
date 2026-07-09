# 15 API 契约

## 一、权威来源

1. live `http://localhost:3000/api/docs-json`
2. `../srvf-nest-api/docs/handoff/admin-web.md`
3. `../srvf-nest-api/docs/current-state.md`
4. 前端 `docs/srvf-admin-vnext-blueprint.md` 仅作 2026-07-06 快照和路线参考。

## 二、Auth 主链

| 动作           | 方法 | 路径                                 | 当前前端状态                          |
| -------------- | ---- | ------------------------------------ | ------------------------------------- |
| 登录           | POST | `/api/auth/v1/login`                 | 已接                                  |
| 当前管理员身份 | GET  | `/api/admin/v1/me`                   | 已接                                  |
| 当前权限       | GET  | `/api/system/v1/rbac/me/permissions` | 已接                                  |
| 刷新 token     | POST | `/api/auth/v1/refresh`               | 已接；#51 增加 40100 被动刷新重试     |
| 登出           | POST | `/api/auth/v1/logout`                | #51 已接真实撤销                      |
| 全部登出       | POST | `/api/auth/v1/logout-all`            | 以当前代码/live docs 为准，动工前复核 |

## 三、菜单 / 路由契约

- 后端没有 `/get-async-routes` 菜单树端点。
- 前端继续使用 `src/router/modules/*.ts` 静态路由。
- 不启用 `src/router/asyncRoutes.ts`，不新增 `getMenuList`。
- 菜单门控应逐步偏向真实权限码 `meta.auths`，但现有页面可能仍混用 `roles`；调整前需逐页验证。

## 四、当前已接主要 API 域

- 活动、报名、考勤、活动作战室。
- 队员、队员档案、证书、紧急联系人、保险、会籍、任职、分管范围、队员账号闭环。
- 组织架构、组织成员、组织 move、tree-with-summary、职务定义、职务规则。
- 会籍总表、归属体检、任职总表、督导总表、角色绑定。
- 权限诊断：authz explain / explain-batch / action-state batch 封装。
- 招新与入队：stats、precheck、批量门槛、导出。
- 内容、通知、微信模板、短信日志、附件配置、通用附件库、公告导入。
- 系统：用户、角色、权限点、角色权限绑定、用户角色分配、审计详情、系统设置。
- Meta：dashboard-summary、resolve-labels。
- 搜索/选择器：全局实体搜索、远程选择器、options 类端点按需封装。

## 五、近期需要复核的契约点

- `docs/srvf-admin-vnext-blueprint.md` 附录 B 的未消费路径已经被 #37~#80 大量消化，需重新对账。
- 工作台扁平列表的 scoped 用户降级语义仍需浏览器角色验证。
- Auth #51 的 refresh family rotation 与 logout 撤销需要真实后端专项验证。
- 全局实体搜索入口 #79/#80 需要确认调用的端点、权限缺失时的空态与错误文案。

## 六、反接口

`/get-async-routes` 是 pure-admin mock 动态路由接口，不是 SRVF 后端接口。不得恢复到生产调用链。
