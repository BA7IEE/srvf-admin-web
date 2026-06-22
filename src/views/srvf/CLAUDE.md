# src/views/srvf — local rules (loaded on demand)

SRVF business pages. PR-4 (login / real API) was **restarted & approved (2026-06-22)** — readiness
§6 is 10/10 + human-approved and real login is wired — so pages here **may now call real backend
endpoints** (`/api/admin/v1/*` · `/api/system/v1/*` via `@/utils/http`, dev proxy `/api → :3000`)
and gate by **real RBAC codes**. Authoritative rules: `docs/srvf-api-contract-readiness.md` §6 +
`docs/srvf-api-integration-guide.md` + `docs/pure-admin/07-max-ts-modules.md`.

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
