# 正常 V5 默认政策的发布审核

基于精确 ad6ab40b 候选，在独立 `codex/reviewer-v5-policy-local` 工作树补齐正常 V5 初发。原候选、旧交付包与旧真实验收证据保持不变。当前本地候选不表示新真实联调已通过。

新增源合同 `tests/fixtures/referenced-policies-contract.txt`，8678 字节，SHA-256 `0bf652c3bcf64644b661edc5ce93315777c7b1a43c79b1699a0a64c452b85f64`。后端基线 ea4a3579，受限读面候选树 `908cfe57adcf089f9df1b410443f72bb62a32327`；合同是未部署候选源码交接，不冒充 live OpenAPI。原合同、live 子集原始字节仍保留。

只增加 `GET /api/admin/v1/activity-publish-reviews/{reviewId}/referenced-policies`，无 body/query，无任意政策 ID 参数。复用审核读取权限与组织范围，不请求或授予任何 catalog 权限。审批/退回 DTO、键与恢复协议不变；旧后端返回 404 时禁止 V5 通过，不降级。

页面将当前 reviewId、activityId、snapshot schema/hash 与读面匹配，覆盖冻结 base/target 的显式选择及所有解析赢家。缺版本、错误 hash/evaluator、重复/多余版本、窗口不匹配、未知定义或引用形状都拒绝完整覆盖，不当作无政策。完整覆盖对象只在内存保存，绑定展示的整份冻结内容，不放进操作恢复记录。刷新来的其他快照不能沿用旧覆盖。

按冻结身份展示选择/继承、真实采用的精确版本、来源及适用窗口；完整时长定义包含分类、身份映射、拆分、特殊时段、舍入、证据与人工调整。完整贡献定义包含默认结果和每个身份/分类/时长档位、原两位小数字符串及解释码。接口没有政策名称，不伪造名称或读取当前目录描述。精确历史版本可读，不代表审批当下可用，最终由审批事务复核。

本轮通过范围仅扩展为正常 V5/V9：单场次、单岗位、先到先得、默认模板政策继承、无覆盖，且冻结基线与目标政策相同。更复杂配置和 change 仍拒绝。正常 V5 的两个政策对象非空；缺失它们不会作为“无政策”通过。

发送前再次读取引用政策，若展示内容变化则重新确认，失败则不产生已发送记录。已有未知决定仍只精确重试原操作，与本次只读接口是否成功无关；普通状态轮询和政策读取都不证明原键落库，不能替换原体。

```bash
node --test tests/publish_review_policies.test.mjs tests/publish_policy_rules.test.mjs tests/publish_review.test.mjs tests/simple_activity_state.test.mjs tests/simple_activity_review.test.mjs tests/simple_review_version.test.mjs
PYTHONDONTWRITEBYTECODE=1 RP_BASE=http://127.0.0.1:8848 uv run --offline --with playwright python tests/render/publish_review_v5_render_pass.py
```

新 V5 fixture 是明确的源形状合成数据：含完整、非空时长与贡献选择，单场次默认继承和完整版本定义，不是后端生成的审核记录。浏览器从待审任务开始，覆盖完整规则、确认/取消/重复点击、错误身份/hash/缺定义、403/409/404、发送前读取失败和展示变化、政策覆盖/变更禁用、退回、丢失回执原体恢复、身份变化及390px。另保留规则组件独立浏览器测试。全 API 拦截，不构成真实后端/PG验收。

红灯证据先在 ad6ab40b 行为上证明正常非空政策禁用通过；另捕获并修复 V9 缺政策仍可能被当作无政策批准的本地覆盖缺口。未删除安全断言。最终结果与首次失败日志见交付包 checks.json/evidence。

未做：目录授权、受保护配置/生成文件修改、生产或服务器操作、推送/PR/部署、Mac构建、专业/变更完整审核和跨设备恢复。后端合同提到的受保护产物收口属于后端线程，本前端候选不代为授权或修改。
