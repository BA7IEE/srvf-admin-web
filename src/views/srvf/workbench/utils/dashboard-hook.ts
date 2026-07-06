import { bizErrorMessage } from "@/api/srvf-error";
import { ref, computed, onMounted } from "vue";
import dayjs, { type Dayjs } from "dayjs";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { getActivities, type ActivityItem } from "@/api/srvf-activity";
import { getMembers } from "@/api/srvf-member";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

const TREND_WEEKS = 12;
/** 真实 activity_type 字典有 39 个细码，不是设计稿假设的 3 类——按本窗口内
 * 实际出现频次取前 N 类 + "其他" 汇总桶，不臆造语义分组（如"哪些码算行动/培训"）。 */
const TREND_TOP_TYPES = 4;
/** 单次分页上限，超出则继续翻页，避免活动量大时静默漏计 */
const FETCH_PAGE_SIZE = 100;
const FETCH_MAX_PAGES = 5;

function tokenColor(varName: string, fallback: string) {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return v || fallback;
}

/** 本地周一起点（不依赖 dayjs 全局 locale/周起点配置，自算，避免隐式假设）。 */
function mondayOf(d: Dayjs) {
  const day = d.day(); // 0=周日..6=周六
  const diffToMonday = day === 0 ? 6 : day - 1;
  return d.subtract(diffToMonday, "day").startOf("day");
}

/** 拉全量活动（按需翻页，安全上限 FETCH_MAX_PAGES 页）。 */
async function fetchAllActivities(dateFrom: string, dateTo: string) {
  const all: ActivityItem[] = [];
  for (let page = 1; page <= FETCH_MAX_PAGES; page++) {
    const { code, data } = await getActivities({
      dateFrom,
      dateTo,
      page,
      pageSize: FETCH_PAGE_SIZE
    });
    if (code !== 0) break;
    all.push(...data.items);
    if (all.length >= data.total) break;
  }
  return all;
}

/**
 * 工作台仪表盘补件：额外 KPI（在册队员/本月活动）+ 出勤趋势堆叠柱 + 活动日历。
 * 与既有 utils/hook.ts（审批横扫队列）职责分开，互不改动。
 */
