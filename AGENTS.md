# AGENTS.md

> This file is the standard AI entry for non-Claude agents (Codex, Cursor, Copilot, etc.).
> It **mirrors** `CLAUDE.md` and must stay in sync with it.
> Claude Code agents should read `CLAUDE.md` first; other agents may start here.
>
> **All AI agents must obey both `CLAUDE.md` and `AGENTS.md`. Where they ever diverge, `CLAUDE.md` is authoritative — but they should not diverge.**

## 1. Repository Identity

- This repository is the **SRVF-specific admin frontend** (深圳公益救援队 SRVF 内部管理后台).
- It is **derived from `u-admin-web-starter`** (Private starter).
- It is a **business project**, **not** the starter.
- Backend contracts come from **`srvf-nest-api`** (Swagger at `http://localhost:3000/api/docs`), **not** from Pure Admin demo pages.
- This repository must remain **private** forever.

## 2. ⚠️ Current Critical Status

### PR-4 NestJS login integration is **PAUSED**

- **Do not restart PR-4** until:
  1. `docs/srvf-api-contract-readiness.md` §6 Readiness Checklist is **fully confirmed** (all 10 items);
  2. Humans **explicitly approve** restarting PR-4.

### Previous PR-4 attempt

- Branch: `archive/pr-4-login-attempt-b81afec` (preserved locally + on `origin`)
- Commit: `b81afec`
- Revert on main: `6f046cc`

### What is NOT paused

- ✅ Vite proxy is configured: `/api → http://localhost:3000`.
- ✅ Static UI work is allowed (see §5).

## 3. Must Read First

Every AI task in this repository must read these documents first:

1. `docs/pure-admin-max-ts-baseline.md` (main entry inherited from starter · v0.3)
2. `docs/pure-admin/02-ai-rules.md` (AI hard rules · §13.1 file matrix · §13.4 8-step checklist)
3. **`docs/srvf-frontend-derivation.md`** (SRVF derivation record · Q1~Q5 backend conclusions · PR order table)
4. **`docs/srvf-api-contract-readiness.md`** (PR-4 pause authoritative decree · §6 readiness checklist)
5. `docs/pure-admin/12-official-docs-index.md` (Pure Admin official docs index with verified URLs)
6. `docs/pure-admin/13-ai-harness.md` (AI harness · `.claude/` deny+ask rules and guard/verify hooks that mechanically enforce §13.1 / §13.3 · how a human grants an exception by editing `settings.json` — `deny` always beats `allow`)

For route / menu work also read:

- `docs/pure-admin/03-router-menu.md` (especially §5.2.1 asyncRoutes P0 prohibition)

## 4. Core Prohibitions

These apply to ALL AI tasks in this repository, no exceptions:

- ⛔ **Do not restart PR-4**.
- ⛔ **Do not modify login / token / user store / http auth handling**:
  - `src/api/user.ts`
  - `src/utils/auth.ts`
  - `src/utils/http/index.ts`
  - `src/store/modules/user.ts`
  - `src/views/login/index.vue`
- ⛔ **Do not enable `asyncRoutes`** / **do not add or implement `getMenuList`** (`getMenuList` is intentionally absent · not a bug).
- ⛔ **Do not treat mock as backend contract**.
- ⛔ **Do not define backend fields / schema / RBAC / activity state machine from frontend** (red lines 1~4).
- ⛔ **Do not add dependencies** (`pnpm add / remove / update / clean:cache` forbidden) **and do not modify `package.json` dependency fields**.
- ⛔ **Do not restore the tenant management menu** (`tenantManagementRouter` must stay hidden).
- ⛔ **Do not make this repository public**.
- ⛔ Do not use `// eslint-disable` / `// @ts-ignore` / `--no-verify` to bypass checks.
- ⛔ Do not hardcode `import.meta.env.VITE_*` fallbacks in source code.
- ⛔ Do not flow business-specific changes back into starter.

## 5. Allowed Current Work

Before API contract readiness, ONLY these are allowed (see `docs/srvf-api-contract-readiness.md` §5):

