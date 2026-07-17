# 外部参考登记表(external-refs)

> 本仓依赖的**仓外资产**唯一登记处:每项 = 用途 / 占位符路径 / 丢失后果 / 恢复方式。
> 仓内文档一律写占位符、不写机器绝对路径(唯一例外是下方声明行);新增仓外依赖必须先登记本表。
> `node .claude/hooks/harness-doctor.mjs` 的 [4] 段按本表路径做存在性巡检(缺失打 WARN,不阻断)。

## 占位符约定(本机实际值全仓唯一声明处)

- `<coding-root>` = `/Users/dengwang/Documents/coding`(换机器/换用户名只需改本行)
- `<refs-root>` = `<coding-root>/Pure Admin`(参考资产统一收纳夹,维护者 2026-07-17 定名;**永不入库、只读**;路径含空格,shell 引用须加引号)

自查约定:对 `docs/` 与根 `*.md` 全文检索本机用户目录前缀,命中必须**恰为 1 行**(即上方 `<coding-root>` 声明行);多出即有人把绝对路径写回了文档。

## 登记项

| #   | 资产                                      | 占位符路径                                | 用途                                                                                                                                                                                                          | 丢失后果                                                          | 恢复方式                                                                                                                            |
| --- | ----------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | vue-pure-admin 完整版(开源)               | `<refs-root>/vue-pure-admin`              | UI 交互范式只读参考(208 演示页;`docs/pure-admin/14-full-version-reference-index.md` 的扫描根,只抄交互不抄契约)                                                                                                | 建新页失去范式速查;14-index 内的扫描脚本失效                      | re-clone `https://github.com/pure-admin/vue-pure-admin`(2026-07-17 已重克隆为最新)                                                  |
| 2   | pure-admin-thin-max-ts 上游母版(付费私有) | `<refs-root>/pure-admin-thin-max-ts`      | starter 的派生来源与上游同步 cherry-pick 比对基准(`docs/pure-admin/11-upstream-sync.md`);维护者定调「开发底座以 Max-Ts 为准」(见 `<refs-root>` 下 README)                                                     | 上游同步链断                                                      | 购买权限有效期间可 re-clone `https://github.com/xiaoxian521/pure-admin-thin-max-ts`(2026-07-17 已重克隆为最新;权限若失效则无处再取) |
| 3   | vue-pure-admin-max(付费私有 Max 版)       | `<refs-root>/vue-pure-admin-max`          | Max 高级功能参考——在 vue-pure-admin 全功能之上逐项加高级功能,**每个高级功能=单独一个 commit**,按功能定位实现极方便;亦是 Max-Ts 的上游(谱系:开源完整版 → Max → Max-Ts → starter → 本仓);只读、只抄交互不抄契约 | 高级功能实现参考缺位(不影响现有代码)                              | 购买权限有效期间可 re-clone `https://github.com/xiaoxian521/vue-pure-admin-max`(2026-07-17 克隆,HEAD 7.0.0)                         |
| 4   | SRVF 设计稿(解压工作版,仅存副本)          | `<refs-root>/SRVF-ADMIN-WEB-UI-Reference` | 品牌色/组件风格的宽松参考(dashboard React 源码 + 截图 + 品牌资产;语义由维护者定于 `<refs-root>` 下 README:仅参考 UI 配色等,实际代码以 Pure Admin 为准)                                                        | **永久丢失**(ZIP 原件已于 2026-07-17 弃置,此为仅存副本)           | 无(维护者拍板不作仓外备份,接受此风险;品牌 tokens 已固化于仓内 `src/style/srvf-tokens.scss`)                                         |
| 5   | u-admin-web-starter(私有 starter)         | `<coding-root>/u-admin-web-starter`       | 本仓派生源(`docs/pure-admin/08-starter-derivation.md`);starter 级问题的回查处;上游同步的中转仓                                                                                                                | 派生追溯与「母版 → starter → 本仓」同步链断                       | re-clone `git@github.com:BA7IEE/u-admin-web-starter.git`(GitHub Private)                                                            |
| 6   | srvf-nest-api(后端姊妹仓)                 | `<coding-root>/srvf-nest-api`             | 任务设计权威 handoff:`<coding-root>/srvf-nest-api/docs/handoff/admin-web.md`(AGENTS.md §4);doctor [2] 读其 `package.json` 比对契约冻结基线                                                                    | 新业务页失去任务→端点图/轴模型/gap-ledger;doctor [2] 报 not found | re-clone `https://github.com/BA7IEE/srvf-nest-api.git`                                                                              |

## 变更记录

- 2026-07-17(谱系补齐):新增登记 **vue-pure-admin-max**(付费 Max 版,维护者克隆入 `<refs-root>`);至此 pure-admin 参考谱系齐备(开源完整版 / Max / Max-Ts)。
- 2026-07-17(夜):维护者拍板**弃置三件原件**(v7.11.0 fork / validated 历史包 / 设计稿 ZIP 原件)与旧夹「SRVF-web-admin参考」整夹——内容已合流 git 或已解压,留存反而易误导 AI。fork 唯一未移植增量(40100 被动刷新重试)的参考实现已先行抄档 `docs/archive/fork-40100-refresh-reference.md`(用后即删);validated 包内容与当时 main 逐字节一致,以 Git 历史为准。删除动作由维护者人工执行。
- 2026-07-17(晚):`<refs-root>` 由 coding 根下旧夹「SRVF-web-admin参考」迁至现值(维护者重组:框架双仓当日重克隆为最新、设计稿解压为 ASCII 目录并在收纳夹 README 写明语义)。
- 2026-07-17(晨):fork 与 validated ZIP 自 `~/Downloads` 迁入参考夹并登记(PR #101)。

## 备份拍板

维护者 2026-07-17 拍板:**不做仓外备份**——框架参考仓皆可 re-clone、业务两仓在 GitHub、品牌 tokens 已固化仓内;设计稿解压版(#4)为仅存副本,此风险已知情接受。此前的备份待办就此关闭。
