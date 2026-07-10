# 01 当前项目状态

## 一、版本与代码状态

| 项                | 当前值                                                                           |
| ----------------- | -------------------------------------------------------------------------------- |
| 当前 Git HEAD     | `2cca7a3` (`refactor(srvf): 十九个列表页统一迁移到列表外壳 (#93)`)               |
| 当前分支          | `main`，与 `origin/main` 对齐                                                    |
| 当前 handoff 版本 | `git-main-2cca7a3-handoff-20260710`                                              |
| 旧 handoff 基线   | `git-main-1aba0da-handoff-20260710`（2026-07-10 上一次）                         |
| 主线增量          | `1aba0da..2cca7a3`，#81~#93（UX 产品化系列），106 文件，+5854/-3691              |
| 当前验证状态      | BUILD_PASS + 逐 PR 浏览器/dev 后端冒烟（:8849 + live :3000,见 17_test_evidence） |
| 未跟踪目录        | `.agents/`、`.codex/`，本次保留未动                                              |

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
- #81 产品化升级蓝图 `docs/srvf-admin-ux-upgrade-blueprint.md`（三层病根/大厂方法论八条/六任务走查/IA v3/流程四件套/术语系统/U0~U4 路线,现行体验路线单一来源）。
- #82~#87 U0~U4 主体:止血三修、术语人话化+PageIntro 全覆盖、IA v3（一级菜单 10 组→7 组+「队务设置」设置中心+工作台快捷发起/最近访问）、流程步骤条（活动生命周期/考勤审批）+队员档案页签重排、招新总览两道门漏斗、使用手册页。
- #88~#89 人工放行专项:登录框 demo 预填清除（auth 文件,ask 闸）;铃铛假消息改真实待办入口（layout 文件,dashboard-summary 角标）。
- #90 授权向导:选人→选场景→预演确认三步,三场景（任命/考勤终审权/业务角色）均经后端 preview 或既有 user-roles 通道,三入口（队员档案/系统账号/组织架构）。
- #91 工作台启用进度卡（五类基础数据探测+直达设置中心）+ 三张规则表单 15 处字段提示。
- #92 harness 调整:src/layout/\*\* 编辑闸 deny→ask（逐次人工确认,非放开）。
- #93 一致性收敛主体:19 个列表页迁移到 SrvfListPage（kit 采用率 20/29,hook 未动）,外壳新增 #banner 槽位;6 个结构不适配页明确豁免（微信模板/字典/组织架构/归属体检/工作台/附件配置）。

## 三、验证结果

| 验证项                                                | 结果       | 说明                                                                                                                        |
| ----------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `./node_modules/.bin/vue-tsc --noEmit --skipLibCheck` | PASS       | 2026-07-10 本地直接执行通过                                                                                                 |
| `./node_modules/.bin/vite build`                      | PASS       | 2026-07-10 本地直接执行通过                                                                                                 |
| `pnpm typecheck`                                      | BLOCKED    | pnpm 先触发依赖状态检查并尝试 `install`，无 TTY 下中止；未进入 typecheck                                                    |
| `python3 scripts/check_handoff_docs.py --root .`      | FAIL_NOISY | 脚本递归扫 `.git`、`node_modules`、`.claude/worktrees/**/node_modules`，被依赖 README 示例私钥误伤                          |
| 浏览器/dev 后端冒烟                                   | PASS       | #82~#93 每个 PR 合并前均在 :8849 + live :3000 实测（登录/菜单/设置中心/向导三场景/漏斗/迁移页行操作等,见 17_test_evidence） |

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
