/**
 * 翻页拉全量：反复请求下一页并累计，直到累计条数 ≥ total、返回空页、或命中安全上限。
 * 收敛 dictionaries / attendances / workbench 等页各自手写的「绕过后端 pageSize=100
 * 硬上限、循环拉全量」样板。纯异步、无响应式；请求失败（code≠0）时静默返回已累计部分
 * （与各原站点一致：不抛错、返回目前拿到的）。
 *
 * 三种停机条件（任一命中即停）：累计 ≥ 末次响应 total、后端返回空页、累计 ≥ maxItems。
 * 外加 maxPages 安全上限，防止后端 total 抖动 / 空页导致死循环（原 members 循环无页上限，
 * 收编后由默认 maxPages=50 兜底，属防御性增强，正常路径行为不变）。
 *
 * @param fetchPage (page, pageSize) => 后端分页信封 `{ code, data: { items, total } }`
 * @param options.pageSize 每页条数，默认 100（后端硬上限）
 * @param options.maxPages 安全翻页上限，默认 50
 * @param options.maxItems 累计条数上限；达到即停（用于「拉够 N 条即可」的本地搜索预取，
 *                         如队员选项预取 ≤1000；注意末页可能小幅超出，调用方按需再 slice）
 * @returns `{ items: 全部累计项, total: 末次响应的总数 }`
 */
export async function fetchAllPages<T>(
  fetchPage: (
    page: number,
    pageSize: number
  ) => Promise<{ code: number; data: { items: T[]; total: number } }>,
  options: { pageSize?: number; maxPages?: number; maxItems?: number } = {}
): Promise<{ items: T[]; total: number }> {
  const pageSize = options.pageSize ?? 100;
  const maxPages = options.maxPages ?? 50;
  const maxItems = options.maxItems ?? Infinity;
  const items: T[] = [];
  let total = 0;
  for (let page = 1; page <= maxPages; page++) {
    const { code, data } = await fetchPage(page, pageSize);
    if (code !== 0) break;
    items.push(...data.items);
    total = data.total;
    if (
      items.length >= total ||
      data.items.length === 0 ||
      items.length >= maxItems
    ) {
      break;
    }
  }
  return { items, total };
}
