<script setup lang="ts">
import { ref } from "vue";
import { dayjs } from "element-plus";
import { useSchedule } from "./utils/hook";
import { ReText } from "@/components/ReText";
import { useCopyToClipboard } from "@pureadmin/utils";

defineOptions({
  name: "Schedule"
});

// https://github.com/element-plus/element-plus/issues/8007#issuecomment-2229946178
dayjs.locale("zh-cn", { weekStart: 1 });

const calendarRef = ref();
const { update } = useCopyToClipboard();

const {
  date,
  legends,
  getScheduleTagStyle,
  getScheduleTagIcon,
  getScheduleTagIconColor,
  deviceDetection,
  getScheduling,
  selectDate,
  formatSchedule,
  onSchedulingClick,
  openDialog
} = useSchedule(calendarRef);
</script>

<template>
  <div>
    <div class="flex-bc flex-wrap w-full mb-4">
      <div class="flex flex-wrap items-center gap-2">
        <el-date-picker
          v-model="date"
          class="w-40!"
          type="month"
          placeholder="请选择日期"
          @clear="date = new Date()"
        />
        <el-button-group>
          <el-button @click="selectDate('prev-month')">上个月</el-button>
          <el-button @click="selectDate('today')">今天</el-button>
          <el-button @click="selectDate('next-month')">下个月</el-button>
        </el-button-group>
      </div>
      <div
        class="flex items-center gap-2"
        :style="{ marginTop: deviceDetection() ? '6px' : '' }"
      >
        <div
          v-for="(legend, index) in legends"
          :key="index"
          class="flex items-center text-[18px] font-medium"
          :style="{ color: legend.color }"
        >
          <component :is="legend.icon" class="mr-1" />
          <span>{{ legend.text }}</span>
        </div>
      </div>
    </div>

    <el-calendar ref="calendarRef" v-model="date">
      <template #date-cell="{ data }">
        <el-scrollbar>
          <div class="calendar-scheduling" @click.stop>
            <div class="flex-bc">
              <ReText class="calendar-day text-[16px]!">
                {{ data.day.split("-").slice(1).join("-") }}
              </ReText>
              <el-button
                v-if="data.type === 'current-month'"
                size="small"
                circle
                @click="
                  openDialog('新增', {
                    startDate: data.day,
                    endDate: data.day
                  } as any)
                "
              >
                <template #icon>
                  <IconifyIconOnline icon="ri:add-large-line" color="#8E9096" />
                </template>
              </el-button>
            </div>

            <div class="scheduling-content">
              <el-scrollbar>
                <div v-if="getScheduling(data.day).length > 0">
                  <div
                    v-for="(item, index) in getScheduling(data.day)"
                    :key="index"
                    @dblclick="update(formatSchedule(data.day, item))"
                    @click="onSchedulingClick(data.type, item)"
                  >
                    <div
                      class="scheduling-tag"
                      :style="getScheduleTagStyle(item.classes)"
                    >
                      <component
                        :is="getScheduleTagIcon(item.classes)"
                        class="mr-1"
                        :style="getScheduleTagIconColor(item.classes)"
                      />
                      <ReText class="w-full! text-inherit! text-[13px]!">
                        {{ item.scheduling }}
                      </ReText>
                    </div>
                  </div>
                </div>
                <div
                  v-else
                  class="m-4 flex-c flex-col gap-2 text-center text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)]"
                >
                  <IconifyIconOnline icon="ep:calendar" />
                  <ReText class="text-inherit! text-[13px]!">暂无排班</ReText>
                </div>
              </el-scrollbar>
            </div>
          </div>
        </el-scrollbar>
      </template>
    </el-calendar>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-calendar__header) {
  display: none;
}

:deep(.el-calendar__body) {
  padding: 0;
}

:deep(.el-calendar-table) {
  width: 100%;
  height: 100%;

  &:not(.is-range) {
    td.next,
    td.prev {
      .el-calendar-day {
        cursor: not-allowed !important;
      }

      .scheduling-tag {
        cursor: not-allowed !important;

        &:hover {
          opacity: 1;
        }
      }
    }
  }

  th {
    border: 1px solid var(--el-border-color-lighter);
    border-bottom: none;
  }

  td.is-selected {
    background: none;
  }

  td.is-today {
    .calendar-day {
      padding-inline: 4px;
      color: #fff !important;
      background: var(--el-color-primary);
      border-radius: 4px;
    }
  }

  .el-calendar-day {
    height: 100%;

    &:hover {
      cursor: auto;
      background: transparent;
    }
  }
}

.calendar-scheduling {
  display: flex;
  flex-direction: column;
  min-width: 60px;
  height: 115px;
  min-height: calc(100% - 10px);
  overflow: hidden;

  .scheduling-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }

  .scheduling-tag {
    display: flex;
    align-items: center;
    min-width: 100px;
    padding: 6px 12px;
    margin-top: 10px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 4px;

    &:last-child {
      margin-bottom: 10px;
    }

    &:hover {
      opacity: 0.75;
    }
  }
}
</style>
