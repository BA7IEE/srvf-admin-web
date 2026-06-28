# tests/render — 本地渲染回归冒烟

> 本地冒烟工具，**不是 CI 门禁**。依赖本地已起的 dev server + 后端 + seed 数据。

## tabs_render_pass.py — el-tabs 默认 tab 内容区渲染回归

### 它防的 bug

Element Plus `<el-tabs>` 在**没有 `v-model` / `default-value`** 时，内部
`currentName` 默认取 `"0"`（见 `element-plus/.../tabs/src/tabs.mjs`）。本仓所有
`<el-tab-pane>` 都带具名 `name`（`"storage"` / `"type"` / `"certificates"`…），`"0"`
与任何具名 pane 都不匹配 → 每个 pane 被 `v-show` 置 `display:none` → **首屏只剩 tab
头、内容区空白，必须手点一下 tab 才显示**。

修复：每个 `<el-tabs>` 显式 `v-model="activeTab"`，且把 `activeTab` 初始化为第一个
「可见 / 有权限」的 pane（pane 由 `v-if=canRead*` 决定渲染时）。

### 它断言什么（不点任何 tab）

逐页（系统设置 / 附件配置 / 队员·招新·入队三个作战室）断言：

1. `.el-tabs__content` 内至少 **1 个「可见」`.el-tab-pane`** —— 反 bug 核心
   （bug 态 `visible_panes=0`；修复态 `>=1`）；
2. 该可见 pane 内部有**可见的表格 / 表单** —— 内容区真渲染（不是只看 tab 头）；
3. 能取到不与 tab 头冲突的文本时，断言**关键文本可见**（如「Bucket」「队员证书」）。

只看 tab 头不会触发 (2)(3)，所以本用例对该 bug 有「牙齿」：在修复前（`visible_panes=0`）
全部 FAIL，修复后全部 PASS。

### 前置

- 前端 dev server 已起：`pnpm dev`（默认 `:8848`）。
- 后端已起并跑过 seed：`:3000`。
- 登录用仓库 dev 默认账号（`admin` / `ChangeMe123456`，见
  `docs/srvf-api-integration-guide.md` §8）。
- 三个作战室用例需库里至少各有一条 队员 / 招新轮次 / 入队轮次（脚本经 API 自动取
  第一条 id；取不到则该用例标 `SKIP`）。

### 运行

不进 `package.json`（仓库禁止新增 JS 依赖）；用 [`uv`](https://docs.astral.sh/uv/)
跑临时 Playwright 环境（chromium 复用本机 `ms-playwright` 缓存）：

```bash
uv run --with playwright python tests/render/tabs_render_pass.py
```

退出码 `0` = 全通过，`1` = 有 FAIL。

### 环境变量

| 变量          | 默认                    | 说明                       |
| ------------- | ----------------------- | -------------------------- |
| `RP_BASE`     | `http://localhost:8848` | 前端地址                   |
| `RP_API`      | `http://localhost:3000` | 后端地址                   |
| `RP_USER`     | `admin`                 | 登录账号                   |
| `RP_PWD`      | `ChangeMe123456`        | 登录口令                   |
| `RP_SHOT_DIR` | （未设则不截图）        | 设为目录则每页落一张全屏图 |

### 验证「牙齿」（可选）

对照「修复前 vs 修复后」两个 dev server（不同端口）跑同一脚本，应分别 5 FAIL / ALL
PASS：

```bash
RP_BASE=http://localhost:8848 uv run --with playwright python tests/render/tabs_render_pass.py  # 修复前 → 5 FAILED
RP_BASE=http://localhost:8849 uv run --with playwright python tests/render/tabs_render_pass.py  # 修复后 → ALL PASS
```
