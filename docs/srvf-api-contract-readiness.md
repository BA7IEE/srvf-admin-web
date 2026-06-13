# SRVF API Contract Readiness

## 1. Current Decision

PR-4 NestJS login integration is paused.

The previous login integration attempt was preserved in:

- `archive/pr-4-login-attempt-b81afec`

The main branch reverted the PR-4 implementation because the backend API contract is not stable enough.

> 📌 **2026-06-14 契约复评（v0.24.0）**：后端已从 v0.10.0 演进至 **v0.24.0**，§3 暂停理由的技术项**大部分已被后端补齐**（refresh-token / RBAC / 身份端点 / 错误码均已落地，见 §3 行内状态 + §8）。
> **但 PR-4 仍保持暂停** —— 解冻仍需 §6 checklist 全部由**人类确认** + **人类显式批准**。本次复评只补「代码事实证据」，**不代为勾选任何 checklist 项**。
> 实际契约权威记录见 `docs/srvf-frontend-derivation.md §4.y`。

## 2. Kept

The Vite proxy from PR-2.1 is kept:

- `/api` → `http://localhost:3000`
- no rewrite

This is infrastructure and does not bind frontend auth logic to an unstable backend contract.

## 3. Why PR-4 Is Paused

Frontend login integration is blocked by backend contract readiness.

原始（v0.10.0）阻塞项 + **2026-06-14 v0.24.0 行内复评**（以实际代码为准，证据见 `srvf-frontend-derivation.md §4.y`）：

- refresh-token is not implemented; → ✅ **已解决**：`POST /api/auth/v1/refresh` 完整 rotation + family + absolute expiration 已落地。
- RBAC is not fully stable; → ✅ **已落地**：`GET /api/system/v1/rbac/me/permissions` + RbacRole/Permission/RolePermission/UserRole 四表。
- frontend permission source is not finalized; → ✅ **已明确**：权限源 = `rbac/me/permissions`；`role` 经双 me DTO 注释钉死「非授权依据」。
- token expiration strategy is not finalized; → ✅ **已明确**：access `expiresIn`（例 `15m`）+ refresh `refreshExpiresAt`（family 绝对过期 ISO）。
- `/api/users/me` usage is known but store mapping is not final; → ⚠️ **路径已变**：旧 `/api/users/me` 删除，管理后台身份取 **`GET /api/admin/v1/me`**（9 字段）；store 映射待 PR-4 落地。
- error-code to frontend interaction mapping is not finalized; → ✅ **已齐**：401/40100、429/42900、10004、10007、24010、250xx 等；前端交互映射待落地。
- Swagger/OpenAPI must reflect the final contract before frontend integration. → ❓ **待人工核对**：后端 v0.24.0 Swagger 已就绪，但需后端在线 + 人工核对 `/api/docs-json`（见 §6）。

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

PR-4 may restart only after humans confirm.

> ⚠️ **勾选纪律**：以下每项的 `→ 证据` 是 2026-06-14 由 AI 复核 v0.24.0 代码得出的**事实证据**，仅供人类确认时参考。
> **复选框 `[ ]` 一律保持未勾** —— 勾选是**人类确认动作**，AI 不得代勾，尤其最后一项「人类显式批准」。

- [ ] backend decides whether refresh-token will exist; → 证据：✅ 已实现（`auth.controller.ts` refresh/logout/logout-all + `RefreshToken` 表）。
- [ ] if no refresh-token, frontend logout-on-expiry strategy is confirmed; → 证据：**本项前提已不适用**（refresh 已存在）；改为需确认「refresh rotation 前端策略」（access 过期→`/refresh`，family 到期→重登录）。
- [ ] RBAC v2 permission API is confirmed as frontend permission source or explicitly postponed; → 证据：✅ `GET /api/system/v1/rbac/me/permissions` 已就绪，且双 me DTO 钉死 `role` 非授权依据，权限源唯一指向 RBAC。
- [ ] ~~`/api/users/me`~~ **`/api/admin/v1/me`** is confirmed as the only post-login user info source; → 证据：⚠️ 旧 `/api/users/me` 已删除；管理后台身份 canonical 入口为 `GET /api/admin/v1/me`（`AdminMeResponseDto` 9 字段，commit `56f4b81b`）。待人类确认采用此端点。
- [ ] login response structure is stable; → 证据：`LoginResponseDto` 恰好 5 字段且后端注释标「冻结禁增」；需后端确认不再变更。
- [ ] `expiresIn` format is stable; → 证据：✅ JWT duration 串（例 `15m`），格式自 v0.10.0 未变。
- [ ] 401 / 429 / 10004 frontend behavior is confirmed; → 证据：✅ 码已全定（40100/42900/10004/10007/24010…，无 `Retry-After`）；前端交互映射待落地确认。
- [ ] Swagger/OpenAPI reflects the current auth contract; → 证据：❓ 后端 `setVersion('0.24.0')` 已就绪，但复评时后端未在线；需后端启动 + 人工核对 `/api/docs-json`。
- [ ] at least one test account exists for frontend login verification; → 证据：❓ 未知；需后端提供测试账号（username + password）。
- [ ] humans explicitly approve restarting PR-4. → 证据：❓ **待 David 显式批准**（AI 永不代勾此项）。

## 7. Decision Record

- Decision: pause PR-4 and revert login integration from main.
- Reason: backend auth / refresh-token / RBAC contract is not stable enough.
- Kept: PR-2.1 Vite proxy.
- Preserved: login attempt branch `archive/pr-4-login-attempt-b81afec`.

## 8. v0.24.0 契约复评记录（2026-06-14）

- **复评对象**：`srvf-nest-api` v0.24.0（HEAD `56f4b81b`）。
- **方法**：直接读后端源码（非 mock / 非 Swagger UI）。完整契约记录见 `docs/srvf-frontend-derivation.md §4.y`。
- **核心发现**：
  - Q2（refresh-token）、Q5（API 路径）相对 v0.10.0 **已反转**；Q4（`role` 作权限源）被后端 DTO 注释**显式否定**。
  - 当初暂停 PR-4 的技术阻塞（refresh 缺失 / RBAC 不稳 / 身份源不清 / 错误码未定）**基本已被后端补齐**。
  - 关键新增：`GET /api/admin/v1/me`（管理后台身份 bootstrap，9 字段，物理隔离）补上了「无 admin-me」缺口。
- **解冻仍缺（3 项，均非 AI 可独立完成）**：
  1. 后端在线 + 人工核对 `/api/docs-json`（§6 第 8 项）；
  2. 后端提供至少一个测试账号（§6 第 9 项）；
  3. **David 显式批准重启 PR-4**（§6 第 10 项）。
- **治理结论**：**PR-4 仍暂停**。本次为纯文档 true-up，未触碰任何被冻结代码；§6 复选框一律未勾，待人类确认。
