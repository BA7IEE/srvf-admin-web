import { defineStore } from "pinia";
import {
  type userType,
  store,
  router,
  resetRouter,
  routerArrays,
  storageLocal
} from "../utils";
import {
  type UserResult,
  type CurrentUserResult,
  type RefreshTokenResult,
  getLogin,
  getCurrentUser,
  refreshTokenApi
} from "@/api/user";
import { useMultiTagsStoreHook } from "./multiTags";
import {
  type DataInfo,
  setToken,
  removeToken,
  parseExpiresIn,
  userKey
} from "@/utils/auth";

export const useUserStore = defineStore("pure-user", {
  state: (): userType => ({
    // 头像
    avatar: storageLocal().getItem<DataInfo<number>>(userKey)?.avatar ?? "",
    // 用户名
    username: storageLocal().getItem<DataInfo<number>>(userKey)?.username ?? "",
    // 昵称
    nickname: storageLocal().getItem<DataInfo<number>>(userKey)?.nickname ?? "",
    // 页面级别权限
    roles: storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [],
    // 按钮级别权限
    permissions:
      storageLocal().getItem<DataInfo<number>>(userKey)?.permissions ?? [],
    // 是否勾选了登录页的免登录
    isRemembered: false,
    // 登录页的免登录存储几天，默认7天
    loginDay: 7
  }),
  actions: {
    /** 存储头像 */
    SET_AVATAR(avatar: string) {
      this.avatar = avatar;
    },
    /** 存储用户名 */
    SET_USERNAME(username: string) {
      this.username = username;
    },
    /** 存储昵称 */
    SET_NICKNAME(nickname: string) {
      this.nickname = nickname;
    },
    /** 存储角色 */
    SET_ROLES(roles: Array<string>) {
      this.roles = roles;
    },
    /** 存储按钮级别权限 */
    SET_PERMS(permissions: Array<string>) {
      this.permissions = permissions;
    },
    /** 存储是否勾选了登录页的免登录 */
    SET_ISREMEMBERED(bool: boolean) {
      this.isRemembered = bool;
    },
    /** 设置登录页的免登录存储几天 */
    SET_LOGINDAY(value: number) {
      this.loginDay = Number(value);
    },
    /**
     * 登入（PR-4：两步登录流程）
     *   Step 1. POST /api/auth/login   → 拿 accessToken / expiresIn
     *   Step 2. GET  /api/users/me     → 拿 user 身份（role / username / nickname / avatarKey）
     *
     * 后端单值 `role` 在此处映射为 `roles = [user.role]`，与既有路由 meta.roles: string[] 适配。
     * `permissions` 第一阶段固定 `[]`（详见 docs/srvf-frontend-derivation.md §4.x 细粒度权限可选）。
     *
     * 失败处理：
     * - 登录非 0 code（含 10004 / 42900）→ reject，message 由 http 拦截器统一弹出；
     * - /me 调用失败 → 清理已写入的 token，避免"半登录"状态。
     */
    async loginByUsername(data) {
      const loginRes: UserResult = await getLogin(data);
      if (loginRes.code !== 0) {
        return Promise.reject(loginRes.message);
      }

      const { accessToken, expiresIn } = loginRes.data;
      // 严格解析 expiresIn；解析失败抛错，由本 Promise reject 出去
      const expires = parseExpiresIn(expiresIn);

      // 先写入最小 token（roles 还没拿到，先用 storage 已有值占位）
      setToken({ accessToken, expires });

      // Step 2：拉本人资料
      let meRes: CurrentUserResult;
      try {
        meRes = await getCurrentUser();
      } catch (err) {
        // /me 失败：清理"半登录"状态，避免后续守卫误判
        removeToken();
        this.roles = [];
        this.permissions = [];
        throw err;
      }

      if (meRes.code !== 0) {
        removeToken();
        this.roles = [];
        this.permissions = [];
        return Promise.reject(meRes.message);
      }

      const me = meRes.data;
      // 后端单角色 → 前端单元素 roles 数组；permissions 第一阶段留空
      setToken({
        accessToken,
        expires,
        username: me.username,
        nickname: me.nickname ?? me.username,
        avatar: me.avatarKey ?? "",
        roles: [me.role],
        permissions: []
      });

      return loginRes;
    },
    /** 前端登出（不调用接口；后端无 logout 接口） */
    logOut() {
      this.username = "";
      this.roles = [];
      this.permissions = [];
      removeToken();
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      router.push("/login");
    },
    /**
     * @deprecated PR-4：后端不支持 refresh-token。本方法保留作为兼容 stub，
     * 任何路径不应再调用它（src/utils/http/index.ts 的请求拦截器已移除"过期 → refresh"分支）。
     */
    async handRefreshToken(data) {
      return new Promise<RefreshTokenResult>((resolve, reject) => {
        refreshTokenApi(data)
          .then(data => {
            if (data.code === 0) {
              setToken(data.data as unknown as DataInfo<number>);
              resolve(data);
            } else {
              reject(data.message);
            }
          })
          .catch(error => {
            reject(error);
          });
      });
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
