import { ref } from "vue";
import {
  actionStateBatch,
  AUTHZ_REASON_LABEL,
  type ActionStateItem,
  type ActionStateResultItem,
  type ExplainResourceType
} from "@/api/srvf-authz";

/** 后端单批上限（`ActionStateBatchDto`：items ≤ 200）。 */
const BATCH_LIMIT = 200;

export type ActionStateView = {
  allowed: boolean;
  reason: string;
  /** 置灰时挂在按钮上的 tooltip；allowed 时为空串 */
  tooltip: string;
};

/** `resourceId|action` → 结果，查表用 */
function keyOf(resourceId: string, action: string) {
  return `${resourceId}|${action}`;
}

/**
 * 批量按钮态（`POST authz/action-state/batch`）。
 *
 * 一次请求把一列表的操作按钮该亮该灰问清楚，判定对象是**调用者本人**
 * （「这组按钮对我该不该亮」）。
 *
 * ## 为什么值得单独做
 *
 * `hasPerms` 只答得了「我有没有这个权限码」，答不了两件事：
 * ① scope——有码但这条资源不在我的授权组织范围内；
 * ② 状态机——权限没问题，但资源当前状态就不允许这个动作（`state_forbidden`）。
 * 这两种情况都会让按钮点下去吃 4xx。批量态把它们提前问清楚，并且
 * **把「没权限」和「状态不允许」在文案上分开**——这两句对操作者的含义
 * 完全不同：前者要找管理员，后者要等状态流转或先做别的事。
 *
 * ## 安全降级（重要）
 *
 * 这是**增强**不是闸门：请求失败、字段缺失、没查到这一项时 `stateOf` 返回
 * `null`，调用方据此**维持原有的 hasPerms + 状态判断**，绝不因为这个接口挂了
 * 就把按钮全部灰掉。真正的裁决权始终在后端——按钮亮着点下去被拒，也只是
 * 回到接这个接口之前的状态，不会更糟。
 */
export function useActionStates() {
  const loading = ref(false);
  const states = ref<Map<string, ActionStateView>>(new Map());

  /**
   * 拉一批按钮态。超过单批上限会分批发，避免整批被后端以 400 拒掉后
   * 一个结果都拿不到。
   */
  async function load(items: ActionStateItem[]) {
    states.value = new Map();
    if (!items.length) return;

    loading.value = true;
    try {
      const chunks: ActionStateItem[][] = [];
      for (let i = 0; i < items.length; i += BATCH_LIMIT) {
        chunks.push(items.slice(i, i + BATCH_LIMIT));
      }

      const results = await Promise.allSettled(
        chunks.map(chunk => actionStateBatch(chunk))
      );

      const next = new Map<string, ActionStateView>();
      for (const res of results) {
        // 某一批失败不影响其它批：拿到多少用多少，其余项 stateOf 返 null 走降级
        if (res.status !== "fulfilled" || res.value.code !== 0) continue;
        for (const item of res.value.data.items as ActionStateResultItem[]) {
          next.set(keyOf(item.resourceId, item.action), {
            allowed: item.allowed,
            reason: item.reason,
            tooltip: item.allowed ? "" : denyTooltip(item.reason)
          });
        }
      }
      states.value = next;
    } catch {
      // 整体失败 → 保持空表，全部走降级（维持原有 hasPerms 判断）
      states.value = new Map();
    } finally {
      loading.value = false;
    }
  }

  /**
   * 查一项按钮态。
   * **查不到返回 `null`**——调用方必须把 null 当「不知道」而不是「不允许」。
   */
  function stateOf(resourceId: string, action: string): ActionStateView | null {
    return states.value.get(keyOf(resourceId, action)) ?? null;
  }

  /** 便捷判断：明确被拒才返 true（未知一律 false，即不拦） */
  function isBlocked(resourceId: string, action: string) {
    return stateOf(resourceId, action)?.allowed === false;
  }

  /** 便捷取 tooltip：没被拒或不知道则空串 */
  function blockTip(resourceId: string, action: string) {
    return stateOf(resourceId, action)?.tooltip ?? "";
  }

  /** 由行列表拼请求项（同一资源多个动作）。 */
  function buildItems(
    resourceType: ExplainResourceType,
    resourceIds: string[],
    actions: string[]
  ): ActionStateItem[] {
    return resourceIds.flatMap(resourceId =>
      actions.map(action => ({ action, resourceType, resourceId }))
    );
  }

  return { loading, load, stateOf, isBlocked, blockTip, buildItems };
}

/**
 * 拒绝原因 → 按钮 tooltip。
 *
 * `state_forbidden` 单独给一句**面向下一步**的话：它不是权限问题，
 * 说成「没有权限」会让人白跑一趟找管理员。其余原因沿用 authz 统一词表。
 */
function denyTooltip(reason: string) {
  if (reason === "state_forbidden")
    return "当前状态不允许这个操作——不是权限问题，等状态流转后再来";
  return AUTHZ_REASON_LABEL[reason] ?? "当前不可执行";
}
