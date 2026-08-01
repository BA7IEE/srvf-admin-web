<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue";
import dayjs from "dayjs";
import type { IdCardImageUrl } from "@/api/srvf-recruitment";

/**
 * 证件照三图查看器（原图 / 主体框 / 头像）。
 *
 * **敏感资源纪律**（交接约定，写成代码注释免得下次有人"优化"掉）：
 * - 链接是短 TTL signed-URL，**点开才取**，不预加载；
 * - **不写任何本地存储**（localStorage / sessionStorage / IndexedDB 都不碰），
 *   也不进埋点——组件关闭即弃，下次要看重新申请；
 * - 后两张仅身份证鉴伪版且已入库才有，为 null 时**不渲染那个页签**，
 *   而不是渲染一个点开是空白的页签。
 */
const props = defineProps<{ urls: IdCardImageUrl; subject: string }>();

type Shot = { key: string; label: string; url: string };

/** 只把真有 URL 的那几张做成页签 */
const shots = computed<Shot[]>(() =>
  [
    { key: "origin", label: "原图", url: props.urls.url },
    { key: "crop", label: "主体框", url: props.urls.cropImageUrl ?? "" },
    { key: "portrait", label: "头像", url: props.urls.portraitImageUrl ?? "" }
  ].filter((s): s is Shot => Boolean(s.url))
);

const active = ref(shots.value[0]?.key ?? "origin");
const failed = ref<Record<string, boolean>>({});

const expiresText = computed(() =>
  props.urls.expiresAt ? dayjs(props.urls.expiresAt).format("HH:mm:ss") : "—"
);

/** 只有原图一张时，说清为什么没有另外两张——免得以为是加载失败 */
const onlyOrigin = computed(() => shots.value.length === 1);

onBeforeUnmount(() => {
  // 关闭即弃：把引用清掉，不留在任何地方
  failed.value = {};
});
</script>

<template>
  <div>
    <el-alert type="info" show-icon :closable="false" class="mb-3">
      <template #title>
        证件照链接 {{ expiresText }} 前有效，关闭本窗口即失效
      </template>
      <div class="text-xs">
        这是{{ subject }}的实名材料，仅供核验使用。链接不会保存在本机，
        下次查看需要重新申请。
      </div>
    </el-alert>

    <el-tabs v-if="shots.length > 1" v-model="active">
      <el-tab-pane
        v-for="s in shots"
        :key="s.key"
        :label="s.label"
        :name="s.key"
      >
        <div class="shot-box">
          <el-image
            v-if="!failed[s.key]"
            :src="s.url"
            fit="contain"
            class="shot-img"
            @error="failed[s.key] = true"
          />
          <el-empty v-else description="这张图没能加载出来，可能链接已过期" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <div v-else class="shot-box">
      <el-image
        v-if="!failed.origin"
        :src="shots[0]?.url"
        fit="contain"
        class="shot-img"
        @error="failed.origin = true"
      />
      <el-empty v-else description="图片没能加载出来，可能链接已过期" />
    </div>

    <div v-if="onlyOrigin" class="mt-2 text-xs opacity-70">
      这条报名只有证件照原图——主体框与头像裁剪图是身份证鉴伪版才会生成的，
      非鉴伪版或早期报名没有。
    </div>
  </div>
</template>

<style scoped>
.shot-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}

.shot-img {
  max-height: 460px;
}
</style>
