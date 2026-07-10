# 04 业务规则

## 一、项目业务身份

本项目服务深圳公益救援队 SRVF 的后台管理场景，前端只负责呈现和操作真实后端契约，不定义业务事实。

## 二、业务模块现状

当前前端已存在以下业务域：

- 工作台
- 活动管理、报名管理、考勤审核
- 队员管理、队员档案、证书、紧急联系人、保险、参与记录
- 组织架构、字典、贡献规则
- 招募与入队
- 通知中心、微信模板
- 内容发布
- 用户、角色、RBAC、审计、附件配置、短信日志、系统设置

## 三、后端 v0.39 对齐现状

以下能力已对齐后端并接入（历史「待补齐」项均已完成,见 01/07）：

- memberships / positions / position-rules / position-assignments / supervision-assignments / role-bindings。
- authz explain / explain-batch、action-state batch、meta dashboard summary。
- **v0.39.0 档案敏感字段掩码分级**（#98）：`documentNumber` / `mobile` 默认掩码,明文闸 `member-profile.read.sensitive`;编辑面剔除掩码回写,契约见 `15_api_contracts.md §七`。

## 四、禁止前端臆造

- 不得前端自定义活动状态机。
- 不得前端自定义权限码。
- 不得前端自定义组织归属规则。
- 不得前端自定义角色与职务语义。
- 不得用 pure-admin demo 字段替代后端 DTO。
