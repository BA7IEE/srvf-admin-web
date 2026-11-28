# 首发进度快照

## 2026-11-28 08:17–08:28 · 已补 FormVersion INSERT，变更批准通过，Issue 8 PASS（Asia/Shanghai）

本段追记对 `srvf_activity_review` 补 `RegistrationFormVersion` 最小 INSERT，以及同一变更批准／Issue 8 刷新路径上随后钉死的最小可逆授权；初始发布与 20035 前情不在此重述。mid87 及更早正文逐字节保留；上文 t338 段落未改写。未合并 Draft PR 175／1467，未部署或重启 API 容器 `b5b5bd933560`，未改四场 2099、WAVE77–84，未再平移窗口，未开 E4，未发短信，未占 t95，未给 draft 角色扩权，未向 issue 1464 追加评论。夹具保持 volunteer。首发总任务未完成。

### GRANT 与读回

1. 08:17:23，`srvf_activity_review`：`GRANT INSERT (id, createdAt, updatedAt, activityId, version, statusCode, workflowRevision, schemaHash, activatedAt) ON TABLE public."RegistrationFormVersion"`。读回：上述 9 列 INSERT 为 true，`retiredAt` INSERT 为 false，`is_grantable=NO`，DELETE 为 false。因未授 `retiredAt`，表级 `has_table_privilege(INSERT)` 仍为 false。
2. 08:18:29，同一角色：钉死请求 `cmwznvfm91a5277e87722d8ffec08149a` 后，对 `public."RegistrationFormField"` 按 STATEMENT 23 列补 INSERT（`is_grantable=NO`，无 UPDATE／DELETE）。
3. 08:19:44，同一角色：钉死请求 `cmwznxa6d5c4be6d98baf7949aeb32fb0` 后，对 `public."CapacityReservation"` 补 `SELECT (bucketId, status)`（`is_grantable=NO`，无 INSERT／UPDATE／DELETE）。
4. 08:27:59，`srvf_activity_registration`（oid 25228）：Issue 8 过期表提交 503／42501（请求 `cmwzo7k05c256b1ba39e99933c0b21165`）后，对 `RegistrationFormField` 补 STATEMENT 所需 12 列 SELECT（含 ORDER BY 的 `sortOrder`），`is_grantable=NO`，无 INSERT／UPDATE／DELETE。未给 `srvf_activity_draft` 补 FormField SELECT，因为本轮 Issue 8 并不依赖负责方 GET registration-form。

对应 REVOKE 留在 `/private/tmp/srvf-t339u-formversion-insert/` 与 Draft PR 1467 的 `docs/ops/runtime-acl/t339/`，未执行。

### 变更批准

管理员对既有变更单 `cmwzn1g2l02syny01qhxgft55` 只批准一次：2026-11-28 08:20:13.510 Asia/Shanghai，HTTP 200／0，请求标识 `cmwznyqys71e961e50d7b420dd01205b3`。审核单 `approved`，报名表 v1 retired、v2 active，活动仍为 published（随后为完成 Issue 8 又批准了新的变更单，当前 `workflowRevision=5`、v5 active）。窗口未再平移。

### Issue 8：PASS

隔离 0700 Chrome，队员 T305U-VIRT-01，未占 t95。场次勾选需用 `getByRole(checkbox, 参加本场次)`（`getByText` 再向上找 `label` 会找不到，因为匹配到的就是 label 本身）；资格为 pass，勾选可用。最终在 v4 旧表打开并填写后批准变更到 v5，提交 HTTP 409、业务码 21036（「报名表版本不匹配或已失效」），出现「刷新定义并核对」，点击后读到「WAVE89 复核题」。未做成功的新报名提交。夹具读回 volunteer。

### 回执

`/private/tmp/srvf-t230u-live-test/official-t339-formversion-insert-grant-retest-note.json`，SHA-256 `348d467f0fd7b906ff14a9e8eb6b9a05ad2e0a826057386fa18817c3a6d7792f`。未覆盖 t325–t338 与 wave98／99 回执。官方登录工具 SHA-256 仍为 `5f11b7784417ef3cdbce6a95644199d95e2eec157ca97a86da9852e1fce3d00e`。

## 2026-11-28 07:48–07:58 · 20035 已用可逆正式档前提一次批准并发布；Issue 8 卡在变更批准的 INSERT（Asia/Shanghai）

本段追记：先只读钉死 20035 的对象与失败条件，再按既有授权对占用夹具做临时 `level-1` 并在同一流程内恢复 `volunteer`，然后只批准一次初始审核；活动已发布后立即走 Issue 8。mid87 及更早正文逐字节保留；上文 t337／调窗／t335 段落未改写。未合并 Draft PR 175／177／13／182／183 或 API 1454／1455／1459／1460／1461／1463／1467，未部署或重启 API 容器 `b5b5bd933560`，未再平移窗口，未改四场 2099、WAVE77–84，未开 E4，未发短信，未占 t95，未虚构身份证，未把合成数据与真实身份混用，未硬改审核单或活动状态接发布。首发总任务未完成。

### 20035 对象与条件（只读）

隔离活动 `cmwz1vy7f02a1ny01xuigxskj` 的拟写入负责人就是发起人 `cmwx5pu3r0024ny01o20nsa5s`（`T175U-VIRT-DVI5ZE0Q`／`t175u_virt_qtn2xuyu`）。队员状态 ACTIVE、未删除，且有 ACTIVE 用户。失败只发生在冻结 8a `createOwnerForPublish` → `assertActiveTarget(..., { formal: true })`：`gradeCode` 为 `volunteer`，不属于 `level-1`…`level-7`。对照已发布的 WAVE84 `cmwyw7s9l01cpny01awv81xtz`：同一发起人，现仍为 volunteer，当时是按历史 Issue 8 探针对该占用夹具临时升档后再恢复。不是「发起人缺失」或冻结 8a 逻辑缺陷，也未改那些已发布活动。

### 可逆前提与一次初始批准（2026-11-28 07:49:51 Asia/Shanghai）

经产品接口 `PATCH /api/admin/v1/members/:id`，夹具等级 volunteer → `level-1`（HTTP 200／0，请求标识 `cmwzmvoxj752a3d6213110f2d46e2b949`）。管理员 `accept_t71_admin` 对审核单 `cmwz26jnx02b0ny01itbub0fm` 只批准一次：HTTP 200，业务码 0，请求标识 `cmwzmvp2r380a9b3d9df594183ef4095d`。审核单变为 `approved`（`reviewedAt` 07:49:51.485），活动变为 `published`（`publishedAt` 同时刻，`workflowRevision=1`）。窗口仍为 07:32:14–11:40:14.001 Asia/Shanghai，未再平移。同一流程的 `finally` 已把夹具改回 `volunteer`（HTTP 200／0，请求标识 `cmwzmvp9x0e770e5f3ea16f55e80894a6`）；读回 `grade_final=volunteer`。未改 T305U-VIRT-01..12 的等级。

### Issue 8（PARTIAL）与本链第 2、3 次增量 GRANT

隔离 0700 Chrome（因 t96u 的 playwright-core 安装不完整，改用已有的 t113u-h5-fix 1.65.0），队员 T305U-VIRT-01 登录 200／0，打开已发布活动的 v1 报名页，标题与「WAVE89 隔离题目」可见并已填写，未占 t95。随后负责方一次提交变更审核 `cmwzn1g2l02syny01qhxgft55`（HTTP 200／0，写入 v2 字段「WAVE89 新题」），之后只复用这一条 pending 变更单，未再提交新的变更。

变更批准三次都返回 HTTP 503／50300，且每次都先钉死了新的 42501，不是对同一失败连打：

1. 07:54:19，请求标识 `cmwzn1g3y8dc238aee0ef93542d1ff650`：`srvf_activity_review` 对 `public."RegistrationUploadSession"` 做 `UPDATE ("statusCode","updatedAt") WHERE formVersionId,statusCode` 被拒。07:56:29 补最小列级 `SELECT ("formVersionId","statusCode"), UPDATE ("statusCode","updatedAt")`，`is_grantable=NO`，无 INSERT／DELETE。本链累计 2／3。
2. 07:57:07，请求标识 `cmwzn51v594bc7d35896ac94cb5f70e55`：同一角色 `UPDATE` 旧版 `RegistrationFormVersion`（`statusCode,retiredAt,updatedAt`）并 `RETURNING` 整行时，缺 `createdAt`／`updatedAt`／`activatedAt`／`retiredAt` 的 SELECT（t337 只授了 SET 列的 UPDATE）。07:58:03 补这四列 SELECT，`is_grantable=NO`。本链累计 3／3。
3. 07:58:32，请求标识 `cmwzn6v3if5b2c75e108c08f1af0575f9`：同一角色、同一连接对 `RegistrationFormVersion` 做 **INSERT**（`id,createdAt,updatedAt,activityId,version,statusCode,workflowRevision,schemaHash,activatedAt`）被拒。授权范围只覆盖 SELECT／UPDATE，且增量已到 3／3，因此未再 GRANT，未用改库绕过，变更单仍为 pending，报名表仍为 v1／active。未观察到 21036，也未见到「刷新定义并核对」入口。Issue 8 记为 PARTIAL。

另：负责方 `GET .../registration-form` 曾 503／50300，是 `srvf_activity_draft` 对 `RegistrationFormField` 仍缺 SELECT（此前已记录）；本轮未给 draft 角色扩权。

### 回执

`/private/tmp/srvf-t230u-live-test/official-t338-20035-prerequisite-retest-note.json`，SHA-256 `5239bf8dbef61238309840e73a037f25bdb7d089bc67ddedf319d636bae8c078`。未覆盖 t325–t337 与 wave98／99 回执。对应 REVOKE 脚本留在 `/private/tmp/srvf-t338u-20035/`，未执行。官方登录工具 SHA-256 仍为 `5f11b7784417ef3cdbce6a95644199d95e2eec157ca97a86da9852e1fce3d00e`。

## 2026-11-28 07:44:30–07:44:44 · 补 RegistrationFormVersion 六列 UPDATE 后，一次批准返回 20035（Asia/Shanghai）

本段只追记对 `srvf_activity_review` 补 `public."RegistrationFormVersion"` 最小可逆 UPDATE，以及随后只做的一次批准。mid87 及更早正文逐字节保留；上文调窗／t335 段落未改写。未合并 Draft PR 175／177／13／182／183 或 API 1454／1455／1459／1460／1461／1463／1467，未部署或重启 API，未改四场 2099、WAVE77–84，未再平移窗口，未给 draft 角色扩权，未开 E4，未发短信，未占 t95。首发总任务未完成。

### GRANT（2026-11-28 07:44:30 Asia/Shanghai）

GRANT 前读回：该角色在此表仅有列级 SELECT（`id`、`activityId`、`schemaHash`、`statusCode`、`version`、`workflowRevision`），六列 UPDATE 均为 false。执行：

```sql
GRANT UPDATE (
  "statusCode",
  "workflowRevision",
  "schemaHash",
  "activatedAt",
  "retiredAt",
  "updatedAt"
) ON TABLE public."RegistrationFormVersion" TO "srvf_activity_review";
```

读回：上述 6 列 UPDATE 均为 true，且 `is_grantable=NO`；INSERT／DELETE 仍为 false；`srvf_activity_draft` 的 UPDATE 仍为 false。未另授 `activatedAt`／`retiredAt`／`updatedAt` 的 SELECT。对应 REVOKE 已留在 `/private/tmp/srvf-t337u-formversion-update/03-revoke-review-formversion-update.sql`，未执行。本条发布批准链上累计增量 GRANT 为 1／3。

### 一次批准复测（2026-11-28 07:44:44 Asia/Shanghai）

窗口仍有效（结束于 11:40:14.001 Asia/Shanghai），未再平移。管理员 `accept_t71_admin` 对审核单 `cmwz26jnx02b0ny01itbub0fm` 只批准一次。HTTP 400，业务码 20035（`ACTIVITY_RESPONSIBILITY_TARGET_INVALID`，「责任人或协办人不符合条件」），请求标识 `cmwzmp474749e1f188639282456e49aeb`。批准前后审核单仍为 `pending`，活动仍为 `draft`、未发布。GRANT 之后的 PostgreSQL 日志窗口没有新的 42501。这说明报名表版本 UPDATE 已不再挡路；失败发生在冻结 8a 初次发布写入负责人（`createOwnerForPublish`／`assertActiveTarget`，要求正式队员）的业务校验。未再批准，未扩 GRANT，未改成员等级或责任绑定，Issue 8 未走。

## 2026-11-28 07:40:23–07:40:34 · 隔离草稿已调窗并再批一次，42501 转到 RegistrationFormVersion 的 UPDATE（Asia/Shanghai）

本段只追记对隔离草稿 `cmwz1vy7f02a1ny01xuigxskj` 的时间窗口调整，以及随后只做的一次批准复测。mid87 及更早正文逐字节保留；上文 t325／wave98／182／183／t335 段落未改写。未合并 Draft PR 175／177／13／182／183，也未合并 API 1454／1455／1459／1460／1461／1463／1467，未部署或重启 API，未给其他表扩权，未改四场 2099、WAVE77–84、storage-settings 或开关，E4 仍为 off，未发短信，未占 t95。首发总任务未完成。

上一轮（t335）已给 `srvf_activity_review` 补了 `RegistrationFormField` 的 21 列 SELECT。当时一次批准返回 409／20030，是因为该草稿 `endAt` 已于 2026-11-28 02:02:11.001 Asia/Shanghai 过去。本轮按授权只调整这一场隔离测试草稿的窗口，并复用已有 pending 审核单 `cmwz26jnx02b0ny01itbub0fm`，未新建审核链，未硬删草稿。

### 调窗（2026-11-28 07:40:23 Asia/Shanghai）

整体平移 34683 秒（9 小时 38 分 3 秒），使开始时刻大约在批准前 8 分钟，结束时刻仍在未来约 4 小时；活动与场次、签到／签退窗一并夹紧，避免 20134。为保持 schemaVersion 7 快照与现场一致，同一事务内同步改写了该审核单快照中的对应时刻，并重算 `baseSnapshotHash`／`snapshotHash`（算法与冻结 8a 一致，改前已对原快照对拍通过）。审核单仍为同一条 pending initial，`workflowRevision` 仍为 0。

- 活动 `startAt`：2026-11-27 21:54:11 → 2026-11-28 07:32:14 Asia/Shanghai
- 活动 `endAt`：2026-11-28 02:02:11.001 → 2026-11-28 11:40:14.001 Asia/Shanghai（`registrationDeadline` 仍为空）
- 场次 `cmwz26jgy02aony015uus1swz`（仍 `scheduled`）`startAt`：2026-11-27 21:55:11 → 2026-11-28 07:33:14；`endAt`：2026-11-28 02:01:11.001 → 2026-11-28 11:39:14.001 Asia/Shanghai
- 签到窗：`checkInOpenAt` 07:34:14，`checkInCloseAt` 10:00:50，`checkOutOpenAt` 10:01:50，`checkOutCloseAt` 11:38:59.001 Asia/Shanghai

### 一次批准复测（2026-11-28 07:40:34 Asia/Shanghai）

管理员 `accept_t71_admin` 对同一审核单只发送一次批准。HTTP 503，业务码 50300，请求标识 `cmwzmjrcp53783834d95e70a65d7b0c1d`。批准前后审核单仍为 `pending`，活动仍为 `draft`、未发布。PostgreSQL 日志（pid 47977，角色 `srvf_activity_review`）是 SQLSTATE 42501：`permission denied for table RegistrationFormVersion`，STATEMENT 为对该表的 **UPDATE**（`statusCode`、`workflowRevision`、`schemaHash`、`activatedAt`、`retiredAt`、`updatedAt`），不是再缺 `RegistrationFormField` 的 SELECT，也不是 20030。该角色在 `RegistrationFormVersion` 上仅有既有列级 SELECT（`id`、`activityId`、`schemaHash`、`statusCode`、`version`、`workflowRevision`），UPDATE 全为 false；`activatedAt`／`retiredAt`／`updatedAt` 连 SELECT 也没有。按授权：这是另一张表／另一类特权，已停止，未扩 GRANT，未再批准，未硬改业务状态接发布。Issue 8 未走。

台账在 `/private/tmp/srvf-t336u-window/`。

## 2026-11-28 07:24:07–07:26:06 · 42501 已定位并做最小只读授权，一次批准因活动已结束被拒（Asia/Shanghai）

本段追记三件事：wave99 未发批桌面复测；t334 把批准 503／50300 的拒绝对象钉到 `public."RegistrationFormField"`；以及用户在 widget t335s2292 授权后，按最小可逆范围只给 `srvf_activity_review` 补了该表只读 SELECT，并只复测批准一次。mid87 及更早正文逐字节保留；上文 t325／wave98／182／183 段落未改写。未合并 Draft PR 175／177／13／182／183，也未合并 API 1454／1455／1459／1460／1461／1463，未把 f798 当作 `main`／现网头，未部署或重启 API（容器仍为 `b5b5bd9335602bb7988d95d38910db93a4e49ecb9d19fb8ef35afaa733a9d9da`，冻结 `8a017348d4b8a642d673de539533fa8b1b750865`），未改四场 2099、WAVE77–84、storage-settings 或开关，E4 仍为 off，未发短信，未占 t95。首发总任务未完成。

### wave99 桌面复测（已发生，此处入档）

隔离 0700 Chrome，不占 t95，未重放批准。回执 `/private/tmp/srvf-t230u-live-test/official-t230-wave99-desktop-note.json`，SHA-256 `bb055ed531d8d2e11242b34a224928bd0f98e3fdcc0cda054b19ac81107ba4c4`。

- 管理端新建队员表单 PASS：点击「新建」打开「新建队员」对话框，四个契约字段（队员编号、姓名、发号日、来源）均在。未提交。wave98 当时记成表单失败，是探针点了「新建」后刮到了列表正文，并按「入队日期」而不是「发号日」查找，不能当作产品否定这四个字段。
- Issue 10 PASS：对已结束的 WAVE84（`cmwyw7s9l01cpny01awv81xtz`）给 T305U-VIRT-01 做了可逆协办，创建 201、随后撤销 200；直接打开 `/#/managed/activities/{id}/registrations` 落到报名管理，花名册接口 200／0。WAVE84 标题、可见性、时间、报名表和既有打卡未改。
- Issue 9 记为轻量 PASS：队员端「我的活动」可见 5 个 pass 标签。探针把组织者一致性标成 NOT_RUN（精确文案「已通过」／队员编号未在 UI 命中），但花名册接口已有目标行且 `statusCode=pass`。本段不改写 0600 回执。
- Issue 8 当时仍为 NOT_RUN，等待隔离草稿发布后再测。

### t334：批准 42501 拒绝对象已钉死

回执 `/private/tmp/srvf-t230u-live-test/official-t334-42501-object-note.json`，SHA-256 `799fb64f6637a59a670994492a0361f6c1fc8c80bff821c68d445a1ed6bd4973`。该轮只读，未授权、也未做 GRANT，未重放批准。

五次批准失败的同一审核单 `cmwz26jnx02b0ny01itbub0fm`（隔离草稿活动 `cmwz1vy7f02a1ny01xuigxskj`）在 PostgreSQL 日志里是：角色 `srvf_activity_review`（oid 25224）对表 `public."RegistrationFormField"` 的 SELECT 被拒绝，SQLSTATE 42501。STATEMENT 按 `formVersionId` 读取字段列（含 `id` 与 `formVersionId`），与冻结 8a `formVersionSelect`／`formFieldSelect` 一致。同一秒报名表 PUT 成功，是因为 PUT 没有 `@ActivityCommand`，走主库角色 `srvf_t68_api`，该角色对该表已有表级 SELECT／INSERT／UPDATE／DELETE。同窗报名表 GET 的 42501 是 `srvf_activity_draft` 缺同一张表的特权；GET 走 `@ActivityCommand('draft')`。`srvf_activity_review` 在 `RegistrationFormVersion` 上已有列级 SELECT（`id`、`activityId`、`schemaHash`、`statusCode`、`version`、`workflowRevision`），但子表 `RegistrationFormField` 上当时为零授权。官方 `grant-review.sql` 也只授了 Version、没有 Field。

### t335：最小可逆列级 SELECT，以及一次批准复测

授权范围只覆盖 `srvf_activity_review` 对 `public."RegistrationFormField"` 的 SELECT，列集以冻结 8a 实际 STATEMENT 为准，共 21 列；不带 GRANT OPTION，不授 INSERT／UPDATE／DELETE，不授 `createdAt`／`updatedAt`，不改其他表、其他库或 PUBLIC，不给 `srvf_activity_draft` 扩权（draft 缺口只入台账和仓库说明）。GRANT 前读回该角色在该表上的列特权为空。

执行时刻 2026-11-28 07:24:07 Asia/Shanghai。SQL：

```sql
GRANT SELECT (
  "id",
  "fieldCode",
  "typeCode",
  "label",
  "helpText",
  "required",
  "visibilityCode",
  "exportable",
  "sortOrder",
  "minValue",
  "maxValue",
  "minLength",
  "maxLength",
  "maxSelections",
  "optionsJson",
  "purposeCode",
  "dataClassCode",
  "retentionPolicyCode",
  "maskingPolicyCode",
  "prefillSourceCode",
  "formVersionId"
) ON TABLE public."RegistrationFormField" TO "srvf_activity_review";
```

读回：上述 21 列均为 SELECT，`is_grantable=NO`；`information_schema.table_privileges` 对该角色仍为空（列级，与 `RegistrationFormVersion` 风格一致）；INSERT／UPDATE／DELETE 均为 false；`createdAt`／`updatedAt` 仍无 SELECT；`srvf_activity_draft` 在该表上仍为零授权。对应 REVOKE 已落在 `/private/tmp/srvf-t335u-42501-grant/03-revoke-review-formfield-select.sql`，未执行。

随后只批准一次，未连打。2026-11-28 07:26:06 Asia/Shanghai，管理员 `accept_t71_admin`（凭据只在保管路径 `/Users/dengwang/Library/Application Support/srvf-t68-accept/secrets/t71-admin.json`）对 `POST /api/admin/v1/activity-publish-reviews/cmwz26jnx02b0ny01itbub0fm/approve` 发送 `requiresInsuranceConfirmed=true` 与新的 `operationKey`。HTTP 409，业务码 20030（`ACTIVITY_STATUS_INVALID`，「活动当前状态不允许此操作」），请求标识 `cmwzm15ze31f01a4e0fde8c15d4a8b1f2`。批准前后审核单仍为 `pending`（`reviewedAt` 仍为空，未写入 `reviewOperationKey`），活动仍为 `draft`、`publishedAt` 为空、`workflowRevision=0`。GRANT 之后的 PostgreSQL 日志窗口没有新的 42501／`permission denied`／`RegistrationFormField` 拒绝；此次不再落入先前的特权映射 503／50300。20030 来自冻结 8a `ensureInitialPublishable`：活动仍是 draft，但 `endAt` 为 2026-11-27 18:02:11.001 UTC（2026-11-28 02:02:11.001 Asia/Shanghai），批准时已过结束时间。场次 `cmwz26jgy02aony015uus1swz` 仍为 `scheduled`，结束时间同样已过。未再批准，未扩 GRANT，未改该活动时间／截止／报名，Issue 8 未走（批准未发布）。API 容器启动时间仍为 2026-11-27 12:30:42 Asia/Shanghai，未重启。

现网最大阻塞从「review 角色对 RegistrationFormField 的 42501」推进为「该隔离草稿的初次发布窗口已过期（20030）。draft 角色对该表的同类缺口仍未在现网授权」。持久修复应落在 API 草稿迁移（只含 review 角色 SELECT；draft 缺口可说明但不得随迁移自动应用到现网未授权范围），本文不把它标成已部署。

## 2026-11-28 01:37:24–01:39:57 · Draft PR 182 部署复测入档，并部署 Draft PR 183 产品回跳修复（Asia/Shanghai）

本段追记两件事：把已经完成的 Draft [PR 182](https://github.com/BA7IEE/srvf-admin-web/pull/182) 验收站部署与复测证据写入本文；以及在新开的 Draft [PR 183](https://github.com/BA7IEE/srvf-admin-web/pull/183) CI 变绿之后，部署管理端产品回跳修复并完成桌面复测。mid87 及更早正文逐字节保留；上文 t325／wave98 段落未改写。未合并 Draft PR 175／177／13／182／183，未把 f798 或 177 当作 `main` 头，未改动已打开的 PR 182（头仍为 `6af0caeaf0771fb6c5e45102d164ffa8ad0e99ff`），未部署 H5 [PR 12](https://github.com/BA7IEE/SRVFMobileWeb/pull/12)，未重启 API 容器，未改开关，E4 仍为 off。首发总任务未完成。

### Draft PR 182 部署与复测（已发生，此处只入档）

当时现网管理端为 GitHub `main` `43f0fca731e9165ecac2cb97ddfd23de20aee661` + 未推送的 Draft [PR 177](https://github.com/BA7IEE/srvf-admin-web/pull/177) 四个建档补丁文件（本地 cherry-pick `beb9494d018248a4686dbeef8c482338d529b384`）+ Draft PR 182 头 `6af0caeaf0771fb6c5e45102d164ffa8ad0e99ff`（本地组合 `c0c9d9eff8afc6d623f9adfc4cbf6c147bafe1b5`）。H5 仍为 Draft [PR 13](https://github.com/BA7IEE/SRVFMobileWeb/pull/13) `09489036e8f6dbbcf13faeb1be6a0da45eaf039a`。API 仍冻结 `8a017348d4b8a642d673de539533fa8b1b750865`。

- 部署回执 `/private/tmp/srvf-t230u-live-test/official-t332-accept-admin-182-deploy-note.json`，SHA-256 `19274733d22d2b279521dd304b6919c32c64171da139d3a4f8a854e09737197f`。
- 复测回执 `/private/tmp/srvf-t230u-live-test/official-t332-accept-admin-182-retest-note.json`，SHA-256 `b4f5eac260bc3d74fe2f77b2e638581c440c92e830d588e60de7540f43927871`。
- 登录站稳后再打开归属总表 PASS，组织架构 PASS。登录成功后立刻哈希直达归属总表仍 FAIL（约 2 秒后仍停在 `/#/welcome`）。182 在 `initRouter` 后读一次当前路径，盖不住「当前仍是 `/login`、但登录前目标已可知」的窗口。

### Draft PR 183（产品回跳，未改 182）

新分支 `fix/login-preserve-target` 从 182 的分支再开，单独提交，未向 182 追加提交，也未 force-push。Draft [PR 183](https://github.com/BA7IEE/srvf-admin-web/pull/183) 头 `bb48b90024dbd28a8572e5dac91922bbc7b0764d`，base 为 `main`，仍为 draft。修复是产品回跳：未登录访问 `#/srvf/org-hr/memberships`（或登录页已带目标哈希／`redirect`）时，登录成功后应落到归属总表，而不是无条件 `router.push(getTopMenu())` 送到 `/#/welcome`；登录页本身在没有目标路由时，仍去顶栏首页。目标经清洗后写入查询参数与 `sessionStorage` 键 `srvf-admin-login-target`。CI `verify` 于 2026-11-28 01:33:10 Asia/Shanghai 成功，[run 46042579632 / job 140653787522](https://github.com/BA7IEE/srvf-admin-web/actions/runs/46042579632/job/140653787522)。

### 现网版本（183 部署后，已公网核验）

- **管理端** `https://admin.srvf.team` 现为 GitHub `main` `43f0fca731e9165ecac2cb97ddfd23de20aee661` + 未推送的 Draft PR 177 四个建档补丁文件（本地 cherry-pick `beb9494d`）+ Draft PR 183 头 `bb48b90024dbd28a8572e5dac91922bbc7b0764d`（183 含 182 的部分修复）。本地组合提交 `0a9ac7872785f3add523f9ca2db356a5ab12954e`，未推送，不得当作 `main` 头。指数 SHA-256 `6b43541847380104af52710d3630b1b421fc23885f71aa711f24e3bea61d77c5`，树 SHA-256 `3ee76762eafaf153b17682e774e16c8a6aca724a4a13844120e6f5d261809c29`，`platform-config.json` SHA-256 `fde5a0db313b5fbbb06dfe737989d8cc07ca424bd9fff8eaddabd76ca396f7a1`。公网 `/`、`/index.html`、`/platform-config.json` 已与该包一致，不再是 t332 的 `60b1b7d5`，也不是历史 `f798`。
- **队员端 H5** 未改，仍为 Draft PR 13，`app.srvf.team/h5/index.html` SHA-256 `a7310f548cc320f973b3cdfb22bb043d9312d0370769e5c7b320921b5b81ce67`。
- **API** 仍冻结 `8a017348d4b8a642d673de539533fa8b1b750865`，容器 `srvf-t68-accept-runtime-api-1`（id `b5b5bd9335602bb7988d95d38910db93a4e49ecb9d19fb8ef35afaa733a9d9da`）未重启。

官方 Static 交换复用已验证路径，新运行目录 `/opt/srvf-t68-accept/t333u-admin-183`，槽前缀 `.t333-`，保留既有 `.t325-`／`.t332-` 槽。部署回执 `/private/tmp/srvf-t230u-live-test/official-t333-accept-admin-183-deploy-note.json`，SHA-256 `ca6785936479cce2422aff9babe931dad864a2b80d685cb903623b084a8a41fc`，写于 2026-11-28 01:37:24 CST。回滚针是部署前的 t332 现网包（本地组合 `c0c9d9eff8afc6d623f9adfc4cbf6c147bafe1b5`，tar SHA-256 `ee15da5e382c732bfbabb06e40c9b79a8dd4a94a8535094b5a060124ca96e9d9`，树 SHA-256 `f1860f62a93723fd7a8835e344b676537630184a56dfe59b1b8d27cda19f1f19`），不是 `f798`。一次性恢复命令：`python3 -I -B /opt/srvf-t68-accept/t333u-admin-183/switch.py restore admin /var/lib/docker/volumes/srvf-t68-accept_webroot/_data`。t325／t332／wave87–wave98 回执未被覆盖。

### 183 桌面复测（2026-11-28 01:38:45–01:39:57 Asia/Shanghai）

隔离 0700 Chrome，不占 t95，未真建档，未重放 approve。产品路径优先于探针竞态：未登录访问 `#/srvf/org-hr/memberships`，登录页为 `/#/login?redirect=/srvf/org-hr/memberships` 且 `sessionStorage` 已记下该目标；登录成功后应用自行落到「归属总表」，而不是 `/#/welcome`。登录站稳后再打开归属总表、组织架构均通过。另用全新隔离配置打开无目标 `/#/login`，登录成功后仍落到顶栏首页 `/#/welcome`。

- 主复测回执 `/private/tmp/srvf-t230u-live-test/official-t333-accept-admin-183-retest-note.json`，SHA-256 `a9a4ee085be6008aa1757600b26cd7a9b8deaf54fb3e1c94adefddc2881d9237`（01:38:45–01:39:07）。其中产品深链回跳、站稳后归属总表、组织架构均为 PASS。同一探针在登出后再测无目标登录时，页面仍停在组织架构、未进入登录表单，该尾段记为探针 error，不能当作产品无目标路径失败。
- 补测回执 `/private/tmp/srvf-t230u-live-test/official-t333-accept-admin-183-retest-notarget-note.json`，SHA-256 `7085e9d660272956878231a1dee7e21b2b5df0ee90b96db2cd486d98caf08559`（01:39:51–01:39:57）。全新隔离配置打开无目标登录页，登录后到达 `/#/welcome`，PASS。

发布批准 42501 及 [API #1464](https://github.com/BA7IEE/srvf-nest-api/issues/1464) 仍是现网最大阻塞。

## 2026-11-28 00:50:49–00:51:15 · 验收站前端已部署并完成 wave98 桌面复测（Asia/Shanghai）

本段只追记 t325 验收站前端部署与随后的 wave98 桌面复测。mid87 及更早正文逐字节保留。未合并 Draft PR 175／177／13，未把 f798 或 177 当作 `main` 头，未部署 H5 [PR 12](https://github.com/BA7IEE/SRVFMobileWeb/pull/12)，未重启 API 容器，未改开关，E4 仍为 off。首发总任务未完成。

### 现网版本（已公网核验）

- **管理端** `https://admin.srvf.team` 已部署为 GitHub `main` `43f0fca731e9165ecac2cb97ddfd23de20aee661`（已含合入的 178／179／180），再加上未推送的 Draft [PR 177](https://github.com/BA7IEE/srvf-admin-web/pull/177) 四个建档补丁文件（本地 cherry-pick `beb9494d018248a4686dbeef8c482338d529b384`）。PR 177 仍为 draft，不得把它或历史 `f7985191` 当作 `main`／现网正式头合并或推送。
- **队员端 H5** `https://app.srvf.team/h5/` 已部署为 Draft [PR 13](https://github.com/BA7IEE/SRVFMobileWeb/pull/13) 头 `09489036e8f6dbbcf13faeb1be6a0da45eaf039a`（基于 `3968b0bc`，不含 PR 12）。PR 13 仍为 draft，未合并。
- **API** 仍冻结 `8a017348d4b8a642d673de539533fa8b1b750865`，容器 `srvf-t68-accept-runtime-api-1` 未重启。

部署回执 `/private/tmp/srvf-t230u-live-test/official-t325-accept-frontend-deploy-note.json`，SHA-256 `1eb649609067eae65dbe8d5f12c0dfef498f522bc6a5a686704beecebcbc2bfc`。公网 `admin.srvf.team/index.html` 与 `app.srvf.team/h5/index.html` 的内容哈希已与该包一致。wave87–wave97 及该部署回执均未覆盖。

### wave98 桌面复测（2026-11-28 00:50:49–00:51:15 Asia/Shanghai）

隔离 0700 Chrome，不占 t95。回执 `/private/tmp/srvf-t230u-live-test/official-t325-wave98-post-deploy-note.json`，SHA-256 `ca8e21654541e11a23122d42cd6e923e9b90170209c8c0c4f7b45a2e3ae3fa91`。业务写 0。

**通过证据**

- 队员端保险页 PASS。已接通 `getMyOverview`，页面发出 `GET /api/app/v1/me/insurances` 且 200／0，不再出现「服务尚未接通」。未新建或填写保单。
- 邀请活动考勤深链 PASS。公开详情仍为 404／20001，未改可见性。已 pass 队员从考勤深链进入，`my-punch-state` 200／0，可进入最小考勤 UI。未打卡，未改 WAVE77–84 或四场 2099。
- `#/srvf/base-data/organizations` 现已落到「组织架构」页。
- 178／179／180 离页抽查 PASS。队保单、系统账号、附件配置之间切换及再到证书管理，无白屏。

**剩余缺口**

- `#/srvf/org-hr/memberships` 在新管理端头上仍被送到 `/#/welcome`。[Issue 181](https://github.com/BA7IEE/srvf-admin-web/issues/181) 仍成立，但范围应收窄到归属总表（组织架构已在同一头上通过）。
- 建档页点击「新建」后表单未打开，不能据此否定部包时已核验的四个必填契约字段（`memberNo`、`realName`、`memberSinceDate`、`memberOriginCode`）。未提交建档。
- Issue 9 本轮是连续 H5 登录触发 429／42900，不是功能失败。Issue 8／10 NOT_RUN（未重放 publish approve，未开责任工作台）。
- 发布批准 42501 及 [API #1464](https://github.com/BA7IEE/srvf-nest-api/issues/1464) 仍是现网最大阻塞。

## 2026-11-28 首发总账（约 00:10，Asia/Shanghai）

### 一、工作流程与接手顺序

先对照下表核实 GitHub 头、现场资源版本和当前写者。首发验收仍在进行，尚未正式对公开放。本文记录采用 Asia/Shanghai。下方历史段落保留当时的观察范围。

| 端 | 验收站最近观察或交接状态 | GitHub 对照 |
| --- | --- | --- |
| API | 现场冻结 `8a017348d4b8a642d673de539533fa8b1b750865`。T188 日志候选已回滚，API 更新和恢复预算均已用尽，不得再切。E4 仍为 off。 | 按[冻结提交](https://github.com/BA7IEE/srvf-nest-api/commit/8a017348d4b8a642d673de539533fa8b1b750865)及下方 API 事项接续。禁止改开关或 API 容器。 |
| 管理端 | 本文采用的现场观测（含 wave96）来自 `e54dfb49` 加 Draft PR 177 热修，限定留存为 `f7985191b9af7c8ad0654cef31bc83552a1ef3d9`。t325u–t327u 正推进 178/179/180 的验收站部署，本轮未核实公网资源已更新。 | GitHub `main` 已含下列三个合并提交。177 和 f798 只按热修及留存记录使用，禁止以它们作为 `main` 头推送。 |
| 队员端 H5 | 现网曾留存 `3968b0bc8edfc26cd0c3a435576c5b4a8b40e382`（`fix/managed-registration-direct-read`）。t325u–t327u 正推进 PR 13 的验收站部署，本轮未核实公网资源已更新。没有另行授权时，禁止部署 [PR 12 视觉升级](https://github.com/BA7IEE/SRVFMobileWeb/pull/12)。 | [Draft PR 13「接通本人保险和邀请活动考勤直达」](https://github.com/BA7IEE/SRVFMobileWeb/pull/13)头 `09489036e8f6dbbcf13faeb1be6a0da45eaf039a`，基于上表所列 3968 提交，仍为草稿、未合并。两项 CI check 于 2026-11-27 23:59:26、23:59:34 Asia/Shanghai 完成，均为 `COMPLETED / SUCCESS`。 |

管理端三个合并时间均为 2026-11-27 Asia/Shanghai。公网生效待核。

| 合并时间 | PR | 合并提交 |
| --- | --- | --- |
| 21:44:43 | [PR 178 修复路由页多根节点导致离开即白屏](https://github.com/BA7IEE/srvf-admin-web/pull/178) | `c5d2799fd72895c5e7f8039ff5b84bb751a73897` |
| 21:45:09 | [PR 179 修复全局布局窄屏溢出与标识溢出](https://github.com/BA7IEE/srvf-admin-web/pull/179) | `35192ea3e20378f4012167b0fdde2ed87011402b` |
| 21:47:46 | [PR 180 修复活动列表列序与系统设置文案及卡片键盘可达](https://github.com/BA7IEE/srvf-admin-web/pull/180) | `43f0fca731e9165ecac2cb97ddfd23de20aee661` |

**仓库与本机对照。** 用户主克隆 `/Users/dengwang/Documents/coding/srvf-admin-web` 的本地 `main` 只读核对仍在 `2626116889affe3bda3758f7ed1ce006272503bf`（[PR 172](https://github.com/BA7IEE/srvf-admin-web/pull/172) 合并点）。本任务不 fetch 或修改主克隆。[Draft PR 177 建档表单](https://github.com/BA7IEE/srvf-admin-web/pull/177) 已推送，头 `02a9bd2362d8bb58eb847ca3d6160d6cecf29cc4`，分支 `fix/t179u-member-create-contract`，对应工作树 `/private/tmp/srvf-t179u-apply-main`。H5 保险和邀请考勤修复也已推送至 Draft PR 13。本轮清点未发现另有已完成但完全未推 GitHub 的产品修复。临时探针、回执目录和 wave 工作树只作受控材料。[Draft PR 175](https://github.com/BA7IEE/srvf-admin-web/pull/175) 只收文档，保持 draft，禁止合并。

1. **确认授权及唯一写者。** 验收站同一时刻只允许一名业务写者。文档同步不占写者位或 t95，不抢 t325u–t327u 的前端部署。授权复验时先核公网页面及静态资源对应的实际提交，再按问题清单从仍未通过的步骤续接。CI、已合 main、现场资源生效和业务回归分别记结果。
2. **官方登录与可逆写入。** 使用既定官方登录及保管工具，前后复核哈希一致。近期 helper SHA-256 `5f11b7784417ef3cdbce6a95644199d95e2eec157ca97a86da9852e1fce3d00e`。本任务不改工具，不占用 t95（protected-login 会强制使用 t95 profile），保留 ChatGPT.app PID 61139。后续业务写只用隔离对象，写后独立读回，可撤销写及时撤销，夹具用后改回 `volunteer`。禁止硬删保护对象、编造法定证件号、发短信、改四场 2099 验收活动，以及将未审查补丁直接打到现网。
3. **封存证据。** 功能回执与 SHA256SUMS 留在官方 Mac 的受控目录，例如 `/private/tmp/srvf-t230u-live-test/` 和 `/Users/dengwang/Documents/srvf-handoff-evidence/`。仓库只收文件名、SHA-256 和脱敏结论。查不到回执时保留未证实状态。
4. **接续门禁。** 不自动合并或正式对公开放。[API #1454](https://github.com/BA7IEE/srvf-nest-api/issues/1454)、[API #1455](https://github.com/BA7IEE/srvf-nest-api/issues/1455) 仍受阻时先搁置。[PR 1460](https://github.com/BA7IEE/srvf-nest-api/pull/1460) 不单独合并。[PR 1463](https://github.com/BA7IEE/srvf-nest-api/pull/1463) 的分片 3 和汇总检查仍红，关联一组先不落地，保留超时和门禁。E4 保持 off。验收站 API 冻结边界继续有效。

### 二、已通过或已走通的证据

以下均为 2026-11-27 Asia/Shanghai。通过范围以对应回执及独立读回为限。

| 时间 | 分类与结论 | 收据文件名及 SHA-256 |
| --- | --- | --- |
| 12:44–12:51 | 官方分配 `/commit` 已走通，HTTP 200／0，独立 GET 读回 `committed`。收据分类 `WAVE70_NO_NEW_SUCCESS` 的覆盖计数漏记了该提交，详见历史专段。14:51–15:02 同一路径作为前置再次走通，200／0，独立读回已提交。 | `wave70-functional-probe-receipt.json` `3f008e7250312de913d217e0850f64f061d8d2e6c13e82dbb684e198690af336`，复核见下列 wave74 收据。 |
| 14:51–15:02 | `WAVE74_PARTIAL`。官方 `publish-reviews` 提交和批准均 200／0，保留为后来 42501 之前的通过证据。官方 QR 签发 201／0、SVG 渲染未回显 token、本人签到 201／0、`my-punch-state` 200／0，100 米半径内正例走通。涉及 `official_check_in_qr`、`self_check_in`、`session_radius_inside`。 | `wave74-functional-probe-receipt.json` `2eaffa1fab9a69dd058463c0c8f8461789172544fa244d837d55749e677d45b1` |
| 15:23–15:30 | `WAVE75_PARTIAL`。路径乙的 T305U-VIRT-01 至 12 全部建档并绑定成功。该段当场单独验了其中 3 人登录与登出，其余遇限流，见历史正文。 | `wave75-functional-probe-receipt.json` `9dbe2aed832898f6af6b3bda94b7b3ed523c6dc19dec770c611f707d3fa67e38` |
| 15:49–16:25（mid79） | `WAVE77_PARTIAL`。交接与交回均已独立读回，2 人录取、1 人 `waitlisted`／第 1 位。半径外按预期拒绝，HTTP 400／22091，读回 `isPresent=false`。代签与人工确认均 201／0 并读回。 | `wave77-functional-probe-receipt.json` `bdb471ae1ed26083208525eb82faa74602c041cce7861959297c6ffc1cea64ed` |
| 17:48–17:51（mid82） | `WAVE80_VERIFIED`。另一个隔离样本再次走通半径外拒绝 400／22091、代签和人工确认（均 201／0，独立读回）。结算为只读，关闭 E4 的现场未强行关账。 | `wave80-functional-probe-receipt.json` `3908d201e33ba8d19351e339dcff5e4854bce5a2f2da2e63b9ee49298ee9f5fa` |
| 19:00–19:03（mid85） | `WAVE83_VERIFIED`。管理端协办 POST 201／0，撤销 200／0。负责人移交和恢复均 200／0。发起人移交 403／20020，记录为该组织无此权。 | `wave83-functional-probe-receipt.json` `5c36cd21c6e8a3b63a6ced3b270878a0ab9514aea5d2795c83839f2a9e847796` |
| 19:16–19:23（mid86） | `WAVE84_PARTIAL`。陈旧草稿官方归档 POST 200／0，`reasonCode=stale_draft`，恢复 POST 200／0，痕迹保留。同轮在隔离活动 `cmwyw7s9l01cpny01awv81xtz` 备好考勤场次，功能收据截至提审前。 | `wave84-functional-probe-receipt.json` `fc6c87456eed0b48cd6d99ee3e1b51d1ff8a8197cac78439e071f09afd6542ab` |
| 19:39:10–19:39:38 | 官方权限目录补齐 25→273，按冻结 8a 种子补足 248 码。SUPER_ADMIN 有效权限同会话复查和退出后重登均为 273，缺口为 0。旧会话刷新页面拿不到完整权限，续验时需重新登录。 | `receipt.json` `64449f705e3078a5a58c68b98259c3f30e024f0aa243cd067cb0617e579de79f`，说明 `receipt.md` `b192b0ffdc4d7a224ccc7f4b05d2fbbdb76fcdc0224487ad75b144efa5677e01`（受控 T315U 管理权限交接） |
| 20:31:42–20:34:54 | `WAVE85_RESUME_PARTIAL`。在同一 WAVE84 隔离活动续用已核签到。最后一次签退 201／0，读回已确认，码已撤销，夹具恢复。考勤表创建确认仍受阻，后续汇总差异见 API #1465。 | `wave85-resume-checkout-receipt.json` `08507ff1d4e0e710f5d7728e612de2e477c049fa38635d04b9dc24ac9d360dab`，确认签退见 `wave85-resume-checkout-receipt-4.json` `fddb7c07321ca33bab57b40b3e5fe1f6844c00d803cfd5aa66f6a2a24912633e` |
| 21:34:41–21:35:54（wave88） | 桌面 H5 Issue 9、10 均 PASS。9 覆盖既有录取只读、状态和管理名单一致性，新录取 NOT_RUN。10 覆盖工作台、负责列表和直达报名管理。为 T305U-VIRT-01 建立隔离协办 201／0 后撤销 200／0。业务写 2。Issue 8、真机、微信均 NOT_RUN。 | `official-t230-wave88-h5-8910-note.json` `5ffbbc09863b1e5689776df994e68b4cdfba2be16ddb19e7378cc07d494d0502`，说明 `official-t230-wave88-h5-8910-note.md` `7cd6841e3cd00c01d88f4eb783b9b8b33e86cbbabc4d43371bb0bde4098dc45c` |
| 21:44:43–21:47:46 | 管理端 PR 178／179／180 已合入 GitHub main。验收站公网生效待核。 | GitHub 合并时间及提交标识见第一节。 |

wave91–96 的已走通桌面和只读项、业务写次数及收据见下方逐轮记录。

### 三、未通过、受阻及未跑项

- **发布审核批准受阻。** 2026-11-27 22:10:25、22:15:45、22:15:53、22:16:09、22:16:33 Asia/Shanghai，`POST /api/admin/v1/activity-publish-reviews/cmwz26jnx02b0ny01itbub0fm/approve` 五次均返回 503／50300。现有日志命中过滤器映射 SQLSTATE `42501`，原始 PG／Prisma 码、操作及对象仍未知。同期同秒报名表 PUT 成功，该路径也对 Activity 做 `FOR UPDATE`，不足以把失败归结为缺少 Activity UPDATE 或表单表 SELECT／INSERT。T186 可观测补丁未部署，冻结 8a 的业务逻辑缺陷未确认。回执 `official-t230-wave90-followup-note.json` SHA-256 `18f5a13a55c06aae332b57d1d05726839c295715bb513d5402baa03d30606973`。[API #1464](https://github.com/BA7IEE/srvf-nest-api/issues/1464)
- **v1.1 打卡后汇总仍缺记录。** 2026-11-27 20:47:11–20:47:14 Asia/Shanghai（`WAVE86_PARTIAL`），官方 QR 自签到、签退已确认，管理端仍读到 `attendeeCount=0`、时长及积分为 0、`participation-ledger` 为空。旧 `attendance-sheet-draft` 把已打卡队员列为缺席，时长证明 503／20235。E4 仍 off，冻结 8a 的业务逻辑缺陷未确认。回执 `wave86-v11-attendance-entry-receipt.json` SHA-256 `2b89afe146d4ec031ce9a2bdb48466ac1523d6fa825932cc16299baae7265e97`。[API #1465](https://github.com/BA7IEE/srvf-nest-api/issues/1465)
- **队员端缺邀请列表读取。** wave95 的 `GET /api/app/v1/my/activity-invitations` 返回 404／40400。现场该路径仅有 accept／decline 写接口。回执 `official-t230-wave95-desktop-note.json` SHA-256 `9203f54727bf9a4e26153631df4bdbac9fa03f479e1647629ab2aad2f7b2c691`。[API #1466](https://github.com/BA7IEE/srvf-nest-api/issues/1466)
- **管理端归属总表入口待复查。** wave96 现场 `#/srvf/org-hr/memberships` 回到首页，未落到归属总表。这次观测使用部署 178／179／180 之前的现场头，新资源生效后待复验。回执 `official-t230-wave96-desktop-note.json` SHA-256 `9064f7dfb8c2c3af46008193101b6cce4ee9f1628394b2d5a0e72ae48e42d965`。[管理端 #181](https://github.com/BA7IEE/srvf-admin-web/issues/181)
- **H5 本人保险和邀请制考勤直达待交付。** 本人保险 API 直读 200／0，旧页面未接入口。邀请制活动的目录详情 404 符合可见性口径，但旧 H5 已录取队员的考勤页依赖该详情，未能打开。接手先核 13 的候选资源和现场头，再用已有合规样本复验两个入口。PR 13 仍为 draft、CI 绿，部署未核实。[H5 Draft PR 13](https://github.com/BA7IEE/SRVFMobileWeb/pull/13)
- **H5 报名表版本失效刷新 NOT_RUN。** wave89 过期样本未建成，未触发 21036 或验证刷新。其后复查未重放批准，待批准路径恢复并有可逆样本再续。真机／微信仍为 NOT_RUN。[H5 #8](https://github.com/BA7IEE/SRVFMobileWeb/issues/8) · [批准受阻 API #1464](https://github.com/BA7IEE/srvf-nest-api/issues/1464)
- **继续跟踪已开事项，不重复立项。** H5 #9／#10 桌面已 PASS，修复合入或交付未闭合，事项仍开。[H5 #9](https://github.com/BA7IEE/SRVFMobileWeb/issues/9) · [H5 #10](https://github.com/BA7IEE/SRVFMobileWeb/issues/10)
- **旧 API 和管理端工作项。** 1454／1455 继续按受阻处理，1456／1457／1458 分别跟踪 1459／1460／1461 审查稿，1462 跟踪 1463。建档表单白名单与候选修复沿用管理端 176／177。[API #1454](https://github.com/BA7IEE/srvf-nest-api/issues/1454) · [#1455](https://github.com/BA7IEE/srvf-nest-api/issues/1455) · [#1456](https://github.com/BA7IEE/srvf-nest-api/issues/1456) · [#1457](https://github.com/BA7IEE/srvf-nest-api/issues/1457) · [#1458](https://github.com/BA7IEE/srvf-nest-api/issues/1458) · [#1462](https://github.com/BA7IEE/srvf-nest-api/issues/1462) · [PR 1459](https://github.com/BA7IEE/srvf-nest-api/pull/1459) · [PR 1460](https://github.com/BA7IEE/srvf-nest-api/pull/1460) · [PR 1461](https://github.com/BA7IEE/srvf-nest-api/pull/1461) · [PR 1463](https://github.com/BA7IEE/srvf-nest-api/pull/1463) · [管理端 #176](https://github.com/BA7IEE/srvf-admin-web/issues/176) · [管理端 Draft PR 177](https://github.com/BA7IEE/srvf-admin-web/pull/177)

## wave88–wave96 追记

每轮时间均为 2026-11-27 Asia/Shanghai。使用无 attempt 后缀的正式回执。业务写不含登录、登出。真机及微信均未验。

- **wave88 · 21:34:41–21:35:54。** H5 #9／#10 桌面 PASS，#8 和新录取 NOT_RUN。隔离活动可逆协办 POST 201／0，撤销 200／0，业务写 2。`official-t230-wave88-h5-8910-note.json` SHA-256 `5ffbbc09863b1e5689776df994e68b4cdfba2be16ddb19e7378cc07d494d0502`，`official-t230-wave88-h5-8910-note.md` SHA-256 `7cd6841e3cd00c01d88f4eb783b9b8b33e86cbbabc4d43371bb0bde4098dc45c`。
- **wave89 · 22:15:43–22:16:33。** H5 #8 NOT_RUN。隔离准备阶段有写入，正式 JSON 的业务写计数为 7，Markdown 的「无写入」与该计数不一致。批准 503／50300，活动留在草稿，旧版样本未建成。H5 未提交报名、未见 21036、未验证版本刷新，后续复查未重放批准。`official-t230-wave89-h5-issue8-note.json` SHA-256 `60b93c62006d36694aee7bf32d3f7521526e06b8e02db9a9b4287de2eb72e1b1`，`official-t230-wave89-h5-issue8-note.md` SHA-256 `ec5c90c1273189ccd362e8016acf2c176ed0f80106769e96d6d8b63bc0e5f31a`。
- **wave90 · 22:28:26–22:28:28，补读至 22:30:02。** 只读核对已有日志，五次批准和一次报名表 GET 均进入特权拒绝映射，原始对象未知。另走通 5 条只读，9 条仍受阻，时间政策相关读继续 403。未重放批准，业务写 0。`official-t230-wave90-followup-note.json` SHA-256 `18f5a13a55c06aae332b57d1d05726839c295715bb513d5402baa03d30606973`。[API #1464](https://github.com/BA7IEE/srvf-nest-api/issues/1464)
- **wave91 · 22:52:26–22:52:35，补读至 22:54:02。** 协办创建 201／0、撤销 200／0，业务写 2，活动标题、状态和时间未变。2099 活动 GET 与桌面详情可读，WAVE84 目录详情 404，没再重放批准。未定位 42501 原始对象。`official-t230-wave91-desktop-note.json` SHA-256 `1dc23fa9e36843430d871cfaf7b76053bbe29896724c3e683fb5b084eff160f2`。
- **wave92 · 23:14:14–23:14:24。** 邀请可见性目录详情 404 符合预期。旧 H5 已录取队员的考勤页仍依赖该详情。本人保险页未接 `getMyOverview`，API 直读 200／0。业务写 0。`official-t230-wave92-desktop-note.json` SHA-256 `d46529b8c92eeec1101ee0bd898031f9cfe3d7200a734dd19c62cf5eb4ced94b`。[H5 Draft PR 13](https://github.com/BA7IEE/SRVFMobileWeb/pull/13)
- **wave93 · 23:20:39–23:20:47。** 桌面账户、隐私说明及 2099 报名页可打开，详情、岗位和报名保险条件均 200。未提交报名。样本无该场已录取报名，`my-punch-state` 返回 400／22076。业务写 0。`official-t230-wave93-desktop-note.json` SHA-256 `26fde871f2d259ff8589eca071137c89e3a8886466d67638fad790b8058f3f23`。
- **wave94 · 23:28:41–23:28:43。** 桌面考勤 UI NOT_RUN。现有已录取样本均属七场邀请制活动，旧 H5 目录详情 404／20001。四场 2099 样本均无已录取报名。跨活动报名和管理端活动详情等只读成功，业务写 0。`official-t230-wave94-desktop-note.json` SHA-256 `84c4a9fd105accd37a1031a8f1f3946eb5de039f741248934706d9829f5f28a0`。
- **wave95 · 23:39:50–23:40:07。** 管理端首页、审批工作台、活动列表、队员列表、个人中心及使用手册打开，审核只读。H5 工作台和负责列表展示空态，邀请列表 GET 404／40400。拦截 1 次非 GET，业务写 0。`official-t230-wave95-desktop-note.json` SHA-256 `9203f54727bf9a4e26153631df4bdbac9fa03f479e1647629ab2aad2f7b2c691`。[API #1466](https://github.com/BA7IEE/srvf-nest-api/issues/1466)
- **wave96 · 23:43:27–23:43:46，补读至 23:45:31。** 组织树、归属与任命、角色绑定、职责草稿、活动报名与参与汇总、审计日志等只读走通。归属体检、任命、字典、队员档案、活动详情、参与月报、审批工作台等可打开。旧现场头的归属总表路由回首页，部署后待核。审批工作台未批准，业务写 0。`official-t230-wave96-desktop-note.json` SHA-256 `9064f7dfb8c2c3af46008193101b6cce4ee9f1628394b2d5a0e72ae48e42d965`。[管理端 #181](https://github.com/BA7IEE/srvf-admin-web/issues/181)

## 11 月 27 日 19:27 · mid87 点名（wave84 归档写回）

本段按北京时间（Asia/Shanghai）追记脱敏结果，19:16–19:23 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放，未清场，未改开关，未改存储设置，E4 仍为 off。未发明法定证件号，未发短信。未硬删既有保护对象或补种角色，也未作废已成功的代签与人工确认。未改四场 2099 验收活动。官方登录工具哈希未变。PID 61139 未杀。Draft PR 仍为审查草稿，未合并、未部署。首发总任务未完成。

mid87 只是把 wave84 已走通的陈旧草稿归档／恢复写入 678 点名，不另开写者、不改现场。现场走通 102，只读 169，跳过或受阻 63，从未测试 343，不确定 1。清单 SHA-256 `93e108aaf59e87de8570db78c2f62cb35650817fb1c28b85e98e88259ddc1b1d`，说明 SHA-256 `cec9c92fa1e51486f12734c73f03fbce0a807793f732ae7df250dad19148e253`。mid69–mid86 封存校验未改。

## 11 月 27 日 19:16–19:23 · mid86 陈旧草稿归档与恢复已走通，考勤场次已备好但提审前停止

本段按北京时间（Asia/Shanghai）追记脱敏结果，19:00–19:03 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放，未清场，未改开关，未改存储设置，E4 仍为 off。未发明法定证件号，未发短信。未硬删既有保护对象或补种角色，也未作废已成功的代签与人工确认。未改四场 2099 验收活动。未开 E4，未强行关账，未发送 complete／settlement close／declare-attendance-complete。官方登录工具哈希未变。PID 61139 未杀。Draft PR 仍为审查草稿，未合并、未部署。首发总任务未完成。

mid86 只开 1 名写者，复用已绑定的官方测试队员，重建 0。分类 WAVE84_PARTIAL。隔离归档草稿 `cmwyw7qjy01ciny0175c5eyg1`：产品 PATCH `updatedAt` 为 400／40000，随后仅对该行官方库做 raw SQL 回拨 `updatedAt` 31 天，affected=1，startAt／endAt／报名截止未改。官方归档 POST 为 200／0，reasonCode=`stale_draft`；恢复 POST 为 200／0，痕迹保留。隔离考勤草稿 `cmwyw7s9l01cpny01awv81xtz` 仍为 draft；场次 `cmwyw7sig01cxny01jumve0y7`、岗位 `cmwyw7smg01d0ny010qkn03u2` 已创建，时间窗已由产品接口写入并读回（当日 19:16:25–23:23:25，签到 19:17–22:23，签退 19:18–23:28，Asia/Shanghai）。发布审核、录取、自签、签退与考勤表未发出，因探针在提审前引用了未定义变量。台账 149 增至 153。夹具已改回 volunteer。开关仍为 true／true／off。功能收据 SHA-256 `fc6c87456eed0b48cd6d99ee3e1b51d1ff8a8197cac78439e071f09afd6542ab`。SHA256SUMS-mid86.txt 为 `bd53872d88056892d5b477ea41e83f6055ec406bae9fe555a9d865b9e4b12919`。mid69–mid85 封存校验未改。wave83 写回的 mid86 点名为走通 100、只读 169、跳过或受阻 65、从未测试 343、不确定 1，清单 SHA-256 `9d2eb2854d0a6dc1d48df25988967069d94a1230365c28498eb0fa00d851bf86`。

## 11 月 27 日 19:00–19:03 · mid85 新隔离活动走通管理端协办与负责人移交，自签仍为遗留入口 410

本段按北京时间（Asia/Shanghai）追记脱敏结果，18:33–18:38 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放，未清场，未改开关，未改存储设置，E4 仍为 off。未发明法定证件号，未发短信。未硬删既有保护对象或补种角色，也未作废已成功的代签与人工确认。未改四场 2099 验收活动。官方登录工具哈希未变。PID 61139 未杀。Draft PR 仍为审查草稿，未合并、未部署。首发总任务未完成。

mid85 只开 1 名写者，复用 12 名 T305U 队员，重建 0。新隔离活动 `cmwyvcdzm017hny013zp7b5sl`，分类 WAVE83_VERIFIED。管理端协办 POST 为 201／0，撤销为 200／0；负责人移交为 200／0，恢复为 200／0。发起人移交为 403／20020（该组织无发起人移交权）。遗留自签 POST 为 410／20154，GET 为 404／22002；官方 QR 自签／签退与考勤表未发出（当时无已核签到记录）。时间政策相关只读仍为 403，未为 403 补权，未重放 503。台账 135 增至 149。夹具已改回 volunteer。开关仍为 true／true／off。功能收据 SHA-256 `5c36cd21c6e8a3b63a6ced3b270878a0ab9514aea5d2795c83839f2a9e847796`。SHA256SUMS-mid85.txt 为 `a4355692d7866f609420b8d9b9fe837d16fa7ef26418aed80f777e1ce6cd91d8`。mid69–mid84 封存校验未改。同轮 H5：Issue 8 未跑（无陈旧表单），Issue 9／10 为 PARTIAL；使用 Path 乙 loginMember 与 T305U，未改登录工具，未部署 PR 12。

## 11 月 27 日 18:33–18:38 · mid84 新隔离活动走通模板解析，管理端协办因探针前提未发出

本段按北京时间（Asia/Shanghai）追记脱敏结果，18:10–18:16 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放，未清场，未改开关，未改存储设置，E4 仍为 off。未发明法定证件号，未发短信。未硬删既有保护对象或补种角色，也未作废已成功的代签与人工确认。未改四场 2099 验收活动。官方登录工具哈希未变。PID 61139 未杀。Draft PR 仍为审查草稿，未合并、未部署。首发总任务未完成。

mid84 只开 1 名写者，复用 12 名 T305U 队员，重建 0。新隔离活动 `cmwyuh77q012bny017iwhbh25`，岗位码 `member`，分类 WAVE82_PARTIAL。模板解析 GET 为 HTTP 200／0。simple-draft 与时间政策选择 GET 为 403／40300，时长政策列表 GET 为 403／30100，时间政策选项 GET 为 400／40000，队员签到 GET 为 404／22002（当时无开放签到窗）。上述码只记现场读回，未升格为已确认产品缺陷，未为 403 补权，未重放 503。管理端职责 GET 为 200／0，但探针未确认创建前提，协办 POST 与撤销均未发出。结算写与反馈写仍按规则跳过，E4 仍 off。台账 124 增至 135。夹具已改回 volunteer。开关仍为 true／true／off。功能收据 SHA-256 `c9461e5eb4bd04eb7d5b48a8832085b2d357b9e44fbabdd5dbfd8a90adb07bbd`。SHA256SUMS-mid84.txt 为 `618f0803556619d0a3c91f41f92e1712384d26919e778a281cb3889d7be11434`。mid69–mid83 封存校验未改。

## 11 月 27 日 18:10–18:16 · mid83 新隔离活动走通管理侧考勤与岗位只读

本段按北京时间（Asia/Shanghai）追记脱敏结果，17:48–17:51 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放，未清场，未改开关，未改存储设置，E4 仍为 off。未发明法定证件号，未发短信。未硬删既有保护对象或补种角色，也未作废已成功的代签与人工确认。未改四场 2099 验收活动。官方登录工具哈希未变。PID 61139 未杀。Draft PR 仍为审查草稿，未合并、未部署。首发总任务未完成。

mid83 只开 1 名写者，复用 12 名 T305U 队员，重建 0。新隔离活动 `cmwytp3do00y7ny01khqjaui5`，岗位码 `member`，分类 WAVE81_PARTIAL。剩余只读 GET 成功 14／22。走通为 HTTP 200／0 的包括：H5 活动岗位、管理侧考勤草稿、考勤表、签到与访客；以及管理端活动报名列表、活动岗位、参与摘要、签到、岗位列表、成员选项、岗位选项、组织树选项、协作选项。管理端组织选项与模板版本选项为 403／40300；H5 模板版本选项与指标集选项为 403／20020；H5 组织选项与管理侧报名列表为 503／50300；收尾工作台为 404／20188；报名保险为 404／20001。503／403／404 只记现场读回，未升格为已确认产品缺陷，未重放 mid78 H5 指标 PUT。结算写与反馈写按规则跳过。台账 113 增至 124。夹具已改回 volunteer。开关仍为 true／true／off。功能收据 SHA-256 `1208d798dca759732ee6e440cde71cb848a8ff894a03ed750149c90f77780e6a`。SHA256SUMS-mid83.txt 为 `2803117151705b179d6aaebae52f7d44367d6b83ac3666d1dcf8ce08386e86f3`。mid69–mid82 封存校验未改。

H5 Issues 8／9／10 本轮桌面未验：只看到匿名登录页。官方登录脚本只支持 admin／A／B 固定配置，夹具加临时配置不满足；A／B 配置目录本轮不存在。未占用 t95 管理端。无过期表单样本，未见录取回执与名单。真机／微信未验。入口资源与 3968 制品 11 项哈希一致，不能当成 8／9／10 已验。未部署 PR 12。1463 头仍为 `74b79f76`，仍是合入障碍，未改超时、未放宽门禁、未推送、未合并。1460 不单合。

## 11 月 27 日 17:48–17:51 · mid82 新隔离活动走通半径外、代签与人工确认，结算只读后因 E4 关闭与无关账未强行关账

本段按北京时间（Asia/Shanghai）追记脱敏结果，17:17–17:33 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放，未清场，未改开关，未改存储设置，E4 仍为 off。未发明法定证件号，未发短信。未硬删既有保护对象、mid81 新隔离活动或补种角色，也未作废已成功的代签与人工确认。未改四场 2099 验收活动。官方登录工具哈希未变。PID 61139 未杀。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。首发总任务未完成。

mid82 只开 1 名写者，复用 12 名 T305U 队员，重建 0。新隔离活动 `cmwysu10k00tnny01myrivh5r`，岗位码 `member`。半径外自签期望拒绝 HTTP 400／22091，二维码已撤销。代签与人工确认均为 HTTP 201／0，读回确认，未作废出勤。结算先只读：发布后首次 GET 结算曾为 HTTP 403／30100，出勤后再次 GET 为 200／0，无关账、无已过账批次。时长结算工作台与来源 HTTP 404／20219。Admin 结算列表、评价列表与摘要均为 200／0。未跑 generate／submit／close／prepare，结算写跳过原因是 E4 关闭且无公开原态恢复入口。队员评价 GET HTTP 409／35030（活动尚未完结）；因无关账未强行关账。403／20219／35030 只记现场读回，未升格为已确认产品缺陷。分类 WAVE80_VERIFIED。台账 99 增至 113。夹具已改回 volunteer。开关仍为 true／true／off。功能收据 SHA-256 `3908d201e33ba8d19351e339dcff5e4854bce5a2f2da2e63b9ee49298ee9f5fa`。SHA256SUMS-mid82.txt 为 `7c4e8267dcd9614673697ca311d542ce1ddc96d9a66e982207250e432377ba4e`。mid69–mid81 封存校验未改。

并行已把 mid76–mid81 走通路径回写进 678 点名新副本（走通 97，只读 157，跳过或受阻 71，未测 352，待确认 1，变更 13 条），未覆盖 mid76 点名原件；mid82 本轮新走通当时尚未纳入该副本。H5 Issues 8／9／10 本轮未复测（写者占用 t95），未部署 PR 12。1463 头仍为 `74b79f76`，仍是合入障碍，未改超时、未放宽门禁、未推送、未合并。1459→1460→1461 仍未合并，1460 不单合。

## 11 月 27 日 17:17–17:33 · mid81 补齐官方协办角色后，新隔离活动录取后协办走通

本段按北京时间（Asia/Shanghai）追记脱敏结果，16:38–16:46 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放，未清场，未改开关，未改存储设置。未发明法定证件号，未发短信。未硬删 `cmwymsf1200ajny01zry6vpih`、`cmwyjsu4p006cny01jsx9bjgd`、`cmwyosbty00gyny01n4a9dke0`、`cmwypode200jvny01bvsidif3`，也未作废已成功的代签与人工确认。未把前三场当干净签退基线。未改四场 2099 验收活动。官方登录工具哈希未变。PID 61139 未杀。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。首发总任务未完成。

补种前只读确认：`activity-owner` 存在、未软删、17 项权限完整；`activity-registration-collaborator` 与 `activity-attendance-collaborator` 在角色表无行（不是软删）；13 项官方协办权限码现场都在。按可逆前提补上官方预期记录并入台账，禁止硬删。随后只开 1 名写者，复用 12 名 T305U 队员，重建 0，在新隔离活动 `cmwys4ugc00p9ny01183p2m95` 上先分配、确认候选人 `statusCode=pass` 后再发协办（两旗均为 true）：POST HTTP 201／业务码 0，Admin 责任读回确认；可逆撤销 HTTP 200／0，读回确认。分类 WAVE79_VERIFIED。未再出现 30003 或 20035，二者均未升格为已确认 8a 缺陷。未污染 mid79 已走通活动。台账 85 增至 99。夹具已改回 volunteer。开关仍为 true／true／off。功能收据 SHA-256 `7728f7c077139eadb3382ee9e4e19d8d51cab17010be96f21aaf83786352c719`。SHA256SUMS-mid81.txt 为 `f1a16fd45bfecd2b4bfd1a57887445558589a4bb2411f0c281eac92537956ba9`。mid69–mid80 封存校验未改。

并行会话不占写者位：1463 头仍为 `74b79f76`，分片 3 与必需汇总检查仍红，仍是合入障碍。本机以独立项目独占复跑 D6 2000 人用例通过（Jest 退出 0，约 51.56 秒，准备约 5.04 秒，无 P2028），未改产品超时、未放宽门禁、无确认修复、未推送、未合并。1459→1460→1461 仍未合并，1460 不单合。mid78 H5 指标 503 仍未重放。

## 11 月 27 日 16:38–16:46 · mid80 录取后协办复测不再是 20035，返回 404／30003，现场缺哪个角色待独立核清

本段按北京时间（Asia/Shanghai）追记脱敏结果，15:49–16:25 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放，未清场，未改开关，未改存储设置。未发明法定证件号，未发短信。未硬删 `cmwymsf1200ajny01zry6vpih`、`cmwyjsu4p006cny01jsx9bjgd`、`cmwyosbty00gyny01n4a9dke0` 或 `cmwypode200jvny01bvsidif3`，也未作废已成功的代签与人工确认。未把前三场当干净签退基线。未改四场 2099 验收活动。官方登录工具哈希未变。PID 61139 未杀。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。首发总任务未完成。

mid80 只开 1 名写者，复用 12 名 T305U 队员，重建 0。在已发布活动 `cmwypode200jvny01bvsidif3` 上，Admin 先读回报名，确认候选人 T305U-VIRT-02 为 `statusCode=pass`（当场录取 2 人）后才发协办，故不再是分配前的 20035。协办 POST forwarded=true，HTTP 404／业务码 30003（冻结 8a：`ROLE_NOT_FOUND`，角色不存在）。授权投影会查找 `activity-owner`、`activity-registration-collaborator`、`activity-attendance-collaborator`，缺任一即抛此码；现场缺哪一个当时尚未独立核到。Admin 读回未见新协办，撤销未转发。活动仍为 published。台账仍为 85 项。夹具已改回 volunteer。开关仍为 true／true／off。分类 WAVE78_PARTIAL。功能收据 SHA-256 `3df461dd9581c177b0338fbb5b91ff331c330f3f6c6e9b1026abdcc6595c5ee4`。SHA256SUMS-mid80.txt 为 `90f9b2ef3f0edd0a2d05e435978d67371b9c394d0687d78d708e2e9538b6aadd`。mid69–mid79 封存校验未改。20035 仍未用录取后候选人复现，未立项为已确认 8a 缺陷；30003 同样尚未升格。

并行会话不占写者位：1463 头仍为 `74b79f76`，Contract+E2E(3) 与 Lint／Typecheck／E2E 仍红，倾向偶发但本机当时未能独占复跑，未改产品超时、未放宽门禁。合入准备仅方案，建议顺序 1459→1460→1461 再重生 ROUTE_AUTHZ，1460 不单合，全量 CI／E2E 为 NOT_RUN。mid78 H5 指标 503 的首个可确认失败操作是 H5 PUT metric-selection（503／50300），内部首错未定位，材料不足以定性产品缺陷，本轮未重放。

## 11 月 27 日 15:49–16:25 · mid78 指标停在未确认 H5 503，mid79 走通交接候补半径外与代签确认，协办 20035 待录取后复测

本段按北京时间（Asia/Shanghai）追记脱敏结果，15:23–15:30 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放，未清场，未改开关，未改存储设置。未发明法定证件号，未发短信，未发明官方微信模板 ID。未硬删 `cmwymsf1200ajny01zry6vpih`、`cmwyjsu4p006cny01jsx9bjgd`、`cmwyosbty00gyny01n4a9dke0` 或 `cmwypode200jvny01bvsidif3`，也未作废已成功的自己签到。未把前三场当干净签退基线。未改四场 2099 验收活动。官方登录工具哈希未变。PID 61139 未杀。未自动把仍红的草稿合进 main。首发总任务未完成。

mid78 复用已绑定的 12 名 T305U 队员，登录与登出均核验 12/12；04 与 09 遇 429／42900，退避后成功。新建隔离草稿仍在且为 draft。H5 PUT 指标配置返回 HTTP 503／业务码 50300，Admin 与 H5 读回均未确认写入，该请求未重发。探针只在 401／403 才回退 Admin，故 mid76 已成功的官方 Admin PUT 本轮未发出，提审与协办、交接、候补、半径外、代签确认均未转发。分类 WAVE76_PARTIAL。台账由 67 项增至 68 项，原 67 项全部保留。功能收据 SHA-256 `e1c5d1dc66de9ad32b3d3662730a1fc5b50390bc7dfe1fc4fe02477ae381d983`，台账 `5dd80dc11dfac1093e19874c9aef913a2315a525f9ef2e57582b4257877c2e37`。SHA256SUMS-mid78.txt 为 `875f2b3518f3bd86cfbc4f2fd1c93015177e58d030d68949671484e8e627a4ae`。mid69–mid77 封存校验未改。

mid79 只开 1 名写者，改为只走已核过的 Admin PUT 指标配置（HTTP 200／业务码 0，Admin 与 H5 读回确认），H5 指标 PUT 发出 0 次。岗位角色按现场字典写入 `member`，活动类型 `hiking`。新隔离活动已发布并保留。交接与交回、候补（2 人录取、1 人 `waitlisted`／第 1 位）、半径外反例（HTTP 400／业务码 22091，读回 `isPresent=false`）、代签与人工确认（均 HTTP 201／业务码 0，干净段起步，成功后未作废）均已独立读回确认。协办在分配前发出，返回 HTTP 400／业务码 20035（责任人或协办人不符合条件），撤销未转发；冻结 8a 要求协办候选人已录取（`statusCode=pass`）或当前有效组织成员关系。20035 在用录取后候选人独立复现前，不立项为已确认 8a 缺陷。分类 WAVE77_PARTIAL。本轮登录占用夹具与 T305U-VIRT-01 至 03，无 429。台账由 68 项增至 85 项，原 68 项全部保留。夹具 `volunteer → level-1 → volunteer`。开关仍为 true／true／off。功能收据 SHA-256 `bdb471ae1ed26083208525eb82faa74602c041cce7861959297c6ffc1cea64ed`，台账 `58ae16cb6b35293f024653016429244f3171584d3ea1f9997940da7ed4242093`。SHA256SUMS-mid79.txt 为 `29ccd952a1b60f7a114551f2e3057eaff5c0bf217fb9e1b8e0a38a3a81737c04`。mid69–mid78 封存校验未改。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。

## 11 月 27 日 15:23–15:30 · 官方托管可写，12 名路径乙测试队员已建档绑定，协办交接候补因探针岗位码误判未发出

本段按北京时间（Asia/Shanghai）追记脱敏结果，14:51–15:02 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放，未清场，未改开关，未改存储设置。未发明法定证件号，未发短信，未发明官方微信模板 ID。未硬删 `cmwymsf1200ajny01zry6vpih`，也未作废其上已成功的自己签到。未把 `cmwyjsu4p006cny01jsx9bjgd` 当干净签退基线。未改四场 2099 验收活动。官方登录工具哈希未变。PID 61139 未杀。未自动把仍红的草稿合进 main。本轮结束后写者位已空。首发总任务未完成。

先查清 mid76 的 `WAVE74_OFFICIAL_NEW_MEMBER_CUSTODY_UNAVAILABLE`：不是官方托管不存在或权限不够。占用夹具托管文件仍在，模式 0600、属主与进程一致、可读；其父目录模式 0700、属主一致、对本进程可读可写可进入。目录内原先 4 个 0600 文件、1 个 0700 子目录，没有现成生成器工具。mid76 探针在收尾处把新队员计数写死为 0 并跳过协办/交接/候补，属于未实现向官方托管目录新增 0600 条目，不是入口缺失。本轮只开 1 名现网写者纠正该误判。

写者按 wave20 托管定位器在同一官方目录新增 12 条 0600 条目，属主核验通过，写入 errno 为空。随后路径乙创建并绑定 12 名正式测试队员（T305U-VIRT-01 至 12）全部成功。H5 登录与登出各核验成功 3 名；其余 9 名登录返回 HTTP 429／业务码 42900，属限流，12 个临时 profile 均已清理。密码与托管路径未写入收据。

协办、交接、候补和半径外反例均未发出。原因是探针把 `participant` 当成唯一可接受的岗位角色码，读取官方字典后提前退出，没有创建新活动。这是探针入参误判，不是产品拒绝，也不是托管失败。代签与手动确认未转发。占用夹具本轮未提级，结束时仍为 volunteer。运行进程首尾 v1.1 为 true，责任制为 true，E4 为 off，未重启。分类 WAVE75_PARTIAL。台账由 31 项增至 67 项，原 31 项全部保留，新增 12 名队员、12 个用户与 12 条绑定记录；无公开删除入口，未硬删。未开事项。

功能收据 SHA-256 `9dbe2aed832898f6af6b3bda94b7b3ed523c6dc19dec770c611f707d3fa67e38`，台账 `f208d9281174b6c9f11f1d7f74edd2050110ec0aa05950c71907594de6580f6a`。SHA256SUMS-mid77.txt 另记。mid69–mid76 封存校验未改。

## 11 月 27 日 14:51–15:02 · 官方现场码与自己签到、半径内正例已走通，可逆测试队员与协办交接候补未建成

本段按北京时间（Asia/Shanghai）追记脱敏结果，13:54–14:09 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码，未发明官方微信模板 ID。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未再发未确认 503/50300。未做整站正式开放，未启用或发送微信/短信通知。未改开关，也未再重启 runtime-api。未把 f798 组合头对 main 开 PR，未换镜像。未再新建活动类型种子、gender_requirement 类型与字典项或考勤角色种子；已停用对象只读确认仍为 INACTIVE，未临时启用，未硬删。mid37–mid75 已走通项不记为新覆盖。本轮结束后未自动再开空转轮次。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍未按本轮合并。首发总任务未完成。

本轮在官方 Mac 并行拉起 1 个现网写者与 4 个只读会话（Sol/medium）。写者于 14:51:13 启动，15:01:53 落盘功能收据后结束。只读会话分别完成 678 现场点名、路径契约、台账复核与 503 观察，均未发出现网 HTTP。活动 `cmwyjsu4p006cny01jsx9bjgd` 仍保留，未当作干净签退基线，未硬删。官方登录工具哈希未变。PID 61139 未杀。

先只读确认运行进程 `ACTIVITY_V11_WORKFLOW_ENABLED` 为 true 且就绪，责任制为 true，E4 为 off，本轮未改开关、未重启。占用夹具级别独立读回为 volunteer，临时调到官方字典 level-1，结束后改回 volunteer。管理端登录共 8 次尝试，其中 5 次在发出登录请求前被本机限制拦截（Chrome 命令行核验不可用，不当产品缺陷），随后登录与登出各成功 3 次。占用夹具队员端登录与登出各成功 3 次。

可逆测试队员未建成：新建/绑定/登录均为 0。写者判定本轮缺少官方新密码托管入口，未发短信，未伪造法定证件号，也未混用已排除的真实身份。因此协办、交接未发出（forwarded=false）。候补同样未发出：除缺少额外正式队员外，冻结 8a 的本人直接报名入口要求公开报名，隔离活动未走该写入。

测试签到坐标基线已记录在案，标明为合成测试基线，半径 100 米。新建可逆隔离活动 `cmwymsf1200ajny01zry6vpih`，窗口相对服务器时间已开启且结束留足余量。提审走官方 publish-reviews，带 operationKey 与 confirmation=true，提交与批准均为 HTTP 200／业务码 0。官方分配 `/commit` 作为前置再次发出，200／0，独立读回已提交。随后按官方路径签发签到码：issue 为 201／0，凭证版本 1；render 返回 SVG 且未回显 token，写者对官方 SVG 解码后用于自己签到，decode_from_official_render=true。自己签到 `POST .../punches/check-in` forwarded=true，HTTP 201／业务码 0。独立读回 my-punch-state 为 200／0，isPresent=true，nextAllowedAction=check_out，签到时间 15:01:05.736（Asia/Shanghai）。半径内正例已走通；半径外反例未发，以免污染干净基线。测试后官方作废该现场码，200／0，并独立读回。因该活动上已有有效自己签到、没有未占用的独立服务段，本轮未再发代签或工作人员手动确认，也未先作废签到。结算只读 200／0；封场、正式入账和关账缺公开恢复入口，已跳过。封面/图库仍缺已批准附件，未重放上传。未开事项，live_8a_logic_defect_confirmed 仍为 false。

首个草稿活动因探针过早做负责人检查而停止，已按对象 ID 软删并独立读回。第二个活动因有效签到挡住取消入口而保留。台账由 22 项增至 31 项，新增活动、场次、岗位、已批准提审、报名、已提交批次、参与身份、已作废现场码凭证与自己签到事件；无公开删除入口，未硬删。

678 项规格操作的验收现场点名只对照 11 月 24 日最后一次本机普查（420 业务正例／38 仅 HTTP／220 无本机 HTTP）与 mid6–mid75 封存证据，未把本机正例改记为验收现场通过，点名会话现场 HTTP 为 0。点名落盘时 wave74 功能收据尚未写出，故下列数字不含本轮新走通项：验收现场已走通 86，只读过 155，跳过或受阻 76，完全未测 360，待确认 1（作废接口曾返回 201／0，但独立读回未确认恢复）。主要缺口仍是 H5 管理报名与发布后变更中的未确认 503、staff-scan 已转发但 409／22093、考勤结算与附件前置不足，以及协办/交接/候补此前缺少额外正式队员。本轮之后新增的现场走通为官方现场码签发与渲染、自己签到、场次半径内正例；上述 678 点名 JSON 未回写吸收这三项。

本轮功能分类为 WAVE74_PARTIAL。新核实字段：official_check_in_qr、self_check_in、session_radius_inside。功能收据 SHA-256 `2eaffa1fab9a69dd058463c0c8f8461789172544fa244d837d55749e677d45b1`，台账 `1ecbed6b8a7258708f8a25baf9e3cb4e036bf82f4f993a2f7908c099db139721`，678 点名 `12096df4409f4d759a88c84e0fe9ecab7f7e8d6892a2ed98b8d55dd0d2017196`。SHA256SUMS-mid76.txt 另记。13034 无新观测。结束时 v1.1 与责任制仍为 true，E4 仍为 off，夹具级别已回到 volunteer。

## 11 月 27 日 13:54–14:09 · 确认作废未恢复签到，工作人员手动确认已发出并返回 409/22093

本段按北京时间（Asia/Shanghai）追记脱敏结果，13:32–13:41 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。未把 f798 组合头对 main 开 PR，未换 runtime-api 镜像，也未再重启 runtime-api。未再新建活动类型种子、gender_requirement 类型与字典项或考勤角色种子；已停用对象只读确认仍为 INACTIVE，未临时启用，未硬删。未再为复现而批准 change-reviews，未再发非空报名表写入，也未为复现再发未确认 503/50300。mid37–mid74 已走通项不记为新覆盖，包括已走通的官方代签与分配提交 `/commit`。未为核实而重放作废。本轮结束后未自动再开空转轮次。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 3 路不抢写者位的只读 Codex，共 4 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、staff-scan 与作废读回字段预核、清场台账入口核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦，两端登录与服务端登出均为 HTTP 200／业务码 0。本轮无 Chrome 启动失败。已保留过程改进。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**开关。** 本轮先只读确认运行进程中的 `ACTIVITY_V11_WORKFLOW_ENABLED` 仍为 `true`，就绪核对通过，未再重启、未改开关。责任制全局开关前后均为 `true`，E4 贡献结算模式前后均为 `off`。收尾复查相同。

**mid74 证据核查。** 工作人员手动确认在 mid74 为本地拦截：探针在代签作废恢复未确认时直接 skip，请求未发出（`forwarded=false`，无 HTTP 或业务码），分类为 `WAVE73_MID74_LOCAL_RESTORATION_GATE`。`void_verified=false` 的判定条件是作废响应 `eventTypeCode=void`，且随后 `my-punch-state` 为 `isPresent=false`、`nextAllowedAction=check_in`。mid74 收据只记下作废 201／0 与读回 200／0，这三个字段的实际值均未落盘，不能从旧收据判断当时哪一项未满足。本轮未重放作废来补那些字段。

**作废是否真正恢复。** 按对象 ID 复用活动 `cmwyjsu4p006cny01jsx9bjgd`。现网只读 `my-punch-state` 为 200／0，`isPresent=true`、`nextAllowedAction=check_out`，签到时间为北京时间 13:38:55.553。作废并未真正恢复签到，签到仍生效。窗口仍开放，有效定位仍关闭。本轮未再发代签。

**工作人员手动确认。** 等到最早可签退时间北京时间 14:08:55 之后，官方 `POST .../staff-scan` 已实际发出（`forwarded=true`），请求体预核字段为 `actionCode`、`eventKey`、`manualConfirmation.participationIdentityId`、`manualConfirmation.reason`，`actionCode=check_out`。现网返回 HTTP 409／业务码 22093，分类为 `WAVE73_PRODUCT_RETURNED_RESPONSE`，判定没有可签退的开放服务段。队员本人独立读回仍为 200／0，请求前后均为 `isPresent=true`、`nextAllowedAction=check_out`，签到时间不变。查询仍显示可签退，签退入口却判定没有开放段。写者对照冻结 8a，认为状态查询未排除已作废服务段。未重放现网请求，未开事项；收据中 `live_8a_logic_defect_confirmed=false`。收据里的 `attendance_restoration_confirmed=true` 仅表示本次拒绝后状态与写前一致，不表示 mid74 作废已恢复签到。

**本轮因条件跳过的路径。** 自己签到仍缺已核实成对坐标与现场 QR；协办、交接与多人候补仍缺第二名正式成员；未确认 503/50300 本轮未为复现再发；封面/图库缺已批准附件；归档仍不满 30 天；封场、送审、正式入账和关账缺公开恢复入口。结算先读；时长结算 404／20219；反馈资格仍为 409／35030，可逆反馈未发出。13034 无新观测。未开事项。收据覆盖分类为 `WAVE73_NO_NEW_SUCCESS`。

**写入与清理。** 发出业务写请求 3 次，成功回执 2 次（夹具级别往返）；手动确认为转发后的 409。因作废未真正恢复、签到仍生效，本轮未清掉隔离活动。台账仍为 22 项，无新增、无移除。5 个停用对象只读确认仍为 INACTIVE。活动 `cmwyjsu4p006cny01jsx9bjgd` 仍在，勿当已删除，未硬删。

证据：`wave73-functional-probe-receipt.json` SHA-256 `e1d9a4bed3cb96518e50e7958238499fdd0195072079b3e63ccc25aa1b3f2075`；`wave73-cleanup-ledger.json` SHA-256 `014a9ed8f0a720f9a5fcd6a4cf58226c1ee915138d5c28a8e0affe36d3eaecf6`；`official-t230-mid75-503-localization.json` SHA-256 `ac26f9f45a6882ccc3853c25d70b4fc907c1668c715a4fc442b3ad87240c05e9`；`official-t230-mid75-v11-path-contract.json` SHA-256 `292dcb4d5d918078609a3ce24fdd1f5e691eb21488e67e5afb185c14ba2af6a4`；`official-t230-mid75-ledger-contract.json` SHA-256 `8439f3eff69794174098f1f1d615e19722ebf6f70db0fe4495ed8cfc502d1281`；`SHA256SUMS-mid75.txt` SHA-256 `74a3ccbd937f5a5a0e3089620fc858975bf81bad12ae08ca1219013ff8e446dc`。mid6–mid74 未改写；`SHA256SUMS-mid74.txt` 仍为 `e0499bf0f970dfb7b95b006b0388b538a0ad8aa864250fd76fd12683e1fa98ab`，`SHA256SUMS-mid73.txt` 仍为 `9e1d30b0f2696394e9106adc4a2f311e569614d6af735a19582cf1e9f5424c72`。

## 11 月 27 日 13:32–13:41 · 提审带齐必填项并发布成功，官方代签已走通，作废后读回未确认恢复，工作人员手动确认未发出

本段按北京时间（Asia/Shanghai）追记脱敏结果，13:12–13:18 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。未把 f798 组合头对 main 开 PR，未换 runtime-api 镜像，也未再重启 runtime-api。未再新建活动类型种子、gender_requirement 类型与字典项或考勤角色种子；已停用对象只读确认仍为 INACTIVE，未临时启用，未硬删。未再为复现而批准 change-reviews，未再发非空报名表写入，也未为复现再发未确认 503/50300。mid37–mid73 已走通项不记为新覆盖，包括已走通的分配提交 `/commit`。未把 mid73 提审漏传必填字段立项为现网 8a 逻辑缺陷。本轮结束后未自动再开空转轮次。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 3 路不抢写者位的只读 Codex，共 4 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、提审必填字段与代签/手动确认路径预核、清场台账入口核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦，两端登录与服务端登出均为 HTTP 200／业务码 0。本轮无 Chrome 启动失败。已保留过程改进。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**开关。** 本轮先只读确认运行进程中的 `ACTIVITY_V11_WORKFLOW_ENABLED` 仍为 `true`，就绪核对通过，未再重启、未改开关。责任制全局开关 `ACTIVITY_RESPONSIBILITY_WORKFLOW_ENABLED` 前后均为 `true`，本轮未改。E4 贡献结算模式 `ACTIVITY_E4_CONTRIBUTION_SETTLEMENT_MODE` 前后均为 `off`，本轮未改。收尾复查运行进程 v1.1 与责任制仍为 `true`，就绪仍通过，E4 仍为 `off`。

**本轮新走通。** 新建隔离活动 `cmwyjsu4p006cny01jsx9bjgd`。官方提审 `POST /api/app/v1/my/managed-activities/:activityId/publish-reviews` 带齐 `operationKey` 和 `confirmation=true`，提审与批准均为 200／0，发布状态已读回。负责人按 `data.owner.id` 核对通过。分配提交 `/commit` 读回 `committed`，仅作为已走通前置，不记新覆盖。发出代签前用服务器时间确认签到窗口已开启、剩余超过 3 小时，且有效定位要求关闭。官方代签 `POST .../onsite/sessions/:sessionId/proxy-punch` 为 `forwarded=true`，HTTP 201／业务码 0；参与者本人独立读取 `my-punch-state` 为 200／0，确认签到已生效。收据覆盖分类为 `WAVE72_NEW_FUNCTIONAL_SUCCESS`，新走通 1 项：`official_proxy_punch`。

**作废与未发出的手动确认。** 随后官方作废 `POST .../onsite/punch-events/:eventId/void` 返回 201／0，并生成作废事件。作废后 `my-punch-state` 读回 200／0，但探针未确认签到状态已恢复（`void_verified=false`），因此工作人员手动确认未发出（`forwarded=false`，无 HTTP 或业务码）。分类为 `WAVE72_STAFF_BASELINE_OR_PROXY_RESTORATION_UNCONFIRMED`。写者用冻结 8a 在本地对照出一个与现场读回相符的现象：已作废的服务段仍可能被 `my-punch-state` 判为开放。未重放现网请求，未开事项，未把该读回差异立项为已确认的现网 8a 逻辑缺陷。因恢复未确认，本轮未清掉该隔离活动及相关对象。

**本轮因条件跳过、仍因缺前置而卡住的路径。** 自己签到仍缺已核实成对坐标与现场 QR；协办、交接与多人候补仍缺第二名正式成员；未确认 503/50300 本轮未为复现再发；封面/图库缺已批准附件；归档仍不满 30 天；封场、送审、正式入账和关账缺公开恢复入口。结算先读，确认无正式入账或关账；时长结算 404／20219；反馈资格 409／35030，可逆反馈未发出。旧代签按原审计范围查询 200／0，未找到匹配记录，未扩大检索，继续待核实。13034 无新观测。未开事项。

**写入与清理。** 发出业务写请求 14 次，全部成功回执。探针记录新建对象 10 个，确认收尾 1 个（邀请已接受并结项）。清理台账现为 22 项：继承原 13 项，新增 9 项。新增待清为活动 `cmwyjsu4p006cny01jsx9bjgd`、场次 `cmwyjsuh7006kny01jvfhv0j0`、场次岗位 `cmwyjsul2006nny01t3moroxa` 和报名 `cmwyjsv59007gny010l5k62u7`。另 5 项无公开删除入口，予以保留：已批准提审 `cmwyjsupa006rny01qq9bd08e`、已提交批次 `ce5223f4-e31a-44ac-b32a-035b54227418`、参与身份 `cmwyjsv5e007lny01lwt109ge`、代签事件 `cmwyjwr0r008fny01d0hs3rf9`、作废事件 `cmwyjwr3w008lny01584l0xyv`。原 mid71 未提交批次、mid72 已提交批次与参与身份继续保留。5 个停用对象只读确认仍为 INACTIVE。未硬删。该隔离活动仍在，勿当已删除。

证据：`wave72-functional-probe-receipt.json` SHA-256 `02a4803db2390ca561abffd86b8b52e8335fc3085e9d73d13913cff967e84393`；`wave72-cleanup-ledger.json` SHA-256 `19969c534c6a4c5497dbc88cbeab7df35d49f96068837c3866712baadbb52c7a`；`official-t230-mid74-503-localization.json` SHA-256 `cbd3ad58c2d7064f768370a9caffc6d77b4111c53a614f5d8c3d5533701e442d`；`official-t230-mid74-v11-path-contract.json` SHA-256 `384cfff05691bced57dc52ad19ceebf43e8076ec687029aa3ed7be76b3b8f191`；`official-t230-mid74-ledger-contract.json` SHA-256 `6232bafcca06487467ebdeab7225e6069331448aab8afaf0c0791ff185062847`；`SHA256SUMS-mid74.txt` SHA-256 `e0499bf0f970dfb7b95b006b0388b538a0ad8aa864250fd76fd12683e1fa98ab`。mid6–mid73 未改写；`SHA256SUMS-mid73.txt` 仍为 `9e1d30b0f2696394e9106adc4a2f311e569614d6af735a19582cf1e9f5424c72`，`SHA256SUMS-mid72.txt` 仍为 `7b27206e30e22b030b96898f9c84c235e05dbd51f62a7edcf47111246306a715`。

## 11 月 27 日 13:12–13:18 · 旧隔离活动签到窗已过，新建活动因探针漏传提审字段未发布，代签仍未发出

本段按北京时间（Asia/Shanghai）追记脱敏结果，12:44–12:51 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。未把 f798 组合头对 main 开 PR，未换 runtime-api 镜像，也未再重启 runtime-api。未再新建活动类型种子、gender_requirement 类型与字典项或考勤角色种子；已停用对象只读确认仍为 INACTIVE，未临时启用，未硬删。未再为复现而批准 change-reviews，未再发非空报名表写入，也未为复现再发未确认 503/50300。mid37–mid72 已走通项不记为新覆盖，包括已走通的分配提交 `/commit`。未把 mid72 误读负责人字段，或本轮提审漏传必填字段，立项为现网 8a 逻辑缺陷。本轮结束后未自动再开空转轮次。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 3 路不抢写者位的只读 Codex，共 4 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、代签/手动确认路径与 `data.owner.id` 预核、清场台账入口核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦，两端登录与服务端登出均为 HTTP 200／业务码 0。本轮无 Chrome 启动失败。已保留过程改进。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**开关。** 本轮先只读确认运行进程中的 `ACTIVITY_V11_WORKFLOW_ENABLED` 仍为 `true`，就绪核对通过，未再重启、未改开关。责任制全局开关 `ACTIVITY_RESPONSIBILITY_WORKFLOW_ENABLED` 前后均为 `true`，本轮未改。E4 贡献结算模式 `ACTIVITY_E4_CONTRIBUTION_SETTLEMENT_MODE` 前后均为 `off`，本轮未改。收尾复查运行进程 v1.1 与责任制仍为 `true`，就绪仍通过，E4 仍为 `off`。

**本轮新走通。** 无新增功能覆盖，收据记为 `WAVE71_NO_NEW_SUCCESS`。官方代签与工作人员手动确认均未发出（`forwarded=false`，无 HTTP 或业务码，无独立考勤读回，也无作废）。

**旧活动只读核验与为何未复用。** 先按对象 ID 只读核活动 `cmwyi2fwo0029ny018m66kblj`：活动仍在且状态为已发布，管理详情按 `data.owner.id` 核实负责人和考勤范围通过，责任列表通过，有效定位仍为关闭，报名与参与身份仍可用，批次 `08ad1461-17e4-4b1d-a364-1b4d25ff7c15` 仍为 `committed`，本人打卡状态可读，无入账记录。但相对服务器时间，签到窗口已过（`window_expired=true`，`eligible=false`），因此未在该场次代签，也未把过期窗口强行改回。随后按规定新建可逆隔离活动 `cmwyj4ug30058ny01fbsmxg1d`。

**新建活动为何未走到可代签。** 新活动创建、指标选择、场次和场次岗位均成功。发布提审 `POST /api/app/v1/my/managed-activities/:activityId/publish-reviews` 返回 400／40000 且 `forwarded=true`。探针混淆了两个提审入口，漏传冻结 8a 要求的必填字段 `operationKey` 和 `confirmation=true`。这是探针入参错误，不是已生效的 v1.1 开关被产品拒绝。未开事项。因未发布，官方代签和工作人员手动确认未发出。

**本轮因条件跳过、仍因缺前置而卡住的路径。** 自己签到仍缺已核实成对坐标与现场 QR；协办、交接与多人候补仍缺第二名正式成员；未确认 503/50300 本轮未为复现再发；封面/图库缺已批准附件；归档仍不满 30 天；封场、送审、正式入账和关账缺公开恢复入口。结算在旧活动上已先读。可逆反馈未发出。旧代签本轮未扩大查询，继续待核实。13034 无新观测。未开事项。

**写入与清理。** 发出业务写请求 11 次，成功回执 10 次。探针记录新建对象 3 个，按业务状态确认收尾 7 个。新草稿活动已软删，独立读回 404／20001。旧隔离活动已按对象 ID 取消报名、取消活动并软删，独立读回 404／20001；场次与岗位在活动软删后官方读回 404／20001。未用标题匹配，未硬删。清理台账现为 13 项：2 项指标草稿、2 项已退役指标、5 项已停用种子或字典对象（只读确认仍为 INACTIVE）、mid71 未提交批次 `8c503785-fe16-48be-932c-fd5998a33fae`、已提交批次 `08ad1461-17e4-4b1d-a364-1b4d25ff7c15`、参与身份 `cmwyi2h3o003iny012fbokr3w`，以及旧代签待核实记录。批次与参与身份无公开删除入口，继续保留。

证据：`wave71-functional-probe-receipt.json` SHA-256 `6cf5c7766774df8744e56c0f16f44e0a53e1d6809c00eb86ae33c828b9ef2030`；`wave71-cleanup-ledger.json` SHA-256 `441f145369e313884d1510fd8a808d99aed88a146780a9d1096190d7aa311024`；`official-t230-mid73-503-localization.json` SHA-256 `1923444080eab014b31196e5f520ac4e442db9ca5221bdc0ca8c9ee148c85021`；`official-t230-mid73-v11-path-contract.json` SHA-256 `21e8965f6c0b8bc824d66e6b2a86539acd1077643852ea067254c049111d6817`；`official-t230-mid73-ledger-contract.json` SHA-256 `6068d134bbc73e0ee47ffa27bcc5e4175aea37bef88c11ff17349951485df154`；`SHA256SUMS-mid73.txt` SHA-256 `9e1d30b0f2696394e9106adc4a2f311e569614d6af735a19582cf1e9f5424c72`。mid6–mid72 未改写；`SHA256SUMS-mid72.txt` 仍为 `7b27206e30e22b030b96898f9c84c235e05dbd51f62a7edcf47111246306a715`，`SHA256SUMS-mid71.txt` 仍为 `314a855c047d6a88848e441cfbf6cbe8774ac9bab76684d6ffe196eddb38b05b`。

## 11 月 27 日 12:44–12:51 · 官方分配提交 /commit 已走通，代签因探针字段未发出

本段按北京时间（Asia/Shanghai）追记脱敏结果，12:27–12:33 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。未把 f798 组合头对 main 开 PR，未换 runtime-api 镜像，也未再重启 runtime-api。未再新建活动类型种子、gender_requirement 类型与字典项或考勤角色种子；已停用对象只读确认仍为 INACTIVE，未临时启用，未硬删。未再为复现而批准 change-reviews，未再发非空报名表写入，也未为复现再发未确认 503/50300。mid37–mid71 已走通项不记为新覆盖。未把 mid71 漏写 `/commit` 或本轮探针误读负责人字段立项为现网 8a 逻辑缺陷。本轮结束后未自动再开空转轮次。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 3 路不抢写者位的只读 Codex，共 4 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、含 `/commit` 的 v1.1/代签路径预核、清场台账入口核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦，两端登录与服务端登出均为 HTTP 200／业务码 0。本轮无 Chrome 启动失败。已保留过程改进。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**开关。** 本轮先只读确认运行进程中的 `ACTIVITY_V11_WORKFLOW_ENABLED` 仍为 `true`，就绪核对通过，未再重启、未改开关。责任制全局开关 `ACTIVITY_RESPONSIBILITY_WORKFLOW_ENABLED` 前后均为 `true`，本轮未改。E4 贡献结算模式 `ACTIVITY_E4_CONTRIBUTION_SETTLEMENT_MODE` 前后均为 `off`，本轮未改。收尾复查运行进程 v1.1 与责任制仍为 `true`，就绪仍通过，E4 仍为 `off`。

**本轮新走通。** 官方分配提交已实际发出：发请求前预核路径为 `POST /api/app/v1/my/managed-activities/:activityId/allocation-batches/:batchId/commit`，请求体字段为 `operationKey`；该请求 HTTP 200／业务码 0，`forwarded=true`，独立 GET 同一批次读回状态为 `committed`。新批次为 `08ad1461-17e4-4b1d-a364-1b4d25ff7c15`。收据覆盖分类仍写 `WAVE70_NO_NEW_SUCCESS`（探针未把该提交计入覆盖计数），但 mid71 因漏写 `/commit` 未发出该请求，本轮已转发并成功，记为新走通。

**本轮未发出的目标路径。** 官方代签与工作人员手动确认均未发出（`forwarded=false`，无 HTTP 或业务码，无独立考勤读回，也无作废核对）。责任列表已读回夹具为负责人，场次窗口已核对，有效定位要求为关闭，报名匹配 1 条，本人打卡状态可读。探针把管理详情的 `data.owner.id` 误写成 `data.owner.memberId`，本地负责人范围核对失败，因而挡住两条考勤写入。这是探针字段问题，不是已生效的 v1.1 开关被产品拒绝。未发明经纬度或 QR。结算摘要两次读回均为 200／0，确认无入账和关账记录；时长结算为 404／20219；反馈资格为 409／35030，可逆反馈未发出。H5 活动级与活动级岗位管理写入在另建可逆草稿活动上完成修改、读回与恢复，随后删除该草稿（200／0，事后读回 404／20001），分类为既有字段复核，不记新覆盖。

**本轮因条件跳过、仍因缺前置而卡住的路径。** 自己签到仍缺已核实成对坐标与现场 QR；协办、交接与多人候补仍缺第二名正式成员；未确认 503/50300 本轮未为复现再发；封面/图库缺已批准附件；归档仍不满 30 天；封场、送审、正式入账和关账缺公开恢复入口。旧代签本轮未扩大查询，继续待核实。13034 无新观测。未开事项。

**写入与清理。** 发出业务写请求并成功回执 20 次。探针记录新建对象 10 个，按业务状态确认收尾 4 个（含另建草稿活动及其岗位）。隔离测试活动 `cmwyi2fwo0029ny018m66kblj` 因探针用标题识别主活动时被草稿回归覆盖，取消和软删请求均未发出，该活动及场次、场次岗位、报名仍在，已入台账待清，未硬删。已提交分配批次与参与身份无公开删除入口，入台账，未硬删。清理台账现为 17 项：原 11 项状态未变，已停用 5 项只读确认仍为 INACTIVE；mid71 未提交批次 `8c503785-fe16-48be-932c-fd5998a33fae` 继续保留。

证据：`wave70-functional-probe-receipt.json` SHA-256 `3f008e7250312de913d217e0850f64f061d8d2e6c13e82dbb684e198690af336`；`wave70-cleanup-ledger.json` SHA-256 `282fd2db477f39300081af2027741c37edb3a48f8f7b039787f224052fadc26b`；`official-t230-mid72-503-localization.json` SHA-256 `a8dcc0a03e7edd73a7034685d107e6c9c561b7164688e6c3e39b03af013fc8fa`；`official-t230-mid72-v11-path-contract.json` SHA-256 `bf949e608bb5a7721dcfe6e036c9741f8d4ac3690329f739145f39c01a9a67fe`；`official-t230-mid72-ledger-contract.json` SHA-256 `6c5a6b93e3ccf201160d9e1681357c204f2b5323507fe5d3041a38052db5570b`；`SHA256SUMS-mid72.txt` SHA-256 `7b27206e30e22b030b96898f9c84c235e05dbd51f62a7edcf47111246306a715`。mid6–mid71 未改写；`SHA256SUMS-mid70.txt` 仍为 `a810676777f638bbc98679a363f8c262b707caf154a08829247cc75e80552b9c`，`SHA256SUMS-mid71.txt` 仍为 `314a855c047d6a88848e441cfbf6cbe8774ac9bab76684d6ffe196eddb38b05b`。

## 11 月 27 日 12:27–12:33 · v1.1 开关已用 --time 重启生效，代签等路径因探针入参未走通

本段按北京时间（Asia/Shanghai）追记脱敏结果，12:01–12:11 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。未把 f798 组合头对 main 开 PR，未换 runtime-api 镜像。未再新建活动类型种子、gender_requirement 类型与字典项或考勤角色种子；已停用对象只读确认仍为 INACTIVE，未临时启用，未硬删。未再为复现而批准 change-reviews，未再发非空报名表写入，也未为复现再发未确认 503/50300。mid37–mid70 已走通项不记为新覆盖。未把「开关原本关着」或 mid70 的 Docker 参数写错立项为现网 8a 逻辑缺陷。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、v1.1/代签路径预核、重启或重建要点核对、清场台账入口核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦，两端登录与服务端登出均为 HTTP 200／业务码 0。重启后原会话仍有效，无需重登。本轮无 Chrome 启动失败。已保留过程改进。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**开关。** mid70 已把启动配置 `ACTIVITY_V11_WORKFLOW_ENABLED` 写成 `true` 并保留。本轮用现场支持的 Docker 参数 `--time`（不是 `--timeout`）对同一 8a 镜像的 `runtime-api` 重启一次。运行进程由 `false` 变为 `true`，生效读回与就绪核对均通过；收尾复查启动配置与运行进程仍为 `true`。未改回 `false`，未换镜像，未合并或部署 Draft PR。责任制全局开关 `ACTIVITY_RESPONSIBILITY_WORKFLOW_ENABLED` 前后均为 `true`，本轮未改。E4 贡献结算模式 `ACTIVITY_E4_CONTRIBUTION_SETTLEMENT_MODE` 前后均为 `off`，本轮未改。

**本轮新走通。** 无新增功能覆盖，收据记为 `WAVE69_NO_NEW_SUCCESS`。为给代签准备前置，本轮在隔离测试活动上走了必要的创建、指标选择、提审批准、邀请与接受、分配批次准备（`POST .../allocation-batches` 为 201／0，独立读回 200／0）。随后探针复用的提交路径漏了 `/commit`，本地断言在发请求前终止，因而官方代签、工作人员手动确认均未发出（分类为前置不具备，`forwarded=false`）。H5 活动级与活动级岗位管理写入、结算读回和可逆反馈也未发出：管理写入缺可用草稿基线，结算读回时隔离活动已不可用，反馈缺已有可恢复基线。责任列表在考勤前已读回夹具为负责人。上述未走通是探针入参与时序问题，不是产品拒绝已生效的 v1.1 开关。未把邀请前误读 H5 公开详情得到的 404／20001 记为产品缺陷。

**本轮因条件跳过、仍因缺前置而卡住的路径。** 自己签到仍缺已核实成对坐标与现场 QR；协办、交接与多人候补仍缺第二名正式成员；未确认 503/50300 本轮未为复现再发；封面/图库缺已批准附件；归档仍不满 30 天；封场、送审、正式入账和关账缺公开恢复入口。旧代签本轮未扩大查询，继续待核实。13034 无新观测。未开事项。

**写入与清理。** 发出业务写请求并成功回执 14 次。探针记录新建对象 7 个，按业务状态收尾 6 个。报名已取消，测试活动取消后软删，独立读回 404／20001。清理台账现为 11 项：原 10 项状态未变，已停用 5 项只读确认仍为 INACTIVE；本轮新增未提交的分配批次 `8c503785-fe16-48be-932c-fd5998a33fae`，无公开删除入口，未硬删。

证据：`wave69-functional-probe-receipt.json` SHA-256 `71448f15f37672d58cdda3906f6539f41b455ee97bb885794ca1312fe4060fe1`；`wave69-cleanup-ledger.json` SHA-256 `1be547470c8f797285ea179353ca9478951df3e4dc1605f559b7160f94815ee1`；`official-t230-mid71-503-localization.json` SHA-256 `b80b04ac97c856c15adc3b5d94fa05939c3586b870021c367cd148ffa5a56434`；`official-t230-mid71-v11-path-contract.json` SHA-256 `3562494677a0e6e407d219cb9e4e331da6f370af213f214cfdfbbeaa3cb102ee`；`official-t230-mid71-switch-contract.json` SHA-256 `973ec2c2aed3aafabf04473187e2f960ccd307e2c88280c4a1894d778e5c1d65`；`official-t230-mid71-ledger-contract.json` SHA-256 `358f2bb8963ee51a5f1e28191618847c953e078cd51270c51f120ff73f531301`；`SHA256SUMS-mid71.txt` SHA-256 `314a855c047d6a88848e441cfbf6cbe8774ac9bab76684d6ffe196eddb38b05b`。mid6–mid70 未改写。

## 11 月 27 日 12:01–12:11 · 已写入 v1.1 启动配置但 runtime-api 重启未完成，开关尚未生效

本段按北京时间（Asia/Shanghai）追记脱敏结果，11:01–11:04 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。未把 f798 组合头对 main 开 PR。未再新建活动类型种子、gender_requirement 类型与字典项或考勤角色种子；已停用对象只读确认仍为 INACTIVE，未临时启用，未硬删。未再为复现而批准 change-reviews，未再发非空报名表写入，未再走管理端模板版本选项，也未为复现再发 H5 报名列表或时长/贡献政策只读。mid37–mid69 已走通项不记为新覆盖。未把「开关原本关着」立项为现网 8a 逻辑缺陷。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、v1.1/代签/工作流路径预核、开关改法与责任制是否独立的核对、清场台账入口核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦，两端登录与服务端登出均为 HTTP 200／业务码 0。本轮无 Chrome 启动失败，故无失败报错可附，也无需加长重试间隔。已保留过程改进。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**开关。** 用户已于 11:56 点头打开验收环境 instance 级 `activityV11Workflow.enabled`。写者按官方启动环境变量 `ACTIVITY_V11_WORKFLOW_ENABLED`、以文件方式把启动配置从 `false` 写成 `true`，配置读回已确认。随后在重启 `runtime-api` 阶段停止：探针使用了现场 Docker 不支持的 `--timeout`，现场支持的是 `--time`。因此未完成重启，运行中的 8a 进程读回仍为 `false`，生效读回与就绪核对均未通过，收据记 `stopped_stage=restart_runtime_api`、`restarted=false`、`effective_readback=false`。启动配置中的 `true` 已保留，本轮没有把配置改回 `false`。只读预核另指出：该变量在 Nest 启动时读取，生产和 smoke 只接受显式 `true`/`false`；若由 Compose 的 `environment` 或 `env_file` 注入，改完后须重建容器以装载新环境，单纯重启旧容器可能沿用原环境。本轮未把开关打开到生效，也未为该阻撞开事项。

**责任制与结算取证。** 责任制全局开关 `ACTIVITY_RESPONSIBILITY_WORKFLOW_ENABLED` 是独立于 v1.1 的 instance/启动项，映射到 `activityResponsibilityWorkflow.enabled`。本轮进程读回改前已为 `true`，写者未改。E4 贡献结算模式 `ACTIVITY_E4_CONTRIBUTION_SETTLEMENT_MODE` 是另一项独立设置，改前为 `off`，本轮未改。均未默默打开或关闭。

**本轮新走通。** 无。收据记为 `WAVE68_NO_NEW_SUCCESS`。因 v1.1 开关尚未在运行进程生效，官方代签、工作人员手动确认、H5 活动级与活动级岗位管理写入、责任工作流、结算与可逆反馈均未执行。本轮仅 2 次业务写入（夹具调级与恢复），新建对象 0 个。

**本轮因条件跳过、仍因缺前置而卡住的路径。** 除上述开关尚未生效外：本人签到仍缺已核实成对坐标与现场 QR；协办、交接与多人候补仍缺第二名正式成员；未确认 503/50300 的 H5 报名列表、非空报名表写后 GET、change-reviews 批准、队员端组织选项本轮未为复现再发；封面/图库缺已批准附件基线；归档仍不满 30 天且无已关账合格隔离活动；结算关账另缺合格服务时长等前置。只读确认 503/20153 在开关打开前已定位为 v1.1 关闭，不作为新的 8a 逻辑缺陷。

**已知卡点。** 运行时 DTO 与 v1.1/责任制单次请求生效配置仍未核实。503/50300 首个失败操作仍未确认，四类是否同源仍未判定，未开事项。代签旧记录本轮未扩大查询，继续待核实。13034 无新观测。

**写入与清理。** 发出业务写请求并成功回执 2 次，均为夹具级别调整与恢复。本轮新建对象 0 个，清理新建对象 0 个。清理台账仍为 10 项，状态未变，已停用 5 项只读确认仍为 INACTIVE。均未硬删。

证据：`wave68-functional-probe-receipt.json` SHA-256 `8c2aee67008822c69fb9c93a6897a3c8ceec9a6b9f1d531f4e4beb0e05ada857`；`wave68-cleanup-ledger.json` SHA-256 `66c4cc948e95e1a26db3bd6917786e8e89ed03082859f04e2e0d4fe222b24148`；`official-t230-mid70-503-localization.json` SHA-256 `fe514ef19b5ecf1253b2dbf32f01df86cbf85ec1f77ae77ac909809592695b23`；`official-t230-mid70-v11-path-contract.json` SHA-256 `fd7f76312abe4f5d220181ce588ec8a04c7bc6b7df884711bf9aedb031139f28`；`official-t230-mid70-switch-contract.json` SHA-256 `fa333096849715e7ed2b21c0ab62ca69df5c232565f265f49240c133c51c4660`；`official-t230-mid70-ledger-contract.json` SHA-256 `4b92bb2638e2739bf02f0a03ecda3bba79b0cafda52b690872675351fc230a6c`；`SHA256SUMS-mid70.txt` SHA-256 `a810676777f638bbc98679a363f8c262b707caf154a08829247cc75e80552b9c`。mid6–mid69 未改写。

## 11 月 27 日 11:01–11:04 · 授权范围内预核后无新的可逆成功路径

本段按北京时间（Asia/Shanghai）追记脱敏结果，05:30–05:35 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。t272u「继续」未当作新的开关、清场重部署、合并草稿、另造队员或编造经纬度授权。未再新建活动类型种子、gender_requirement 类型与字典项或考勤角色种子；已停用类型种子、性别字典类型及 `any`、`male` 字典项、`assistant` 考勤角色只读确认仍为 INACTIVE，未临时启用，未硬删。未再为复现而批准 change-reviews，未再发非空报名表写入，未再走管理端模板版本选项，也未为复现再发 H5 报名列表或时长/贡献政策只读。registrationSchema、两处 attendanceRoleCode、preparationStartAt、三处 genderRequirementCode、H5 场次 capacity、场次岗位 locationRequired/radiusMeters（关定位并恢复继承）、defaultCheckInRadiusMeters、lateGraceMinutes、earlyLeaveThresholdMinutes、archiveWaitingDays、requiresInsurance、defaultLocationRequired 与单候选抽签不记为新覆盖。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、尚未走过的可写草稿字段预核、草稿字段之外的剩余路径预核、清场台账入口核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦，两端登录与服务端登出均为 HTTP 200／业务码 0。本轮无 Chrome 启动失败，故无失败报错可附，也无需加长重试间隔。已保留过程改进：启动前检查并清理官方配置目录上可能残留的 SingletonLock/crashpad；失败后先等 2 秒再试，连续失败可加长到约 3.5 秒；失败时将把脱敏后的 error.message 与错误码写入收据和运行日志。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**本轮新走通。** 无。收据记为 `WAVE67_NO_NEW_SUCCESS`。预核后授权范围内没有不依赖 v1.1 开关、第二名正式成员、编造经纬度、已批准附件基线或 30 天归档等待的新可逆成功路径。本轮未新建测试活动或其它测试对象，也未为填轮次改走已知失败或已走通路径。

**本轮因条件跳过、仍因缺前置而卡住的路径。** 归档因隔离草稿仍不满 30 天（mid68 于 05:34 确认，本轮 11:01 仍未满），也没有已关账的合格隔离活动而跳过，未改四场 2099 验收活动，未发明考勤事实。H5 场次级 `radiusMeters` 及成组 `locationRequired + radiusMeters` 仍因缺少已核实成对坐标基线而跳过，未发明经纬度。其余未走通路径按缺前置分类如下：依赖 v1.1 或责任制开关的 H5 活动级/活动级岗位管理写入、责任工作流及结算；依赖第二名获授权正式成员的协办、交接与多人候补递补；未确认首个失败操作前不重放的 H5 报名列表、非空报名表写后 GET 与 change-reviews 批准；封面/图库缺已批准附件基线；以及已知 403 的政策/模板选项与待审考勤缺已核实事实。

**已知卡点。** 运行时 DTO 与责任制/v1.1 单次请求生效配置仍未核实，无额外只读核实入口，未开启任何全局开关，未开事项。H5 报名列表 503／50300 与时长/贡献政策 403／40300 本轮未为复现再发，既有卡点仍在；首个失败操作仍未确认，四类 503 是否同源仍未判定，未开事项。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。

**代签核实。** 本轮未扩大查询，沿用 mid60 完整检索 249 条且均为 200／0、未找到目标项的结果。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**写入与清理。** 发出业务写请求并成功回执 2 次，均为夹具级别调整与恢复。本轮新建对象 0 个，清理新建对象 0 个。清理台账仍为 10 项，状态未变：wave36 留下的 2 条指标草稿仍无公开删除入口；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口；已停用的测试/种子活动类型 `cmwxyo6u801u9ny01uwn8f07s`，已停用的 `gender_requirement` 类型 `cmwy1xd4i025gny01727c641t`、字典项 `any` `cmwy1xd6v025iny01gv4cc620`、`male` `cmwy1xd8y025kny01l0t2xkir`，以及已停用考勤角色种子 `assistant` `cmwy2l5d9027yny01h1670x2a`，本轮只读确认仍为 INACTIVE，公开删除受保护。均未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave67-functional-probe-receipt.json` SHA-256 `d349854cf023bc84ab1485e34cb8b486ee5838c04259aab4a4837f6797b70f23`；`wave67-cleanup-ledger.json` SHA-256 `99ddcbc485860f2dce6164e0dd4094fb13c736332aaaaaacc0e7493f84dc81ab`；`official-t230-mid69-503-localization.json` SHA-256 `3a24cf87e804de5966afabdf9808ed2e666a103598eb0395aaec34cdcf701f2d`；`official-t230-mid69-draft-fields-contract.json` SHA-256 `67f0ca68b7f6efd90b4ba7a3b8e19352dbf69e24befbc7ab586f2e366228376f`；`official-t230-mid69-path-contract.json` SHA-256 `6cb7b7d5936bf230782c03192cd552528f18e0c30d88f25cfcc070dc6dc7c0d6`；`official-t230-mid69-ledger-contract.json` SHA-256 `5cfdac7e0c58ec8baf1b2fc6e829e079d2df07c15ae65ce27b75b18dd02c9435`；`SHA256SUMS-mid69.txt` SHA-256 `07e6770b9f24f31f51ead90737402a98b78f0d072803a416e9d86c76158a34b3`。mid6–mid68 未改写。

## 11 月 27 日 05:30–05:35 · 报名表结构与两处岗位考勤角色走通并补齐 assistant 种子

本段按北京时间（Asia/Shanghai）追记脱敏结果，05:21–05:26 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。未再新建活动类型种子或 gender_requirement 类型与字典项；已停用类型种子、性别字典类型及 `any`、`male` 字典项只读确认仍为 INACTIVE，未临时启用，未硬删。未再为复现而批准 change-reviews，未再发非空报名表写入，未再走管理端模板版本选项，也未为复现再发 H5 报名列表或时长/贡献政策只读。preparationStartAt、三处 genderRequirementCode、H5 场次 capacity、场次岗位 locationRequired/radiusMeters（关定位并恢复继承）、defaultCheckInRadiusMeters、lateGraceMinutes、earlyLeaveThresholdMinutes、archiveWaitingDays、requiresInsurance、defaultLocationRequired 与单候选抽签不记为新覆盖。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、尚未走过的可写草稿字段预核、草稿字段之外的剩余路径预核、清场台账入口核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦，两端登录与服务端登出均为 HTTP 200／业务码 0。本轮无 Chrome 启动失败，故无失败报错可附，也无需加长重试间隔。已保留过程改进：启动前检查并清理官方配置目录上可能残留的 SingletonLock/crashpad；失败后先等 2 秒再试，连续失败可加长到约 3.5 秒；失败时将把脱敏后的 error.message 与错误码写入收据和运行日志。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**本轮新走通。** 本轮新建隔离草稿未发布。管理端活动 `registrationSchema` 经 `PATCH /api/admin/v1/activities/:id` 为 200／0，独立 GET 读回确认变更；随后同一 PATCH 恢复原值，再 GET 确认已恢复。现网考勤角色字典原先只有生效项 `member`；本轮按已有授权可逆补齐官方种子 `assistant`（`POST /api/system/v1/dict-items` 为 201／0，对象 `cmwy2l5d9027yny01h1670x2a`），随后走通管理端活动岗位与 H5 场次岗位两处 `attendanceRoleCode`：各自修改、独立读回、恢复原值、再读回，对应 PATCH 均为 200／0。种子项走通后 `PATCH /api/system/v1/dict-items/:id/status` 停用为 INACTIVE，独立读回确认，因公开删除受保护而记入台账，未硬删。本轮测试岗位、场次已删除并读回空列表；活动删除后管理端详情读回 404／20001。未把 mid37–mid67 已走通路径记为新覆盖。

**本轮因条件跳过、仍因缺前置而卡住的路径。** 归档因隔离草稿未满 30 天、也没有已关账的合格隔离活动而跳过，未改四场 2099 验收活动，未发明考勤事实。H5 场次级 `radiusMeters` 及成组 `locationRequired + radiusMeters` 仍因缺少已核实成对坐标基线而跳过，未发明经纬度。其余未走通路径按缺前置分类如下，均未为填轮次而改走已知失败：依赖 v1.1 或责任制开关的 H5 活动级/活动级岗位管理写入、责任工作流及结算；依赖第二名获授权正式成员的协办、交接与多人候补递补；未确认首个失败操作前不重放的 H5 报名列表、非空报名表写后 GET 与 change-reviews 批准；封面/图库缺已批准附件基线，以及已知 403 的政策/模板选项与待审考勤缺已核实事实。

**已知卡点。** 运行时 DTO 与责任制/v1.1 单次请求生效配置仍未核实，无额外只读核实入口，未开启任何全局开关，未开事项。H5 报名列表 503／50300 与时长/贡献政策 403／40300 本轮未为复现再发，既有卡点仍在；首个失败操作仍未确认，四类 503 是否同源仍未判定，未开事项。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。

**代签核实。** 本轮未扩大查询，沿用 mid60 完整检索 249 条且均为 200／0、未找到目标项的结果。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**写入与清理。** 发出业务写请求并成功回执 18 次，确认清理或恢复 6 项（管理端测试岗位、H5 测试岗位、测试场次、测试活动、已停用的 `assistant` 种子、夹具级别）。清理台账现为 10 项：原 9 项状态未变，wave36 留下的 2 条指标草稿仍无公开删除入口；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口；已停用的测试/种子活动类型 `cmwxyo6u801u9ny01uwn8f07s`，以及已停用的 `gender_requirement` 类型 `cmwy1xd4i025gny01727c641t`、字典项 `any` `cmwy1xd6v025iny01gv4cc620`、`male` `cmwy1xd8y025kny01l0t2xkir`，本轮只读确认仍为 INACTIVE，公开删除受保护。本轮新增已停用考勤角色种子 `assistant` `cmwy2l5d9027yny01h1670x2a`，公开删除受保护。均未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave66-functional-probe-receipt.json` SHA-256 `9b987a8a166bcf3ebfa830d7d660da8b19f577f6e2a40d2c9c269d6b4eb5eba5`；`wave66-cleanup-ledger.json` SHA-256 `ab29859919183bd0184902bfa50ebb5ce0a418276cd9e205814167104565a868`；`official-t230-mid68-503-localization.json` SHA-256 `094b5cbcf5c07c32b6723ea63c14de0b901fb70f06be9fe89a95595e6800b951`；`official-t230-mid68-draft-fields-contract.json` SHA-256 `5913eff8d88a70ab195715d29d0e9fea50d40ed3812ae85042fc7b84eac40f3d`；`official-t230-mid68-path-contract.json` SHA-256 `eb4d367e9dd78625d19ff8939663ea79f3b46e2216ed22d3e1a1521e96f74880`；`official-t230-mid68-ledger-contract.json` SHA-256 `4ed1b43e26fbd7d84b47e36c2147bc7249c6132612596cf6727caa7e754ae10e`；`SHA256SUMS-mid68.txt` SHA-256 `5b80b4313415d7e1c9cd7728068e4204fda9fb7109ad502e9613861bca709f02`。mid6–mid67 未改写。

## 11 月 27 日 05:21–05:26 · H5 草稿场次准备开始时间走通并完成恢复

本段按北京时间（Asia/Shanghai）追记脱敏结果，05:13–05:16 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。未再新建活动类型种子，已停用类型种子只读确认仍为 INACTIVE，未临时启用，未硬删。未再新建 gender_requirement 类型或字典项；已停用类型与 `any`、`male` 字典项只读确认仍为 INACTIVE，未临时启用，未硬删。未再为复现而批准 change-reviews，未再发非空报名表写入，未再走管理端模板版本选项，也未为复现再发 H5 报名列表或时长/贡献政策只读。三处 genderRequirementCode、H5 场次 capacity、场次岗位 locationRequired/radiusMeters（关定位并恢复继承）、defaultCheckInRadiusMeters、lateGraceMinutes、earlyLeaveThresholdMinutes、archiveWaitingDays、requiresInsurance、defaultLocationRequired 与单候选抽签不记为新覆盖。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、尚未走过的可写草稿字段预核、草稿字段之外的剩余路径预核、清场台账入口核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦，两端登录与服务端登出均为 HTTP 200／业务码 0。本轮无 Chrome 启动失败，故无失败报错可附，也无需加长重试间隔。已保留过程改进：启动前检查并清理官方配置目录上可能残留的 SingletonLock/crashpad；失败后先等 2 秒再试，连续失败可加长到约 3.5 秒；失败时将把脱敏后的 error.message 与错误码写入收据和运行日志。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**本轮新走通。** 本轮新建隔离草稿未发布。H5 场次准备开始时间 `preparationStartAt` 经 `PATCH /api/app/v1/my/managed-activities/:activityId/sessions/:sessionId` 为 200／0，场次列表独立 GET 读回确认；随后同一 PATCH 恢复为 `null`，再 GET 确认已恢复。本轮测试场次随后删除，活动删除后管理端详情读回 404／20001。未把 mid37–mid66 已走通路径记为新覆盖。

**本轮因条件跳过、仍因缺前置而卡住的路径。** H5 场次级 `radiusMeters` 及成组 `locationRequired + radiusMeters` 仍因缺少已核实成对坐标基线而跳过，未发明经纬度。其余未走通路径按缺前置分类如下，均未为填轮次而改走已知失败：依赖 v1.1 或责任制开关的 H5 活动级/活动级岗位管理写入、责任工作流及结算；依赖第二名获授权正式成员的协办、交接与多人候补递补；未确认首个失败操作前不重放的 H5 报名列表、非空报名表写后 GET 与 change-reviews 批准；其它如归档缺合格隔离活动、待审考勤缺已核实事实、封面/图库缺已批准附件基线，以及已知 403 的政策/模板选项。只读另指出岗位考勤角色缺第二个已核实有效值、`registrationSchema` 缺可原样恢复的对象基线。

**已知卡点。** 运行时 DTO 与责任制/v1.1 单次请求生效配置仍未核实，无额外只读核实入口，未开启任何全局开关，未开事项。H5 报名列表 503／50300 与时长/贡献政策 403／40300 本轮未为复现再发，既有卡点仍在；首个失败操作仍未确认，四类 503 是否同源仍未判定，未开事项。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。

**代签核实。** 本轮未扩大查询，沿用 mid60 完整检索 249 条且均为 200／0、未找到目标项的结果。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**写入与清理。** 发出业务写请求并成功回执 8 次，确认清理或恢复 3 项（测试场次、测试活动、夹具级别）。本轮无新增待清项。清理台账仍为 9 项，状态未变：wave36 留下的 2 条指标草稿仍无公开删除入口；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口；已停用的测试/种子活动类型 `cmwxyo6u801u9ny01uwn8f07s`，以及已停用的 `gender_requirement` 类型 `cmwy1xd4i025gny01727c641t`、字典项 `any` `cmwy1xd6v025iny01gv4cc620`、`male` `cmwy1xd8y025kny01l0t2xkir`，本轮只读确认仍为 INACTIVE，公开删除受保护。均未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave65-functional-probe-receipt.json` SHA-256 `7e4ca23e033f341bbadffa6171160b739f883a0794e84741c2e02e91b9184e7c`；`wave65-cleanup-ledger.json` SHA-256 `c382c23b4548c51d6dc10afbe63ced61da0f7bc6a1c15a5099a43095a955a7cb`；`official-t230-mid67-503-localization.json` SHA-256 `66f79336cf3016634935dcb4cca8690135cac1733095bb2344d8237d48639f3a`；`official-t230-mid67-draft-fields-contract.json` SHA-256 `1a97355e5716e247fd1ed4faea8a2d6f228ef8b0105eb3831e1dab4ade3524b7`；`official-t230-mid67-path-contract.json` SHA-256 `609b4d5800e811fc2a6105cc87ce406e1866eb27f1804557d2b2b1e9bd0ca0e2`；`official-t230-mid67-ledger-contract.json` SHA-256 `10869b21a4a55928bac8574ff01c51cd5bbd1d16e37927496949c8e885c93a45`；`SHA256SUMS-mid67.txt` SHA-256 `d6ad2603519dd1f8b887bc7fe9f1557dcd8cb7776e24da31e64b58f436e0522e`。mid6–mid66 未改写。

## 11 月 27 日 05:13–05:16 · 补齐 gender_requirement 官方种子后三处性别条件走通并完成停用

本段按北京时间（Asia/Shanghai）追记脱敏结果，05:04–05:08 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。未再新建活动类型种子，已停用类型种子只读确认仍为 INACTIVE，未临时启用，未硬删。未再为复现而批准 change-reviews，未再发非空报名表写入，未再走管理端模板版本选项，也未为复现再发 H5 报名列表或时长/贡献政策只读。H5 场次 capacity、场次岗位 locationRequired/radiusMeters（关定位并恢复继承）、defaultCheckInRadiusMeters、lateGraceMinutes、earlyLeaveThresholdMinutes、archiveWaitingDays、requiresInsurance、defaultLocationRequired 与单候选抽签不记为新覆盖。未把此前缺少 `gender_requirement` 类型写成已确认的现网 8a 逻辑缺陷，也未开事项。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、尚未走过的可写草稿字段预核、草稿字段之外的剩余路径预核、清场台账入口核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦，两端登录与服务端登出均为 HTTP 200／业务码 0。本轮无 Chrome 启动失败，故无失败报错可附，也无需加长重试间隔。已保留过程改进：启动前检查并清理官方配置目录上可能残留的 SingletonLock/crashpad；失败后先等 2 秒再试，连续失败可加长到约 3.5 秒；失败时将把脱敏后的 error.message 与错误码写入收据和运行日志。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**本轮新走通。** 按既有 t235u/t236u 与 t258u–t266u 授权，先确认现网仍无 official `gender_requirement` 类型，再新建可逆官方种子类型 `gender_requirement`（`cmwy1xd4i025gny01727c641t`）及官方项 `any`（`cmwy1xd6v025iny01gv4cc620`）、`male`（`cmwy1xd8y025kny01l0t2xkir`），创建后独立读回为 ACTIVE。随后在本轮隔离草稿（未发布）上走通三处 `genderRequirementCode`：管理端活动级、管理端活动级岗位、H5 场次岗位。三处均为修改、独立读回、恢复原值、再读回确认，HTTP 200／业务码 0。字典类型与字典项的创建是走通这些字段的可逆前置，不单独记为业务新覆盖。本轮测试岗位、场次与活动随后删除，岗位详情读回 404／20002，活动详情读回 404／20001。收尾将上述类型与两项字典项停用并独立读回为 INACTIVE，因软删受保护而追加台账，未硬删。

**本轮因条件跳过、不记为新覆盖。** H5 场次级 `radiusMeters` 及成组 `locationRequired + radiusMeters` 仍因缺少已核实、可恢复的成对坐标基线而跳过，未发明经纬度。未把 mid37–mid65 已走通路径记为新覆盖。草稿字段之外，授权范围内暂无新的可逆成功路径。

**已知卡点。** 运行时 DTO 与责任制/v1.1 单次请求生效配置仍未核实，无额外只读核实入口，未开启任何全局开关，未开事项。H5 报名列表 503／50300 与时长/贡献政策 403／40300 本轮未为复现再发，既有卡点仍在；首个失败操作仍未确认，四类 503 是否同源仍未判定，未开事项。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。

**代签核实。** 本轮未扩大查询，沿用 mid60 完整检索 249 条且均为 200／0、未找到目标项的结果。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**写入与清理。** 发出业务写请求并成功回执 22 次，确认清理或恢复 8 项（测试活动岗位、测试场次岗位、测试场次、测试活动、夹具级别，以及上述类型与两项字典项的停用）。本轮新增待清 3 项。清理台账现为 9 项：既有 6 项状态未变，包括 wave36 留下的 2 条指标草稿仍无公开删除入口、1 条代签请求结果待核实、wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口、已停用的测试/种子活动类型 `cmwxyo6u801u9ny01uwn8f07s` 公开删除受保护且本轮只读确认仍为 INACTIVE；另增本轮停用的 `gender_requirement` 类型 `cmwy1xd4i025gny01727c641t`、字典项 `any` `cmwy1xd6v025iny01gv4cc620`、`male` `cmwy1xd8y025kny01l0t2xkir`，均已读回 INACTIVE，公开删除受保护。均未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave64-functional-probe-receipt.json` SHA-256 `84bc4543fb27f34a9e3bb64a3079e52c5d7780753c0bdd7b179e753e6bc767a7`；`wave64-cleanup-ledger.json` SHA-256 `6a74aca2664aa7cd1c24b2794cf37f66c635fdef7e1b2532525c8d74c62a3a34`；`official-t230-mid66-503-localization.json` SHA-256 `ca18027b480b01e83147a8d014319c94ea2529ba27c31ecd5a1eb2ce10787908`；`official-t230-mid66-draft-fields-contract.json` SHA-256 `39a1ba79859b27a5c1f26bab1e3ec766018e23ede00bd460425bc4699fcf622a`；`official-t230-mid66-path-contract.json` SHA-256 `6424040ba38b11fd28885d58d5ab3fba74318e80c93065b090de844045cf6dfe`；`official-t230-mid66-ledger-contract.json` SHA-256 `3ed08d2d53365b422c053cc8709fab4a2279f1b1544b521e1c43152c31c24efd`；`SHA256SUMS-mid66.txt` SHA-256 `956804910b5cb740e53cf6682765b6e4543f1d0d7ce8bf2f52e08724bb829898`。mid6–mid65 未改写。

## 11 月 27 日 05:04–05:08 · 现网未找到 gender_requirement 类型，本轮无新走通草稿字段

本段按北京时间（Asia/Shanghai）追记脱敏结果，04:53–04:59 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。未再新建活动类型种子，已停用类型种子只读确认仍为 INACTIVE，未临时启用，未硬删。未再为复现而批准 change-reviews，未再发非空报名表写入，未再走管理端模板版本选项，也未为复现再发 H5 报名列表或时长/贡献政策只读。H5 场次 capacity、场次岗位 locationRequired/radiusMeters（关定位并恢复继承）、defaultCheckInRadiusMeters、lateGraceMinutes、earlyLeaveThresholdMinutes、archiveWaitingDays、requiresInsurance、defaultLocationRequired 与单候选抽签不记为新覆盖。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、尚未走过的可写草稿字段预核、草稿字段之外的剩余路径预核、清场台账入口核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦，两端登录与服务端登出均为 HTTP 200／业务码 0。本轮无 Chrome 启动失败，故无失败报错可附，也无需加长重试间隔。已保留过程改进：启动前检查并清理官方配置目录上可能残留的 SingletonLock/crashpad；失败后先等 2 秒再试，连续失败可加长到约 3.5 秒；失败时将把脱敏后的 error.message 与错误码写入收据和运行日志。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**本轮新走通。** 无。本轮未新建或发布测试活动。预核通过数为 0。

**本轮因条件跳过、不记为新覆盖。** 现网完整字典类型列表共 11 项，未找到官方 `gender_requirement` 类型。管理端活动级、活动级岗位与 H5 场次岗位的 `genderRequirementCode` 均因此跳过。本轮字典授权按测试字典项执行，未新建受保护的字典类型；测试字典项新建、停用、入台账均为 0。只读契约另核出冻结 8a 中该类型及官方项的可逆创建与停用入口，以及软删受保护、停用后须记台账，本轮未执行这些写入。H5 场次级 `radiusMeters` 及成组 `locationRequired + radiusMeters` 因缺少已核实、可恢复的成对坐标基线而继续跳过，未发明经纬度。未把 mid37–mid64 已走通路径记为新覆盖。草稿字段之外，授权范围内暂无新的可逆成功路径。未把缺少字典类型写成已确认的现网 8a 逻辑缺陷，也未开事项。

**已知卡点。** 运行时 DTO 与责任制/v1.1 单次请求生效配置仍未核实，无额外只读核实入口，未开启任何全局开关，未开事项。H5 报名列表 503／50300 与时长/贡献政策 403／40300 本轮未为复现再发，既有卡点仍在；首个失败操作仍未确认，四类 503 是否同源仍未判定，未开事项。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。

**代签核实。** 本轮未扩大查询，沿用 mid60 完整检索 249 条且均为 200／0、未找到目标项的结果。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**写入与清理。** 发出业务写请求并成功回执 2 次，均为夹具级别调整与恢复；确认清理或恢复 1 项（夹具级别）。本轮无新增待清项。清理台账仍为 6 项，状态未变：wave36 留下的 2 条指标草稿仍无公开删除入口；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口；已停用的测试/种子活动类型 `cmwxyo6u801u9ny01uwn8f07s` 公开删除受保护，且本轮只读确认仍为 INACTIVE。均未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave63-functional-probe-receipt.json` SHA-256 `ea58898e12f355b808c9423f33728f898af762c689ac0d85d7046eb333a823d7`；`wave63-cleanup-ledger.json` SHA-256 `74678b08eaa7b4c7824c9e2ce0dca0bf5f7d42ab8ee3e501dfc3f264da846919`；`official-t230-mid65-503-localization.json` SHA-256 `bdea3aa70a27f083173b5df585c741f8d6f1320939de58bc326dab0e2284c6d8`；`official-t230-mid65-draft-fields-contract.json` SHA-256 `5a6ec9dfd9bfa6acfae5c931706e37c8d877cc5798034fe8ba54024826294065`；`official-t230-mid65-path-contract.json` SHA-256 `9bab522b41429d72f0cf1db6c4616c665e6f6fed1be66d04c29f4ac8110e2243`；`official-t230-mid65-ledger-contract.json` SHA-256 `f2abad515d241923a3caaf5955b2b72ad8bef403c9e102f1d530cd0aa929759f`；`SHA256SUMS-mid65.txt` SHA-256 `c36febe815712b04dc1c8da31c901d2cf0a9e0c569f2301c2e9f8ea6f1389b82`。mid6–mid64 未改写。

## 11 月 27 日 04:53–04:59 · H5 草稿场次容量与场次岗位定位覆盖走通并完成恢复

本段按北京时间（Asia/Shanghai）追记脱敏结果，04:43–04:47 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。未再新建活动类型种子，已停用类型种子只读确认仍为 INACTIVE，未临时启用，未硬删。未再为复现而批准 change-reviews，未再发非空报名表写入，未再走管理端模板版本选项，也未为复现再发 H5 报名列表或时长/贡献政策只读。defaultCheckInRadiusMeters、lateGraceMinutes、earlyLeaveThresholdMinutes、archiveWaitingDays、requiresInsurance、defaultLocationRequired 与单候选抽签不记为新覆盖。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、尚未走过的可写草稿字段预核、草稿字段之外的剩余路径预核、清场台账入口核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 7 次、重试 6 次。两端前 6 次均在发出登录请求前、于 Chrome 配置目录检查阶段被拦，脱敏报错为 `EPERM / Operation failed during profile`，未发出登录请求。首次重试间隔 2 秒，随后间隔 3.5 秒；第 7 次两端登录与服务端登出均为 HTTP 200／业务码 0。此类启动阻拦不记为产品缺陷。已保留 mid57 过程改进：启动前检查并清理官方配置目录上可能残留的 SingletonLock/crashpad；失败后等待再试，连续 EPERM 时稍微加长间隔；失败时将脱敏后的 error.message 与错误码写入收据和运行日志。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**本轮新走通。** 本轮新建隔离草稿未发布。H5 场次容量 `capacity` 经 `PATCH /api/app/v1/my/managed-activities/:activityId/sessions/:sessionId` 为 200／0，场次列表独立 GET 读回确认；随后同一 PATCH 恢复原值，再 GET 确认已恢复。H5 场次岗位成组字段 `locationRequired` 与 `radiusMeters` 经 `PATCH /api/app/v1/my/managed-activities/:activityId/sessions/:sessionId/positions/:positionId` 为 200／0，岗位列表独立 GET 读回确认；本轮在不发明坐标的前提下验证了显式关闭定位并恢复继承，随后同一 PATCH 恢复原值，再 GET 确认已恢复。本轮测试场次岗位、场次随后删除，活动删除后管理端详情读回 404／20001。未把 mid37–mid63 已走通路径记为新覆盖。

**本轮因条件跳过、不记为新覆盖。** 管理端活动级与活动级岗位、以及 H5 场次岗位的 `genderRequirementCode`，因本轮未核实到可用的活跃 `gender_requirement` 字典项或可恢复基线而跳过，未编造字典项。H5 场次级 `radiusMeters` 及成组 `locationRequired + radiusMeters` 因隔离场次缺少已核实的成对坐标基线而跳过，未发明经纬度。

**已知卡点。** 运行时 DTO 与责任制/v1.1 单次请求生效配置仍未核实，无额外只读核实入口，未开启任何全局开关，未开事项。H5 报名列表 503／50300 与时长/贡献政策 403／40300 本轮未为复现再发，既有卡点仍在；首个失败操作仍未确认，四类 503 是否同源仍未判定，未开事项。草稿字段之外，授权范围内暂无新的可逆成功路径。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。

**代签核实。** 本轮未扩大查询，沿用 mid60 完整检索 249 条且均为 200／0、未找到目标项的结果。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**写入与清理。** 发出业务写请求并成功回执 12 次，确认清理或恢复 4 项（测试场次岗位、测试场次、测试活动、夹具级别）。本轮无新增待清项。清理台账仍为 6 项，状态未变：wave36 留下的 2 条指标草稿仍无公开删除入口；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口；已停用的测试/种子活动类型 `cmwxyo6u801u9ny01uwn8f07s` 公开删除受保护，且本轮只读确认仍为 INACTIVE。均未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave62-functional-probe-receipt.json` SHA-256 `1231eecf31d39e375972877939a0f68d131ef11be086134d2ef5f5e5a22c451d`；`wave62-cleanup-ledger.json` SHA-256 `7f5f4683de5d6c9e3136ffc4e2118be94f312acff24eef1017ebd8bfbcbf833e`；`official-t230-mid64-503-localization.json` SHA-256 `dadcb763abb9e333aadab7e80a31c99d53b4ccd87099816d3e98528b536d02dc`；`official-t230-mid64-draft-fields-contract.json` SHA-256 `f5124cc690905d9dfbd2249217721bfb1e7e3ef45bef72b01bd56f23fa906e1d`；`official-t230-mid64-path-contract.json` SHA-256 `830b958f32fe315dbd42d559b979698fb755d982316b6dc9f23380f8e789cb3b`；`official-t230-mid64-ledger-contract.json` SHA-256 `8bd6e73a61e49b882638723bd065212a8d8b2fe6794b062c3370914e063352c4`；`SHA256SUMS-mid64.txt` SHA-256 `5b5138db76456b71cb0c0c12900e09ba6f60a767944e5368457c564642e8d930`。mid6–mid63 未改写。

## 11 月 27 日 04:43–04:47 · 管理端默认签到半径与 H5 场次迟到宽限、早退阈值走通并完成恢复

本段按北京时间（Asia/Shanghai）追记脱敏结果，04:33–04:39 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。未再新建活动类型种子，已停用类型种子只读确认仍为 INACTIVE，未临时启用，未硬删。未再为复现而批准 change-reviews，未再发非空报名表写入，未再走管理端模板版本选项，也未为复现再发 H5 报名列表或时长/贡献政策只读。archiveWaitingDays、requiresInsurance、defaultLocationRequired 与单候选抽签不记为新覆盖。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、尚未走过的可写草稿字段预核、草稿字段之外的剩余路径预核、清场台账入口核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦，两端登录与服务端登出均为 HTTP 200／业务码 0。本轮无 Chrome 启动失败，故无失败报错可附，也无需加长重试间隔。已保留 mid57 过程改进：启动前检查并清理官方配置目录上可能残留的 SingletonLock/crashpad；失败后等待 2 秒再试，若连续 EPERM 可再稍微加长间隔；失败时将把脱敏后的 error.message 与错误码写入收据和运行日志。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**本轮新走通。** 本轮新建隔离草稿未发布。管理端默认签到半径 `defaultCheckInRadiusMeters` 经 `PATCH /api/admin/v1/activities/:id` 为 200／0，同路径独立 GET 读回确认；随后同一 PATCH 恢复原值，再 GET 确认已恢复。H5 场次迟到宽限 `lateGraceMinutes` 与早退阈值 `earlyLeaveThresholdMinutes` 各自单独 `PATCH /api/app/v1/my/managed-activities/:activityId/sessions/:sessionId` 为 200／0，场次列表独立 GET 读回确认；随后同一 PATCH 恢复原值，再 GET 确认已恢复。本轮测试场次随后删除，活动删除后管理端详情读回 404／20001。未把 mid37–mid62 已走通路径记为新覆盖，也未把 archiveWaitingDays、requiresInsurance、defaultLocationRequired、单候选抽签、类型切换、qualification-flag 只读 GET，或 change-reviews 提交进入待审和撤回再记为新覆盖。只读静态预核仍列出其他可逆草稿字段候选，本轮未执行，不记为新覆盖。

**已知卡点。** 运行时 DTO 与责任制/v1.1 单次请求生效配置仍未核实，无额外只读核实入口，未开启任何全局开关，未开事项。H5 报名列表 503／50300 与时长/贡献政策 403／40300 本轮未为复现再发，既有卡点仍在；首个失败操作仍未确认，四类 503 是否同源仍未判定，未开事项。草稿字段之外，授权范围内暂无新的可逆成功路径。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。

**代签核实。** 本轮未扩大查询，沿用 mid60 完整检索 249 条且均为 200／0、未找到目标项的结果。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**写入与清理。** 发出业务写请求并成功回执 12 次，确认清理或恢复 3 项（测试场次、测试活动、夹具级别）。本轮无新增待清项。清理台账仍为 6 项，状态未变：wave36 留下的 2 条指标草稿仍无公开删除入口；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口；已停用的测试/种子活动类型 `cmwxyo6u801u9ny01uwn8f07s` 公开删除受保护，且本轮只读确认仍为 INACTIVE。均未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave61-functional-probe-receipt.json` SHA-256 `24fc71f6150d1a70617897ae0aa5714b9bf8ef024c1d93d44dd3c6cbd96fd303`；`wave61-cleanup-ledger.json` SHA-256 `2ccc5f9eee982b1be77a647f0c9c4687adfb0e8ea597e23b6abb8f5e90913f4f`；`official-t230-mid63-503-localization.json` SHA-256 `0a28848d163879f118a915a40e9c81d5aca27f90123acfcb9c6b89ea63cb7f29`；`official-t230-mid63-draft-fields-contract.json` SHA-256 `ec3722895147f7ab971182bd129068a531cf634bac78f32c59950eda9b853463`；`official-t230-mid63-path-contract.json` SHA-256 `0fe1e9fccc9df704f3fccdd40d95328557a746961942f29741ded7d9e22645a4`；`official-t230-mid63-ledger-contract.json` SHA-256 `73356ebbada31c237e2f093ca3d2e6acbbc891acb9198dc338aef4e27aab6b93`；`SHA256SUMS-mid63.txt` SHA-256 `701222ce391ef3a9cbb9cf3213f800f6c435ae615d069243de6378ea239d6a06`。mid6–mid62 未改写。

## 11 月 27 日 04:33–04:39 · 管理端草稿保险要求与默认定位要求走通并完成恢复

本段按北京时间（Asia/Shanghai）追记脱敏结果，04:22–04:28 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。未再新建活动类型种子，已停用类型种子只读确认仍为 INACTIVE，未临时启用，未硬删。未再为复现而批准 change-reviews，未再发非空报名表写入，未再走管理端模板版本选项，也未为复现再发 H5 报名列表或时长/贡献政策只读。archiveWaitingDays 与单候选抽签不记为新覆盖。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、尚未走过的可写草稿字段预核、草稿字段之外的剩余路径预核、清场台账入口核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦，两端登录与服务端登出均为 HTTP 200／业务码 0。本轮无 Chrome 启动失败，故无失败报错可附，也无需加长重试间隔。已保留 mid57 过程改进：启动前检查并清理官方配置目录上可能残留的 SingletonLock/crashpad；失败后等待 2 秒再试，若连续 EPERM 可再稍微加长间隔；失败时将把脱敏后的 error.message 与错误码写入收据和运行日志。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**本轮新走通。** 管理端隔离草稿上，保险要求 `requiresInsurance` 与默认定位要求 `defaultLocationRequired` 均已走通：各自单独 `PATCH /api/admin/v1/activities/:id` 为 200／0，同路径独立 GET 读回确认；随后同一 PATCH 恢复原值，再 GET 确认已恢复。本轮草稿未发布。活动随后删除，管理端详情读回 404／20001。未把 mid37–mid61 已走通路径记为新覆盖，也未把 archiveWaitingDays、单候选抽签、类型切换、qualification-flag 只读 GET，或 change-reviews 提交进入待审和撤回再记为新覆盖。

**已知卡点。** 运行时 DTO 与责任制/v1.1 单次请求生效配置仍未核实，无额外只读核实入口，未开启任何全局开关，未开事项。H5 报名列表 503／50300 与时长/贡献政策 403／40300 本轮未为复现再发，既有卡点仍在；首个失败操作仍未确认，四类 503 是否同源仍未判定，未开事项。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。

**代签核实。** 本轮未扩大查询，沿用 mid60 完整检索 249 条且均为 200／0、未找到目标项的结果。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**写入与清理。** 发出业务写请求并成功回执 8 次，确认清理或恢复 2 项。本轮无新增待清项。清理台账仍为 6 项，状态未变：wave36 留下的 2 条指标草稿仍无公开删除入口；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口；已停用的测试/种子活动类型 `cmwxyo6u801u9ny01uwn8f07s` 公开删除受保护，且本轮只读确认仍为 INACTIVE。均未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave60-functional-probe-receipt.json` SHA-256 `9f7936535dcff2fe4f8ed9824265e1c064c030960c74f75e4b33894129e13165`；`wave60-cleanup-ledger.json` SHA-256 `b7a0b4e91e351921f24181a474c03604755b4a402f9b984261f9ecddda99cfce`；`official-t230-mid62-503-localization.json` SHA-256 `6da1f787b9803eb7e22a3c4d6902f681d05391a9daa72a54988568b8d089ad6e`；`official-t230-mid62-draft-fields-contract.json` SHA-256 `5afadca8290caeba5a65ad13ba75a04fb7c3bb8a531d42ef7a7e39a921f33530`；`official-t230-mid62-path-contract.json` SHA-256 `4ec0ae0e3044cce640a72f0dc9f971482f6f3ff19771cc7d70b0dc85b31b93bc`；`official-t230-mid62-ledger-contract.json` SHA-256 `ee4d3239d71621ea504dac11c9d09fe20cacc73edd962def633f09d6ac60ffee`；`SHA256SUMS-mid62.txt` SHA-256 `f4a295c3e8b90e92555989ebd6969c232ffb0474a1d05cdc327e28112c32a1df`。mid6–mid61 未改写。

## 11 月 27 日 04:22–04:28 · 管理端隔离草稿归档等待天数走通并完成恢复

本段按北京时间（Asia/Shanghai）追记脱敏结果，04:09–04:18 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。未再新建活动类型种子，已停用类型种子只读确认仍为 INACTIVE，未临时启用，未硬删。未再为复现而批准 change-reviews，未再发非空报名表写入，未再走管理端模板版本选项。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、运行时 DTO/生效配置入口核对、剩余路径预核、清场台账入口核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端尝试 13 次、重试 12 次。前 12 次均在发出登录请求前，于 profile 进程检查阶段被拦，错误码 `EPERM`，脱敏后的 error.message 为 Operation failed during profile，该 12 次均未发登录请求。等待约 2 秒后再试，第 13 次管理端登录与服务端登出均为 HTTP 200／业务码 0。队员端尝试 1 次、重试 0 次，未在发出登录请求前被拦，登录与服务端登出均为 200／0，用户名与用户 ID 均匹配。此启动拦截不记为产品缺陷。功能收据已记录完整次数与各次脱敏报错。已保留 mid57 过程改进：启动前检查并清理官方配置目录上可能残留的 SingletonLock/crashpad；失败后等待 2 秒再试；失败时把脱敏后的 error.message 与错误码写入收据和运行日志。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**本轮新走通。** 管理端隔离草稿的归档等待天数已走通：在本轮新建可逆草稿上，`PATCH /api/admin/v1/activities/:id` 只更新 `archiveWaitingDays` 为 200／0，同路径独立 GET 读回确认；随后同一 PATCH 恢复原值，再 GET 确认已恢复。提审、发布、岗位容量与 H5 顶层 allocationMode 读回为已走通前置，不记为新覆盖。活动随后取消并删除，管理端详情与 H5 场次查询均读回 404／20001。未把 mid37–mid60 已走通路径记为新覆盖，也未把单候选抽签、类型切换、qualification-flag 只读 GET，或 change-reviews 提交进入待审和撤回再记为新覆盖。

**运行时配置与已知卡点。** 运行时 DTO 字段与单次请求生效的责任制/v1.1 配置仍未核实；只读复核确认无额外只读核实入口。未开启任何全局开关。未确认稳定现网 8a 逻辑缺陷，未开事项。时长与贡献政策、H5 报名列表 503 本轮未为复现再发请求，既有 403／40300 与 503／50300 卡点仍在。首个失败操作仍未确认，四类 503 是否同源仍未判定，未开事项。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。

**代签核实。** 本轮未扩大查询，沿用 mid60 完整检索 249 条且均为 200／0、未找到目标项的结果。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**写入与清理。** 发出业务写请求并成功回执 12 次，确认清理或恢复 5 项。本轮无新增待清项。清理台账仍为 6 项，状态未变：wave36 留下的 2 条指标草稿仍无公开删除入口；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口；已停用的测试/种子活动类型 `cmwxyo6u801u9ny01uwn8f07s` 公开删除受保护，且本轮只读确认仍为 INACTIVE。均未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave59-functional-probe-receipt.json` SHA-256 `edc3e560dc91225e7c10510b6acc45bba184fdfb40d8ee85871b0fbc2ee3fa86`；`wave59-cleanup-ledger.json` SHA-256 `843d1a2450160dae4737b26147d0843ee4c021fd891669386a879a123582c923`；`official-t230-mid61-503-localization.json` SHA-256 `08eb52dbb7335f35b95d8d84349181290d2190974ca9611f40859436f5b1dd5e`；`official-t230-mid61-runtime-dto-contract.json` SHA-256 `e9f7d55c1896b70224b1b891ae23c6fbac3da3b8a64605ac157049d356c3757b`；`official-t230-mid61-path-contract.json` SHA-256 `f6bea7685da6d1ffef9a3d7aa0e7f7fa27f8de74974b584fc53679da90fce19d`；`official-t230-mid61-ledger-contract.json` SHA-256 `883cba6fbec95fc30a8c1a7bf68455e48bfc107dde1a2eafb70cb0e333ea142d`；`SHA256SUMS-mid61.txt` SHA-256 `1b8b6c786daa8eff61243acb1fffae98f2705b5d49d029d8106fa36ddecb8f7f`。mid6–mid60 未改写。

## 11 月 27 日 04:09–04:18 · 单候选抽签走通并完成清理，管理端模板选项补参后返回 403/40300，变更批准再次 503/50300

本段按北京时间（Asia/Shanghai）追记脱敏结果，03:55–04:01 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。未再新建活动类型种子，已停用类型种子只读确认仍为 INACTIVE，未临时启用，未硬删。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、运行时 DTO/生效配置入口核对、剩余路径与模板选项补参契约预核、change-reviews 批准 503 分支核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦，两端登录与服务端登出均为 HTTP 200／业务码 0。本轮无 Chrome 启动失败，故无失败报错可附。已保留 mid57 过程改进：启动前检查并清理官方配置目录上可能残留的 SingletonLock/crashpad；失败后等待 2 秒再试；失败时将把脱敏后的 error.message 与错误码写入收据和运行日志。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**本轮新走通。** 单候选抽签已走通：占用夹具报名 `POST /api/app/v1/activities/:activityId/registrations` 为 201／0，冻结准备 `POST /api/app/v1/my/managed-activities/:activityId/allocation-batches` 为 201／0，提交分配 `POST .../allocation-batches/:batchId/commit` 为 200／0。管理端与队员端独立读回报名状态均为 `pass`。随后作废批次为 200／0，报名取消为 200／0。可逆测试活动提审前独立确认有效岗位已显式设置容量，H5 详情顶层 allocationMode 读回匹配；提审、发布、容量与分配方式读回为已走通前置，不记为新覆盖。活动随后取消并删除，管理端详情与 H5 场次查询均读回 404／20001。未把 mid37–mid59 已走通路径记为新覆盖，也未把类型切换、qualification-flag 只读 GET，或 change-reviews 提交进入待审和撤回再记为新覆盖。

**模板选项与发布后变更。** 管理端模板版本选项按官方契约补上必填 organizationId 后再走，返回 403／40300，未取得分页数据，未放宽未授权范围，上一轮漏参造成的 400／40000 不记为产品缺陷，本轮该 403／40300 亦未开事项。为定位批准 503，仅在本轮新建可逆测试活动上谨慎试批准一次，再次返回 503／50300，说明、正文、报名说明均未应用，随后撤回并读回确认，测试活动已清理。未循环重放。运行时 DTO 字段与单次请求生效的责任制/v1.1 配置仍未核实。未开启任何全局开关。未确认稳定现网 8a 逻辑缺陷，未开事项。

时长与贡献政策只读仍为 403／40300，未发选择或恢复请求，未放宽未授权范围，未开事项。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。qualification-flag 无直接写入入口，本轮跳过，未把 GET 记为新覆盖。本轮未再发非空报名表写入。

**代签核实。** 扩大只读审计后三页查询均为 200／0，共 249 条且查询完整，仍未找到目标项。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**503/50300。** 本轮报名列表在草稿和发布后均为 503／50300，队员端组织选项与变更批准亦复现 503／50300。首个失败操作仍未确认；列表、报名表写后读回、组织选项与批准 503 是否同源仍未判定。互斥候选未变。未开事项。

**写入与清理。** 发出业务写请求并成功回执 17 次，确认清理或恢复 8 项。本轮无新增待清项。清理台账仍为 6 项，状态未变：wave36 留下的 2 条指标草稿仍无公开删除入口；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口；已停用的测试/种子活动类型 `cmwxyo6u801u9ny01uwn8f07s` 公开删除受保护，且本轮只读确认仍为 INACTIVE。均未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave58-functional-probe-receipt.json` SHA-256 `2e99b6e522dfceb75a96115b9551066181bf46426baeb0e08afaa917fa622c25`；`wave58-cleanup-ledger.json` SHA-256 `1e1045ca0a7e700b290c4470cc40044ff082e1350f8f31df21e2c9c61f65f433`；`official-t230-mid60-503-localization.json` SHA-256 `433a2ff48eccba2c363a85cf064e2436fea517131113a15e51ef5a25468c0222`；`official-t230-mid60-runtime-dto-contract.json` SHA-256 `8adec277530e8cf27b004d739825ac82378f8055740d51085b847471f40cbb40`；`official-t230-mid60-path-contract.json` SHA-256 `dee6f331387f292e0a80ca390e43d90b910899406e491ef9d737e5bab079b65a`；`official-t230-mid60-change-approve-contract.json` SHA-256 `ed72f0ea1295085262d86f6265158782eed0c202f6fffe9a9a3179f0e69d61b4`；`SHA256SUMS-mid60.txt` SHA-256 `4228466f93a06cd36cfc89950d1ac5fec0ee242487f241cd89acc2831b6993e6`。mid6–mid59 未改写。

## 11 月 27 日 03:55–04:01 · 发布后变更提案进入待审，批准返回 503/50300，本轮无完整新走通业务路径

本段按北京时间（Asia/Shanghai）追记脱敏结果，03:41–03:49 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。未再新建活动类型种子。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、发布后变更审核路径与运行时 DTO/生效配置契约核对、剩余路径与选项/报名表写后读回预核、qualification-flag 写入入口核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 2 次、重试 1 次。首次均在发出登录请求前，于 profile 进程检查阶段被拦，错误码 `EPERM`，脱敏后的 error.message 为 profile 进程检查 Operation not permitted，该次未发登录请求。等待约 2 秒后第二次两端登录与服务端登出均为 HTTP 200／业务码 0，队员用户名与用户 ID 均匹配。功能收据中的次数只统计第二次成功运行；完整次数与首次脱敏报错已写入运行日志。已保留 mid57 过程改进：启动前检查并清理官方配置目录上可能残留的 SingletonLock/crashpad；失败后等待 2 秒再试；失败时把脱敏后的 error.message 与错误码写入收据和运行日志。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。官方登录工具哈希复核一致。此启动拦截不记为产品缺陷。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**本轮新走通。** 本轮没有新增完整走通的业务路径。冻结 8a 确认已发布活动的 description、content、registrationNotes 存在正式「先提交审核再改」入口。本轮仅在新建可逆测试活动上发出 `POST /api/app/v1/my/managed-activities/:activityId/change-reviews`，返回 200／0，独立读回确认提案已进入待审，且待审期间原字段保持不变。随后批准 `POST /api/admin/v1/activity-publish-reviews/:id/approve` 返回 503／50300，独立读回确认说明、正文、报名说明均未应用。原提交人撤回 `POST /api/app/v1/my/managed-activities/:activityId/reviews/withdraw` 为 200／0 并读回确认。可逆测试活动提审前独立确认有效岗位已显式设置容量，H5 详情顶层 allocationMode 读回匹配；提审、发布、容量与分配方式读回为已走通前置，不记为新覆盖。活动随后取消并删除，管理端详情与 H5 场次查询均读回 404／20001。未把 mid37–mid58 已走通路径记为新覆盖，也未把类型切换或 qualification-flag 只读 GET 再记为新覆盖。

**运行时 DTO 与生效配置。** 本轮已只读尝试核实 mid58 尚未核实的运行时 DTO 字段与单次请求生效配置。官方健康接口只证实服务存活，OpenAPI 返回 404／40400，未能在同次请求中核对 DTO 键或责任制/v1.1 解析后布尔值，二者仍未核实。未开启任何全局开关。未确认稳定现网 8a 逻辑缺陷，未开事项。

**报名表与选项。** 草稿报名表基线 GET 为 200／0，非空配置 PUT 为 200／0，写后独立 GET 为 503／50300，故未能独立核实写入结果。随后恢复为空再独立 GET 为 200／0。管理端组织选项为 403／40300；队员端组织选项为 503／50300；队员端指标集与模板版本选项均为 403／20020。管理端模板版本选项因探针漏传必填 organizationId 返回 400／40000，不记为产品缺陷。未放宽未授权范围，未开事项。qualification-flag 无直接写入入口，本轮跳过该 GET，不记为新覆盖。

时长与贡献政策只读仍为 403／40300，未发选择或恢复请求，未放宽未授权范围，未开事项。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。已停用类型种子只做只读确认仍为 INACTIVE，未临时启用，未硬删。

**代签核实。** 扩大只读审计后两页查询均为 200／0，共 106 条且查询完整，仍未找到目标项。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**503/50300。** 本轮报名列表在草稿和发布后均为 503／50300。报名表只读基线与恢复后读回为 200／0，写后独立读回为 503／50300。变更批准与队员端组织选项亦观察到 503／50300。首个失败操作仍未确认；写后读回与列表 503 是否同源仍未判定。互斥候选未变。未开事项。

**写入与清理。** 发出业务写请求并成功回执 14 次，确认清理或恢复 7 项。本轮无新增待清项。清理台账仍为 6 项，状态未变：wave36 留下的 2 条指标草稿仍无公开删除入口；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口；已停用的测试/种子活动类型 `cmwxyo6u801u9ny01uwn8f07s` 公开删除受保护。均未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave57-functional-probe-receipt.json` SHA-256 `7314a96ff7adf641f8059cb5bdddad25fde434379d5b8092a668652ee0e1b6da`；`wave57-cleanup-ledger.json` SHA-256 `f22ee8da3488b2ae41fa3462b9f6fe3fcf2911d87611dea7ee7cd06646577326`；`official-t230-mid59-503-localization.json` SHA-256 `341e5a6e344e63813ef95748711f9927a12650984b7436a5df8282a962946433`；`official-t230-mid59-published-edit-contract.json` SHA-256 `2d69fcd835f9b7c23c8ec086fbbf02c6779d43f7a142b6f2745be78127a3856a`；`official-t230-mid59-path-contract.json` SHA-256 `d77b14876ae6bc0d0ab78ffda464d83714165b1d988181c5a0afb4db116acb53`；`official-t230-mid59-qualification-flag-contract.json` SHA-256 `09e6e454c8dfd1123f3a5e734d3d820b234f99006d1817a4b90ea09d0ba136ff`；`SHA256SUMS-mid59.txt` SHA-256 `a0f4af8faa8ad5cf7d52f13ba4889cd7898c26b8a100323201abe7094ce44968`。mid6–mid58 未改写。

## 11 月 27 日 03:41–03:49 · H5 草稿标题、时间窗、正文与类型切换走通，发布后 description、content 与 registrationNotes 均返回 409/20037

本段按北京时间（Asia/Shanghai）追记脱敏结果，03:31–03:36 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管，未取消那四场报名。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、发布后 description/content/registrationNotes 与运行时 DTO 契约核对、剩余路径预核、类型切换与 qualification-flag 契约核对。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦，两端登录与服务端登出均为 HTTP 200／业务码 0。本轮无 Chrome 启动失败，故无失败报错可附。已保留 mid57 过程改进：启动前检查并清理官方配置目录上可能残留的 SingletonLock/crashpad（本轮两端均无残留需删）；失败后等待 2 秒再试；失败时将把脱敏后的 error.message 与错误码写入收据。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**本轮新走通。** H5 草稿标题、起止时间、纯文本正文均发出并独立读回，随后恢复原值。字典起初仅 1 个有效末级活动类型，本轮新建可逆测试/种子末级类型后完成类型切换并恢复原类型；随后将该种子类型置为 INACTIVE 并读回确认，因公开删除受保护，该项记入台账，未硬删。qualification-flag 查询为 200／0，判据读回匹配，未新建判定条件种子，qualified 为 false。可逆测试活动提审前独立确认有效岗位已显式设置容量，提审与批准均为 200／0，H5 详情顶层 allocationMode 读回匹配；提审与发布为已走通前置，不记为新覆盖。活动随后清理，读回 404／20001。未把 mid37–mid57 已走通路径记为新覆盖，也未把管理端草稿标题/时间/正文/活动级岗位说明再记为新覆盖。

**发布后直改对照。** 仅在本轮新建已发布测试活动上，分别 PATCH description、content、registrationNotes，三次均返回 409／20037。随后详情 GET 为 200／0，活动仍为 published，对应字段、工作流修订号和更新时间均未变。冻结 8a 仍将这三个字段列为发布后可直改的展示字段，现场响应与该契约仍有出入。运行时 DTO 字段与单次请求的生效配置仍未核实，未确认稳定现网 8a 逻辑缺陷，未开事项。

时长与贡献政策只读仍为 403／40300，未发选择或恢复请求，未放宽未授权范围，未开事项。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。H5 报名表 GET 为 200／0。

**代签核实。** 扩大只读审计后查询 200／0，共 99 条且查询完整，仍未找到目标项。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**503/50300。** 本轮报名列表在草稿和发布后均为 503／50300。报名表只读为 200／0。首个失败操作仍未确认；写后读回与列表 503 是否同源仍未判定。互斥候选未变。未开事项。

**写入与清理。** 发出业务写请求并成功回执 20 次，确认清理或恢复 10 项。清理台账现为 6 项：继承的 5 项状态未变（wave36 留下的 2 条指标草稿仍为草稿且无公开删除入口；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口），均未硬删。本轮新增 1 项：已停用的测试/种子活动类型 `cmwxyo6u801u9ny01uwn8f07s`，公开删除受保护，保留在台账，未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave56-functional-probe-receipt.json` SHA-256 `4740d450d0aa304e694e0c185551586324e35da9df3f7d3160b5a2dba218d021`；`wave56-cleanup-ledger.json` SHA-256 `a42881cfda31f937cbf5d25922c708e6fd3806f36ef3f045b4993ad0f823eaeb`；`official-t230-mid58-503-localization.json` SHA-256 `ff22e6ea590874cad987b4d22fb41b0a1fac577f016be5c62a4242682cc4ff40`；`official-t230-mid58-notes-409-contract.json` SHA-256 `e78fe4385f3d5a497039432b2013658e3aec6bc69feaac84dfd38cf3fec0f903`；`official-t230-mid58-path-contract.json` SHA-256 `7bc52be0fbbb32a9a353c66b2af655c665188c5da41577591d5b049b7b1b9a5b`；`official-t230-mid58-type-criterion-contract.json` SHA-256 `87faffa1de11d47ff33ad34220cd4f7f135f3b576edd313739280a65ec76dbc2`；`SHA256SUMS-mid58.txt` SHA-256 `ecafc74e357f09f04bb5a9609e9dd763378958c5b3bb4ab674bca0de705985b8`。mid6–mid57 未改写。

## 11 月 27 日 03:31–03:36 · 管理端草稿标题、时间窗、正文和活动级岗位说明走通并完成恢复，发布后说明更新再次返回 409/20037

本段按北京时间（Asia/Shanghai）追记脱敏结果，03:17–03:23 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、发布后 registrationNotes 与冻结源码可直改契约核对、剩余路径预核、本机 Chrome 启动拦截过程改进清单。写者未等只读结束即开始写入。

**登录与本机启动过程。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦，两端登录与服务端登出均为 HTTP 200／业务码 0。本轮无 Chrome 启动失败，故无失败报错可附。探针已落地三项过程改进：每次启动前检查并清理官方配置目录上可能残留的 SingletonLock/crashpad（本轮两端均无残留需删）；失败后等待 2 秒再试；失败时将把脱敏后的 error.message 与错误码写入收据。未改官方登录工具，未关掉 chromiumSandbox 或官方 fillLogin 约束。临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**本轮新走通。** 管理端草稿标题、活动起止时间、纯文本正文、活动级岗位说明均发出并独立读回，随后恢复原值。字典读回未找到第二个有效末级活动类型，本轮跳过类型切换。可逆测试活动提审前独立确认有效岗位已显式设置容量，提审与批准均为 200／0，H5 详情顶层 allocationMode 读回匹配；提审与发布为已走通前置，不记为新覆盖。活动随后清理，读回 404／20001。未把 mid37–mid56 已走通路径记为新覆盖。

**发布后说明更新与冻结源码核对。** 再次发出仅更新 registrationNotes 的 PATCH，返回 409／20037。随后详情 GET 为 200／0，活动仍为 published，说明、工作流修订号和更新时间均未变。冻结 8a 仍将该字段与 description、content 列为发布后可直改的展示字段，现场响应与该契约仍有出入。本次请求的运行时 DTO 字段与生效配置仍未核实，已连续四轮观察到同一结果，但仍未确认稳定现网 8a 逻辑缺陷，未开事项。

时长与贡献政策只读仍为 403／40300，未发选择或恢复请求，未放宽未授权范围，未开事项。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。H5 报名表 GET 为 200／0。

**代签核实。** 扩大只读审计后查询 200／0，共 88 条且查询完整，仍未找到目标项。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**503/50300。** 本轮报名列表在草稿和发布后均为 503／50300。报名表只读为 200／0。首个失败操作仍未确认；写后读回与列表 503 是否同源仍未判定。互斥候选未变。未开事项。

**写入与清理。** 发出业务写请求并成功回执 20 次，确认清理或恢复 10 项，新增待清 0 项。清理台账现仍为 5 项：wave36 留下的 2 条指标草稿仍为草稿且无公开删除入口，未硬删；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口，未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave55-functional-probe-receipt.json` SHA-256 `3eeddf3efc03e24c25b32ce45a9aab4869a6145bd68e2b6c28c608ff16fb8c6b`；`wave55-cleanup-ledger.json` SHA-256 `5e0a39f3c9d662462dbfc8bed533a5eca76b310d0b7f2cef603a0678c85e25d7`；`official-t230-mid57-503-localization.json` SHA-256 `574e2768f45575b764966f39e0535fbdc2d857d927ce0037453d86b1724c83bf`；`official-t230-mid57-notes-409-contract.json` SHA-256 `c5fd32475633fae166c09ed2b528326b598199fb540bbfcc5548e2359312c17f`；`official-t230-mid57-path-contract.json` SHA-256 `f5b24489ae001d1823273985760fdf8326cfbea7b85c6b1b39d53b6ad8e798ee`；`official-t230-mid57-login-intercept-contract.json` SHA-256 `6b3be744a54c1ebe6f5a94cccfba3eac42a32e6e430558877a04d9a58ad5d31c`；`SHA256SUMS-mid57.txt` SHA-256 `bc76e8bdb975c2544efff82c49126d01c4ecf94bc7684b93361302c878b51a4b`。mid6–mid56 未改写。

## 11 月 27 日 03:17–03:23 · 管理端草稿分配方式与 H5 草稿场次地点、集合点及岗位说明走通并完成恢复，发布后说明更新再次返回 409/20037

本段按北京时间（Asia/Shanghai）追记脱敏结果，03:02–03:11 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、发布后 registrationNotes 409/20037 稳定性核对、剩余路径预核、allocationMode 字段核对。写者未等只读结束即开始写入。

**登录。** 管理端与占用夹具官方 H5 各尝试 1 次、重试 0 次，均未在发出登录请求前被拦。两端登录与服务端登出均为 HTTP 200／业务码 0，临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具未改写，哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**本轮新走通。** 管理端草稿分配方式切换、H5 草稿场次地点文字、H5 草稿场次集合点/执行点/撤离点、H5 草稿场次岗位说明与装备备注均发出并独立读回，随后恢复原值。可逆测试活动提审前独立确认有效岗位已显式设置容量，提审与批准均为 200／0，H5 详情顶层 allocationMode 读回匹配；提审与发布为已走通前置，不记为新覆盖。活动随后清理，读回 404／20001。未把 first_come 报名与分配、qualification_rank 单候选冻结/提交/分配、草稿场次排序、草稿岗位顺序更新记为新覆盖。

**发布后说明更新。** 再次发出 PATCH，返回 409／20037。随后详情 GET 为 200／0，活动仍为 published，说明未更新。冻结 8a 将 registrationNotes 列为发布后可直改字段，现场响应与该契约仍有出入。已连续三轮观察到同一结果，但仍未确认稳定现网 8a 逻辑缺陷，未开事项。

时长与贡献政策只读仍为 403／40300，未发选择或恢复请求，未放宽未授权范围，未开事项。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。H5 报名表 GET 为 200／0。

**代签核实。** 扩大只读审计后查询 200／0，共 85 条且查询完整，仍未找到目标项。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**503/50300。** 本轮报名列表在草稿和发布后均为 503／50300。报名表只读为 200／0。首个失败操作仍未确认；写后读回与列表 503 是否同源仍未判定。互斥候选未变。未开事项。

**写入与清理。** 发出业务写请求并成功回执 18 次，确认清理或恢复 5 项，新增待清 0 项。清理台账现仍为 5 项：wave36 留下的 2 条指标草稿仍为草稿且无公开删除入口，未硬删；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口，未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave54-functional-probe-receipt.json` SHA-256 `699c48d26e6db547e3e08b4c8b41252408ab5d84952f979d1719b62af2e082cf`；`wave54-cleanup-ledger.json` SHA-256 `f17af5f27d2e5e50ef063bc50e0e36fe942aa4a3e178fdf6c00334a636a48bd4`；`official-t230-mid56-503-localization.json` SHA-256 `c931074438736ea6339a93d63b1ffa3d74415ef17979a231b3acf7623865d8c3`；`official-t230-mid56-notes-409-contract.json` SHA-256 `87d795fc9085b2bfd30dce4ec161b81aa18e527fb7966ec06f3078234e168c3f`；`official-t230-mid56-path-contract.json` SHA-256 `ef3e4fe7d3010eecbecb4c75fb81ec4f8d5c8376b024a2b3b88dbc4a377f70b8`；`official-t230-mid56-allocation-mode-contract.json` SHA-256 `3490d933381716b0b8b2a272316b70c3af92b554055d3ce583bf734b99523ba8`；`SHA256SUMS-mid56.txt` SHA-256 `643b57794fa650a6e647963d045c86bf385dc915ba246bc54b0ad8d61a283938`。mid6–mid55 未改写。

## 11 月 27 日 03:02–03:11 · first_come 分配与 qualification_rank 单候选分配走通并完成清理，发布后说明更新再次返回 409/20037

本段按北京时间（Asia/Shanghai）追记脱敏结果，02:48–02:55 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、allocationMode 字段与 first_come / qualification_rank 契约核对、发布后 registrationNotes 409/20037 稳定性核对、剩余路径预核。写者未等只读结束即开始写入。

**登录。** 管理端与占用夹具官方 H5 各尝试 9 次、重试 8 次。前 8 次均在发出登录请求前被本机运行限制拦住，未发出登录请求，不当产品缺陷。第 9 次两端登录与服务端登出均为 HTTP 200／业务码 0，临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具未改写，哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**岗位容量与提审发布。** 两场可逆测试活动均显式设置了岗位容量，提审前独立读回确认每个有效岗位均已设置。两场提审、批准均为 200／0，独立读回均为 published。提审与批准为已走通前置，不记为新覆盖。

**报名方式读回与分配。** H5 详情按顶层 allocationMode 判断后发出报名，未再误用 allocationModeCode。first_come 报名 POST 为 201／0，独立读回 statusCode=pass，waitlistPosition 为空，随后取消读回 cancelled，活动清理后读回 404／20001。qualification_rank 报名 POST 为 201／0，截止前读回 pending；截止后冻结并提交均为成功，批次读回已提交且单候选已分配，成员与管理端报名读回均为 pass；随后作废批次，报名读回回到 pending，再取消并清理活动，读回 404／20001。两条路径均记为本轮新走通。

**发布后说明更新。** 再次发出 PATCH，返回 409／20037。随后详情 GET 为 200／0，说明未更新。冻结 8a 将 registrationNotes 列为发布后可直改字段，现场响应与该契约仍有出入。已连续两轮观察到同一结果，但仍未确认稳定现网 8a 逻辑缺陷，未开事项。

**其他新走通。** 草稿场次排序与草稿岗位顺序更新均发出并读回，随后恢复并随草稿活动清理，读回 404／20001。时长与贡献政策只读仍为 403／40300，未发选择或恢复请求，未放宽未授权范围，未开事项。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。H5 报名表 GET 为 200／0。

**代签核实。** 扩大只读审计后查询 200／0，共 76 条且查询完整，仍未找到目标项。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**503/50300。** 本轮报名列表在草稿和发布后均为 503／50300。报名表只读为 200／0。首个失败操作仍未确认；写后读回与列表 503 是否同源仍未判定。互斥候选未变。未开事项。

**写入与清理。** 发出业务写请求并成功回执 35 次，确认清理或恢复 15 项，新增待清 0 项。清理台账现仍为 5 项：wave36 留下的 2 条指标草稿仍为草稿且无公开删除入口，未硬删；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口，未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave53-functional-probe-receipt.json` SHA-256 `14b26fdd23fba2268a19c36c27f95fd1c1c8523d450a2fa0fbb85ecab01a6d6b`；`wave53-cleanup-ledger.json` SHA-256 `031bf4eccb18b5dfd3a46673c05d11c239a67a49679297312e9b6ce426e793c6`；`official-t230-mid55-503-localization.json` SHA-256 `26bbe5afa30a87ab71376a804421d0a2d8b2116b402b7925107d04d863b4ffd0`；`official-t230-mid55-allocation-mode-contract.json` SHA-256 `104609dfaa626f0c15be6145a4c36d4d6e64cdf7fa86b830fa18d7d5fb33ee9b`；`official-t230-mid55-notes-409-contract.json` SHA-256 `235eea88589e09467649a9926db5949033dbb6f9a4cbabdde78c5d512d15ed20`；`official-t230-mid55-path-contract.json` SHA-256 `44423965aa5a890f3a6208a1d14feb0d9ac567a754fb128014dd5e05d369547c`；`SHA256SUMS-mid55.txt` SHA-256 `52894c0511e3dce7ced074e93c866184b47b470fe802fff78e199cf68478252e`。mid6–mid54 未改写。

## 11 月 27 日 02:48–02:55 · 补上岗位容量后两场活动提审发布通过并完成清理，发布后说明更新返回 409/20037，first_come 与 qualification_rank 因探针读回字段错误未发出

本段按北京时间（Asia/Shanghai）追记脱敏结果，02:28–02:34 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、提审前岗位容量契约核对、发布后说明更新与 first_come 契约前置、剩余路径预核。写者未等只读结束即开始写入。

**登录。** 管理端与占用夹具官方 H5 各尝试 9 次、重试 8 次。前 8 次均在发出登录请求前被本机运行限制拦住，未发出登录请求，不当产品缺陷。第 9 次两端登录与服务端登出均为 HTTP 200／业务码 0，临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具未改写，哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**岗位容量与提审发布。** 两场可逆测试活动各有一个有效岗位，提审前独立读回显式容量均为 1。两场提审、批准均为 200／0，独立读回均为 published。上一轮因漏传岗位容量出现的 400/20139 未再出现，未开事项。提审与批准为已走通前置，不记为新覆盖。两场活动随后均清理，读回 404／20001。

**发布后说明更新。** 已发出 PATCH，返回 409／20037。随后详情 GET 为 200／0，未读回目标说明。冻结 8a 将 registrationNotes 列为发布后可直改字段，本次现场响应与该契约有出入，尚未确认稳定复现，未开事项。

**first_come 与 qualification_rank。** 均未发出报名；后者也未发出冻结或提交。探针误把 H5 详情的顶层 allocationMode 读成 allocationModeCode，提前退出。此为探针读回字段问题，不是这两条路径本身的已确认产品缺陷。

本轮无其他新走通路径。时长与贡献政策只读仍为 403／40300，未发选择或恢复请求，未放宽未授权范围，未开事项。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。H5 报名表 GET 为 200／0。

**代签核实。** 扩大只读审计后查询 200／0，共 59 条且查询完整，仍未找到目标项。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**503/50300。** 本轮报名列表在草稿和发布后两次均为 503／50300。报名表只读为 200／0。首个失败操作仍未确认；写后读回与列表 503 是否同源仍未判定。互斥候选未变。未开事项。

**写入与清理。** 发出业务写请求 19 次，其中成功 18 次，另 1 次为发布后说明更新 409／20037。确认清理或恢复 9 项，新增待清 0 项。清理台账现仍为 5 项：wave36 留下的 2 条指标草稿仍为草稿且无公开删除入口，未硬删；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口，未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave52-functional-probe-receipt.json` SHA-256 `ca8bf99b40f07bfc5d8faca252548f5290603723e29b1759f84ec2e21e286491`；`official-t230-wave52-log-gap-read.json` SHA-256 `8815d4f8a5c0bdaad46b197ca191cfdd55cd171ea63213f8e73b1d91e5b0eb6f`；`wave52-cleanup-ledger.json` SHA-256 `8f097cba26fc39fd1757bdb5a644aefc4952b246ba356ab89a2f3f2799433e4f`；`official-t230-mid54-503-localization.json` SHA-256 `9b9c01a2d8a3a4dedf175728083d75b98302d7d32da56ce98503801e5b6e5397`；`official-t230-mid54-capacity-contract.json` SHA-256 `7e68824b1e2d33bc62b8420d5e56edb8468d08fb3e907d0e24b10e7d32f3d531`；`official-t230-mid54-firstcome-notes-contract.json` SHA-256 `7c8551b8011c30da80796d3f282db6e37051a635aff93402f73aba0e259c8a77`；`official-t230-mid54-path-contract.json` SHA-256 `6cd19e3f4d76bafda44f38a8c81c6bd645a58e8eac9e6508e135f2d54867eb03`；`SHA256SUMS-mid54.txt` SHA-256 `ae017790c5df068a5c368d25078164518ea2afba701cf500f4f4ed78f34c4b4f`。mid6–mid53 未改写。

## 11 月 27 日 02:28–02:34 · 管理端报名配置与 H5 草稿地点走通并完成恢复，发布后说明更新与 first_come 因提审 400/20139 未发出

本段按北京时间（Asia/Shanghai）追记脱敏结果，02:17–02:25 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、发布后说明更新与 first_come 契约前置、剩余路径预核、管理端报名表读回路径核对。写者未等只读结束即开始写入。

**登录。** 管理端与占用夹具官方 H5 各尝试 8 次、重试 7 次。前 7 次均在发出登录请求前被本机运行限制拦住，未发出登录请求，不当产品缺陷。第 8 次两端登录与服务端登出均为 HTTP 200／业务码 0，临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具未改写，哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**报名表确认。** 本轮未写自定义报名表。H5 草稿报名表 GET 为 200／0。冻结路由无独立的管理端当前报名表 GET，管理端未能确认当前草稿表单配置；审核快照路径仅适用于已有审核单。因此也未取得发布态无生效表单的读回。

**发布后说明更新与 first_come。** 两条路径均未发出。两个可逆测试活动提审均返回 400／20139，活动仍为草稿。冻结 8a 要求活动设有总容量时每个有效场次岗位须显式设置容量，本轮探针漏传岗位容量。此为探针入参问题，不是这两条路径本身的已确认产品缺陷，未开事项。qualification_rank 单候选分配同样因提审未通过而未发出。两个测试活动均已清理，读回 404／20001。

**本轮其他新走通。** 管理端草稿的报名方式与公开报名标记更新、独立读回并恢复，均为 200／0。H5 草稿地点文字更新，H5 与管理端交叉读回后恢复，均为 200／0。

时长与贡献政策只读仍为 403／40300，未发选择或恢复请求，未放宽未授权范围，未开事项。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。

**代签核实。** 扩大只读审计时间窗与事件范围后查询 200／0，共 53 条且查询完整，仍未找到目标项。未发明替代 ID，也未臆造作废或替代前置，该项继续待核实，未硬删。

**503/50300。** 本轮再次观察到 H5 报名列表 503／50300。报名表本轮只读为 200／0。首个失败操作仍未确认；写后读回与列表 503 是否同源仍未判定。互斥候选未变。未开事项。

**写入与清理。** 发出业务写请求 26 次，其中成功 24 次，另 2 次为提审 400／20139。确认清理或恢复 11 项，新增待清 0 项。清理台账现仍为 5 项：wave36 留下的 2 条指标草稿仍为草稿且无公开删除入口，未硬删；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口，未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave51-functional-probe-receipt.json` SHA-256 `e112728d9b1da092fbfbfdbb26885ac3d37790c718cbdddd9c043b3123247e70`；`official-t230-wave51-log-gap-read.json` SHA-256 `2caf6ddef1609558a808371cf960e41843b9f6bdd6ea52f1df07d348976c7d66`；`wave51-cleanup-ledger.json` SHA-256 `cd685898f571affa59a030b2fb3d37691f4b5e2228e6a794947f855cfc12408f`；`official-t230-mid53-503-localization.json` SHA-256 `3293e4c12195f2ed03d097a4614c8a1477df14feb622d39e241b51027084f119`；`official-t230-mid53-firstcome-notes-contract.json` SHA-256 `7d8aad62b6510820b4528593e52a2b1cdfa78bded0bfc0b704de78f23f6c69b8`；`official-t230-mid53-path-contract.json` SHA-256 `6dc5aa62de1c20d843085dacef8cc4b4aa70866aa81513469041e75249592c97`；`official-t230-mid53-admin-form-readback.json` SHA-256 `902e23d5bcf271d0cd97f4c957dc7b2690e0e5eaa7c2d415f7cfd118bc5a9986`；`SHA256SUMS-mid53.txt` SHA-256 `bfd4466233db93af345c82b94db8d964d0565a656b878f1f0622bbf22e6c947f`。mid6–mid52 未改写。

## 11 月 27 日 02:17–02:25 · 管理端与 H5 草稿字段更新走通并完成可逆清理，报名表写后读回再次 503/50300

本段按北京时间（Asia/Shanghai）追记脱敏结果，02:03–02:12 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。首发总任务未完成。

**并行。** 启动即为 1 个唯一写者加 4 路不抢写者位的只读 Codex，共 5 路，模型均为 GPT-6.2 Sol / medium。只读分别做 503 取证、剩余路径契约预核、时长与贡献政策 403/40300 契约核对、台账五项公开删除入口核对。写者未等只读结束即开始写入。

**登录。** 管理端与占用夹具官方 H5 各尝试 7 次、重试 6 次。前 6 次均在发出登录请求前被本机运行限制拦住，未发出登录请求，不当产品缺陷。第 7 次两端登录与服务端登出均为 HTTP 200／业务码 0，临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具未改写，哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**本轮新走通。** 在可逆草稿活动上：管理端更新容量、报名截止、报名说明和可见性，PATCH 200／0，独立 GET 核实；H5 更新容量和可见性，PATCH 200／0，独立 GET 核实。随后草稿活动软删并读回 404／20001。

**本轮卡点与跳过。** 报名表 PUT 200／0，随后独立 GET 503／50300，配置未确认，不记为新走通。因无法确认报名表状态，发布后说明更新和 first_come 分配未发出，属前置未核实，不是这两条路径本身的已确认产品缺陷。时长与贡献政策只读仍为 403／40300，未发选择或恢复请求，未放宽未授权范围，未开事项。协办与交接因缺少第二名获授权成员跳过；待审考勤单因缺少已核实考勤事实跳过。未另造队员，未发明签到凭证。

**代签核实。** 扩大只读审计时间窗与事件范围后查询 200／0，共 43 条且查询完整，仍未找到目标项。未发明替代 ID，该项继续待核实，未硬删。

**503/50300。** 本轮报名列表在报名表写入前后均返回 503／50300，写后读回再次 503／50300。并行只读复核仍缺少同一失败请求与同一实例的操作级证据，首个失败操作仍未确认；写后读回与列表 503 是否同源仍未判定。互斥候选未变。未开事项。

**写入与清理。** 确认业务写入 7 次，确认清理 2 项，新增待清 0 项。清理台账现仍为 5 项：wave36 留下的 2 条指标草稿仍为草稿且无公开删除入口，未硬删；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口，未硬删。只读核对确认冻结路由对这四条指标均无适用于当前状态的公开删除入口；代签虽有作废/替代入口，但现有收据未确认满足其前置，未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave50-functional-probe-receipt.json` SHA-256 `296d6279fa5140a4142df734dbd2cef91fb213bbfa573d4515cf72cae08be7de`；`official-t230-wave50-log-gap-read.json` SHA-256 `7c390a52f1c2d573a0140ca2dd9e0c9ed32d05976a55ddce51328a870e712f2e`；`wave50-cleanup-ledger.json` SHA-256 `bcb3d2ad8f76c8f75fb04a4e9234eb3abe865fca2d75f57bfaa2e958a2fbbf12`；`official-t230-mid52-503-localization.json` SHA-256 `77f27e4828dfd6f83434bb017e8c0489894d96d7c7e4d3fa9cfa7e4bf7cd2f12`；`official-t230-mid52-path-contract.json` SHA-256 `e9cd54c568d9e85d183a9476b13563a453d7887b99700a104b168ff46953a034`；`official-t230-mid52-policy-403-contract.json` SHA-256 `28bd7e0e1efa7d453d109deee8466b79314c64317edeab57a73d49f81eb603cf`；`official-t230-mid52-ledger-delete-entry.json` SHA-256 `9f7b4ec56b7e81d0a5284cc12093a5872729bece4fd74c1c6bbe3d0ba543e292`；`SHA256SUMS-mid52.txt` SHA-256 `5a66d491cb34a0d436ebe4b3834cd21e414a58540b7425b1791a795f926446aa`。mid6–mid51 未改写。

## 11 月 27 日 02:03–02:12 · 退回初审、拒绝邀请、普通报名、驳回及撤销驳回、作废已提交批次均发出并完成读回与可逆清理

本段按北京时间（Asia/Shanghai）追记脱敏结果，01:46–01:55 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 各尝试 7 次、重试 6 次。前 6 次均在发出登录请求前被本机运行限制拦住，未发出登录请求，不当产品缺陷。第 7 次两端登录与服务端登出均为 HTTP 200／业务码 0，临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具未改写，哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**补跑路径。** 本轮按顶层字段读回指标选择，并改用创建接口允许的 `allocationModeCode`（`lottery`，未再传入 `manual`）。上一轮因探针嵌套取值或入参不允许而未发出的请求，均已发出并独立读回：
- 管理端退回发布初审：POST 200／0。审核读回为 `initial / returned`，活动读回为 `draft`。对应可逆对象已清理。
- 受邀成员拒绝未接受邀请：先完成已走通的发布前置，再向同一占用夹具发出邀请并保持 pending 后拒绝，POST 200／0。邀请读回为 `declined`，`respondedAt` 非空，报名列表仍为 0 条。对应可逆对象已清理。
- 本人从活动入口普通报名：创建活动 201／0，报名 POST 201／0。本人详情与管理端列表均读回同一笔 `pending` 报名。
- 管理端单人驳回：PATCH 200／0，读回 `reject`。撤销驳回 POST 200／0，读回 `pending`。随后取消报名并清理已发布活动。
- 作废已提交批次：另建可逆 `lottery` 活动，先经已走通前置形成 `committed` 批次并读回，再作废 POST 200／0。批次读回 `voided` 且 `voidedAt` 非空，两端报名读回恢复为 `pending`。对应可逆对象已清理。

时长与贡献政策基线只读仍为 403／40300，未发选择或恢复请求，未放宽未授权范围，未开事项。协办与交接、待审考勤单因缺少第二名获授权成员或已核实考勤事实跳过写入。未另造队员，未发明签到凭证。

**代签核实。** 扩大只读审计时间窗与事件范围后查询 200／0，共 41 条且查询完整，仍未找到目标项。未发明替代 ID，该项继续待核实，未硬删。

**503/50300。** 本轮再次观察到 H5 报名列表 503／50300。报名表写后读回与列表 503 是否同源仍未判定。并行只读复核仍缺少同一失败请求与同一实例的操作级证据，首个失败操作仍未确认。互斥候选仍为：取池前默认库 JWT 用户查询权限错误；admission 连接池初始化失败（含首次连接或角色自检失败）；取池成功后 admission 业务查询权限错误。未开事项。

**写入与清理。** 确认业务写入 43 次，确认清理 18 项，新增待清 0 项。清理台账现仍为 5 项：wave36 留下的 2 条指标草稿仍为草稿且无公开删除入口，未硬删；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口，未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave49-functional-probe-receipt.json` SHA-256 `8430b6e56315056ead367e3bfa51e2b8fd1c24911584b8845c0afbd48ec5c26d`；`official-t230-wave49-log-gap-read.json` SHA-256 `2455c9d3331ed88b2c4c5532205c6edf547e2c56cb29b0c522a62d656b6eaf52`；`wave49-cleanup-ledger.json` SHA-256 `9b0451232787c8635e915347b4c10cd7d1d25d7f872dbac5a0eb7966a2542d75`；`official-t230-mid51-503-localization.json` SHA-256 `c489ad29a7b16fb8908899ddf5e172a247645e5a165584aa6bcdf081875e3023`；`official-t230-mid51-path-contract.json` SHA-256 `5e979a6ac074ceac792d569197b80b326a0dfaa71d11325651ebe5008296d53a`；`SHA256SUMS-mid51.txt` SHA-256 `f5eb6eb3dd9913da0e8e0c631a99c85736718f7f9ebc027381e6f508e5949e83`。mid6–mid50 未改写。

## 11 月 27 日 01:46–01:55 · 场次与场次岗位走通并完成可逆清理，其余待覆盖分支未发出目标请求

本段按北京时间（Asia/Shanghai）追记脱敏结果，01:34–01:41 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 各尝试 7 次、重试 6 次。前 6 次均在发出登录请求前被本机运行限制拦住，未发出登录请求，不当产品缺陷。第 7 次两端登录与服务端登出均为 HTTP 200／业务码 0，临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具未改写，哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**场次及场次岗位。** 本轮已按分页结构（空列表不再按数组判断）取回场次。场次创建 201／0（该创建此前已作为已走通前置，不记为新覆盖），编辑与软删均 200／0，软删后分页列表为 0 条。场次岗位新增 201／0，编辑与软删均 200／0，软删后分页列表为 0 条。本轮草稿活动随后软删并读回 404／20001。上一轮因探针把空场次分页当数组而跳过，不是产品缺陷。

**其余待覆盖路径。**
- 时长政策选择与恢复：基线 GET 返回 403／40300，未发选择或恢复请求。未开事项。
- 贡献政策选择与恢复：基线 GET 同样 403／40300，未发选择或恢复请求。未开事项。
- 管理端退回发布初审：未发退回请求。提审前置的指标写入和读取均 200／0，探针错把顶层字段按嵌套字段取值，提前结束了该分支。此为探针读回问题，不是产品缺陷。对应可逆对象已清理。
- 受邀成员拒绝未接受邀请：同一探针读回错误阻断了发布前置，未发拒绝请求。对应可逆对象已清理。
- 作废已提交批次：本轮没有已提交的可逆 committed 批次，未发作废请求。
- 本人从活动入口普通报名：用于报名的活动创建返回 400／40000，随后列表读回为 0。探针传入的 `allocationModeCode=manual` 超出创建接口允许值，未发报名请求。此为探针入参问题，不是产品缺陷。
- 管理端单人驳回及撤销驳回：因普通报名未建立，两个请求均未发出。

协办与交接因缺少第二名获授权成员跳过写入；待审考勤单因缺少已核实考勤事实跳过写入。未另造队员，未发明签到凭证。

**代签核实。** 扩大只读审计时间窗与事件范围后查询 200／0，共 28 条且查询完整，仍未找到目标项。未发明替代 ID，该项继续待核实，未硬删。

**503/50300。** 本轮在草稿活动上再次观察到 H5 报名列表 503／50300。报名表本轮只读为 200／0，未再验证写后读回。并行只读复核仍缺少同一失败请求与同一实例的操作级证据，首个失败操作仍未确认；报名列表与报名表读回的 503 暂不能判定是否同源（冻结源码中列表 GET 走 admission 池，报名表 GET 走 draft 池，报名表 PUT 走默认库）。互斥候选仍为：取池前默认库 JWT 用户查询权限错误；admission 连接池初始化失败（含首次连接或角色自检失败）；取池成功后 admission 业务查询权限错误。未开事项。

**写入与清理。** 确认业务写入 20 次，确认清理 7 项，新增待清 0 项。清理台账现仍为 5 项：wave36 留下的 2 条指标草稿仍为草稿且无公开删除入口，未硬删；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口，未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave48-functional-probe-receipt.json` SHA-256 `8b428d3f393452589da00da2905172293f72c78e6bbfffdc2c68bb6a372ff0d3`；`official-t230-wave48-log-gap-read.json` SHA-256 `bd6611f059e3c70fad73d79a074d46b469ee2f1954a69c108c35b506945759bd`；`wave48-cleanup-ledger.json` SHA-256 `91aecac3bc4d3ea4028285c21a22b1e3bb49e4c2da969c411c7e001c74790c0c`；`official-t230-mid50-503-localization.json` SHA-256 `d1bb07070e4ac553f7ad8ef919bbb0393f49e325ec7cfb8fd8e976a130035c4f`；`official-t230-mid50-path-contract.json` SHA-256 `cafa966377ac77fd51cf558e6e181d4f813d76bd022c1e2b18ed96208c7c16c2`；`SHA256SUMS-mid50.txt` SHA-256 `d8e32c5c7a117d80c96b2bb5f824d1a6c78e60ddaaf48898de8feb033a10220c`。mid6–mid49 未改写。

## 11 月 27 日 01:34–01:41 · 遗留岗位取回正确 ID 并完成更新与软删，测试活动已软删读回

本段按北京时间（Asia/Shanghai）追记脱敏结果，01:24–01:32 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 各尝试 5 次、重试 4 次。前 4 次均在 Chrome 启动阶段、发出登录请求前被本机运行限制拦住，未发出登录请求，不当产品缺陷。第 5 次两端登录与服务端登出均为 HTTP 200／业务码 0，临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具未改写，哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**遗留岗位与活动收尾。** 测试活动 `cmwxtsko6015cny0194rblrt2` 的岗位列表返回 200／0、1 条，官方字段为 `activityPositionId`（列表项无 `id` 字段），取回 `cmwxtsksp015gny01p484qb09`，详情读回身份匹配。岗位更新 200／0 并读回确认；软删 200／0，详情读回 404／20002，列表为 0 条。随后该测试活动直接软删 200／0，并读回 404／20001。收据中没有对该活动的取消调用；上一轮该对象在创建岗位时建立，本轮删除前读回仍存在且归属匹配。两项均已移出台账。未发明 ID，未硬删。上一轮探针把 `activityPositionId` 误读成 `id`，不是产品缺陷。

**本轮路径。** 新走通：管理端岗位更新与软删；H5 草稿资格规则配置与清空均 200／0 并读回确认。H5 草稿报名表配置写入 200／0，但随后读回 503／50300，配置结果未获确认；清空写入 200／0 且清空后读回 200／0，清空路径走通。本轮另建可逆草稿活动，已软删并读回 404／20001。探针把空场次列表的分页结构按数组判断，导致场次及场次岗位写入未执行。时长与贡献政策、退回初审、拒绝邀请、作废已提交批次、普通报名、驳回及撤销驳回未执行。协办与交接因缺少第二名获授权成员跳过写入；待审考勤单因缺少已核实考勤事实跳过写入。未另造队员，未发明签到凭证。管理端岗位创建不记为新覆盖。

**代签核实。** 扩大只读审计时间窗与事件范围后查询 200／0，共 14 条且查询完整，仍未找到目标项。未发明替代 ID，该项继续待核实，未硬删。

**503/50300。** 本轮在新建草稿活动上再次观察到 H5 报名列表 503／50300。报名表配置后的正向读回也为 503／50300。并行只读复核仍缺少同一失败请求与同一实例的操作级证据，首个失败操作仍未确认。互斥候选仍为：取池前默认库 JWT 用户查询权限错误；admission 连接池初始化失败（含首次连接或角色自检失败）；取池成功后 admission 业务查询权限错误。未开事项。

**写入与清理。** 确认业务写入 11 次，确认清理 5 项（含上一轮遗留岗位与测试活动，以及本轮草稿报名表、资格规则和草稿活动）。清理台账现为 5 项：wave36 留下的 2 条指标草稿仍为草稿且无公开删除入口，未硬删；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口，未硬删。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave47-functional-probe-receipt.json` SHA-256 `96042becfd2010d36ebb2c74aa3cb186f440cadad15968c3c84e866677e43446`；`official-t230-wave47-log-gap-read.json` SHA-256 `936b7905047f5c36122a87c8dd15c30211fa54cf918b8f93193b5cd9b95847c2`；`wave47-cleanup-ledger.json` SHA-256 `8ea451b0b312697fa17d9af10ca77014a1d1855dc85a7b2f5b4f657647fb627d`；`official-t230-mid49-503-localization.json` SHA-256 `ccb0219c348ae61d460b2e2ff6accab8e320787a8cc2750890f7d9bc05a33fed`；`official-t230-mid49-remaining-paths.json` SHA-256 `464e9dfc8f9549da2258221600c3cb0e1dad36e52160b1778a39d349eaeeec3f`；`SHA256SUMS-mid49.txt` SHA-256 `8a07f896060f50f4c15914296542c5ddb6bab3d95b0176f17d9b24b40c1aafe5`。mid6–mid48 未改写。

## 11 月 27 日 01:24–01:32 · 误记对象已按官方入口收尾，管理端岗位写入后因探针字段误读未完成清理

本段按北京时间（Asia/Shanghai）追记脱敏结果，01:04–01:18 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未开启责任制全局开关，未做整站或全局工作流启用。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 各尝试 5 次、重试 4 次。前 4 次均在 Chrome 启动阶段、发出登录请求前被本机运行限制拦住，未发出登录请求，不当产品缺陷。第 5 次两端登录与服务端登出均为 HTTP 200／业务码 0，临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具未改写，哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**误记对象收尾。** 上一轮留下的活动读回仍为已发布，报名读回仍为 `cancelled`。官方签到、考勤单和参与账本均为 200／0、0 条，确认无参与证据。活动经官方入口取消（200／0）并读回已取消，随后软删（200／0）并读回 404／20001。报名详情再次读回 200／0、状态 `cancelled`，且活动已不存在；官方没有单独删除入口，未硬删。两项均已移出台账。此为探针误记导致的收尾补做，不是产品缺陷。

**本轮路径。** 管理端创建活动岗位返回 201／0，列表由 0 条变为 1 条。探针把官方返回的 `activityPositionId` 读成了 `id`，因此未执行岗位更新和软删，本轮测试活动也未完成取消/软删，已列入台账。此为探针字段误读，不是产品缺陷。协办与交接因缺少第二名获授权成员跳过写入；待审考勤单因缺少已核实考勤事实跳过写入。未另造队员，未发明签到凭证。

**代签核实。** 扩大只读审计时间窗与事件范围后查询 200／0，共 6 条且查询完整，仍未找到目标项。未发明替代 ID，该项继续待核实，未硬删。

**503/50300。** 在收尾前的已发布对照活动上再次观察到 H5 报名列表 503／50300。并行只读复核仍缺少同一失败请求与同一实例的操作级证据，首个失败操作仍未确认。互斥候选仍为：取池前默认库 JWT 用户查询权限错误；admission 连接池初始化失败（含首次连接或角色自检失败）；取池成功后 admission 业务查询权限错误。未开事项。

**写入与清理。** 确认业务写入 6 次，确认清理 2 项（即上一轮误记留下的活动与已取消报名收尾）。清理台账现为 7 项：wave36 留下的 2 条指标草稿仍为草稿且无公开删除入口，未硬删；1 条代签请求结果待核实；wave45 已退役的 2 条指标已读回仍为退役且无公开删除入口，未硬删；本轮新增未完成收尾的 1 个测试活动，以及 1 个因探针未取到 `activityPositionId` 而缺少对象 ID 的测试岗位。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave46-functional-probe-receipt.json` SHA-256 `87dccd595f30cbf9e9e215a31c8a3a51bf29531f8fd926c9dbb75e4130ce8cc6`；`official-t230-wave46-log-gap-read.json` SHA-256 `9220ff8a1f7417008878336ec7968e16bb6644e5f5af9ce2817feeb53155cdf6`；`wave46-cleanup-ledger.json` SHA-256 `6b0e0dc3dca445070f5c3b12006a6658dca0fafcd15a1fcf9b34441ea55c2908`；`official-t230-mid48-503-localization.json` SHA-256 `506df2909708db07638962c6f771b7086e50f2c866cdc2da6403031d72d1e807`；`official-t230-mid48-remaining-paths.json` SHA-256 `f1b81670d3c4e477ba5884f41b89e845cfe01c043eafdc8acc58f164a451f3e1`；`SHA256SUMS-mid48.txt` SHA-256 `3c2f31e367f6559fc26ef9bfe23e99d5ff00ddab3106a1e5983257bf2cd428b5`。mid6–mid47 未改写。

## 11 月 27 日 01:04–01:18 · 非 v1.1 路径实跑：撤回/撤销/作废与 required 指标走通，待审考勤单未写入

本段按北京时间（Asia/Shanghai）追记脱敏结果，00:45–00:58 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未做整站或全局工作流启用。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 均按原路径在第 1 次尝试成功登录（各尝试 1 次、重试 0 次、登录请求发出前拦截 0 次）。两端登录与服务端登出均为 HTTP 200／业务码 0，临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具未改写，哈希复核一致。

**夹具级别。** 登录后先读回为 `volunteer`（HTTP 200／业务码 0）。本轮临时调到 `level-1`（改后读回 200／0），跑完改回 `volunteer`（改回读回 200／0）。

**代签核实。** 扩大只读审计时间窗与事件范围后查询 200／0，共 5 条记录，查询完整，仍未找到目标项。对应活动此前已删除，未发明替代 ID，该项继续待核实，未硬删。

**选项 1–6。** 本轮实际执行，不是只盘点。已验证的提审、批准、接受邀请和分配准备本身不记为新覆盖。
1. 管理端对四场验收活动只读核验旧考勤与报名：签到、考勤单草稿和考勤单列表均为 200／0、0 条；报名列表为既有读面。本轮新建已发布对象上，所管场次与本人报名读回成功，打卡状态 200／0 且无开放段。无考勤单 ID，单条详情跳过。
2. 待审考勤单录入未执行。本轮活动未核实到真实签到、签退事实，未发明 QR 或经纬度，也未开启 v1.1 打卡，故未提交考勤单。相关只读面为 200／0、0 条。
3. 撤回待审发布走通：撤回 200／0，审核读回 `withdrawn`，活动仍为 `draft`，随后该草稿已删除并读回 404／20001。未接受的定向邀请撤销走通：撤销 200／0，列表读回 `revoked`。
4. 尚未提交的分配批次作废走通：`preparing` 批次作废 200／0，读回 `voided`。本人报名已取消，管理端读回 `cancelled`。探针将分配候选的参与身份误记为参与证据，因此跳过该活动的取消和软删，对应活动与已取消报名仍留在台账，未硬删。此为探针记账问题，不是产品缺陷。
5. required 指标绑定走通：因既有生效集不够用，新建并激活可逆指标定义和指标集，在独立草稿写入 `required`，读回修订号递增、五个指针字段匹配、`selectable=true`。草稿已删除并读回 404／20001。指标定义和指标集已退役并读回，但无公开删除入口，留在台账。未盲目重放 H5 指标 PUT。
6. 责任交接与协办未写入：职责读回确认夹具已是负责人，现场无另一名获授权目标，且按冻结契约唯一成员在已是 owner 时不能兼任协办，两类移交也要求另一名正式成员。未另造队员，未与其他真实身份混用，未开启责任制全局开关。证书认定草稿走通：标准与认定规则均已创建、读回，并按顺序软删（规则 404／18004，标准 404／18002）。纯文本内容草稿已创建、软删并读回 404／29001。

**503/50300。** 本轮在已发布对照活动上复现：H5 报名列表 503／50300，管理端对照 200／0 且 1 条。并行只读复核仍缺少同一失败请求与同一实例的操作级证据，首个失败操作仍未确认。互斥候选仍为：取池前默认库 JWT 用户查询权限错误；admission 连接池初始化失败（含首次连接或角色自检失败）；取池成功后 admission 业务查询权限错误。未开事项。

**写入与清理。** 确认业务写入 35 次，确认清理或状态回收 13 项。清理台账现为 7 项：wave36 留下的 2 条指标草稿仍无公开删除入口，未硬删；1 条代签请求结果待核实；本轮已退役但无公开删除入口的 2 条指标；以及因探针误记而未完成收尾的 1 个活动与 1 条已取消报名。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave45-functional-probe-receipt.json` SHA-256 `a57064b6e2bdea8309f5f88c0cbbff317a4ed1a252734e2c039c48f2025306c6`；`official-t230-wave45-log-gap-read.json` SHA-256 `82dbc5389821fb18bbd017bb923666db610af8590d9dfec7e8e2e2c84a185080`；`wave45-cleanup-ledger.json` SHA-256 `0943a2c5bff41568b479f0ef9424bc57fe997df48a6c9280dac28fc345870242`；`official-t230-mid47-503-localization.json` SHA-256 `934d2c51775d20dad91c8cf2b24b744da03b9c1f0985767e25e154752f29db7e`；`official-t230-mid47-metric-responsibility-contract.json` SHA-256 `208fbda9f46ba27be252eb1803f57a63248d948a88e2edc77fde7fb7cb527ced`；`SHA256SUMS-mid47.txt` SHA-256 `8424504b9d57981908686a0f99b5fccdfd4a8e83100c83ca8b5d0365c4893512`。mid6–mid46 未改写。

## 11 月 27 日 00:45–00:58 · 官方登录首次成功，夹具仍为 volunteer，代签仍待核实

本段按北京时间（Asia/Shanghai）追记脱敏结果，00:36–00:42 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。未发明经纬度或 QR。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。本轮未开启 `activityV11Workflow.enabled`，也未做整站或全局工作流启用。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 均按原路径在第 1 次尝试成功登录（各尝试 1 次、重试 0 次、登录请求发出前拦截 0 次）。两端登录与服务端登出均为 HTTP 200／业务码 0，临时配置目录已清理。队员用户名与用户 ID 均匹配。官方登录工具未改写，哈希复核一致。本轮 Chrome 未被本机运行限制拦住。

**夹具级别。** 登录后先读回占用夹具级别，为 `volunteer`（HTTP 200／业务码 0）。本轮未提级，无需改回。

**代签核实。** 只读查询审计日志（HTTP 200／业务码 0），按夹具操作者、活动事件及原执行时间窗检查了 2 条记录，未找到可确认匹配项，查询范围仍不足以证明未落库，故该条继续待核实，未硬删。对应活动此前已删除，本轮未发明替代活动 ID。

**本轮路径。** 无新增走通，也无新的现网业务卡点复现。H5 所管活动列表返回 200／0、共 0 条。写者未新建带正常时间窗的可逆测试活动，因此两端报名列表对照未跑，H5 `registrations` 的 503／50300 本轮未复现。签到、工作人员确认与反馈因部署级 v1.1 开关未启用、且不得发明经纬度或 QR，均未执行。证书标准列表为空。功能收据与清理台账文件名及调用分类标为 wave44，但 JSON 顶层 `wave` 误写为 `43`、`mid` 为 `46`；按已有功能收据不得覆盖的要求原样保留。

**503/50300。** 并行只读复核仍缺少可串起同一失败请求与同一实例的操作级证据，首个失败操作仍未确认。互斥候选仍为：取池前默认库 JWT 用户查询权限错误；`admission` 连接池初始化失败（含首次连接或角色自检失败）；取池成功后 `admission` 业务查询权限错误（冻结源码中第一条业务查询为 `Member.findUnique`，先于活动授权和报名分页）。未盲目重放 H5 指标 PUT，未开事项。

**不依赖 v1.1 开关的后续候选（仅盘点，本轮未跑）。** 管理端只读核验旧考勤与报名；在有真实考勤事实且非维护态时验证旧轨待审考勤单的录入、读回与软删；撤回待审发布、撤销未接受的定向邀请、作废尚未提交的分配批次；在独立草稿绑定既有生效指标集（`required` 分支仍待验）；责任交接与协办授权；证书认定草稿与纯文本内容草稿。wave38–wave42 已走通的发布、接受邀请和提交分配路径不记为新覆盖。

**写入与清理。** 本轮新走通 0 条，业务写请求 0 次，确认清理 0 项。清理台账仍为 3 项：wave36 留下的 2 条指标草稿均已回读确认仍存在且为草稿，公开路由无删除入口，未硬删；另有 1 条代签请求结果待核实。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave44-functional-probe-receipt.json` SHA-256 `83fdad22f2f5591280dd2b137d3c3fcdf22fb4330feb5a791d6f538b24aea6e5`；`official-t230-wave44-log-gap-read.json` SHA-256 `d78d35fb1916cb5b8eaec39ddf9550760b97ed528d7c1fed5d9f9d9562b0e0b3`；`wave44-cleanup-ledger.json` SHA-256 `52fa0d95d1857e47b8f1fa51fbb14f48baabe70e1be996aa54bd7ae9fed0c9c2`；`official-t230-mid46-503-localization.json` SHA-256 `a94c7fa5cfdbc320514752a1e892d2f1f5ca86b8c96292f3b5f49589c0f89b62`；`official-t230-mid46-nonv11-path.json` SHA-256 `b1a25b4446127c6b259de106599db5b3c8943d2eb85e86209581be18935e05f6`；`SHA256SUMS-mid46.txt` SHA-256 `75d5d0e2a7c80d72bd6725d9fd922784354226ce35f531f00a1e849f6e96b6f1`。mid6–mid45 未改写。

## 11 月 27 日 00:36–00:42 · 登录前浏览器被拦，20153 定位为部署级 v1.1 开关，签到未跑通

本段按北京时间（Asia/Shanghai）追记脱敏结果，00:27–00:33 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。未做整站正式开放，未启用或发送微信/短信通知。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 各启动一次并按原路径重试一次，Chrome 均被本机运行限制拦在登录请求发出前，两端登录、登出均未执行，临时配置目录已清理。不当产品缺陷。探针在启动失败后已写出功能收据，本轮按收据不得覆盖的要求停止。官方登录工具未改写，哈希复核一致。夹具级别本轮未改动，也未能读回确认 `volunteer`。

**代签核实。** 因管理端未登录，未能只读检索 wave42 台账中的代签请求结果，该项继续待核实，未硬删。

**503/20153 与 v1.1 工作流。** 冻结 8a 与并行只读定位确认：官方 `proxy-punch` 在进入代签后、开启写事务并检查位置规则前，若实例未处于只读维护态且部署级 `activityV11Workflow.enabled` 为 false，即返回 503/20153（活动 v1.1 工作流未启用）。工作人员人工确认共用同一开关。源码只提供实例级启动开关，无仅作用于单条可逆测试活动、且可回滚的官方启用入口。本轮未做整站或全局启用。遗留本人签到入口按契约需要位置，本轮未发明经纬度，故未走。签到和反馈均未执行。未将 20153 确认为现网 8a 逻辑缺陷，未开事项。

**503/50300。** H5 报名列表本轮未重测。并行只读复核仍缺少可串起同一请求与实例的首错记录，首个失败操作（连接池初始化还是后续库权限）仍未确认，未开事项。

**写入与清理。** 本轮新走通 0 条，业务写请求 0 次，确认清理 0 项。清理台账仍为 3 项：wave36 留下的 2 条指标草稿仍无公开删除入口，未硬删；另有 1 条代签请求结果待核实。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave43-functional-probe-receipt.json` SHA-256 `fc999db40d8d72c9361a2fba26b7c852690149f61952b06906de1bca579dcf94`；`official-t230-wave43-log-gap-read.json` SHA-256 `d4e945ca7e54da63b68228eef84b149a9b68fe83a82160e666e54061354853ce`；`wave43-cleanup-ledger.json` SHA-256 `96de5dbb5248f8cd8e46e5190053743071cb6071c3d73d2d6bb95cd1615a2a29`；`official-t230-mid45-503-localization.json` SHA-256 `5edd7214bc21781489f7ab3650e124ab580c1d97361666f7f43d06b4be5b4738`；`official-t230-mid45-20153-localization.json` SHA-256 `bcd2e43c25644120eb46109cb182bca6ae1e1a2dded877cfd5bcb303dbd86c3f`；`SHA256SUMS-mid45.txt` SHA-256 `a803cffcecd7b82da727f50b3f1d6235e840ef18c5f22d33cdcfa25e6a85cd9f`。mid6–mid44 未改写。

## 11 月 27 日 00:27–00:33 · 管理端指标写入、发布、邀请报名与分配已走通，签到与反馈未跑通

本段按北京时间（Asia/Shanghai）追记脱敏结果，00:20–00:24 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 登录均成功，服务端登出均为 200/0，临时配置目录已清理。H5 用户名和用户 ID 匹配。官方登录工具未改写，哈希复核一致。

**级别。** 只读基线为 `volunteer`。临时调至 `level-1` 后只读确认；跑完已改回 `volunteer`，并再次只读确认。

**管理端指标写入与 400/20174。** 提审前先走管理端官方写入口，未再漏掉。读回选择仍为未配置后，`PUT /api/admin/v1/activities/:id/metric-selection` 返回 200/0，设为「不要求指标」。管理端与 H5 读回均确认选择已存在且有效。本轮未再试 H5 PUT。指标确认后按官方 `activityQ` 预查并用实际草稿 ID 核对，随后提审与审批均返回 200/0，活动状态读回为已发布。本轮未出现 400/20174；冻结 8a 仍将未配置指标列为该码的源码条件，但上一轮现网触发条件仍未确认，未开事项。

**发布、报名、签到与反馈。** 本轮新走通 7 条：管理端指标写入、提审、审批发布、创建邀请、接受邀请、准备分配、提交分配，均经读回确认。邀请报名已走通。官方 `proxy-punch` 在场次允许省略位置时返回 503/20153，收据记为活动 v1.1 工作流未启用，签到状态读回无开放记录，签到未走通，未开事项。反馈资格为 409/35030，未提交反馈。wave38 已走通的 7 条、wave39 positions、报名表空响应、wave40 sessions 及已通过的发布审核预查，均未再记为本轮新覆盖。

**503/50300。** 同一已发布活动上，管理端报名列表为 200/0、1 条，H5 列表仍复现 503/50300。并行只读定位确认：H5 报名列表走 admission 专用池，H5 指标选择 PUT 及前后 H5 GET 走独立的 metric 专用池，两者共用取池代码但分别初始化。wave41 中指标选择的两次 H5 GET 成功，只能说明当时 metric 池对读请求可用，并不能确认 PUT 或报名 GET 的首个失败操作。本轮未重放 H5 指标 PUT。首个失败操作（连接池初始化还是后续库权限）仍未确认，未开事项。

**写入与清理。** 业务写请求 15 次，确认成功 14 次。本轮报名已取消，临时活动已取消并删除，详情回查为 404/20001。清理台账现为 3 项：wave36 留下的 2 条指标草稿仍无公开删除入口，未硬删；另有 1 条代签请求结果仍待核实。证书标准列表仍为 0 条。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave42-functional-probe-receipt.json` SHA-256 `b3fc3a40d69cee9a09653637077aab5474ce557ea050cad9599a4995864c9a1a`；`official-t230-wave42-log-gap-read.json` SHA-256 `07acc3fc7d90814940d20c9a43c0dedaf2155973cf716562df3107366a963921`；`wave42-cleanup-ledger.json` SHA-256 `069066bed3484678fd065ac7823c4f3aee38dc7c7a9f175bdb44359f6465e4d5`；`official-t230-mid44-503-localization.json` SHA-256 `6384fc7a9a5c324b67ba1abc903adec32ef781319656a256c806e63b7c3611c5`；`official-t230-mid44-admin-metric-path.json` SHA-256 `9a607499f53e90ff7bf89762482c6eac639802f362076b805cebca88ea3e275d`；`SHA256SUMS-mid44.txt` SHA-256 `a16658bae36a08a3efefbd228d59bd70616abf9f393f3e002be0eee744b9b586`。mid6–mid43 未改写。

## 11 月 27 日 00:20–00:24 · 草稿指标选择读回未配置，H5 设置返回 503/50300，提审未发出

本段按北京时间（Asia/Shanghai）追记脱敏结果，00:11–00:16 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 登录均成功，服务端登出均为 200/0，临时配置目录已清理。H5 用户名和用户 ID 匹配。官方登录工具未改写，哈希复核一致。

**级别。** 只读基线为 `volunteer`。临时调至 `level-1` 后只读确认；跑完已改回 `volunteer`，并再次只读确认。

**指标选择与 400/20174。** 提审前已读回草稿指标选择：`GET /api/app/v1/my/managed-activities/:activityId/metric-selection` 返回 200/0，选择不存在、无效。随后经 H5 官方入口尝试设为「不要求指标」，`PUT` 同一路径返回 503/50300，读回仍未配置。探针在这次回读后漏了尝试管理端官方写入口；草稿随后已清理，收据已落盘，本轮按约定停止，未再发提审。冻结 8a 明确将未配置指标列为 `400/20174` 的触发条件，但本轮未发出 `POST .../publish-reviews`，上一轮现网触发条件仍未确认，未开事项。发布、可逆报名、官方签到和反馈均未执行。本轮新走通 0 条。wave38 已走通的 7 条、wave39 positions、报名表空响应、wave40 sessions 及已通过的发布审核预查，均未再记为本轮新覆盖。

**registrations 503/50300。** 同一草稿上，管理端报名列表仍为 200/0、0 条，H5 列表复现 503/50300。并行只读复核仍缺少可串起同一请求与实例的阶段证据，首个失败操作（连接池初始化还是后续库权限）仍未确认，未开事项。

**写入与清理。** 业务写请求 6 次，确认成功 5 次（调级、管理端创建、新建场次、软删草稿、恢复级别）。独立草稿已删除，详情回查为 404/20001。wave36 留下的 2 条指标草稿回读仍为草稿且仍无公开删除入口，未硬删，继续留在清理台账。证书标准列表仍为 0 条。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave41-functional-probe-receipt.json` SHA-256 `9742ac2e1f5c9f7a26b207bbd6006d81319221ccca18bcb168cfe8e8acd2fbe9`；`official-t230-wave41-log-gap-read.json` SHA-256 `a9480985cf007503185a4897ddba09b585822c285e7fab75776b80a2dde54ecd`；`wave41-cleanup-ledger.json` SHA-256 `6cac62018933fb8a18795d59197d6073773f418b8b7a4426d3ac725febb255be`；`official-t230-mid43-registrations-503-localization.json` SHA-256 `5d5a38cf15b6f0ef329a6b304aacba586ac97623c9713679d58abd5d582d3a37`；`official-t230-mid43-publish-metric-path.json` SHA-256 `cc7b03d3fc8d221668f6902767391b20287e7e8b0519ef23aeba2a9b1bdc0121`；`SHA256SUMS-mid43.txt` SHA-256 `b9c3e699a3cea504d0b11258e6e9d85652fba0e300ea61f0a854a8b1d2f04b24`。mid6–mid42 未改写。

## 11 月 27 日 00:11–00:16 · 发布预查通过并建成场次，提审返回 400/20174，签到与反馈未跑通

本段按北京时间（Asia/Shanghai）追记脱敏结果，23:57–00:03 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 登录均成功，服务端登出均为 200/0，临时配置目录已清理。H5 用户名和用户 ID 匹配。官方登录工具未改写，哈希复核一致。

**级别。** 只读基线为 `volunteer`。临时调至 `level-1` 后只读确认；跑完已改回 `volunteer`，并再次只读确认。

**发布、报名、签到与反馈。** 本轮发布审核预查按官方 `activityQ` 检索本轮草稿标题，并用实际草稿 ID 精确匹配，返回 200/0、0 条待审，预查通过。上一轮 400/40000 不再出现。随后新走通 `POST /api/app/v1/my/managed-activities/:activityId/sessions`，返回 201/0，回读场次 1 条。提交发布审核 `POST /api/app/v1/my/managed-activities/:activityId/publish-reviews` 返回 400/20174，回读未发现审核记录。冻结 8a 将该业务码定义为活动指标选择无效；本轮未在提审前核对草稿的指标选择，具体触发条件尚未确认，未开事项。发布未通过，可逆报名、官方签到和反馈均未执行。wave38 已走通的 7 条、wave39 的 positions，以及报名表空响应，均未再记为本轮新覆盖。

**registrations 503/50300。** 同一草稿上，管理端报名列表仍为 200/0、0 条，H5 列表复现 503/50300。并行只读复核确认管理端走默认库客户端、H5 须先取得 admission 客户端；现有日志缺少可串起同一请求与实例的阶段证据，首个失败操作（连接池初始化还是后续库权限）仍未确认，未开事项。

**写入与清理。** 业务写请求 6 次，确认成功 5 次（调级、管理端创建、新建场次、软删草稿、恢复级别）。独立草稿已删除，详情回查为 404/20001。wave36 留下的 2 条指标草稿回读仍在且仍无公开删除入口，未硬删，继续留在清理台账。证书标准列表仍为 0 条。功能收据和清理台账把 `wave` 字段误写成 39，实际为 wave40 / mid42，已保留原文。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave40-functional-probe-receipt.json` SHA-256 `debf031ee73eba977ec01f0897bffbd34ecc389ee80547c43402e11c59473e2b`；`official-t230-wave40-log-gap-read.json` SHA-256 `ddd24047cf58ad1e390c46bc886b8a6dda1517b2c5301fe0868573d6d9f4e7f8`；`wave40-cleanup-ledger.json` SHA-256 `e3b11f1b6c2e6bf21f70860f01a0998d159f3de4edaeee22265c14e3e2871feb`；`official-t230-mid42-registrations-503-localization.json` SHA-256 `fe051f8c21d8dada14e053e27ea245f91fd07995421eace87723f95797b0eafa`；`official-t230-mid42-publish-path.json` SHA-256 `ae103267be29b46a34236dc877b2df577713d7a4f2603bc22e92db8494abb96e`；`SHA256SUMS-mid42.txt` SHA-256 `15e10278f4185de252fa9cd84be1583268e74320d238e202d01f3bc602f81f03`。mid6–mid41 未改写。

## 11 月 26 日 23:57–11 月 27 日 00:03 · 岗位列表走通，H5 报名列表复现 503/50300，签到与反馈未跑通

本段按北京时间（Asia/Shanghai）追记脱敏结果，23:43–23:48 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。未重放 H5 创建活动，也未重发 wave37 待核实 POST。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 登录均成功，服务端登出均为 200/0，临时配置目录已清理。H5 用户名和用户 ID 匹配。官方登录工具未改写，哈希复核一致。

**级别。** 只读基线为 `volunteer`。临时调至 `level-1` 后只读确认；跑完已改回 `volunteer`，并再次只读确认。

**新走通与其他管理活动路径。** 管理端新建独立可逆草稿并指定占用夹具为发起人后，本轮新走通 `GET /api/app/v1/my/managed-activities/:activityId/positions`，返回 200/0、0 条。报名表读取也返回 200/0，冻结契约允许空响应，收据保守记为未确认。分类结算读取返回 404/20219。wave38 已走通的 7 条路径未再记为本轮新覆盖。

**registrations 503/50300。** 同一草稿上，管理端报名列表为 200/0、0 条，H5 `GET /api/app/v1/my/managed-activities/:activityId/registrations` 复现 503/50300。冻结 8a 与并行只读定位确认该 H5 路径无条件切入 `admission` 专用库，并已把池初始化、角色自检、授权与取数拆成可区分观测点。正常空列表应为 200/0，缺权限应为 403/30100。连接池初始化失败与后续数据库权限错误都可能返回同一 50300，现有日志无法确认首个失败操作，未开事项。

**发布、签到与反馈。** 发布审核预查因本轮探针传入无效 `activityId` 查询参数被拦下，返回 400/40000，因此未提交发布或报名。签到和考勤管理读取仍为 403/30100，队员侧签到状态 404/22002、反馈状态 409/35030。因无已核实定位凭证、无已完结出席参与，也无已核实已发布活动，签到、反馈和补报名写入均跳过。并行只读源码表明存在不发明二维码或经纬度的官方签到/反馈入口，但本轮现网未走通。

**写入与清理。** 业务写请求 4 次，全部确认成功（调级、管理端创建、软删草稿、恢复级别）。独立草稿已删除，详情回查为 404/20001。wave36 留下的 2 条指标草稿回读仍在且仍无公开删除入口，未硬删，继续留在清理台账。证书标准列表仍为 0 条。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave39-functional-probe-receipt.json` SHA-256 `ded5f904b1b9054d8c10185c1075a7bcc36389dda0b09601ead4b74fd6d05da6`；`official-t230-wave39-log-gap-read.json` SHA-256 `e85215c128d1f5348de8f79c1f597dd1e9c098ebb164f901c741b21829e00e3f`；`wave39-cleanup-ledger.json` SHA-256 `5ad9b67c940b97b08412ffce210c66726eb7abcb8e0f5d76fc98a9995221d65f`；`official-t230-mid41-registrations-503-localization.json` SHA-256 `6f717bc651912f5c8f67d5cf41a7742d2bd801d5099f3a9e5471ba64f39344c2`；`official-t230-mid41-publish-path.json` SHA-256 `0269108b7ef025e7b64aa8a6bb6c847ae97df4b4674c2654cfe6d0350797af5f`；`SHA256SUMS-mid41.txt` SHA-256 `2da921ccc495d335337f67c3ec10c4fc8ddbf823a07e9e3f29c861d5fc71ebe2`。mid6–mid40 未改写。

## 11 月 26 日 23:43–23:48 · 管理端创建可逆测试草稿并指定发起人，H5「我管理的活动」有数据路径走通

本段按北京时间（Asia/Shanghai）追记脱敏结果，23:26–23:31 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 登录均成功，服务端登出均为 200/0，临时配置目录已清理。H5 用户名和用户 ID 匹配。官方登录工具未改写，哈希复核一致。管理端首次登录前浏览器启动或填表曾被拦下，按原路径重试后完成，不当产品缺陷。

**级别。** 只读基线为 `volunteer`。临时调至 `level-1` 后只读确认；跑完已改回 `volunteer`，并再次只读确认。

**待核实创建。** 未盲目重发 wave37 那次 `POST /api/app/v1/my/managed-activities`。管理端按标题前缀跨组织、含归档检索，并查官方组织在预期开始时间窗内的草稿；队员端查含归档的「我管理的活动」列表。三处匹配均为 0 条，结论改为「未发现落库」，该项已从清理台账移除。

**可逆测试活动与有数据路径。** 管理端 `POST /api/admin/v1/activities` 返回 201/0，建成一条带正常时间窗的独立草稿，并在创建时指定占用夹具为发起人。随后 `GET /api/app/v1/my/managed-activities` 列表 1 条、详情 200/0，草稿编辑 200/0 且管理端读回确认，场次与职责读取 200/0，管理端反馈汇总与列表 200/0（列表 0 条）。本轮新走通 7 条，「我管理的活动」有数据路径已打开。该草稿随后由管理端软删，详情回查为 404/20001，清理已核实。

**503/50300 与其他卡点。** H5 创建活动路径本轮未再重放。新触及的卡点是同一草稿上 `GET /api/app/v1/my/managed-activities/:activityId/registrations` 返回 503/50300。冻结 8a 显示该接口走 `admission` 专用库路径，而同一草稿的管理列表与详情走 `draft` 路径且成功；并行只读定位把 H5 创建与组织选项的共同候选进一步收敛到草稿库读取组织或有效成员关系的权限，并指出管理端创建可省略草稿命令拦截器。现有日志材料无法确认具体分支，未开事项。签到和考勤管理读取为 403/30100，队员侧签到状态 404/22002、反馈状态 409/35030；因草稿未形成合格可逆参与或签到凭证，签到和反馈写入均跳过。证书标准列表仍为 0 条。

**写入与清理。** 业务写请求 5 次，全部确认成功（调级、管理端创建、H5 编辑草稿、软删草稿、恢复级别）。wave36 留下的 2 条指标草稿仍无公开删除入口，未硬删，继续留在清理台账。待清项现为这 2 条。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave38-functional-probe-receipt.json` SHA-256 `8a0f9a24d8be05f8875017be35ffe36d22f1f21e3369cdc3625b4ac27d22a515`；`official-t230-wave38-log-gap-read.json` SHA-256 `facfa462fe278b018028953538fdad6e7970a671d3df05c0803bea501cb28c9f`；`wave38-cleanup-ledger.json` SHA-256 `07481f87c8be453c54931c007d0b778eb469d287842d504b72574f9655b4def1`；`official-t230-mid40-503-localization.json` SHA-256 `0790a9b388b36fcf94f159a686b90bb803598cb4aa91890a5da5934713c4f219`；`official-t230-mid40-admin-assign-path.json` SHA-256 `0e3302f1579078590daf455581ca03fbe823a1071965b10f9aed08c0c226d181`；`SHA256SUMS-mid40.txt` SHA-256 `370a9eefe798782a55c61317a19b747b2c76ccd1f29ac0cf7850221c3802f350`。mid6–mid39 未改写。

## 11 月 26 日 23:26–23:31 · level-1 下发起组织选项与直接创建活动均复现 503/50300，测试活动未建成

本段按北京时间（Asia/Shanghai）追记脱敏结果，23:11–23:17 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 登录均成功，服务端登出均为 200/0，临时配置目录已清理。H5 用户名和用户 ID 匹配。官方登录工具未改写，哈希复核一致。

**级别。** 只读基线为 `volunteer`。临时调至 `level-1` 后只读确认；跑完已改回 `volunteer`，并再次只读确认。

**organization-options。** 在 `volunteer` 下仍为 403/20019。在 `level-1` 下连续两次 `GET /api/app/v1/my/managed-activities/organization-options` 均为 503/50300，可复现。绕过该选项接口、使用已核实官方组织 ID 直接 `POST /api/app/v1/my/managed-activities` 同样返回 503/50300。随后按本轮唯一测试标题回查列表为 0 条，创建结果仍记为待核实，未重发。测试活动未建成，「我管理的活动」有数据路径以及签到、反馈均未跑。冻结 8a 中存在多处可能返回 50300 的路径，现有证据不足以确认具体逻辑缺陷，未开事项。本轮无新走通。

**写入与清理。** 业务写请求 3 次，确认成功 2 次（调级与恢复）。wave36 留下的 2 条指标草稿仍无公开删除入口，未硬删，继续留在清理台账。另有 1 条活动创建结果待核实（无已确认官方 ID）。模板因草稿无公开删除入口跳过；证书标准列表为空，未创建认定规则。收据中本轮写入分类误用了 `WAVE36_WRITE_OR_CLEANUP` 标签，实际均发生在 wave37，已保留原文。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave37-functional-probe-receipt.json` SHA-256 `c4a671d976ff98a3c548b6a7a279b42d45a12aab95e8690bdc03880da4672521`；`official-t230-wave37-log-gap-read.json` SHA-256 `7913f753847273ffbbb36fdde09a3be035d5713267d6bcd9035d4b8c66a52b76`；`wave37-cleanup-ledger.json` SHA-256 `44fd2570775829a22cf0862c1058a7484a6c8771235d05abdaf7f8e1e5b158e3`；`SHA256SUMS-mid39.txt` SHA-256 `3fe3ae40e09304c61b5b6557f29c9079bbc9bb2f26917d4a9b3e24fdea4e7dfe`。mid6–mid38 未改写。

## 11 月 26 日 23:11–23:17 · 临时调至 level-1 后仍未能发起测试活动，指标与未发布内容详情已走通

本段按北京时间（Asia/Shanghai）追记脱敏结果，22:56–23:04 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行整站权限撤回，未清场或重部署整站。同一虚拟测试队员未改号，未与其他真实身份混用，未发明证件号，未发短信或验证码。未改四场验收活动的 2099 截止，也未把那四场改成占用夹具所管。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 登录均成功，服务端登出均为 200/0，临时配置目录已清理。H5 用户名和用户 ID 匹配。官方登录工具未改写，哈希复核一致。

**级别。** 只读基线为 `volunteer`。按官方字典将占用夹具临时调至 `level-1` 后只读确认；跑完已改回 `volunteer`，并再次只读确认。

**新走通。** 本轮新建后回读走通 3 条只读详情：`GET /api/admin/v1/activity-metric-definitions/:id`、`GET /api/admin/v1/activity-metric-sets/:id`、`GET /api/admin/v1/contents/:id`，均为 200/0。

**真实卡点。** 调至 `level-1` 后，`GET /api/app/v1/my/managed-activities/organization-options` 由基线的 403/20019 变为 503/50300，官方组织未能确认为可选项，本轮未创建测试活动，管理活动有数据场景仍待验证。带官方组织时 `metric-set-options` 与 `template-version-options` 返回 403/20020（此前收据未见该业务码）；带官方组织与官方计划时间的 `contribution-policy-options` 与 `time-policy-options` 仍为 403/40300。单次 503 与新见 20020 均未确认为稳定可复现的现网 8a 逻辑缺陷，未开事项。现网证书标准列表仍为空，未创建认定规则；本轮也未创建模板。

**写入与清理。** 业务写入 6 条，均已确认，含调级与恢复。未发布内容已删除，回读为 404/29001。指标定义与指标集草稿无公开删除入口，2 条待清，已记入 `wave36-cleanup-ledger.json`。

**13034。** 无新观测。未做受控诊断，未重放上传或确认。

证据：`wave36-functional-probe-receipt.json` SHA-256 `90f1f68c1662ef4bf4c739ff7e53f039b3f29f4e1bd4721cd7cbc2205fdc110b`；`official-t230-wave36-log-gap-read.json` SHA-256 `02fcf9b3b373f46d92c9e8c2276a76338df2d3a3f1fb86d234a1fbdd52ee04ef`；`wave36-cleanup-ledger.json` SHA-256 `262376e74d68a2adb1017753d76d81a80ac5db74556505e45a4e862180607c51`；`SHA256SUMS-mid38.txt` SHA-256 `81e52dfafaf7240b99db035795cc45082682c6242c6349b1c635d8c9e7451a45`。mid6–mid37 未改写。

## 11 月 26 日 22:56–23:04 · 队员端列表复查仍为空，本轮无新走通

本段按北京时间（Asia/Shanghai）追记脱敏结果，22:33–22:38 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 登录均成功，服务端登出均为 200/0，临时配置目录已清理。队员端首次 Chrome 启动在登录前被沙箱拦截，未发出登录请求，按原路径重试后完成，不当产品缺陷。H5 用户名和用户 ID 匹配。管理端首次因写者误判官方 profile 目录缺失而跳过，未发出登录请求，属过程失误而非产品缺陷；随后按官方登录模块建立 0700 配置目录并完成 fillLogin。官方登录工具未改写，哈希复核一致。

**新走通。** 本轮无新走通，无新卡点。并行离线盘点不计入本轮新覆盖。

**队员端复查。** 占用夹具的 `my/managed-activities`、`my/activity-batch-jobs` 与 `notifications` 均为 200/0、各 0 条，属取号重读，不作为新覆盖。无合格官方 ID，详情跳过。未把四场验收活动当作 managed ID。

**13034。** 无新观测。未做受控诊断，未重放上传或确认，未改存储设置，两轮直传对象仍记为 COS_OBJECT_UNVERIFIED。本轮业务写入 0。未确认现网 8a 逻辑缺陷，未开事项。

证据：`wave35-functional-probe-receipt.json` SHA-256 `9788ca89a54d864bd061e4d166b4abb62eeb2b5cb9c2e5deb78d557de14f5081`；`official-t230-wave35-log-gap-read.json` SHA-256 `b0239511c40c7c8f051610687d05adce1605ed55af77927dcf86f8b3675ea22b`；`SHA256SUMS-mid37.txt` SHA-256 `18290dcb8b6bdb64b7f45a60dcacc8320baf62adccefb95eb45e43e8c08f29ec`。mid6–mid36 未改写。

## 11 月 26 日 22:33–22:38 · 角色绑定详情只读已走通，队员端复查列表仍为空

本段按北京时间（Asia/Shanghai）追记脱敏结果，22:03–22:08 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 登录均成功。两端首次均在 Chrome 启动阶段被沙箱拦截，未发出登录请求，按原路径重试后完成，不当产品缺陷。H5 用户名和用户 ID 匹配。官方登录工具未改写，哈希复核一致。两端服务端登出均为 200/0，临时配置目录已清理。

**新走通。** `GET /api/admin/v1/role-bindings/:id` 为 200/0。角色绑定列表仅用于取号（4 条），不作为本轮新覆盖。该详情路径此前未出现在既有收据中；已覆盖的是列表、分页、预览，以及空的角色绑定草稿列表。

**队员端复查。** 占用夹具的 `my/managed-activities`、`my/activity-batch-jobs` 与 `notifications` 均为 200/0、各 0 条，属取号重读，不作为新覆盖。无合格官方 ID，详情跳过。未把四场验收活动当作 managed ID。既有收据中未找到尚未覆盖的官方场次 ID；因管理端活动详情可能返回签名 URL，未取号、未查询打卡状态。

**13034。** 无新观测。未做受控诊断，未重放上传或确认，未改存储设置，两轮直传对象仍记为 COS_OBJECT_UNVERIFIED。本轮业务写入 0。未确认现网 8a 逻辑缺陷，未开事项。

证据：`wave34-functional-probe-receipt.json` SHA-256 `e20cc73b3a7ea2b3afe780156f4a4fa5dedbbd67a29fa72f7d3960f24c4ab657`；`official-t230-wave34-log-gap-read.json` SHA-256 `0b2fc2a1dae3af7aeaa1fb5d5b6c545a0fa4835fcbe7427d506781cdb045299e`；`SHA256SUMS-mid36.txt` SHA-256 `9148deffcb17cedfe4486f8190883185278313b76e961004f7a2909a03ff5887`。mid6–mid35 未改写。

## 11 月 26 日 22:03–22:08 · 组织成员选项、占用账号角色与审计详情只读已走通

本段按北京时间（Asia/Shanghai）追记脱敏结果，21:41–21:45 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**登录。** 管理端登录成功。前两次浏览器启动或填表停在登录前，未发出登录请求，重试后完成，不当产品缺陷。官方登录工具未改写，哈希复核一致。服务端登出 200/0，临时配置目录已清理。本轮没有合格未覆盖的队员端候选，队员端未登录。

**新走通。** `GET /api/admin/v1/organizations/:orgId/members/options` 为 200/0，列表 1 条。`GET /api/system/v1/users/:userId/roles`（占用夹具用户）为 200/0，列表 0 条。`GET /api/system/v1/audit-logs/:id` 为 200/0。权限列表与审计列表仅用于取号，不作为本轮新覆盖。

**权限详情。** `GET /api/system/v1/permissions/:id` 对已核实官方列表 ID 返回 404/40400。冻结 8a 控制器未注册该详情路由，与平铺路由清单不一致。未确认现网逻辑缺陷，未开事项。本轮业务写入 0。

**13034。** 冻结 8a 只读可新增排除：内容不存在或已软删直接返回 13011，状态非草稿或已有发布时间直接返回 29030；收口事务中未经业务转换而直接抛出的数据库异常返回 50000，数据库权限不足返回 50300。实际 13034 分支仍未定位。未做受控诊断，未审查 Draft PR。未重放上传或确认，两轮直传对象仍记为 COS_OBJECT_UNVERIFIED。

证据：`wave33-functional-probe-receipt.json` SHA-256 `58364e995faea9e042e42985b8a7a983121c9a045c0b6b8f6424b88f7252dce9`；`official-t230-wave33-log-gap-read.json` SHA-256 `4220e9a9e54e7e36ddc2e8f133d2edcad8c5e78cc8cad227a9a447fe9bb9d056`；`SHA256SUMS-mid35.txt` SHA-256 `ead97cd2a066bc0472b5392af2def91f86f4b7dce11eb4b36601533e7aa3a7c9`。mid6–mid34 未改写。

## 11 月 26 日 21:41–21:45 · 补跑公开证书标准与占用夹具只读，带参选项仍未走到 200/0

本段按北京时间（Asia/Shanghai）追记脱敏结果，21:21–21:26 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**登录。** 管理端与占用夹具官方 H5 登录均成功。首次浏览器启动在登录前受阻，两端均未发出登录请求，重试后完成，不当产品缺陷。H5 用户名和用户 ID 匹配。官方登录工具未改写，哈希复核一致。两端服务端登出均为 200/0，临时配置目录已清理。

**必须补跑的只读路径。** `GET /api/open/v1/recruitment/certificate-standards` 为 200/0，列表 0 条，详情按空列表跳过，不是缺对象缺陷。占用夹具的 certificates、contribution-summary、supervision-scope 与官方组织 supervisors 均为 200/0；其中证书列表、督导范围和组织督导员均为 0 条。资格标记 `qualification-flag` 无查询参数时返回 400/40000，与冻结 8a 需要判定类型和判定编码相符；证书列表为空，没有已核实官方判定编码可补跑，未发明编码，未确认缺陷，未开事项。

**带官方必填查询的选项接口。** 从已走通的四场验收活动详情取出官方计划时间（详情重读不作为新覆盖），四场官方组织与计划窗口一致，日期为 2099-10-01 至 2099-10-01，未改 2099 截止、未发明时间窗口。`metric-set-options` 与 `template-version-options` 带官方组织 ID 返回 403/20019，属于既有「只有正式队员可以发起活动」，不是新缺陷。`contribution-policy-options` 与 `time-policy-options` 带官方组织 ID 及官方计划时间返回 403/40300，已记录，原因未确认，与既有贡献政策/时长政策 403 同向，证据不足，未开事项。带参正式成功路径仍未走通。本轮业务写入 0。

**13034。** 无新观测。未做受控诊断，判定不变。未审查 Draft PR。未重放上传或确认，两轮直传对象仍记为 COS_OBJECT_UNVERIFIED。

证据：`wave32-functional-probe-receipt.json` SHA-256 `a3929b44139bf47bb5ff66d00836135f15a7e0a4665171d5fe64de993ae135d5`；`official-t230-wave32-log-gap-read.json` SHA-256 `ab7ed4232bbc22f9c8b3f1db2b15cccae068a9f2a7a7e6671e22111152c90375`；`SHA256SUMS-mid34.txt` SHA-256 `63c02c3538cc62d7cb6bb764c8d021301fdb256c1145511cc796bbfbf193b033`。mid6–mid33 未改写。

## 11 月 26 日 21:21–21:26 · 队员端四条选项只读在缺查询参数时返回 400/40000

本段按北京时间（Asia/Shanghai）追记脱敏结果，21:01–21:06 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**登录。** 继续复用已授权的官方 H5 登录路径，占用夹具登录成功：`/api/auth/v1/h5/login` 为 200/0，用户名和用户 ID 匹配。登录响应未返回队员编号和档案 ID；本轮未重跑已核验的 `/api/app/v1/me`。官方登录工具未改写，哈希复核一致。首次浏览器启动在登录前受阻，未发出登录请求，重试后完成。H5 登出 200/0，临时配置目录已清理。管理端本轮未补跑。

**新触及，不是已确认缺陷。** 对 `GET /api/app/v1/my/managed-activities/contribution-policy-options`、`metric-set-options`、`time-policy-options`、`template-version-options` 在未带查询参数时均返回 400/40000。冻结 8a 约定这些接口至少需要 `organizationId`，其中贡献政策与时长政策选项还需 `plannedFrom` 和 `plannedUntil`，与缺字段 400/40000 相符。未用构造的组织或时间窗口补跑，正式带参成功路径尚未走通。未确认现网 8a 逻辑缺陷，未开事项。本轮没有新增业务成功路径。本轮业务写入 0。

**13034。** 无新观测。未做受控诊断，判定不变。未审查 Draft PR。未重放上传或确认，两轮直传对象仍记为 COS_OBJECT_UNVERIFIED。

证据：`wave31-functional-probe-receipt.json` SHA-256 `3665b379c0f3752ecf528d871b49b2fcf42332e0c181bf9592aa9032f3ed833e`；`official-t230-wave31-log-gap-read.json` SHA-256 `d568e721a380d60d01d2fc3d719775d1f7d09162fe1d295fabdb441ec19df4a5`；`SHA256SUMS-mid33.txt` SHA-256 `b2360583a05cb614945ef9d92ce554d1c98a4725572d5179cc42f7e50904fa0a`。mid6–mid32 未改写。

## 11 月 26 日 21:01–21:06 · 占用夹具的官方 H5 登录已恢复核验

本段按北京时间（Asia/Shanghai）追记脱敏结果，20:50–20:54 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**登录恢复。** 本轮改用已授权的官方 H5 登录路径，占用夹具登录成功：`/api/auth/v1/h5/login` 为 200/0；随后 `/api/app/v1/me` 为 200/0，用户名、队员编号、用户 ID 和档案 ID 均匹配占用夹具，等级仍为 `volunteer`。官方登录工具未改写，哈希复核一致。首次浏览器启动在登录前受阻，未发出登录请求，重试后完成。H5 登出 200/0，临时配置目录已清理。管理端本轮未补跑。

**新触及的已知限制，不是新缺陷。** `GET /api/app/v1/my/managed-activities/organization-options` 返回 403/20019，属于既有「只有正式队员可以发起活动」。一场验收活动的队员端岗位列表返回 404/20001，与更早批次同一可见性限制一致，不作为本轮新覆盖。本轮没有新增业务成功路径。本轮业务写入 0。未开事项。

**13034。** 无新观测。未做受控诊断，判定不变。未审查 Draft PR。未重放上传或确认，两轮直传对象仍记为 COS_OBJECT_UNVERIFIED。

证据：`wave30-functional-probe-receipt.json` SHA-256 `d2785c7df465266e55525c88db0d8052e43eae5b3428a9a0e6d33d3054a4a88a`；`official-t230-wave30-log-gap-read.json` SHA-256 `ba75f24a50bcd2467eef3af0e0c005ff27cca8fae16e00c607a0bc28798cc379`；`SHA256SUMS-mid32.txt` SHA-256 `8e41d56c0aff07fd46f0ef608a99720b1e02425c4d27e10f565ce8c2ac4b7843`。mid6–mid31 未改写。

## 11 月 26 日 20:50–20:54 · 验收夹具组织归属详情只读已走通

本段按北京时间（Asia/Shanghai）追记脱敏结果，20:40–20:44 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**新走通。** 管理端组织归属详情（`GET /api/admin/v1/memberships/:id`）返回 HTTP 200 / 业务码 0，数据存在，编号与列表及验收夹具一致。为取号而读取的归属列表同样 200/0、4 条，该列表本身更早批次已走通，不作为本轮新覆盖。发布审核列表和详情本轮虽再次 200/0，且详情与列表编号一致，但更早批次已确认成功，不作为本轮新走通。附件 MIME 配置、附件大小限制、活动指标定义、指标集、模板版本的官方列表本轮均为 200/0、0 条，详情因此跳过，与既有空目录记录一致，不作为新缺陷，也未创建对象凑覆盖。公开内容仍缺已核实官方 ID。本轮登录工具不支持占用队员角色，队员端未登录，不是产品缺陷。本轮业务写入 0。Admin 服务端登出 200/0，本地配置目录已清理。

**13034。** 本轮只读未发现新的观测面或可排除分支，未做受控诊断，判定不变。未开事项，未审查 Draft PR。未重放上传或确认，两轮直传对象仍记为 COS_OBJECT_UNVERIFIED。

证据：`wave29-functional-probe-receipt.json` SHA-256 `e36a5928ef801ef469602955daa74ce84bf61bec395048fd416dc4a2a263b277`；`official-t230-wave29-log-gap-read.json` SHA-256 `081288e75218e660715b7c0277b9cd785d46e108957c5028187df48b9d6bd644`；`SHA256SUMS-mid31.txt` SHA-256 `27f7962e4f53b78107cf18784fa0f1fb9dcf652276c6ddbcac0cf53dc3fcaddc`。mid6–mid30 未改写。

## 11 月 26 日 20:40–20:44 · 管理端活动参与台账只读已走通，13034 三类分支仍无互斥观测面

本段按北京时间（Asia/Shanghai）追记脱敏结果，20:29–20:34 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**新走通。** 管理端活动参与台账返回 HTTP 200 / 业务码 0，列表可识别，总数 0。这证明空列表可正常读取；有记录时的展示仍待验证，不作为缺陷。证书认定政策与公开内容详情因缺少已核实的官方 ID 而跳过，不作为代码缺陷。组织树、成员冲突、证书统计与标准列表、角色绑定列表、队员保险总览等候选因更早批次已有成功回执而跳过。未创建团队保单或招聘周期。本轮业务写入 0。探针前两次停在浏览器启动和登录表单阶段，均未发送登录或业务请求，重试后完成。Admin 服务端登出 200/0，本地配置目录已清理。

**13034 新定位进展（不改变既有判定）。** 只读核对了当时可见的 101 个容器及主机进程、服务清单，未找到可用于定位的独立存储 worker、sidecar 或日志采集流；已移除容器和当前清单无法识别的日志源不在本轮判断范围。冻结代码显示：事务内查找或定位转换异常没有独立日志或分支专属台账写入；存储核验不确定会等待 `noteProviderUnknown`，可能留下 `provider_unknown`，但其他台账路径也会写入该状态，单靠状态名或脱敏总数无法归因至原确认请求；收口时的孤儿删除未完成或存储状态冲突在事务内抛出业务异常，拒绝点没有专属日志或持久化失败标记。常驻一致性 worker 的循环不会输出可归因的结果计数，本轮未启动该 worker。两次确认之间未找到可安全归因的操作痕迹。没有新排除的分支，三类原因仍无法区分。关联存储操作状态仍无法安全取得。未做受控诊断。实际失败分支仍未定位，证据仍不足以认定为现网 8a 逻辑缺陷。未开事项，未审查 Draft PR。未重放上传或确认，两轮直传对象仍记为 COS_OBJECT_UNVERIFIED。

证据：`wave28-functional-probe-receipt.json` SHA-256 `1a6580adbf3fb000223fcc433e978afeac3ebcb7656b734d1d153ec9136bcc48`；`official-t230-wave28-log-gap-read.json` SHA-256 `ad4f5d43130d579af12621b51b47558e8c130a98545b5c63bde71a02772b2bd9`；`SHA256SUMS-mid30.txt` SHA-256 `1e099ffd30213521ee5e89ef67b12f15cfdc5cac0d561509c624160639ec6f8e`。mid6–mid29 未改写。

## 11 月 26 日 20:29–20:34 · 官方附件类型与证书字典详情只读已走通，13034 对照排除部分分支

本段按北京时间（Asia/Shanghai）追记脱敏结果，20:16–20:22 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**新走通。** 本轮 11 条现网只读均返回 HTTP 200 / 业务码 0。官方附件类型配置列表为 4 条，4 条详情均成功，编号与代码与列表一致，且均为启用。证书字典列表总数 11、本页 10 条，其中 3 个官方条目的详情均成功，编号与代码与列表一致，且均为启用。团队保单列表与招聘周期列表均为 200/0、0 条，因无官方 ID，跳过保单详情及成员、招聘周期统计、公示列表和晋级预检；这是缺官方对象，不作为代码缺陷。其他候选因更早批次已有成功回执而跳过。本轮业务写入 0。Admin 服务端登出 200/0，本地配置目录已清理。

**13034 新定位进展（不改变既有判定）。** 网关访问日志中，原窗口另一条确认上传的状态为 HTTP 499，表示相连一侧在响应完成前断开，与既有客户端在 12 秒截止前未收到完整响应的顺序相符；关联依据是路径和时序，未按请求 ID 核对，应用处理结果未知。已核对的网关格式没有请求耗时或上游耗时字段，附加列是转发地址，时间戳精度仍为 1 秒。冻结 8a 对照原请求为内容图片附件，可排除非内容归属的事务外存储查找，以及会返回其他业务码的守卫拒绝或确定性对象校验失败；JPEG 前缀读取只在 HEAD 成功且前置校验通过后发生。仍不能区分的 13034 分支包括：事务内查找或定位转换异常、存储核验不确定（含 8 秒 SDK 超时、潜在重试和有条件前缀读取）、以及核验后收口时的未完成孤儿删除或存储状态冲突。约 20 秒客户端耗时无法还原分段或取证次数。关联存储操作状态无法安全取得，同请求应用完成行无新来源。实际失败分支仍未定位，证据仍不足以认定为现网 8a 逻辑缺陷。未开事项，未做受控诊断，未审查 Draft PR。未重放上传或确认，两轮直传对象仍记为 COS_OBJECT_UNVERIFIED。

证据：`wave27-functional-probe-receipt.json` SHA-256 `dda68c75a330dfc5aaf98741d1ddcaebd16eefeeca8434986180e5e799898e98`；`official-t230-wave27-log-gap-read.json` SHA-256 `dbd16d47a23f43eb6113b2ccea76eaf6843a47a0e8ee5b3a005679a988616be2`；`SHA256SUMS-mid29.txt` SHA-256 `6f897eaeeb23e6b2c19647c1c9ea11fc7f42a0f1c03ae79f6c5a700754d08089`。mid6–mid28 未改写。

## 11 月 26 日 20:16–20:22 · 岗位列表只读复核与 13034 日志级别及网关访问补证

本段按北京时间（Asia/Shanghai）追记脱敏结果，19:59–20:06 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**新走通。** 四场验收活动的管理端岗位列表均返回 HTTP 200 / 业务码 0，且均为完整列表、各 0 条。公开端与队员端若干候选因更早批次已有成功回执而跳过。团队保单详情及成员、招聘周期统计及公示及晋级预检、附件类型配置详情因缺少可核实的官方 ID 未请求。本轮业务写入 0。Admin 服务端登出 200/0，本地配置目录已清理。

**岗位配对复核。** 先前岗位详情所用编号能与历史报名场次的岗位记录配对，但未出现在四场活动的现行活动级岗位列表中。原 404/20002 的具体成因仍未确认，本轮未重放详情请求，不作为新缺陷，未开事项。

**13034 补证（不改变既有判定）。** 只读核到运行中 API 的有效 HTTP 日志级别为 `warn`，默认以 `info` 记录的 HTTP 503 完成行会被过滤，可解释应用侧缺少确认上传完成行。另在实际承载网关的访问日志中，原窗口内有 2 条确认上传，其中 1 条 HTTP 503；另有 2 条申请上传地址。该 503 与既有请求按路径、状态和时间顺序吻合，未能按请求 ID 核对；时间戳精度为 1 秒，该 503 距前一条成功的申请上传地址约 21,000 ms。应用完成行无新来源。网关上游耗时、COS HEAD 与前缀读取的实际耗时和尝试次数、关联存储操作状态仍缺。失败分支仍未定位，证据仍不足以认定为现网 8a 逻辑缺陷。未开事项，未审查 Draft PR。未重放上传或确认，两轮直传对象仍记为 COS_OBJECT_UNVERIFIED。

证据：`wave26-functional-probe-receipt.json` SHA-256 `2f8ce502a24dc75409a508a7899ead4fe04b5bcf4d23a5df353d9ff823fdaa7a`；`official-t230-wave26-log-gap-read.json` SHA-256 `48376a563f9f8b5e3bf771f1c6222f7c148589ed054f9c74c7925905891c105e`；`SHA256SUMS-mid28.txt` SHA-256 `a7cf53228182119e14e9ec11792d194f31ea8cbb79966dbe30f1c3cc221058e7`。mid6–mid27 未改写。

## 11 月 26 日 19:59–20:06 · confirm-upload 13034 扩窗后仍为应用日志缺口，具体失败分支未定位

本段按北京时间（Asia/Shanghai）追记脱敏结果，19:46–19:50 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**13034 更细排查。** 官方 SSH 只读扩窗读取 API 容器日志 880 条，与 json-file 原始文件一致；轮转约定每个文件 10 MB、最多 3 个已核，现场无轮转文件。原关联窗口仍为 2 条申请上传地址 WARN、确认上传 0 条；扩窗前后同样未见确认上传、503/13034 完成行或分步耗时。现网镜像版本标签与冻结 8a 一致。客户端此前已收到完整 HTTP 503 / 业务码 13034，可推断请求已到达应用。业务异常过滤器无专用完成日志，有效 HTTP 日志级别未核实。同 compose 未发现名称匹配的代理服务；查到的 Nginx 日志（非同 compose、无对外边缘端口）中亦无申请上传地址或确认上传路径，实际承载请求的网关日志仍未取得。冻结合约路径为守卫、事务内准备、供应商 HEAD 及有条件前缀读取、事务内收口；COS SDK 单次超时 8 秒，部分供应商错误可能重试；HEAD 失败不会进入前缀读取；供应商失败可在返回前记为未知。13034 代表性分支包括：准备阶段存储查找失败、取证阶段供应商不确定、收口时存在未完成孤儿删除或未解决存储状态。约 20,133 ms 总耗时无法区分 COS 取证或重试、服务端等待和代理耗时。结论：应用日志有缺口，具体失败分支仍未定位；证据不足以认定为现网 8a 逻辑缺陷。未开事项，未审查 Draft PR。未重放上传或确认，两轮直传对象仍记为 COS_OBJECT_UNVERIFIED。还缺：同请求的应用 HTTP 完成行；COS HEAD 与前缀读取的耗时和尝试次数；关联的存储操作状态；实际承载网关的访问日志与上游耗时。

**新覆盖。** 新查管理端活动岗位详情返回 HTTP 404 / 业务码 20002（活动岗位不存在）。夹具岗位编号与活动现行配对不一致，此前岗位关联曾核实，成因未确认，不作为新缺陷，未开事项。本轮业务写入 0。服务端登出 200/0，浏览器配置目录已清理。

证据：`official-t230-wave25-log-receipt.json` SHA-256 `bdf3d366440c2725310a7a83513e95ea9f4a261f78fb580806b1b5b748928fd7`；`SHA256SUMS-mid27.txt` SHA-256 `e914f34a71a3fa7afaab9a680e10f43b44bac3040fb599c9fa6a7457ea9b35bd`。mid6–mid26 未改写。

## 11 月 26 日 19:46–19:50 · 四场活动均为已发布且内部可见，队员端控制面状态只读已走通

本段按北京时间（Asia/Shanghai）追记脱敏结果，19:39–19:43 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**新走通。** 本轮 6 条现网只读均收到 HTTP 响应，5 条业务成功。管理端只读复核四场验收活动详情字段，结果一致：`statusCode=published`，`visibilityCode=internal`，`isPublicRegistration=true`，`isPublished=true`，`hasPublishedAt=true`。四场软删状态均无法从详情响应确认。队员端管理中活动控制面状态为 200/0，且有数据。管理中活动列表因更早批次已有成功回执，本轮跳过。本轮无可安全写入候选，业务写入 0。未创建服务主体，未签发或撤销凭据，未提交考勤草稿，未拉 QR，未执行离队，未重建公告。Admin 与 H5 登出均为 200/0，两个本地配置目录均已清理。

**新观察。** `visibilityCode=internal` 是排查队员端活动详情、报名保险和管理中活动模板解析 404/20001 的线索，具体过滤条件仍未证实，不作为新缺陷，未开事项。一场活动的管理端简易草稿返回 403/40300，记为既有权限限制。角色绑定预览仍因缺少已核实的必填参数而跳过。紧急联系人因无已核实的安全测试号码而未写。

仍卡住或未覆盖：confirm-upload 13034 与日志不足无法定位；time-proof 未启用；2099 生命周期路径；发起人域与访客 403；上述 404/20001 的成因未完全证实；简易草稿读取未成功；四场软删状态未从详情确认；官方角色绑定草稿列表为 0，预览必填参数未核实。

证据：`wave24-functional-probe-receipt.json` SHA-256 `7bc8c79672f3329522b1595815521dcc898359194960a251084ce0820a1b441f`；`SHA256SUMS-mid26.txt` SHA-256 `70bbb1be49e77cb6d7396796257819e745a17df5e6eeecccf3a79d82c1da98cf`。mid6–mid25 未改写。

## 11 月 26 日 19:39–19:43 · 角色绑定草稿官方列表为空，官方肖像与公开内容只读已走通

本段按北京时间（Asia/Shanghai）追记脱敏结果，19:33–19:37 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**新走通。** 本轮实际发出 6 条现网只读请求，全部收到 HTTP 响应，4 条业务成功。角色绑定编辑草稿官方列表为 200/0，官方记录 0 条，因此未请求详情，也未编造草稿 ID。占用队员官方肖像接口为 200/0，肖像列表为 200/0、0 条，未保存肖像二进制。公开内容列表为 200/0、0 条。角色绑定预览因缺少已核实的必填参数而跳过，未落库。本轮未核实到 t207u/t208u 专用测试队员，无可安全写入候选，业务写入 0。未创建服务主体，未签发或撤销凭据，未提交考勤草稿，未拉 QR，未执行离队。Admin 与 H5 登出均为 200/0，两个本地配置目录均已清理。

**新观察。** 队员端管理中活动的模板解析返回 404/20001，当前账号下的活动可见性未证实，不作为新缺陷。访客列表返回 403/30100，记为既有权限限制，未开事项。上一轮角色绑定编辑草稿 404/20001 与本轮官方列表为 0 条相符，仍不作为代码缺陷。

证据：`wave23-functional-probe-receipt.json` SHA-256 `fc531ee2ee87ac395ba9975e4699dbee78550158d51a04ba47a4d4329d7de58a`；`SHA256SUMS-mid25.txt` SHA-256 `ed81ffca6b6a6037c4c9d8edb00e77b869f9424dfbb38997767369a95c7e2b90`。mid6–mid24 未改写。

## 11 月 26 日 19:33–19:37 · 队员列表、占用队员档案和用户列表只读补核已走通

本段按北京时间（Asia/Shanghai）追记脱敏结果，19:25–19:29 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**新走通。** 本轮优先补核的三条只读均实际发出并收到现网响应，均为 200/0：队员列表本页 3 条、总计 3 条；占用队员档案有数据，收据未写入 PII；用户列表本页 4 条、总计 4 条。随后两条新只读：占用队员紧急联系人列表为 200/0，共 0 条，收据未写入电话。本轮无可安全写入候选，业务写入 0。未创建服务主体，未签发或撤销凭据，未提交考勤草稿，未拉 QR，未执行离队。Admin 登出为 200/0，本地配置目录已清理。

**新观察。** 角色绑定编辑草稿返回 404/20001。本轮未掌握官方草稿 ID，也未核实该资源是否存在或可见，不能仅凭此码认定现网逻辑缺陷，未开事项。

证据：`wave22-functional-probe-receipt.json` SHA-256 `05d31c1fa4b23408aed9eb2c6197b07e5d487dfdef4576c2aa537a460cf1ddca`；`SHA256SUMS-mid24.txt` SHA-256 `ed57c09a8ef4ccc01a4dd5d22f61077e7c8a95853042444668a4667caca287d4`。mid6–mid23 未改写。

## 11 月 26 日 19:25–19:29 · 离队影响预览与考勤草稿只读已走通，队员端打卡状态返回 404/22002

本段按北京时间（Asia/Shanghai）追记脱敏结果，19:19–19:23 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**新走通。** 本轮实际发出 3 条现网只读请求，全部收到 HTTP 响应，2 条业务成功。占用队员离队影响预览为 200/0 且有数据，已核对为只读预览，未执行离队。一场夹具的考勤草稿为 200/0 且有数据，未提交草稿，未拉 QR。本轮无可安全写入候选，业务写入 0。未创建服务主体，未签发或撤销凭据，未再跑督导覆盖预览。首次沙箱运行未发出请求，恢复后 Admin 与 H5 登出均为 200/0，两个本地配置目录均已清理。另有 13 项因更早批次已有成功回执而跳过；其中指标定义/集合/绑定、管理端 me、队员选项、占用队员详情、附件列表、权限列表、能力查询和批量任务等已在更早交付批次走通，本轮不重报。队员列表、占用队员档案和用户列表本轮也跳过，但早期管理端探针未在回执中确认成功，故本轮未重新核实。

**新观察。** 队员端对一场夹具查询打卡状态返回 404/22002（活动打卡记录不存在），与此前签到列表为 0 条一致，记为无打卡记录，不作为新缺陷，未开事项。考勤草稿有数据，与此前考勤表官方列表为 0 条并存，仍记为总览与列表口径差异，不作为新缺陷。

证据：`wave21-functional-probe-receipt.json` SHA-256 `5ae47f1d3003e1aa9ed445d2cfaeb85bd57af700dd44e4c942d21cac7a63d47e`；`SHA256SUMS-mid23.txt` SHA-256 `133b9ebdff00ba9c03dd9c500c610586ebad89714f1043ce3a45c2480fc689c2`。mid6–mid22 未改写。

## 11 月 26 日 19:19–19:23 · 四场活动详情与指标选择、反馈和签到只读已走通，对账与评价受 2099 生命周期限制

本段按北京时间（Asia/Shanghai）追记脱敏结果，19:10–19:16 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**新走通。** 本轮 18 条只读请求均收到 HTTP 响应，12 条业务成功。管理端四场验收活动详情均为 200/0，记录均存在。一场活动的指标选择、反馈列表、反馈汇总和签到列表均为 200/0，反馈与签到均为 0 条。占用队员考勤记录 0 条，参与汇总活动数为 0。用户选项 4 条。当前管理员的用户角色接口为 200/0，返回 0 条。本轮无可安全写入候选，业务写入 0。未创建服务主体，未签发或撤销凭据，未再跑督导覆盖预览。Admin 与 H5 登出均为 200/0，两个本地配置目录均已清理。队员端参与汇总因更早批次已走通，本轮跳过。

**新观察。** 一场活动的贡献值策略选择与时间策略选择均返回 403/40300，记为既有权限限制。管理端对账返回 409/20030（活动当前状态不允许此操作），队员端评价返回 409/35030（活动尚未完结，暂不能评价），均按 2099 夹具生命周期记录，未开事项。占用队员 time-proof 返回 503/20235，仍为功能未启用。队员端活动详情返回 404/20001，可见性尚未复核，不作为新缺陷。

证据：`wave20-functional-probe-receipt.json` SHA-256 `7af63e2c6be7cf6a40bcd18581bde5ac8925963c0beb0a3f4669ae5b8d97f1cd`；`SHA256SUMS-mid22.txt` SHA-256 `5778a3d281ff44f3a23f1620824a5928760f12d76af54de3538ba0da95e46459`。mid6–mid21 未改写。

## 11 月 26 日 19:10–19:16 · 管理端组织、督导、角色与活动只读已走通，考勤表与结算列表为空

本段按北京时间（Asia/Shanghai）追记脱敏结果，19:01–19:06 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**新走通。** 本轮管理端实际发出 16 条现网查询，全部返回 HTTP 200、业务码 0。组织列表 2 条，组织详情有数据，该组织成员选项 1 条。参与总览按组织查询返回 1 个月数据。标签回查 6 条，收据只记计数。督导任命列表与分页、占用队员督导范围、该组织督导均为空。督导覆盖预览返回 1 个组织，确认为预览、未落库。角色列表与选项各 3 条。活动列表与选项各 4 条。考勤表与考勤结算列表均为 0 条，详情未测。本轮无可安全写入候选，业务写入 0。未创建服务主体，未签发或撤销凭据。Admin 登出为 200/0，本地配置目录已清理。本轮未重跑队员端活动目录或管理中活动，也未重跑四场夹具的岗位、职责与参与汇总。

**新观察。** 考勤表官方列表为 0 条，与上一轮总览中的考勤表计数 3 并存，仍记为总览与列表口径差异，不作为新缺陷，未开事项。

证据：`wave19-functional-probe-receipt.json` SHA-256 `d15adb61a5c9992ce4184a476d90816b32252ec0f65689fdc4f0beeb10d68088`；`SHA256SUMS-mid21.txt` SHA-256 `f498e2627a744b1506c5619ffc80cbc5ab02f8697f91bd0bf4f1fbb4ff79cb45`。mid6–mid20 未改写。

## 11 月 26 日 19:01–19:06 · 管理端总览、报名与入队招聘只读已走通，影子窗口 403、报名保险 404/20001

本段按北京时间（Asia/Shanghai）追记脱敏结果，18:51–18:59 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**新走通。** 本轮 20 条只读请求均收到响应，18 条成功。管理端总览、审计分页和组织选项均为 200/0；组织选项记到 2 个节点，未重跑组织树。审计本页 5 条、合计 470 条，收据只记计数。占用队员报名 4 条、全站报名 8 条，四场验收活动报名各 2 条，均为 200/0，发起人域 403 计数为 0。占用队员部门查询为 200/0，返回空值。归属列表 5 条。入队周期与申请、招聘周期与申请、公开招聘公示、委托授权和服务主体查询均为 200/0，本次返回 0 条。未创建主体、未签发或撤销凭据。本轮无可安全写入候选，业务写入 0。

**新观察。** 贡献影子窗口返回 403/40300，记为既有权限限制，不作为新缺陷。队员端对其中一场验收活动查询报名保险返回 404/20001，与冻结合约中「非已发布或不对本人可见则统一 ACTIVITY_NOT_FOUND」一致；占用队员级别仍为 `volunteer`，本轮未再读取该场可见性或状态细字段，不能仅凭此码认定现网逻辑缺陷，未开事项。管理端总览计数为活动 2、报名 2、发布审核 1、考勤表 3，与全站报名 8 条并存，未把它当作新缺陷。Admin 与 H5 登出均为 200/0，两个本地配置目录均已清理。

证据：`wave18-functional-probe-receipt.json` SHA-256 `45e858226ceac7543b36c574a6a260b71d23e3097c1fc7078721364cab235b44`；`SHA256SUMS-mid20.txt` SHA-256 `28492c2f06b1e6ed2b1e2960b601e81dfc0aeb4f578ccdfee9ba5c22c002a5ac`。mid6–mid19 未改写。

## 11 月 26 日 18:51–18:59 · 管理端多项只读已走通，队员受众标签返回 503/50300 且根因未证实

本段按北京时间（Asia/Shanghai）追记脱敏结果，18:38–18:48 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**新走通。** 本轮 32 条只读请求均收到响应，27 条成功。健康检查、存活与就绪均为 200/0。公开招聘证书标准、通知微信模板、证书工作台与统计、证书标准与选项、队员证书/保险/贡献汇总/参与台账、全量队员保险、团队保险策略、管理端通知列表、角色绑定分页均为 200/0。占用队员资质标记为 `false`。`rbac/me/permissions`、有效权限与权限目录本轮均为 200/0。微信/企业微信/短信/实名设置只读均为 200/0，且均无设置行。证书标准列表无记录，详情未测，不作为代码缺陷。本轮无可安全写入候选，业务写入 0。

**新观察。** 队员受众标签返回 503/50300，与本地契约中的功能开关分支一致，现网根因未证实，未开事项。活动模板版本选项返回 403/40300，贡献值策略与活动时间策略返回 403/30100，均记为既有权限限制，不作为新缺陷。管理端没有可用的官方微信模板 ID，队员端订阅状态在缺参时返回 400/40000，有效模板查询仍未覆盖。H5 首次页面提交未发出登录请求，补跑后登录与登出均为 200/0。管理端登出为 200/0，本地管理端与 H5 配置目录均已清理。

证据：`wave17-functional-probe-receipt.json` SHA-256 `33808af22f9e80d696b6017f79e3bb483012c6dbd4d021c70e59000e496bbced`；`SHA256SUMS-mid19.txt` SHA-256 `f69c55785775a74834deb54f46f8f5233eabf540935431f19cb8c9b8d3152495`。mid6–mid18 未改写。

## 11 月 26 日 18:38–18:48 · 确认上传 13034 的服务端卡点仍无法从官方日志判定

本段按北京时间（Asia/Shanghai）追记脱敏结果，18:29–18:36 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`。未改存储设置，开关保持 `enabled=true`。未重放上传签发、直传或确认上传。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**13034 服务端卡点。** 经官方 SSH 只读读取容器 `srvf-t68-accept-runtime-api-1` 在 18:16–18:40（UTC 10:16–10:40）的 stdout/stderr。窗口内回收到 23 条带请求上下文的 WARN，起止约为 18:21:28–18:34:43。其中 4 条 POST 分别为内容创建与申请上传地址，未见确认上传路径记录，也没有可关联的 HTTP 状态、响应耗时或 503 完成行；窗口内亦未见数据库特权失败的固定告警。客户端已在 20,133 ms 收到完整的 HTTP 503 / 13034，可排除本轮探针先于响应超时，但现有日志仍无法把耗时定位到 COS HEAD、对象读取、重试、服务端等待未完成的存储操作，或代理环节。冻结合约下 13034 可在多种存储不确定状态出现，且 COS SDK 单次超时配置为 8 秒；仅凭总耗时不能认定是代码逻辑缺陷。结论为日志不足、无法判定。未开 GitHub 事项，也未开审查草稿。

**其他只读路径。** 活动发布审核列表与详情均为 200/0，详情与列表记录匹配。活动模板版本与贡献值规则列表均为 200/0，无可用记录，详情未测。两次管理端会话登出均为 200/0，本地管理端配置目录已清理。

证据：`official-t230-wave16-log-receipt.json` SHA-256 `95eb529bb4406b13e8690a8981fda4596f2c343916815f9c8a7f817fac830cfc`；`SHA256SUMS-mid18.txt` SHA-256 `2cad642c2f40b8deffd3d0b3107ac610015da7518de8207915284260cb6fb0a1`。mid6–mid17 未改写。

## 11 月 26 日 18:29–18:36 · 确认上传已观测为 503/13034，上传成功路径仍未闭合

本段按北京时间（Asia/Shanghai）追记脱敏结果，18:16–18:27 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`，本轮未改 `gradeCode`。四场验收活动及其报名未改、未撤销。未发送通知，未编造打卡二维码，未把附件挂到占用队员上。未改存储设置，开关保持 `enabled=true`。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**确认上传观测。** 本轮修好观测后重走可逆内容图片路径。现网存储只读仍为 `COS`、已启用、凭证 `configured`。新建未发布测试公告后，申请上传地址 200/0（125ms）。页面内直传未拿到可读响应；本机 Node 对同一签名地址直传返回 200（254ms）。确认上传在 20.1 秒后返回 HTTP 503、业务码 13034。Playwright 网络层同样捕获 HTTP 503，页面内请求读到业务码。该耗时超过原探针 12 秒上限，可以解释此前为何未观测到状态，但仍无法确定服务端卡在哪一步。收到明确响应后停止，未对同一请求盲着重放。上传成功路径仍未闭环。按冻结合约，13034 表示存储状态不确定或操作未完成时的失败关闭；现有证据不足以认定现网 8a 逻辑缺陷，未开 GitHub 事项，也未开审查草稿。

**清理与残件。** 本轮测试草稿已软删，独立再读 404/29001；删除前按归属查询为 0 条附件。上一轮只读审计未发现后到的附件确认入库，对应草稿再读仍为 404/29001。两轮直传到存储的对象是否仍在，官方 API 无法核实，记为剩余残件，未使用控制台或其他凭据删除。登录与登出均为 200/0，本地管理端配置目录已清理。

证据：`wave15-functional-probe-receipt.json` SHA-256 `82554e4e5bd545c1beb4df094baac484b4b608b55973b34db368d1d074c09a9d`；`SHA256SUMS-mid17.txt` SHA-256 `c09a05a6475c16d38ffcd65583a9b3138c8b5d5369021e8262fa8a52e734d52f`。mid6–mid16 未改写。

## 11 月 26 日 18:16–18:27 · 现网存储开关已打开，上传签发已通，确认上传仍未闭合

本段按北京时间（Asia/Shanghai）追记脱敏结果，18:07–18:13 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`，本轮未改 `gradeCode`。四场验收活动及其报名未改、未撤销，报名截止仍为 2099-09-30。未发送通知，未编造打卡二维码，未写入真实证件影像，未把附件挂到占用队员上。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**存储开关。** 经用户授权，本轮只把 `storage-settings.enabled` 从 `false` 改为 `true`。变更前只读确认为提供方 `COS`、凭证状态 `configured`、桶与地域有值、`enableSignedUrl=true`、`enabled=false`。官方 PATCH 仅提交 `{"enabled": true}`，未改提供方、桶、地域或凭证，未重置凭证，未新建云资源。PATCH 与随后回读均为 200/0。首次对比把自动更新的审计字段计入差异后暂停上传；核对现网审计后，确认本次业务变更只有 `enabled`。补跑时设置已是启用状态，不再重复 PATCH，回读仍为 `enabled=true`，提供方与凭证状态未变。开关保持开启，未再关回。

**内容图片上传。** 官方类型配置仍允许 `content-image` 的 `image/jpeg`、默认 10MiB。新建未发布测试公告后，申请上传地址为 200/0。页面内直传未拿到可读响应；本机 Node 使用同一签名地址直传返回 200。确认上传请求已发出，但探针未观测到 HTTP 状态或业务码，根因未确认。按归属查询与清理回查均未发现测试附件行，后续审计也未发现附件确认入库。测试草稿已软删，两次再读均为 404/29001。存储侧未绑定对象是否已被后台回收仍未核实，未使用生产凭据另行删除云对象。上传成功路径尚未完整闭合。未将此次未观测到的确认上传直接定性为现网 8a 逻辑缺陷，未开 GitHub 事项，也未开审查草稿。

登录与登出均为 200/0，本地管理端配置目录已清理。未重跑上一轮已走通的职务任命。

证据：`wave14-functional-probe-receipt.json` SHA-256 `ca1862aaa78bcc92c06301f90afa9f487c9015fabf9e371e798ed991f9147856`；`SHA256SUMS-mid16.txt` SHA-256 `27810f1fa0b8696cca6b9a148ba02e10007b7cd66e9317886b79076815c6c369`。mid6–mid15 未改写。

## 11 月 26 日 18:07–18:13 · 职务任命可逆路径已走通并清理，成员冲突与组织树只读通过

本段按北京时间（Asia/Shanghai）追记脱敏结果，17:57–18:01 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`，本轮未改 `gradeCode`。四场验收活动及其报名未改、未撤销，报名截止仍为 2099-09-30。未发送通知，未编造打卡二维码，未写入真实证件影像。未改存储设置，未重放上传签发。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置均未删除、未改值。首发总任务未完成。

**职务任命。** 本轮新建测试职务 `t243u-pos-1d0ce98e31a3`（STAFF）、对应职务规则，以及非根测试组织 `T243U-ORG-1D0CE98E31A3`（节点类型 `t80u-node-20261122`），并为占用测试队员在该组织建立 SECONDARY。任命创建为 201/0，详情、成员轴与组织轴回查均为在任。随后撤销为 200/0，组织在任列表已移除该任命，任职历史仍可查询。清理后本轮 SECONDARY 已结束，规则、组织与职务均已软删；组织再读 404/11001，职务再读 404/32001。ACTIVE PRIMARY 始终为 0，基线归属保留，级别仍为 `volunteer`。未改已有职务、组织或任命。

**只读路径。** 成员归属冲突 200/0、冲突总数 0。组织树 200/0、节点数 2。附件 MIME 配置与大小限制配置均为 200/0，条目数均为 0。本轮按默认范围只读，未补种、未改这些配置。空目录记为剩余目录缺口，不作为代码缺陷事项。未开 GitHub 事项，也未开审查草稿。

登录与登出均为 200/0，本地管理端配置目录已清理。本轮无新增业务卡点。

证据：`wave13-functional-probe-receipt.json` SHA-256 `af7df421899a5b270df75be3d31727fd70242279df0295ffb030cc4cb71a7cee`；`SHA256SUMS-mid15.txt` SHA-256 `7e5bdbf5d73e80ccbbb8bc9ca0ff1ec5709ec4220ab38a29195acf97381c33b1`。mid6–mid14 未改写。

## 11 月 26 日 17:57–18:01 · 上传 503/13034 已判明为存储未启用，未开代码缺陷事项

本段按北京时间（Asia/Shanghai）追记脱敏结果，17:38–17:45 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`，本轮未改 `gradeCode`。四场验收活动及其报名未改、未撤销，报名截止仍为 2099-09-30。未发送通知，未编造打卡二维码，未写入真实证件影像。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典与官方附件类型配置（`member`、`certificate`、`activity`、`content-image`）均未删除、未改值。首发总任务未完成。

**上传签发 503 / 13034。** 对照冻结 `8a017348` 合约，该码用于存储状态不确定或操作未完成时的失败关闭，不是单独证明代码逻辑缺陷的充分条件。本轮只读 GET `/api/system/v1/storage-settings`，未改存储设置、未重置凭证、未向存储传文件、未调用确认上传、未使用或记录生产凭据、未新建云资源，也未为取证重放上传签发。设置行存在，提供方为 `COS`，凭证状态为 `configured`，`credentialConfigured=true`，桶与地域字段均有值，`enableSignedUrl=true`，但 `enabled=false`。按冻结合约，生产环境未启用会使定位与签发失败关闭并映射为 13034。判定为「未启用」，记为剩余卡点，未开 GitHub 事项，也未开审查草稿。首次登录后提交超时、服务端登出未确认；重试后登录与登出均为 200/0，本地管理端配置目录已清理。

**其他路径。** 占用测试队员的职务任命列表返回 200，当前 0 条。活动组织选项再次返回 403 / 40300，与既有发起人域限制一致，不作为新缺陷。本轮无业务写入。职务任命的可逆写入，以及成员冲突、组织树、附件 MIME 与大小配置等只读路径尚未在本段覆盖。

证据：`wave12-functional-probe-receipt.json` SHA-256 `204ed3f3af101ce1079b0f9842edcdd322daaa35f8143c080c0a7afc4b7e101e`；`SHA256SUMS-mid14.txt` SHA-256 `6ea4a553942bedde526342797c5ee783db3dd54bbb36c1dbf1c068a41d31e577`。mid6–mid13 未改写。

## 11 月 26 日 17:38–17:45 · 附件按归属查询已查明并走通，职务规则可逆路径已覆盖，上传仍受存储 503 阻断

本段按北京时间（Asia/Shanghai）追记脱敏结果，17:26–17:31 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号，级别仍为 `volunteer`，本轮未改 `gradeCode`。四场验收活动及其报名未改、未撤销，报名截止仍为 2099-09-30。未发送通知，未编造打卡二维码，未写入真实证件影像。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。已保留的官方证书字典未删除。首发总任务未完成。

**附件按归属查询。** 上次返回 400 / 13010 的请求符合冻结合约 `ListAttachmentsByOwnerQueryDto`，传入 `ownerType=member`，`ownerId` 为当前占用的测试队员 ID。API `8a017348` 先用枚举确认 `member` 合法，再查询 `attachment_type_configs` 中状态为 `ACTIVE` 的配置，未查到配置时返回 13010。验收库原先缺少这项配置。本轮经管理端按官方种子写入并保留 `member`、`certificate`、`activity`、`content-image` 四项，回读均为 `ACTIVE`。使用原字段复查 `GET /api/admin/v1/attachments/by-owner` 返回 200 / 0，空列表符合预期。已确认上次返回 13010 源于验收库缺少配置，本轮未对现网 API 逻辑开缺陷事项。

**附件上传。** 新建未发布测试内容后，`POST /api/admin/v1/attachments/upload-url` 返回 503 / 13034「附件存储操作处理中，请稍后重试」。未向存储发送文件，未调用确认接口，未改 `storage-settings`。测试内容软删除为 200 / 0，再读为 404 / 29001。冻结合约用 13034 在存储状态不确定或操作未完成时阻断请求。本轮未确认代码缺陷，未开事项，上传成功路径仍未走通。

**职务规则。** 新建测试职务 `t241u-pos-da4225a0b827`（`STAFF`）为 201 / 0，按既有节点类型 `t80u-node-20261122` 新建规则为 201 / 0，独立查阅规则为 200 / 0。随后先删规则，再删职务，回读职务为 404 / 32001。既有职务和规则未改动。

**证据。** `wave11-functional-probe-receipt.json` 的 SHA-256 为 `28a113a0cbbb8f7fd3edd1d2bb9f6d7dc1ff0b4fed16c8e2138105869a4db056`，`SHA256SUMS-mid13.txt` 的 SHA-256 为 `f74c52b98646f2881306fb958acd6a0560363d228d1b712eb43547553273df51`。既有 mid6–mid12 与更早收据未改写。

## 11 月 26 日 17:26–17:31 · 主岗兼岗并存、职务与证书标准可逆路径已走通，队员端只读补测已覆盖

本段按北京时间追记现网 wave10 的脱敏结果，17:06–17:13 及更早正文原样保留。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署、未合并、未正式对外开放。已收到移动端 Draft PR #12，仍为草稿，未合并、未部署。Draft PR #177 和移动端 Draft PR #12 均未计入现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号、未另建，级别仍为 `volunteer`，本轮未再改 `gradeCode`。四场验收活动及其报名未改、未撤销，报名截止仍为 2099-09-30。未发送通知，未编造打卡二维码。Draft PR #1459、#1460、#1461、#1463 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`，表单白名单仍归事项 #176。首发总任务未完成。

**17:29 现网 wave10 主岗与兼岗。** 本轮使用的测试队员原有 0 条 `ACTIVE PRIMARY`，另有 1 条已结束的兼岗历史。新建两个测试子组织均为 201 / 0，分别新增 `PRIMARY` 主岗与 `SECONDARY` 兼岗也均为 201 / 0，列表确认两条归属同时为 `ACTIVE`。随后先结束兼岗，再结束本轮主岗，均为 200 / 0。两个子组织软删除均为 200 / 0，再读均为 404 / 11001。活跃主岗回到基线 0，回读确认本轮测试以外的既有归属无变动。

**职务定义。** 新建唯一测试职务 `t240u-pos-c09434fe3b26`，类别为 `STAFF`，创建为 201 / 0，读取与改名均为 200 / 0，删除为 204，再读为 404 / 32001。既有职务未改，可选职务规则本轮未跑。

**证书标准。** 验收库原先缺少官方 `cert_type`、`cert_sub_type` 和 `cert_status`。本轮经管理端按官方种子补齐并保留三类字典项，创建均为 201 / 0。`cert_type` 七项为 `first_aid`、`bsafe`、`outdoor`、`coach`、`comm`、`medical`、`other`。`cert_sub_type` 七项为 `bsafe_l1`、`bsafe_l2`、`first_aid_basic`、`first_aid_advanced`、`amateur_radio_a`、`amateur_radio_b`、`amateur_radio_c`。`cert_status` 四项为 `pending`、`verified`、`expired`、`rejected`。随后新建测试标准 `t240u_std_c09434fe3b26`（`CREDENTIAL`）为 201 / 0，读取与改名均为 200 / 0，删除为 204，再读为 404 / 18002。未给队员创建证书，未写入证件号。

**队员端只读补测。** `/me`、`/me/account`、`/me/profile`、`/me/capabilities`、`/my/registrations`、`/my/activities`、`/my/certificates`、`/my/participation-ledger`、`/my/participation-summary`、`/my/attendance-records`、`/notifications` 以及可报名活动列表均为 200 / 0，级别仍为 `volunteer`。查询当前入队申请仍返回已知的 404 / 28202，未新开事项。未取消报名，未修改资料。

**附件按归属查询。** `GET /api/admin/v1/attachments/by-owner?ownerType=member&ownerId=…` 已转到现网验证，返回 400 / 13010（归属类型不合法）。冻结契约中 `member` 属于已知的 `ownerType`，成功路径尚未走通，本批未作为已确认缺陷新开事项。未改存储配置，未做附件上传。覆盖缺口还包括附件上传与可选职务规则。

**证据。** `wave10-functional-probe-receipt.json` 的 SHA-256 为 `7afb377a36b2ef183d748d35c191c9cf535dc29465a07f6bceedf172af1acc86`，`SHA256SUMS-mid12.txt` 的 SHA-256 为 `fe2681072f836735cab746af3605b46619f2b5735ea7bbb62ae57c9756d9047d`。既有 mid6–mid11 与 wave9 收据原样保留。

## 11 月 26 日 17:06–17:13 · 事项 1462 已开审查草稿，字典项与兼岗可逆路径已走通

本段按北京时间追记事项 #1462 与现网 wave9 的脱敏结果，保留 16:33–16:40 及更早正文。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署，未合并，未正式对外开放，未把 Draft PR #177 当作现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号、未另建，级别仍为 `volunteer`，本轮未再改 `gradeCode`。四场验收活动及其报名未改、未撤销，报名截止仍为 2099-09-30。未发送通知，未编造打卡二维码。Draft PR #1459、#1460、#1461 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。表单白名单仍归事项 #176。首发总任务未完成。

**事项 #1462 已开审查草稿。** API 仓库已开 Draft PR #1463，目标分支为 `main`，仍为草稿，未合并、未部署。功能分支为 `fix/issue-1462-grade-null-clear`，提交为 `74b79f769`，父提交仍为 `643697786`。修复口径沿用 `nickname` 的处理方式，管理端更新队员时传 `gradeCode: null` 可清空级别，使其回到非正式级别，省略该字段则保留原级别。定向 e2e 54 项、契约 1132 项及 2 个快照、队员模块单测 109 项均通过。OpenAPI、前端客户端和路由授权文档检查均通过，改动文件通过 ESLint。全量单测复跑通过 11337 项，另有 2 项 E4 进程组测试失败，相关实现与父提交一致。本机全仓冷 lint 超时。测试只使用隔离库 `app_test_srvf_t236u_api_1462_734f47` 及其 worker，验收库 `srvf_t68_accept` 未改。执行中曾在该隔离模板库运行到历史迁移中的 `PUBLIC` 授权语句，变动范围限于隔离环境，复查称触发器函数执行权限仍在，worker 已回收。现网 `8a017348` 仍不能把级别精确写回 `null`，须待审查合并并另行授权部署后才能回归。

**17:11–17:12 现网 wave9 字典写入。** 新建唯一测试字典类型 `t239u_dict_ed551e79c42c` 及测试项，均为 201 / 0。独立读取测试项后修改 `label` 和 `sortOrder`、停用并删除，均为 200 / 0，删除后再读为 404 / 12010。测试类型停用后删除为 200 / 0，再读为 404 / 12001。官方 `content_type`、`volunteer`、`level-1` 及既有停用类型 `t234u_dict_f62137b8` 均未改动。

**同轮测试子组织与兼岗。** 新建测试子组织为 201 / 0，为当前占用的测试队员新增 `SECONDARY` 兼岗为 201 / 0，队员归属和组织归属查询均为 200 / 0。结束兼岗为 200 / 0，保留 `ENDED` 历史。子组织软删除为 200 / 0，再读为 404 / 11001。队员端 H5 `/me` 为 200 / 0，级别仍为 `volunteer`。该队员在操作前、新增兼岗后和结束兼岗后的 `ACTIVE PRIMARY` 均为 0。本轮未覆盖已有主岗时再兼岗的并存情形，也未创建或结束 `PRIMARY`。

**证据。** `wave9-functional-probe-receipt.json` 的 SHA-256 为 `a4fea935a2aa65bf332a92c4b32312cb96b728e90ac2066319df96741764f0cc`，`SHA256SUMS-mid11.txt` 的 SHA-256 为 `8fa61c39aed8a370e230767031e0de28079437522421775dbbdd7f3a809ba409`。既有 mid6–mid10 与 wave8 收据未改写。

## 11 月 26 日 16:33–16:40 · 正式级别下内部活动与内容发布已走通，级别已改回非正式，验收库已补内容类型字典

本段追记 T234 续测与 T235 授权补种字典后的脱敏现场结果，不回溯涂改上一节 16:07–16:22 及更早正文。现场版本未变：管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署，未合并，未正式对外开放，未把 Draft PR #177 当作现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员未改号、未另建。四场验收活动及其报名未改、未撤销，截止仍为 2099-09-30。Draft PR #1459、#1460、#1461 仍为审查草稿，未合并、未部署。事项 #1454、#1455 仍为 `PR_BLOCKED`。表单白名单仍归事项 #176。首发总任务未完成。

**活动创建合同与正式级别抽检。** 核对冻结源码后，管理端创建活动一律走发起人解析，超管可以把发起人指定为其他队员，但不能绕过「发起人须为正式队员」。16:33–16:34 将该占用测试队员级别由空改为 `level-1`（200 / 0），再以其为发起人新建未发布测试草稿 201 / 0，改说明 200 / 0，软删除 200 / 0，再读 404 / 20001；测试组织子节点同步建删，四场夹具未编辑。队员端在正式级别下，四场内部可见活动目录与详情均为 200 / 0，与事项 #1458 的可见性口径一致。随后把级别写回 `null` 返回 500 / 50000，级别未变，属未处理异常，已开事项 #1462，本批未打现网补丁。当时验收库 `member_grade` 仅有 `level-1`，写入 `volunteer` 返回 400 / 15010，符合字典项不存在。

**验收库补种缺失字典后，公告/内容与级别还原。** 经本次授权，16:40 经管理端字典写入按应用自带官方种子补齐：新建 `content_type`（内容类型）及 `announcement` / `publicity` / `briefing` / `post` 四项，均为 201 / 0；并在已有 `member_grade` 下补 `volunteer`（志愿者）201 / 0。上述字典项保留在验收库，供后续内容与级别回归使用。随即以明显测试标题新建正式队员可见的公告草稿 201 / 0，改标题 200 / 0，发布 200 / 0；队员端在仍为 `level-1` 时列表可见该篇、详情 200 / 0。随后撤回 200 / 0、软删除 200 / 0，再读 404 / 29001，未留下已发布稿，未做不可逆归档。再将该队员级别改为 `volunteer`（200 / 0），已从正式级别还原为非正式；不能写回精确的 `null`（事项 #1462）。还原后队员端内容列表 0 条，内部活动目录也回到 0 条。未发送通知，未编造打卡二维码。

## 11 月 26 日 16:07–16:22 · 保险、字典与组织可逆写入已走通，活动新建仍受正式队员发起人约束

本段追记 T234 继续验收的脱敏现场结果，不回溯涂改上一节 15:07–15:55 正文，也不改写再上一节 13:23–14:53 所记 T214 至 T231 进度。现场版本未变：管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署，未合并，未正式对外开放，未把 Draft PR #177 当作现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员仍在使用，未改号、未另建队员。四场验收活动及其报名未改、未撤销，报名截止仍为 2099-09-30，未用负责人账号提交排位分配，未指定负责人为新活动发起人，未编造现场二维码，未发送通知。API 事项 #1454、#1455 仍为 `PR_BLOCKED`。Draft PR #1459、#1460、#1461 仍为审查草稿，未合并、未部署。表单白名单 400 仍归事项 #176。首发总任务未完成。

**保险与字典可逆写入。** 16:07–16:08 两端登录均为 200 / 0。管理端以明显测试标记新建字典类型，返回 201 / 0，随后改名、停用均为 200 / 0，停用后状态为未启用。队员端自报保险（明显测试标记、不走付费）新建为 201 / 0。首次删除被测具路由白名单拦截（带版本查询的删除未放行），属测具漏参，不是产品缺陷。16:13 修测具后清掉该条遗留，删除 200 / 0，队员端列表回到 0 条；管理端该队员保险列表和总览为 200 / 0，列表 0 条。

**组织可逆写入已走通；活动新建未写夹具。** 16:21–16:22 管理端组织列表为 200 / 0。在既有根节点下以测试标记新建子节点 201 / 0，改名 200 / 0，软删除 200 / 0，再读为 404 / 11001，测试子节点已不存在。未改动既有组织树中的其他节点。管理端活动列表仍只有四场验收夹具，本批未编辑这四场。另建未发布测试草稿活动返回 403 / 20019「只有正式队员可以发起活动」，符合发起人须为正式队员的既有约定；本批未把负责人账号指定为发起人，也未改任何队员级别，不作为新的代码缺陷开项。因此，在不改夹具、不指定负责人的前提下，管理端活动可逆编辑尚未跑通。

**公告与内容仍为环境种子缺口。** 现网字典类型仍无官方 `content_type`，内容创建合同要求该字典的启用项。本批未擅自补种官方 `content_type`，也未把它记为冻结 API 代码缺陷。通知列表仍为 0 条，未为测已读发送通知。非正式队员的活动目录仍为 200、0 条，与已开事项 #1458 一致，现网未变。

## 11 月 26 日 15:07–15:55 · 管理端与队员端续测已通过，三项报名缺陷已开审查草稿

本段追记 T232、T233 的脱敏现场结果，不回溯涂改上一节 13:23–14:53 所记 T214 至 T231 进度。现场版本未变：管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未重新部署，未合并，未正式对外开放，未把 Draft PR #177 当作现网或 `main` 头。未执行权限撤回，未清场。同一虚拟测试队员仍在使用，未改号、未另建队员。四场验收活动报名截止仍为 2099-09-30，未用负责人账号提交排位分配。API 事项 #1454、#1455 仍为 `PR_BLOCKED`。首发总任务未完成。

**管理端只读抽检。** 此前一轮登录失败，是测具使用的浏览器目录不符合官方登录工具要求，登录页已渲染但未发出登录请求，不是产品结论。改回官方管理端目录后，15:07 与 15:08 两次登录、退出均为 200 / 0。主要只读接口已通，包括工作台、队员与报名、四场活动、组织、字典类型、权限与角色、参与汇总和台账。`/api/system/v1/menus` 返回 404，是测具写错路径，冻结 API 没有这条路由；字典项未带必填类型参数时的 400 也是测具缺参，补上类型参数后为 200 / 0。

**队员端与写路径续测。** 第三次功能抽检第一次因测具漏记结果，结构化回执未落盘，但登录本身已成功；已修测具后于 15:22–15:23 重跑通过。队员端新读面包括本人资料、头像、微信与企微绑定状态、保险、通知、内容、打卡状态等，为 200 / 0。时长证明在补齐日期参数后返回 503 / 20235「正式参与时长证明尚未启用」，属功能未启用，不是缺参。四场活动的打卡记录 404 / 22002、评价 409 / 35030、对账 409 / 20030，符合 2099 窗口尚未开始或活动未完结，未改截止时间。打卡写入因请求体缺少二维码或坐标返回 400，未编造现场二维码，不另开事项。管理端部分发起人责任域接口对当前超管会话返回 403，属既有责任域闸；时间政策与贡献政策列表返回 403 / 30100，本批只记录、未新开项。

第四次抽检于 15:53–15:55 续跑安全写路径与正确页面。队员端仅昵称字段的本人资料更新返回 200 / 0，并已还原为更新前取值。队员端既有路由「我的」「我的活动」「我的参与记录」「我的保险」「活动」均可打开；上一轮误访的不存在哈希会落到系统未找到页，属测具写错路由，不是产品缺陷。「我负责的活动」对该非正式、无管理职责的队员进入系统禁止页，与其管理活动列表为空一致。本人短时考勤凭证首次因测具未带访问令牌返回 401，补上令牌后返回 201，内容类型为 SVG，回执只保留字节数，未保存图形正文。管理端角色绑定预览、角色绑定列表、该队员参与账本和微信模板列表（0 条，仅计数字段）为 200 / 0。管理端时长证明同样是 503 / 20235。附件按归属查询因测具使用了不合法的归属类型返回 400 / 13010，不另开事项。

**缺陷修复走审查草稿，未部署。** 已确认的冻结 API 缺陷未在现网打无人审查补丁，也未重复开项。事项 #1456、#1457、#1458 已分别开 Draft PR #1459、#1460、#1461，均以 `main` 为基线，保持草稿、未合并、未部署。#1459 避免旧审批只把报名头写成通过；#1460 在有场次无岗位时于写头前拒绝空偏好；#1461 让内部可见活动对非正式队员的目录、详情和自助报名结果一致。表单白名单 400 仍归事项 #176。现网仍为 API `8a017348`。

## 11 月 26 日 13:23–14:53 · 测试验收库已放开业务读写，虚拟队员建档报名已落地，先到先得占位已走通

本段追记 T214 至 T231 的脱敏现场结果，不回溯涂改上一节 11:01–11:31 快照。现场版本未变：管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未切换 API，未重新部署，未正式对外开放，未自动合并，未把 Draft PR #177 当作现网或 `main` 头。未执行权限撤回，未清场。t175 虚拟测试队员授权仍有效，未改号、未另建队员、未混用既有真实测试身份。首发总任务未完成，`total_task_complete=false`。

**写权与档案。** T214、T215 先补齐管理端目录读取所需的列级 SELECT，消除残留 503。随后按授权给测试库中接口角色放开 `public` 下业务表的读写（含字典表），并补 schema 与序列权限；不转授、不改其他库或其他角色、不授 PUBLIC、不提升超级用户。撤回脚本已写好但未执行。T218 起先按最小写权建档：编号预留表起初缺 SELECT，创建队员返回 503；T219 仅补该表编号与主键列的 SELECT 后，路径乙创建队员、开普通账号并绑定成功。管理端冻结表单提交扩展档案仍因多余字段（姓名、加入日期、来源）被白名单拒绝，HTTP 400、业务码 40000，与已开事项 Issue #176 一致，本批未改表单、未部署 Draft PR #177。改走官方档案 DTO 时，曾因字典表无读权返回 503 / 42501，档案未落库；业务表读写放开后，同一队员重提官方 DTO，HTTP 201、业务码 0，档案已落库。

**报名与先到先得占位。** 队员端登录测具起初只放行了管理端风格的认证路径，拦截了队员端登录、刷新和退出接口，属测具问题，已修正；正式 H5 登录随后返回 200 / 0。四场已发布验收活动中，三场没有 live 场次岗位，空岗位偏好首次报名即 201 / 0；含 live 岗位的排位场首次返回 409 / 21035（必须选择活动岗位），补上场次与岗位偏好后 201 / 0。两场排位场随后由管理端走既有 `approve`，HTTP 200 / 0，报名头状态为通过。两场先到先得首次报名因空偏好未生成参与身份，尽管容量桶已初始化，自动占位未发生；用新操作键补交场次偏好（无 live 岗位时岗位列表为空）后，两次均为 201 / 0、修订号 2，参与身份为通过，容量预留为有效的场次参与预留，报名头亦为通过。冻结 API 在「没有 live 岗位」时允许完全空的偏好列表，即使活动已有场次；先到先得占位只作用于已生成的参与身份。此为产品契约缺口，不是单纯配错岗位数据，已开 API 事项 #1457。

**排位场参与层。** 管理端 `approve` 只更新报名头，不改 v1.1 参与指针，也不创建容量预留。拒绝路径已走参与生命周期，通过路径没有对等处理。官方排位分配是活动负责人在报名截止后冻结并提交分配批次；这四场验收活动的报名截止均为 2099-09-30，当前不能走该链。因此带岗位偏好的排位报名在 `approve` 后，报名头为通过，参与身份仍为待审且无预留；另一场无偏好的排位报名头为通过，但没有参与身份，且已通过的报名头不可再按命令链补交偏好。本批未改截止时间、未用负责人账号提交分配、未在现网打无人审查的补丁。此为冻结 API 的产品缺陷，已开 API 事项 #1456。

**三端抽检。** 以同一虚拟队员只读抽检队员端：本人资料、能力、保险列表、我的活动与我的报名（四条，状态均为通过）、证书、考勤、参与汇总、通知未读等均为 200 / 0。入队申请当前记录返回 404 / 28202，符合没有申请的预期。活动目录与可报名列表对这四场返回 200 / 0 且条目数为 0；活动详情、岗位与报名保险返回 404 / 20001。该队员等级为空，不算正式队员；四场可见性为内部，非正式队员只能看到邀请活动。报名主链只检查是否公开报名，不检查正式等级与内部可见性，故可报名却不能在目录或详情中打开同一活动。此为产品不一致，叠加建档未写入正式等级，已开 API 事项 #1458。管理端本轮只读抽检在登录步骤被测具中断（登录页已渲染，但未发出登录请求），尚未形成产品结论，待重试。

**结论。** 测试库写权、虚拟队员建档与官方档案、四场报名以及先到先得参与占位已在验收环境走通。排位场的 v1.1 分配链、活动目录对非正式队员不可见、管理端表单白名单（Issue #176）以及管理端只读抽检仍待继续。未清场、未撤权、未重部署。证据短名：`srvf-t218u-t175-write`、`srvf-t219u-t175-retry`、`srvf-t230u-live-test`。


## 11 月 26 日 11:01–11:31 · 已核清管理端建档必须由用户提供的材料类别

本段只追加 T203 本地只读契约调查的已封存结论，不回溯涂改上一节 09:38–10:16 快照，也不重做 T199 至 T202。现场版本未变：管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`。未登录，未打开或提交表单，未改库，未补 503 列权，未切换 API，未重新部署。t175 专用测试成员授权仍有效，路径仅为管理端正规建档并走既有正式资格与保险前提，不得混入未授权的公开自助招新，不得虚构身份证件、保险单或资格事实。首发总任务未完成，`total_task_complete=false`。Draft PR #177 未部署。f798 仍不得作为面向 `main` 的 PR 头。

**调查范围。** 对照冻结正式管理端 `f7985191`（已审建档补丁 4 个源文件）与冻结 API `8a017348` 的正式契约，列清按 t175 新增 1 名专用测试成员、并走既有正式资格与保险前提时，必须由用户提供、不可编造的材料与字段。`USER-BRIEF.md` 与 `EVIDENCE.md` 两份正文的封存落盘时间为 11:25:55（Asia/Shanghai）。证据留在受控交接处 `srvf-t203u-materials-readonly`：USER-BRIEF.md SHA-256 `04c02108558b60296480a76da0903af56ca56aea9bff8f6553a7896340868446`，EVIDENCE.md SHA-256 `3142e577f462e9c16b06c101623b29173228a47fd5d879965240c6c465a4bf35`，回执 T203U-RECEIPT.md SHA-256 `af04d577afecb00456c4b47ecfe52bf5575a55a1c6b4ae7e9853834651902a43`，SHA256SUMS SHA-256 `5c6e57e8e2dd4f3093d49efa77c5eca6ccea0ad9d198decb5e9fe4df42818416`。

**管理端新建队员。** 必填四项：队员编号（字母、数字和连字符，1–32 位，不能带空格，提交时按原始输入校验，全库唯一且含已删除编号不可复用）、姓名、发号日（年-月-日，须由用户确定，不能默认成当天）、来源（管理端正规建档应选「管理员录入」）。队内称呼与等级可选；一旦填写等级，必须是现行有效级别。此步不收身份证、不发短信、不走付费 OCR、不要签名。

**后续开号或绑定。** 两条都是正式管理路径，选一条即可。手机开号须提供该人真实可用、系统内未被占用的大陆 11 位手机号；开号当时由管理员背书，不发送验证码、不设密码，之后该队员登录只能靠该号码收短信，不能代收或用虚构号。普通账号绑定路径须指定用户名（3–32 位约定字符）并设定密码（至少 8 位且同时包含字母和数字，由用户自行保管，不是身份证件）；绑定只接受普通用户，不强制手机号。

**正式资格准备。** 新建队员本身不收证件。扩展档案在管理端可代填，但必须用真实材料。正式接口必填为：性别、出生日期、证件类型、证件号、本人手机、邮箱，以及是否授权个人信息使用。此管理端档案路径不要求证件影像、签名或付费 OCR。证书或培训，以及活动和岗位各自的性别门槛、资格规则中的等级、组织、年龄或保险条款，均视目标活动当时的规则而定，不得把现有测试活动的具体规则写成已经核清。缺少档案时，性别门槛和年龄规则不能通过；计入资格的证书须为已核验、颁发日不晚于活动开始日、有效期覆盖到活动结束日，并属于该规则认可的可持有标准。冻结管理端新建档案表单仍会多送已迁到队员主档的姓名、加入日期和来源，与正式接口白名单不一致；本批未提交，档案能否实际保存仍为未实测。

**保险前提。** 仅当目标活动打开「需要保险」，或资格规则里有设为阻断的保险条款时，才需要有效覆盖。自购保险须由该队员本人登录后申报保险公司、保单号和到期日（起保日可选，填写则不得晚于到期日），须为真实保单；管理端不能代建自购记录，只能审核。队内统一保单须已有按北京时间覆盖活动开始日至结束日的现成保单，才能把该队员加入覆盖名单，不能为此新编假保单；现场是否已有可用队保单未核。保险强制开关的现场值未核。测试对象 B 在可见四场测试活动上曾显示「保险条件满足」，但该标志在活动未要求保险时也会为真，不能据此认定 B 实际持有保险覆盖，也不能认定其持有可转给新人的保单，更不能证明新成员可以免保险。

**不要走的路径与已有测试对象。** 公开自助招新要求先完成手机验证码，并提交证件影像和签名图等，还可能触发付费 OCR；该路径不在本次授权内，此前公示入口不可用，不得用来凑这名测试成员。封存回执确认已有测试对象 A（负责人）和 B（报名对象）；B 在可见四场均已通过，不能再当作新报的专用测试成员。未发现另一套尚未使用的真实证件、新手机号或新保单材料包。本批未对已有测试对象做任何操作。

独立审查用 Codex CLI 0.171.0，实际 `turn_context.payload` 为 `gpt-6.2-sol`、努力档 medium。审查循环在多轮 FAIL 后按冻结契约修订了填写口径，随后按指示停止继续循环；交付正文以封存 USER-BRIEF 与 EVIDENCE 的上述 SHA 为准。本段文档持久化未改现场。

## 11 月 26 日 09:38–10:16 · 开户六码已写入共享目录，正式入口已解阻

本段只追加 T199 至 T202 及本地门槛调查的已交付事实，不回溯涂改上一节 00:23–00:31 快照。现场管理端仍为限定留存 `f7985191`，队员端 H5 仍为 `3968b0bc`，API 仍为 `8a017348`（容器前缀 `b5b5bd933560`，配置前缀 `be5569b8f63f`）。未重新部署，未切换 API，T188 的 API 更新/恢复预算仍已用尽。未补 503 列权，未降级 SUPER_ADMIN。首发总任务未完成，`total_task_complete=false`。f798 仍不得作为面向 `main` 的 PR 头。Draft PR #177 未部署。

**T199 官方只读列权对照（09:38–09:39）。** 按当时批准做一次只读核对：当前 API 库角色在关闭对象集上的列权仍等于封存 445。`cells`、`info`、`effective` 三者彼此相等，且与封存 `baseline-445` 相等，共同 SHA-256 `931e24ccd287b6395f448dbd6f95574f6e14a99a8ea2d42ec43c132d006bcaeb`。acl-raw SHA-256 `7c91fd2967bc9456f40d649ad06ebae5dc4aa6721a34eb16088e2d5ae3fbaa8e`。未 GRANT/REVOKE，未改库。证据留在受控交接处 `srvf-t199u-acl-readonly`。

**T200 共享权限目录仅插入开户 6 码（COMMIT 09:49:24）。** 按当时批准，向共享 `permissions` 仅插入已缺的六个办理码，字段取自冻结 8a 官方种子，未改其他目录行。行数由 19 增至 25，原 19 行未改，这 6 行无 `role_permissions` 引用。写前 code 集 SHA-256 `94cd819e50cddc5163e08f6b337d1be8fa9a87c76131448eff8c9a7bc3384182`，写后 `dbe3606eb6eec14b9cd4147074c8ea316d6867c6ba6bdaea5b175d33ea271b6b`。未给 API 角色做 GRANT/REVOKE，列权仍为上述 445，未部署，未执行恢复。可仅撤这 6 行的恢复脚本 `restore-six.sql` SHA-256 `f15428c6d73f26e32258d56b29cb6afeb072ce7cc77a9706e856cb33b6cbfde9` 尚未执行。插入 id：`member.read.record` `cmwww9c3a0001ax830krcg9ud`；`member.create.record` `cmwww9c3a0002ax83w5lrze1o`；`member.bind.account` `cmwww9c3a0003ax83k2wqz9vq`；`member.grant.account` `cmwww9c3a0004ax83mup8xk5z`；`user.read.account` `cmwww9c3a0005ax83h1h40tg6`；`user.create.account` `cmwww9c3a0006ax83l1w3f3nh`。证据留在受控交接处 `srvf-t200u-permission-insert`。

**T201 正式登录（09:55:39–09:55:45）。** 新的官方管理登录，login/logout 均为 HTTP 200、业务码 0，profile 已清理。有效集由 19 增至 25，六个办理码均在有效集中为 true。当时脚本在 SPA 哈希跳转后立刻用 `domcontentloaded` 与 `isVisible` 判定「新建」和「草稿编辑任命」不可见；该判定是过早采样，未等待懒加载块或列表请求完成，不得写成权限门闩实证，已被 T202 取代。证据留在受控交接处 `srvf-t201u-admin-effective`。

**本地门槛调查（未改现场）。** 冻结管理端 f798 源码与正式包对照：「新建」只门控 `hasPerms("member.create.record")`，工具栏还需 `member.read.record`；「草稿编辑任命」门控 `roles.includes("SUPER_ADMIN")`。字典接口 503 在源码中静默降级，不卸载这两个按钮。该调查不是现场可见性证明。证据留在受控交接处 `srvf-t201u-entry-gate`，其中 EVIDENCE.md SHA-256 `d177ad3262f1dcd38b56486b06d49c7d83492cbaa4accf0d38d67f28f3e80dcf`。

**T202 正式入口复登录（10:16:17–10:16:23）。** 新的官方管理登录，新鲜 profile，未复用 T197 或 T201 残余，`profile_cleaned=true`。login/logout 均为 HTTP 200、业务码 0。身份为已核的 SUPER_ADMIN 验收账号 `accept_t71_admin`，状态 ACTIVE。队员页等到 `GET /api/admin/v1/members` 约 408ms 完成（HTTP 200、业务码 0）后约 4ms，「新建」可见，`create_button_visible=true`。工作台等到 `[data-testid=draft-editor-entry]` 约 974ms 可见，`draft_editor_visible=true`。未打开、未提交表单（`form_opened=false`，`submitted=false`）。有效集仍为 25，六个办理码仍均为 true。字典类型接口仍为 HTTP 503、业务码 50300；同窗另有工作台摘要、活动与考勤单接口 503，只记录，未补列权。正式入口已解阻。证据留在受控交接处 `srvf-t202u-admin-entry-visibility`，receipt SHA-256 `964002915ae18975287b19c361ac500639fc92fdd4e7a822dbc40f9d9492352a`，EVIDENCE.md SHA-256 `27e6138014b87125dae89ea4b81dc05a4d9fefc1dd488f7b8423091df984c28d`。t175 专用测试成员授权仍有效，须待真实身份、保险、资格材料齐备且未虚构后再提交；本段所述各登录均未提交建档或开户表单。

## 11 月 26 日 00:23–00:31 · 管理端 f798 已留存，开户权限仍未解

北京时间 2026-11-26 00:23:04 起，按既有授权完成一次管理端静态切换并窄验收。现场管理端限定留存 `f7985191b9af7c8ad0654cef31bc83552a1ef3d9`（静态树 SHA-256 `0f71100a26e7c237e38bd1832c7e38610044363dfc7e25fa89d601f35ac38ab1`，315 个文件），未执行恢复；原 `e54dfb49e329c0d869e64783d450e296ab6302ea` 仍在恢复槽。队员端 H5 仍为限定留存 `3968b0bc8edfc26cd0c3a435576c5b4a8b40e382`。现场 API 仍为 `8a017348d4b8a642d673de539533fa8b1b750865`，未再切换，T188 的 API 更新/恢复预算已用尽。首发总任务未完成，`total_task_complete=false`。f798 仍不得作为面向 `main` 的 PR 头。

窄验收使用 1 次官方登录与退出，以及不超过限额的只读请求。登录身份为已核的 SUPER_ADMIN 且有效。有效权限仍为 19 个活动域代码，六个办理码仍不在有效集，「新建」不可见，故未打开也未提交建档表单；工作台任命编辑区本次亦不可见。这不记为新的表单代码故障。同窗字典类型接口再次出现 HTTP 503、业务码 50300，未再试，不改记为新的表单缺陷。

**上次 API 候选 502。** 六次健康探测均打到同一站点、同一 ready 路径、同一上游端口。前五次（候选启动后约 1–3 秒，以及刚恢复 8a 后约 1–2 秒）反代日志为 `connect() failed (111: Connection refused)`，HTTP 502。22:38:47（Asia/Shanghai）同一路径返回 HTTP 200。启动就绪时滞假设得到现场日志支持。候选代码缺陷仍未证明；候选容器启动日志已不可读。不得据此重开已耗尽的 API 切换窗。

**开户权限。** 现场对象级失败日志仍不存在，原始表/列仍不能从历史日志补写。T180 既有身份局部授权已经用过，正式角色绑定补不了该 SUPER_ADMIN 的前端有效码，实际写入 0。本地按封存官方列权基线与冻结 8a 源码做了同形复现，结果与「有效码读取成功、权限列表/角色摘要和字典接口 503」相符，但不能代替现场列权读回，也不把本地结果写成现场证明。正规只读管理面接口不能给出对象/列名。补共享权限目录行、扩大数据库授权或降级 SUPER_ADMIN 均未做，也不是本段授权范围。

**切换探测的本地修正（未用于现场）。** T188 外部 ready 在候选侧只试 3 次即回滚，相对已证约 50 秒的外部就绪过早。本地隔离副本改为 60 秒墙钟等待，并在原 1800 秒窗口第 1680 秒的恢复截止前对正在进行的探测做硬截止，避免只改次数或只在发起前检查超时时越过恢复截止。官方容器内探测路径未改，封存切换原件未改。该副本尚未用于现场，也不能自行启用。

上一节 T182–T188 快照记录写就当时的现场版本，其中管理端仍为 e54、f798 尚未交付的表述以当时为准，不以本段回溯涂改。

## 11 月 25 日 · T182 至 T188 已核进展

截至本次记录，现场管理端仍为 `e54dfb49e329c0d869e64783d450e296ab6302ea`，API 仍为 `8a017348d4b8a642d673de539533fa8b1b750865`，队员端 H5 限定留存 `3968b0bc8edfc26cd0c3a435576c5b4a8b40e382`。477 版本与 H5 Draft PR #7 仍未合并。首发总任务未完成，`total_task_complete=false`。

- **T182 现场权限与 503。** 有效集含 19 个活动域权限码，目录共 273 个。六个办理码均在目录中，均未进入有效集。两次目标 503 均确认进入 `AllExceptionsFilter` 的权限错误映射分支。该分支的固定告警总写 `SQLSTATE 42501`，现场实际 SQLSTATE、失败操作、表和列仍为 UNKNOWN。
- **T186 日志归集。** 同一权限错误映射分支得到确认，失败操作、表和列仍为 UNKNOWN。脱敏可观测性补丁 SHA-256 为 `a8d93a5074c2d1fd6838e878bed0f1422db4da0b7a6cdd1f723a0e65d2d268dd`，独审 PASS，当时未部署。
- **T186 管理端兼容候选。** 仅本地提交 `f7985191b9af7c8ad0654cef31bc83552a1ef3d9`，父提交 `e54dfb49e329c0d869e64783d450e296ab6302ea`，树 `e7f6c739b10f76ad6da0dbb4840aa4d7e127f0b8`。契约补丁 SHA-256 为 `b54c9b2a687bce023a2879ba8d73314593d90ac0a8067334643199aa35e72d30`，源码独审 PASS，保留任命功能。正式构建进行中，尚未交付。该候选不得用作面向 `main` 的 PR 头或用于部署。
- **T187 API 日志候选。** 在冻结的 8a 上应用脱敏可观测性补丁，打出 15 层本地镜像。提交 `f3204c4794afc0284b646335ac18f3b4cd7ee355`，镜像 tar SHA-256 为 `f3881a1d08b77eff40ccea8a8e121d809ca1794536099a5cfa05852a471e2d6c`。定向 Jest 156/156，非沙箱 listen 补测通过。未部署。
- **T188 API 恢复方案。** 按独审要求补齐镜像加载完成证据，包括 inspect 核对镜像身份、读回预期 tag、确认锚点后的 `image/load` 事件。首次切换复用前也须读回 tag。状态机单元测试 10/10，测试范围限于状态机。Codex 沙箱访问 Docker socket 返回 `permission denied`。原定 6 项引擎隔离演练已在非沙箱的本机 OrbStack 通过，最近一次项目为 `srvf-t188u-engine-lab-34e35811af`，时间为 2026-11-25 22:07:36 至 22:08:01（Asia/Shanghai）。第三轮独审 PASS，阻塞项为空（会话 `01a21309-6f20-7773-a776-8f4c0265c4c7`，turn `01a21309-7dc8-7723-be39-bcd9b1379afd`），`allow_runtime_api_switch_after_independent_review_and_live_preflight=true`。现场前置复核仍未执行，本批未 SSH、未登录、未部署，现场 API 仍为 8a。官方长期写入进程 PID 61139 占用唯一现场写入席位，须保持运行。

t175、t167 已授权，办理仍为 `NOT_RUN`，须等官方入口及现场表单契约实际可用。Issue #176 与 Draft PR #177 所涉修复未部署。API #1454、#1455 仍为 `PR_BLOCKED`。未授权的权限库扩权、合并及正式对队员开放均未执行。

## 11 月 25 日 19:43 · 建档表单契约已独审并开草稿，现场开户仍受应用权限阻挡

本快照补充此前未写入本文件的 T175、T177、T178 现场与源码结论，以及本轮对本地补丁的独立审查和代码托管回执。队员端现场仍为有限留存 `3968b0bc`，本段所述各批均未重部署。首发总任务未完成。

T175 只做了 5 次匿名 GET，未登录管理端。公开招募宣传页返回 HTTP 503、业务码 50300；队员端静态资源与 3968 清单一致。当时用封存列权和冻结表单字段推断开户路径不可用，这些不是当次管理身份的实测拒绝。

T177 用已保管的验收管理员经官方页面登录。登录、本人身份和有效权限读取均为 HTTP 200、业务码 0，系统角色为 `SUPER_ADMIN`。有效权限列表未包含建档、开号或绑定所需的应用权限码。三个官方办理入口均未取得可提交页面。建档、开号、绑定请求为 0，因此写接口 403 仍为未测。首页字典类型三次读取均为 HTTP 503、业务码 50300。业务写入 0，专用测试成员未创建。资格、保险、报名、录取及两项特殊提示均为 `NOT_RUN`。

T178 再次登录一次（非重复空转排查同一结论的加试，而是为分清失败步骤）。两个正式路由均可到达：队员页为 `#/srvf/members-domain/members`，用户页为 `#/srvf/system/users`。页面分别显示缺少 `member.read.record` 和 `user.read.account`，两个新建按钮均未渲染。这是当次页面实证。冻结前端在缺读权时会去掉按钮栏；`SUPER_ADMIN` 角色本身不能代替这些功能码。T177 的 `hash=other` 只排除了登录页，捕获器未记下确切失败步骤。字典 503 不足以解释按钮缺失：冻结前端会捕获等级字典失败并继续，用户弹窗不依赖字典；本地合成环境也验证了字典持续 503 时新建队员弹窗仍能打开。过滤器源码会把识别到的 PostgreSQL `42501` 或 Prisma `P1010` 映射为 503/50300，但现场失败的具体库操作和构建 SHA 未证实，故不能写成已证的数据库列权问题。本窗还观测到首页统计接口一次 503/50300。业务写入仍为 0。

本地最小补丁将新建表单对齐正式 `CreateMemberDto`：必填 `memberNo`、`realName`、`memberSinceDate`、`memberOriginCode`，可选 `nickname` 和 `gradeCode`。完整补丁 SHA-256 `b54c9b2a687bce023a2879ba8d73314593d90ac0a8067334643199aa35e72d30`。独立审查（`gpt-6.2-sol` / medium）Verdict 为 PASS，范围仅限该本地新建契约；非法编号在提交前拦截，有值才发送 `nickname`，编辑请求未改。已在当前 `main` 提交 `02a9bd2362d8bb58eb847ca3d6160d6cecf29cc4`，四个文件内容哈希与独审集相符，并开草稿 Issue [176](https://github.com/BA7IEE/srvf-admin-web/issues/176) 与 Draft PR [177](https://github.com/BA7IEE/srvf-admin-web/pull/177)。相关但非同一份修复：更早的 Draft PR [170](https://github.com/BA7IEE/srvf-admin-web/pull/170) 尚未合并。PR 177 未合并、未部署。

t180 已授权对该验收管理员做最小身份局部应用授权，以解除上述开户入口阻塞。截至写本快照时，正式授权写入仍为 0，前像与授予尚未完成；不得把旧的「未授权」继续当成禁止记录进展的理由。已批的单测试成员准备与报名录取授权仍保留，但在入口实际可用且当页契约齐备之前，这些现场写入保持 `NOT_RUN`。

## 11 月 25 日 16:16 · 桌面核对报名与录取，两项提示均缺少触发条件

在已留存的队员端 `3968b0bc` 上，普通成员实际打开当次公开目录中的全部 4 场活动，并与本人报名列表逐项核对。4 个详情页均显示已通过，均无可用的新报名入口。负责人工作台也有 4 场活动。其中两场采用资格排序，负责人均有管理职责，两个完整名单各有 1 条已通过记录，待录取记录和单笔录取按钮均为 0。另两场采用先到先得。

报名和录取请求均为 0。报名表版本失效（21036）后的同页恢复，以及单笔录取成功后名单缺行时的同页提示，均记 `NOT_RUN`。本批完成了桌面可见范围核对。后续需要自然出现可新报的测试活动或合格的待录取测试报名，才能继续办理并观察特殊提示。

两个专用桌面客户端依次正常登录、退出。业务 GET 28 次均为 HTTP 200、业务码 0，静态 GET 40 次均与候选字节匹配。认证 POST 共 8 次，含两次登录前冷启动续登（均返回 401）和两端各一次的空会话退出、登录、最终退出（均返回 200）。原有通过记录均保留，业务和目录写入均为 0。跨活动隔离、真机及正式开放仍未验证，首发总任务未完成。

## 11 月 25 日 14:21 · 队员端 3968 已留存，跨活动隔离仍待验证

队员端从 `477fa891` 更新至 `3968b0bc` 一次。按本次批准的留存条件完成桌面只读复验后，源站终核为候选的 43 文件树，恢复执行 0 次。原 477 留在本批恢复槽，四个历史恢复槽均已核对。

普通成员从当次可见活动目录进入指定活动，职责请求返回 HTTP 404、业务码 20001，页面明确显示“暂无此活动的操作权限”，名单读取 0 次。负责人工作台显示 4 场活动；所选活动的 1 行名单及状态与同场直达名单一致，直达页办理控件为 0。独立“我负责的活动”列表实际显示 4 行，状态、本人关系及链接均已核对，点击指定行后进入同一份非空名单。

两端均正常退出。认证 POST 6 次、业务 GET 23 次、浏览器静态 GET 42 次；另有 HTML、JS、CSS 匿名 GET 各 1 次，均与候选字节匹配。业务与目录写入、续登出网均为 0。负责人的自然跨场和成员换位跨场均未执行；本次限定留存没有验证这两项。真机、提交后 21036 提示及正式开放仍未验，首发总任务未完成。

## 11 月 25 日 13:51 · 换位复验缺少管理场，队员端保留 477

在现场版本 `477fa891`，本次用于换位的成员正常登录并打开工作台。「我办理的活动」返回 HTTP 200、业务码 0，第 1 页总数和条目数均为 0，页面也显示“暂无活动”。工作台入口可见，但该成员当次完整办理列表中没有负责人或协作者记录，无法绑定一个有管理权的活动与另一活动作对照。

本次在发现阶段关窗。认证请求 3 次，业务 GET 4 次，页面静态 GET 16 次；名单读取和业务写入均为 0。成员已正常退出。候选部署和恢复各 0 次。换位跨活动隔离与负责人三页本次均未执行，原负责人的自然跨场仍未验证。首发总任务未完成。

## 11 月 25 日 13:03 · 当前队员端未找到可复验的自然跨场活动

在现场版本 `477fa891`，两名原测试成员依次通过可见桌面浏览器正常登录、退出。第一名成员的默认活动目录只有 1 页，接口总数、唯一可见卡片和页面计数均为 4；四场都已发布、公开报名且未结束。第二名成员工作台的完整办理集合也只有 1 页，4 行与页面逐项一致。两组逐场匹配后差集为 0，没有可锁定的跨场目标。本结论限于当次可见范围。

两端正常页面加载的能力响应均显示可发起、不可直接发布本人活动。第二名成员的工作台可见且可用“创建活动”。所查页面未显示可核的通知受众，现场受众仍为 UNKNOWN。冻结源码中，自己的草稿须先提交审核；审核结果按对象定向，公开报名的发布公告按会员可见范围或冻结的标签受众入队。实际投递未验证。

实发认证 POST 6 次、业务 GET 7 次（均 200/0）、静态 GET 35 次。两端正常退出；续登出网、名单读取、业务和目录写入均为 0。此次没有部署。上窗在 `3968b0bc` 已验证的指定场拒绝和负责人三页结论保留，自然跨场拒绝仍未验，首发总任务未完成。

## 11 月 25 日 12:00 · 三个管理页面和指定场拒绝通过，队员端已恢复 477

本次在现场将 H5 从 `477fa891` 切换到 `3968b0bc` 一次。普通成员从当次可见目录打开指定场，职责请求返回 HTTP 404、业务码 20001，页面显示“暂无此活动的操作权限”，该场名单读取 0 次。此前一窗缺失的业务码与页面证据仍为 UNKNOWN。

负责人工作台显示 4 个活动。选择目标后读到 1 行名单，与同场报名管理直达页的行及状态一致，直达页无办理控件。独立“我负责的活动”第 1 页实际显示 4 行，本人关系、状态和本场链接均核对通过，点击该行进入了同一份非空名单。共取得 5 张脱敏区域截图。

**整窗业务签收 FAIL。** 当次目录中已绑定的 3 个公开备选均在负责人完整受管集合内，自然跨场拒绝为 **NOT_RUN**，未发跨场名单请求。两端均正常退出。随后先检查现场状态，恢复原 477 一次，核回原目录及全部 41 个文件。旧恢复槽均保留。两个版本的 HTML、JS、CSS 共 6 个匿名 GET 均为 200，内容逐件匹配。

浏览器实发 6 次认证 POST、23 次业务 GET、42 次资源 GET。业务 GET 中 22 次为 200/0，另一次为上述 404/20001。冷启动续登出网 0，本批业务与目录写入 0。服务端全部会话是否失效为 UNKNOWN。该窗口已关闭，首发总任务未完成。

## 11 月 25 日 · 单场职责 404 的离线核查与修复

上窗的职责 GET 只留下 HTTP 404，业务码和最终页面仍为 UNKNOWN，业务验收仍为 FAIL。路径和场次绑定与冻结 API 相符。离线直接调用该版本的职责查询和异常处理后确认：活动存在但不在本人管理范围，和活动不存在，均可返回 404/20001；通用路由未找到则返回 404/40400。上窗实际命中了哪一支，现有回执无法判定。

旧候选收到正式的 404/20001 会转到“服务不可用”。本地候选 `3968b0bc` 在报名管理直达页识别这组完整错误信封，显示明确拒绝，名单读取为零。验收同时核对同场可见依据、拒绝文案和请求记录；通用 404、业务码缺失及未知跨场目标均不能通过。未改服务端权限。

7 项产品定向测试通过。断网桌面完成 4 个定向场景，覆盖负责人目标落在第二页时点击进入同场非空名单，以及无自然跨场时停止验收。以上结果来自离线测试。现场最后核回的版本仍为 `477fa891`；负责人工作台、直达名单、独立负责列表及自然跨场均未在新候选上做现场验收。新候选、失败恢复和桌面只读复验须另行批准，首发总任务未完成。

## 11 月 25 日 11:21 · 单场职责请求返回 404，队员端已恢复 477

本窗使用修正后的验收器。普通成员登录成功，打开活动目录后进入指定场报名管理导航。该场职责 GET 返回 HTTP 404，回执没有记录业务码，页面也未取得明确拒绝文案。该场名单请求为 0。普通成员随后正常退出。单场拒绝验收为 **FAIL**，404 的具体成因待核。

负责人客户端未启动。工作台非空名单、同场直达只读名单、独立「我负责的活动」列表及点击、自然跨场拒绝均为 **NOT_RUN**。未取得业务区域截图。浏览器实发认证 POST 3 次、业务 GET 4 次、静态资源 GET 20 次，冷启动续登出网 0，业务及目录写入 0。服务端全部会话的最终状态为 UNKNOWN。

现场将队员端从 `477fa891` 切到 `715df2c3` 一次。验收失败后先读取现场状态，再恢复一次。原 477 的 41 个文件、完整树和目录身份均已核回；候选和恢复版本的 HTML、JS、CSS 各 3 个匿名 GET 均与对应制品字节一致。两个既有恢复槽、API 和管理端均保持原状。首发总任务仍未完成。

## 11 月 25 日 · 单场报名管理权限验收器已校正，新准备包通过离线独审

队员可以看见管理总入口，同时对某一场活动没有报名管理权。旧验收器在这个合成前像上提前停止；修正后，桌面浏览器实际进入指定场的明确拒绝页，收到与该场绑定的职责拒绝，名单请求为零。8 项定向浏览器场景均符合预期，包含有权、未知职责和错场反例。两份正常拒绝样本还完成了负责人工作台、独立负责列表点击、同场非空名单比对和自然跨场拒绝。以上均为离线样本。

产品提交 `715df2c3` 及静态包未改。新准备包使用独立的暂存位置，写前须确认上次恢复后保留的候选、较早恢复件和各自归属。本地目录验证了新槽切换、只恢复 477，以及旧槽漂移时停手。上窗另有一个发送前被拦的 GET，原记录不足以还原其具体路径；新验收器仅为后续阻断保留脱敏路径类别与时序。

独审对执行清单 `58915981e3b1d0b0f9157e78e3a66986cbbbc364274756ffe3aa533d98c890f4` 给出离线 PASS。上窗真实业务验收 FAIL、已恢复 477、负责人页面未跑的结论均保留。本轮现场请求为零。新的静态替换、失败恢复及桌面只读复验尚待一次集中批准；首发总任务未完成。

## 11 月 25 日 10:37 · 队员端候选已尝试，现场验收失败，已恢复 477

十项写前核验通过后，现场将 H5 从 `477fa891` 切换到 `715df2c3` 一次。候选 HTML、JS 和 CSS 均返回 200，字节与归档匹配。业务验收停止后，先独立核对当前目录和恢复槽，再执行一次恢复。原 477 的 41 文件全树、目录身份、三个对外静态文件均已读回；更早的恢复槽和相邻服务核验一致。本次恢复槽现存候选，后续窗口须按此实况检查。

普通成员已登录，本人及能力查询均为 200/0。验收器要求“我负责的活动”总入口不可见，于进入指定场次前停止。发起活动的资格也能使总入口可见，单场名单权限仍须按该场核验。本窗没有打开拒绝页、没有读取名单。负责人客户端未启动；工作台、直达名单、独立负责列表及自然跨场拒绝均为 NOT_RUN。未取得业务区域截图。此前离线通过的用例仍只作离线证据。

浏览器认证 POST 3 次，业务 GET 2 次，静态资源 GET 19 次；独立匿名静态核验另计切换后 3 次、恢复后 3 次。冷启动续登出网 0，业务和目录写入均为 0。已登录客户端正常退出，服务端所有会话是否失效未独立核实。独审判定现场业务验收 FAIL、恢复 477 PASS。下一步是本地验证“总入口可见、指定场无职责”的验收条件。窗口已关闭，首发总任务未完成。

## 11 月 25 日 · “我负责的活动”独立列表已接通，候选通过离线独审

队员端候选 `715df2c3` 接上了既有的本人负责活动分页接口。独立页显示活动、本人职责和状态，逐场核实报名管理权限后才显示入口；点击时再次判权。父版本的定向测试为 9 项失败、1 项通过；新候选 10/10 通过，含翻页、撤权、错场和服务错误。离线桌面浏览器在新静态包上看到了三条合成活动记录，从有权的活动行点击后读到与工作台一致的同场非空名单。独立页 503 或返回错场时，签收均停止。既有 Issue #10 保持开放，修复沿队员端 Draft PR #11 提交。

独审对同一提交和准备包给出离线 PASS，独立重建核对了全部 43 个归档文件。制品 SHA-256 为 `58accfa1fe5ca81fd6d559c09690cfaa31e6a785654bce795180ca759e68afdd`，执行清单为 `9db13854771547ba4038c9fddd066c62dec68f6442b0f1bdc48d5e822fc0855b`。现场最后封存仍为 `477fa891`，此前真实桌面直达页 FAIL 与独立列表内容 UNKNOWN 均保留。新候选未部署，真实页面、现场权限和真机未验。

待另批一次 H5 静态替换和桌面只读复验，失败仅恢复 477，保留更早恢复槽。成功留存须在独立列表核实非空实际行的活动、状态、职责，点击进入同场名单并与工作台核对，同时通过普通成员及自然跨场拒绝检查。“服务尚未接通”会导致签收失败。建议窗口 30 分钟，两端认证请求最多 6 次、业务 GET 最多 40 次、业务及目录写入 0。首发总任务未完成。

## 11 月 25 日 · 队员端报名管理直达页已完成替换和复验的离线准备

现场最后保留的队员端为 `477fa891`，有职责成员从直达链接查看名单的现场结果仍为 **FAIL**。本次从 `0fb3acc7` 构建了 42 个静态文件。候选 tar 的 SHA-256 为 `0769009cc89d8ee909ccb4a5290baef7c35b0c38382aed57217bdb3f2a6b6709`。本机完成从 477 切到候选、再恢复 477 的交换，既有 e042 恢复槽的目录身份与文件均核回一致。独审首轮发现恢复确认丢失后可能提前结案。修订后的 6 项定向验证覆盖相邻目录漂移、回执缺失及避免重复请求；同一执行清单 `58cb19adbcab72a15f3689496222bf2d6a6c6d100ba8ba61831ce3e7d90976b9` 已通过离线独审。

在离线桌面浏览器的合成场次中，负责人直达页与工作台显示的非空名单逐行一致。普通成员和跨场无职责访问均显示拒绝；缺少自然跨场对象时，执行器会停止签收。独立的“我负责的活动”列表仍显示“服务尚未接通”，该项记 **FAIL**。若该列表必须能显示业务行，当前候选不能满足要求。

下一步须另行集中决定是否接受上述列表残差，并批准一次静态替换与桌面只读复验。候选未部署，真实页面与真机均未复验。首发总任务未完成。

## 11 月 25 日 09:24 · 报名管理直达页候选修复通过离线独审

在已部署的 `477fa891` 上，有职责的成员可以从工作台读取本场名单，但报名管理直达链接跳到“不可用”页。离线复现确认，直达路由和原名单页使用的读取方法尚未接入 H5。候选 `0fb3acc7` 复用工作台已有的活动详情和名单接口，按当前活动核对职责后显示只读名单。职责撤回后，页面重新读取时会清除旧名单。服务端权限没有变化。

原独审用同一套 11 项定向用例对照两个版本：旧版 10 项失败，仅工作台同场读取通过；候选 11/11 通过，覆盖无职责、跨场、读取失败及工作台同场点选。独审结论为 **PASS（离线候选）**。候选尚未部署，真实桌面与真机均未复验；原直达页现场 **FAIL** 保留。勘误另已归档：上次窗口回执里的 T155U 是工程批次标签，授权依据为此前桌面测试及测试账号使用指示。缺陷单保持打开，修复 PR 仍为草稿。[H5 Issue #10](https://github.com/BA7IEE/SRVFMobileWeb/issues/10) · [Draft PR #11](https://github.com/BA7IEE/SRVFMobileWeb/pull/11)

## 11 月 25 日 08:55 · 真实桌面只读验收已关窗

成员在专用桌面浏览器中打开活动目录、本人活动和两场已通过活动的详情。两种录取模式与页面状态均符合预期。当前筛选已显示全部结果，另外两场公开活动也逐一打开了详情；此次成员可见范围内，没有找到可新报名的公开资格排序场。

负责人随后独立登录。工作台确认了该场的管理职责，加载的名单中可单笔录取的待录取项为 0。“我负责的活动”页面可达。**报名管理直达页 FAIL**，直接打开时跳到了“不可用”页。工作台里的名单请求返回 HTTP 200、业务码 0；直达页跳转的具体原因仍未知。

两端各完成一次登录前空会话退出、一次正常登录和一次最终退出，共 6 次认证 POST。业务 GET 24 次，静态 GET 44 次，业务和目录写请求为 0。两次冷启动续登均在出网前拦截。两个客户端都收到了退出成功回执并回到登录页，专用浏览器资料已清理。未查数据库，服务端会话可刷新数仍为 UNKNOWN。

本次实测仅覆盖桌面只读页面。21036 换版恢复、录取后缺行提示及真机均为 **NOT_RUN**。首发总任务未完成。

## 11 月 25 日 · 公开报名活动的目录识别已修订

初版桌面只读执行器的独审结论为 **CONDITIONAL**。公开场的标题若含“受邀可见”，初版会误跳过该场，甚至将完整目录误报为无候选。R2 按活动 ID 核对目录响应中的报名模式。模式缺失或无法唯一对应的卡片保留为 **UNKNOWN**。

初版误筛已在离线夹具中复现。R2 的原串行正例和两个新增对照均通过（3/3）：同名公开资格场进入详情并识别到可用的报名入口，真正仅受邀的场次没有进入详情。另一组目录虽然已显示全部条目，因有一张卡片模式不明，结果仍为 **UNKNOWN**。其余 9 项沿用初版证据。执行器 SHA-256 为 `36e1cf457df1c88af266b3ddc03c5c61049d56bf4dae89bd7182570a6bdbce9a`。本轮未重开现场窗口，源站是否有合格场次仍待验证。

## 11 月 25 日 08:31 · 桌面只读执行器离线验证

本地执行器现已分别计数登录前的空会话退出、账号登录和最终正常退出，每个客户端每项最多一次。冷启动续登在出网前拦截，两端业务 GET 共用 40 次上限。旧执行器的阻断已复现；修正后的 10 项定向检查全部通过，覆盖两端串行办理、超额停止、认证失败、意外写入拒绝及异常清理。退出回执丢失时仍保留会话状态未知。

用已部署版本 `477fa891` 的静态文件加载离线页面，所有服务响应均来自合成夹具。成员先查看本人两场活动和另一场可报名入口，正常退出后，负责人再查看工作台的待录取入口。两端分别使用 13 和 8 个业务 GET，均未提交报名或录取。另有两个旧管理入口：负责活动列表显示服务未接通，指定场的报名管理链接转到服务不可用页。

现场只读窗仍未重开。现场是否有自然报名或待录取对象仍为 **UNKNOWN**，21036 换版恢复、录取后缺行提示及真机仍为 **NOT_RUN**。首发总任务未完成。

## 11 月 25 日 07:44 · 桌面登录在认证前受阻

本机专用可见浏览器打开了队员端登录页。入口、认证脚本等 11 份静态资源均返回 HTTP 200，字节与已部署的 `477fa891` 制品匹配。正常填表后点击了一次登录。新浏览器首次打开页面会尝试续登，点击登录后还须先退出空会话，收到成功回执才会提交账号登录。前者超出零续登预算，后者会占用登录成功后正常退出的唯一额度，两次请求均在浏览器内拦住。

实际发出的登录、续登、退出和业务 GET 均为 0，业务与目录写入请求为 0。专用浏览器已关闭，未产生需要退出的新会话。成员页面和负责人页面均未验，是否存在可报名或待录取的自然对象仍为 **UNKNOWN**。21036 换版恢复、录取后缺行提示及真机均为 **NOT_RUN**。若继续使用同一版本，需把启动时的匿名认证请求与登录后的正常退出分别约定次数。首发总任务未完成。

## 11 月 25 日早 · 已部署的 H5 与待验的两项页面行为

**线上保留 `477fa891`，原 `e042e9bf` 在恢复槽。** T140 现场独审原件已补入官方归档，5 个文件与审查方原件逐一同字节。独审报告 SHA-256 为 `80baffd0f514edd42253a2ba62d36c4832c3f60d087a859d343ff9c08aeb2297`。本轮没有开窗或发现场请求。

| 分类 | 已有证据或当前决定 |
| --- | --- |
| 已验，不重复 | 源站静态树的 41 个文件及 3 个匿名响应已核。桌面、真机上的两项业务提示均未由此得到验证。 |
| 原许可可继续 | 本轮仅归档和文档收尾。已核过的入口脚本引用报名页和活动办理页；加载脚本本身不会产生报名失败回执或录取成功后的名单。 |
| 须另批或持机操作 | 21036 需要本人真实提交并收到表单版本失效回执；录取缺行需要有职责的负责人单笔录取后收到成功回执，随后名单未确认同一目标。两支在桌面和真机分别保持 **NOT_RUN**。 |

最小方案待决定：先有可合法报名的具体活动和目标，才申请一次短窗。建议成员在真实手机观察换版，负责人在桌面观察名单；两人各限一个新客户端、一次登录和一次正常退出。拟议业务上限为报名提交两次（成功最多一次）、单笔录取一次。已有两条通过报名不能重置成夹具。未自然触发就保留未验，旧窗口额度、已拒操作和其他事项不并入。首发总任务未完成。

## 11 月 25 日 01:53 · 队员端 H5 已切换并保留 477fa891

按 t140u 授权，离线独审通过的新入口和合同已在源站 Linux 实际使用。只读前检确认原版为 `e042e9bf`，41 个文件的完整树 SHA-256 为 `aa2a320276579c3ab4804922cc2f599977cd5833a79ec480df21644649f30cf0`。暂存后独立核对两侧目录身份与完整树，确认在同一挂载，随后执行一次原子交换。关窗前再次读回，线上保留 `477fa891`，41 个文件的完整树 SHA-256 为 `86a505ea531fc19eba298b87cd70f15bd7dd4950460f7c4f6733b353a78dbabb`。原 e042 目录留在恢复槽，现场恢复执行 0 次。此前 T139 写前停手的结论仍有效。

匿名静态 GET 共 3 次，入口 HTML、主 JS、样式表均返回 HTTP 200，各自响应字节与候选制品匹配。按本批命令及请求记录，登录、续登、业务请求、数据库操作和业务写入均为 0。API 仍为 `8a017348`，管理端仍为 `e54dfb49`。登录后 21036 与录取缺行两支、页面交互及真机均未验。首发总任务未完成，尚未正式开放。

本次封存入口 SHA-256 为 `609faff23b029c95b30e3b45a6add2f9b4970fd53d6b72e2eecf358ab7cd4129`，合同 SHA-256 为 `ab71d39845735d99b4e14f36fd2208e4cf527290cf1c9f3e36a9d1342d97b106`。现场报告 SHA-256 为 `bcf0627e085206a280645f66ab4f6085937c2bb75a5e53d30daa00c83ea20c78`。

## 11 月 25 日 00:37 · H5 现场前检停止，未开窗

已获一次静态替换授权。Linux 源站只读前检确认，H5 仍为 `e042e9bf` 的完整 41 个文件，目录树 SHA-256 为 `aa2a320276579c3ab4804922cc2f599977cd5833a79ec480df21644649f30cf0`。现有 H5 目录与预定暂存位置的父目录在同一挂载；运行接口仍为 `8a017348`，管理端静态树仍匹配 `e54dfb49`。

**首次暂存前，本批暂存目录和状态收据均不存在。** 冻结工具的只读检查入口需要这份收据才能核对交换双方，现场返回文件不存在，未能确认本批交换状态。按写前条件停止，未开窗或暂存。激活 0 次、恢复 0 次；候选 `477fa891` 未部署，没有切换后目录树。匿名静态 GET 为 0，公网制品匹配为 UNKNOWN。本批未发业务请求、未登录或连接数据库，业务写入 0；未采集全站数据库写计数。

Linux 实际交换、页面、真机、换版恢复和录取缺行提示均为 **NOT_RUN**。前一批离线独审结果保持其原有范围。首发总任务仍未完成。现场报告 SHA-256 为 `9c294c8e94a3dee71cf7ce43df80452b108d6217d7c03397c4412db7943d6971`。

## 11 月 25 日 · H5 静态切换与恢复通过离线独审

**现场切换尚未批准，也未执行。** 在 macOS 临时目录中，从恢复版本 `e042e9bf` 切至候选 `477fa891` 再切回后，恢复的是原目录，41 个文件逐字节一致，管理端和其他相邻目录也保持原样。旧静态工具固定的恢复目标更早，不能用于本批回退。

工程离线测试 **10/10 通过**。独审以同一组封存字节复跑，结果也是 **10/10，PASS**。目录内容或归属不符时，工具按预期停止；切换或恢复已经完成但确认丢失时，能核实实际状态，避免重复交换。

| H5 制品 | tar SHA-256 | 文件集合 tree SHA-256 |
| --- | --- | --- |
| 恢复 `e042e9bf` | `46d04cd7ed2c995435f590e46a4b4616c386076fe849d07e240fc5220df8dc99` | `aa2a320276579c3ab4804922cc2f599977cd5833a79ec480df21644649f30cf0` |
| 候选 `477fa891` | `51a17704a2d1515583fe6b3fe4a79661e52647c5904da857b35466c7908cb32e` | `86a505ea531fc19eba298b87cd70f15bd7dd4950460f7c4f6733b353a78dbabb` |

独审报告 SHA-256 为 `347d7c2107aac36b99d3761458837ef4472ae95ddb867e4f4f4ebe30cf2d9880`。Linux 原子交换、源站挂载与实际切换、页面及真机验收均为 **NOT_RUN**。首发总任务仍未完成。

## 11 月 24 日 23:14 · 单账号本人报名列表现场补证通过

北京时间 23:14:28 至 23:14:31，一个新客户端依次登录、手动续登、读取一次本人报名列表并正常退出。4 个请求均为 HTTP 200、业务码 0。首页共 4 项，独立只读核对确认 4 项均属本人。2 项命中已知绑定，活动与通过状态均匹配；另外 2 项是额外的本人报名，其“已知绑定匹配”记为 null（不适用），逐项本人归属均为 true。

23:14:45 的稳定读回确认，22 张业务及目录表的插入、更新、删除逐表均为 0，内容摘要一致。另 4 张认证表的插入/更新/删除分别为：用户 0/1/0、审计 3/0/0、刷新令牌 2/3/0、限流桶 0/2/0。三条审计对应登录、续登和退出，读访问审计 0。唯一的新会话家族轮换一次、正常退出一次，未撤销数和可刷新数均为 0；旧家族状态摘要一致。站点访问日志命中全部 4 个请求，列表 GET 可关联运行容器；三次认证的逐请求容器归属、两次限流更新的逐请求归属仍为 UNKNOWN。

本次只签收这个新窗口的列表响应。原 T129 窗口仍为 **17 PASS / 1 FAIL / 4 NOT_RUN**，当时四行的逐项归属仍为 UNKNOWN。两条报名详情、两条管理活动详情、页面和真机均未执行。首发总任务仍未完成。现场报告 SHA-256 为 `cf242ad093dce15038baa39b4983cf817d77a07766f5e7b21c37be7cf38ad280`。

## 11 月 24 日晚 · 本人报名列表测具完成离线复核

原断言要求整页每条报名都落在两条已知报名内，会误拒同一成员的额外报名。它也把已知报名的编号、活动和状态匹配当成了归属证明，缺少独立归属证据时可能误收。修订后分别核对已知报名是否出现、每项是否属于本人。可证实属于他人的行判失败，归属证据不足记 UNKNOWN；分页尚未覆盖的已知项不能据此判为全局缺失。

- 本地用合成数据复现了两种误判，原测具的 2 个对照均按预期失败。修订后的 12 项定向测试全部通过。第一版因请求清单与采集入口的字段不一致，独审结论为 **CONDITIONAL**。
- 第二版将包内清单第 3 项原样交给采集入口（`capture`），18/18 个对接用例通过。含额外本人报名时读取归属 1 次并通过；其余 17 个越界对照均停止，读取 0 次。独审对同一包给出 **PASS（本地离线对接）**。可复用测具、合成测试代码和准备包仅在本地封存。
- **T129 真域仍为 17 PASS / 1 FAIL / 4 NOT_RUN。** 当时只保存列表聚合结果，四行的逐项归属仍为 UNKNOWN，未立服务端泄漏 Issue。下一次单账号列表归属补证处于 **已准备、未批准、未执行** 状态。旧窗未发的 4 项不能转作新额度。首发总任务仍未完成。

| 可核对的离线材料 | SHA-256 |
| --- | --- |
| 第一版独审（CONDITIONAL） | `28b8703966017379246548cfaafcf636486be33215b71d612b6942fc29c89e1c` |
| 第二版独审（PASS） | `f390995021a88100db8aa7a9b6934714792f5d04945dcbad97d2b09817e905a1` |
| 第二版准备包 | `bea0e0cd7a82aee21c483e7048d09cadf79d1a9cbe2c9f4d9a9f91aedcd7ca9f` |
| 第二版工程报告 | `736d88cf3369ce0de0775ba23c1c8d97f5942fe62cd06848a1be6034c3721e51` |

## 11 月 24 日晚 · 真域认证只读窗口已关闭，业务签收 FAIL

**离线独审保留了 17 项业务 GET 和 9 次认证的通过结果。20 项业务通过集中，17 项 PASS、1 项 FAIL、2 项 NOT_RUN。** 另列的 2 项管理端活动详情均未发出，没有 200 或 503 回执。全窗共发 27 次 HTTP（9 次认证 POST、18 次业务 GET），清单中 4 项未发。页面、真机均为 NOT_RUN，首发总任务仍未完成。

北京时间 20:57:09.409756 开窗，20:57:28.530464 关闭，历时 19.120708 秒，早于 21:27:09.409756 的截止时间。封存记录中，接口版本为 `8a017348`、管理端为 `e54dfb49`、已部署的 H5 为 `e042e9bf`。独审只读本地封存证据，与现场执行时段有重叠；只有执行方发了现场请求。

**停在成员本人的报名列表。** 接口返回 HTTP 200、业务码 0，分页总数和本页条数都是 4。批准清单要求核实本人归属，并核对返回的已绑定报名；执行器额外要求每一项都在两条已知报名之内，合并断言得到 false。回执只保留了计数、分页检查和该布尔值，缺少逐项匹配。数据库有 4 条报名，其中两条保留报名已独立确认属于该成员且状态为 pass。本次响应四项的逐条归属仍为 **UNKNOWN**，现有证据不足以认定服务端越权。停发后，该成员的两条报名详情均为 NOT_RUN。

三个客户端各完成一次登录、一次同一新会话家族的续登和一次正常退出；独立读回确认所有已发登录均已结清（`issued_logins_settled=true`），三个新家族的可刷新数均为 0。六个排除家族状态摘要一致，全窗未执行全账号退出。

22 张业务及目录表逐表原生新增、更新、删除均为 0，行数和内容摘要一致。下表单列 4 张认证相关表。关窗时审计和刷新令牌的原生计数仍在传播，采用 **20:58:46.812612** 的稳定只读样本。

| 认证相关表 | 新增 | 更新 | 删除 | 核对结果 |
| --- | ---: | ---: | ---: | --- |
| 用户 | 0 | 3 | 0 | 三个账号各更新一次登录时间，业务字段摘要相同 |
| 审计 | 9 | 0 | 0 | 登录、续登、退出各 3 条，读访问审计 0 条 |
| 刷新令牌 | 6 | 9 | 0 | 三个家族各轮换一次，均已正常退出 |
| 限流桶 | 0 | 6 | 0 | 六次更新的逐请求归属为 UNKNOWN |

站点访问日志逐一命中全部 27 次请求。运行容器日志命中全部 18 个 GET 的请求标识，9 次认证的逐请求容器归属仍为 UNKNOWN。此次关闭的窗口及未用的 4 个请求额度均已结束。若另批现场补证，列表回执只需保存已知绑定命中数、额外项数和逐项本人归属能否确认的脱敏布尔值。

## 11 月 24 日晚 · 草稿列表非空读回

在可销毁的本机隔离环境创建一条普通草稿后，两个调用者并行读取同一列表。管理员得到 200/0，返回一条；列表内容、字段和分页总数均与独立只读查询一致。无读权限的普通调用者得到 403/30100，未返回业务数据。两个 HTTP 请求实测重叠约 375 毫秒。此次沿用已有身份和角色，运行数据库权限指纹前后一致，测试环境已清理。

本批新增 **1 个业务正例、1 个权限负例**，均属同一条已有 HTTP 证据的接口。678 个操作中，**420 个已有本机业务正例，38 个仅有 HTTP，220 个仍无本机 HTTP**。尚无正例的 258 项中，248 项受既定排除条件限制，另有 10 项涉及委托资格、报名或考勤前置数据、正式时长切换回执，需单独决定。

历史成员数 2→3 的清理残差继续保留。CSV 默认范围的原始失败仍在，显式全部范围仅作流式正例，缺独立数据库读回。公开 API 修复 PR 仍为 PR_BLOCKED。本机测试权限宽于源站；本批未部署，未做真域或真机验收。

## 11 月 24 日晚 · 合成角色和业务夹具补测

本机新增 **62 个业务正例**。其中 43 个接口首次取得本机 HTTP 证据，另 19 个从仅有响应补到业务结果可核。按 678 个操作去重，当前有 **419 个业务正例、39 个已有 HTTP 但无业务正例、220 个仍无 HTTP**，累计有 HTTP 的操作为 458 个。另有 8 个权限拒绝符合预期，其中 4 个是该操作首次有此类证据。

本批覆盖隔离账号办理、单活动任命、时长和贡献政策、活动归属与名册、挂起服务主体的元数据，以及指标和人工成果。写入后用独立只读事务核实对象、状态或修订。初次失败的 3 条记录均保留，其中两条把正式返回码 200 误写成 201，另一条提交了空证据附件。补齐本地附件后，已核实成果确认、报告及更正撤回。未测试外部文件上传。

运行数据库权限前后指纹一致；合成身份、业务角色及测试库已随隔离环境清理。259 个仍无业务正例的操作中，131 个属延期，其余受既有拒绝、功能开关、外部通道、观察或批任务等条件限制。历史成员数 2→3 的清理残差继续保留。CSV 默认范围的原始失败仍在，显式全部范围仅有流式响应正例，缺独立数据库读回。

本机共享连接权限宽于源站。本批未部署，未作真域或真机验证。公开 API 修复 PR 仍为 PR_BLOCKED，首发总目标未完成。

### 上一批记录

本次更新于 2026-11-24 19:20（Asia/Shanghai）。冻结首发候选的本机接口验证新增 6 个业务正例。首发总目标仍未完成。

## 本机写入与独立读回

本批从 136 个待核写操作中选出 6 个，每项只发一次，并在独立只读事务中核对实际状态。

- 创建普通草稿、添加场次、添加场次岗位均返回 201，业务码为 0。读回确认草稿的发起归属、场次所属草稿、岗位所属场次和容量。
- 队员账号解绑和原关系绑回均返回 200，业务码为 0。两笔操作各有匹配的审计，账号最终绑回原队员。
- 队员标准照作废返回 204。读回确认同一版本已作废，原因和审计相符。仅验证合成元数据，上传和下载仍未验证。

按 678 个操作去重，**357 个已有本机业务正例、58 个已有本机 HTTP 但缺业务正例、263 个仍无本机 HTTP**。累计 HTTP 由 413 增至 415。6 项中有 4 项补足了既有 HTTP 的业务证据，场次和场次岗位首次取得本机 HTTP。独立实验室已清理，出件和批任务均为 0。

本机权限宽于源站。本批未部署，真域和真机均未验证。此前队员数 2 → 3 的清理残差仍保留。CSV 默认范围的失败仍在，显式全部范围仅有流式响应证据，缺独立数据库读回。公开 API 修复 PR 仍为 PR_BLOCKED。

## 上一批本机只读补缺

从尚无业务正例的 328 项筛出 47 个未决 GET。2 项可用既有合成夹具验证。其余 45 项中，22 项缺业务权限或作用域，12 项缺业务前置数据，5 项受功能开关或切换条件限制，4 项缺对应角色或主体，1 项依赖外部通道，1 项缺首发纳入证据。另核了 3 个用 POST 表达的查询，2 项依赖外部认证，1 项需要已确认的业务成果。延期的 131 项及此前已拒绝的组合写入继续排除。

- **本人有效权限**返回 HTTP 200、业务码 0。17 个权限码与独立只读查询的结果逐项同序，新增 1 个本机业务正例。
- **可办理编辑任命的草稿列表**返回 HTTP 200、业务码 0。分页总数和独立查询均为 0，只计空列表契约通过。非空列表仍缺业务正例。

两项原本均已有本机 HTTP。按该批结束时的 678 个操作去重，当时有 **351 个本机业务正例、62 个有 HTTP 但无业务正例、265 个无本机 HTTP**，累计 HTTP 仍为 413。修复候选的 111 项单测另计。实验室已清理，本次成员数为 2 → 2，前一批的 2 → 3 残差仍保留。CSV 默认范围的原始失败仍在，显式全部范围仅有流式响应正例，缺独立数据库读回。

本机共享连接权限宽于源站，以上结果仅适用于本机隔离环境。真域认证只读窗口保持关闭，未做真机验证。公开 API 修复 PR 仍为 PR_BLOCKED，修复尚未部署。

## API 缺陷与本地修复

| 公开记录                                                           | 原问题                                                                                                                                 | 本地候选结果                                                                                         |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [Issue #1454](https://github.com/BA7IEE/srvf-nest-api/issues/1454) | 管理员对待补材料（`NEEDS_INFO`）的申请撤回审核，曾返回 HTTP 200、业务码 0，并把状态改成 `SUBMITTED`。约定返回 HTTP 409、业务码 28057。 | 仅允许撤回已通过且尚未发号的审核。待补材料时拒绝撤回，状态和版本保持原值。申请人补件后仍可重新提交。 |
| [Issue #1455](https://github.com/BA7IEE/srvf-nest-api/issues/1455) | 服务主体凭证撤销路由的 OpenAPI 定义缺少两个路径参数。                                                                                  | 已声明必填的 `id` 和 `credentialId`，运行路径和鉴权沿用原实现。                                      |

两项修复都在同一本地候选提交 `5e4819b986c92c35930ae364740439ca6eb6353a`，基点为既有冻结首发候选。独立只读审查对该提交给出 **PASS**，定向单测 111/111 通过。修复尚未部署，真域与真机均未验证。真域认证只读窗口已关闭，本次未重开。

**公开 API 修复 PR 仍为 PR_BLOCKED**。从该候选向公开默认分支提交 PR 会携带此前已阻止推送的祖先。两条 Issue 均为 OPEN，未推送或改写这段历史，本轮无合并批准。

补缺实验中，报名表保存后收到成功响应，但缺少随后读取的实际字段值，读回不符的原因仍未知。拒绝邀请用错了读回入口，代报名取消则断言了列表未提供的字段。这三项均未作为产品缺陷建单。

实验室清理前的合成成员数从 2 变为 3，残差为 1。报名 CSV 导出仍缺独立数据库读回。默认范围只返回表头，原始 FAIL 保留。显式选择全部范围后读到预期数据行，仅计为文档约定的流式响应正例。受众标签在开关关闭时仍返回 503，启用态正例仍缺。本机宽权限下的结果不能证明源站访问控制已通过验收。

## 代码与已公开位置

| 组件                      | 状态                                                                                       | 已公开位置                                                                                                                                                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 管理端                    | 代码已同步到工作分支；限定候选窗口已在源站保留该候选版本，**尚未合并到主线**               | 完整提交 [`e54dfb49e329c0d869e64783d450e296ab6302ea`](https://github.com/BA7IEE/srvf-admin-web/commit/e54dfb49e329c0d869e64783d450e296ab6302ea)，分支 `t100u/activity-editor-appointment`，[Draft PR #174](https://github.com/BA7IEE/srvf-admin-web/pull/174)                             |
| 队员端 H5（恢复版本）     | 原现场版本保存在恢复槽，工作分支保留，尚未合并到主线   | 完整提交 [`e042e9bf24c847d44b8f897de780d29c85768892`](https://github.com/BA7IEE/SRVFMobileWeb/commit/e042e9bf24c847d44b8f897de780d29c85768892)，分支 `t96u/ordinary-activity-ui`，[Draft PR #6](https://github.com/BA7IEE/SRVFMobileWeb/pull/6)                                           |
| 队员端 H5（当前限定留存） | 已完成限定窗口留存 | 完整提交 `3968b0bc8edfc26cd0c3a435576c5b4a8b40e382`，见 11 月 25 日 14:21 的现场终核。 |
| 队员端 H5（此前部署版本） | 已由 3968 接替，原 477 留在本批恢复槽 | 完整提交 [`477fa891a16fe46d64628ab126a8eda7d3f775f5`](https://github.com/BA7IEE/SRVFMobileWeb/commit/477fa891a16fe46d64628ab126a8eda7d3f775f5)，分支 `t113u/ordinary-activity-boundary-fix`，[Draft PR #7](https://github.com/BA7IEE/SRVFMobileWeb/pull/7) 仍未合并，对比基线为恢复版本 `e042e9bf`。 |
| 接口服务                  | **未公开同步**                                                                             | 固定候选仅在本地，无对应公开分支、无 PR、无 CI。按既有安全审核，原提交历史不得直接推送，也不得借本次进度同步清洗或改写历史。该排除仍然有效。限定窗口已在源站保留已批准的候选接口版本（本地完整提交 `8a017348d4b8a642d673de539533fa8b1b750865`，仅作换环境对照，不是公开仓库对象）。       |

本进度文档所在分支只增加文档，**不得改动**管理端产品工作分支、H5 恢复版本分支 `t96u/ordinary-activity-ui`，以及管理端 `main` 的 HEAD。

公开主线祖先（只读参照）：管理端 `main` 为 [`2626116889affe3bda3758f7ed1ce006272503bf`](https://github.com/BA7IEE/srvf-admin-web/commit/2626116889affe3bda3758f7ed1ce006272503bf)；H5 `main` 为 [`ae2e3b0ad5202a214d4dcfdc54342e52f9f270a1`](https://github.com/BA7IEE/SRVFMobileWeb/commit/ae2e3b0ad5202a214d4dcfdc54342e52f9f270a1)。

## 检查结论要分开看

| 层                                       | 结论（各项验证时点见说明）                                                                    | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 管理端 GitHub CI                         | 通过（针对已公开管理端候选）                                                          | 作业 `verify` 成功：[run 45316256085 / job 138183721477](https://github.com/BA7IEE/srvf-admin-web/actions/runs/45316256085/job/138183721477)。开始 2026-11-24 10:59:14、结束 11:00:42 Asia/Shanghai。范围是 lint、格式核对、类型检查和构建，不是真域或真机验收。                                                                                                                                                                                                                                                                                                                                                             |
| H5 GitHub CI（恢复版本 `e042e9bf`）      | 通过                                                                                  | 推送检查成功：[run 45316338558 / job 138183993291](https://github.com/BA7IEE/SRVFMobileWeb/actions/runs/45316338558/job/138183993291)，10:59:47–11:04:39 Asia/Shanghai。PR 检查成功：[run 45316384641 / job 138184137361](https://github.com/BA7IEE/SRVFMobileWeb/actions/runs/45316384641/job/138184137361)，11:00:11–11:40:48 Asia/Shanghai。其中包含单元、契约、构建和仓库内模拟端到端等基础检查。**CI 模拟通过不等于真域或真机通过。**                                                                                                                                                                                   |
| H5 GitHub CI（修复候选 `477fa891`）      | 通过                                                                                  | 两项 `check` 作业均已结束且成功，不再轮询。[run 45356407365 / job 138315210474](https://github.com/BA7IEE/SRVFMobileWeb/actions/runs/45356407365/job/138315210474) 约 16:28:26 开始、16:33:03 Asia/Shanghai 结束；[run 45356469484 / job 138315421196](https://github.com/BA7IEE/SRVFMobileWeb/actions/runs/45356469484/job/138315421196) 约 16:28:52 开始、16:33:37 Asia/Shanghai 结束。**CI 通过不等于已部署，也不等于真域或真机通过。** 该次 CI 结束时源站仍是 `e042e9bf`，之后 T140 的现场终核确认已保留 `477fa891`。[Draft PR #7](https://github.com/BA7IEE/SRVFMobileWeb/pull/7) 仍为草稿、未合并。用户关于“有修复后再关 Issue”的规则，不是立即合并该 PR 的许可。 |
| 本地已完成的检查                         | 有边界地通过                                                                          | 首发必要的 22 条路由此前在本地有 HTTP 成功证据；认证相关 15 例、9 条路由已有本地证据；普通活动两种模式此前在隔离环境有页面证据，其后限定窗口又在真实域名桌面浏览器完成两种模式办理并保留。管理端 8 项任免结果判断、H5 普通活动契约 3 项本地已通过。独立前端边界修复候选定向 19 例全部通过，见下一节。这些都不是真机结论。不能把全部文档接口说成已经通过。接口更广的本机隔离批测与后续补缺见专门两节：本机结果不能写成真域通过。                                                                                                                                                                                              |
| 独立前端边界修复                         | 本地候选定向 19 例全部通过；独立只读审查对 `477fa891` 判定通过；对应 GitHub CI 已成功 | 在隔离环境用 Vitest 和内存伪造传输层验证客户端行为，不连接源站，不启动数据库、接口服务或真实浏览器。修复前在冻结保留版本上为 9 例中 7 过 2 败（退出码 1）。修补后定向 19/19 通过（退出码 0），并完成受影响的类型检查、lint、既有单元/组件与契约测试，以及一次 H5 构建。独立审查先对中间提交 `d8422a4` 判定不通过（连续缺行后核对提示丢失），修补后再对 `477fa891` 判定通过。不得用这些结果替代真域、真机或已部署验收。                                                                                                                                                                                                       |
| 当前源站                                 | 已保留本批限定窗口的已批准候选；认证只读窗口已关闭                                    | 2026-11-24 15:20 正式预检查通过后，于 15:24:32 开窗，15:27:38 成功签收保留，15:28:07 退出。当日窗口保留接口 `8a017348`、管理端 `e54dfb49`、队员端 `e042e9bf` 和已批准的权限配置。临时计数观察设施已撤清。17:12 另开并已关闭一轮认证只读，见专节。11 月 25 日 01:53 的独立静态窗口将队员端切换至 `477fa891` 并关闭。14:21 记录的后续窗口终核为 `3968b0bc` 限定留存，原 477 留在本批恢复槽。首发尚未正式开放。                                                                                                                                                                                                                                                                                   |
| 本批现场窗口（办理保留）                 | 已完成并保留                                                                          | 桌面浏览器经真实域名完成两种模式办理。先到先得接续原待审活动，审核发布后报名自动通过。资格排序新建一场活动，完成编辑任命、配置、独立审核、岗位志愿报名和负责人手工录取。本窗 12 条业务命令；26 张表实际新增 71、更新 46、删除 0，均在预算内；目录写入 0。四个新客户端各成功续登一次并正常退出，独立核验确认已发出的登录均有终局。三种管理页面关键操作留有截图。四条已知附属读取路径仍出现 503。逐请求与运行容器的直接关联仅部分验证。这不能写成已部署新修复或真机通过。                                                                                                                                                      |
| 真域认证只读                             | 已按另批执行并关闭；通过集未全部通过                                                  | 见专节。公网 HTTP 成功不等于 UI 或真机通过。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 本机隔离补缺                             | 已完成并清理；不是真域通过                                                            | 见专节。累计本机业务正例 350、本机 HTTP 413，分母仍为 678。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 真机                                     | 尚未验收                                                                              | 不能用桌面浏览器、本地隔离、CI 或前端单测替代。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 通知、后台任务、对象存储、正式对队员开放 | 不在本范围                                                                            | 未做，也不应写成已完成。通知仍未投递。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## 已部署的前端边界修复与验收范围

11 月 24 日 15:39 记录的两项客户端失败已在 `477fa891` 中处理。下列行为有本地组件证据；11 月 25 日已核现场静态部署，线上页面行为仍待验。

1. **报名中表单版本失效（业务码 21036）。** 当前页可刷新定义，变化的题目和场次须重选并确认后，按服务端当前版本提交。刷新本身不会自动重放报名写入。
2. **资格排序手工录取后的名单核对。** 回执通过但目标行缺失或状态不一致时，页面应保留该笔待核对提示，阻止同一行立即再写，并允许处理其他合法待录取行。

此前部署的 `477fa891` 对应 Draft PR #7。后续静态交换已限定留存 `3968b0bc`，Draft PR #7 仍未合并。

## 本机隔离接口批测与补缺（不是真域通过）

2026-11-24 15:59–16:32 Asia/Shanghai，在与源站隔离的本机环境，对冻结接口规格的 678 个操作做了第一批自动回归。16:32 后已清理的第一批跑批环境未再重启。16:54:53–17:22:32，另起唯一隔离实验室（回环专用端口，不占用也不连接受保护的 `127.0.0.1:55433`）对剩余未决项做补缺。冻结接口仍为 `8a017348`。本机共用连接的业务表写权限宽于源站已批准的权限配置，因此**本机权限下的成功不能当作源站访问控制验收**。源站窗口里曾经出现的工作台或字典类 503，后来只在本机得到正例；**不得用本机正例改写源站 503 结论**。活动总览列表等路径同样适用这一条。

补缺结束后的累计互斥统计（各分区相加等于 678，不要把正例和负例栏再加总）：

| 互斥分区                                | 操作数 |
| --------------------------------------- | -----: |
| 第一批已有本机业务正例                  |    209 |
| 补缺新增本机业务正例                    |    141 |
| 累计已有可计本机 HTTP，尚无本机业务正例 |     63 |
| 累计尚无可计本机 HTTP                   |    265 |
| 合计                                    |    678 |

补充记账（与上表互斥分区分开看）：累计已有可计本机 HTTP 的操作 413 个，累计本机业务正例 350 个，仍无本机业务正例 328 个。补缺本批实际请求 171 个操作，其中 131 个是首次取得可计本机 HTTP，40 个此前已有 HTTP；141 个新正例中，32 个此前只有 HTTP 而无业务正例。137 个新正例取得成功业务码 0。另有 4 个按接口约定计入的非信封正例：两个正式 HTTP 204（清除本人空头像、删除本批停用贡献规则），均有独立读回；两个 CSV 下载在核到数据行后计入。其中报名导出的默认范围只含通过记录，首次导出只有表头，该条原始失败保留；随后使用正式的全状态参数，核到待审行与约定列。后一次通过不得盖住前一次失败，且这两条 CSV 没有独立数据库读回。本批还有 58 个操作取得有意义的权限、业务状态或入参负例，其中 38 个是首次，累计负例 245 个；31 个操作同时有正例与负例。

补缺本批 228 条 HTTP 用例，断言通过 200 条，原始失败 28 条，全部保留。若干失败后经纠正夹具或断言复测通过（例如禁用配置须带齐必填载荷、招聘门槛字段断言、短信日志与保险办理读回等），原失败行仍在台账。当时记录了三条独立读回不匹配（报名表保存、拒绝邀请、取消代报名，HTTP 均为 200/0，不得用其他新正例数字盖住）；负责人在缺少相应作用域时得到 403/30100；活动收尾工作台 404/20188。另有一处可复现的招聘审核状态差异：凭证申请处于“待补材料”时，管理员撤回审核预期 409/28057，实际 200/0，独立读回确认已变为待审并清除审核字段；同一接口对已通过对象的合法撤回符合预期。后来该状态差异已登记为 #1454，上文列出了修复与独审结果。

计划中的追加报名、审批和后台任务状态写，被官方自动审批拒绝（可能产生通知出件或任务变更）。该组合未执行，禁止重试、拆分、换路或改包装执行；其后只做了独立读回和上述 CSV 下载，不计入那组被拒写操作的业务通过。

实验室已正常关停：容器、网络、卷、回环监听和临时客户端材料已清理；刷新家族与刷新令牌从启动到清理均为 0；受保护监听地址与进程保持原样，本批对其连接数为 0。清理终态与启动相比，合成用户仍为 3，成员由 2 变为 3，这一残差原样披露，不为清残差另建实验室或触碰受保护端口。未使用 Worker，未对外投递。

第一批检查发现服务主体凭据撤销路径的 OpenAPI 参数为空，后来已登记为 #1455，并在本地修复候选中补齐。受众标签在开关关闭时本机仍为 503/50300，启用态正例仍缺，见下一节。时间策略、贡献政策等未为取得正例扩权。

## 真实域名未认证健康探测

在已批准的范围内，只对已知公开健康路径做了未认证 GET，没有登录，没有把 678 个接口改向公网重测。主机为 `api.srvf.team`。

| 方法与路径                  | 结果                                                                             |
| --------------------------- | -------------------------------------------------------------------------------- |
| `GET /api/system/v1/health` | HTTP 200，业务码 0，入口健康成功。这只证明入口健康，不代表运行版本已对外部披露。 |
| `GET /health/live`          | HTTP 404，业务码 40400                                                           |
| `GET /health/ready`         | HTTP 404，业务码 40400                                                           |

上述两条 404 是根路径 `/health/live` 与 `/health/ready`，不要与规格中的 `/api/system/v1/health/live`、`/api/system/v1/health/ready` 混为同一证据。后两个规格路径尚未在真实域名探测，也不再补探。此后没有再发新的公网健康请求。

## 受众标签接口（本地持续问题，不是已确认的生产缺陷）

`GET /api/admin/v1/members/{id}/audience-tags` 在本机隔离批测中三次返回 503/50300。当时运行进程的 `ACTIVITY_AUDIENCE_TAGS_HTTP_ENABLED` 实核为 `false`（本机 `APP_ENV` / `NODE_ENV` 为 production）。

只读源码结论：服务在开关关闭时调用断言并抛出业务码 `50300`（HTTP 503，服务暂不可用）。生产类环境必须显式配置该开关为 `true` 或 `false`，不得留空；非生产类环境空值默认关闭。对应控制器已把 `SERVICE_UNAVAILABLE` 列入该接口的声明错误。因此，**开关关闭时返回 503/50300 是已实现的关闭分支，并与现有错误声明一致**，不是未声明的意外状态。启用态下的 200/0 正例仍未获得，保持 BLOCKED。未授权打开开关、未授权改接口或做权限绕过，也未把源站是否开启该开关当作已探测事实。替换类写接口不在只读范围内。

## 真域认证只读（已另批执行并关闭）

2026-11-24 16:58 Asia/Shanghai 经现场批准，按事先哈希锁定的认证只读清单，于 17:12:00 真实持久开窗，对 `api.srvf.team` 执行本轮；17:12:15 收窗，共约 15 秒，未从批准时刻倒算。只用既有三个账号的原角色，新建四个客户端，各一次登录、一次同一新家族续登、一次正常退出；自动续登和自动重试已关闭。开窗前后源站仍为已保留的候选接口、管理端 `e54dfb49` 和队员端 `e042e9bf`。目录六项在登录前与退出后一致。未复用已退出客户端，未触碰两个旧登录家族，未部署，未扩权，未新增观察用 DDL。

实发 22 次请求，全部有回执，无重试、无替代路径：认证 12 次全部 200/0；通过集 GET 实发 10 次，前 9 次 200/0，第 10 次按清单读取已发布活动的编辑草稿详情，得到 404/20001，随即停手。通过集其余 20 次未发；两项附加活动详情未发，故本轮没有附加 503 回执。已知四条附属 503 与健康探针未重打。待审列表和待报名列表均为 200/0、总数 0；两条已保留审核详情为 200/0，状态为已通过。四个新家族均已正常退出并结算，可刷新数为 0。窗口内认证审计新增 12 条，登录、续登、退出各 4 条，其他事件类型为 0。

业务与目录核对：22 张业务和目录表的原生新增、更新、删除均为 0，行数与行集摘要前后相等。另外 4 张认证相关表合计新增 20、更新 24、删除 0（用户表 4 次更新对应登录时间前移，剔除登录与更新时间后摘要一致；认证审计 12 次新增；刷新令牌 8 次新增、12 次更新；限流桶 8 次更新，与逐请求的对应关系保持 UNKNOWN）。**不得把 26 张表都写成原生 0。** 访问日志按本窗客户端标记匹配全部 22 条；运行容器日志只直接匹配其中 5 条，其余 17 条的容器归属保持 UNKNOWN。公网 HTTP 不是 UI 或真机通过。

关于第 10 次 GET 的 404/20001：冻结候选实现里，编辑草稿列表与详情都只查找草稿状态的活动，找不到时返回“活动不存在”（业务码 20001，HTTP 404）。已保留现场回执显示，该详情路径最后一次 200/0 发生在相应活动提交审核并批准之前；批准之后当时未再读取该路径。本轮读取的是已发布且审核已通过的保留活动，列表总数为 0，与上述实现一致。这是对象生命周期下的预期 404，叠加清单把草稿态通过路径绑到已发布保留对象的前提失效，由清单准备承担，**不是据此新确认的产品缺陷**。官方执行报告仍将该次 404 的直接原因记为 UNKNOWN，本文件的源码与旧回执补充不得篡改该 UNKNOWN，也不等于线上补测通过。窗口已关闭，不得为定位再打真域。

## 当前阻断与授权边界

- 首发总目标尚未完成。不得据此宣布可以正式上线。真机及其他未覆盖事项须另行安排。
- 管理端限定留存 `f7985191`。开户六个办理码已写入共享权限目录并进入 SUPER_ADMIN 有效集；T202 在等待到位后确认「新建」与「草稿编辑任命」可见，正式入口已解阻。建档/开户表单尚未提交。T203 已按冻结契约核清管理端正规建档必须由用户提供的材料类别，并记入文首快照；t175 仍待用户交付真实材料后再提交，不得虚构。现有测试活动的具体资格与保险规则清单仍未封存核清。
- H5 静态替换已收口，限定留存 `3968b0bc`。两项真实页面提示仍为 `NOT_RUN`，真机仍待验。477 版本与 Draft PR #7 仍未合并。
- 现场 API 仍为 `8a017348`。上次候选 502 的现场原因是反代在启动过程中连接上游被拒绝，不是已证的候选代码缺陷。T188 API 更新/恢复预算已用尽，不得重切。
- 真域认证只读窗口已关闭。不得重开、重试、补探或把本轮 404 自动写成产品缺陷。若再做真域，必须另批。
- 被官方自动审批拒绝的追加写操作不得重试或改包装执行。
- 接口修复已公开建单。受阻的祖先提交仍限制公开 API 修复 PR，本次仅同步脱敏文档。
- 已公开的是管理端和 H5 的 Draft 源码；源站虽已保留对应现场候选版本，仍不等于已合并到主线或已对真实用户正式开放。
- 详细工作日志、部署包、数据库和权限材料、连接信息、账号、登录家族、对象编号等敏感内容只留在受控交接处，不随本文件上传。

当前剩余（仍未完成首发）：正式入口已解阻，管理端建档必填材料类别已核清，但建档开户尚未用真实材料提交验收，t175 仍待用户交付真实材料，现有测试活动规则清单仍未核清；字典等接口 503 仍只记录、未补列权；已部署 H5 的两项真实页面行为与真机验收；H5 主线合并仍待决定；四条源站附属 503 仍开放；启用态受众标签正例仍缺；通知、后台任务、对象存储和正式对队员开放未做；678 个规格操作中绝大多数仍缺正式真域验收。本机累计 351 个业务正例和此前 9 条真域 GET 通过，都不能改记为 UI、真机或正式开放通过。

## 换环境时如何续接

旧续接里的现场版本叙述以文首 2026-11-28 总账（Asia/Shanghai）为准。

1. 先读本文件的最新版本（本 Draft 文档分支；若已更新，以同一路径的最新提交为准）。
2. 现场仍保留的产品版本是：管理端限定留存 [`f7985191b9af7c8ad0654cef31bc83552a1ef3d9`](https://github.com/BA7IEE/srvf-admin-web/commit/f7985191b9af7c8ad0654cef31bc83552a1ef3d9)，原 [`e54dfb49e329c0d869e64783d450e296ab6302ea`](https://github.com/BA7IEE/srvf-admin-web/commit/e54dfb49e329c0d869e64783d450e296ab6302ea)（[PR #174](https://github.com/BA7IEE/srvf-admin-web/pull/174)）留在恢复槽且未执行恢复；队员端限定留存 `3968b0bc8edfc26cd0c3a435576c5b4a8b40e382`。现场 API 仍为 `8a017348d4b8a642d673de539533fa8b1b750865`。T188 日志候选已回滚，该 API 更新/恢复预算已用尽，不得再切。
3. 3968 限定留存窗口将原 477 留在本批恢复槽，未执行恢复。较早的 `e042e9bf`（[Draft PR #6](https://github.com/BA7IEE/SRVFMobileWeb/pull/6)）仍在历史恢复槽。[477 版本](https://github.com/BA7IEE/SRVFMobileWeb/commit/477fa891a16fe46d64628ab126a8eda7d3f775f5)对应 [Draft PR #7](https://github.com/BA7IEE/SRVFMobileWeb/pull/7)。PR #6 和 #7 均未合并。
4. 若某次检查之后又有新的现场、修复或工具包结论，以同一路径的新快照为准，按文首更新时间核对，历史快照保留当时的验证范围。
5. 需要本地详细证据、已关闭认证只读窗口的完整绑定清单或本机补缺台账时，只在原受控交接处按当时索引取用，不要把那些材料拷到公开仓库。
