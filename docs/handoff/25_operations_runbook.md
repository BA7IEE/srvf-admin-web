# 25 运维 Runbook

## 一、本地开发启动

```bash
pnpm install --frozen-lockfile
pnpm dev
```

默认前端端口通常从 `http://localhost:8848` 开始；如端口被占用，Vite 会顺延。本次用户实测实际端口为 `http://localhost:8850/`。

## 二、后端联调

启动真实 `srvf-nest-api` 后端，确保：

- 后端监听 `http://localhost:3000`。
- `/api/docs` 可访问。
- `/api/docs-json` 可访问。
- seed 已执行。

本次用户实测开发账号：`admin / ChangeMe123456`。

## 三、构建

```bash
pnpm typecheck
pnpm build
```

`7.0.1-p0.routes` 已由用户本地验证通过。

## 四、P0 路由补丁验证

```bash
rg -n "@/api/routes|getAsyncRoutes\(|/get-async-routes" src/api src/router/utils.ts src/router/index.ts src/views src/store src/utils
```

预期：无输出。

浏览器登录后，Network 不应出现 `/get-async-routes`。刷新页面后菜单应保持正常。

## 五、常见运维关注

- 前端 proxy `/api -> http://localhost:3000` 不 rewrite。
- 生产环境不能依赖 Vite fake server mock。
- 不要通过启用 `asyncRoutes` 或新增 `getMenuList` 解决菜单问题。
- 页面预填旧密码 `admin123` 会触发 401，不应误判为路由补丁失败。
