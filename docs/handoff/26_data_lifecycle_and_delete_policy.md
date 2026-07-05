# 26 数据生命周期与删除策略

## 一、当前前端原则

前端不定义数据生命周期或物理删除规则。所有删除、归档、软删、状态机均以后端 API 契约为准。

## 二、已知前端操作类型

- 队员删除：后端说明为软删，且有 active 归属 / 已绑定 user 时可能拒绝。
- 内容：publish / unpublish / archive。
- 通知：publish / unpublish / archive。
- 活动：publish / cancel。
- 报名、考勤：approve / reject / cancel / final approve。

## 三、规则

- 不在前端复刻后端约束。
- 后端返回 4xx 时显示其 message。
- 不在前端绕过状态机。
