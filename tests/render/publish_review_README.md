# 活动发布审核本地候选

本轮基于前端 `e1052b807edc1a481392ebbff618ba1805c3c2cb`，仅补审核员任务入口、冻结申请核对和处理回执。原组织者草稿、提审及登录修复保持原样。本地候选没有推送、建 PR、合并、部署或访问现存服务器；不表示 P6 生产启用。

## 合同与范围

合同来自固定后端 `ea4a35792e3d107cebb975235821a21de9070b34` 的源码交接：`tests/fixtures/publish-review-contract.txt`，25,781 字节，SHA-256 `8807a3453f676e97197f8b49ca6a0c43bc80e3ac4365564ab03e72e84f374e6a`。该文件是源码证据，不能冒充 live OpenAPI 或真实联调结果。Node 测试校验原始字节；无需扩大格式排除。

另只读核对了同提交 `activity-publish-proposal-v2.service.ts:121–560,868–1018` 的 Activity/Session/Position、地点、解析来源及 V7–V9 形状，`qualification-rule-set-definition.ts:1–150` 的 `ruleSets` 和 `activity-publish-proposal-v7.ts:1–95` 的指标字段。业务 DTO、权限、锁内顺序与错误以交接合同为准，未参考旧本地后端发明新参数。

任务入口在审批工作台的“活动发布审核”，一行只提供“核对申请”。详情按审核记录 ID 打开，无需审核员拥有组织者的 simple-draft 或旧活动列表读取权。读、通过、退回分别使用真实三码；页面读取有效权限及本人身份，组织范围仍由服务器判定，自审比较提交者 userId。角色名和 SUPER_ADMIN 不能豁免自审规则。

初发“通过并发布”只有一条 approve 命令，同事务发布，不另加发布按钮。审核 `approved` 是历史决定，页面不会据此宣称活动现在仍 published。退回必须填写非空原因，组织者修改后重新提审，不能把旧 returned 记录改回 pending。

## 冻结内容覆盖边界

支持 V7–V9 已知字段的只读投影，分别展示目标活动、场次岗位、地点、报名及空配置、冻结解析值及来源、模板选择、标志与哈希，以及提审时的原基线。它们不是当前草稿；不把 changeDiff 当实时差异。日期明确展示北京时间，标识按标识展示，不伪造人员或组织名称。前端不编辑审核快照或发组织者的 expectedDraftHash。

**可通过范围比所有待审申请窄**：在原无政策 V7 子集之外，现补正常 V5 模板的 V9 初发：单场次、单岗位、先到先得、模板默认时长及贡献政策、无覆盖项。必须经新受限读面取得并完整展示冻结 base/target 的所有引用版本及规则。未展开的报名表单/资格规则、指标集合、内容定义、受众限定、未知字段/格式、政策覆盖，或尚无完整前后对照的 change 申请，仍明确禁用通过。不会把 initial/schemaVersion 当可信 simple 来源，也不把 V9 缺少政策当作无政策捷径。可按权限退回，不调用旧 publish 补救。准确新增合同及验收命令见 publish_review_v5_README.md。

## 结果未知与恢复

发送前必须确认、验证当前身份/权限、读取同一申请并比对刚展示的冻结内容；变化则重新展示、要求重新确认，尚不产生已发送记录。实际 POST 前先保存账号/站点/审核记录隔离的 sessionStorage 意图。approve 原体只有 operationKey、requiresInsuranceConfirmed=true 和可选 reviewNote；return 只有 operationKey 和原始 reviewNote。原字符串空白也保留，不能用服务器 trim 后的说明重建请求。

超时、断线、20144、20033、401/403/404 等都保留原意图。复制标签页可能还有同键发送在途，首次明确拒绝也不自动解锁；不能换键、发相反动作或以 GET approved/returned 推断关联成功。20143 标记冲突并停止重发。只由关联这次 POST 的合法成功响应归档；回执还保留真实 reviewedByUserId，不擅自改为当前账号。归档失败留存成功回执，可仅本机保存，不再 POST。

关闭确认窗口只处理本地界面，不能取消已发送请求。SPA 离开/参数切换在发送中互锁；强制刷新、关页不是服务端取消。记录只在当前标签页范围内，关闭标签页或清除数据后不能保证找回，不构成跨设备恢复。保守保留可能使一次明确失败仍需人工核对，这是已知可用性代价，不提供虚假的永久取消或自动解锁。

账号在迟到响应前变化时，旧冻结内容、说明及回执全部隐藏，原账号的恢复记录保留。该断言曾实际失败，最小修复后以同一断言验证。

## 本地合成验证

所有 API 都由夹具拦截，不启动后端、不读写数据库；`publish-review.synthetic.json` 是合成数据，不是采集的真实申请。

```bash
node --test tests/publish_review.test.mjs tests/simple_activity_state.test.mjs tests/simple_activity_review.test.mjs tests/simple_review_version.test.mjs
PYTHONDONTWRITEBYTECODE=1 RP_BASE=http://127.0.0.1:8848 uv run --offline --with playwright python tests/render/publish_review_render_pass.py
PYTHONDONTWRITEBYTECODE=1 RP_BASE=http://127.0.0.1:8848 uv run --offline --with playwright python tests/render/publish_review_clone_render_pass.py
PYTHONDONTWRITEBYTECODE=1 RP_BASE=http://127.0.0.1:8848 uv run --offline --with playwright python tests/render/publish_review_recovery_render_pass.py
```

使用本工作树 dev 实际端口、既有锁定依赖和系统 Chromium。Node 测试用 Node 原生 TS 加一条仅测试使用的相对导入解析，不修改构建配置或仓库钩子。

三组新浏览器回归覆盖任务入口、实际冻结内容、通过/退回、明确确认、取消/关闭/重开、独立权限、自审、未支持配置、发送前权限/版本变化、存储失败、双击、在途路由切换、拒绝后刷新、丢失响应、当前状态不可冒充回执、390px、真实 opener 复制 sessionStorage、旧账号迟到响应、无关成功响应、归档失败和认证失效恢复。主流程旧版在找不到审核页签处红灯；另保留账号变化的实际红灯与修复后同一安全断言。

最终检查以交付包中的日志及 checks.json 为准；包含 lint/typecheck/build、护栏与原组织者回归。这里未运行 GitHub CI、新真实联调、生产验收或现存服务器测试。

## 最小下一步

先审核本地差异和本页通过范围。V5 默认政策通过路径已接受限读面；若要覆盖政策覆盖项或专业/变更申请，仍需另任务，不删除阻挡条件或清空冻结配置。

真实联调本轮只评估：需要与固定后端对应的隔离栈、单独的非提交者审核账号及精确组织范围三码、确实落在本页展示范围内的一份初发 fixture，并由执行方明确批准 approve 的发布、审计、通知/队列副作用及清理。最小验收是读列表/详情、确认冻结内容、单次 approve 并同键重放、检查一条决定与发布事务，然后按隔离栈既有清理程序清理。退回/并发另需独立申请，不能用已发布记录反复改状态。若实际 fixture 带本页未展开政策，应先完成相应展示，不扩大权限或修改数据绕过。当前没有发放权限、令牌或触碰真实数据。
