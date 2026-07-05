# 27 故障排查手册

## 一、登录成功后进不去首页

优先检查：

1. Network 是否仍请求 `/get-async-routes`。如果有，说明使用了旧包、旧缓存，或有人恢复了 `src/api/routes.ts` / `getAsyncRoutes()`。
2. 当前源码 `src/router/utils.ts:initRouter()` 是否为 `handleAsyncRoutes([])`。
3. `src/api/routes.ts` 是否已被删除。
4. 登录态中的 `roles` 是否与静态路由 `meta.roles` 匹配。
5. 生产环境是否仍意外启用了旧 mock。

## 二、登录失败

1. 确认后端是否已启动在 `:3000`。
2. 确认 Vite proxy `/api` 是否生效。
3. 确认账号密码以真实后端 `.env` / seed 为准。
4. 本次用户实测开发账号：`admin / ChangeMe123456`。
5. `7.1.0` 已清空页面旧密码预填；如果仍看到 `admin123`，优先检查浏览器缓存或是否使用旧包。
6. 检查 `POST /api/auth/v1/login` 响应 code/message。

## 三、按钮不显示

1. 检查 `GET /api/system/v1/rbac/me/permissions` 返回。
2. 检查页面 `v-auth` / `hasPerms` 是否使用真实点格式权限码。
3. 不要使用 mock 权限码。

## 四、字段不对

1. 读取 live `/api/docs-json`。
2. 读取后端对应 controller / DTO。
3. 不要从 pure-admin demo 字段猜。

## 五、页面空白或 tab 内容不显示

运行：

```bash
RP_BASE=http://localhost:8848 RP_API=http://localhost:3000 uv run --with playwright python tests/render/tabs_render_pass.py
```

如 Vite 实际端口不是 8848，按实际端口替换 `RP_BASE`。本次用户实测端口为 8850。

## 六、工作台摘要不显示

1. Network 检查是否请求 `GET /api/admin/v1/meta/dashboard-summary`。
2. 如果接口 200 但缺少某个 block，这是后端按权限裁剪的正常语义，不应显示为 0。
3. 如果顶部出现 warning，下方报名 / 考勤横扫仍应可用。
4. 用 SUPER_ADMIN 验证时应看到更多摘要块；受限账号可能只看到部分块。
5. 不要为解决摘要问题恢复 `/get-async-routes` 或改路由主链。
