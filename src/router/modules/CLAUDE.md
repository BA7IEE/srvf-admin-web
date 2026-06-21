# src/router/modules — local rules (loaded on demand)

Static route modules. New SRVF business routes live here as `srvf-*.ts` (see existing `srvf.ts`).
Authoritative rules: `docs/pure-admin/03-router-menu.md`. This file only restates the local gotchas.

## Do

- Add business routes as new `srvf-*.ts` modules (✅ in 02-ai-rules.md §13.1).
- `meta.roles`: use **real NestJS role names** — never demo roles (`admin` / `common` / `*:*:*`).
- Route `name` MUST equal the page's `defineOptions({ name })` (§13.3.6).
- Order with `meta.rank`; set `meta.icon` / `meta.title` (Chinese — i18n is disabled, §13.3.7).

## Don't

- ⛔ Enable `asyncRoutes` or add `getMenuList` — absent by design, not a bug (§13.3.10 · 03-router-menu.md §5.2.1). `src/router/asyncRoutes.ts` / `index.ts` / `utils.ts` are deny-listed.
- ⛔ Edit `home.ts` / `error.ts` / `remaining.ts` except to **append** an absolute-static route (⚠️ assess first — these prompt for confirmation).
- ⛔ Restore `tenantManagementRouter` (must stay hidden).
