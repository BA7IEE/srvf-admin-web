<!-- SRVF template note: this file is a reusable template. Placeholder-like text inside docs/templates is allowed and ignored by scripts/check_handoff_docs.py. -->

# 项目初始化填写清单

把本模板复制到真实项目后，按顺序填写：

## P0 必填

- [ ] `project_state.json`
- [ ] `VERSION`
- [ ] `docs/handoff/00_new_chat_start.md`
- [ ] `docs/handoff/01_current_state.md`
- [ ] `docs/handoff/02_development_rules.md`
- [ ] `docs/handoff/08_next_steps.md`
- [ ] `docs/handoff/12_task_board.md`
- [ ] `docs/handoff/13_code_map.md`
- [ ] `docs/handoff/23_package_lineage.md`

## P1 按项目填写

- [ ] 业务项目：`04_business_rules.md`
- [ ] 数据库项目：`14_database_and_migrations.md`
- [ ] 前后端联动：`15_api_contracts.md`
- [ ] 服务端部署：`06_deployment_and_upgrade.md`、`25_operations_runbook.md`
- [ ] UI 重项目：`docs/requirements/ui_ux_rules.md`、`design_system.md`

## P2 自检

```bash
python scripts/check_handoff_docs.py --root . --template
```
