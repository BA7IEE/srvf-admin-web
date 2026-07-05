# 19 ChatGPT / Agent 开发操作协议

## 一、每轮开始前

1. 读取 `00_new_chat_start.md`。
2. 读取 `project_state.json`、`01_current_state.md`、`23_package_lineage.md`。
3. 读取 `02_development_rules.md`、`11_decision_log.md`、`12_task_board.md`、`13_code_map.md`。
4. 如涉及接口，读取后端 current-state、admin-web handoff、live `/api/docs-json`。
5. 先输出分析与风险，不直接改代码。

## 二、分析阶段必须回答

- 当前基线是什么。
- 最后一次用户实测确认包是什么。
- 本轮任务影响哪些主链文件。
- 是否触碰 auth / route / permissions。
- 是否影响数据库、部署、依赖。
- 是否存在旧文档冲突。
- 如何验证。

## 三、修改阶段规则

- 只做最小必要修改。
- 不做无关重构。
- 不凭记忆覆盖当前文件。
- 不删除用户已确认功能。
- 不写真实密钥。
- 修改高风险文件必须说明影响范围。

## 四、结束阶段必须输出

- 修改摘要。
- 修改文件列表。
- 测试结果。
- 未测试项。
- 增量包 / 完整包。
- SHA256。
- 下一步建议。

## 五、禁止异步承诺

不能承诺后台继续执行。所有工作必须在当前响应中完成，或明确说明未完成。
