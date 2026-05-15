import Cookies from "js-cookie";
import { useUserStoreHook } from "@/store/modules/user";
import { storageLocal, isString, isIncludeAllChildren } from "@pureadmin/utils";

export interface DataInfo<T> {
  /** token */
  accessToken: string;
  /** `accessToken`的过期时间（时间戳，单位 ms） */
  expires: T;
  /**
   * PR-4：后端不支持 refresh-token，本字段改为可选；仅为继承自上游 starter 的字段兼容，
   * 实际写入时统一传空串 ""（占位）。不允许引入实际刷新逻辑。
   */
  refreshToken?: string;
  /** 头像（PR-4：来自 GET /api/users/me 的 avatarKey；可空） */
  avatar?: string;
  /** 用户名 */
  username?: string;
  /** 昵称 */
  nickname?: string;
  /**
   * 当前登录用户的角色。
   * 后端是**单角色字段** `role: SUPER_ADMIN | ADMIN | USER`；前端 store 把单值映射为
   * `roles = [user.role]`，与既有路由 meta.roles: string[] 适配（详见
   * docs/pure-admin/04-auth-permission.md §6.6.2）。
   */
  roles?: Array<string>;
  /**
   * 当前登录用户的按钮级别权限。
   * PR-4 第一阶段固定为 []，第二阶段可调 GET /api/v2/rbac/me/permissions 填充。
   */
  permissions?: Array<string>;
}

export const userKey = "user-info";
export const TokenKey = "authorized-token";
/**
 * 通过`multiple-tabs`是否在`cookie`中，判断用户是否已经登录系统，
 * 从而支持多标签页打开已经登录的系统后无需再登录。
 * 浏览器完全关闭后`multiple-tabs`将自动从`cookie`中销毁，
 * 再次打开浏览器需要重新登录系统
 * */
export const multipleTabsKey = "multiple-tabs";

/** 获取`token` */
export function getToken(): DataInfo<number> {
  // 此处与`TokenKey`相同，此写法解决初始化时`Cookies`中不存在`TokenKey`报错
  return Cookies.get(TokenKey)
    ? JSON.parse(Cookies.get(TokenKey))
    : storageLocal().getItem(userKey);
}

/**
 * 解析后端 `expiresIn` 的 JWT duration 字符串为相对当前时间的 ms 时间戳。
 *
 * 支持格式（来自 jsonwebtoken 配置 JWT_EXPIRES_IN 的常见取值）：
 *   - `30s`  → 30 秒
 *   - `15m`  → 15 分钟
 *   - `1h`   → 1 小时
 *   - `7d`   → 7 天
 *
 * 严格模式：解析失败直接 throw（**禁止静默给默认 1 天**）。这是**登录契约错误**——
 * 后端 JWT_EXPIRES_IN 配置错误或返回值异常应当让登录失败而不是悄悄通过。
 *
 * 引用：docs/pure-admin/05-http-api.md §7.5 expires 适配规则；
 *      docs/srvf-frontend-derivation.md §4 Q3 `expiresIn` decision。
 */
export function parseExpiresIn(s: string): number {
  if (typeof s !== "string" || s.length === 0) {
    throw new Error(
      `[auth.parseExpiresIn] 后端返回的 expiresIn 不是非空字符串：${JSON.stringify(s)}`
    );
  }
  const m = /^\s*(\d+)\s*([smhd])\s*$/.exec(s);
  if (!m) {
    throw new Error(
      `[auth.parseExpiresIn] 不识别的 expiresIn 格式："${s}"；仅支持 '\\d+(s|m|h|d)'`
    );
  }
  const n = Number(m[1]);
  const unit = m[2];
  const unitMs =
    unit === "s"
      ? 1000
      : unit === "m"
        ? 60 * 1000
        : unit === "h"
          ? 60 * 60 * 1000
          : 24 * 60 * 60 * 1000;
  return Date.now() + n * unitMs;
}

