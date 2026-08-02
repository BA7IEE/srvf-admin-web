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
- 登录用仓库 dev 默认账号（`admin` / `ChangeMe123456`，见后端仓 docs §8；
  历史接线记录已归档于 `docs/archive/srvf-api-integration-guide.md`）。
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

## nav_transition_render_pass.py — 站内跳转白屏回归

### 它防的 bug

`src/layout/components/lay-content/index.vue` 把 router-view 套在
`<Transition mode="out-in" appear>` 里。Vue 的 CSS 过渡靠 `nextFrame()`（**双
`requestAnimationFrame`**）补 `*-enter-to` / `*-leave-to` 并收尾，而浏览器在**页面不可见**
（后台标签页 / 自动化浏览器；本仓的 in-app Browser pane 是**恒定隐藏**）时挂起 rAF →
enter/leave 的 `done` 永不触发。`mode:"out-in"` 又要等离场结束才挂载新页面，于是：

- 站内 `router.push`（如队员列表点「档案」进作战室）→ **新页面根本不挂载**，DOM 里只剩上
  一页且被 `fade-transform-enter-from / -leave-from / -leave-active` 压成 `opacity:0`；
  一旦卡住，之后每一次跳转都卡住；
- 整页重载「看着像好了」——重载没有离场元素，组件确实挂上了，但 appear 同样卡住 →
  **DOM 探针全绿而实际 `opacity:0`**。这正是历史上被记成「截图发白幽灵」的真凶。

修复：`transitionMain.render()` 在 `document.hidden` 时直接返回 slot，不套 `<Transition>`。
⚠️ 只把 `css` 关掉**不够**——`css:false` + `mode:"out-in"` 会让 Vue 在 patch 中途重入
`update()`，抛 `Cannot read properties of null (reading 'nextSibling' / 'subTree')`。

### 它断言什么

| 用例 | 场景                             | 断言                                          |
| ---- | -------------------------------- | --------------------------------------------- |
| A    | 可见态点「档案」进队员作战室     | 渲染出 tab + 可见 pane，且过渡 class 收尾干净 |
| B    | **隐藏态**点「档案」（核心用例） | 渲染出 tab + 可见 pane                        |
| C    | 隐藏态整页加载作战室 URL         | 渲染出 tab + 可见 pane，且 `opacity > 0.9`    |

隐藏态必须**同时**伪造 `document.hidden` / `visibilityState` **和**把
`requestAnimationFrame` 打成空实现——只做其中一样都复现不出来。

「牙齿」已验：修复前 B/C FAIL、A PASS；修复后 ALL PASS。

### 前置 / 运行

前置同上（dev server + 后端 + 至少一条队员数据）。

```bash
uv run --with playwright python tests/render/nav_transition_render_pass.py
```

环境变量：`RP_BASE` / `RP_USER` / `RP_PWD` 同上；另有 `RP_HEADED=1` 显形跑（排查用）。
本机没下过 playwright 自带 chromium 时脚本会自动退回系统 Chrome。
