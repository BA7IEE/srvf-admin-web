/**
 * 登录成功后的落点：若此时路由已经离开 /login（例如登录请求返回后、
 * initRouter 完成前，外部把哈希改到了业务页），不要再强推首页/顶栏菜单，
 * 以免把已命中的业务哈希覆盖成 /welcome。
 */
export function resolvePostLoginPath(
  currentPath: string | undefined,
  topMenuPath: string | undefined
): string {
  const fallback = topMenuPath || "/welcome";
  if (!currentPath) return fallback;
  const path = currentPath.split("#")[0].split("?")[0];
  if (!path || path === "/" || path === "/login") return fallback;
  return currentPath;
}
