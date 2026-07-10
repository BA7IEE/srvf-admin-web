# 03 项目架构

## 一、总体结构

`srvf-admin-web` 是 SRVF 后台管理前端，基于私有 `u-admin-web-starter` 派生，技术栈为 Vue 3、Vite、TypeScript、Pinia、Element Plus、Pure Admin 生态组件。

真实后端为 `srvf-nest-api`，当前权威状态为 v0.39.0（2026-07-10）。后端是 NestJS + Prisma + PostgreSQL 的 API 服务，前端通过 Vite proxy `/api -> http://localhost:3000` 联调。

## 二、运行时主链

```text
浏览器
  -> Vite dev server / 静态资源
  -> src/main.ts
  -> src/router/index.ts + modules 静态路由
  -> src/router/utils.ts initRouter 静态菜单初始化
  -> src/store/modules/user.ts 登录状态
  -> src/utils/http/index.ts axios 封装与 token refresh
  -> 后端 /api/auth/v1 / /api/admin/v1 / /api/system/v1
```

## 三、菜单与路由原则

- 当前项目使用前端静态路由模块 `src/router/modules/*.ts`。
- 后端没有 `/get-async-routes` 类型菜单树接口。
- `7.0.1-p0.routes` 已删除 `src/api/routes.ts`，生产主链不再请求 `/get-async-routes`。
- 不启用 pure-admin `asyncRoutes`。
- 不新增 `getMenuList`。
- 页面可见性当前沿用 `roles` 过滤；按钮和动作权限应继续对齐真实 `permissions[]`。

## 四、业务页面组织原则

后端 admin-web 文档要求按任务和所有权轴设计页面：

- 活动轴：活动详情下管理报名与考勤。
- 队员轴：队员 360 下管理档案、证书、紧急联系人、保险、组织归属、任职、参与记录。
- 组织轴：组织树下管理组织成员、在任职务、组织相关只读范围信息。
- 系统配置面：用户、角色、权限诊断、职务定义、职务规则、角色绑定、分管、字典、贡献规则、附件、审计、短信、设置。

## 五、参考包边界

`SRVF-web-admin参考.zip` 只能用于查看 pure-admin / vue-pure-admin UI、组件和页面范式。禁止直接复制其 mock、RBAC、tenant、动态路由或业务字段。
