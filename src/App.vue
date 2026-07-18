<template>
  <el-config-provider :locale="currentLocale">
    <router-view />
    <ReDialog />
    <ReDrawer />
  </el-config-provider>
</template>

<script lang="ts">
import { ElConfigProvider } from "element-plus";
import { useRouter, useRoute } from "vue-router";
import { useGlobal, useWatermark } from "@pureadmin/utils";
import { defineComponent, computed, watch, nextTick } from "vue";
import { ReDialog, closeAllDialog } from "@/components/ReDialog";
import { ReDrawer, closeAllDrawer } from "@/components/ReDrawer";
import zhCn from "element-plus/es/locale/lang/zh-cn";

export default defineComponent({
  name: "app",
  components: {
    [ElConfigProvider.name]: ElConfigProvider,
    ReDialog,
    ReDrawer
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { setWatermark, clear } = useWatermark();
    const { $storage } = useGlobal<GlobalPropertiesApi>();

    const watermarkEnable = computed(() => $storage.configure?.watermark);
    const watermarkText = computed(() => $storage.configure?.watermarkText);
    const currentLocale = computed(() => zhCn);

    router.beforeEach(() => {
      closeAllDialog();
      closeAllDrawer();
    });

    watch(
      [watermarkEnable, watermarkText, () => route.name],
      async ([enable, text, name]) => {
        await nextTick();
        if (enable && name !== "Login") {
          setWatermark(text, { verticalOffset: 170 });
        } else {
          clear();
        }
      },
      {
        immediate: true
      }
    );

    return {
      currentLocale
    };
  }
});
</script>