- ✅ **PR-5 static menu skeleton** (`src/router/modules/srvf-*.ts` + `src/views/srvf-*/` placeholder pages).
- ✅ Placeholder pages (layout-only, no API calls).
- ✅ Layout-only UI work.
- ✅ Documentation updates.
- ✅ **PR-7** organization UI placeholder (per 裁决 8).
- ✅ **PR-8** activity calendar UI placeholder (per 裁决 7).
- ✅ `pnpm dev / build / lint / typecheck / preview` (read-only commands).

All backend-dependent fields, flows, permissions, and states must be marked **placeholder**.

## 6. Before Modifying Files

Every AI task must state BEFORE editing:

- task type;
- documents read (must include items from §3);
- allowed files to modify;
- forbidden files that this task could accidentally touch (must be empty diff at the end);
- **PR-4 boundary check**: does this task touch login / token / `/api/auth/login` / `/api/users/me` / refresh / role mapping? If yes → STOP;
- **backend impact**: derive / define / require backend fields / tables / API paths? If yes → STOP;
- whether dependencies are touched (if yes → STOP);
- rollback plan.

## 7. Derivation Source

- Starter: `BA7IEE/u-admin-web-starter` (Private)
- Starter base commit at derivation time: `fd24cd4`
- Official docs index synced from starter commit: `ebcddc0`
- Latest starter sync record: see `docs/srvf-frontend-derivation.md` §1 + `docs/pure-admin/11-upstream-sync.md`

## 8. Quick Map

```
┌────────────────────────┐        cherry-pick      ┌────────────────────────┐
│ u-admin-web-starter    │  ─────────────────────► │ srvf-admin-web (this)  │
│ (private starter)      │                         │ (private business)     │
└────────────────────────┘                         │                        │
                                                   │  archive/pr-4-...      │
                                                   │  (PR-4 attempt saved)  │
                                                   └────────────────────────┘
```

- starter → srvf 同步：`git cherry-pick`（never merge）
- srvf → starter 反向流：**禁止**（见 `11-upstream-sync.md` §11-2.4）

When in doubt: read `docs/srvf-api-contract-readiness.md` first — single source of truth for "what is paused, what is allowed".

## 9. Full Version Reference Rule

Local full-version reference path:

`/Users/dengwang/Documents/coding/SRVF-web-admin参考/vue-pure-admin`

This is the **open-source full version of vue-pure-admin** (60+ demo pages). It exists purely as a **UI / component / page-pattern read-only reference**.

### Allowed use

- ✅ **read-only reference** — never write to this directory;
- ✅ UI **layout patterns**;
- ✅ **component composition** (`<PureTable>` / `<ReDialog>` / Schema Form / Drawer / etc.);
- ✅ **table / form / dialog** patterns;
- ✅ **route module** examples (`src/router/modules/*`);
- ✅ **page directory naming** conventions;
- ✅ **icon / menu meta** examples;
- ✅ **dictionary / organization / calendar** UI patterns.

### Forbidden use

- ⛔ Do **not** modify the full-version repository;
- ⛔ Do **not** copy backend API contracts from full-version `src/api/*`;
- ⛔ Do **not** copy mock API as real contract;
- ⛔ Do **not** copy RBAC model;
- ⛔ Do **not** copy tenant model;
- ⛔ Do **not** copy dynamic routing implementation (`asyncRoutes` / `getMenuList` / `MenuData` schema);
- ⛔ Do **not** derive backend schema from full-version pages;
- ⛔ Do **not** treat full-version menus as business requirements;
- ⛔ Do **not** import full-version code blindly — every copied page must have its API / fields / roles / permissions adapted to the actual backend (Swagger / Prisma).

### Workflow

1. **Search first** in `vue-pure-admin/src/views/` for a similar pattern.
2. **Read** the matching file, understand layout / composition / interaction.
3. **Recreate** in the derived business project, but:
   - replace API calls with backend-aligned `src/api/<biz>-*.ts`;
   - replace fields / enums / roles with backend types;
   - replace permission codes (avoid `permission:btn:add` / `*:*:*` style);
   - reuse the starter-side `Re*` components when possible.
4. **Never** open a PR against the full-version repo.

See `docs/pure-admin/07-max-ts-modules.md` §Full Version Reference Strategy for PR-5 ~ PR-8 specific guidance.

---

**Authority**: this file mirrors `CLAUDE.md`. If you find them out of sync, treat the stricter version as authoritative; default: `CLAUDE.md` wins.
