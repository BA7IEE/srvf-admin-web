# 活动退回后修订与再次提审

在已交付 `270dff395b499f9795a5479566ad0afc47aa7bdc` 上补齐主办方退回原因展示。已有草稿编辑和带版本提审保持原有恢复语义，不新增审核写接口。

只读原因来自现有 `GET /api/app/v1/my/managed-activities/:activityId` 的 `publishReview.reviewNote`。以本人 `simple-draft` 为入口，核对活动 ID、组织、当前活动状态、最新审核 ID、类型与退回状态，并在显示前后检查账号。该接口采用正式成员及责任范围准入，不请求审核员权限。原因失败可单独重试，不替换草稿、未保存表单或未知提审请求。

准确控制器、DTO 和查询源码固定在后端 `923c6c57673883d4b4834ea7e2ff0c8e18b5da5d`，摘录见 `tests/fixtures/organizer-return-contract.txt`。这是源码合同核对，不是新获取的 live OpenAPI 或真实联调证据。原 `simple-activity.live.openapi.json` 仍保留原版本身份。

先在隔离工作树恢复锁定依赖，启动本工作树的 Vite，读取实际端口：

```bash
pnpm install --frozen-lockfile
pnpm dev
```

在已有 Python Playwright 与 Chromium 的执行环境运行：

```bash
node --test tests/*.test.mjs
PYTHONDONTWRITEBYTECODE=1 RP_BASE=http://127.0.0.1:8848 python -u tests/render/simple_return_render_pass.py
```

也可按 `tests/render/README.md` 使用 uv 的临时 Playwright 环境；缓存目录须可写。脚本复用 `/usr/bin/chromium`，全部 `/api/**` 都由合成夹具拦截，不需要后端、真实账号或数据库。不要将这组测试标为真实后端联调。

同一退回原因可见断言在基线失败，在候选通过。覆盖原因按原文展示而不解释 HTML、空原因、403/404、活动/组织/审核/状态不一致、读取后账号变化、读取失败重试、普通成员无修改或审核员权限、编辑取消及重新打开、保存后新键新版本再次提审、重复点击、刷新、原未知请求的精确恢复、已批准历史与当前已取消状态分离，以及 390px 窄屏。

未知请求不会因为一般 GET 读到 `returned` 而清空或换键。只有关联原请求的成功回执才能归档，再由用户明确确认新的提审。401/403/404、20143、复制标签页与确定拒绝的既有恢复边界继续由 `simple_review_pending_render_pass.py`、`simple_review_clone_render_pass.py` 和 `simple_review_version_render_pass.py` 回归。

仍未完成跨设备或已关闭标签页的完整恢复，不增加审核员决策、专业配置或变更申请编辑，不以历史 `approved` 推断活动当前已发布。
