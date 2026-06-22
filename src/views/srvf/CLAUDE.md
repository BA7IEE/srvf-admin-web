# src/views/srvf — local rules (loaded on demand)

SRVF business pages. PR-4 (login / real API) was **restarted & approved (2026-06-22)** — readiness
§6 is 10/10 + human-approved and real login is wired — so pages here **may now call real backend
endpoints** (`/api/admin/v1/*` · `/api/system/v1/*` via `@/utils/http`, dev proxy `/api → :3000`)
and gate by **real RBAC codes**. Authoritative rules: `docs/srvf-api-contract-readiness.md` §6 +
`docs/srvf-api-integration-guide.md` + `docs/pure-admin/07-max-ts-modules.md`.

## 两种被许可的页面范式（不要为每张表发明第三种）

SRVF 业务页只允许这两种形状。**范式 A 是默认**；当一个实体需要"进得去、能在它内部跨资源操作"时用**范式 B**，而不是再并列加一张菜单表。

### 范式 A · CRUD 资源列表（现状默认）

- 形状：`PureTableBar` + `pure-table` + `utils/hook.ts`(+ `form.vue`)，挂为侧栏菜单项（`src/router/modules/srvf-*.ts` 的可见 child）。
- 适用：一种资源的增删改查 / 审批。已有实例：字典 / 组织 / 队员 / 活动 / 报名 / 考勤 / 证书。
- 列表是数据，不是终点——若该资源还要"钻进某一行做下一步"，配一个范式 B 入口，别再拆并列菜单。

### 范式 B · 实体详情 / 任务作战室页（连线，不是新岛）

把"某个实体 + 它名下的若干子资源"收进一页，让任务在一处流转，而不是逼用户回侧栏另选菜单再按标题搜。

- **入口**：由范式 A 的**列表行** `router.push` 进入（行上一个"管理/详情"按钮 + `useRouter()`），**不是侧栏菜单项**。
- **路由**：加到**静态** `src/router/modules/srvf.ts`（不开 asyncRoutes），路径带实体 id（`.../activities/:id`）；`meta.showLink: false`（侧栏不显）+ `meta.activePath` 指回列表路径（停留时列表菜单保持高亮，见 [types/router.d.ts:55](../../../types/router.d.ts)）。route `name` 仍须等于页面 `defineOptions({ name })`（§13.3.6）。
- **收 id**：经**路由参数** `useRoute().params.id` 取实体 id（不传 query 也行；该路由不入 `keepAlive` → 每次进来重新挂载，`params.id` 在 setup 取一次即可靠）。
- **复用既有 hook，不重写**：内嵌既有的 list `utils/hook.ts`——把"父实体 id 的来源"从页内**下拉**换成**路由参数**即可；审批 / CRUD handler 一行不改、不复制，直接调同一个 hook 暴露的它们。为此 hook 接受**可选外部 id**（`useXxx(externalId?)`：传了 → 固定该 id、不渲染/不加载下拉；不传 → 维持独立菜单页现状）。**改造 hook 必须向后兼容**：独立菜单页（无参调用）回归不破是硬指标。
- **承载**：实体头部信息 + 头部级动作（如发布/取消，复用既有 API + `hasPerms` 码门）+ 多 `el-tabs` 跨子资源（报名 / 考勤…），各 tab 复用对应 list hook。
- 已落地实例：活动作战室 `activities/cockpit.vue`（头部 `getActivity` + 报名/考勤两 tab 复用 `useRegistrations`/`useAttendances`）。

**两种范式都仍守红线**：不开 `asyncRoutes` / 不补 `getMenuList`、详情路由加到静态 `srvf.ts`、复用 `Re*` 不改其本体、字段/枚举/状态/RBAC 码一律查 `/api/docs-json` 不臆造（红线 1~4）。

## Do

- Build real list/detail pages (or placeholders where the contract isn't ready yet); reuse `Re*` components and the `dict` / `tenant/list` paradigm — `PureTableBar` + `pure-table` + a `utils/hook` (§13.3.1, §13.3.4).
- Put API calls in `src/api/srvf-*.ts`; align types to **`/api/docs-json`**, not the guide's abbreviated field names (several drift — e.g. `userId` / `avatarKey` / `effectiveRoles`).
- Gate page / button visibility with `v-auth` / `hasPerms` using **real permission codes** (e.g. `member.read.record`) — the 155 codes come from each endpoint's `[rbac: <code>]` summary or backend `prisma/seed.ts`. Never `*:*:*` / `permission:btn:*`.
- Where the contract isn't ready, still mark backend-dependent fields / flows / states with an explicit `placeholder` note.
- Business stores: new files with an `srvf*` prefix (§13.1). No `any`; must pass `pnpm typecheck` (§13.3.5).
- Menu stays frontend-static + `permissions[]`-filtered; backend has no menu-tree endpoint (asyncRoutes P0 prohibition unchanged).

## Don't

- ⛔ Invent backend fields / enums / schema / RBAC / activity states (red lines 1–4). Consume the contract; if you'd have to "decide" a backend concern, STOP — that is the backend's job.
- ⛔ Copy backend contracts / mock / RBAC from the full-version reference repo (CLAUDE.md §9) — UI patterns only.
- ⛔ Touch the deny-listed router core (`router/index.ts` / `utils.ts` / `asyncRoutes.ts`) or re-enable `asyncRoutes` / add `getMenuList`.
