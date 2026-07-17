# 14 · 完整版参考索引 · vue-pure-admin 演示页 / 组件 / 能力范式 可检索全量枚举

> 本文是本地 **vue-pure-admin 完整版**（开源 60+ 演示页）的 **可检索全量索引**。
> `07-max-ts-modules.md` §12 只给「最值得参考的清单」（curated shortlist）；本文给 **完整枚举**（complete enumeration），用于「先查范式、再动手」。
> 用法铁律见 §0；只读参考库的硬规则见 `CLAUDE.md` §9 与 `07-max-ts-modules.md` §12.4。

## 本文适用任务

- 准备做**任意**业务列表 / 表单 / 树 / 详情 / 弹窗 / 上传 / 图表 / 编辑器页面前，**先来这里按能力检索**，找到完整版里最接近的范式路径，再去读那一两个文件。
- 评估「某个交互到底完整版有没有现成范式」——本文是**全量**枚举，查不到≈完整版也没有。
- 评估「抄这个页面会不会引入新依赖 / 触红线」——见 §4 重依赖清单 + §5 红线复述。

## 必须先读

- `CLAUDE.md` §9（完整版只读参考规则：只抄交互、不抄字段/接口/RBAC/租户/动态路由）
- `07-max-ts-modules.md` §12.1 使用流程铁律 + §12.4 Full Version Reference Strategy
- `02-ai-rules.md` §13.3 通用硬规则（第 1 条：新页面前必先扫完整版 + 本仓范式）
- 后端能力图 `../srvf-nest-api/docs/handoff/admin-web.md`（**按任务设计页面，不是按资源**；本索引只解决「UI 长什么样」，不解决「这个页该不该做 / 字段是什么」）

## 禁止事项

- ⛔ 禁止 `cp -R` / 整段复制完整版任何文件；必须**手敲重写**并替换 API / 字段 / 角色 / 权限码（`07` §12.4.2）。
- ⛔ 禁止把完整版 `src/api/*` / `mock/*` 当后端契约（红线 1~4；字段真相 = 后端 live `/api/docs-json`）。
- ⛔ 禁止照搬 `system/*`（user/role/menu/dept）的 RBAC 模型、`MenuData` 字段、租户/部门层级假设（红线 2/3/4、裁决 2）。
- ⛔ 禁止「因为完整版有这个演示页 → 我们也要做这个业务页」——业务需求由产品/后端定，不由模板菜单定。
- ⛔ 禁止为抄某页**自行加依赖**（完整版重型库很多，见 §4）；加依赖走 `02-ai-rules.md` §13.2.1（人类执行 `pnpm add`）+ §13.2.2（单独 PR）。
- ⛔ iframe 外链演示页（画板 / 思维导图 / PPT / 表单设计器）**不是本地代码**，只可作交互参考，不可作业务依据。

## 相关关键文件路径

- 完整版根：`<refs-root>/vue-pure-admin`（占位符见 `docs/external-refs.md`）
- 演示页：`<完整版>/src/views/**`（本文 §1 / §2 枚举）
- 组件：`<完整版>/src/components/Re*/`（本文 §3 枚举）
- 路由意图来源：`<完整版>/src/router/modules/*.ts` + `<完整版>/locales/zh-CN.yaml`
- 本仓已有底座组件：`src/components/`（见 §3 对照列）

---

## §0 怎么用这份索引（每次做新页面的检索动作）

```
做一个新业务页：
  ① 在本文 §1「能力速查」按【中文关键词 / 你想做的事】定位 → 拿到完整版路径。
     （或直接 grep 本文，例如搜 "树"、"上传"、"导出"、"裁剪"、"步骤"、"抽屉"、"图表"。）
  ② 在本文 §2 看该模块的完整子页清单，挑最接近的那一个。
  ③ 去读完整版那 1~2 个文件：只看「模板拆分 / 列定义 / 表单字段顺序 / 交互开关」。
  ④ 回本仓手敲重写：
       - API 换成 src/api/srvf-*.ts（对后端 /api/docs-json）；
       - 字段/枚举/状态换成后端类型，缺则标 placeholder 并 STOP（红线 1~4）；
       - 权限码换成后端真实 RBAC code，用 hasPerms("<code>") / <Perms> 网关；
       - 组件优先用本仓已有 Re*（§3 对照列），不要引完整版独有组件除非单独 PR。
  ⑤ 涉及重依赖（§4）→ 先停，走人类单独 PR 加依赖，别自行 pnpm add。
  ⑥ 本仓已有更近的范式（队员页三件套 / dict / tenant/list / schedule）就优先用本仓的，
     完整版只补「本仓没有的交互」。
```

