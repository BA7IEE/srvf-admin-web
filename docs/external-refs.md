# 外部参考登记表(external-refs)

> 本仓依赖的**仓外资产**唯一登记处:每项 = 用途 / 占位符路径 / 丢失后果 / 恢复方式。
> 仓内文档一律写占位符、不写机器绝对路径(唯一例外是下方声明行);新增仓外依赖必须先登记本表。
> `node .claude/hooks/harness-doctor.mjs` 的 [4] 段按本表路径做存在性巡检(缺失打 WARN,不阻断)。

## 占位符约定(本机实际值全仓唯一声明处)

- `<coding-root>` = `/Users/dengwang/Documents/coding`(换机器/换用户名只需改本行)
- `<refs-root>` = `<coding-root>/Pure Admin`(参考资产统一收纳夹,维护者 2026-07-17 定名;**永不入库、只读**;路径含空格,shell 引用须加引号)

自查约定:对 `docs/` 与根 `*.md` 全文检索本机用户目录前缀,命中必须**恰为 1 行**(即上方 `<coding-root>` 声明行);多出即有人把绝对路径写回了文档。

## 登记项

| #   | 资产                                      | 占位符路径                                                                        | 用途                                                                                                                                                                                              | 丢失后果                                                          | 恢复方式                                                                                                                             |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | vue-pure-admin 完整版(开源)               | `<refs-root>/vue-pure-admin`                                                      | UI 交互范式只读参考(208 演示页;`docs/pure-admin/14-full-version-reference-index.md` 的扫描根,只抄交互不抄契约)                                                                                    | 建新页失去范式速查;14-index 内的扫描脚本失效                      | re-clone `https://github.com/pure-admin/vue-pure-admin`(2026-07-17 已重克隆为最新)                                                   |
| 2   | pure-admin-thin-max-ts 上游母版(付费私有) | `<refs-root>/pure-admin-thin-max-ts`                                              | starter 的派生来源与上游同步 cherry-pick 比对基准(`docs/pure-admin/11-upstream-sync.md`);维护者定调「开发底座以 Max-Ts 为准」(见 `<refs-root>` 下 README)                                         | 上游同步链断;付费访问权若失效则无处再取                           | **付费件,须仓外备份**;购买权限有效期间可 re-clone `https://github.com/xiaoxian521/pure-admin-thin-max-ts`(2026-07-17 已重克隆为最新) |
| 3   | SRVF 设计稿(解压工作版)                   | `<refs-root>/SRVF-ADMIN-WEB-UI-Reference`                                         | 品牌色/组件风格的宽松参考(dashboard React 源码 + 截图 + 品牌资产;语义由维护者定于 `<refs-root>` 下 README:仅参考 UI 配色等,实际代码以 Pure Admin 为准)                                            | 轻——可由 #4 原件重解压                                            | 由 #4 ZIP 原件重解压                                                                                                                 |
| 4   | SRVF 设计稿 ZIP 原件                      | `<refs-root>/SRVF ADMIN UI参考.zip`                                               | #3 的原始归档件(一次性交付物,无线上出处)                                                                                                                                                          | **永久丢失**(若 #3 也不在)                                        | **不可再生,须仓外备份**                                                                                                              |
| 5   | v7.11.0 fork(纯文件夹,无 git)             | `<refs-root>/srvf-admin-web_v7.0.1-fork`                                          | 组织人事 4 页 + scoped-authz + 考勤表单重构的移植源与唯一对照原件(`docs/srvf-admin-vnext-blueprint.md` 平行轨;目录名 v7.0.1 系打包笔误,以内部 `VERSION`=7.11.0 为准;2026-07-17 自 Downloads 迁入) | 未移植增量与对照原件永久丢失(已移植部分在 main,但无从复核)        | **不可再生,须仓外备份**——外部一次性交付,无 remote                                                                                    |
| 6   | validated 历史包                          | `<refs-root>/srvf-admin-web_v7.1.0-p1.meta-workbench_validated_full_20260705.zip` | 2026-07-05 handoff 验证证据原件(`docs/handoff/23_package_lineage.md`;内容与当时 main 逐字节一致、已合流,勿再找增量;2026-07-17 自 Downloads 迁入)                                                  | 验证链证据丢失(代码内容可由 git 历史重建,ZIP 原件不可)            | **不可再生,须仓外备份**                                                                                                              |
| 7   | u-admin-web-starter(私有 starter)         | `<coding-root>/u-admin-web-starter`                                               | 本仓派生源(`docs/pure-admin/08-starter-derivation.md`);starter 级问题的回查处;上游同步的中转仓                                                                                                    | 派生追溯与「母版 → starter → 本仓」同步链断                       | re-clone `git@github.com:BA7IEE/u-admin-web-starter.git`(GitHub Private)                                                             |
| 8   | srvf-nest-api(后端姊妹仓)                 | `<coding-root>/srvf-nest-api`                                                     | 任务设计权威 handoff:`<coding-root>/srvf-nest-api/docs/handoff/admin-web.md`(AGENTS.md §4);doctor [2] 读其 `package.json` 比对契约冻结基线                                                        | 新业务页失去任务→端点图/轴模型/gap-ledger;doctor [2] 报 not found | re-clone `https://github.com/BA7IEE/srvf-nest-api.git`                                                                               |

## 变更记录

- 2026-07-17(晚):`<refs-root>` 由 coding 根下旧夹「SRVF-web-admin参考」迁至现值(维护者重组:框架双仓当日重克隆为最新、设计稿解压为 ASCII 目录并在收纳夹 README 写明语义;fork / validated ZIP / 设计稿 ZIP 原件随后迁入,du 双向核验一致)。**旧夹现仅剩过时的框架双仓副本与旧 README——登记资产已全部迁出,旧夹可由维护者自行整夹删除(删除动作恒为人工,AI 不 rm)。**
- 2026-07-17(晨):fork 与 validated ZIP 自 `~/Downloads` 迁入参考夹并登记(PR #101)。

## 备份状态(人工步骤)

`<refs-root>` 整夹约 1.3G,其中 #2(付费)、#4(设计稿原件)、#5(fork)、#6(validated 包)为**不可再生件**——须由维护者在仓外做一次异地备份(iCloud / 移动盘均可),此步只能人做;完成后在下表补记。

| 日期           | 备份位置 | 备注                          |
| -------------- | -------- | ----------------------------- |
| (待维护者执行) | —        | 2026-07-17 登记时尚无仓外备份 |
