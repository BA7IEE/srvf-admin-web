<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue";
import dayjs from "dayjs";
import type { CertificateClaimImageUrls } from "@/api/srvf-recruitment";

/**
 * 证书申报证据图查看器。
 *
 * **敏感资源四条纪律**（交接约定，写成代码注释免得下次有人「优化」掉）：
 * 1. **不预加载**——URL 由调用方在点「查看证据」时才取，列表渲染绝不批量申请；
 * 2. **关页即弃**——弹窗 `destroyOnClose`，卸载时清引用，下次看重新申请；
 * 3. **不写任何本地存储**——localStorage / sessionStorage / IndexedDB 都不碰，也不进埋点；
 * 4. **失败给重试**——TTL ≤ 300s，图裂大概率是链接过期，给「重新获取」而不是刷整页。
 *
 * 另：**不开新标签**。signed-URL 开在新标签会留进浏览器历史，而这是申请人的证明材料，
 * 一律弹窗内看（沿证件照三图先例）。
 */
const props = defineProps<{
  data: CertificateClaimImageUrls;
  subject: string;
  /** 重新取一份 URL（失败重试用） */
  onRefetch: () => Promise<CertificateClaimImageUrls | null>;
}>();

const current = ref<CertificateClaimImageUrls>(props.data);
const failed = ref<Record<number, boolean>>({});
const refetching = ref(false);

const urls = computed(() => current.value.urls);
const expiresText = computed(() =>
  current.value.expiresAt
    ? dayjs(current.value.expiresAt).format("HH:mm:ss")
    : "很短时间内"
);

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
  // 关闭即弃：清掉本组件持有的一切 URL 引用
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
        这是{{ subject }}提交的证明材料，仅供审核使用。链接不会保存在本机，
        下次查看需要重新申请。
      </div>
    </el-alert>

    <div class="flex-bc mb-2">
      <span class="text-xs opacity-70">共 {{ urls.length }} 张</span>
      <el-button link type="primary" :loading="refetching" @click="refetch">
        重新获取
      </el-button>
    </div>

    <el-empty v-if="!urls.length" description="这条申报没有可显示的证据图" />

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
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.shot-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}

.shot-img {
  max-height: 300px;
}
</style>