> 一句话：**完整版回答「这个交互长什么样、在哪」；它永远不回答「这个页该不该做、字段是什么、权限码叫什么」。** 后两者只认后端能力图 + `/api/docs-json`。

---

## §1 能力速查（意图 → 完整版路径）· 主检索面

> 路径均相对 `<完整版>/src/views/`。「✅本仓已有更近范式」列指出本仓是否已有可优先复用的实现。

### 1.1 列表 / 表格（CRUD 起步最常用）

| 我想做的事                                                            | 完整版路径                                   | 中文         | ✅本仓已有更近范式                       |
| --------------------------------------------------------------------- | -------------------------------------------- | ------------ | ---------------------------------------- |
| 基础表格（边框/斑马/固定列/合并/树形/多选/展开…22 例）                | `table/base/*`                               | 基础用法     | 队员页三件套 + `@pureadmin/table`        |
| 高级表格（拖拽行列 / 自适应 / 右键菜单 / 分页 / 水印 / 表内 ECharts） | `table/high/*`                               | 高级用法     | 部分（拖拽/Excel 需依赖，见 §4）         |
| 表内导出 Excel                                                        | `table/high/excel/index.vue`                 | 导出Excel    | ⛔需 `xlsx`（§4）                        |
| 表内打印                                                              | `table/high/prints/index.vue`                | 打印         | —                                        |
| 可编辑单元格表格（3 种范式）                                          | `table/edit/demo1~3/index.vue`               | 可编辑用法   | —                                        |
| 虚拟滚动大数据表格                                                    | `table/virtual/{list,pageList,treeList}.vue` | 虚拟滚动     | ⛔需 `vxe-table` + `ReVxeTableBar`（§4） |
| 表格工具条（列控制/刷新/密度）                                        | 组件 `RePureTableBar`                        | —            | ✅ `src/components/RePureTableBar`       |
| 卡片式列表 + 列表内弹窗表单                                           | `list/card/{index,components/*}.vue`         | 卡片列表页   | —                                        |
| 表格无限滚动                                                          | `able/infinite-scroll`（router）             | 表格无限滚动 | —                                        |

### 1.2 表单 / 录入

| 我想做的事                   | 完整版路径                                                         | 中文            | 备注                                          |
| ---------------------------- | ------------------------------------------------------------------ | --------------- | --------------------------------------------- |
| Schema 配置式表单（基础）    | `schema-form/form/base.vue`                                        | 表单            | 复用 `@pureadmin/components` 的 PlusForm 思路 |
| Schema 表单 - 搜索栏形态     | `schema-form/form/search.vue`                                      | —               | 列表页顶部搜索范式                            |
| Schema 表单 - 对话框内       | `schema-form/form/dialog.vue`                                      | —               | 配 `ReDialog` 函数式                          |
| Schema 表单 - 抽屉内         | `schema-form/form/drawer.vue`                                      | —               | 配 `ReDrawer`（§3）                           |
| Schema 表单 - 向导步骤       | `schema-form/form/steps.vue`                                       | —               | 多步骤提交                                    |
| 可视化表单设计器             | `form-design`（iframe 外链）                                       | 表单设计器      | ⚠️ iframe，无本地代码                         |
| 日期 / 日期时间 / 时间选择器 | `components/date-picker`·`datetime-picker`·`time-picker`（单文件） | 日期/时间选择器 | Element Plus 原生封装范式                     |
| 区域级联选择器               | `components/cascader`（router）                                    | 区域级联选择器  | —                                             |
| 颜色选择器 / 面板            | `components/color-picker`·`color-picker-panel`                     | 颜色选择器      | —                                             |
| 滑块                         | `components/slider/*`                                              | 滑块            | —                                             |
| 多选卡片                     | `components/check-card`                                            | 多选卡片        | —                                             |
| 图标选择器                   | `components/icon-select`                                           | 图标选择器      | ✅ `ReIcon` 内含 IconSelect                   |
| 表单校验范式                 | `login/utils/rule.ts`                                              | —               | ✅ 本仓 login/dict/tenant 均有                |

### 1.3 树 / 组织架构

