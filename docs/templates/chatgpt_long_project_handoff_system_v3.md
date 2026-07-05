<!-- SRVF template note: this file is a reusable template. Placeholder-like text inside docs/templates is allowed and ignored by scripts/check_handoff_docs.py. -->

# ChatGPT 长期项目开发交接体系 V3 总规范

## 一、体系目标

让长期项目在 ChatGPT 当前聊天达到长度上限后，仍能在新聊天中基于项目文件无缝继续开发。

## 二、核心文件

| 文件                       | 作用                 |
| -------------------------- | -------------------- |
| `project_state.json`       | 机器可读当前状态     |
| `00_new_chat_start.md`     | 新聊天启动入口       |
| `01_current_state.md`      | 人工可读当前状态总表 |
| `02_development_rules.md`  | 开发纪律             |
| `11_decision_log.md`       | 决策原因             |
| `12_task_board.md`         | 任务状态台账         |
| `13_code_map.md`           | 代码地图             |
| `23_package_lineage.md`    | 包血缘               |
| `24_validation_matrix.md`  | 验证矩阵             |
| `29_doc_conflict_map.md`   | 文档冲突地图         |
| `30_handoff_self_check.md` | 交付前自检           |

## 三、每轮交付规则

每轮必须输出：

1. 修改摘要。
2. 变更文件。
3. 文档同步情况。
4. 测试结果。
5. 增量包。
6. 最新完整包。
7. SHA256。
8. 下一步建议。

## 四、稳定性判断

- 最新完整包用于新聊天读取完整项目。
- 最后一次用户确认代码包用于判断业务稳定性。
- 未经测试的包不得标记为 `USER_CONFIRMED`。

## 五、冲突处理

旧文档、新文档、聊天记忆冲突时，以 `29_doc_conflict_map.md` 和 `01_current_state.md` 为准。
