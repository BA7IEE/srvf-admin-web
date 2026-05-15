import { http } from "@/utils/http";

/**
 * PR-4：登录接口对接 srvf-nest-api。
 * 后端契约（详见 docs/srvf-frontend-derivation.md §4）：
 *   POST /api/auth/login
 *     入参：{ username, password }
 *     成功 data：{ accessToken: string; tokenType: "Bearer"; expiresIn: string ("7d" / "15m" 等) }
 *     失败 code：10004（账号或密码错误）、42900（限流）、40100（未登录）
 *
 * 后端**不支持** refresh-token；refreshTokenApi 保留为不调用的 deprecated stub，
 * 仅为继承自上游 starter 的链路完整性，不允许引入实际刷新逻辑（裁决：禁止倒逼后端实现 refresh）。
 */

export type LoginResult = {
  code: number;
  message: string;
  data: {
    /** JWT access token；前端拼 Authorization: Bearer <token> */
    accessToken: string;
    /** token 类型，恒为 "Bearer" */
    tokenType: "Bearer";
    /**
     * 过期时间 = JWT_EXPIRES_IN 原样回传的 duration 字符串（如 "7d" / "15m" / "1h" / "30s"）。
     * 既不是 unix ms 也不是 ISO 字符串；前端在 setToken 时调 parseExpiresIn 解析为本地 ms 时间戳。
     */
    expiresIn: string;
  };
};

/**
 * 兼容老命名：上游 starter 与登录页代码用 `UserResult` 作为登录返回类型别名，
 * 为最小变更保留同名 alias，禁止改名以免触发跨文件破坏（src/store/modules/user.ts 引用）。
 */
export type UserResult = LoginResult;

/**
 * 后端真实角色枚举（来自 srvf-nest-api/prisma/schema.prisma:enum Role）。
 * 注意：后端是**单角色字段** `role`，**不是数组 `roles`**。前端 store 会把单值映射成
 * `roles = [user.role]`，与既有路由 meta.roles: string[] 适配（详见
 * docs/pure-admin/04-auth-permission.md §6.6.2 演示角色名生命周期）。
 */
export type SrvfRole = "SUPER_ADMIN" | "ADMIN" | "USER";

export type SrvfUserStatus = "ACTIVE" | "DISABLED";

/**
 * GET /api/users/me 返回的 UserResponseDto。
 * 字段与后端 src/modules/users/users.dto.ts:UserResponseDto 1:1 对齐；
 * 后端如有新增字段必须在前端同步扩展类型，**不允许前端凭空添加字段**。
 */
export type CurrentUserResult = {
  code: number;
  message: string;
  data: {
    id: string;
    username: string;
    email: string | null;
    nickname: string | null;
    avatarKey: string | null;
    role: SrvfRole;
    status: SrvfUserStatus;
    createdAt: string;
    lastLoginAt: string | null;
    updatedAt: string;
  };
};

/**
 * 兼容老类型：refresh-token DTO。**后端当前不支持 refresh-token**，本类型仅保留作为
 * deprecated 兼容 stub；refreshTokenApi 不会被前端任何路径实际调用。
 */
export type RefreshTokenResult = {
  code: number;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expires: Date;
  };
};

/** 登录 — POST /api/auth/login（PR-4） */
export const getLogin = (data?: object) => {
  return http.request<UserResult>("post", "/api/auth/login", { data });
};

/** 当前登录用户资料 — GET /api/users/me（PR-4 新增） */
export const getCurrentUser = () => {
  return http.request<CurrentUserResult>("get", "/api/users/me");
};

/**
 * @deprecated PR-4：后端不支持 refresh-token。本函数保留作为兼容 stub，
 * 任何路径不应再调用它；调用会发起一个会被后端 404 拒绝的请求，但**不会**触发
 * 静默刷新（src/utils/http/index.ts 已移除"过期 → refresh 队列"分支）。
 */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>("post", "/refresh-token", { data });
};
