<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import echarts from "@/plugins/echarts";

/**
 * 参与月报·柱线组合图：活动数/参与人次走柱，到场率走折线（右轴百分比）。
 * 原生 echarts 生命周期管理，复用 `src/plugins/echarts.ts` 已注册的
 * BarChart/LineChart/CanvasRenderer，零新依赖。
 */
const props = defineProps<{
  months: string[];
  activityCounts: number[];
  participationCounts: number[];
  /** 0–1 的到场率，图上转成百分比显示 */
  attendanceRates: number[];
  loading: boolean;
}>();

const chartRef = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

function render() {
  if (!chart) return;
  chart.setOption(
    {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: undefined
      },
      legend: { bottom: 0 },
      grid: { left: 36, right: 44, top: 24, bottom: 32, containLabel: true },
      xAxis: {
        type: "category",
        data: props.months,
        axisTick: { show: false }
      },
      yAxis: [
        { type: "value", name: "数量", minInterval: 1 },
        {
          type: "value",
          name: "到场率",
          min: 0,
          max: 100,
          axisLabel: { formatter: "{value}%" }
        }
      ],
      series: [
        {
          name: "活动数",
          type: "bar",
          data: props.activityCounts,
          barMaxWidth: 24,
          itemStyle: { color: "var(--srvf-navy, #1f3a68)" }
        },
        {
          name: "参与人次",
          type: "bar",
          data: props.participationCounts,
          barMaxWidth: 24
        },
        {
          name: "到场率",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          // 后端给 0–1，图上按百分比画；两位小数够用
          data: props.attendanceRates.map(r => Number((r * 100).toFixed(2))),
          tooltip: { valueFormatter: (v: any) => `${v}%` }
        }
      ]
    },
    // 月份数变化时旧 series 要清掉，否则会残留上一次的柱子
    true
  );
}

onMounted(() => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value);
    render();
    resizeObserver = new ResizeObserver(() => chart?.resize());
    resizeObserver.observe(chartRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  chart?.dispose();
  chart = null;
});

watch(() => [props.months, props.activityCounts], render, { deep: true });
</script>

<template>
  <div ref="chartRef" v-loading="loading" class="monthly-chart" />
</template>

<style scoped>
.monthly-chart {
  width: 100%;
  height: 340px;
}
</style>
