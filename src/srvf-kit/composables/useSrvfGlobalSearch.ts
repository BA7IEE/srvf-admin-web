import { ref, shallowRef } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import { useDebounceFn } from "@vueuse/core";
import { hasPerms } from "@/utils/auth";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import {
  useSrvfRecentsStoreHook,
  type SrvfRecentEntityType
} from "@/store/modules/srvfRecents";
import { getMembers } from "@/api/srvf-member";
import { getActivities } from "@/api/srvf-activity";
import { getOrgOptions } from "@/api/srvf-organization";
import {
  getContents,
  CONTENT_STATUS_LABEL,
  CONTENT_STATUS_TAG
} from "@/api/srvf-content";

export type SrvfStatusTagType =
  | "primary"
  | "success"
  | "info"
  | "warning"
  | "danger";

export interface SrvfSearchResultItem {
  type: SrvfRecentEntityType;
  id: string;
  title: string;
  subtitle?: string;
  /** 状态码；需配合分组的 statusLabelDict/statusTagDict 渲染，无状态概念的类型留空 */
  statusValue?: string;
  routeName?: string;
  routeParams?: Record<string, string>;
  path: string;
}

/** jump() 只需要这几个字段——SrvfSearchResultItem 和 SrvfRecentEntity 结构上都满足 */
export type SrvfJumpTarget = Pick<
  SrvfSearchResultItem,
  "type" | "id" | "title" | "subtitle" | "routeName" | "routeParams" | "path"
>;

export interface SrvfSearchResultGroup {
  type: SrvfRecentEntityType;
  label: string;
  items: SrvfSearchResultItem[];
  statusLabelDict?: Record<string, string>;
  statusTagDict?: Record<string, SrvfStatusTagType>;
}

const GROUP_LABEL: Record<SrvfRecentEntityType, string> = {
  member: "队员",
  activity: "活动",
  organization: "组织",
  content: "内容"
};

/** 每类并发查询的条数上限（面板是速查入口，不做完整分页） */
const SEARCH_LIMIT = 8;

const MEMBER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "在队",
  INACTIVE: "离队"
};
const MEMBER_STATUS_TAG: Record<string, SrvfStatusTagType> = {
  ACTIVE: "success",
  INACTIVE: "info"
};

/**
 * 活动状态 code → tag 颜色，镜像 activities/utils/hook.ts 的同名映射（仅展示色；
 * 文案仍查 activity_status 字典，前端不臆造，见下方 buildActivityStatusLabelDict）。
 */
const ACTIVITY_STATUS_TAG: Record<string, SrvfStatusTagType> = {
  draft: "info",
  published: "success",
  cancelled: "danger",
  completed: "primary"
};
const ACTIVITY_STATUS_CODES = Object.keys(ACTIVITY_STATUS_TAG);

/**
 * 全局实体搜索（P2-1）：按类型并发查队员/活动/组织/内容，分组返回。
 *
 * 搜索源以当前 `/api/docs-json` 契约为准，与任务书表格有出入（已核实、按现状收窄）：
 * - 组织：列表端点 `getOrganizations` 无 `q`，改用轻量投影 `getOrgOptions`（q 命中 name+code）；
 * - 内容：字段名是 `keyword`，不是 `q`；
 * - 通知：`NotificationListQuery` 没有任何关键词字段，本轮不纳入（不臆造参数）；
 * - 招新：任务书标注可选，本轮不纳入。
 *
 * 每类查询前先 `hasPerms` 预判（活动列表端点无 RBAC 读码，登录即可调，不设门）；
 * 请求失败（含 30100）静默丢弃该类型分组，不整体报错。
 */
