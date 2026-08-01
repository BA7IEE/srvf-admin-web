import dayjs from "dayjs";
import { h, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import ActivityPositionForm, {
  type ActivityPositionFormModel
} from "../form.vue";
import {
  getActivityPositions,
  createActivityPosition,
  updateActivityPosition,
  deleteActivityPosition,
  activityPositionBizErrorMessage,
  type ActivityPositionItem,
  type CreateActivityPositionBody
} from "@/api/srvf-activity-position";

/**
 * 活动岗位 CRUD（作战室「岗位」tab 用）。
 *
 * @param externalActivityId 岗位隶属活动 id（必传，来自作战室路由参数）。
 *   作战室是唯一消费方——岗位是活动的子资源，不开独立菜单、页内也不摆活动下拉
 *   （轴模型铁律：沿轴下钻，不把子资源拍平成「顶级菜单 + 选父级」）。
 */
export function useActivityPositions(externalActivityId: string) {
  /**
   * 岗位读列表是 `[auth]`-only（与活动列表同口径），故不设读码门；
   * 写操作复用活动的更新码——后端没有独立的岗位写码。
   */
  const canWrite = hasPerms("activity.update.record");

  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["attendance_role", "gender_requirement"]);

  const dataList = ref<ActivityPositionItem[]>([]);
  const loading = ref(false);
  const activityId = ref<string>(externalActivityId);
  const formRef = ref();

  /** 所属活动的时间窗：传给表单做「岗位时段须落在活动窗内」的即时提示 */
  const activityStartAt = ref("");
  const activityEndAt = ref("");
  function setActivityWindow(startAt?: string, endAt?: string) {
    activityStartAt.value = startAt ?? "";
    activityEndAt.value = endAt ?? "";
  }

  const columns: TableColumnList = [
    { label: "岗位名称", prop: "name", minWidth: 150 },
    {
      label: "考勤角色",
      prop: "attendanceRoleCode",
      minWidth: 130,
      formatter: ({ attendanceRoleCode }) =>
        dict.label("attendance_role", attendanceRoleCode)
    },
    {
      // null 是「不限名额」这个明确语义,不能显示成「—」让人以为没配
      label: "名额",
      prop: "capacity",
      minWidth: 100,
      formatter: ({ capacity }) =>
        capacity === null || capacity === undefined ? "不限" : `${capacity} 人`
    },
    {
      // 同理:未单独配时段 = 沿用活动时间,不是缺数据
      label: "岗位时段",
      prop: "startAt",
      minWidth: 200,
      formatter: ({ startAt, endAt }) =>
        startAt && endAt
          ? `${dayjs(startAt).format("MM-DD HH:mm")} ~ ${dayjs(endAt).format("MM-DD HH:mm")}`
          : "随活动"
    },
    {
      label: "性别限制",
      prop: "genderRequirementCode",
      minWidth: 110,
      formatter: ({ genderRequirementCode }) =>
        genderRequirementCode
          ? dict.label("gender_requirement", genderRequirementCode)
          : "不限"
    },
    { label: "排序", prop: "sortOrder", minWidth: 80 },
    ...(canWrite
      ? [
          {
            label: "操作",
            fixed: "right" as const,
            width: 160,
            slot: "operation"
          }
        ]
      : [])
  ];

  async function onSearch() {
    if (!activityId.value) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getActivityPositions(activityId.value);
      if (code === 0) dataList.value = data;
    } catch (error: any) {
      message(activityPositionBizErrorMessage(error, "加载活动岗位失败"), {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  /**
   * 由表单模型组装提交体。
   * 两个开关决定的是**显式 null**而不是「不发」：名额不限与时段随活动在契约里
   * 都是用 null 表达的，所以这里恒发 null，不能省略 key。
   */
  function buildBody(m: ActivityPositionFormModel): CreateActivityPositionBody {
    return {
      name: m.name,
      attendanceRoleCode: m.attendanceRoleCode,
      capacity: m.unlimitedCapacity ? null : (m.capacity ?? null),
      startAt: m.followActivityWindow ? null : m.startAt || null,
      endAt: m.followActivityWindow ? null : m.endAt || null,
      genderRequirementCode: m.genderRequirementCode || null,
      description: m.description || null,
      sortOrder: m.sortOrder
    };
  }

  /** 新建 / 编辑岗位弹窗（activityId 由作战室固定） */
  async function openDialog(
    title: "新建" | "编辑",
    row?: ActivityPositionItem
  ) {
    if (!activityId.value) return;
    await dict.ensureTypes(["attendance_role", "gender_requirement"]);
    const isEdit = title === "编辑";
    addDialog({
      title: `${title}活动岗位`,
      width: "46%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          name: row?.name ?? "",
          attendanceRoleCode: row?.attendanceRoleCode ?? "",
          unlimitedCapacity: row ? row.capacity === null : true,
          capacity: row?.capacity ?? undefined,
          followActivityWindow: row ? !row.startAt : true,
          startAt: row?.startAt
            ? dayjs(row.startAt).format("YYYY-MM-DDTHH:mm:ss")
            : "",
          endAt: row?.endAt
            ? dayjs(row.endAt).format("YYYY-MM-DDTHH:mm:ss")
            : "",
          genderRequirementCode: row?.genderRequirementCode ?? "",
          description: row?.description ?? "",
          sortOrder: row?.sortOrder ?? 0
        } as ActivityPositionFormModel,
        attendanceRoleOptions: dict.options("attendance_role"),
        genderRequirementOptions: dict.options("gender_requirement"),
        activityStartAt: activityStartAt.value,
        activityEndAt: activityEndAt.value
      },
      contentRenderer: () => h(ActivityPositionForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const formComp = formRef.value;
        const curData = options.props.formInline as ActivityPositionFormModel;
        formComp.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              await updateActivityPosition(
                activityId.value,
                row.activityPositionId,
                buildBody(curData)
              );
              message("修改成功", { type: "success" });
            } else {
              await createActivityPosition(
                activityId.value,
                buildBody(curData)
              );
              message("新建成功", { type: "success" });
            }
            done();
            onSearch();
          } catch (error: any) {
            message(activityPositionBizErrorMessage(error, "保存失败"), {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /** 删除岗位（后端软删；该岗位下仍有活跃报名时拒删 → 20031 人话） */
  function handleDelete(row: ActivityPositionItem) {
    ElMessageBox.confirm(
      `确定删除岗位「${row.name}」吗？该岗位下如果还有待审核、已通过或候补中的报名，后端会拒绝删除。`,
      "删除活动岗位",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await deleteActivityPosition(
            activityId.value,
            row.activityPositionId
          );
          message("删除成功", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(activityPositionBizErrorMessage(error, "删除失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  return {
    canWrite,
    loading,
    columns,
    dataList,
    dict,
    setActivityWindow,
    onSearch,
    openDialog,
    handleDelete
  };
}
