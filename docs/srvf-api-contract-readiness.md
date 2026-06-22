# SRVF API Contract Readiness

## 1. Current Decision

> **UPDATE 2026-06-22 — PR-4 UNBLOCKED.** The §6 readiness checklist was frozen against backend
> `srvf-nest-api v0.10.0`; the backend has since advanced to **v0.29.0** and now provides everything
> the checklist was waiting for (refresh-token, stable RBAC permission API, stable login response).
> All 10 checklist items are confirmed below (§6), and the maintainer explicitly approved restarting
> PR-4 on 2026-06-22. See **[`srvf-api-integration-guide.md`](./srvf-api-integration-guide.md)** for the
> verified contract + the concrete wiring spec (notably: login becomes a **3-call** flow because the
> backend separates token / identity / permissions). The original pause record below is kept as history.

PR-4 NestJS login integration was paused (now unblocked — see UPDATE above).

The previous login integration attempt was preserved in:

- `archive/pr-4-login-attempt-b81afec`

The main branch reverted the PR-4 implementation because the backend API contract was not stable enough **at v0.10.0** (it is now stable at v0.29.0).

## 2. Kept

The Vite proxy from PR-2.1 is kept:

- `/api` → `http://localhost:3000`
- no rewrite

This is infrastructure and does not bind frontend auth logic to an unstable backend contract.

## 3. Why PR-4 Is Paused

Frontend login integration is blocked by backend contract readiness:

- refresh-token is not implemented;
- RBAC is not fully stable;
- frontend permission source is not finalized;
- token expiration strategy is not finalized;
- `/api/users/me` usage is known but store mapping is not final;
- error-code to frontend interaction mapping is not finalized;
- Swagger/OpenAPI must reflect the final contract before frontend integration.

## 4. Blocked Frontend Work

Do not start these until this document's readiness checklist is complete:

- real NestJS login integration;
- `src/api/user.ts` auth API rewrite;
- `src/utils/auth.ts` token strategy rewrite;
- `src/store/modules/user.ts` login flow rewrite;
- `src/utils/http/index.ts` auth error handling rewrite;
- refresh-token handling;
- RBAC / permission button integration.

## 5. Allowed Frontend Work

Allowed before contract readiness:

- static UI skeleton;
- static SRVF menu placeholder;
- layout-only pages;
- activity calendar UI placeholder;
- documentation;
- frontend-only route grouping;
- demo-only data clearly marked as placeholder.

All backend-dependent fields, states, permissions, workflows, and enums must be marked `placeholder`.

## 6. Readiness Checklist

> **Frozen contract baseline: srvf-nest-api v0.10.0 @ 2026-05-15.**
> This checklist was frozen against that backend version. Before restarting PR-4, every
> item below must be re-verified against the **current** backend — the live `srvf-nest-api`
> has almost certainly advanced past v0.10.0 since the freeze. `node .claude/hooks/harness-doctor.mjs`
> reads this baseline, compares it to `../srvf-nest-api/package.json`, and WARNs when they
> diverge (see `docs/pure-admin/13-ai-harness.md` §13A.5). A WARN is a reminder to re-check —
> it is not, by itself, permission to restart PR-4.

PR-4 may restart only after humans confirm:

> **All confirmed 2026-06-22 against backend `v0.29.0`** (details + wiring spec in [`srvf-api-integration-guide.md`](./srvf-api-integration-guide.md)).

- [x] backend decides whether refresh-token will exist — **YES**, `POST /api/auth/v1/refresh` (rotation always + family revoke + absolute expiry).
- [x] if no refresh-token, frontend logout-on-expiry strategy — N/A (refresh-token exists).
- [x] RBAC v2 permission API is confirmed as frontend permission source — **YES**, `GET /api/system/v1/rbac/me/permissions` → `{permissions: string[], roles: [{code,displayName}]}` (155 codes, dot-format; SUPER_ADMIN = full set).
- [x] post-login user info source — **`GET /api/admin/v1/me`** (Route B removed legacy `/api/users/me`).
- [x] login response structure is stable — `LoginResponseDto` frozen 5 fields since P0-E (`accessToken, tokenType, expiresIn, refreshToken, refreshExpiresAt`).
- [x] `expiresIn` format is stable — stable, but it is the JWT duration **string `"15m"`**, not a timestamp (frontend computes `expires = now + parse(expiresIn)`; see guide §4 gotcha B).
- [x] 401 / 429 / 10004 frontend behavior — confirmed (guide §3): 10004=login fail (401, no auto-refresh), 40100=unauthorized (401, refresh→retry), 10007=refresh invalid (401, re-login), 30100=RBAC (403), 429=throttle (no Retry-After). Biz failures arrive as HTTP 4xx (axios reject) — read `err.response.data.{code,message}`.
- [x] Swagger/OpenAPI reflects current auth contract — `/api/docs-json` 100% + contract-snapshot locked.
- [x] at least one test account exists — seed default SUPER*ADMIN; dev default `admin` / `ChangeMe123456` (disabled in production; set `SUPER_ADMIN*\*` env).
- [x] humans explicitly approve restarting PR-4 — **approved 2026-06-22**.

## 7. Decision Record

- Decision: pause PR-4 and revert login integration from main.
- Reason: backend auth / refresh-token / RBAC contract is not stable enough.
- Kept: PR-2.1 Vite proxy.
- Preserved: login attempt branch `archive/pr-4-login-attempt-b81afec`.
