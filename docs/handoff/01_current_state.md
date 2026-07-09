# 01 当前项目状态

## 一、版本与代码状态

| 项                | 当前值                                                      |
| ----------------- | ----------------------------------------------------------- |
| 当前 Git HEAD     | `1aba0da` (`feat(layout): navbar 挂全局实体搜索入口 (#80)`) |
| 当前分支          | `main`，与 `origin/main` 对齐                               |
| 当前 handoff 版本 | `git-main-1aba0da-handoff-20260710`                         |
| 旧 handoff 基线   | `7.1.0-p1.meta-workbench` / `c2001c9` / 2026-07-05          |
| 主线增量          | `c2001c9..1aba0da`，#34~#80，256 文件，+21957/-6030         |
| 当前验证状态      | BUILD_PASS（直接 `vue-tsc` + `vite build` 通过）            |
| 未跟踪目录        | `.agents/`、`.codex/`，本次保留未动                         |

## 二、当前阶段

前端已经明显越过旧 handoff 的 `P1.2 memberships-read` 起点：

- #35 重估 v0.37 蓝图并刷新过时文档。
- #36 完成 Phase 0-a 行为校准。
- #37~#42 完成组织人事支柱：会籍、职务、任职、角色绑定、督导、权限诊断。
- #43~#45 完成 Phase 2：招新补件、公告导入、通用附件库。
- #46~#49 完成 Phase 3：品牌 tokens、工作台设计稿升级、考勤选人 UX、打印。
- #50 归档 starter 遗留 views / system demo URL / mock。
- #51 完成 auth 专线：40100 被动刷新重试 + logout 真实撤销端点。
- #52~#60 完成 RBAC 治理面、组织人事收尾、审计日志详情、真实缺陷修复。
- #61~#67 完成体验层 A~D 和用户搜索/按用户下钻授权。
- #68~#70 完成队员账号闭环与账号 tab 增强。
- #71~#72 完成字典主从布局和层级视觉。
- #73~#80 开始收敛 srvf-kit 原语层，并接入全局实体搜索入口。

## 三、验证结果

| 验证项                                                | 结果       | 说明                                                                                               |
| ----------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `./node_modules/.bin/vue-tsc --noEmit --skipLibCheck` | PASS       | 2026-07-10 本地直接执行通过                                                                        |
| `./node_modules/.bin/vite build`                      | PASS       | 2026-07-10 本地直接执行通过                                                                        |
| `pnpm typecheck`                                      | BLOCKED    | pnpm 先触发依赖状态检查并尝试 `install`，无 TTY 下中止；未进入 typecheck                           |
| `python3 scripts/check_handoff_docs.py --root .`      | FAIL_NOISY | 脚本递归扫 `.git`、`node_modules`、`.claude/worktrees/**/node_modules`，被依赖 README 示例私钥误伤 |
| 浏览器/dev 后端冒烟                                   | NOT_RUN    | 本次只续写交接文档，未启动 dev server                                                              |

## 四、后端权威状态

- 后端仓库：`../srvf-nest-api`
- 当前前端文档仍以后端 v0.37.0、232 paths / 320 operations / 195 权限码为已知基准。
- 字段级事实必须重新看 live `http://localhost:3000/api/docs-json`。
- 轴模型、任务归位、缺口台账看 `../srvf-nest-api/docs/handoff/admin-web.md`。

## 五、当前禁止项

- 不恢复 `/get-async-routes`。
- 不启用 `src/router/asyncRoutes.ts`。
- 不新增 `getMenuList`。
- 不从 pure-admin mock / demo / tenant 反推 SRVF 后端契约。
- 不改依赖、`.env*`、私有仓库属性。
- Auth 文件虽已是 active code，但任何新改动仍必须声明文件、内容和影响面。

## 六、下一步建议

1. 先做浏览器/dev 后端冒烟，覆盖 #34~#80 的关键入口。
2. 修复 handoff 自检脚本的扫描排除规则，让 strict 自检不再被依赖目录误伤。
3. 若继续开发，基于当前主线重新定小切片；不要沿用旧 `P1.2 memberships-read` 任务。