| 我想做的事                     | 完整版路径                             | 中文       | 红线提醒                                |
| ------------------------------ | -------------------------------------- | ---------- | --------------------------------------- |
| 树形组织 + 详情面板 + 编辑弹窗 | `system/dept/*`                        | 部门管理   | ⛔字段/层级假设不可抄（红线1，裁决8）   |
| 树 + 表单（菜单维护范式）      | `system/menu/{index,form,utils/*}.vue` | 菜单管理   | ⛔`MenuData` 字段不可抄（红线2，裁决2） |
| 一维数组转树                   | 工具 `@/utils/tree.ts:handleTree`      | —          | ✅ 本仓已有                             |
| 菜单树结构演示                 | `able/menu-tree`                       | 菜单树结构 | —                                       |
| 树形连接线（带连线的树）       | `able/line-tree` + 组件 `ReTreeLine`   | 树形连接线 | ⛔需引 `ReTreeLine`（完整版独有，§3）   |
| 表格内树形展示                 | `table/base/tree.vue`                  | —          | `@pureadmin/table` 原生                 |

### 1.4 弹层 / 抽屉 / 反馈

| 我想做的事                       | 完整版路径                                          | 中文       | ✅本仓已有                          |
| -------------------------------- | --------------------------------------------------- | ---------- | ----------------------------------- |
| 函数式弹框（不写 `<el-dialog>`） | `components/dialog/index.vue` + 组件 `ReDialog`     | 函数式弹框 | ✅ `src/components/ReDialog`        |
| 函数式抽屉                       | `components/drawer/index.vue` + 组件 `ReDrawer`     | 函数式抽屉 | ⛔需引 `ReDrawer`（完整版独有，§3） |
| 消息提示范式                     | `components/message`                                | 消息提示   | Element Plus 原生                   |
| 右键菜单                         | `components/contextmenu` / `table/high/contextmenu` | 右键菜单   | —                                   |
| 结果页（成功/失败）              | `result/{success,fail}`                             | 结果页面   | —                                   |
| 异常页（403/404/500）            | `error/{403,404,500}`                               | 异常页面   | ✅ 本仓 `src/views/error`           |

### 1.5 导航 / 标签 / 多级菜单

| 我想做的事                         | 完整版路径                        | 中文             | 备注                       |
| ---------------------------------- | --------------------------------- | ---------------- | -------------------------- |
| 多标签页编程操作（增删/刷新/定位） | `tabs/*`                          | 标签页操作       | ✅ 本仓 layout 自带多标签  |
| 多级嵌套菜单范式                   | `nested/menu1/**`、`nested/menu2` | 多级菜单         | 仅看路由 children 写法     |
| 菜单/目录超长 Tooltip              | `menuoverflow/index.vue`          | 目录超出 Tooltip | —                          |
| 新手引导页                         | `guide/index.vue`                 | 引导页           | ⛔通常需 `driver.js`（§4） |

### 1.6 上传 / 媒体 / 图像

| 我想做的事                  | 完整版路径                                                                      | 中文            | 红线/依赖                              |
| --------------------------- | ------------------------------------------------------------------------------- | --------------- | -------------------------------------- |
| 文件上传 + 拖拽             | `components/upload/*`                                                           | 文件上传        | ⛔后端附件 schema 不可抄；通常需上传库 |
| 图片裁剪（头像）            | `account-settings/components/Profile.vue` + 组件 `ReCropper`/`ReCropperPreview` | 图片裁剪        | ⛔需 `cropperjs`（§4）                 |
| 瀑布流无限滚动              | `components/waterfall`                                                          | 瀑布流无限滚动  | —                                      |
| 地图                        | `able/map` + 组件 `ReMap`                                                       | 地图            | ⛔需高德 AMap key + 依赖（§4）         |
| 视频播放 / 视频帧截取(wasm) | `able/video`·`able/video-frame`                                                 | 视频/视频帧截取 | ⛔需依赖（§4）                         |
| 音频可视化                  | `able/wavesurfer`                                                               | 音频可视化      | ⛔需 `wavesurfer.js`（§4）             |
| 弹幕                        | `able/danmaku`                                                                  | 弹幕            | ⛔需弹幕库（§4）                       |
| 二维码 / 条形码             | `able/qrcode`·`able/barcode` + 组件 `ReQrcode`/`ReBarcode`                      | 二维码/条形码   | ⛔需依赖（§4）                         |
| PDF 预览                    | `able/pdf`                                                                      | PDF预览         | ⛔需 PDF 库（§4）                      |
| 艺术画板                    | `board`（iframe 外链）                                                          | 艺术画板        | ⚠️ iframe                              |

### 1.7 富文本 / 代码 / 文档编辑器

