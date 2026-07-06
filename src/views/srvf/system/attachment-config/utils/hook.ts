import { bizErrorMessage } from "@/api/srvf-error";
import { h, ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import TypeForm, { type TypeFormModel } from "../type-form.vue";
import MimeForm, { type MimeFormModel } from "../mime-form.vue";
import SizeForm, { type SizeFormModel } from "../size-form.vue";
import {
  getTypeConfigs,
  createTypeConfig,
  updateTypeConfig,
  updateTypeConfigStatus,
  deleteTypeConfig,
  getMimeConfigs,
  createMimeConfig,
  updateMimeConfigStatus,
  deleteMimeConfig,
  getSizeLimitConfigs,
  createSizeLimitConfig,
  updateSizeLimitConfig,
  deleteSizeLimitConfig,
  type AttachmentTypeConfig,
  type AttachmentMimeConfig,
  type AttachmentSizeLimitConfig
} from "@/api/srvf-attachment-config";

type Option = { label: string; value: string };

export function useAttachmentConfigs() {
  const formRef = ref();

  const canReadType = hasPerms("attachment-config.read.type");
  const canCreateType = hasPerms("attachment-config.create.type");
  const canUpdateType = hasPerms("attachment-config.update.type");
  const canDeleteType = hasPerms("attachment-config.delete.type");
  const canReadMime = hasPerms("attachment-config.read.mime");
  const canCreateMime = hasPerms("attachment-config.create.mime");
  const canUpdateMime = hasPerms("attachment-config.update.mime");
  const canDeleteMime = hasPerms("attachment-config.delete.mime");
  const canReadSize = hasPerms("attachment-config.read.size-limit");
  const canCreateSize = hasPerms("attachment-config.create.size-limit");
  const canUpdateSize = hasPerms("attachment-config.update.size-limit");
  const canDeleteSize = hasPerms("attachment-config.delete.size-limit");

  const typeList = ref<AttachmentTypeConfig[]>([]);
  const mimeList = ref<AttachmentMimeConfig[]>([]);
  const sizeList = ref<AttachmentSizeLimitConfig[]>([]);
  const typeLoading = ref(false);
  const mimeLoading = ref(false);
  const sizeLoading = ref(false);
  const typePager = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });
  const mimePager = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });
  const sizePager = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const typeOptions = ref<Option[]>([]);
  const typeNameMap = ref<Record<string, string>>({});

  function typeName(id: string) {
    return typeNameMap.value[id] ?? id;
  }

  async function ensureTypeOptions() {
    try {
      const { code, data } = await getTypeConfigs({
        status: "ACTIVE",
        pageSize: 100
      });
      if (code === 0) {
        typeOptions.value = data.items.map(t => ({
          label: `${t.displayName}（${t.code}）`,
          value: t.id
        }));
        const map: Record<string, string> = {};
        data.items.forEach(t => (map[t.id] = t.displayName));
        typeNameMap.value = map;
      }
    } catch {
      // 无读权限 / 不可达 → 保持空
    }
  }

  /* ----------------------------- 类型配置 ----------------------------- */
  const typeColumns: TableColumnList = [
    { label: "Code", prop: "code", minWidth: 140 },
    { label: "显示名", prop: "displayName", minWidth: 140 },
    { label: "归属表", prop: "ownerTable", minWidth: 120 },
    {
      label: "默认上限(字节)",
      prop: "defaultMaxSizeBytes",
      minWidth: 130,
      formatter: ({ defaultMaxSizeBytes }) => defaultMaxSizeBytes ?? "—"
    },
    { label: "状态", prop: "status", minWidth: 90, slot: "status" },
    { label: "操作", fixed: "right" as const, width: 220, slot: "operation" }
  ];

  async function onSearchType() {
    if (!canReadType) return;
    typeLoading.value = true;
    try {
      const { code, data } = await getTypeConfigs({
        page: typePager.currentPage,
        pageSize: typePager.pageSize
      });
      if (code === 0) {
        typeList.value = data.items;
        typePager.total = data.total;
        typePager.pageSize = data.pageSize;
        typePager.currentPage = data.page;
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "加载类型配置失败"), {
        type: "error"
      });
    } finally {
      typeLoading.value = false;
    }
  }
  function typeSizeChange(v: number) {
    typePager.pageSize = v;
    onSearchType();
  }
  function typeCurrentChange(v: number) {
    typePager.currentPage = v;
    onSearchType();
  }

  function openTypeDialog(title: "新建" | "编辑", row?: AttachmentTypeConfig) {
    const isEdit = title === "编辑";
    addDialog({
      title: `${title}附件类型配置`,
      width: "46%",
      draggable: true,
      fullscreen: deviceDetection(),
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          code: row?.code ?? "",
          displayName: row?.displayName ?? "",
          description: row?.description ?? "",
          ownerTable: row?.ownerTable ?? "",
          defaultMaxSizeBytes: row?.defaultMaxSizeBytes ?? undefined,
          defaultMimeWhitelist: row?.defaultMimeWhitelist ?? []
        } as TypeFormModel
      },
      contentRenderer: () => h(TypeForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const cur = options.props.formInline as TypeFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              await updateTypeConfig(row.id, {
                displayName: cur.displayName,
                description: cur.description,
                ownerTable: cur.ownerTable,
                ...(cur.defaultMaxSizeBytes != null
                  ? { defaultMaxSizeBytes: cur.defaultMaxSizeBytes }
                  : {}),
                defaultMimeWhitelist: cur.defaultMimeWhitelist
              });
              message("修改成功", { type: "success" });
            } else {
              await createTypeConfig({
                code: cur.code,
                displayName: cur.displayName,
                description: cur.description,
                ownerTable: cur.ownerTable,
                ...(cur.defaultMaxSizeBytes != null
                  ? { defaultMaxSizeBytes: cur.defaultMaxSizeBytes }
                  : {}),
                defaultMimeWhitelist: cur.defaultMimeWhitelist
              });
              message("新建成功", { type: "success" });
            }
            done();
            onSearchType();
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

  function handleTypeStatus(row: AttachmentTypeConfig) {
    const next = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    runWithConfirm(
      `确定${next === "ACTIVE" ? "启用" : "停用"}类型「${row.displayName}」吗？`,
      () => updateTypeConfigStatus(row.id, next),
      onSearchType
    );
  }
  function handleTypeDelete(row: AttachmentTypeConfig) {
    runWithConfirm(
      `确定删除类型配置「${row.displayName}」吗？仍被附件引用会被后端拒绝。`,
      () => deleteTypeConfig(row.id),
      onSearchType
    );
  }

  /* ----------------------------- MIME 配置 ----------------------------- */
  const mimeColumns: TableColumnList = [
    {
      label: "类型",
      prop: "typeConfigId",
      minWidth: 150,
      formatter: ({ typeConfigId }) => typeName(typeConfigId)
    },
    { label: "MIME", prop: "mime", minWidth: 160 },
    {
      label: "备注",
      prop: "remark",
      minWidth: 140,
      formatter: ({ remark }) => remark ?? "—"
    },
    { label: "状态", prop: "status", minWidth: 90, slot: "status" },
    { label: "操作", fixed: "right" as const, width: 160, slot: "operation" }
  ];

  async function onSearchMime() {
    if (!canReadMime) return;
    mimeLoading.value = true;
    try {
      const { code, data } = await getMimeConfigs({
        page: mimePager.currentPage,
        pageSize: mimePager.pageSize
      });
      if (code === 0) {
        mimeList.value = data.items;
        mimePager.total = data.total;
        mimePager.pageSize = data.pageSize;
        mimePager.currentPage = data.page;
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "加载 MIME 配置失败"), {
        type: "error"
      });
    } finally {
      mimeLoading.value = false;
    }
  }
  function mimeSizeChange(v: number) {
    mimePager.pageSize = v;
    onSearchMime();
  }
  function mimeCurrentChange(v: number) {
    mimePager.currentPage = v;
    onSearchMime();
  }

  async function openMimeDialog() {
    await ensureTypeOptions();
    addDialog({
      title: "新建 MIME 配置",
      width: "42%",
      draggable: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: { typeConfigId: "", mime: "", remark: "" } as MimeFormModel,
        typeOptions: typeOptions.value
      },
      contentRenderer: () => h(MimeForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const cur = options.props.formInline as MimeFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            await createMimeConfig({
              typeConfigId: cur.typeConfigId,
              mime: cur.mime,
              remark: cur.remark
            });
            message("新建成功", { type: "success" });
            done();
            onSearchMime();
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
  function handleMimeStatus(row: AttachmentMimeConfig) {
    const next = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    runWithConfirm(
      `确定${next === "ACTIVE" ? "启用" : "停用"} MIME「${row.mime}」吗？`,
      () => updateMimeConfigStatus(row.id, next),
      onSearchMime
    );
  }
  function handleMimeDelete(row: AttachmentMimeConfig) {
    runWithConfirm(
      `确定删除 MIME 配置「${row.mime}」吗？`,
      () => deleteMimeConfig(row.id),
      onSearchMime
    );
  }

  /* --------------------------- 尺寸限制配置 --------------------------- */
  const sizeColumns: TableColumnList = [
    {
      label: "类型",
      prop: "typeConfigId",
      minWidth: 150,
      formatter: ({ typeConfigId }) => typeName(typeConfigId)
    },
    { label: "大小上限(字节)", prop: "maxSizeBytes", minWidth: 140 },
    {
      label: "备注",
      prop: "remark",
      minWidth: 140,
      formatter: ({ remark }) => remark ?? "—"
    },
    { label: "操作", fixed: "right" as const, width: 160, slot: "operation" }
  ];

  async function onSearchSize() {
    if (!canReadSize) return;
    sizeLoading.value = true;
    try {
      const { code, data } = await getSizeLimitConfigs({
        page: sizePager.currentPage,
        pageSize: sizePager.pageSize
      });
      if (code === 0) {
        sizeList.value = data.items;
        sizePager.total = data.total;
        sizePager.pageSize = data.pageSize;
        sizePager.currentPage = data.page;
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "加载尺寸限制配置失败"), {
        type: "error"
      });
    } finally {
      sizeLoading.value = false;
    }
  }
  function sizeSizeChange(v: number) {
    sizePager.pageSize = v;
    onSearchSize();
  }
  function sizeCurrentChange(v: number) {
    sizePager.currentPage = v;
    onSearchSize();
  }

  async function openSizeDialog(
    title: "新建" | "编辑",
    row?: AttachmentSizeLimitConfig
  ) {
    const isEdit = title === "编辑";
    await ensureTypeOptions();
    addDialog({
      title: `${title}尺寸限制配置`,
      width: "42%",
      draggable: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          typeConfigId: row?.typeConfigId ?? "",
          maxSizeBytes: row?.maxSizeBytes ?? undefined,
          remark: row?.remark ?? ""
        } as SizeFormModel,
        typeOptions: typeOptions.value
      },
      contentRenderer: () => h(SizeForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const cur = options.props.formInline as SizeFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              await updateSizeLimitConfig(row.id, {
                ...(cur.maxSizeBytes != null
                  ? { maxSizeBytes: cur.maxSizeBytes }
                  : {}),
                remark: cur.remark
              });
              message("修改成功", { type: "success" });
            } else {
              await createSizeLimitConfig({
                typeConfigId: cur.typeConfigId,
                maxSizeBytes: cur.maxSizeBytes as number,
                remark: cur.remark
              });
              message("新建成功", { type: "success" });
            }
            done();
            onSearchSize();
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
  function handleSizeDelete(row: AttachmentSizeLimitConfig) {
    runWithConfirm(
      `确定删除该尺寸限制配置吗？`,
      () => deleteSizeLimitConfig(row.id),
      onSearchSize
    );
  }

  /** 统一 confirm + 调用 + 刷新 */
  function runWithConfirm(
    text: string,
    fn: () => Promise<unknown>,
    refresh: () => void
  ) {
    ElMessageBox.confirm(text, "系统提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        try {
          await fn();
          message("操作成功", { type: "success" });
          refresh();
        } catch (error: any) {
          message(bizErrorMessage(error, "操作失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  async function init() {
    await ensureTypeOptions();
    onSearchType();
    onSearchMime();
    onSearchSize();
  }

  return {
    canReadType,
    canCreateType,
    canUpdateType,
    canDeleteType,
    canReadMime,
    canCreateMime,
    canUpdateMime,
    canDeleteMime,
    canReadSize,
    canCreateSize,
    canUpdateSize,
    canDeleteSize,
    typeList,
    mimeList,
    sizeList,
    typeLoading,
    mimeLoading,
    sizeLoading,
    typePager,
    mimePager,
    sizePager,
    typeColumns,
    mimeColumns,
    sizeColumns,
    init,
    onSearchType,
    onSearchMime,
    onSearchSize,
    typeSizeChange,
    typeCurrentChange,
    mimeSizeChange,
    mimeCurrentChange,
    sizeSizeChange,
    sizeCurrentChange,
    openTypeDialog,
    handleTypeStatus,
    handleTypeDelete,
    openMimeDialog,
    handleMimeStatus,
    handleMimeDelete,
    openSizeDialog,
    handleSizeDelete
  };
}
