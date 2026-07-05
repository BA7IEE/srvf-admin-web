# 18 回滚与恢复

## 一、本轮回滚

本轮是 P0 code patch。若需要回滚本轮代码补丁，可回到 `srvf-admin-web_v7.0.0-docs.1_handoff_full_20260705.zip`，或仅恢复以下文件变更：

1. `src/router/utils.ts` 恢复到 `srvf-admin-web_v7.0.0-docs.1_handoff_full_20260705.zip` 中的版本。
2. `src/api/routes.ts` 从 `srvf-admin-web_v7.0.0-docs.1_handoff_full_20260705.zip` 中恢复。

但如果回滚代码，必须在 `29_doc_conflict_map.md` 中重新标记 `/get-async-routes` 风险为未修复。

## 二、代码回滚基准

- 当前最高可信代码包：`srvf-admin-web_v7.8.0_scoped-authz-browser-smoke_full_20260703.zip`，但本轮未持有该文件，需用户提供或通过 git 血缘确认。
- 本轮 P0 补丁前基准：`srvf-admin-web_v7.0.0-docs.1_handoff_full_20260705.zip`。
- 当前原始上传工作基准：`srvf-admin-web_git-main_c2001c9_20260705.zip`，只做静态分析，不代表测试通过。

## 三、P0 修复失败恢复

如果本地验证发现登录 / 刷新异常：

1. 先检查 Network 是否仍有 `/get-async-routes`，若有，确认部署是否使用了旧包。
2. 检查 `src/router/utils.ts:initRouter()` 是否仍为 `handleAsyncRoutes([])`。
3. 若是菜单为空，检查登录态 `roles` 是否与静态路由 `meta.roles` 匹配。
4. 必要时回滚 `src/router/utils.ts`，但不要启用 `asyncRoutes` 或补 `getMenuList`。
5. 若登录主链受影响，优先回到用户最后确认代码包。