| 我想做的事      | 完整版路径                      | 中文         | 依赖                      |
| --------------- | ------------------------------- | ------------ | ------------------------- |
| 富文本编辑器    | `editor/index.vue`              | 编辑器       | ⛔通常需 WangEditor（§4） |
| Markdown 编辑器 | `markdown/index.vue`            | Markdown     | ⛔通常需 Vditor（§4）     |
| 代码编辑器      | `codemirror/index.vue`          | 代码编辑器   | ⛔需 CodeMirror（§4）     |
| JSON 编辑器     | `components/json-editor`        | JSON编辑器   | ⛔需 JSON 编辑库（§4）    |
| 思维导图 / PPT  | `mind-map`·`ppt`（iframe 外链） | 思维导图/PPT | ⚠️ iframe                 |

### 1.8 图表 / 数据可视化 / 统计

| 我想做的事                          | 完整版路径                                          | 中文     | 依赖                                               |
| ----------------------------------- | --------------------------------------------------- | -------- | -------------------------------------------------- |
| 首页看板（折线/柱状/环形 + 数据卡） | `welcome/components/charts/*` + `welcome/index.vue` | 首页     | ECharts 已引入（`main.ts` 默认注释，见 `07` §9.7） |
| 表格内嵌 ECharts                    | `table/high/echarts/index.vue`                      | —        | 同上                                               |
| 统计数值组件                        | `components/statistic`                              | 统计组件 | —                                                  |
| 数字动画（滚动计数 / 回弹）         | `components/count-to` + 组件 `ReCountTo`            | 数字动画 | ⛔需引 `ReCountTo`（完整版独有，§3）               |
| 进度条                              | `components/progress`                               | 进度条   | —                                                  |

### 1.9 流程图 / 节点编辑 / 甘特

| 我想做的事           | 完整版路径                                  | 中文     | 依赖                     |
| -------------------- | ------------------------------------------- | -------- | ------------------------ |
| 流程图（拖拽建流程） | `flow-chart/index.vue` + 组件 `ReFlowChart` | 流程图   | ⛔需 LogicFlow（§4）     |
| 节点编辑器           | `vue-flow/{index,layouting}.vue`            | vue-flow | ⛔需 Vue Flow（§4）      |
| 甘特图               | `ganttastic/index.vue`                      | 甘特图   | ⛔需 ganttastic 库（§4） |

### 1.10 权限演示（RBAC）· 高红线区，谨慎

| 我想做的事                   | 完整版路径                    | 中文     | ⛔禁止                                                                 |
| ---------------------------- | ----------------------------- | -------- | ---------------------------------------------------------------------- |
| 页面级权限演示               | `permission/page/index.vue`   | 页面权限 | ✅本仓 `src/views/permission`（⚠️ ask）；演示角色名不可作正式（裁决3） |
| 按钮级权限演示               | `permission/button/index.vue` | 按钮权限 | 同上；正式用后端 RBAC code + `hasPerms`                                |
| 用户管理（含分配角色 UI 流） | `system/user/*`               | 用户管理 | ⛔字段/API/权限码不可抄（红线1/4）                                     |
| 角色管理（含菜单分配 UI 流） | `system/role/*`               | 角色管理 | ⛔RBAC 模型/code 体系不可抄（红线4）                                   |

> 本仓真实 RBAC 走后端 `/api/system/v1/rbac/*` + `hasPerms("<code>")`，业务页见 `src/views/srvf/system/{rbac,users}`。完整版 `system/*` 只看「列表+弹窗+分配」的**交互骨架**。

### 1.11 监控 / 日志 / 账户 / 杂项

