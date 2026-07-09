<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { onKeyStroke } from "@vueuse/core";
import SrvfStatusTag from "./SrvfStatusTag.vue";
import {
  useSrvfGlobalSearch,
  type SrvfJumpTarget
} from "../composables/useSrvfGlobalSearch";
import { useSrvfRecentsStoreHook } from "@/store/modules/srvfRecents";
import SearchIcon from "~icons/ri/search-2-line";

defineOptions({
  name: "SrvfGlobalSearch"
});

const show = ref(false);
const inputRef = ref<HTMLInputElement>();
const rowRefs = new Map<string, HTMLElement>();

const { keyword, loading, groups, onInput, reset, jump } =
  useSrvfGlobalSearch();
const recents = useSrvfRecentsStoreHook();

const hasQuery = computed(() => keyword.value.trim().length > 0);
const showRecents = computed(() => !hasQuery.value && recents.items.length > 0);
const showEmpty = computed(
  () => hasQuery.value && !loading.value && groups.value.length === 0
);

function keyOf(item: SrvfJumpTarget) {
  return `${item.type}:${item.id}`;
}

/** 当前可见的一维结果（最近访问 或 分组结果拍平），供上下键/回车导航 */
const flatItems = computed<SrvfJumpTarget[]>(() =>
  showRecents.value ? recents.items : groups.value.flatMap(g => g.items)
);

const activeKey = ref("");
watch(flatItems, items => {
  activeKey.value = items[0] ? keyOf(items[0]) : "";
});

function setRowRef(item: SrvfJumpTarget, el: unknown) {
  const key = keyOf(item);
  if (el) rowRefs.set(key, el as HTMLElement);
  else rowRefs.delete(key);
}

function moveActive(delta: number) {
  const items = flatItems.value;
  if (!items.length) return;
  const idx = items.findIndex(i => keyOf(i) === activeKey.value);
  const nextIndex =
    ((idx === -1 ? 0 : idx) + delta + items.length) % items.length;
  activeKey.value = keyOf(items[nextIndex]);
  nextTick(() => {
    rowRefs.get(activeKey.value)?.scrollIntoView({ block: "nearest" });
  });
}

function handleJump(target: SrvfJumpTarget) {
  jump(target);
  close();
}

function activateEnter() {
  const target = flatItems.value.find(i => keyOf(i) === activeKey.value);
  if (target) handleJump(target);
}

function open() {
  show.value = true;
}

/** el-dialog 的 before-close：ESC / 点遮罩都会走这里。延时清空同 lay-search 写法，避免用户看到清空过程 */
function close() {
  show.value = false;
  setTimeout(() => reset(), 200);
}

// 唯一全局热键：Ctrl/Cmd+K 开关面板，任意页面任意焦点下都生效。
// 上下键/回车只在面板打开时处理——recents 列表是常驻状态，不加 show.value 判断的话，
// 关着面板时按回车会在任意页面把用户跳去"当前选中的最近访问"，是个真实的误触发陷阱。
onKeyStroke(e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    show.value ? close() : open();
    return;
  }
  if (!show.value) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    moveActive(1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    moveActive(-1);
  } else if (e.key === "Enter") {
    e.preventDefault();
    activateEnter();
  }
});
</script>

<template>
  <div
    class="srvf-global-search-trigger w-10 h-12 flex-c cursor-pointer navbar-bg-hover hover:[&>svg]:animate-scale-bounce"
    title="全局搜索（Ctrl/Cmd + K）"
    @click="open"
  >
    <IconifyIconOffline :icon="SearchIcon" />
  </div>

  <el-dialog
    v-model="show"
    top="5vh"
    class="srvf-global-search-dialog"
    :show-close="false"
    width="min(600px, 92vw)"
    :style="{ borderRadius: '6px' }"
    append-to-body
    :before-close="close"
    @opened="inputRef?.focus()"
  >
    <el-input
      ref="inputRef"
      v-model="keyword"
      size="large"
      clearable
      placeholder="搜索队员 / 活动 / 组织 / 内容"
      @input="onInput"
    >
      <template #prefix>
        <IconifyIconOffline :icon="SearchIcon" class="text-primary size-5" />
      </template>
    </el-input>

    <div class="srvf-global-search-content">
      <el-scrollbar max-height="calc(80vh - 140px)">
        <el-empty
          v-if="showEmpty"
          description="没有找到匹配的记录"
          :image-size="72"
        />

        <template v-if="showRecents">
          <div class="srvf-global-search-group-label">最近访问</div>
          <div
            v-for="item in recents.items"
            :key="keyOf(item)"
            :ref="el => setRowRef(item, el)"
            class="srvf-global-search-row"
            :class="{ 'is-active': keyOf(item) === activeKey }"
            @click="handleJump(item)"
            @mouseenter="activeKey = keyOf(item)"
          >
            <span class="srvf-global-search-row__title">{{ item.title }}</span>
            <span v-if="item.subtitle" class="srvf-global-search-row__subtitle">
              {{ item.subtitle }}
            </span>
          </div>
        </template>

        <template v-for="group in groups" :key="group.type">
          <div class="srvf-global-search-group-label">{{ group.label }}</div>
          <div
            v-for="item in group.items"
            :key="keyOf(item)"
            :ref="el => setRowRef(item, el)"
            class="srvf-global-search-row"
            :class="{ 'is-active': keyOf(item) === activeKey }"
            @click="handleJump(item)"
            @mouseenter="activeKey = keyOf(item)"
          >
            <span class="srvf-global-search-row__title">{{ item.title }}</span>
            <span v-if="item.subtitle" class="srvf-global-search-row__subtitle">
              {{ item.subtitle }}
            </span>
            <SrvfStatusTag
              v-if="item.statusValue && group.statusLabelDict"
              :value="item.statusValue"
              :label-dict="group.statusLabelDict"
              :tag-dict="group.statusTagDict ?? {}"
            />
          </div>
        </template>
      </el-scrollbar>
    </div>

    <template #footer>
      <span class="srvf-global-search-footer">
        <kbd>↑↓</kbd> 选择 <kbd>Enter</kbd> 打开 <kbd>Esc</kbd> 关闭
      </span>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.srvf-global-search-content {
  margin-top: 12px;
}

.srvf-global-search-group-label {
  padding: 6px 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.srvf-global-search-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  cursor: pointer;
  border-radius: 4px;

  &:hover,
  &.is-active {
    background-color: var(--el-fill-color-light);
  }

  &__title {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    white-space: nowrap;
  }

  &__subtitle {
    flex-shrink: 0;
    margin-left: auto;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.srvf-global-search-footer {
  font-size: 12px;
  color: var(--el-text-color-secondary);

  kbd {
    padding: 1px 5px;
    margin: 0 2px;
    font-size: 12px;
    background-color: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color);
    border-radius: 3px;
  }
}
</style>
