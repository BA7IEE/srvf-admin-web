# ChatGPT/ZIP 轨交接系统 · 墓碑(2026-07-17 整体清除)

2026-07-05 起本仓曾运行一套面向「ChatGPT 长期会话 + ZIP 包交接」的文档机器(V3 总规范),共 **45 件**:

- `docs/handoff/00~30`(31 篇:新会话入口 / 当前状态 / 包血缘 / 冲突地图 / 自检清单等)
- `docs/templates/`(4 篇,含 `chatgpt_long_project_handoff_system_v3.md` 总规范)
- `docs/requirements/`(4 篇小规格件)
- 根部:`project_state.json` / `project_state.example.json` / `VERSION` / `changed_files.txt` / `USAGE.md`
- `scripts/check_handoff_docs.py`(交接自检脚本)

**清除原因**(维护者 2026-07-17 拍板):ZIP/fork 平行轨当日已弃置;Harness 2.0-FE(根 `AGENTS.md` 恒读 + 触碰才读)接管了它的全部职责;这套机器留在工作区只会误导 AI——旧基线口径、包血缘、冲突地图均已失效。

**找回方式**:全部内容在 git 历史中,最后完整存在于 commit **`9825ebd`**:

```bash
git show 9825ebd:docs/handoff/00_new_chat_start.md   # 看单篇
git checkout 9825ebd -- docs/handoff                 # 恢复整树(如确有考古需要)
```
