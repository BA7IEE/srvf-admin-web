/**
 * 跨域业务错误 → 人话文案（B4 全局兜底层）。
 *
 * 分层策略：
 * 1. 无 response（网络断/后端未启动/超时）→ 统一网络异常文案（原生 AxiosError.message 是英文）；
 * 2. 跨域通用业务码（码义来源 = 后端 handoff 文档，禁臆造）→ 本表翻译；
 * 3. 其余 → 后端 message（后端业务异常多为中文）→ 调用方兜底文案。
 *
 * 领域专用映射（如考勤终审 22074/22075、membership 冲突）仍由各自 api 层维护，
 * 调用侧链式组合：`finalReviewErrorMessage(code) ?? bizErrorMessage(error, "终审失败")`。
 */
type BizErrorLike = {
  response?: { data?: { code?: number; message?: string } };
};

/** 跨域通用业务码（仅收录多域复用的码；单域码留在各自 api 层） */
const GLOBAL_BIZ_ERROR_MESSAGE: Record<number, string> = {
  30100: "您没有执行此操作的权限，请联系管理员开通"
};

export function bizErrorMessage(error: unknown, fallback: string): string {
  const resp = (error as BizErrorLike)?.response;
  if (!resp) return `${fallback}：网络异常或服务不可用，请稍后重试`;
  const code = resp.data?.code;
  if (typeof code === "number" && GLOBAL_BIZ_ERROR_MESSAGE[code]) {
    return GLOBAL_BIZ_ERROR_MESSAGE[code];
  }
  return resp.data?.message ?? fallback;
}
