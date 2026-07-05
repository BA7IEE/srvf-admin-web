# 06 部署与升级

## 一、当前部署判断

本轮 P0 小补丁不涉及部署、Docker、Nginx、域名、SSL 或服务器文件。生产部署前必须先在用户本地完成构建和登录冒烟。

## 二、常规前端构建命令

```bash
pnpm install
pnpm typecheck
pnpm build
```

产物通常为 `dist/`，具体部署方式以现有运维配置为准。

## 三、升级注意

- `.env*` 当前只包含 Vite 公共配置，不应写入密钥。
- 生产环境不应启用 mock。
- `7.0.1-p0.routes` 已从生产主链移除 `/get-async-routes`，部署后应在 Network 和构建产物中确认该接口不再出现。
- 部署前必须确认后端 `/api/docs-json` 与前端 API 封装匹配。

## 四、回滚原则

- 代码回滚优先回到用户最后实测确认代码包。
- 若只回滚本轮 P0 补丁，可回到 `srvf-admin-web_v7.0.0-docs.1_handoff_full_20260705.zip`。
- 不得通过启用 `asyncRoutes` 或新增 `getMenuList` 作为回滚替代。
