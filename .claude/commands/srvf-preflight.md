---
description: Run the SRVF tiered preflight (02-ai-rules.md §13.4 + AGENTS.md §2 boundary) before starting a task
---

You are about to start a task in the **srvf-admin-web** repo: $ARGUMENTS

**Step 0 — pick the tier** (02-ai-rules.md §13.4; unattended goal runs always use 全量档):

- **全量档** — new business page / contract wiring / touches ⚠️ (ask) or ❌ (deny) neighborhoods → run Steps 1–10 below and output every conclusion.
- **轻量档** — routine small change (copy / style / local logic, no contract surface) → output Step 1 as a one-line red-line self-check + Step 4 file list (tag §13.1 markers) + Steps 9–10; run `pnpm lint && pnpm typecheck` at wrap-up (the Stop hook backstops typecheck); `pnpm build` is covered by CI on the PR.
- **零码档** — docs / analysis / review with zero `src/**` code change → state "零码任务" + Steps 9–10; Steps 7–8 waived (husky + the Stop hook still backstop).

Invariant: every PR must be lint + typecheck + build green before merge — enforced by CI on the PR (`gh pr checks` must be green).

1. **Red-line scan** — read AGENTS.md §1/§2, 02-ai-rules.md §13. List the red-line numbers this task touches + risk level. Does it define/derive any backend field, table, or API path? If yes → **STOP**.
2. **Full-version reference** — keyword-search `vue-pure-admin/src/views/` for a similar pattern; list paths (or "none, because …").
3. **In-repo paradigm** — find the closest existing pattern under `src/views/srvf/**` (范式 A 列表三件套 / 范式 B 详情作战室 — see `src/views/srvf/CLAUDE.md`) plus `@/srvf-kit` primitives; list the path to reuse.
4. **File-change list** — every file you will touch, each tagged ✅ / 🟡 / ⚠️ / ❌ per §13.1. Any ❌ → **STOP** (separate human-approved PR, §13.2.2). Any ⚠️ → attended ask + risk note. Any 🟡 → name the discipline that applies.
5. **Reuse / deps** — the `Re*` components / `@/srvf-kit` primitives you will reuse; confirm **no** new dependency (else **STOP**, §13.2.1).
6. **API / types** — any new `src/api/<mod>.ts` interfaces vs. live `/api/docs-json` (mark "待后端确认" where unknown); state the mock boundary (裁决 4).
7. **Lint + typecheck** — `pnpm lint && pnpm typecheck`; zero errors, zero warnings; paste the result. (轻量档: at wrap-up; 零码档: waived.)
8. **Build** — CI runs `pnpm build` on the PR (`gh pr checks` green before merge; run it locally only to self-diagnose); if the task touches routes / menu / permissions, also run `pnpm dev` and self-check. (零码档: waived. The Stop hook auto-runs typecheck on `src/**` changes regardless.)
9. **Auth boundary** (AGENTS.md §2 申报制) — does it touch any of the 5 auth files (`src/api/user.ts` / `src/utils/auth.ts` / `src/utils/http/**` / `src/store/modules/user.ts` / `src/views/login/**`)? If yes → declare explicitly: which file / what change / blast radius (登录态 · token 生命周期 · 路由守卫). Undeclared auth edits are not allowed.
10. **Rollback** — the safe commit / branch to fall back to.