/**
 * @description 设置`token`以及一些必要信息。
 *
 * PR-4：
 * - 后端不支持 refresh-token，本函数不再依赖 `refreshToken` 字段；如调用方仍传该字段则原样存储（兼容字段，但前端任何路径都不会调用刷新接口）。
 * - 过期时间统一使用 ms 时间戳（`DataInfo<number>`）；登录链路由 store 调 `parseExpiresIn` 解析后传入。
 * - 形参类型兼容 `DataInfo<number | Date>`：保留对老调用方（如 `src/utils/sso.ts`，传入 URL query map 强转 `DataInfo<Date>`）的兼容；函数内统一把 Date / 字符串日期转为 ms。
 * - 将`accessToken`、`expires`、`refreshToken`（可选）这三条信息放在 key 值为 authorized-token 的 cookie 里（过期自动销毁）。
 * - 将`avatar`、`username`、`nickname`、`roles`、`permissions`、`refreshToken`、`expires`这七条信息放在 key 值为`user-info`的 localStorage 里（利用`multipleTabsKey`当浏览器完全关闭后自动销毁）。
 */
export function setToken(data: DataInfo<number> | DataInfo<Date>) {
  const { accessToken } = data;
  const refreshToken = data.refreshToken ?? "";
  const { isRemembered, loginDay } = useUserStoreHook();
  // 兼容 ms 时间戳与 Date：sso.ts 走 URL query 强转 Date 路径；PR-4 登录走 ms 路径
  let expires = 0;
  const rawExpires = data.expires as unknown;
  if (typeof rawExpires === "number" && Number.isFinite(rawExpires)) {
    expires = rawExpires;
  } else if (rawExpires instanceof Date) {
    expires = rawExpires.getTime();
  } else if (typeof rawExpires === "string" && rawExpires.length > 0) {
    // sso.ts 来路：URL query 拿到的字符串日期；保留与上游 starter 一致的兜底
    expires = new Date(rawExpires).getTime();
    if (!Number.isFinite(expires)) expires = 0;
  }
  const cookieString = JSON.stringify({ accessToken, expires, refreshToken });

  expires > 0
    ? Cookies.set(TokenKey, cookieString, {
        expires: (expires - Date.now()) / 86400000
      })
    : Cookies.set(TokenKey, cookieString);

  Cookies.set(
    multipleTabsKey,
    "true",
    isRemembered
      ? {
          expires: loginDay
        }
      : {}
  );

  function setUserKey({ avatar, username, nickname, roles, permissions }) {
    useUserStoreHook().SET_AVATAR(avatar);
    useUserStoreHook().SET_USERNAME(username);
    useUserStoreHook().SET_NICKNAME(nickname);
    useUserStoreHook().SET_ROLES(roles);
    useUserStoreHook().SET_PERMS(permissions);
    storageLocal().setItem(userKey, {
      refreshToken,
      expires,
      avatar,
      username,
      nickname,
      roles,
      permissions
    });
  }

  if (data.username && data.roles) {
    const { username, roles } = data;
    setUserKey({
      avatar: data?.avatar ?? "",
      username,
      nickname: data?.nickname ?? "",
      roles,
      permissions: data?.permissions ?? []
    });
  } else {
    const avatar =
      storageLocal().getItem<DataInfo<number>>(userKey)?.avatar ?? "";
    const username =
      storageLocal().getItem<DataInfo<number>>(userKey)?.username ?? "";
    const nickname =
      storageLocal().getItem<DataInfo<number>>(userKey)?.nickname ?? "";
    const roles =
      storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [];
    const permissions =
      storageLocal().getItem<DataInfo<number>>(userKey)?.permissions ?? [];
    setUserKey({
      avatar,
      username,
      nickname,
      roles,
      permissions
    });
  }
}

/** 删除`token`以及key值为`user-info`的localStorage信息 */
export function removeToken() {
  Cookies.remove(TokenKey);
  Cookies.remove(multipleTabsKey);
  storageLocal().removeItem(userKey);
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
  return "Bearer " + token;
};

/** 是否有按钮级别的权限（根据登录接口返回的`permissions`字段进行判断）*/
export const hasPerms = (value: string | Array<string>): boolean => {
  if (!value) return false;
  const allPerms = "*:*:*";
  const { permissions } = useUserStoreHook();
  if (!permissions) return false;
  if (permissions.length === 1 && permissions[0] === allPerms) return true;
  const isAuths = isString(value)
    ? permissions.includes(value)
    : isIncludeAllChildren(value, permissions);
  return isAuths ? true : false;
};
