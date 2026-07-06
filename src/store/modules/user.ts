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
  type LoginResult,
  getLogin,
  refreshTokenApi,
  getAdminMe,
  getMyPermissions,
  logoutApi
} from "@/api/user";
import { useMultiTagsStoreHook } from "./multiTags";
import {
  type DataInfo,
  getToken,
  setToken,
  removeToken,
  userKey,
  parseDurationMs
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
     * 登入（NestJS 真实后端：登录 + 身份 + 权限「三段式」组合）
     * 见 docs/srvf-api-integration-guide.md §4。
     */
    async loginByUsername(data): Promise<LoginResult> {
      try {
        const res = await getLogin(data); // POST /api/auth/v1/login
        // 业务失败是 HTTP 4xx，axios 已 reject 进 catch；此处再防御性校验
        if (res?.code !== 0) {
          return Promise.reject(res?.message ?? "登录失败");
        }
        const t = res.data;
        // gotcha B：expiresIn 是 "15m" 时长串，需现算 access 过期时间戳
        const expires = Date.now() + parseDurationMs(t.expiresIn);
        // 先落 token，后面两个 authed 请求才能带上 Authorization
        setToken({
          accessToken: t.accessToken,
          refreshToken: t.refreshToken,
          expires,
          refreshExpiresAt: t.refreshExpiresAt
        });
        // 身份 + 权限（两个 authed 端点并行取）
        const [meRes, permRes] = await Promise.all([
          getAdminMe(), // GET /api/admin/v1/me
          getMyPermissions() // GET /api/system/v1/rbac/me/permissions
        ]);
        const me = meRes.data;
        const perm = permRes.data;
        // 组装进 user store 期望形状并持久化。
        // roles 用「系统角色」(me.role) 驱动静态菜单粗粒度门控
        //   （src/router/modules/srvf.ts 的 meta.roles 用的就是 SUPER_ADMIN/ADMIN），
        //   并附带 RBAC 业务角色 code；真正的按钮级鉴权用 permissions[]（真实点格式码）。
        setToken({
          accessToken: t.accessToken,
          refreshToken: t.refreshToken,
          expires,
          refreshExpiresAt: t.refreshExpiresAt,
          avatar: me.avatarKey ?? "",
          username: me.username,
          nickname: me.nickname ?? me.username,
          roles: Array.from(
            new Set([me.role, ...perm.effectiveRoles.map(r => r.code)])
          ),
          permissions: perm.permissions
        });
        return res;
      } catch (error: any) {
        // 登录后续任一步（/me、/permissions）失败都要清理已经落盘的半截 token，
        // 否则会残留"cookie 里 token 有效、但 username/roles/permissions 为空"的幽灵登录态。
        this.username = "";
        this.nickname = "";
        this.avatar = "";
        this.roles = [];
        this.permissions = [];
        removeToken();
        // gotcha A：业务体在 err.response.data.{code,message}
        return Promise.reject(
          error?.response?.data?.message ?? error?.message ?? error
        );
      }
    },
    /**
     * 登出：先尽力撤销后端 `refreshToken`（`POST /api/auth/v1/logout`，
     * 幂等且 best-effort——失败/超时也不阻塞前端清理，否则网络问题会让用户卡在退不出去），
     * 再清本地态。不 await：调用方（导航栏 / http 拦截器 401 兜底）历来把它当同步函数用。
     */
    logOut() {
      const data = getToken();
      if (data?.refreshToken) {
        logoutApi({ refreshToken: data.refreshToken }).catch(() => {});
      }
      this.username = "";
      this.roles = [];
      this.permissions = [];
      removeToken();
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      router.push("/login");
    },
    /** 刷新`token`（rotation：换发新 access + 新 refresh，并重算 expires） */
    async handRefreshToken(data): Promise<LoginResult> {
      try {
        const res = await refreshTokenApi(data); // POST /api/auth/v1/refresh, data={refreshToken}
        if (res?.code !== 0) {
          return Promise.reject(res?.message ?? "刷新失败");
        }
        const t = res.data;
        setToken({
          accessToken: t.accessToken,
          refreshToken: t.refreshToken,
          expires: Date.now() + parseDurationMs(t.expiresIn),
          refreshExpiresAt: t.refreshExpiresAt
        });
        return res;
      } catch (error) {
        return Promise.reject(error);
      }
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
