import { h, ref } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { useSrvfList } from "@/srvf-kit";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import ActivityForm, {
  type ActivityFormModel,
  type ActivityOption
} from "../form.vue";
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  cancelActivity,
  activityBizErrorMessage,
  type ActivityItem,
  type ActivityListQuery,
  type CreateActivityBody,
  type UpdateActivityBody
} from "@/api/srvf-activity";
import { getDictTypes, getDictItems } from "@/api/srvf-dict";
import { getOrganizations } from "@/api/srvf-organization";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import { openPublishDialog, openCompleteDialog } from "./lifecycle";

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
  const router = useRouter();
  /** 共享字典标签解析器：活动类型 / 活动状态 code → 中文 */
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["activity_type", "activity_status"]);

  const formRef = ref();

  // 活动列表端点是 [auth]-only、无 RBAC 读码 → 不设 hasPerms 读码门;
  // 可见性由后端按角色强制（USER 只见 published/completed）。
  // 写操作按真实 RBAC 码做按钮级显隐（SUPER_ADMIN 拥有全部码故全部可见）。
  const canCreate = hasPerms("activity.create.record");
  const canUpdate = hasPerms("activity.update.record");
  const canDelete = hasPerms("activity.delete.record");
  const canPublish = hasPerms("activity.publish.record");
  const canCancel = hasPerms("activity.cancel.record");
  const canComplete = hasPerms("activity.complete.record");
  // 「管理」(进作战室)对任何可见此列表的登录用户开放（作战室 [auth]-only,内部 tab 各自按码门）,
  // 故操作列恒显;写操作仍按各自 RBAC 码做按钮级显隐。

  /** 下拉选项（懒加载；空数组 = 表单退化为文本输入） */
  const activityTypeOptions = ref<ActivityOption[]>([]);
  const genderRequirementOptions = ref<ActivityOption[]>([]);
  const organizationOptions = ref<ActivityOption[]>([]);
  let optionsResolved = false;

  const {
    dataList,
    loading,
    pagination,
    onSearch,
    handleSizeChange,
    handleCurrentChange
  } = useSrvfList<ActivityItem, ActivityListQuery>({
    fetch: getActivities,
    buildParams: () => ({}),
    errorMessage: "加载活动列表失败"
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
    {
      label: "操作",
      fixed: "right" as const,
      width: 300,
      slot: "operation"
    }
  ];

  /** 状态 code → 展示元数据：文案查 activity_status 字典，颜色按 code 给展示色（未知 → 原 code + info 灰） */
  function statusMeta(code: string) {
    return {
      text: dict.label("activity_status", code),
      type: STATUS_TAG_TYPE[code] ?? ("info" as const)
    };
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

  /**
   * 终态（completed / cancelled）编辑提交体：**只发展示字段**。
   *
   * 后端源码里对终态有个五字段白名单（description / coverImageUrl / galleryImageUrls /
   * content / registrationNotes），判据是「dto 里出现白名单之外的 key」就整单拒，
   * 而不是「值变了才拒」——所以光把输入框禁掉不够，`buildBody` 恒发的 title / startAt
   * 照样会把整次保存带塌。这里按白名单重新组装。
   *
   * ⚠️ 2026-08-01 本地实测：当前这版后端对 completed 与 cancelled **一律拒改**，
   * 连只发白名单两项也返 20030，即那个白名单在这个 build 上够不到。
   * 仍按白名单组装是因为它在两种行为下都正确：白名单可用时这样发才能成功，
   * 不可用时也只是同样被拒——而不像整表提交那样连「为什么被拒」都说不清。
   */
  function buildTerminalUpdateBody(m: ActivityFormModel): UpdateActivityBody {
    return {
      ...(m.description ? { description: m.description } : {}),
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
          // 终态(completed/cancelled)只放行五个展示字段,表单据此锁住其余输入
          statusCode: row?.statusCode ?? "",
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
              const isTerminal =
                row.statusCode === "completed" ||
                row.statusCode === "cancelled";
              try {
                await updateActivity(
                  row.id,
                  isTerminal
                    ? buildTerminalUpdateBody(curData)
                    : buildBody(curData)
                );
              } catch (err: any) {
                // 终态被拒时给准确成因,别让人以为是自己填错了哪一项
                if (isTerminal && Number(err?.response?.data?.code) === 20030) {
                  message(
                    "已完结 / 已取消的活动不能再修改（20030）：如果确实需要更正，请联系后端管理员",
                    { type: "error", duration: 6000 }
                  );
                  closeLoading();
                  return;
                }
                throw err;
              }
              message("修改成功", { type: "success" });
            } else {
              await createActivity(buildBody(curData));
              message("新建成功", { type: "success" });
            }
            done();
            onSearch();
          } catch (error: any) {
            message(activityBizErrorMessage(error, "保存失败"), {
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
          message(activityBizErrorMessage(error, "删除失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 发布（draft → published；与作战室共用 openPublishDialog：保险核对勾选 + 必填 body） */
  function handlePublish(row: ActivityItem) {
    openPublishDialog(
      {
        id: row.id,
        title: row.title,
        requiresInsurance: row.requiresInsurance
      },
      onSearch
    );
  }

  /** 完结（published → completed；唯一完结通路，与作战室共用 openCompleteDialog） */
  function handleComplete(row: ActivityItem) {
    openCompleteDialog({ id: row.id, title: row.title }, onSearch);
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
          message(activityBizErrorMessage(error, "取消失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 进入活动作战室（实体详情页）：行内「管理」入口，router.push 带 activity id（非侧栏菜单）。
   *  页签标题带活动名（动态 params 路由需显式 push 页签，pure-admin 范式）。 */
  function openCockpit(row: ActivityItem) {
    useMultiTagsStoreHook().handleTags("push", {
      path: "/srvf/activities-domain/activities/:id",
      name: "SrvfActivityCockpit",
      params: { id: row.id },
      meta: { title: `活动 · ${row.title}` }
    });
    router.push(`/srvf/activities-domain/activities/${row.id}`);
  }

  return {
    canCreate,
    canUpdate,
    canDelete,
    canPublish,
    canCancel,
    canComplete,
    loading,
    columns,
    dataList,
    pagination,
    statusMeta,
    onSearch,
    openDialog,
    openCockpit,
    handleDelete,
    handlePublish,
    handleComplete,
    handleCancel,
    handleSizeChange,
    handleCurrentChange
  };
}
