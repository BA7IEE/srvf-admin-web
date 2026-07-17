---
description: Run the SRVF preflight (02-ai-rules.md §13.4 steps 1-8 + CLAUDE.md §6 boundary) before starting a task
---

You are about to start a task in the **srvf-admin-web** repo. Before any edit, complete the §13.4
8-step preflight (Steps 1–8 below) from `docs/pure-admin/02-ai-rules.md` plus the AGENTS.md §2
boundary checks (Steps 9–10). Output your conclusions for THIS task — $ARGUMENTS — as a checklist.
Do not skip steps; if the task is tiny, say so in one line, but still run Steps 7–8
(`pnpm lint && pnpm typecheck`, then `pnpm build`) and Steps 9–10.

1. **Red-line scan** — read AGENTS.md §1/§2, 02-ai-rules.md §13. List the red-line numbers this task touches + risk level. Does it define/derive any backend field, table, or API path? If yes → **STOP**.
2. **Full-version reference** — keyword-search `vue-pure-admin/src/views/` for a similar pattern; list paths (or "none, because …").
3. **In-repo paradigm** — find the closest existing pattern (`dict` / `tenant/list` / `schedule` / `permission` / `login`); list the path to reuse.
4. **File-change list** — every file you will touch, each tagged ✅ / ⚠️ / ❌ per §13.1. Any ❌ → **STOP** (separate human-approved PR, §13.2.2). Any ⚠️ → write the risk note.
5. **Reuse / deps** — the `Re*` components and libs you will reuse; confirm **no** new dependency (else **STOP**, §13.2.1).
6. **API / types** — any new `src/api/<mod>.ts` interfaces vs. NestJS Swagger (mark "待后端确认" where unknown); state the mock boundary (裁决 4).
7. **Lint + typecheck** (§13.4 Step 7) — run `pnpm lint && pnpm typecheck`; zero errors, zero warnings; paste the result.
8. **Build** (§13.4 Step 8) — run `pnpm build` to verify the bundle; if the task touches routes / menu / permissions, also run `pnpm dev` and self-check. The harness will also run `pnpm typecheck` automatically when you stop.
9. **Auth boundary** (AGENTS.md §2 申报制) — does it touch any of the 5 auth files (`src/api/user.ts` / `src/utils/auth.ts` / `src/utils/http/**` / `src/store/modules/user.ts` / `src/views/login/**`)? If yes → declare explicitly: which file / what change / blast radius (登录态 · token 生命周期 · 路由守卫). Undeclared auth edits are not allowed.
10. **Rollback** — the safe commit / branch to fall back to.
