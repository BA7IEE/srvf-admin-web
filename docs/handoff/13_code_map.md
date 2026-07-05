# 13 代码地图

## 一、核心入口

| 类型         | 文件 / 目录                                  | 说明                                   |
| ------------ | -------------------------------------------- | -------------------------------------- |
| 前端入口     | `src/main.ts`                                | Vue 应用入口                           |
| App 根组件   | `src/App.vue`                                | 根组件                                 |
| 路由入口     | `src/router/index.ts`、`src/router/utils.ts` | 静态路由、路由守卫、菜单初始化         |
| 静态路由模块 | `src/router/modules/*.ts`                    | SRVF 菜单与页面路由                    |
| 登录页面     | `src/views/login/index.vue`                  | 登录 UI，高风险                        |
| 用户状态     | `src/store/modules/user.ts`                  | token、用户、角色、权限，高风险        |
| HTTP 封装    | `src/utils/http/index.ts`                    | axios、refresh、错误处理，高风险       |
| Auth 工具    | `src/utils/auth.ts`                          | token 保存、过期计算，高风险           |
| 用户 API     | `src/api/user.ts`                            | 登录、refresh、me、permissions，高风险 |
| 业务 API     | `src/api/srvf-*.ts`                          | SRVF 业务请求封装                      |
| 后端入口     | `../srvf-nest-api`                           | 真实后端仓库，不在本前端包内           |

## 二、P0 路由补丁状态

| 文件                        | 状态           | 说明                                                                                       |
| --------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `src/router/utils.ts`       | 已修改         | `initRouter()` 不再请求 `/get-async-routes`，固定走 `handleAsyncRoutes([])` 初始化静态菜单 |
| `src/api/routes.ts`         | 已删除         | 原 pure-admin mock API 封装已移除，避免误接真实后端                                        |
| `mock/asyncRoutes.ts`       | 未修改         | 仍作为 starter / dev mock 历史文件存在，不应进入生产主链                                   |
| `src/router/asyncRoutes.ts` | 未修改、禁启用 | 不得切换登录页 import，不得新增 `getMenuList`                                              |

## 三、核心业务文件

| 模块       | 文件 / 目录                                                                        | 职责                                        | 修改风险 |
| ---------- | ---------------------------------------------------------------------------------- | ------------------------------------------- | -------- |
| 工作台     | `src/views/srvf/workbench/**`                                                      | 后台首页、待办横扫与 dashboard-summary 摘要 | 中       |
| Meta API   | `src/api/srvf-meta.ts`                                                             | 工作台摘要与批量 label 解析                 | 中       |
| 活动       | `src/api/srvf-activity.ts`、`src/views/srvf/activity-domain/activities/**`         | 活动列表、详情、发布、取消                  | 中       |
| 报名       | `src/api/srvf-registration.ts`                                                     | 活动轴报名子资源                            | 中       |
| 考勤       | `src/api/srvf-attendance.ts`                                                       | 活动轴考勤子资源                            | 中       |
| 队员       | `src/api/srvf-member.ts`、`src/views/srvf/members-domain/members/**`               | 队员主档案                                  | 中       |
| 队员旧部门 | `src/api/srvf-member-department.ts`、`src/views/srvf/members-domain/department/**` | 旧单部门模型，应谨慎迁移                    | 高       |
| 组织       | `src/api/srvf-organization.ts`、`src/views/srvf/base-data/organizations/**`        | 组织树                                      | 中       |
| 通知       | `src/api/srvf-notification.ts`、`src/views/srvf/notification-domain/**`            | 通知管理与微信模板                          | 中       |
| 系统       | `src/views/srvf/system/**`                                                         | 用户、角色、RBAC、附件、审计、设置          | 高       |

## 四、高风险文件

| 文件                              | 风险                 | 修改前必须检查                             |
| --------------------------------- | -------------------- | ------------------------------------------ |
| `src/router/utils.ts`             | 登录后路由初始化主链 | 不得启用 `asyncRoutes`；不得依赖后端菜单树 |
| `src/store/modules/user.ts`       | 登录状态与权限主链   | token、roles、permissions、refresh 行为    |
| `src/utils/http/index.ts`         | 全局请求与 401 刷新  | login/refresh 401 不应死循环               |
| `src/views/login/index.vue`       | 登录入口             | 默认账号、错误提示、跳转                   |
| `package.json` / `pnpm-lock.yaml` | 依赖链               | 禁止无授权修改                             |
| `.env*`                           | 环境入口             | 当前仅 Vite 公共变量；不得写密钥           |

## 五、禁止随意改动

- `node_modules/` 不应进入交付包。
- `.git/` 不应进入交付包。
- `SRVF-web-admin参考.zip` 不应解入当前仓库。
- 不要大面积重构 `src/`。

## 六、测试文件对应关系

| 功能                    | 源码                                              | 测试                                            | 验收文档                   |
| ----------------------- | ------------------------------------------------- | ----------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------- | --------------------- |
| P0 路由补丁源码守护     | `src/router/utils.ts`、`src/api/routes.ts` 已删除 | `rg -n "@/api/routes                            | getAsyncRoutes\(           | /get-async-routes" src/api src/router/utils.ts src/router/index.ts src/views src/store src/utils` | `17_test_evidence.md` |
| el-tabs 内容区首屏渲染  | 多个 tab 页面                                     | `tests/render/tabs_render_pass.py`              | `tests/render/README.md`   |
| scoped-authz 浏览器冒烟 | 未在当前包内                                      | `tests/render/scoped_authz_smoke.py` 前序包存在 | 待补血缘                   |
| handoff 文档完整性      | `docs/handoff/*`                                  | `scripts/check_handoff_docs.py`                 | `30_handoff_self_check.md` |

## 七、7.1.0 meta-workbench 状态

| 文件                                 | 状态   | 说明                                         |
| ------------------------------------ | ------ | -------------------------------------------- |
| `src/api/srvf-meta.ts`               | 新增   | 封装 `dashboard-summary` 与 `resolve-labels` |
| `src/views/srvf/workbench/index.vue` | 已修改 | 顶部新增摘要卡片；下方横扫列表保留           |
| `src/views/login/index.vue`          | 已修改 | 默认密码由 `admin123` 改为空字符串           |
| `src/router/utils.ts`                | 未修改 | P0 路由补丁保持不变                          |
| `package.json` / `pnpm-lock.yaml`    | 未修改 | 依赖未变                                     |

## 八、7.1.0 用户本地验证结论

- `src/api/srvf-meta.ts`、`src/views/srvf/workbench/index.vue`、`src/views/login/index.vue` 对应改动已通过用户本地 `typecheck/build/dev/浏览器验证`。
- Network 出现 `GET /api/admin/v1/meta/dashboard-summary`，状态 200。
- Network 未出现 `/get-async-routes`。
- 该版本可作为 P1.2 memberships-read 的下一轮开发基准。
