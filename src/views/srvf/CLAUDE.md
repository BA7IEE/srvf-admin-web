# src/views/srvf — local rules (loaded on demand)

SRVF business pages. PR-4 (login / real API) was **restarted & approved (2026-06-22)** — readiness
§6 is 10/10 + human-approved and real login is wired — so pages here **may now call real backend
endpoints** (`/api/admin/v1/*` · `/api/system/v1/*` via `@/utils/http`, dev proxy `/api → :3000`)
and gate by **real RBAC codes**. Authoritative rules: `docs/srvf-api-contract-readiness.md` §6 +
`docs/srvf-api-integration-guide.md` + `docs/pure-admin/07-max-ts-modules.md`.

## Do

- Build real list/detail pages (or placeholders where the contract isn't ready yet); reuse `Re*` components and the `dict` / `tenant/list` paradigm — `PureTableBar` + `pure-table` + a `utils/hook` (§13.3.1, §13.3.4).
- **按任务设计页面,不止 CRUD 列表**(第二种被许可范式,沿后端仓 `docs/handoff/admin-web.md` §1 轴模型):后端把报名/考勤/证书等建成**嵌套子资源**(`activities/:id/registrations`、`members/:id/certificates`…)。这类该做成**详情页/作战室**——进一个活动看它的报名/考勤 tab、进一个队员看它的证书/履历 tab,`activityId`/`memberId` **从路由参数**取,不在页面顶部摆"选择活动/队员"下拉。沿轴下钻(详情页)+ 跨轴横扫(工作台,按 status)是两种互补任务视图。
- Put API calls in `src/api/srvf-*.ts`; align types to **`/api/docs-json`**, not the guide's abbreviated field names (several drift — e.g. `userId` / `avatarKey` / `effectiveRoles`).
- Gate page / button visibility with `v-auth` / `hasPerms` using **real permission codes** (e.g. `member.read.record`) — the 155 codes come from each endpoint's `[rbac: <code>]` summary or backend `prisma/seed.ts`. Never `*:*:*` / `permission:btn:*`.
- Where the contract isn't ready, still mark backend-dependent fields / flows / states with an explicit `placeholder` note.
- Business stores: new files with an `srvf*` prefix (§13.1). No `any`; must pass `pnpm typecheck` (§13.3.5).
- Menu stays frontend-static + `permissions[]`-filtered; backend has no menu-tree endpoint (asyncRoutes P0 prohibition unchanged).

## Don't

- ⛔ Invent backend fields / enums / schema / RBAC / activity states (red lines 1–4). Consume the contract; if you'd have to "decide" a backend concern, STOP — that is the backend's job.
- ⛔ **把嵌套子资源拍平成"顶级菜单 + 手选父级下拉"**(报名页选活动 / 考勤页选活动 / 证书页选队员)。这把后端已建好的父子关系在 UI 层扔掉 = 上下文丢失。看到自己在写"请先选择一个 X 才能看 Y",STOP——Y 该长在 X 的详情页 tab 里(见上方 Do 的"按任务设计页面" + 后端仓 `docs/handoff/admin-web.md` §1)。
- ⛔ Copy backend contracts / mock / RBAC from the full-version reference repo (CLAUDE.md §9) — UI patterns only.
- ⛔ Touch the deny-listed router core (`router/index.ts` / `utils.ts` / `asyncRoutes.ts`) or re-enable `asyncRoutes` / add `getMenuList`.
