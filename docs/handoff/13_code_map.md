# 13 代码地图

## 一、核心入口

| 类型         | 文件 / 目录                                  | 说明                                   |
| ------------ | -------------------------------------------- | -------------------------------------- |
| 前端入口     | `src/main.ts`                                | Vue 应用入口                           |
| 路由入口     | `src/router/index.ts`、`src/router/utils.ts` | 静态路由、守卫、菜单初始化             |
| 静态路由模块 | `src/router/modules/*.ts`                    | SRVF 菜单与页面路由                    |
| 登录页面     | `src/views/login/index.vue`                  | 登录 UI，高风险                        |
| 用户状态     | `src/store/modules/user.ts`                  | token、用户、角色、权限，高风险        |
| HTTP 封装    | `src/utils/http/index.ts`                    | axios、refresh、错误处理，高风险       |
| Auth 工具    | `src/utils/auth.ts`                          | token 保存、过期计算，高风险           |
| 用户 API     | `src/api/user.ts`                            | 登录、refresh、me、permissions，高风险 |
| SRVF API     | `src/api/srvf-*.ts`                          | 业务请求封装                           |
| SRVF 原语    | `src/srvf-kit/**`                            | #74~#80 开始抽取的表现层/组合式原语    |

## 二、当前主要业务域

| 域         | 关键文件 / 目录                                                                                                                | 当前状态                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| 工作台     | `src/views/srvf/workbench/**`、`src/api/srvf-meta.ts`                                                                          | 已接 dashboard-summary，后续有设计稿升级与图表 |
| 活动运营   | `src/views/srvf/activities-domain/**`、`src/api/srvf-activity.ts`、`src/api/srvf-attendance.ts`                                | 作战室、报名、考勤、终审 UX、打印、选人 UX     |
| 队员       | `src/views/srvf/members-domain/**`、`src/api/srvf-member.ts`                                                                   | 队员档案、账号闭环、会籍/任职/分管范围 tab     |
| 组织与人事 | `src/views/srvf/org-hr/**`、`src/api/srvf-membership.ts`、`src/api/srvf-position-assignment.ts`、`src/api/srvf-supervision.ts` | 会籍总表、归属体检、任职总表、督导、角色绑定   |
| 基础数据   | `src/views/srvf/base-data/**`、`src/api/srvf-dict.ts`、`src/api/srvf-position.ts`                                              | 字典主从、组织架构、职务定义/规则、贡献值规则  |
| 招募与入队 | `src/views/srvf/recruitment-domain/**`、`src/api/srvf-recruitment.ts`、`src/api/srvf-team-join.ts`                             | 招新工作台补件、批量门槛、导出、发号预检       |
| 内容与公告 | `src/views/srvf/content-domain/**`、`src/api/srvf-content.ts`、`src/api/srvf-attachment.ts`                                    | 内容、封面附件链、通用附件库、公告导入工具     |
| 通知中心   | `src/views/srvf/notification-domain/**`、`src/api/srvf-notification.ts`                                                        | 通知全生命周期、微信模板、短信兜底             |
| 系统管理   | `src/views/srvf/system/**`、`src/api/srvf-role.ts`、`src/api/srvf-permission.ts`、`src/api/srvf-user.ts`                       | 用户、角色、权限点、审计、短信日志、设置       |

## 三、高风险文件

| 文件                              | 风险                    | 当前事实                                        |
| --------------------------------- | ----------------------- | ----------------------------------------------- |
| `src/api/user.ts`                 | auth API                | #51 已改，接 logout / refresh；后续改动必须声明 |
| `src/store/modules/user.ts`       | 登录状态/token 生命周期 | #51 已改，接真实撤销与状态处理                  |
| `src/utils/http/index.ts`         | 全局请求/401 refresh    | #51 已改，接 40100 被动刷新重试                 |
| `src/utils/auth.ts`               | token 存储              | 本次未改；仍属 auth 高风险                      |
| `src/views/login/index.vue`       | 登录入口                | 历史已清空旧密码；后续改动需声明                |
| `src/router/utils.ts`             | 路由主链                | 不得恢复 `/get-async-routes`                    |
| `package.json` / `pnpm-lock.yaml` | 依赖链                  | 禁止无授权修改                                  |
| `.env*`                           | 环境入口                | 不写密钥，不改真实环境                          |

## 四、当前已完成的重点结构变化

- `mock/asyncRoutes.ts`、`mock/login.ts`、`mock/refreshToken.ts`、`mock/system.ts` 已在 #50 归档/删除出生产主链。
- `src/api/routes.ts` 已删除；`/get-async-routes` 不应回归。
- `src/views/dict/**`、`src/views/tenant/**`、`src/views/schedule/**`、`src/views/permission/**` 等 starter 遗留 view 已归档，不再作为当前业务入口。
- `src/srvf-kit/**` 是新原语层，后续迁移应复用现有模式。

## 五、测试/验证对应

| 功能         | 推荐验证                                                                       |
| ------------ | ------------------------------------------------------------------------------ |
| 当前类型     | `./node_modules/.bin/vue-tsc --noEmit --skipLibCheck`                          |
| 当前构建     | `./node_modules/.bin/vite build` 或 pnpm 环境修好后 `pnpm build`               |
| handoff 自检 | 修复脚本排除规则后跑 `python3 scripts/check_handoff_docs.py --root . --strict` |
| 字典主从     | 浏览器检查左侧类型导航、右侧条目树表、分组行视觉                               |
| Auth 专线    | 登录、refresh 过期、40100 重试、logout 后后端 refresh token 撤销               |
