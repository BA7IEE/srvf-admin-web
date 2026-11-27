/**
 * 登录成功后的落点。
 * 产品路径：未登录访问业务哈希（如 #/srvf/org-hr/memberships）被送到登录页后，
 * 登录成功应回到原目标，而不是无条件进入顶栏首页 /welcome。
 * 没有安全的既有目标时，行为与原来一致，进入顶栏菜单。
 * 登录过程中若当前哈希已经是业务页，也予以保留。
 */

export const POST_LOGIN_TARGET_KEY = "srvf-admin-login-target";

function sessionStore(): Storage | undefined {
  try {
    if (typeof sessionStorage === "undefined") return undefined;
    return sessionStorage;
  } catch {
    return undefined;
  }
}

/** 只接受站内相对路径，拒绝外链、协议相对地址和登录页本身。 */
export function sanitizeInternalTarget(
  raw: string | undefined | null
): string | undefined {
  if (raw == null) return undefined;
  let value = String(raw).trim();
  if (!value) return undefined;
  try {
    value = decodeURIComponent(value);
  } catch {
    return undefined;
  }
  value = value.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return undefined;
  }
  if (value.includes("://")) return undefined;
  const pathname = value.split("#")[0].split("?")[0];
  if (!pathname || pathname === "/" || pathname === "/login") return undefined;
  return value;
}

export function rememberPostLoginTarget(
  raw: string | undefined | null
): string | undefined {
  const target = sanitizeInternalTarget(raw);
  const store = sessionStore();
  if (target && store) store.setItem(POST_LOGIN_TARGET_KEY, target);
  return target;
}

export function clearPostLoginTarget(): void {
  sessionStore()?.removeItem(POST_LOGIN_TARGET_KEY);
}

export function takePostLoginTarget(queryRedirect?: unknown): string | undefined {
  const raw = Array.isArray(queryRedirect) ? queryRedirect[0] : queryRedirect;
  const fromQuery = sanitizeInternalTarget(
    typeof raw === "string" ? raw : undefined
  );
  const fromStore = sanitizeInternalTarget(
    sessionStore()?.getItem(POST_LOGIN_TARGET_KEY)
  );
  const target = fromQuery || fromStore;
  clearPostLoginTarget();
  return target;
}

/**
 * @param currentPath 登录完成时的当前路由
 * @param topMenuPath 无目标时的顶栏首页
 * @param preservedPath 登录前记住的目标（query redirect 或 sessionStorage）
 */
export function resolvePostLoginPath(
  currentPath: string | undefined,
  topMenuPath: string | undefined,
  preservedPath?: string
): string {
  const fallback = topMenuPath || "/welcome";
  const preserved = sanitizeInternalTarget(preservedPath);
  if (preserved) return preserved;
  const current = sanitizeInternalTarget(currentPath);
  if (current) return current;
  return fallback;
}
