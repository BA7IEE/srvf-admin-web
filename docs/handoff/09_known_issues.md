# 09 已知问题

## P0

1. 当前上传基准与前序用户确认 `v7.8.0` scoped-authz 浏览器冒烟包血缘未证实。如要恢复或继承 `scoped_authz_smoke.py` 测试能力，需要单独核对包差异。

## P1

1. 前端未完整对齐后端 v0.37.0 scoped-authz 能力。
2. 队员单部门 `department` 旧模型仍存在，应逐步迁移到 `memberships` 口径。
3. 登录页历史预填密码 `admin123` 与后端开发账号 `admin / ChangeMe123456` 不一致，会造成首次试登 401；不影响补丁正确性，但建议后续修正默认值或清空密码。
4. `docs/srvf-api-integration-guide.md` 中部分权限码数量历史描述低于当前后端 v0.37.0 的 195 码，只能作为 auth 流程参考。

## P2

1. 参考包体积大且包含 `.git`、`.DS_Store`，不应进入交付链。
2. 部分历史文档保留旧阶段说明，新聊天必须先看 handoff 冲突地图。

## 7.1.0 validated 更新

- `7.1.0-p1.meta-workbench` 已由用户本地验证通过。
- 工作台摘要已确认能显示后端返回 block；当前用户账号下返回 `registrations / attendanceSheets / activities`。
- 下一项已知迁移风险仍是旧 department 与 memberships 终态模型并存；下一轮只能新增只读 memberships，不应直接删除旧 department。
