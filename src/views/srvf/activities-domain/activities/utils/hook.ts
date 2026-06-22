import { h, ref, reactive } from "vue";
import dayjs from "dayjs";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import ActivityForm, {
  type ActivityFormModel,
  type ActivityOption
} from "../form.vue";
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  publishActivity,
  cancelActivity,
  type ActivityItem,
  type CreateActivityBody
} from "@/api/srvf-activity";
import { getDictTypes, getDictItems } from "@/api/srvf-dict";
import { getOrganizations } from "@/api/srvf-organization";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

/**
 * 活动状态 code → tag 颜色（仅展示色；状态文案改由 activity_status 字典提供，前端不臆造）。
 * code 取自契约 activity_status 闭集（draft / published / cancelled / completed）。
 */
const STATUS_TAG_TYPE: Record<
  string,
  "primary" | "success" | "info" | "warning" | "danger"
> = {
  draft: "info",
  published: "success",
  cancelled: "danger",
  completed: "primary"
};

export function useActivities() {
  /** 共享字典标签解析器：活动类型 / 活动状态 code → 中文 */
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["activity_type", "activity_status"]);

  const dataList = ref<ActivityItem[]>([]);
  const loading = ref(false);
  const formRef = ref();

  // 活动列表端点是 [auth]-only、无 RBAC 读码 → 不设 hasPerms 读码门;
  // 可见性由后端按角色强制（USER 只见 published/completed）。
  // 写操作按真实 RBAC 码做按钮级显隐（SUPER_ADMIN 拥有全部码故全部可见）。
  const canCreate = hasPerms("activity.create.record");
  const canUpdate = hasPerms("activity.update.record");
  const canDelete = hasPerms("activity.delete.record");
  const canPublish = hasPerms("activity.publish.record");
  const canCancel = hasPerms("activity.cancel.record");
  const hasAnyRowAction = canUpdate || canPublish || canCancel || canDelete;

  /** 下拉选项（懒加载；空数组 = 表单退化为文本输入） */
  const activityTypeOptions = ref<ActivityOption[]>([]);
  const genderRequirementOptions = ref<ActivityOption[]>([]);
  const organizationOptions = ref<ActivityOption[]>([]);
  let optionsResolved = false;

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    { label: "标题", prop: "title", minWidth: 180 },
    {
      label: "类型",
      prop: "activityTypeCode",
      minWidth: 130,
      formatter: ({ activityTypeCode }) =>
        dict.label("activity_type", activityTypeCode)
    },
    { label: "地点", prop: "location", minWidth: 140 },
    {
      label: "开始时间",
      prop: "startAt",
      minWidth: 160,
      formatter: ({ startAt }) =>
        startAt ? dayjs(startAt).format("YYYY-MM-DD HH:mm") : "—"
    },
    { label: "状态", prop: "statusCode", minWidth: 110, slot: "statusCode" },
    {
      label: "公开报名",
      prop: "isPublicRegistration",
      minWidth: 100,
      slot: "isPublicRegistration"
    },
    ...(hasAnyRowAction
      ? [
          {
            label: "操作",
            fixed: "right" as const,
            width: 260,
            slot: "operation"
          }
        ]
      : [])
  ];

  /** 状态 code → 展示元数据：文案查 activity_status 字典，颜色按 code 给展示色（未知 → 原 code + info 灰） */
  function statusMeta(code: string) {
    return {
      text: dict.label("activity_status", code),
      type: STATUS_TAG_TYPE[code] ?? ("info" as const)
    };
  }

  async function onSearch() {
    loading.value = true;
    try {
      const { code, data } = await getActivities({
        page: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载活动列表失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  /**
   * 懒加载下拉数据：activity_type / gender_requirement 字典 + 组织列表。
   * 无对应读权限 / 查不到 type / 后端不可达 → 静默保持空 → 表单退化为文本输入。
   */
  async function ensureFormOptions() {
    if (optionsResolved) return;
    optionsResolved = true;
    try {
      const { code, data } = await getDictTypes({
        status: "ACTIVE",
        pageSize: 100
      });
      if (code === 0) {
        const typeIdByCode = new Map(data.items.map(t => [t.code, t.id]));
        const actTypeId = typeIdByCode.get("activity_type");
        const genderTypeId = typeIdByCode.get("gender_requirement");
        if (actTypeId) {
          const r = await getDictItems({
            typeId: actTypeId,
            status: "ACTIVE",
            pageSize: 100
          });
          if (r.code === 0) {
            activityTypeOptions.value = r.data.items.map(i => ({
              label: i.label,
              value: i.code
            }));
          }
        }
        if (genderTypeId) {
          const r = await getDictItems({
            typeId: genderTypeId,
            status: "ACTIVE",
            pageSize: 100
          });
          if (r.code === 0) {
            genderRequirementOptions.value = r.data.items.map(i => ({
              label: i.label,
              value: i.code
            }));
          }
        }
      }
    } catch {
      // 无 dict 读权限 / 后端不可达 → 保持空 → 表单退化为文本输入
    }
    try {
      const { code, data } = await getOrganizations({
        status: "ACTIVE",
        pageSize: 100
      });
      if (code === 0) {
        organizationOptions.value = data.items.map(o => ({
          label: o.name,
          value: o.id
        }));
      }
    } catch {
      // 无 org.read.node / 后端不可达 → 保持空 → 表单退化为文本输入
    }
  }

  /** 由表单模型组装提交体：必填恒发；可选字段仅在有值时发（避免编辑时把空值写回覆盖后端）。 */
  function buildBody(m: ActivityFormModel): CreateActivityBody {
    return {
      title: m.title,
      activityTypeCode: m.activityTypeCode,
      organizationId: m.organizationId,
      startAt: m.startAt,
      endAt: m.endAt,
      location: m.location,
      isPublicRegistration: m.isPublicRegistration,
      requiresInsurance: m.requiresInsurance,
      ...(m.description ? { description: m.description } : {}),
      ...(typeof m.capacity === "number" ? { capacity: m.capacity } : {}),
      ...(m.genderRequirementCode
        ? { genderRequirementCode: m.genderRequirementCode }
        : {}),
      ...(m.registrationDeadline
        ? { registrationDeadline: m.registrationDeadline }
        : {}),
      ...(m.registrationNotes ? { registrationNotes: m.registrationNotes } : {})
    };
  }

  /** 新建 / 编辑弹窗（编辑时按列表返回字段回填；registrationNotes 列表不返回故留空，不填则不提交） */
  async function openDialog(title: "新建" | "编辑", row?: ActivityItem) {
    await ensureFormOptions();
    const isEdit = title === "编辑";
    addDialog({
      title: `${title}活动`,
      width: "46%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          title: row?.title ?? "",
          activityTypeCode: row?.activityTypeCode ?? "",
          organizationId: row?.organizationId ?? "",
          startAt: row?.startAt
            ? dayjs(row.startAt).format("YYYY-MM-DDTHH:mm:ss")
            : "",
          endAt: row?.endAt
            ? dayjs(row.endAt).format("YYYY-MM-DDTHH:mm:ss")
            : "",
          location: row?.location ?? "",
          description: row?.description ?? "",
          capacity: row?.capacity ?? undefined,
          genderRequirementCode: row?.genderRequirementCode ?? "",
          registrationDeadline: row?.registrationDeadline
            ? dayjs(row.registrationDeadline).format("YYYY-MM-DDTHH:mm:ss")
            : "",
          registrationNotes: "",
          isPublicRegistration: row?.isPublicRegistration ?? true,
          requiresInsurance: row?.requiresInsurance ?? false
        } as ActivityFormModel,
        activityTypeOptions: activityTypeOptions.value,
        genderRequirementOptions: genderRequirementOptions.value,
        organizationOptions: organizationOptions.value
      },
      contentRenderer: () => h(ActivityForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const formComp = formRef.value;
        const curData = options.props.formInline as ActivityFormModel;
        formComp.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              await updateActivity(row.id, buildBody(curData));
              message("修改成功", { type: "success" });
            } else {
              await createActivity(buildBody(curData));
              message("新建成功", { type: "success" });
            }
            done();
            onSearch();
          } catch (error: any) {
            message(error?.response?.data?.message ?? "保存失败", {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /** 删除（删前 confirm；后端软删，删除 ≠ 取消，cancelled 仍可删） */
  function handleDelete(row: ActivityItem) {
    ElMessageBox.confirm(`确定要删除活动「${row.title}」吗？`, "系统提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        try {
          await deleteActivity(row.id);
          message("删除成功", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? "删除失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 发布（draft → published；后端拒绝非法流转时弹其 message） */
  function handlePublish(row: ActivityItem) {
    ElMessageBox.confirm(
      `确定要发布活动「${row.title}」吗？发布后将对符合条件的用户可见。`,
      "发布活动",
      {
        confirmButtonText: "确定发布",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await publishActivity(row.id);
          message("发布成功", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? "发布失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 取消（* → cancelled；弹原因输入，cancelReason 可空；后端拒绝时弹其 message） */
  function handleCancel(row: ActivityItem) {
    ElMessageBox.prompt(
      `确定要取消活动「${row.title}」吗？可填写取消原因（可空）。`,
      "取消活动",
      {
        confirmButtonText: "确定取消",
        cancelButtonText: "返回",
        type: "warning",
        inputType: "textarea",
        inputPlaceholder: "取消原因（可空；≤ 500）",
        inputValidator: (val: string) => {
          if (val && val.length > 500) return "取消原因不能超过 500 字";
          return true;
        }
      }
    )
      .then(async ({ value }) => {
        try {
          await cancelActivity(row.id, value ? { cancelReason: value } : {});
          message("取消成功", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? "取消失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  return {
    canCreate,
    canUpdate,
    canDelete,
    canPublish,
    canCancel,
    loading,
    columns,
    dataList,
    pagination,
    statusMeta,
    onSearch,
    openDialog,
    handleDelete,
    handlePublish,
    handleCancel,
    handleSizeChange,
    handleCurrentChange
  };
}
