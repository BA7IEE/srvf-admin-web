# 22 依赖与外部服务

## 一、前端依赖

依赖以 `package.json` 和 `pnpm-lock.yaml` 为准。本轮未改依赖。

主要栈：

- Vue 3
- Vite
- TypeScript
- Pinia
- Element Plus
- axios
- Pure Admin 相关组件

## 二、外部服务

- 真实后端：`srvf-nest-api`。
- 后端 API 仓库：[BA7IEE/srvf-nest-api](https://github.com/BA7IEE/srvf-nest-api)。
- 本地后端默认：`http://localhost:3000`。
- Swagger：`/api/docs`。
- OpenAPI JSON：`/api/docs-json`。
- 开源前端框架组件写法参考：[pure-admin/vue-pure-admin](https://github.com/pure-admin/vue-pure-admin)。

## 三、依赖规则

- 不要无授权 `pnpm add/remove/update`。
- 不要为了单页效果引入重依赖。
- OpenAPI 类型生成如需使用 `pnpm dlx openapi-typescript`，不应写入依赖，除非用户批准。
