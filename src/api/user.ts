import { http } from "@/utils/http";

/**
 * 统一成功信封：`{ code:0, message:'ok', data }`。
 * 业务失败为 HTTP 4xx + `{ code, message }`（无 data），axios 会 reject
 * （见 `src/utils/http/index.ts` 与 docs/srvf-api-integration-guide.md §3 gotcha A）。
 */
export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

/**
 * 登录 / 刷新 的 `data`（后端 `LoginResponseDto`，5 字段已冻结）。
 * 注意：`expiresIn` 是 JWT 配置时长字符串（如 `"15m"`）**不是时间戳**；
 * 前端 `expires` 需用 `auth.parseDurationMs` 现算（guide §3 gotcha B）。
 */
export type LoginResult = ApiEnvelope<{
  /** 裸 JWT（响应不带 `Bearer` 前缀；前端 `formatToken` 拼 `Bearer <token>`） */
  accessToken: string;
  /** 固定 `"Bearer"` */
  tokenType: string;
  /** JWT 配置时长字符串，如 `"15m"`（非时间戳） */
  expiresIn: string;
  /** 不透明随机串（非 JWT），用于 `POST /api/auth/v1/refresh` */
  refreshToken: string;
  /** refresh family 绝对死期（ISO8601 UTC）；到点须重新登录 */
  refreshExpiresAt: string;
}>;

/**
 * `GET /api/admin/v1/me` 的 `data`（后端 `AdminMeResponseDto`）。
 * `role` 仅用于展示 + 静态菜单粗粒度门控，**非授权依据**（细粒度看 permissions[]）。
 */
export type AdminMeResult = ApiEnvelope<{
  userId: string;
  username: string;
  email: string | null;
  nickname: string | null;
  /** 头像 attachment key（非完整 URL，渲染需另行换签名 URL） */
  avatarKey: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "USER";
  status: "ACTIVE" | "DISABLED";
  lastLoginAt: string | null;
  memberId: string | null;
}>;

/**
 * `GET /api/system/v1/rbac/me/permissions` 的 `data`（后端 `MyPermissionsResponseDto`）。
 */
export type MyPermissionsResult = ApiEnvelope<{
  /** 真实点格式权限码（SUPER_ADMIN 返回全集）；前端 `v-auth`/`hasPerms` 直接 `includes` */
  permissions: Array<string>;
  /** RBAC 业务角色（SUPER_ADMIN 可能为空数组） */
  effectiveRoles: Array<{ code: string; displayName: string }>;
}>;

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<LoginResult>("post", "/api/auth/v1/login", { data });
};

/** 刷新 `accessToken`（rotation：同时换发新 `refreshToken`） */
export const refreshTokenApi = (data?: object) => {
  return http.request<LoginResult>("post", "/api/auth/v1/refresh", { data });
};

/** 当前登录管理员身份（登录后用户信息唯一源） */
export const getAdminMe = () => {
  return http.request<AdminMeResult>("get", "/api/admin/v1/me");
};

/** 当前登录用户的 RBAC 权限码 + 业务角色 */
export const getMyPermissions = () => {
  return http.request<MyPermissionsResult>(
    "get",
    "/api/system/v1/rbac/me/permissions"
  );
};

/** 注销（后端幂等：refreshToken 不存在/已撤销/已过期均 200） */
export type LogoutResult = ApiEnvelope<null>;

/** 注销全部（撤销当前用户名下所有 refresh token family） */
export type LogoutAllResult = ApiEnvelope<{ revokedCount: number }>;

/** 登出当前会话：撤销这一条 `refreshToken`（guide §2） */
export const logoutApi = (data: { refreshToken: string }) => {
  return http.request<LogoutResult>("post", "/api/auth/v1/logout", { data });
};

/** 登出全部会话：撤销当前用户名下所有 refresh token family（guide §2） */
export const logoutAllApi = () => {
  return http.request<LogoutAllResult>("post", "/api/auth/v1/logout-all");
};
