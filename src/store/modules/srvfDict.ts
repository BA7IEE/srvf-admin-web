import { defineStore } from "pinia";
import { store } from "../utils";
import { getDictTypes, getDictItems } from "@/api/srvf-dict";

/**
 * SRVF 字典标签解析器（共享、load-once 缓存）。
 *
 * 列表列里的字典 code（如 member_grade_x / activity_type / pending）一律经此翻成
 * 后端字典里的中文 `label`：按 typeCode 找 typeId → 拉 ACTIVE 条目 → 建 code→label 映射。
 * 标签文案**只**来自后端字典本身（红线 1~4，不前端臆造）；标签颜色是纯前端展示选择，
 * 由各页自行按 code 给小映射，不进本 store。
 *
 * 复用 `@/api/srvf-dict` 只读端点，沿用队员页 member_grade 懒加载范式。
 * formatter / slot 读响应式 `byType`，异步加载完成后表格自动重渲染；
 * 加载中 / 查不到 / 无 dict 读权限 / 后端不可达 → 静默退化为原 code（不报错）。
 */

/**
 * typeCode → typeId 索引（仅取一次；模块级缓存做请求去重，无需响应式）。
 * 加载失败时置回 null，允许下次重试。
 */
let typeIndexPromise: Promise<Map<string, string>> | null = null;
/** 每个 typeCode 的条目加载 promise（并发去重，避免重复拉取） */
const itemsPromise = new Map<string, Promise<void>>();

function loadTypeIndex(): Promise<Map<string, string>> {
  if (!typeIndexPromise) {
    typeIndexPromise = getDictTypes({ status: "ACTIVE", pageSize: 100 })
      .then(({ code, data }) =>
        code === 0
          ? new Map(data.items.map(t => [t.code, t.id] as const))
          : new Map<string, string>()
      )
      .catch(() => {
        // 无 dict.read.type / 后端不可达 → 允许下次重试
        typeIndexPromise = null;
        return new Map<string, string>();
      });
  }
  return typeIndexPromise;
}

type SrvfDictState = {
  /**
   * typeCode → (item code → 中文 label)。
   * 存在该键即视为「已尝试加载」，不再重复请求；空对象 = 加载失败 / 无该类型 → 退化为原 code。
   */
  byType: Record<string, Record<string, string>>;
};

export const useSrvfDictStore = defineStore("srvf-dict", {
  state: (): SrvfDictState => ({
    byType: {}
  }),
  getters: {
    /**
     * `(typeCode, code) → 中文 label`。读响应式 `byType`，加载完成后随之重渲染。
     * 未加载 / 查不到 → 退化为原 code；空值 → 「—」。
     */
    label(state): (typeCode: string, code?: string | null) => string {
      return (typeCode, code) => {
        if (code === undefined || code === null || code === "") return "—";
        return state.byType[typeCode]?.[code] ?? code;
      };
    }
  },
  actions: {
    /**
     * 懒加载某字典类型的全部 ACTIVE 条目（load-once + 请求去重）。
     * 无读权限 / 查不到 type / 后端不可达 → 静默记空，formatter 退化为原 code。
     */
    ensureType(typeCode: string): Promise<void> {
      if (this.byType[typeCode]) return Promise.resolve();
      const pending = itemsPromise.get(typeCode);
      if (pending) return pending;
      const task = loadTypeIndex()
        .then(async index => {
          const typeId = index.get(typeCode);
          if (!typeId) {
            this.byType[typeCode] = {};
            return;
          }
          const { code, data } = await getDictItems({
            typeId,
            status: "ACTIVE",
            pageSize: 100
          });
          this.byType[typeCode] =
            code === 0
              ? Object.fromEntries(data.items.map(i => [i.code, i.label]))
              : {};
        })
        .catch(() => {
          this.byType[typeCode] = {};
        })
        .finally(() => {
          itemsPromise.delete(typeCode);
        });
      itemsPromise.set(typeCode, task);
      return task;
    },
    /** 批量预热多个字典类型（并发；各自 load-once） */
    ensureTypes(typeCodes: string[]): Promise<void> {
      return Promise.all(typeCodes.map(c => this.ensureType(c))).then(
        () => undefined
      );
    }
  }
});

export function useSrvfDictStoreHook() {
  return useSrvfDictStore(store);
}
