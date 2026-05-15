<template>
  <el-config-provider :locale="currentLocale">
    <router-view />
    <ReDialog />
    <ReFloatButton :floatBtns="floatBtns" />
  </el-config-provider>
</template>

<script lang="ts">
import { ElConfigProvider } from "element-plus";
import { useRouter, useRoute } from "vue-router";
import ReFloatButton from "@/components/ReFloatButton";
import { useGlobal, useWatermark } from "@pureadmin/utils";
import { defineComponent, computed, watch, nextTick } from "vue";
import { ReDialog, closeAllDialog } from "@/components/ReDialog";
import zhCn from "element-plus/es/locale/lang/zh-cn";

import Service from "~icons/ri/user-heart-line";
import Book from "~icons/ri/book-open-line";
import Max from "~icons/ri/vip-diamond-line";

export default defineComponent({
  name: "app",
  components: {
    [ElConfigProvider.name]: ElConfigProvider,
    ReDialog,
    ReFloatButton
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { setWatermark, clear } = useWatermark();
    const { $storage } = useGlobal<GlobalPropertiesApi>();

    const watermarkEnable = computed(() => $storage.configure?.watermark);
    const watermarkText = computed(() => $storage.configure?.watermarkText);
    const currentLocale = computed(() => zhCn);
    const floatBtns = computed(() => {
      return [
        {
          tip: "保姆级文档",
          link: "https://pure-admin.cn/",
          icon: Book,
          show: false
        },
        {
          tip: "高级服务",
          icon: Service,
          link: "https://pure-admin.cn/pages/service/",
          show: false
        },
        {
          tip: "Max-Ts 版本",
          link: "https://pure-admin.cn/pages/service/#max-ts-版本",
          icon: Max,
          show: false
        }
      ];
    });

    router.beforeEach(() => {
      closeAllDialog();
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
      currentLocale,
      floatBtns
    };
  }
});
</script>
