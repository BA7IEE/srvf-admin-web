# tests/render — 本地渲染回归冒烟

## simple_review_clone_render_pass.py / simple_review_pending_render_pass.py — 已发送请求保留回归

依据真实 Chromium opener 复制 sessionStorage 的新复现，修正旧测试中“首次确定失败可清空并换键”的期望。页面内 busy 不能排除复制页已发出的同键请求；首次 20255/20256 与恢复失败均保留原键原体。当前失败不等于所有发送终结，也不永久取消键。401/403/404 和一般 GET 不证明原请求未落库；20143 保留记录并停止重发。只有关联原请求的成功回执允许归档。

```bash
PYTHONDONTWRITEBYTECODE=1 RP_BASE=http://127.0.0.1:8848 uv run --offline --with playwright python tests/render/simple_review_clone_render_pass.py
PYTHONDONTWRITEBYTECODE=1 RP_BASE=http://127.0.0.1:8848 uv run --offline --with playwright python tests/render/simple_review_pending_render_pass.py
```

复制页测试不手动种恢复记录：A 首次请求在途时用 window.open 实际复制到 B；B 发同体恢复，A 首次 20256 后保留记录，重载也不能换键；B 原请求随后成功，A 仅原样重放取得同一回执，最终一条合成审核。旧候选在同一安全断言失败，新候选通过，红绿日志在独立交付包保留。

第二组覆盖首次 20255/20256、刷新/重载、401（含既有认证刷新失败后的整页重开/重新登录）、403/404、20143、无关活动的 200 回执、发送前校验/读取/存储失败不制造未知记录，以及正常提交的原请求回执归档。所有 API 都被拦截；不是后端真实联调，也不是跨设备恢复系统。

可用性代价：当前页不能证明所有副本/迟到发送已经结束，所以单页明确失败也可能保守保留，不能立即改稿或另建提审；20255 原版本可能持续不可提交，需要人工协助核对。未添加永久取消、自动解锁、清除未知记录或重绑新 hash 的入口。认证刷新失败保留既有框架行为，不修改认证文件；本测试验证整页重新登录后仍恢复原意图。

## simple_review_version_render_pass.py — 确认版本候选回归

依据 `tests/fixtures/simple-review.candidate-contract.md` 的未提交后端候选；所有 API 均由合成夹具拦截，没有真实联调。

```bash
node --test tests/simple_review_version.test.mjs tests/simple_activity_review.test.mjs tests/simple_activity_state.test.mjs
PYTHONDONTWRITEBYTECODE=1 RP_BASE=http://127.0.0.1:8848 uv run --offline --with playwright python tests/render/simple_review_version_render_pass.py
```

先在旧实现上实测红灯：最后一次 GET 之后发生保存，旧两字段 POST 会创建未确认事实的 review。Node 红灯分别覆盖 20255/20256 分类、无效指纹、三字段恢复。升级后覆盖同一竞态、确定首次失败仍保留原体、保存最终事实、专业配置拒绝、未知恢复失败仍保留原体、已归档成功后退回的新意图、旧记录只读、旧后端 400 不降级、错误活动/非法指纹、读取期间编辑与导航互锁、取消重开及 390px 窄屏。

新请求在用户确认后绑定 `draftHash`，最后一次读回若发现变化则重新确认（此时尚未发送）；GET 与 POST 间的后续竞态由候选后端锁内检查拒绝。已发送请求永不从轮询结果替换原 hash。当前页面不能证明关闭标签页、超时或其他发送已终结，因此首次或恢复得到 20255/20256 后都保留未知状态，不提供“已取消”或自动新意图。旧两字段未知请求保留原体、仅做读取；有明确回执时可只读恢复。已知回执按当前标签页的账号/活动/原操作键保留最小关联，不保存 snapshot。

## simple_review_render_pass.py — 草稿发布提审夹具验证

在已登录的本人草稿详情中验证提审，不接入审核员决策。全部 `/api` 请求均由合成夹具拦截，不能作为真实后端联调证据。

```bash
PYTHONDONTWRITEBYTECODE=1 RP_BASE=http://127.0.0.1:8848 uv run --offline --with playwright python tests/render/simple_review_render_pass.py
node --experimental-strip-types --test tests/simple_activity_review.test.mjs tests/simple_activity_state.test.mjs
```

覆盖编辑未完成时禁止提审、读取失败恢复、取消重开、明确勾选确认、保存内容变化后重新核对、过期截止时间、双击、待审仍为草稿、明确拒绝、响应丢失／刷新后的同键恢复、恢复时撤权保留记录、已收到回执后的 GET-only 恢复、历史退回请求重放、已有待审／操作键冲突、浏览器存储失败和账号切换后的迟到响应。此脚本使用后端允许的场次窗口和单主地点；旧活动显示夹具的额外地点、窗口不作为有效后端实例证明。

此脚本现按带版本的候选合同验证；历史 `15421e9c` live 证据仍原样保留。接口为本人正式成员登录准入，不应套用审核员的 `activity.publish.record` 码；资格、政策及专业白名单仍由服务端复核。GET 成功和 editable=true 不保证专业配置通过，页面也不声称用户已阅读完整审核快照。

恢复记录仅在当前账号／活动／站点的 sessionStorage 中保存原操作键、确认版本、明确确认及最小回执，不保存 proposal snapshot。未知结果没有自动重发；用户继续核对时复用原三字段，不提交当前新版本。收到回执后刷新失败只读恢复。关闭标签页或清除浏览器数据的恢复缺口在页面提示，跨设备找回不在本轮。

## simple_activity_render_pass.py — 单场次草稿交互夹具验证

此脚本只需本工作树的 `pnpm dev`。它在浏览器网络层拦截全部 `/api/` 请求，登录、组织选项、模板与活动均为明确的测试夹具；不启动后端、不接触真实数据库，也不构成真实联调证明。夹具依据 `tests/fixtures/simple-activity.live.openapi.json`，来源和摘要见同目录 README。

```bash
RP_BASE=http://127.0.0.1:8848 uv run --offline --with playwright python tests/render/simple_activity_render_pass.py
```

使用当前 dev 实际端口；脚本默认 `/usr/bin/chromium`。`RP_SHOT_DIR` 可指定截图目录。

覆盖必填与北京时间同日校验、组织资格失败／空列表、模板加载失败／空列表／分页、双击防重复、创建丢失响应后的同键同体恢复、GET 覆盖历史创建回执、普通 USER 不依赖旧列表与详情、完整保存保留其他用途地点、取消重开、并发指纹冲突、保存响应丢失后匹配／不匹配读回、权限失败保留输入、待审核仍为草稿且只读、本机找回／404 重试／账号隔离、移除本机引用及切换账号后隐藏迟到响应。

其余两个历史脚本依赖真实后端，前置条件如下。

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