| 我想做的事                              | 完整版路径                                             | 中文               | 备注                                                  |
| --------------------------------------- | ------------------------------------------------------ | ------------------ | ----------------------------------------------------- |
| 日志列表 + 详情抽屉                     | `monitor/logs/{login,operation,system}/*`              | 登录/操作/系统日志 | ⛔日志字段不可抄；本仓审计见 `srvf/system/audit-logs` |
| 在线用户                                | `monitor/online/index.vue`                             | 在线用户           | —                                                     |
| 账户设置（资料/安全日志/偏好/账号管理） | `account-settings/*`                                   | 账户设置           | 个人中心范式                                          |
| 文本省略 + Tooltip                      | `components/text` + 组件 `ReText`                      | 文本省略           | ✅ `src/components/ReText`                            |
| 分段控制器                              | `components/segmented` + 组件 `ReSegmented`            | 分段控制器         | ✅ `src/components/ReSegmented`                       |
| 时间线                                  | `components/timeline`                                  | 时间线             | —                                                     |
| 折叠面板 / 标签 / 按钮动效 / 可选按钮   | `components/{collapse,tag,button,check-button}`        | —                  | Element Plus 封装范式                                 |
| Swiper 轮播                             | `components/swiper`                                    | Swiper插件         | ⛔需 `swiper`（§4）                                   |
| 虚拟列表（非表格）                      | `components/virtual-list`                              | 虚拟列表           | —                                                     |
| 无缝滚动                                | `components/seamless-scroll` + 组件 `ReSeamlessScroll` | 无缝滚动           | ⛔需引组件（§3）                                      |
| 切割面板（可拖拽分栏）                  | `components/split-pane` + 组件 `ReSplitPane`           | 切割面板           | ⛔需引组件（§3）                                      |
| 范围/多选择器                           | `components/selector` + 组件 `ReSelector`              | 范围选择器         | ⛔需引组件（§3）                                      |
| animate.css 选择器                      | `components/animatecss` + 组件 `ReAnimateSelector`     | animate.css选择器  | ⛔需引组件（§3）                                      |
| 打字机效果                              | `able/typeit` + 组件 `ReTypeit`                        | 打字机             | ⛔需 `typeit`（§4）                                   |
| 水印                                    | `able/watermark` / `table/high/watermark`              | 水印               | —                                                     |
| 打印 / 下载                             | `able/print`·`able/download`                           | 打印/下载          | —                                                     |
| 防抖/节流/复制/长按指令                 | `able/directives`·`able/debounce`                      | 防抖节流           | —                                                     |
| 波纹 Ripple                             | `components/ripple`（router）                          | 波纹               | —                                                     |
| 图形验证码                              | `able/verify` + 组件 `ReImageVerify`                   | 图形验证码         | ✅ 本仓 login 已用 `ReImageVerify` 思路               |
| 敏感词过滤 / 汉语拼音                   | `able/sensitive`·`able/pinyin`                         | 敏感词/拼音        | ⛔通常需依赖（§4）                                    |
| MQTT 客户端                             | `able/mqtt-client`（router）                           | MQTT客户端         | ⛔需 `mqtt`（§4）                                     |

---

## §2 完整页面枚举（按模块目录全量列出，确保「查不到≈没有」）

> 来源：`<完整版>/src/views/` 全量 `.vue`（208 个文件）+ `src/router/modules/*.ts`。
> 标 🌐 = iframe 外链页（无本地代码，仅交互参考）。标 🧩 = 该页强绑定某完整版独有组件（见 §3）。

### 2.1 `table/` 表格（最大范式库）

- `table/index.vue`（容器，redirect → base）
- **base（22 例）**：`base.vue` `border.vue` `stripe.vue` `radio.vue` `multipleChoice.vue` `customIndex.vue` `expand.vue` `filters.vue` `fixColumn.vue` `fixHeader.vue` `fluidHeight.vue` `groupHeader.vue` `merge.vue` `nestProp.vue` `imgPreview.vue` `layout.vue` `sortable.vue` `status.vue` `totalRow.vue` `tree.vue` `column-template/index.vue` `header-renderer/index.vue`
- **high（高级）**：`adaptive/` `contextmenu/` `drag/column/` `drag/row/` `echarts/` `excel/`(⛔xlsx) `header/` `page/` `prints/` `table-select/{multiple,radio}/` `watermark/`
- **edit（可编辑）**：`edit/demo1~3/index.vue`
- **virtual（虚拟滚动）**🧩：`virtual/{list,pageList,treeList}.vue`（绑 `ReVxeTableBar` + vxe-table，⛔§4）

### 2.2 `components/` 组件演示（最大「单组件用法」库 · ~35 例）

`dialog/`🧩(ReDialog) `drawer/`🧩(ReDrawer) `message` `upload/`(⛔依赖) `check-card` `date-picker` `datetime-picker` `time-picker` `icon-select`🧩(ReIcon) `animatecss`🧩(ReAnimateSelector) `cropping/`🧩(ReCropper) `segmented`🧩(ReSegmented) `text`🧩(ReText) `slider/` `el-button` `check-button` `button` `progress` `tag` `statistic` `collapse` `cascader` `color-picker` `color-picker-panel` `selector`🧩(ReSelector) `waterfall/` `split-pane`🧩(ReSplitPane) `swiper`(⛔swiper) `timeline` `count-to`🧩(ReCountTo) `contextmenu/` `json-editor`(⛔依赖) `seamless-scroll`🧩(ReSeamlessScroll) `virtual-list/`

