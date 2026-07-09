# 16 环境快照

## 一、仓库环境要求

来自 `package.json`：

- Node.js：`^20.19.0 || >=22.13.0`
- pnpm：`>=9`
- 项目脚本：`pnpm dev`、`pnpm typecheck`、`pnpm build`

## 二、本次实际验证环境表现

- `./node_modules/.bin/vue-tsc --noEmit --skipLibCheck`：通过。
- `./node_modules/.bin/vite build`：通过。
- `pnpm typecheck`：未进入类型检查；pnpm 依赖状态检查尝试 install，因无 TTY 中止。

## 三、前端默认端口

`.env` / `.env.development` 当前仍以 Vite 公共变量为准：

- `VITE_PORT = 8848`
- `VITE_ROUTER_HISTORY = "hash"`

## 四、后端联调默认

- 后端地址：`http://localhost:3000`
- Swagger：`http://localhost:3000/api/docs`
- OpenAPI JSON：`http://localhost:3000/api/docs-json`
- dev 默认账号以真实后端 seed / `.env` 为准；历史记录为 `admin / ChangeMe123456`。

## 五、未验证项

- 本次未启动 `pnpm dev`。
- 本次未做浏览器登录/页面冒烟。
- 本次未访问 live `/api/docs-json` 做结构级重新对账。
