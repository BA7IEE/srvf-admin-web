import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import { message } from "@/utils/message";
import { getToken, formatToken, removeToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";

/**
 * PR-4：与 srvf-nest-api 对接的全局错误处理。
 *
 * 后端契约（详见 docs/srvf-frontend-derivation.md §4 + §4.x）：
 *   成功 → { code: 0, message: "ok", data: T }
 *   失败 → HTTP <status> + { code, message, data: null }
 *     - 40100 UNAUTHORIZED（HTTP 401）→ 清理登录态 + 跳 /login
 *     - 10004 LOGIN_FAILED  （HTTP 401）→ 弹"账号或密码错误"
 *     - 42900 TOO_MANY_REQUESTS（HTTP 429）→ 弹"请求过于频繁，请稍后再试"
 *     - 其他 4xxxx / 5xxxx → 弹 response.message
 *
 * 后端**不支持** refresh-token；本拦截器已移除"过期 → 静默刷新"分支：
 * accessToken 过期一律走 logOut + 跳 /login（裁决：禁止倒逼后端实现 refresh）。
 */

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  // 请求超时时间
  timeout: 10000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

/**
 * 已经触发过 logOut 的请求标记，避免并发 401 时反复弹"登录已过期"。
 * 单次会话内只允许触发一次"登录失效"重定向。
 */
let unauthorizedTriggered = false;

function triggerLogoutOnce(reason: string): void {
  if (unauthorizedTriggered) return;
  unauthorizedTriggered = true;
  removeToken();
  message(reason, { type: "warning" });
  try {
    useUserStoreHook().logOut();
  } catch {
    // 极端情况下 store 已被销毁；忽略。removeToken 已确保 cookie / localStorage 清空。
  }
}

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前`Axios`实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /**
   * 请求拦截
   *
   * PR-4：移除"过期 → refresh 队列重放"分支（后端无 refresh）。
   * - 有 token 且未过期 → 注入 Authorization
   * - 有 token 但过期    → 清理登录态 + 跳 /login（用户重新登录）
   * - 无 token            → 直接放行（业务侧 401 会由响应拦截器再兜底）
   */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        // 优先判断 post/get 等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }
        /** 请求白名单：不需要 token 的接口。`/auth/login` 是 PR-4 新登录路径；
         * `/login` / `/refresh-token` 保留兼容（mock 演示路径 + deprecated refresh stub）。
         * endsWith 匹配可同时命中 `/api/auth/login` 与 `/login`。 */
        const whiteList = ["/auth/login", "/refresh-token", "/login"];
        if (whiteList.some(url => config.url?.endsWith(url) ?? false)) {
          return config;
        }

        const data = getToken();
        if (!data) {
          return config;
        }
        const now = Date.now();
        const expires =
          typeof data.expires === "number"
            ? data.expires
            : Number(data.expires);
        if (Number.isFinite(expires) && expires > 0 && expires <= now) {
          // 过期：直接登出（后端无 refresh，不再尝试静默刷新）
          triggerLogoutOnce("登录已过期，请重新登录");
          // 仍把 config 返回出去；让响应阶段拿到 401 后不再重复弹提示
          return config;
        }
        config.headers["Authorization"] = formatToken(data.accessToken);
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * 响应拦截（PR-4）
   *
   * - 成功 2xx：透传 response.data（业务侧自行检查 code === 0）；
   *   - **额外**：若 response.data.code 非 0，按"业务错误"统一弹 message。登录失败码 10004
   *     单独弹"账号或密码错误"；其它直接用 backend message。仍 resolve 给业务侧 reject 处理。
   * - 失败（非 2xx）：
   *   - HTTP 401（含 code 40100 与 10004）：401 + 40100 → 强制 logOut + 跳 /login；
   *     401 + 10004 → 仅弹"账号或密码错误"，不退出登录（用户本来就没登录）；
   *   - HTTP 429（code 42900）：弹"请求过于频繁..."；
   *   - 其它：弹 backend message 或 HTTP statusText 兜底。
   *   - 一律 Promise.reject(error)，由调用方决定后续逻辑。
   */
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse) => {
        const $config = response.config;
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }
        // HTTP 2xx 但业务层 code 非 0：弹 message（特殊化登录失败 / 限流）。
        // 仍 resolve 给业务，让 store/页面自己决定 reject 处理。
        const body: any = response.data;
        if (
          body &&
          typeof body === "object" &&
          "code" in body &&
          body.code !== 0
        ) {
          handleBizMessage(body.code, body.message);
        }
        return response.data;
      },
      (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);
        if (!$error.isCancelRequest) {
          const status = $error.response?.status;
          const body: any = $error.response?.data;
          const bizCode =
            body && typeof body === "object" && "code" in body
              ? Number(body.code)
              : undefined;
          const bizMsg =
            body && typeof body === "object" && "message" in body
              ? String(body.message)
              : undefined;

          if (status === 401 && bizCode !== 10004) {
            // 真正的"未登录 / 登录已失效"：触发 logOut，但避免与请求拦截器重复弹提示
            triggerLogoutOnce(bizMsg ?? "登录已过期，请重新登录");
          } else if (status === 401 && bizCode === 10004) {
            // 账号或密码错误（防账号枚举：所有失败路径统一）
            message(bizMsg ?? "账号或密码错误", { type: "error" });
          } else if (status === 429 || bizCode === 42900) {
            message(bizMsg ?? "请求过于频繁，请稍后再试", { type: "warning" });
          } else if (bizMsg) {
            message(bizMsg, { type: "error" });
          }
        }
        return Promise.reject($error);
      }
    );
  }

  /** 通用请求工具函数 */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;

    // 单独处理自定义请求/响应回调
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: undefined) => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /** 单独抽离的`post`工具函数 */
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  /** 单独抽离的`get`工具函数 */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }
}

/**
 * 把后端 BizCode 统一翻译成用户可见的 message。
 * - 10004 LOGIN_FAILED → "账号或密码错误"
 * - 40100 UNAUTHORIZED → 由调用方 triggerLogoutOnce 单独处理（这里不弹，避免双重提示）
 * - 42900 TOO_MANY_REQUESTS → "请求过于频繁，请稍后再试"
 * - 其它非 0 → backend message
 */
function handleBizMessage(code: number, msg: string | undefined): void {
  if (code === 40100) {
    // 由上层 401 分支统一 triggerLogoutOnce，此处不再弹
    return;
  }
  if (code === 10004) {
    message(msg ?? "账号或密码错误", { type: "error" });
    return;
  }
  if (code === 42900) {
    message(msg ?? "请求过于频繁，请稍后再试", { type: "warning" });
    return;
  }
  if (msg) {
    message(msg, { type: "error" });
  }
}

export const http = new PureHttp();
