import { h, ref } from "vue";
import dayjs from "dayjs";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { getDictTypes, getDictItems } from "@/api/srvf-dict";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import WechatTemplateForm, { type WechatTemplateFormModel } from "../form.vue";
import {
  getWechatTemplates,
  putWechatTemplate,
  type WechatTemplate
} from "@/api/srvf-notification";

type TemplateRow = {
  notificationTypeCode: string;
  typeLabel: string;
  templateId: string | null;
  enabled: boolean;
  remarks: string | null;
  updatedAt: string | null;
};

export function useWechatTemplates() {
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["notification_type"]);

  const canRead = hasPerms("notification.read.record");
  const canUpdate = hasPerms("notification.update.template");

  const dataList = ref<TemplateRow[]>([]);
  const loading = ref(false);
  const formRef = ref();

  const columns: TableColumnList = [
    {
      label: "通知类型",
      prop: "typeLabel",
      minWidth: 160,
      formatter: ({ typeLabel, notificationTypeCode }) =>
        typeLabel || notificationTypeCode
    },
    { label: "类型码", prop: "notificationTypeCode", minWidth: 160 },
    {
      label: "模板 ID",
      prop: "templateId",
      minWidth: 220,
      formatter: ({ templateId }) => templateId || "未配置"
    },
    {
      label: "启用",
      prop: "enabled",
      minWidth: 90,
      slot: "enabled"
    },
    {
      label: "更新时间",
      prop: "updatedAt",
      minWidth: 165,
      formatter: ({ updatedAt }) =>
        updatedAt ? dayjs(updatedAt).format("YYYY-MM-DD HH:mm") : "—"
    },
    { label: "操作", fixed: "right" as const, width: 120, slot: "operation" }
  ];

  /** 取 notification_type 字典项(全部类型;无 dict 权限 → 空) */
  async function fetchTypeItems(): Promise<{ code: string; label: string }[]> {
    try {
      const { code, data } = await getDictTypes({
        status: "ACTIVE",
        pageSize: 100
      });
      if (code !== 0) return [];
      const t = data.items.find(x => x.code === "notification_type");
      if (!t) return [];
      const res = await getDictItems({
        typeId: t.id,
        status: "ACTIVE",
        pageSize: 100
      });
      if (res.code !== 0) return [];
      return res.data.items.map(i => ({ code: i.code, label: i.label }));
    } catch {
      return [];
    }
  }

  async function onSearch() {
    if (!canRead) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const [typeItems, tplRes] = await Promise.all([
        fetchTypeItems(),
        getWechatTemplates()
      ]);
      const tplMap = new Map<string, WechatTemplate>();
      if (tplRes.code === 0) {
        tplRes.data.forEach(t => tplMap.set(t.notificationTypeCode, t));
      }
      // 字典类型为基底,叠加已配置模板
      const rows: TemplateRow[] = typeItems.map(ti => {
        const t = tplMap.get(ti.code);
        return {
          notificationTypeCode: ti.code,
          typeLabel: ti.label,
          templateId: t?.templateId ?? null,
          enabled: t?.enabled ?? false,
          remarks: t?.remarks ?? null,
          updatedAt: t?.updatedAt ?? null
        };
      });
      // 防御:已配置但不在字典里的类型也并入
      tplMap.forEach((t, code) => {
        if (!rows.some(r => r.notificationTypeCode === code)) {
          rows.push({
            notificationTypeCode: code,
            typeLabel: dict.label("notification_type", code),
            templateId: t.templateId,
            enabled: t.enabled,
            remarks: t.remarks,
            updatedAt: t.updatedAt
          });
        }
      });
      dataList.value = rows;
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载微信模板配置失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  function openDialog(row: TemplateRow) {
    const initial: WechatTemplateFormModel = {
      notificationTypeCode: row.notificationTypeCode,
      typeLabel: row.typeLabel,
      templateId: row.templateId ?? "",
      enabled: row.enabled,
      remarks: row.remarks ?? ""
    };
    addDialog({
      title: `配置微信模板 · ${row.typeLabel || row.notificationTypeCode}`,
      width: "46%",
      draggable: true,
      fullscreen: deviceDetection(),
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: { formInline: initial },
      contentRenderer: () => h(WechatTemplateForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as WechatTemplateFormModel;
        (async () => {
          try {
            await putWechatTemplate(curData.notificationTypeCode, {
              templateId: curData.templateId,
              enabled: curData.enabled,
              remarks: curData.remarks
            });
            message("配置成功", { type: "success" });
            done();
            onSearch();
          } catch (error: any) {
            message(error?.response?.data?.message ?? "配置失败", {
              type: "error"
            });
            closeLoading();
          }
        })();
      }
    });
  }

  return {
    canRead,
    canUpdate,
    loading,
    columns,
    dataList,
    onSearch,
    openDialog
  };
}
