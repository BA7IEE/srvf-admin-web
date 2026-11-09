# 单场次活动契约证据

`simple-activity.live.openapi.json` 是协调方从真实隔离 API 导出的 OpenAPI 中提取的无损子集，经会话 gzip/Base64 交接后恢复。不是从前端类型或仓库静态文件生成。

- 后端提交：`15421e9c3c1d3468b57755ae5fdea526934f4e19`。
- 协调方报告获取时间：`2026-11-06T07:21:46.187914+00:00`。
- 协调方报告来源：与隔离 API 同镜像、同环境、临时开启 Swagger 的运行实例，OpenAPI 3.0.0 / API 0.72.0。
- 完整导出的 SHA-256（协调方提供，本环境没有完整文件）：`02861e15bc56e72b6f40de86574c80a772080548a0f704594d724cc78b760ee3`。
- 本环境实际收到并核验的子集：37,896 字节，SHA-256 `48ff27edc0fea03ffe4c30cc2a5c617a600bb5cc093e43034076b6a8ad25c858`。
- 5 条路径、6 个操作、18 个 schema，全部递归 `$ref` 解析通过；逐对象与上述固定后端的 `docs/handoff/openapi.json` 相等。

核验保留了原始描述、请求、所有响应、示例和 Bearer 定义。`review` 可空；分页元素由接口 `allOf` 指定；地点互斥、唯一主地点和 confirmation=true 约束部分只在描述中，不擅自修饰原 schema。此历史 live JSON 的提审体仍只有两字段；不得覆盖成新候选的合同或据此声称新能力已部署。

这证明交接子集完整性和契约一致性，不代表云环境直连过运行实例，也不代表真实账号授权、创建或保存联调通过。原始完整文件和 verification.json 仍留在协调方提供的 Mac 路径，本环境未取得。

执行 `node --experimental-strip-types --test tests/simple_activity_state.test.mjs` 可复核子集摘要和递归引用，并验证完整保存与恢复逻辑。

## 带确认版本的提审候选（非 live）

`simple-review.candidate-contract.md` 是协调方交接的完整源码合同，按当前 Library 材料化流程取得并核验，未由前端重写或生成。

- Library：`libfile_fde3_f-a8db4ce870cc81919f383bf1706596ca_e2a6ebf7bfe48191a9d17835930e5c7b`，file `file_000000006ee881fdb8127cb58340a05d`。
- 47,286 字节；SHA-256 `15e496b0965aa94bba22e63b259879db403a402bccbb4e9c9d9c1229742b9e25`。
- 后端基线仍为 `15421e9c`，独立未提交候选补丁 SHA-256 `93ed4091f2be3e22786140ea12438bd60d1818d8d887b6d9064a432e8f1725c7`，不是已经部署的提交。
- 新前端固定发送 `operationKey`、`confirmation:true`、`expectedDraftHash`。版本来自本人同一活动成功 GET/PUT 的完整已展示事实；不使用模板摘要、审核快照摘要或未保存表单。
- 当前本地实现依据此源码合同及用户明确授权；未取得新候选 live OpenAPI，未调用真实 API。需与对应后端候选同时验收，不支持自动去掉版本的降级。
- 20255/20256 只证明当前尝试失败，首次发送和恢复发送均不能证明其他发送已经结束。实际 opener 复制页回归已证明首次失败清除记录不安全，当前 UI 对所有已发送请求保守保留原体；旧两字段未知记录仅读取核对。只有关联原请求的成功回执允许自动归档，不以 GET、401/403/404、20143 或取消等待代替。
