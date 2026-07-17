# fork 40100 被动刷新参考实现(存档)

> **性质**:历史存档(`docs/archive/**`,背景层,不当当前事实)。v7.11.0 fork 于 2026-07-17 经维护者拍板**弃置**,其全部增量已合流 main——唯一例外是本文件保存的 **40100 被动刷新重试**参考实现(Auth 专线待移植项,main 现只有主动预刷新)。
> **用法**:仅供 Auth 专线移植 40100 时参考;接口/字段/其余写法一律以 main 现状与 live 契约为准;**移植落地后本文件即可删除**。auth 文件属 ask 档,动它前按 AGENTS.md §2「auth 申报制」申报。

## fork 版 src/utils/http/index.ts 全文(核心在响应拦截器 40100 分支)

```typescript
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
import { getToken, formatToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";

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

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** 正在执行的 refresh promise；并发请求复用同一次刷新，避免队列悬挂 */
  private static refreshPromise: Promise<string> | null = null;

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前`Axios`实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 登录 / 刷新端点不参与自动刷新，避免凭证失败时死循环 */
  private static isAuthEndpoint(url?: string): boolean {
    const whiteList = ["/api/auth/v1/login", "/api/auth/v1/refresh"];
    return !!url && whiteList.some(item => url.endsWith(item));
  }

  /** refresh 失败后的统一退出处理 */
  private static handleRefreshFailure(error: unknown): Promise<never> {
    useUserStoreHook().logOut();
    message("登录已过期，请重新登录", { type: "warning" });
    return Promise.reject(error);
  }

  /** 刷新 accessToken，并让并发请求共用同一个 refresh promise */
  private static refreshAccessToken(refreshToken: string): Promise<string> {
    if (!PureHttp.refreshPromise) {
      PureHttp.refreshPromise = useUserStoreHook()
        .handRefreshToken({ refreshToken })
        .then(res => res.data.accessToken)
        .catch(error => PureHttp.handleRefreshFailure(error))
        .finally(() => {
          PureHttp.refreshPromise = null;
        });
    }
    return PureHttp.refreshPromise;
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }
        /** 请求白名单，放置一些不需要`token`的接口（通过设置请求白名单，防止`token`过期后再请求造成的死循环问题） */
        // 登录 / 刷新 两端点不参与「过期自动刷新」逻辑，避免凭证失败时死循环（guide §3 gotcha A）
        if (PureHttp.isAuthEndpoint(config.url)) return config;

        const data = getToken();
        if (!data) return config;

        const expired = Number(data.expires) - Date.now() <= 0;
        if (expired) {
          if (!data.refreshToken) {
            return PureHttp.handleRefreshFailure(
              new Error("Missing refreshToken")
            );
          }
          const token = await PureHttp.refreshAccessToken(data.refreshToken);
          config.headers = config.headers ?? {};
          config.headers["Authorization"] = formatToken(token);
          return config;
        }

        config.headers = config.headers ?? {};
        config.headers["Authorization"] = formatToken(data.accessToken);
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /** 响应拦截 */
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse) => {
        const $config = response.config;
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }
        return response.data;
      },
      (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);
        const response = $error.response as any;
        const originalConfig = ($error.config ??
          {}) as PureHttpRequestConfig & {
          __isRetryRequest?: boolean;
        };

        // 后端 JwtGuard 返回 40100 表示 access 失效：尝试 refresh 后重放原请求。
        // 登录失败(10004)与 refresh 失败(10007)同为 401，但不应触发自动刷新。
        if (
          response?.data?.code === 40100 &&
          !originalConfig.__isRetryRequest &&
          !PureHttp.isAuthEndpoint(originalConfig.url)
        ) {
          const tokenInfo = getToken();
          if (!tokenInfo?.refreshToken) {
            useUserStoreHook().logOut();
            return Promise.reject($error);
          }
          originalConfig.__isRetryRequest = true;

          return PureHttp.refreshAccessToken(tokenInfo.refreshToken).then(
            token => {
              originalConfig.headers = originalConfig.headers ?? {};
              originalConfig.headers["Authorization"] = formatToken(token);
              return instance.request(originalConfig);
            }
          );
        }

        // 所有的响应异常 区分来源为取消请求/非取消请求
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

export const http = new PureHttp();
```

## 附:fork 版 src/utils/auth.ts 相对 main 的差异(仅 refreshExpiresAt 持久化一处有信息量)

```diff
91a92
>       refreshExpiresAt: data.refreshExpiresAt,
111,113c112,115
<     // 登录第一段只拿到 token，身份/权限还没取回；existing 为空说明是全新会话，
<     // 不要写入一份空壳 user-info，否则权限接口失败时会残留"已登录但 permissions 为空"的幽灵状态。
<     if (!existing?.username) return;
---
>     const username = existing?.username ?? "";
>     // 登录第一段只拿到 token，身份/权限还没取回；不要写入空 user-info，
>     // 否则权限接口失败时会残留“已登录但 permissions 为空”的幽灵状态。
>     if (!username) return;
116c118
<       username: existing.username,
---
>       username,
```
