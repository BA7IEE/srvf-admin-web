# 15 API 契约

## 一、权威来源

1. 后端 live `http://localhost:3000/api/docs-json`。
2. 后端 `srvf-nest-api/docs/current-state.md`。
3. 后端 `srvf-nest-api/docs/handoff/admin-web.md`。
4. 前端 `docs/srvf-api-integration-guide.md` 仅作为 auth/RBAC 流程参考，精确数量以当前后端为准。

## 二、当前 auth 主链

| 动作           | 方法 | 路径                                 | 用户本地验证                 |
| -------------- | ---- | ------------------------------------ | ---------------------------- |
| 登录           | POST | `/api/auth/v1/login`                 | 已通过                       |
| 当前管理员身份 | GET  | `/api/admin/v1/me`                   | 已通过                       |
| 当前权限       | GET  | `/api/system/v1/rbac/me/permissions` | 已通过                       |
| 刷新 token     | POST | `/api/auth/v1/refresh`               | 本次未触发专项验证，代码未改 |

## 三、菜单 / 路由契约

- 后端没有 `/get-async-routes` 菜单树端点。
- `7.0.1-p0.routes` 已删除 `src/api/routes.ts`，`src/router/utils.ts:initRouter()` 不再请求该 mock 端点。
- 用户本地 Network 已确认登录与刷新过程中未出现 `/get-async-routes`。
- 前端菜单继续由 `src/router/modules/*.ts` 静态定义。
- 菜单可见性当前沿用 `roles` 过滤；按钮和行为权限应逐步以真实 `permissions[]` / action-state 对齐。

## 四、当前前端已封装主要路径

- `/api/admin/v1/activities`
- `/api/admin/v1/activities/:id/registrations`
- `/api/admin/v1/activities/:id/attendance-sheets`
- `/api/admin/v1/members`
- `/api/admin/v1/members/:id/profile`
- `/api/admin/v1/members/:id/certificates`
- `/api/admin/v1/members/:id/emergency-contacts`
- `/api/admin/v1/members/:id/department`（旧口径，高风险）
- `/api/admin/v1/organizations`
- `/api/admin/v1/recruitment/*`
- `/api/admin/v1/team-join/*`
- `/api/admin/v1/notifications`
- `/api/admin/v1/contents`
- `/api/admin/v1/users`
- `/api/system/v1/*`

## 五、当前缺口方向

- `/api/admin/v1/members/:id/memberships`
- positions / position-rules
- position-assignments
- role-bindings
- supervision-assignments
- authz explain / explain-batch
- authz action-state batch
- meta dashboard summary
- options / resolve-labels 辅助接口

## 六、已处理反接口

`/get-async-routes` 是 pure-admin mock 动态路由接口，不是 SRVF 后端接口。`7.0.1-p0.routes` 已从生产源码调用链移除该接口。`mock/asyncRoutes.ts` 与历史文档中仍可能出现该字符串，只作为 starter / mock 风险说明，不是可调用业务契约。

## 7.1.0 接入：Admin Meta

| 前端封装                | 方法 | 后端接口                               | 说明                                                             |
| ----------------------- | ---- | -------------------------------------- | ---------------------------------------------------------------- |
| `getDashboardSummary()` | GET  | `/api/admin/v1/meta/dashboard-summary` | 工作台摘要；后端按 block 权限裁剪，缺权限 block 省略，响应仍 200 |
| `resolveLabels(data)`   | POST | `/api/admin/v1/meta/resolve-labels`    | 批量 id → label；refs ≤ 200；无权限/不存在/软删静默省略          |

前端渲染规则：

- `registrations` block 存在时显示“待审报名”。
- `attendanceSheets` block 存在时显示“考勤待一级审核”和“考勤待终审”。
- `activities` block 存在时显示“进行中活动”。
- 缺失 block 不显示，不当成 0。
- 摘要接口失败只影响顶部提示，不阻断下方报名/考勤横扫。

## 7.1.0 本地验证

- 用户本地 Network 已确认 `GET /api/admin/v1/meta/dashboard-summary` 返回 200。
- 当前返回 block：`registrations / attendanceSheets / activities`。
- 前端未把缺权限 block 渲染为 `0`。
- Network 未出现 `/get-async-routes`。
