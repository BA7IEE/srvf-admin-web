<script setup lang="ts">
import { useGlobal } from "@pureadmin/utils";
import { computed, watch, shallowRef } from "vue";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

import DayIcon from "~icons/ri/sun-fill";
import DarkIcon from "~icons/ri/moon-fill";

const themeModeIcon = shallowRef();
const { $storage } = useGlobal<GlobalPropertiesApi>();
const { dataTheme, dataThemeChange } = useDataThemeChange();
const themeMode = computed(() => $storage?.layout?.themeMode);

function onToggle() {
  if (themeMode.value === "light") {
    dataTheme.value = true;
    dataThemeChange("dark");
  } else {
    dataTheme.value = false;
    dataThemeChange("light");
  }
}

watch(
  themeMode,
  style => {
    themeModeIcon.value = style === "light" ? DarkIcon : DayIcon;
  },
  {
    immediate: true
  }
);
</script>

<template>
  <span
    class="theme-mode-icon navbar-bg-hover hover:[&>svg]:animate-scale-bounce"
    @click="onToggle"
  >
    <IconifyIconOffline :icon="themeModeIcon" />
  </span>
</template>
