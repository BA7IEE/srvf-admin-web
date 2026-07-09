# 18 回滚与恢复

## 一、本次 handoff 回滚

本次只更新交接文档和机器可读状态。若需要回滚本次交接刷新，仅恢复以下文件到修改前即可：

- `README.md`
- `USAGE.md`
- `VERSION`
- `changed_files.txt`
- `project_state.json`
- `project_state.example.json`
- `docs/handoff/**` 中本次修改的状态类文件

不涉及 `src/**`、依赖、`.env*` 或部署配置。

## 二、代码回滚基准

- 当前代码基准：Git `main@1aba0da`。
- 旧 handoff 基准：`c2001c9` / `7.1.0-p1.meta-workbench`，只作历史参考。
- 若某个 #34~#80 功能需要回退，应优先用 Git 单独 revert 对应 PR/commit，不要回退到 2026-07-05 zip 包。

## 三、故障恢复建议

| 故障             | 首查                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| 登录后菜单异常   | 确认未恢复 `/get-async-routes`，检查静态路由 `meta.roles/auths`                         |
| token 刷新异常   | 查 #51 涉及的 `src/utils/http/index.ts`、`src/store/modules/user.ts`、`src/api/user.ts` |
| 字典主从异常     | 查 #71/#72 的 `src/views/srvf/base-data/dictionaries/**`                                |
| 组织人事页面异常 | 查 #37~#42、#55~#60 对应 API 与 view                                                    |
| handoff 自检失败 | 先确认是否仍在误扫 `.git`/`node_modules`，不要误判为密钥泄露                            |
