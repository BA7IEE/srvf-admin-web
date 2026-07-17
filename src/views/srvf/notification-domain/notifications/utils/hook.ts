import { bizErrorMessage } from "@/api/srvf-error";
import { h, ref } from "vue";
import dayjs from "dayjs";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { useSrvfList } from "@/srvf-kit";
import { getDictTypes, getDictItems } from "@/api/srvf-dict";
import { getOrganizations } from "@/api/srvf-organization";
import NotificationForm, { type NotificationFormModel } from "../form.vue";
import {
  getNotifications,
  getNotification,
  createNotification,
  updateNotification,
  deleteNotification,
  publishNotification,
  unpublishNotification,
  archiveNotification,
  sendNotificationSms,
  NOTIFICATION_STATUS_LABEL,
  NOTIFICATION_STATUS_TAG,
  VISIBILITY_LABEL,
  CHANNEL_LABEL,
  type NotificationChannel,
  type NotificationListItem,
  type NotificationListQuery
} from "@/api/srvf-notification";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

type Option = { label: string; value: string };

export function useNotifications() {
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["notification_type"]);

  const canRead = hasPerms("notification.read.record");
  const canCreate = hasPerms("notification.create.record");
  const canUpdate = hasPerms("notification.update.record");
  const canDelete = hasPerms("notification.delete.record");
  const canPublish = hasPerms("notification.publish.record");
  const canSendSms = hasPerms("notification.send.sms");

  const statusFilter = ref<string>("");
  const typeFilter = ref<string>("");
  const formRef = ref();
  const {
    dataList,
    loading,
    pagination,
    onSearch,
    onFilterChange,
    handleSizeChange,
    handleCurrentChange
  } = useSrvfList<NotificationListItem, NotificationListQuery>({
    fetch: getNotifications,
    buildParams: () => ({
      ...(statusFilter.value ? { statusCode: statusFilter.value } : {}),
      ...(typeFilter.value ? { notificationTypeCode: typeFilter.value } : {})
    }),
    errorMessage: "加载通知列表失败",
    canRead
  });

  /** notification_type 字典下拉(过滤 + 表单)+ 可见部门下拉(懒加载;空 → 退化) */
  const typeOptions = ref<Option[]>([]);
  const orgOptions = ref<Option[]>([]);
  let typeResolved = false;
  let orgResolved = false;

  const statusOptions = [
    { value: "", label: "全部状态" },
    ...Object.keys(NOTIFICATION_STATUS_LABEL).map(code => ({
      value: code,
      label: NOTIFICATION_STATUS_LABEL[code]
    }))
  ];

  const columns: TableColumnList = [
    { label: "标题", prop: "title", minWidth: 200 },
    {
      label: "类型",
      prop: "notificationTypeCode",
      minWidth: 110,
      formatter: ({ notificationTypeCode }) =>
        dict.label("notification_type", notificationTypeCode)
    },
    { label: "状态", prop: "statusCode", minWidth: 100, slot: "statusCode" },
    {
      label: "可见性",
      prop: "visibilityCode",
      minWidth: 120,
      formatter: ({ visibilityCode }) =>
        VISIBILITY_LABEL[visibilityCode] ?? visibilityCode
    },
    {
      label: "渠道",
      prop: "channels",
      minWidth: 130,
      formatter: ({ channels }) =>
        (channels ?? [])
          .map((c: string) => CHANNEL_LABEL[c] ?? c)
          .join(" / ") || "—"
    },
    {
      label: "置顶",
      prop: "pinned",
      minWidth: 70,
      formatter: ({ pinned }) => (pinned ? "是" : "否")
    },
    { label: "已读", prop: "readCount", minWidth: 70 },
    {
      label: "更新时间",
      prop: "updatedAt",
      minWidth: 165,
      formatter: ({ updatedAt }) =>
        updatedAt ? dayjs(updatedAt).format("YYYY-MM-DD HH:mm") : "—"
    },
    { label: "操作", fixed: "right" as const, width: 340, slot: "operation" }
  ];

  function statusMeta(code: string) {
    return {
      text: NOTIFICATION_STATUS_LABEL[code] ?? code,
      type: NOTIFICATION_STATUS_TAG[code] ?? ("info" as const)
    };
  }

  async function ensureTypeOptions() {
    if (typeResolved) return;
    typeResolved = true;
    try {
      const { code, data } = await getDictTypes({
        status: "ACTIVE",
        pageSize: 100
      });
      if (code !== 0) return;
      const t = data.items.find(x => x.code === "notification_type");
      if (!t) return;
      const res = await getDictItems({
        typeId: t.id,
        status: "ACTIVE",
        pageSize: 100
      });
      if (res.code === 0) {
        typeOptions.value = res.data.items.map(i => ({
          label: i.label,
          value: i.code
        }));
      }
    } catch {
      // 无 dict 读权限 / 不可达 → 保持空 → 表单退化为手填码
    }
  }

  async function ensureOrgOptions() {
    if (orgResolved) return;
    orgResolved = true;
    try {
      const { code, data } = await getOrganizations({
        status: "ACTIVE",
        pageSize: 100
      });
      if (code === 0) {
        orgOptions.value = data.items.map(o => ({
          label: o.name,
          value: o.id
        }));
      }
    } catch {
      // 无 org 读权限 / 不可达 → 保持空
    }
  }

  /** 新建 / 编辑(编辑先取详情拿 body + 可见部门;archived 冻结由后端拒绝 → 弹 message) */
  async function openDialog(
    title: "新建" | "编辑",
    row?: NotificationListItem
  ) {
    await Promise.all([ensureTypeOptions(), ensureOrgOptions()]);
    const isEdit = title === "编辑";
    let initial: NotificationFormModel = {
      title: "",
      body: "",
      notificationTypeCode: "",
      visibilityCode: "member",
      visibleOrganizationIds: [],
      channels: ["in-app"],
      pinned: false
    };
    if (isEdit && row) {
      try {
        const { code, data } = await getNotification(row.id);
        if (code === 0) {
          initial = {
            title: data.title,
            body: data.body,
            notificationTypeCode: data.notificationTypeCode,
            visibilityCode:
              data.visibilityCode as NotificationFormModel["visibilityCode"],
            visibleOrganizationIds: data.visibleOrganizationIds ?? [],
            channels: (data.channels as NotificationFormModel["channels"]) ?? [
              "in-app"
            ],
            pinned: data.pinned
          };
        }
      } catch (error: any) {
        message(bizErrorMessage(error, "加载通知详情失败"), {
          type: "error"
        });
        return;
      }
    }
    addDialog({
      title: `${title}通知`,
      width: "60%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: initial,
        typeOptions: typeOptions.value,
        orgOptions: orgOptions.value
      },
      contentRenderer: () => h(NotificationForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as NotificationFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          // 非 department 可见性不提交可见部门;站内恒发 → 确保 channels 含 in-app
          const visOrgs =
            curData.visibilityCode === "department"
              ? curData.visibleOrganizationIds
              : [];
          const channels: NotificationChannel[] = curData.channels.includes(
            "in-app"
          )
            ? curData.channels
            : ["in-app", ...curData.channels];
          const payload = {
            title: curData.title,
            body: curData.body,
            notificationTypeCode: curData.notificationTypeCode,
            visibilityCode: curData.visibilityCode,
            visibleOrganizationIds: visOrgs,
            channels,
            pinned: curData.pinned
          };
          try {
            if (isEdit && row) {
              await updateNotification(row.id, payload);
              message("修改成功", { type: "success" });
            } else {
              await createNotification(payload);
              message("新建草稿成功", { type: "success" });
            }
            done();
            onSearch();
          } catch (error: any) {
            message(bizErrorMessage(error, "保存失败"), {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /** 状态机动作(发布/撤回/归档)统一确认 + 调用 + 刷新 */
  function runStateAction(
    row: NotificationListItem,
    action: "publish" | "unpublish" | "archive"
  ) {
    const meta = {
      publish: {
        label: "发布",
        fn: publishNotification,
        tip: "草稿将发布;勾了微信渠道的会向已订阅会员推送(短信不随发布发)。"
      },
      unpublish: {
        label: "撤回",
        fn: unpublishNotification,
        tip: "已发布通知将撤回为草稿。"
      },
      archive: {
        label: "归档",
        fn: archiveNotification,
        tip: "归档后为终态,不可逆。"
      }
    }[action];
    ElMessageBox.confirm(
      `确定${meta.label}「${row.title}」吗？${meta.tip}`,
      `${meta.label}通知`,
      {
        confirmButtonText: `确定${meta.label}`,
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await meta.fn(row.id);
          message(`${meta.label}成功`, { type: "success" });
          onSearch();
        } catch (error: any) {
          message(bizErrorMessage(error, `${meta.label}失败`), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /**
   * 短信兜底:先 confirmed:false 预览 recipientCount(零发送)→ 二次确认计费 → confirmed:true 真发。
   * 仅对「已发布 + 渠道含 sms」可用(按钮处已门控);受众为 0 时直接提示不进确认。
   */
  async function openSendSms(row: NotificationListItem) {
    let recipientCount = 0;
    try {
      const { code, data } = await sendNotificationSms(row.id, false);
      if (code !== 0) return;
      recipientCount = data.recipientCount;
    } catch (error: any) {
      message(bizErrorMessage(error, "短信预览失败"), {
        type: "error"
      });
      return;
    }
    if (recipientCount <= 0) {
      message("无可发送收件人(可见且有手机的队员为 0)", { type: "warning" });
      return;
    }
    ElMessageBox.confirm(
      `将向 ${recipientCount} 位「可见且有手机」的队员发送短信(= ${recipientCount} 条计费)。短信仅作紧急召集兜底,确认发送？`,
      "发送短信 · 计费确认",
      {
        confirmButtonText: `确认发送 ${recipientCount} 条`,
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          const { code, data } = await sendNotificationSms(row.id, true);
          if (code === 0) {
            message(
              `短信已发送:成功 ${data.sent} / 失败 ${data.failed} / 跳过 ${data.skipped}`,
              { type: "success" }
            );
            onSearch();
          }
        } catch (error: any) {
          message(bizErrorMessage(error, "短信发送失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  function handleDelete(row: NotificationListItem) {
    ElMessageBox.confirm(`确定删除通知「${row.title}」吗？`, "删除通知", {
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        try {
          await deleteNotification(row.id);
          message("删除成功", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(bizErrorMessage(error, "删除失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canPublish,
    canSendSms,
    loading,
    statusFilter,
    statusOptions,
    typeFilter,
    typeOptions,
    columns,
    dataList,
    pagination,
    statusMeta,
    ensureTypeOptions,
    onSearch,
    onFilterChange,
    openDialog,
    runStateAction,
    openSendSms,
    handleDelete,
    handleSizeChange,
    handleCurrentChange
  };
}
