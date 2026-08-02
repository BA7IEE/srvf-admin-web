<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue";
import dayjs from "dayjs";
import type { CertificateEvidenceUrls } from "@/api/srvf-certificate";

/**
 * 证书证据图查看器。
 *
 * **敏感资源四条纪律**（后端交接约定，写成代码注释免得下次有人「优化」掉）：
 * 1. **不预加载**——URL 由调用方在用户点「查看证据」时才取，列表渲染绝不批量申请；
 * 2. **关页即弃**——本组件 `destroyOnClose`，卸载时清引用，下次看重新申请；
 * 3. **不写任何本地存储**——localStorage / sessionStorage / IndexedDB 都不碰，也不进埋点；
 * 4. **失败给重试**——TTL 很短（招新来源 ≤300s），图裂大概率是链接过期，
 *    给一个「重新获取」而不是让人刷整页。
 *
 * 另：**不开新标签**。signed-URL 开在新标签会留在浏览器历史里，而这是敏感材料，
 * 所以一律弹窗内看（沿证件照三图先例）。
 */
const props = defineProps<{
  data: CertificateEvidenceUrls;
  subject: string;
  /** 重新取一次 URL（由 hook 注入，失败重试用）；返回新的一份数据 */
  onRefetch: () => Promise<CertificateEvidenceUrls | null>;
}>();

/** 本地副本：重试后就地换掉，不要求父层重开弹窗 */
const current = ref<CertificateEvidenceUrls>(props.data);
const failed = ref<Record<number, boolean>>({});
const refetching = ref(false);

const urls = computed(() => current.value.urls);

const expiresText = computed(() =>
  current.value.expiresAt
    ? dayjs(current.value.expiresAt).format("HH:mm:ss")
    : "很短时间内"
);

/** 有 evidenceAvailable 但数组为空 = 后端 fail-closed 掉了不确定的项，不是加载失败 */
const emptyButAvailable = computed(() => urls.value.length === 0);

async function refetch() {
  refetching.value = true;
  try {
    const next = await props.onRefetch();
    if (next) {
      current.value = next;
      failed.value = {};
    }
  } finally {
    refetching.value = false;
  }
}

onBeforeUnmount(() => {
  // 关闭即弃：清掉本组件持有的一切 URL 引用，不留在任何地方
  current.value = { ...current.value, urls: [] };
  failed.value = {};
});
</script>

<template>
  <div>
    <el-alert type="info" show-icon :closable="false" class="mb-3">
      <template #title>
        证据图链接 {{ expiresText }} 前有效，关闭本窗口即失效
      </template>
      <div class="text-xs">
        这是{{ subject }}的证书证据材料，仅供核验使用。链接不会保存在本机，
        下次查看需要重新申请。
      </div>
    </el-alert>

    <div class="flex-bc mb-2">
      <span class="text-xs opacity-70">
        共 {{ urls.length }} 张 · 来源{{
          current.sourceCode === "RECRUITMENT" ? "招新申报" : "管理端录入"
        }}
      </span>
      <el-button link type="primary" :loading="refetching" @click="refetch">
        重新获取
      </el-button>
    </div>

    <el-empty
      v-if="emptyButAvailable"
      description="这张证书标着有证据，但后端这次没能解析出可读链接（存储或台账状态不确定时会按安全策略跳过）。可以点「重新获取」再试一次。"
    />

    <div v-else class="shot-grid">
      <div v-for="(u, i) in urls" :key="i" class="shot-box">
        <el-image
          v-if="!failed[i]"
          :src="u"
          fit="contain"
          class="shot-img"
          :preview-src-list="urls"
          :initial-index="i"
          preview-teleported
          @error="failed[i] = true"
        />
        <el-empty
          v-else
          :image-size="60"
          description="这张图没能加载出来，多半是链接已过期——点上面「重新获取」"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.shot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.shot-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}

.shot-img {
  max-height: 320px;
}
</style>