export function useWorkbenchDashboard() {
  const canReadMembers = hasPerms("member.read.record");
  const dict = useSrvfDictStoreHook();

  /* -------------------- 额外 KPI：在册队员 / 本月活动 -------------------- */
  const memberTotal = ref<number | null>(null);
  const monthActivityTotal = ref<number | null>(null);

  async function loadExtraKpis() {
    const now = dayjs();
    const monthStart = now.startOf("month").toISOString();
    const monthEnd = now.endOf("month").toISOString();
    const tasks: Promise<void>[] = [];
    if (canReadMembers) {
      tasks.push(
        getMembers({ status: "ACTIVE", pageSize: 1 })
          .then(({ code, data }) => {
            if (code === 0) memberTotal.value = data.total;
          })
          .catch(() => {
            // 静默：额外 KPI 取不到不影响页面其它部分
          })
      );
    }
    tasks.push(
      getActivities({ dateFrom: monthStart, dateTo: monthEnd, pageSize: 1 })
        .then(({ code, data }) => {
          if (code === 0) monthActivityTotal.value = data.total;
        })
        .catch(() => {})
    );
    await Promise.all(tasks);
  }

  /* -------------------- 出勤趋势·近12周（按活动类型堆叠，度量=行动数） -------------------- */
  const trendLoading = ref(false);
  const trendWeeks = ref<string[]>([]);
  const trendSeries = ref<{ name: string; data: number[]; color: string }[]>(
    []
  );

  async function loadTrend() {
    trendLoading.value = true;
    try {
      const mondays: Dayjs[] = [];
      for (let i = TREND_WEEKS - 1; i >= 0; i--) {
        mondays.push(mondayOf(dayjs().subtract(i, "week")));
      }
      const from = mondays[0].toISOString();
      const to = dayjs().endOf("day").toISOString();

      const [items] = await Promise.all([
        fetchAllActivities(from, to),
        dict.ensureTypes(["activity_type"])
      ]);

      const bucketIndex = new Map(
        mondays.map((m, i) => [m.format("YYYY-MM-DD"), i])
      );

      // 按真实 activityTypeCode 统计本窗口内出现频次，纯客观排序取 top-N，不臆造分组语义
      const freq = new Map<string, number>();
      for (const item of items) {
        freq.set(
          item.activityTypeCode,
          (freq.get(item.activityTypeCode) ?? 0) + 1
        );
      }
      const sortedTypes = [...freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([t]) => t);
      const topTypes = sortedTypes.slice(0, TREND_TOP_TYPES);
      const hasOther = sortedTypes.length > TREND_TOP_TYPES;

      const OTHER_KEY = "__other__";
      const seriesMap = new Map<string, number[]>();
      for (const t of topTypes)
        seriesMap.set(t, new Array(TREND_WEEKS).fill(0));
      if (hasOther) seriesMap.set(OTHER_KEY, new Array(TREND_WEEKS).fill(0));

      for (const item of items) {
        const key = mondayOf(dayjs(item.startAt)).format("YYYY-MM-DD");
        const idx = bucketIndex.get(key);
        if (idx === undefined) continue; // 防御：查询范围外的数据不计入
        const seriesKey = topTypes.includes(item.activityTypeCode)
          ? item.activityTypeCode
          : OTHER_KEY;
        const arr = seriesMap.get(seriesKey);
        if (arr) arr[idx] += 1;
      }

      const palette = [
        tokenColor("--srvf-red", "#C4001B"),
        tokenColor("--srvf-navy", "#19478A"),
        tokenColor("--srvf-gold", "#C9A24A"),
        tokenColor("--srvf-navy-mid", "#2C5BA6")
      ];

      trendWeeks.value = mondays.map(m => m.format("MM-DD"));
      trendSeries.value = [
        ...topTypes.map((t, i) => ({
          name: dict.label("activity_type", t),
          data: seriesMap.get(t) ?? [],
          color: palette[i % palette.length]
        })),
        ...(hasOther
          ? [
              {
                name: "其他",
                data: seriesMap.get(OTHER_KEY) ?? [],
                color: tokenColor("--ink-300", "#9AA4B6")
              }
            ]
          : [])
      ];
    } catch (error: any) {
      message(bizErrorMessage(error, "加载出勤趋势失败"), {
        type: "error"
      });
    } finally {
      trendLoading.value = false;
    }
  }

  /* -------------------- 活动日历（当前可见月份有活动的日期） -------------------- */
  const calendarActivities = ref<ActivityItem[]>([]);
  const calendarLoading = ref(false);

  async function loadCalendarMonth(monthStart: Date | string) {
    calendarLoading.value = true;
    try {
      const start = dayjs(monthStart).startOf("month");
      const end = start.endOf("month");
      const items = await fetchAllActivities(
        start.toISOString(),
        end.toISOString()
      );
      calendarActivities.value = items;
    } catch (error: any) {
      message(bizErrorMessage(error, "加载活动日历失败"), {
        type: "error"
      });
    } finally {
      calendarLoading.value = false;
    }
  }

  const activitiesByDate = computed(() => {
    const map = new Map<string, ActivityItem[]>();
    for (const item of calendarActivities.value) {
      const key = dayjs(item.startAt).format("YYYY-MM-DD");
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return map;
  });

  function activitiesOnDate(dateStr: string) {
    return activitiesByDate.value.get(dateStr) ?? [];
  }

  onMounted(() => {
    loadExtraKpis();
    loadTrend();
    loadCalendarMonth(new Date());
  });

  return {
    canReadMembers,
    memberTotal,
    monthActivityTotal,
    trendLoading,
    trendWeeks,
    trendSeries,
    calendarLoading,
    activitiesOnDate,
    loadCalendarMonth
  };
}
