import Cookies from "js-cookie";
import { useUserStoreHook } from "@/store/modules/user";
import { storageLocal, isString, isIncludeAllChildren } from "@pureadmin/utils";

export interface DataInfo<T> {
  /** token */
  accessToken: string;
  /** `accessToken`的过期时间（时间戳） */
  expires: T;
  /** 用于调用刷新accessToken的接口时所需的token */
  refreshToken: string;
  /** refresh token family 绝对死期（ISO8601 UTC）；到点须重新登录（guide §3 gotcha B） */
  refreshExpiresAt?: string;
  /** 头像 */
  avatar?: string;
  /** 用户名 */
  username?: string;
  /** 昵称 */
  nickname?: string;
  /** 当前登录用户的角色 */
  roles?: Array<string>;
  /** 当前登录用户的按钮级别权限 */
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
 * @description 设置`token`以及一些必要信息并采用无感刷新`token`方案
 * 无感刷新：后端返回`accessToken`（访问接口使用的`token`）、`refreshToken`（用于调用刷新`accessToken`的接口时所需的`token`）、`expiresIn`（JWT 配置时长字符串，前端用 `parseDurationMs` 现算出 `expires` 时间戳）、`refreshExpiresAt`（refresh token family 的绝对死期）
 * 将`accessToken`、`expires`、`refreshToken`、`refreshExpiresAt`这四条信息放在key值为authorized-token的cookie里（过期自动销毁）
 * 将`avatar`、`username`、`nickname`、`roles`、`permissions`、`refreshToken`、`expires`这些信息放在key值为`user-info`的localStorage里（利用`multipleTabsKey`当浏览器完全关闭后自动销毁）
 */
export function setToken(data: DataInfo<Date | number>) {
  let expires = 0;
  const { accessToken, refreshToken } = data;
  const { isRemembered, loginDay } = useUserStoreHook();
  // PR-4：`expires` 通常是前端用 `parseDurationMs(expiresIn)` 现算的时间戳（number, ms）；
  // 兼容 SSO 等仍传 `Date`/字符串 的旧路径（guide §3 gotcha B）。
  expires =
    typeof data.expires === "number"
      ? data.expires
      : new Date(data.expires).getTime();
  const cookieString = JSON.stringify({
    accessToken,
    expires,
    refreshToken,
    refreshExpiresAt: data.refreshExpiresAt
  });

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
    const existing = storageLocal().getItem<DataInfo<number>>(userKey);
    // 登录第一段只拿到 token，身份/权限还没取回；existing 为空说明是全新会话，
    // 不要写入一份空壳 user-info，否则权限接口失败时会残留"已登录但 permissions 为空"的幽灵状态。
    if (!existing?.username) return;
    setUserKey({
      avatar: existing?.avatar ?? "",
      username: existing.username,
      nickname: existing?.nickname ?? "",
      roles: existing?.roles ?? [],
      permissions: existing?.permissions ?? []
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

/**
 * 把后端 `expiresIn`（JWT 配置时长字符串，如 `"15m"`/`"3600s"`/`"2h"`/`"7d"`，或纯数字秒）解析为毫秒。
 * 见 guide §3 gotcha B：`expiresIn` 是时长串、不是时间戳；
 * 解析失败回退 15 分钟，避免 0 值导致「每请求都判过期 → 刷新风暴」。
 */
export function parseDurationMs(expiresIn: string | number): number {
  const FALLBACK = 15 * 60 * 1000;
  if (typeof expiresIn === "number")
    return expiresIn > 0 ? expiresIn : FALLBACK;
  if (!expiresIn) return FALLBACK;
  const s = String(expiresIn).trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10) * 1000; // 纯数字按秒（JWT 约定）
  const matched = s.match(/^(\d+)\s*(ms|s|m|h|d)$/i);
  if (!matched) return FALLBACK;
  const n = parseInt(matched[1], 10);
  const unit = matched[2].toLowerCase();
  const multiplier =
    unit === "ms"
      ? 1
      : unit === "s"
        ? 1000
        : unit === "m"
          ? 60 * 1000
          : unit === "h"
            ? 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;
  return n * multiplier;
}

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
