# srvf-admin-web · AI Entry

> Read this file BEFORE doing anything in this repository.
> If anything you are about to do is not explicitly allowed here, STOP and ask.

## 1. Repository Identity

- This repository is the **SRVF-specific admin frontend** (深圳公益救援队 SRVF 内部管理后台).
- It is **derived from `u-admin-web-starter`** (Private starter).
- It is a **business project**, **not** the starter — do not develop starter-level changes here.
- Backend contracts come from **`srvf-nest-api`** (Swagger at `http://localhost:3000/api/docs`), **not** from Pure Admin demo pages.
- This repository must remain **private** forever (upstream Pure Admin Max-Ts license forbids public distribution).

## 2. ⚠️ Current Critical Status

### PR-4 NestJS login integration is **PAUSED**

- **Do not restart PR-4** until both of the following are confirmed:
  1. `docs/srvf-api-contract-readiness.md` §6 Readiness Checklist is **fully confirmed** (all 10 items checked off);
  2. Humans **explicitly approve** restarting PR-4.

### Where the previous PR-4 attempt is

- Branch: **`archive/pr-4-login-attempt-b81afec`** (preserved locally + on remote `origin`)
- Commit: `b81afec feat: integrate srvf nestjs login`
- Status: code-complete attempt that was reverted from `main` because backend contract is not stable enough (refresh-token / RBAC / 401-429 UX / Swagger).
- The revert commit on `main` is `6f046cc Revert "feat: integrate srvf nestjs login"`.

### What is NOT paused

- ✅ Vite proxy is configured: `/api → http://localhost:3000` (`vite.config.ts`).
- ✅ Static UI work is allowed (see §5 below).

## 3. Must Read First

Every AI task in this repository must read these documents first, in order:

1. `docs/pure-admin-max-ts-baseline.md` (main entry inherited from starter · v0.3)
2. `docs/pure-admin/02-ai-rules.md` (AI hard rules · §13.1 file matrix · §13.4 8-step checklist)
3. **`docs/srvf-frontend-derivation.md`** (SRVF-specific derivation record · §1 starter base commit · §4 backend Q1~Q5 conclusions · §6 PR order table)
4. **`docs/srvf-api-contract-readiness.md`** (PR-4 pause authoritative decree · §3 why paused · §4 blocked work · §5 allowed work · §6 readiness checklist)
5. `docs/pure-admin/12-official-docs-index.md` (Pure Admin official docs index with verified URLs)

For route / menu work also read:

- `docs/pure-admin/03-router-menu.md` (especially §5.2.1 asyncRoutes P0 prohibition)

## 4. Core Prohibitions

These apply to ALL AI tasks in this repository, no exceptions:

- ⛔ **Do not restart PR-4** (see §2 above).
- ⛔ **Do not modify login / token / user store / http auth handling**:
  - `src/api/user.ts`
  - `src/utils/auth.ts`
  - `src/utils/http/index.ts`
  - `src/store/modules/user.ts`
  - `src/views/login/index.vue`
- ⛔ **Do not enable `asyncRoutes`** (`src/router/asyncRoutes.ts` · do not switch `src/views/login/index.vue` import).
- ⛔ **Do not add or implement `getMenuList`** (intentionally absent · not a bug).
- ⛔ **Do not treat mock as backend contract** (mock URLs, fields, role names like `admin / common / *:*:*` are demo-only).
- ⛔ **Do not define backend fields / schema / RBAC / activity state machine from frontend** (red lines 1~4).
- ⛔ **Do not add dependencies** (`pnpm add / remove / update / clean:cache` forbidden).
- ⛔ **Do not modify `package.json` `dependencies / devDependencies / engines / pnpm` fields** (counts as `pnpm add`).
- ⛔ **Do not restore the tenant management menu** (`tenantManagementRouter` must stay hidden; `_tenantManagementRouter` source kept as reference only).
- ⛔ **Do not make this repository public**.
- ⛔ Do not use `// eslint-disable` / `// @ts-ignore` / `--no-verify` to bypass checks.
- ⛔ Do not hardcode `import.meta.env.VITE_*` fallbacks in source code.
- ⛔ Do not flow business-specific changes back into starter (see `docs/pure-admin/11-upstream-sync.md` §11-2.4).

## 5. Allowed Current Work

Before API contract readiness, ONLY these are allowed (see `docs/srvf-api-contract-readiness.md` §5):

- ✅ **PR-5 static menu skeleton** (new `src/router/modules/srvf-*.ts` + `src/views/srvf-*/` placeholder pages).
- ✅ Placeholder pages (layout-only, no API calls).
- ✅ Layout-only UI work.
- ✅ Documentation updates (under `docs/`).
- ✅ **PR-7** organization UI placeholder (per 裁决 8 · do not define backend org model).
- ✅ **PR-8** activity calendar UI placeholder (per 裁决 7 · do not define backend Activity / Event / Attendance schema).
- ✅ `pnpm dev / build / lint / typecheck / preview` (read-only commands).

All backend-dependent **fields, flows, permissions, and states must be marked `placeholder`**. If you find yourself needing to "decide" a backend-side concern, STOP — that is the backend's job.

## 6. Before Modifying Files

Every AI task must state these BEFORE making any edit (see `02-ai-rules.md` §13.4 8-step checklist):

- **task type** (PR-5 menu / PR-7 org / PR-8 calendar / docs / etc.);
- **documents read** (must include items from §3 above);
- **allowed files** to modify (only files marked ✅ in `02-ai-rules.md` §13.1 file matrix);
- **forbidden files** that this task could accidentally touch (must be empty diff at the end);
- **PR-4 boundary**: does this task touch login / token / `/api/auth/login` / `/api/users/me` / refresh / role mapping? If yes → STOP, that is PR-4 territory and PR-4 is paused.
- **backend impact**: does this task derive / define / require backend fields / tables / API paths? If yes → STOP, that violates red lines 1~4.
- **whether dependencies are touched**; if yes → STOP, this is not allowed.
- **rollback plan** (which commit / branch is the safe fallback).

## 7. Derivation Source

- **Starter**: `BA7IEE/u-admin-web-starter` (Private)
- **Starter base commit at derivation time**: `fd24cd4` (`chore: record starter setup verification`)
- **Official docs index synced from starter commit**: `ebcddc0`
- **Latest starter sync record**: see `docs/srvf-frontend-derivation.md` §1 + 上游同步规则 `docs/pure-admin/11-upstream-sync.md`

When in doubt about a starter-level concern: go look at the starter repo (`/Users/dengwang/Documents/coding/u-admin-web-starter` or `BA7IEE/u-admin-web-starter`) — but **do not** push starter-level changes from this repo back to starter.

## 8. Quick Map

```
┌────────────────────────┐        cherry-pick      ┌────────────────────────┐
│ u-admin-web-starter    │  ─────────────────────► │ srvf-admin-web (this)  │
│ (private starter)      │                         │ (private business)     │
│  HEAD: 5f335cf+        │                         │  HEAD: 40f55d9+        │
└────────────────────────┘                         │                        │
                                                   │  archive/pr-4-...      │
                                                   │  (PR-4 attempt saved)  │
                                                   └────────────────────────┘
```

- starter → srvf 同步：`git remote add starter ...` + `git fetch starter` + `git cherry-pick <sha>`（never merge）
- srvf → starter 反向流：**禁止**（极少数无业务语义的修复才候选，见 `11-upstream-sync.md` §11-2.4）

When in doubt: read `docs/srvf-api-contract-readiness.md` first — it is the single source of truth for "what is paused, what is allowed".
