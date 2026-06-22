# src/views/srvf — local rules (loaded on demand)

SRVF business pages. PR-4 (login / real API) is **PAUSED**, so everything here is
**placeholder / layout-only**. Authoritative rules: `docs/srvf-api-contract-readiness.md` §5 +
`docs/pure-admin/07-max-ts-modules.md`.

## Do

- Build layout-only placeholder pages; reuse `Re*` components and the `dict` / `tenant/list` / `schedule` paradigm (§13.3.1, §13.3.4).
- Mark every backend-dependent field / flow / state / permission with an explicit `placeholder` note.
- Business stores: new files with an `srvf*` prefix (§13.1). No `any`; must pass `pnpm typecheck` (§13.3.5).

## Don't

- ⛔ Make API calls or import auth/token/user code — PR-4 is paused and those files are deny-listed.
- ⛔ Invent backend fields / enums / schema / RBAC / activity states (red lines 1–4). If you need to "decide" a backend concern, STOP — that is the backend's job.
- ⛔ Copy backend contracts / mock / RBAC from the full-version reference repo (CLAUDE.md §9) — UI patterns only.