export function useSrvfGlobalSearch() {
  const router = useRouter();
  const recents = useSrvfRecentsStoreHook();
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["activity_status"]);

  const keyword = ref("");
  const loading = ref(false);
  const groups = shallowRef<SrvfSearchResultGroup[]>([]);

  function buildActivityStatusLabelDict(): Record<string, string> {
    return Object.fromEntries(
      ACTIVITY_STATUS_CODES.map(code => [
        code,
        dict.label("activity_status", code)
      ])
    );
  }

  async function searchMembers(
    q: string
  ): Promise<SrvfSearchResultGroup | null> {
    if (!hasPerms("member.read.record")) return null;
    try {
      const { code, data } = await getMembers({ q, pageSize: SEARCH_LIMIT });
      if (code !== 0 || data.items.length === 0) return null;
      return {
        type: "member",
        label: GROUP_LABEL.member,
        statusLabelDict: MEMBER_STATUS_LABEL,
        statusTagDict: MEMBER_STATUS_TAG,
        items: data.items.map(m => ({
          type: "member" as const,
          id: m.id,
          title: m.displayName,
          subtitle: m.memberNo,
          statusValue: m.status,
          routeName: "SrvfMemberCockpit",
          routeParams: { id: m.id },
          path: `/srvf/members-domain/members/${m.id}`
        }))
      };
    } catch {
      return null;
    }
  }

  async function searchActivities(
    q: string
  ): Promise<SrvfSearchResultGroup | null> {
    // 活动列表端点是 [auth]-only、无 RBAC 读码（对齐 activities/utils/hook.ts 同一结论），不设 hasPerms 门。
    try {
      const { code, data } = await getActivities({ q, pageSize: SEARCH_LIMIT });
      if (code !== 0 || data.items.length === 0) return null;
      return {
        type: "activity",
        label: GROUP_LABEL.activity,
        statusLabelDict: buildActivityStatusLabelDict(),
        statusTagDict: ACTIVITY_STATUS_TAG,
        items: data.items.map(a => ({
          type: "activity" as const,
          id: a.id,
          title: a.title,
          subtitle: dayjs(a.startAt).format("YYYY-MM-DD HH:mm"),
          statusValue: a.statusCode,
          routeName: "SrvfActivityCockpit",
          routeParams: { id: a.id },
          path: `/srvf/activities-domain/activities/${a.id}`
        }))
      };
    } catch {
      return null;
    }
  }

  async function searchOrganizations(
    q: string
  ): Promise<SrvfSearchResultGroup | null> {
    if (!hasPerms("org.read.node")) return null;
    try {
      const { code, data } = await getOrgOptions({ q, limit: SEARCH_LIMIT });
      if (code !== 0 || data.items.length === 0) return null;
      return {
        type: "organization",
        label: GROUP_LABEL.organization,
        items: data.items.map(o => ({
          type: "organization" as const,
          id: o.id,
          title: o.label,
          subtitle: o.code ?? undefined,
          // 无独立作战室路由，跳组织架构页定位（现有列表页不支持按 id 高亮，见组件里的提示）
          path: "/srvf/base-data/organizations"
        }))
      };
    } catch {
      return null;
    }
  }

  async function searchContents(
    q: string
  ): Promise<SrvfSearchResultGroup | null> {
    if (!hasPerms("content.read.record")) return null;
    try {
      const { code, data } = await getContents({
        keyword: q,
        pageSize: SEARCH_LIMIT
      });
      if (code !== 0 || data.items.length === 0) return null;
      return {
        type: "content",
        label: GROUP_LABEL.content,
        statusLabelDict: CONTENT_STATUS_LABEL,
        statusTagDict: CONTENT_STATUS_TAG,
        items: data.items.map(c => ({
          type: "content" as const,
          id: c.id,
          title: c.title,
          statusValue: c.statusCode,
          // 无独立详情路由，跳内容列表页（现有列表页不支持按 id 高亮，见组件里的提示）
          path: "/srvf/content-domain/contents"
        }))
      };
    } catch {
      return null;
    }
  }

  async function runSearch(raw: string) {
    const q = raw.trim();
    if (!q) {
      groups.value = [];
      loading.value = false;
      return;
    }
    loading.value = true;
    try {
      const settled = await Promise.all([
        searchMembers(q),
        searchActivities(q),
        searchOrganizations(q),
        searchContents(q)
      ]);
      // 仅当仍是最新关键词时落地，避免慢请求覆盖后输入的结果
      if (keyword.value.trim() === q) {
        groups.value = settled.filter(
          (g): g is SrvfSearchResultGroup => g !== null
        );
      }
    } finally {
      if (keyword.value.trim() === q) loading.value = false;
    }
  }

  const debouncedSearch = useDebounceFn(runSearch, 300);

  function onInput() {
    if (!keyword.value.trim()) {
      groups.value = [];
      loading.value = false;
      return;
    }
    debouncedSearch(keyword.value);
  }

  function reset() {
    keyword.value = "";
    groups.value = [];
    loading.value = false;
  }

  /** 跳目标（作战室或列表页）+ 记一条最近访问；面板自身的关闭交给调用方 */
  function jump(target: SrvfJumpTarget) {
    if (target.routeName) {
      useMultiTagsStoreHook().handleTags("push", {
        path: target.path,
        name: target.routeName,
        params: target.routeParams,
        meta: { title: `${GROUP_LABEL[target.type]} · ${target.title}` }
      });
    }
    router.push(
      target.routeName
        ? { name: target.routeName, params: target.routeParams }
        : target.path
    );
    recents.record({
      type: target.type,
      id: target.id,
      title: target.title,
      subtitle: target.subtitle,
      routeName: target.routeName,
      routeParams: target.routeParams,
      path: target.path
    });
  }

  return {
    keyword,
    loading,
    groups,
    onInput,
    reset,
    jump
  };
}
