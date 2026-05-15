# SRVF API Contract Readiness

## 1. Current Decision

PR-4 NestJS login integration is paused.

The previous login integration attempt was preserved in:

- `archive/pr-4-login-attempt-b81afec`

The main branch reverted the PR-4 implementation because the backend API contract is not stable enough.

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

PR-4 may restart only after humans confirm:

- [ ] backend decides whether refresh-token will exist;
- [ ] if no refresh-token, frontend logout-on-expiry strategy is confirmed;
- [ ] RBAC v2 permission API is confirmed as frontend permission source or explicitly postponed;
- [ ] `/api/users/me` is confirmed as the only post-login user info source;
- [ ] login response structure is stable;
- [ ] `expiresIn` format is stable;
- [ ] 401 / 429 / 10004 frontend behavior is confirmed;
- [ ] Swagger/OpenAPI reflects the current auth contract;
- [ ] at least one test account exists for frontend login verification;
- [ ] humans explicitly approve restarting PR-4.

## 7. Decision Record

- Decision: pause PR-4 and revert login integration from main.
- Reason: backend auth / refresh-token / RBAC contract is not stable enough.
- Kept: PR-2.1 Vite proxy.
- Preserved: login attempt branch `archive/pr-4-login-attempt-b81afec`.
