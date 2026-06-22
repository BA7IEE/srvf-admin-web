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

### PR-4 NestJS login integration is **LIVE** (上线 2026-06-22)

- PR-4 was restarted after `docs/srvf-api-contract-readiness.md` §6 Readiness Checklist was fully confirmed (10/10) and humans explicitly approved (2026-06-22), then shipped to `main` via PR #6.
- Real login is the **3-call** flow: `POST /api/auth/v1/login` → `GET /api/admin/v1/me` + `GET /api/system/v1/rbac/me/permissions`. Verified live (SUPER_ADMIN · 155 permissions).
- The auth files are now **active code** (see §4) — change them only through a separate human-reviewed PR (§13.2.2).

### Where the original PR-4 attempt is (historical)

- Branch: **`archive/pr-4-login-attempt-b81afec`** (preserved locally + on `origin`) — the _first_ attempt (commit `b81afec`), reverted at the time and later **superseded** by the shipped PR #6. Kept for history only.

### Infrastructure

- ✅ Vite proxy: `/api → http://localhost:3000` (`vite.config.ts`).
- ✅ Data-driven SRVF pages are allowed (see §5).

## 3. Must Read First

Every AI task in this repository must read these documents first, in order:

1. `docs/pure-admin-max-ts-baseline.md` (main entry inherited from starter · v0.3)
2. `docs/pure-admin/02-ai-rules.md` (AI hard rules · §13.1 file matrix · §13.4 8-step checklist)
3. **`docs/srvf-frontend-derivation.md`** (SRVF-specific derivation record · §1 starter base commit · §4 backend Q1~Q5 conclusions · §6 PR order table)
4. **`docs/srvf-api-contract-readiness.md`** (PR-4 readiness + decision record · §6 checklist 10/10 · §3–§5 historical pause context)
5. `docs/pure-admin/12-official-docs-index.md` (Pure Admin official docs index with verified URLs)
6. `docs/pure-admin/13-ai-harness.md` (AI harness · `.claude/` deny+ask rules and guard/verify hooks that mechanically enforce §13.1 / §13.3 · how a human grants an exception by editing `settings.json` — `deny` always beats `allow`)

For route / menu work also read:

- `docs/pure-admin/03-router-menu.md` (especially §5.2.1 asyncRoutes P0 prohibition)

## 4. Core Prohibitions

These apply to ALL AI tasks in this repository, no exceptions:

- ✅ **PR-4 is shipped** (§2); it is no longer paused. The auth files (`src/api/user.ts`, `src/utils/auth.ts`, `src/utils/http/index.ts`, `src/store/modules/user.ts`, `src/views/login/index.vue`) are now **active code** — change them only via a separate human-reviewed PR (§13.2.2), never casually inside unrelated work.
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

## 5. Allowed Work

API contract readiness is met (§2 · readiness §6 = 10/10) and PR-4 is shipped, so **real data-driven pages are now allowed**:

- ✅ **Real SRVF list / detail pages** wired to `/api/admin/v1/*` · `/api/system/v1/*` through `@/utils/http` (dev proxy `/api → :3000`), gated by **real RBAC codes** via `hasPerms("<code>")`. Reuse the `Re*` components + the 队员页 three-piece paradigm (`src/views/srvf/members-domain/members/` `index.vue` + `utils/hook.ts` + `src/api/srvf-member.ts`).
- ✅ Static menu skeleton (`src/router/modules/srvf-*.ts`) and placeholder pages where the contract isn't ready yet.
- ✅ Layout-only UI work and documentation updates (under `docs/`).
- ✅ Organization / activity-domain UIs.
- ✅ `pnpm dev / build / lint / typecheck / preview`.

Types come from live **`/api/docs-json`** (the single contract source). You still must **NOT** invent backend fields / enums / states / RBAC codes frontend-side (red lines 1–4); where the contract isn't ready, mark `placeholder` and STOP rather than "decide" a backend-side concern.

## 6. Before Modifying Files

Every AI task must state these BEFORE making any edit (see `02-ai-rules.md` §13.4 8-step checklist):

- **task type** (PR-5 menu / PR-7 org / PR-8 calendar / docs / etc.);
- **documents read** (must include items from §3 above);
- **allowed files** to modify (only files marked ✅ in `02-ai-rules.md` §13.1 file matrix);
- **forbidden files** that this task could accidentally touch (must be empty diff at the end);
- **PR-4 boundary**: does this task touch the auth mainline (login / token / `/api/auth/v1/login` / `/api/admin/v1/me` / refresh / role mapping)? If yes → that is PR-4 _maintenance_ — do it in a separate human-reviewed PR (§13.2.2), not inside unrelated work.
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

When in doubt: read `docs/srvf-api-contract-readiness.md` first — it is the single source of truth for the PR-4 decision record and what is allowed.

## 9. Full Version Reference Rule

Local full-version reference path:

`/Users/dengwang/Documents/coding/SRVF-web-admin参考/vue-pure-admin`

This is the **open-source full version of vue-pure-admin**. It contains 60+ demo pages (table / form / editor / chart / flowchart / Excel / upload / dept / role / user / dict / log / etc.) that the Max-Ts starter does not ship. It exists purely as a **UI / component / page-pattern read-only reference**.

### Allowed use

- ✅ **read-only reference** — never write to this directory;
- ✅ UI **layout patterns**;
- ✅ **component composition** (how `<PureTable>` / `<ReDialog>` / Schema Form / Drawer / etc. are composed);
- ✅ **table / form / dialog** patterns;
- ✅ **route module** examples (`src/router/modules/*`);
- ✅ **page directory naming** conventions;
- ✅ **icon / menu meta** examples (`meta.icon` / `meta.rank` / `meta.title`);
- ✅ **dictionary / organization / calendar** UI patterns.

### Forbidden use

- ⛔ Do **not** modify the full-version repository (it is local read-only reference, not a git workspace for us);
- ⛔ Do **not** copy backend API contracts from full-version `src/api/*`;
- ⛔ Do **not** copy mock API as real contract;
- ⛔ Do **not** copy RBAC model;
- ⛔ Do **not** copy tenant model;
- ⛔ Do **not** copy dynamic routing implementation (`asyncRoutes` / `getMenuList` / `MenuData` schema);
- ⛔ Do **not** derive backend schema from full-version pages;
- ⛔ Do **not** treat full-version menus as business requirements (e.g. "完整版有 system/role 页 → 我们也要做" is wrong);
- ⛔ Do **not** import full-version code blindly — every copied page must have its API / fields / roles / permissions adapted to the actual backend (Swagger / Prisma).

### Workflow

1. **Search first** in `vue-pure-admin/src/views/` for a similar pattern (e.g. `grep -r "el-tree"` for tree examples).
2. **Read** the matching file, understand the layout / composition / interaction.
3. **Recreate** in the derived business project, but:
   - replace API calls with backend-aligned `src/api/<biz>-*.ts`;
   - replace fields / enums / roles with backend types;
   - replace permission codes (avoid `permission:btn:add` / `*:*:*` style);
   - reuse the starter-side `Re*` components when possible (do not import full-version-specific components).
4. **Never** open a PR against the full-version repo; it is **not** ours.

See `docs/pure-admin/07-max-ts-modules.md` §Full Version Reference Strategy for PR-5 ~ PR-8 specific guidance.