> 注：`components/ripple`、`components/button` 等部分项在 router 里指向 `components.ts`，源码为 `components/` 下单文件或子目录。

### 2.3 `able/` 实用能力（~26 例）

`mqtt-client`(⛔mqtt) `verify`🧩(ReImageVerify) `watermark` `print` `download` `excel`(⛔xlsx) `debounce` `directives` `draggable` `pdf`(⛔依赖) `barcode`🧩(ReBarcode) `qrcode`🧩(ReQrcode) `map`🧩(ReMap·⛔AMap) `wavesurfer/`(⛔wavesurfer.js) `video` `video-frame`(⛔wasm) `danmaku`(⛔依赖) `infinite-scroll` `menu-tree` `line-tree`🧩(ReTreeLine) `typeit`🧩(ReTypeit·⛔typeit) `sensitive` `pinyin`

### 2.4 `system/` 系统管理（RBAC 演示 · 高红线区）

- `system/user/{index.vue,form/*,utils/*,svg/}` — 用户管理（含分配角色 UI 流）
- `system/role/{index.vue,utils/*}` — 角色管理（含菜单分配 UI 流）
- `system/menu/{index.vue,form.vue,utils/*}` — 菜单管理（树 + 表单；⛔`MenuData`）
- `system/dept/{index.vue,utils/*}` — 部门管理（树形组织）

> ⛔ 这些只看交互骨架。字段、RBAC 模型、菜单数据结构、租户/部门层级一律不可抄（红线 2/3/4、裁决 2/8）。

### 2.5 `monitor/` 系统监控

- `monitor/logs/login/index.vue` · `monitor/logs/operation/index.vue` · `monitor/logs/system/{index.vue,detail.vue}` · `monitor/online/index.vue`

### 2.6 `schema-form/` 配置式表单

- `schema-form/form/{base,search,dialog,drawer,steps}.vue`

### 2.7 `list/` 列表页

- `list/card/{index.vue,components/ListCard.vue,components/ListDialogForm.vue}`

### 2.8 `account-settings/` 账户中心

- `account-settings/{index.vue,components/{Profile,AccountManagement,Preferences,SecurityLog}.vue}`🧩(Profile 用 ReCropper/ReCropperPreview)

### 2.9 `welcome/` 首页看板

- `welcome/{index.vue,components/table/index.vue,components/charts/{ChartBar,ChartLine,ChartRound}.vue}`🧩(ReCol/ReSegmented/ReCountTo/ReNormalCountTo)

### 2.10 编辑器 / 图表 / 流程 类（多为单页 + 重依赖）

- `editor/`（富文本，⛔§4） · `markdown/`（⛔§4） · `codemirror/`（⛔§4）
- `flow-chart/`🧩(ReFlowChart·⛔§4) · `vue-flow/{index,layouting}`（⛔§4） · `ganttastic/`（⛔§4）
- `chatai/`（chat-ai 演示）

### 2.11 导航 / 引导 / 异常 / 杂项

- `tabs/` 标签页操作 · `nested/**` 多级菜单 · `menuoverflow/` 目录超长 Tooltip · `guide/`（⛔driver.js，§4）
- `error/{403,404,500}.vue` · `result/{success,fail}` · `about/` · `empty/`（无 Layout 页）

### 2.12 🌐 iframe 外链演示（router-only，无本地视图代码）

- `board`（艺术画板）· `mind-map`（思维导图）· `ppt`（PPT）· `form-design`（表单设计器）
- 写法参考：`src/router/modules/{board,mind,ppt,formdesign}.ts` 的 `meta.frameSrc` + 本仓 `frame.vue` 机制（`07` §10.12）。⛔ 不可作业务依据。

---

## §3 `Re*` 组件全量目录（26 个）· 本仓对照

> 「位置」列：**✅本仓已有**=`src/components/` 已有同名，直接用；**完整版独有**=本仓没有，引入前须评估（多数绑重依赖，§4）+ 单独 PR。
> 本仓现有 9 个：`ReAuth ReCol ReDialog ReFloatButton ReIcon RePerms RePureTableBar ReSegmented ReText`（其中 `ReFloatButton` 为本仓/starter 独有，完整版无）。

### 3.1 底座组件（✅本仓已有，优先复用，禁改源码—改用 wrapper）

