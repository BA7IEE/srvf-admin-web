# 02 开发规则

## 一、信息优先级

1. 用户当前明确指令。
2. 当前上传的最新项目文件。
3. `project_state.json`。
4. `docs/handoff/00_new_chat_start.md` 与 `01_current_state.md`。
5. `docs/handoff/23_package_lineage.md`。
6. `CLAUDE.md`、`AGENTS.md`、`docs/pure-admin/02-ai-rules.md`。
7. 后端 `srvf-nest-api/docs/current-state.md`、`docs/handoff/admin-web.md`、live `/api/docs-json`。
8. README、USAGE 和其他旧文档。
9. 历史聊天记忆。
10. 推测。

如发现冲突，先写入 `29_doc_conflict_map.md`，不要擅自调和。

## 二、本仓通用硬规则

- 本仓必须保持私有。
- 不得从 pure-admin demo、mock、tenant、asyncRoutes 反推 SRVF 业务需求。
- 不得启用 `src/router/asyncRoutes.ts`。
- 不得新增或实现 `getMenuList`。
- 不得恢复租户管理菜单。
- 不得新增依赖或修改 `package.json` 依赖字段，除非用户明确批准。
- 不得硬编码 `import.meta.env.VITE_*` fallback。
- 不得使用 `// eslint-disable`、`// @ts-ignore`、`--no-verify` 绕过质量门禁。

## 三、真实后端对接规则

- 权威接口源为后端 live `/api/docs-json`。
- 后端当前状态入口为 `srvf-nest-api/docs/current-state.md`。
- 后端 admin-web 页面归位规则以 `srvf-nest-api/docs/handoff/admin-web.md` 为准。
- 前端不得发明字段、枚举、状态机、权限码、错误码。
- 合同未就绪时标记 placeholder，不要自作主张。

## 四、PR-4 / Auth 主链规则

PR-4 已上线。认证文件是活跃代码，不再是永久禁区，但修改必须明确声明影响范围。

高风险文件：

- `src/api/user.ts`
- `src/utils/auth.ts`
- `src/utils/http/index.ts`
- `src/store/modules/user.ts`
- `src/views/login/index.vue`
- `src/router/utils.ts`
- `src/api/routes.ts`

修改上述文件前必须说明：改哪个文件、为什么改、影响登录状态 / token 生命周期 / 路由守卫 / 权限过滤的哪个环节、如何验证。

## 五、每轮修改前必须输出

- 任务类型。
- 已读取文档。
- 当前基线与最后用户确认包。
- 允许改动文件。
- 禁止误触文件。
- 是否影响 auth 主链。
- 是否影响后端契约、数据库、部署、依赖。
- 验证命令。
- 回滚基准。

## 六、每轮结束必须更新

- `VERSION`
- `changed_files.txt`
- `project_state.json`
- `01_current_state.md`
- `07_release_log.md`
- `08_next_steps.md`
- `10_package_manifest.md`
- `20_doc_sync_checklist.md`
- `23_package_lineage.md`
- `24_validation_matrix.md`
- `29_doc_conflict_map.md`（若有冲突）
- `30_handoff_self_check.md`
