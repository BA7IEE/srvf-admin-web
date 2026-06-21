---
description: Run the SRVF 8-step preflight (02-ai-rules.md §13.4) before starting a task
---

You are about to start a task in the **srvf-admin-web** repo. Before any edit, complete the
8-step preflight from `docs/pure-admin/02-ai-rules.md` §13.4 plus the boundary checks from
CLAUDE.md §6. Output your conclusions for THIS task — $ARGUMENTS — as a checklist. Do not skip
steps; if the task is tiny, say so in one line, but still run Steps 7–8.

1. **Red-line scan** — read CLAUDE.md §2/§4, 02-ai-rules.md §13, `09-pr-roadmap.md`. List the red-line numbers this task touches + risk level. Does it define/derive any backend field, table, or API path? If yes → **STOP**.
2. **Full-version reference** — keyword-search `vue-pure-admin/src/views/` for a similar pattern; list paths (or "none, because …").
3. **In-repo paradigm** — find the closest existing pattern (`dict` / `tenant/list` / `schedule` / `permission` / `login`); list the path to reuse.
4. **File-change list** — every file you will touch, each tagged ✅ / ⚠️ / ❌ per §13.1. Any ❌ → **STOP** (separate human-approved PR, §13.2.2). Any ⚠️ → write the risk note.
5. **Reuse / deps** — the `Re*` components and libs you will reuse; confirm **no** new dependency (else **STOP**, §13.2.1).
6. **API / types** — any new `src/api/<mod>.ts` interfaces vs. NestJS Swagger (mark "待后端确认" where unknown); state the mock boundary (裁决 4).
7. **PR-4 boundary** — does it touch login / token / `/api/auth/login` / `/api/users/me` / refresh / role mapping? If yes → **STOP**, PR-4 is paused.
8. **Rollback** — the safe commit / branch to fall back to.

As you implement, run `pnpm lint && pnpm typecheck` (zero errors, zero warnings) and finish with
`pnpm build`. The harness will also run `pnpm typecheck` automatically when you stop.
