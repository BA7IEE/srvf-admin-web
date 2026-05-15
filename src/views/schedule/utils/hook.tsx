import dayjs from "dayjs";
import editForm from "../form.vue";
import type { FormItemProps } from "./types";
import { type Ref, h, ref, computed } from "vue";
import { deviceDetection } from "@pureadmin/utils";
import { addDialog, closeDialog } from "@/components/ReDialog";

import NoonIcon from "../svg/noon.svg?component";
import MorningIcon from "../svg/morning.svg?component";
import EveningIcon from "../svg/evening.svg?component";

export function useSchedule(calendarRef: Ref) {
  const formRef = ref();
  const date = ref(new Date());

  /** 图例 */
  const legends = [
    {
      icon: MorningIcon,
      text: "早班",
      color: "#67C23A"
    },
    {
      icon: NoonIcon,
      text: "中班",
      color: "#E6A23C"
    },
    {
      icon: EveningIcon,
      text: "晚班",
      color: "#409EFF"
    }
  ];

  /** 当月第一天（如：2025-09-01） */
  const currentMonth = dayjs().startOf("month");
  /** 下个月第一天（如：2025-10-01） */
  const nextMonth = currentMonth.add(1, "month");
  /** 生成格式化日期 */
  const getDate = (base, days = 0) =>
    base.add(days, "day").format("YYYY-MM-DD");
  /** 下面动态的startDate和endDate是为了方便演示，实际开发可直接写日期字符串，如：2025-10-01 */
  const scheduling = ref([
    {
      id: 101,
      scheduling: "张三",
      classes: "morning", // 班次：morning：早班、noon：中班、evening：晚班
      startDate: getDate(currentMonth, 0),
      endDate: getDate(currentMonth, 0),
      remark: ""
    },
    {
      id: 102,
      scheduling: "李四（可跨日期排班）",
      classes: "noon",
      startDate: getDate(currentMonth, 1),
      endDate: getDate(currentMonth, 4),
      remark: "值班结束后休息两天"
    },
    {
      id: 103,
      scheduling: "王五",
      classes: "noon",
      startDate: getDate(currentMonth, 2),
      endDate: getDate(currentMonth, 2),
      remark: ""
    },
    {
      id: 104,
      scheduling: "张三",
      classes: "morning",
      startDate: getDate(currentMonth, 7),
      endDate: getDate(currentMonth, 7),
      remark: ""
    },
    {
      id: 105,
      scheduling: "赵六（联系电话：15538921234）",
      classes: "noon",
      startDate: getDate(currentMonth, 7),
      endDate: getDate(currentMonth, 7),
      remark: ""
    },
    {
      id: 106,
      scheduling: "李四",
      classes: "evening",
      startDate: getDate(currentMonth, 7),
      endDate: getDate(currentMonth, 7),
      remark: ""
    },
    {
      id: 107,
      scheduling: "小李（联系电话：15098702341）",
      classes: "evening",
      startDate: getDate(currentMonth, 29),
      endDate: getDate(currentMonth, 29),
      remark: ""
    },
    {
      id: 201,
      scheduling: "小张",
      classes: "evening",
      startDate: getDate(nextMonth, 0),
      endDate: getDate(nextMonth, 0),
      remark: ""
    },
    {
      id: 202,
      scheduling: "小云（联系电话：18812348765）",
      classes: "morning",
      startDate: getDate(nextMonth, 2),
      endDate: getDate(nextMonth, 2),
      remark: ""
    },
    {
      id: 203,
      scheduling: "小宇（联系电话：18287659890）",
      classes: "noon",
      startDate: getDate(nextMonth, 2),
      endDate: getDate(nextMonth, 2),
      remark: ""
    },
    {
      id: 204,
      scheduling: "小飞（联系电话：15190908787）",
      classes: "evening",
      startDate: getDate(nextMonth, 2),
      endDate: getDate(nextMonth, 2),
      remark: ""
    }
  ]);

  const getScheduleTagStyle = computed(() => {
    return classes => {
      switch (classes) {
        case "morning":
          return { background: "#d9ffd9", color: "#67C23A" };
        case "noon":
          return { background: "#fff0bd", color: "#E6A23C" };
        case "evening":
          return { background: "#ddeffb", color: "#409EFF" };
        default:
          return "";
      }
    };
  });

  const getScheduleTagIcon = computed(() => {
    return classes => {
      switch (classes) {
        case "morning":
          return MorningIcon;
        case "noon":
          return NoonIcon;
        case "evening":
          return EveningIcon;
        default:
          return "";
      }
    };
  });

  const getScheduleTagIconColor = computed(() => {
    return classes => {
      switch (classes) {
        case "morning":
          return { color: "#67C23A" };
        case "noon":
          return { color: "#E6A23C" };
        case "evening":
          return { color: "#409EFF" };
        default:
          return "";
      }
    };
  });

  /** 忽略时分秒，只比较日期 */
  const getDateOnlyTimestamp = (dateStr: string): number => {
    return new Date(dateStr).setHours(0, 0, 0, 0);
  };

  /** 获取某天有哪些排班 */
  const getScheduling = (day: string) => {
    const targetTime = getDateOnlyTimestamp(day);

    return scheduling.value.filter(item => {
      const start = getDateOnlyTimestamp(item.startDate);
      const end = item.endDate ? getDateOnlyTimestamp(item.endDate) : start;

      return targetTime >= start && targetTime <= end;
    });
  };

  /** 点击顶部左上角的上个月、今天、下个月按钮事件 */
  const selectDate = val => {
    if (!calendarRef.value) return;
    calendarRef.value.selectDate(val);
    if (val === "today") date.value = new Date();
  };

  /** 双击排班项可拷贝当前排班的 排班班次/当前日期/排班内容 */
  function formatSchedule(day, item) {
    const classesMap = {
      morning: "早班",
      noon: "中班",
      evening: "晚班"
    };
    return `${classesMap[item.classes]}/${day}/${item.scheduling}`;
  }

  function onSchedulingClick(type, item) {
    if (type !== "current-month") return;
    openDialog("修改", item);
  }

  function openDialog(title = "新增", row?: FormItemProps) {
    addDialog({
      title: `${title}排班`,
      props: {
        formInline: {
          scheduling: row?.scheduling ?? "",
          classes: row?.classes ?? "morning",
          startDate: row?.startDate ?? "",
          endDate: row?.endDate ?? "",
          remark: row?.remark ?? ""
        }
      },
      width: "32%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      footerRenderer: ({ options, index }) => (
        <>
          {title === "修改" ? (
            <el-button
              type="danger"
              onClick={() => onDelete(row, options, index)}
            >
              删除排班
            </el-button>
          ) : null}
          <el-button
            type="primary"
            onClick={() =>
              onSure(title, options.props.formInline, row, options, index)
            }
          >
            确定
          </el-button>
        </>
      )
    });

    /** 点击删除排班按钮事件 */
    function onDelete(row, options, index) {
      scheduling.value = scheduling.value.filter(item => item.id !== row.id); // 此处为前端模拟删除，实际开发需根据row.id（唯一id）调用删除排班接口
      closeDialog(options, index);
    }

    function getRandomInt() {
      return Math.floor(Math.random() * (100000 - 300 + 1)) + 300;
    }

    function updateSchedule(id, updates) {
      const index = scheduling.value.findIndex(item => item.id === id);
      if (index !== -1) {
        scheduling.value[index] = {
          ...scheduling.value[index],
          ...updates
        };
      }
    }

    /** 点击确定按钮事件 */
    function onSure(title, formInline, row, options, index) {
      const FormRef = formRef.value.getRef();
      FormRef.validate(valid => {
        if (valid) {
          // 表单规则校验通过
          if (title === "新增") {
            scheduling.value.push({ id: getRandomInt(), ...formInline }); // 此处为前端模拟新增，实际开发需调用新增接口（这里的id字段建议后端生成，类似表格每条数据都有一个唯一id）
          } else {
            updateSchedule(row.id, formInline); // 此处为前端模拟修改，实际开发需根据row.id（唯一id）和formInline（表单数据）调用修改接口
          }
          closeDialog(options, index);
        }
      });
    }
  }

  return {
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
  };
}