| 组件             | 用途                                          | 主 API                               | 完整版 demo                              |
| ---------------- | --------------------------------------------- | ------------------------------------ | ---------------------------------------- |
| `ReAuth`         | 路由/角色级权限网关                           | `value`(角色数组)                    | 各页                                     |
| `RePerms`        | 功能/权限码级网关                             | `value`(权限码数组)                  | 各页                                     |
| `ReCol`          | 响应式列包装                                  | `value`(默认 24)                     | welcome、system/user form                |
| `ReDialog`       | **函数式弹框**（不写 `<el-dialog>`）          | `addDialog/closeDialog/updateDialog` | components/dialog、system role/user hook |
| `ReIcon`         | 图标（Iconify 离线/在线 + 选择器 + FontIcon） | `useRenderIcon()`                    | 全站                                     |
| `RePureTableBar` | `@pureadmin/table` 工具条（列控制/刷新/密度） | 插槽 + buttons                       | monitor/\*、system/role                  |
| `ReSegmented`    | 分段控制器                                    | `options/modelValue/block/size`      | welcome                                  |
| `ReText`         | 文本省略 + Tooltip                            | `lineClamp/tippyProps`               | account-settings                         |

### 3.2 完整版独有组件（18 个 · 本仓没有，引入须单独 PR + 多数带依赖）

| 组件                | 用途                                             | 绑定 demo 页                            | 依赖(§4)         |
| ------------------- | ------------------------------------------------ | --------------------------------------- | ---------------- |
| `ReDrawer`          | 函数式抽屉                                       | components/drawer                       | 无（纯 Element） |
| `ReCropper`         | 图片裁剪                                         | account-settings/Profile                | ⛔cropperjs      |
| `ReCropperPreview`  | 裁剪预览（头像回显）                             | account-settings/Profile、system/user   | ⛔随 ReCropper   |
| `ReCountTo`         | 数字动画计数（含回弹 NormalCountTo）             | components/count-to、welcome            | 无               |
| `ReFlicker`         | 圆点闪烁动画                                     | welcome、components/timeline            | 无               |
| `ReFlop`            | 时间翻牌器                                       | —（无直接 demo 页）                     | 无               |
| `ReSeamlessScroll`  | 无缝滚动                                         | components/seamless-scroll              | ⛔滚动库         |
| `ReSplitPane`       | 可拖拽切割面板                                   | components/split-pane                   | 无               |
| `ReSelector`        | 范围/多选择器                                    | components/selector                     | 无               |
| `ReAnimateSelector` | animate.css 动画选择器                           | components/animatecss、system/menu/form | 无               |
| `ReTreeLine`        | 树形连接线                                       | able/line-tree                          | 无               |
| `ReText`→见 §3.1    | —                                                | —                                       | —                |
| `ReTypeit`          | 打字机效果                                       | able/typeit                             | ⛔typeit         |
| `ReBarcode`         | 条形码生成                                       | able/barcode                            | ⛔条形码库       |
| `ReQrcode`          | 二维码生成                                       | able/qrcode                             | ⛔二维码库       |
| `ReImageVerify`     | 图形验证码                                       | login                                   | 无（canvas）     |
| `ReMap`             | 高德地图                                         | able/map                                | ⛔AMap + key     |
| `ReFlowChart`       | LogicFlow 流程图（Control/NodePanel/DataDialog） | flow-chart                              | ⛔LogicFlow      |
| `ReVxeTableBar`     | vxe-table 工具条                                 | table/virtual/\*                        | ⛔vxe-table      |

> 注：引入完整版独有组件 = 抄一个**组件**而非一个页面，同样**手敲重写**、不 `cp -R`；若绑重依赖按 §4 处理。

---

## §4 重依赖清单（抄前必看：需人类单独 PR 加依赖）

> ⛔ AI **不得自行** `pnpm add`（`02-ai-rules.md` §13.2.1 / `CLAUDE.md` §4）。下表把「演示页 → 通常依赖的库」对应起来，方便在 PR 描述里向人类提出。
> ⚠️ **库名仅为常识性提示**：抄某页前，让**人类**对照 `<完整版>/package.json` 确认**确切包名与版本**，再由人类执行 `pnpm add`，并走 §13.2.2 单独 PR。本仓**已内置 ECharts**（`main.ts` 默认注释，见 `07` §9.7），用图表通常**无需新增**。

