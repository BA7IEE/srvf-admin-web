import { defineStore } from "pinia";
import { store, storageLocal, responsiveStorageNameSpace } from "../utils";

/** 全局实体搜索（SrvfGlobalSearch）覆盖的实体类型 */
export type SrvfRecentEntityType =
  | "member"
  | "activity"
  | "organization"
  | "content";

/** 一条「最近访问」记录：跳作战室/列表页时写入，跨标签页关闭持久 */
export interface SrvfRecentEntity {
  type: SrvfRecentEntityType;
  id: string;
  /** 展示主标题（如队员姓名 / 活动标题） */
  title: string;
  /** 展示副标题（如队员编号 / 活动时间），可选 */
  subtitle?: string;
  /** 命中作战室路由（member/activity）时传 name+params；无详情路由的类型（org/content）留空 */
  routeName?: string;
  routeParams?: Record<string, string>;
  /** 兜底跳转路径，任何类型都必须有 */
  path: string;
  visitedAt: number;
}

const STORAGE_KEY = `${responsiveStorageNameSpace()}srvf-recents`;
/** 上限条数（任务书 §3 P2-2 要求） */
const MAX_ITEMS = 15;

function loadPersisted(): SrvfRecentEntity[] {
  return storageLocal().getItem<SrvfRecentEntity[]>(STORAGE_KEY) ?? [];
}

type SrvfRecentsState = {
  items: SrvfRecentEntity[];
};

export const useSrvfRecentsStore = defineStore("srvf-recents", {
  state: (): SrvfRecentsState => ({
    items: loadPersisted()
  }),
  actions: {
    /**
     * 记一条最近访问：同 (type,id) 去重（挪到最前）、超过上限截断、立即落盘。
     */
    record(entity: Omit<SrvfRecentEntity, "visitedAt">) {
      const deduped = this.items.filter(
        item => !(item.type === entity.type && item.id === entity.id)
      );
      deduped.unshift({ ...entity, visitedAt: Date.now() });
      this.items = deduped.slice(0, MAX_ITEMS);
      storageLocal().setItem(STORAGE_KEY, this.items);
    },
    clear() {
      this.items = [];
      storageLocal().removeItem(STORAGE_KEY);
    }
  }
});

export function useSrvfRecentsStoreHook() {
  return useSrvfRecentsStore(store);
}
