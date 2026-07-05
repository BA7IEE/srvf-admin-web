# 05 测试与验收

## 一、状态等级

```text
DRAFT -> CODE_DONE -> BUILD_PASS -> LOCAL_TEST_PASS -> DEPLOY_PASS -> USER_CONFIRMED
```

没有真实执行日志，不得升级状态。

## 二、文档-only 验证

最低验证：

```bash
python scripts/check_handoff_docs.py --root .
```

推荐人工复核：

- `project_state.json` 可解析。
- `00_new_chat_start.md` 能指导新聊天接手。
- `29_doc_conflict_map.md` 已记录 README 旧口径。
- 没有真实密钥写入文档。

## 三、前端代码修改验证

进入代码修复后至少执行：

```bash
pnpm typecheck
pnpm build
pnpm dev
```

浏览器冒烟建议：

```bash
RP_BASE=http://localhost:8848 RP_API=http://localhost:3000 uv run --with playwright python tests/render/tabs_render_pass.py
```

修 auth / 路由 / 权限后应增加：

- 登录成功。
- refresh token 可用。
- 401 / refresh invalid 行为正确。
- 登录后首页可进入。
- 菜单与按钮按真实权限显示。
- 生产模式不依赖 `/get-async-routes`。

## 四、验收口径

只有用户明确反馈“通过 / 可用 / 线上确认”后，才能标记 `USER_CONFIRMED`。
