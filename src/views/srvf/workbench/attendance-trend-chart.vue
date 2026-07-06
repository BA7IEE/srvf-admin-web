<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import echarts from "@/plugins/echarts";

/**
 * 出勤趋势·近12周堆叠柱。原生 echarts 生命周期管理（init/setOption/resize/dispose），
 * 复用 `src/plugins/echarts.ts` 里已按需注册的 BarChart/CanvasRenderer/组件，零新依赖。
 */
const props = defineProps<{
  weeks: string[];
  series: { name: string; data: number[]; color: string }[];
  loading: boolean;
}>();

const chartRef = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

function render() {
  if (!chart) return;
  chart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { bottom: 0 },
    grid: { left: 36, right: 12, top: 24, bottom: 32, containLabel: true },
    xAxis: {
      type: "category",
      data: props.weeks,
      axisTick: { show: false }
    },
    yAxis: { type: "value", minInterval: 1 },
    series: props.series.map(s => ({
      name: s.name,
      type: "bar",
      stack: "total",
      data: s.data,
      itemStyle: { color: s.color },
      barMaxWidth: 28
    }))
  });
}

onMounted(() => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value);
    render();
    // 用 ResizeObserver 而非仅 window resize：flex/grid 布局在挂载后可能异步
    // 结算出更窄的最终宽度（本组件曾实测 init 时量到比父卡片更宽的画布），
    // ResizeObserver 能捕捉容器自身盒尺寸变化，不止是视口尺寸变化。
    resizeObserver = new ResizeObserver(() => chart?.resize());
    resizeObserver.observe(chartRef.value);
  }
});

watch(() => [props.weeks, props.series], render, { deep: true });

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  chart?.dispose();
  chart = null;
});
</script>

<template>
  <div v-loading="loading" class="trend-chart-wrap">
    <el-empty
      v-if="!loading && !series.length"
      description="近 12 周暂无活动数据"
    />
    <div v-show="series.length" ref="chartRef" class="trend-chart" />
  </div>
</template>

<style scoped lang="scss">
.trend-chart-wrap {
  min-height: 280px;
}

.trend-chart {
  width: 100%;
  height: 280px;
}
</style>