| 演示页 / 组件                                     | 通常依赖（待人类对照 package.json 确认确切包名） |
| ------------------------------------------------- | ------------------------------------------------ |
| `table/high/excel`、`able/excel`                  | Excel 导出库（如 `@vueuse/core` 之外的 `xlsx`）  |
| `table/virtual/*` + `ReVxeTableBar`               | `vxe-table`（虚拟滚动表格）                      |
| `able/pdf`                                        | PDF 预览库                                       |
| `able/barcode` + `ReBarcode`                      | 条形码库                                         |
| `able/qrcode` + `ReQrcode`                        | 二维码库                                         |
| `able/map` + `ReMap`                              | 高德地图 SDK + API key                           |
| `able/wavesurfer`                                 | `wavesurfer.js`                                  |
| `able/video-frame`                                | wasm 视频帧库                                    |
| `able/danmaku`                                    | 弹幕库                                           |
| `able/typeit` + `ReTypeit`                        | `typeit`                                         |
| `able/sensitive` / `able/pinyin`                  | 敏感词 / 拼音库                                  |
| `components/cropping` + `ReCropper`               | `cropperjs`                                      |
| `components/seamless-scroll` + `ReSeamlessScroll` | 无缝滚动库                                       |
| `components/swiper`                               | `swiper`                                         |
| `components/json-editor`                          | JSON 编辑库                                      |
| `editor/`                                         | 富文本（WangEditor）                             |
| `markdown/`                                       | Markdown（Vditor）                               |
| `codemirror/`                                     | CodeMirror                                       |
| `flow-chart/` + `ReFlowChart`                     | LogicFlow（`@logicflow/*`）                      |
| `vue-flow/`                                       | Vue Flow（`@vue-flow/*`）                        |
| `ganttastic/`                                     | 甘特图库                                         |
| `guide/`                                          | 引导库（`driver.js`）                            |

> 无新增依赖即可抄的（纯 Element Plus / 内置能力）：`table/base/*`、`table/edit/*`、`schema-form/form/*`、`list/card/*`、`components/{dialog,drawer,message,*-picker,cascader,collapse,tag,statistic,progress,timeline,split-pane,selector,count-to,segmented,text,virtual-list}`、`able/{print,download,watermark,debounce,directives,draggable,menu-tree,line-tree,verify,infinite-scroll}`、`account-settings/*`、`monitor/*`、`system/*`、`result/*`、`error/*`、`welcome/*`（图表用已内置 ECharts）。

---

## §5 红线复述（检索到范式后，动手前最后一道闸）

抄完整版**任何**东西时，下面四类一律**只看 UI、不进代码**（详见 `07` §12.4.3 表 + `CLAUDE.md` §9「Forbidden use」）：

1. **接口 / Mock**：完整版 `src/api/*`、`mock/*` 全是演示，**不可作后端契约**。字段真相 = 后端 live `/api/docs-json`（红线 1）。
2. **动态路由**：`asyncRoutes` / `getMenuList` / `MenuData` 实现**不可抄**、第一阶段**永远禁用**（裁决 2，`03-router-menu.md` §5.2.1）。
3. **多租户**：`tenant` / `package` / `package-menu` 模型**不可抄**（红线 3）。
4. **RBAC / 业务字段**：`system/*` 的角色/权限 code 体系、`dict/dept/activity` 字段命名**不可抄**（红线 1/4、裁决 3）。

抄页面 ≠ 抄需求：**完整版有某页，不等于 SRVF 要做某页**——做不做由后端能力图 + 产品定。

---

## §6 维护（本索引怎么再生 / 何时更新）

- 本索引为 **2026-06** 对照完整版当时快照（`src/views` 208 个 `.vue`、`src/components` 26 个 `Re*`、24 个 router 模块）生成。
- 完整版本机为**只读参考库**，理论上不随本仓变动；若将来人类更新了参考库、出现新演示页/组件，按下面只读命令复核并补本文 §1~§4：

```bash
REF="<refs-root>/vue-pure-admin"
find "$REF/src/views" -type d | sort                       # 模块结构
find "$REF/src/views" -name "*.vue" | wc -l                # 页数核对（基线 208）
ls "$REF/src/components"                                    # Re* 组件（基线 26）
grep -nE '(path|name|title|frameSrc):' "$REF"/src/router/modules/*.ts   # 意图/路径
sed -n '/^menus:/,/^buttons:/p' "$REF/locales/zh-CN.yaml"   # 中文标题
```

- 本文属 `docs/pure-admin/**`，更新须人类批准并**保留章节结构**（`02-ai-rules.md` §13.1）。
- 本文是「索引/参考」，**不是护栏**；真正的机械护栏在 `13-ai-harness.md`（改动须有人值守 + ask 网关）。
