# 16 环境快照

## 一、当前仓库环境要求

来自 `package.json`：

- Node.js：`^20.19.0 || >=22.13.0`
- pnpm：`>=9`
- 项目脚本：`pnpm dev`、`pnpm typecheck`、`pnpm build`

## 二、前端默认端口

`.env` 与 `.env.development` 当前配置：

- `VITE_PORT = 8848`
- `VITE_ROUTER_HISTORY = "hash"`

这些是 Vite 公共配置，不是密钥。

## 三、后端联调默认

- 后端地址：`http://localhost:3000`
- Swagger：`http://localhost:3000/api/docs`
- OpenAPI JSON：`http://localhost:3000/api/docs-json`
- dev 默认账号以真实后端 seed / `.env` 为准；未覆盖时历史文档记录为 `admin / ChangeMe123456`。

## 四、未验证项

本轮未执行本地安装、构建或启动。
