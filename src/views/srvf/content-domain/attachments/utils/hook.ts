import { bizErrorMessage } from "@/api/srvf-error";
import { reactive, ref } from "vue";
import dayjs from "dayjs";
import { ElMessageBox } from "element-plus";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import {
  getAttachments,
  getAttachmentsByOwner,
  updateAttachment,
  deleteAttachment,
  uploadAttachment,
  ACCESS_LEVEL_LABEL,
  ACCESS_LEVEL_TAG,
  type Attachment,
  type AttachmentAccessLevel,
  type UpdateAttachmentBody
} from "@/api/srvf-attachment";
import {
  getTypeConfigs,
  type AttachmentTypeConfig
} from "@/api/srvf-attachment-config";

/**
 * ownerType 权限拆分不统一（member/certificate 拆 self/other，activity 不拆，
 * content-image/content-file 只有 upload/delete 没有 view/update——内容附件走
 * `content.read.record` 内嵌读取，不走本页）。未在此登记的 ownerType 不在前端拦，
 * 交给后端 403 兜底——不为假设中的未来 ownerType 编码猜测权限码。
 */
const OWNER_TYPE_PERM: Record<
  string,
  { view?: string[]; upload?: string[]; update?: string[]; delete?: string[] }
> = {
  member: {
    view: ["attachment.view.member.other", "attachment.view.member.self"],
    upload: ["attachment.upload.member.other", "attachment.upload.member.self"],
    update: ["attachment.update.member.other", "attachment.update.member.self"],
    delete: ["attachment.delete.member.other", "attachment.delete.member.self"]
  },
  certificate: {
    view: [
      "attachment.view.certificate.other",
      "attachment.view.certificate.self"
    ],
    upload: [
      "attachment.upload.certificate.other",
      "attachment.upload.certificate.self"
    ],
    update: [
      "attachment.update.certificate.other",
      "attachment.update.certificate.self"
    ],
    delete: [
      "attachment.delete.certificate.other",
      "attachment.delete.certificate.self"
    ]
  },
  activity: {
    view: ["attachment.view.activity"],
    upload: ["attachment.upload.activity"],
    update: ["attachment.update.activity"],
    delete: ["attachment.delete.activity"]
  },
  "content-image": {
    upload: ["attachment.upload.content-image"],
    delete: ["attachment.delete.content-image"]
  },
  "content-file": {
    upload: ["attachment.upload.content-file"],
    delete: ["attachment.delete.content-file"]
  }
};

function checkAny(codes: string[] | undefined) {
  if (!codes) return true; // 未登记的 action/ownerType 组合：不在前端拦，交后端兜底
  return codes.some(code => hasPerms(code));
}

/** 页面级总门：任一已知 ownerType 的 view 权限命中即可看到本页。 */
export function canViewAttachmentLibrary() {
  return Object.values(OWNER_TYPE_PERM).some(entry => checkAny(entry.view));
}

/** 字节数 → 人类可读（本页专用，未见既有共享工具）。 */
export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function useAttachments() {
  const dataList = ref<Attachment[]>([]);
  const loading = ref(false);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 20,
    currentPage: 1,
    background: true
  });

  const filters = reactive({
    ownerType: "",
    ownerId: "",
    uploadedBy: "",
    mime: "",
    accessLevel: "" as AttachmentAccessLevel | ""
  });

  const columns: TableColumnList = [
    { label: "文件名", prop: "originalName", minWidth: 180 },
    {
      label: "归属",
      minWidth: 160,
      formatter: (row: Attachment) => `${row.ownerType} / ${row.ownerId}`
    },
    { label: "MIME", prop: "mime", minWidth: 140 },
    {
      label: "大小",
      minWidth: 90,
      formatter: (row: Attachment) => formatBytes(row.size)
    },
    {
      label: "访问级别",
      prop: "accessLevel",
      minWidth: 90,
      slot: "accessLevel"
    },
    {
      label: "标签",
      minWidth: 120,
      formatter: (row: Attachment) =>
        row.tags.length ? row.tags.join("、") : "—"
    },
    {
      label: "上传人",
      minWidth: 100,
      formatter: (row: Attachment) => row.originalUploaderName ?? row.uploadedBy
    },
    {
      label: "上传时间",
      minWidth: 160,
      formatter: (row: Attachment) =>
        row.uploadedAt
          ? dayjs(row.uploadedAt).format("YYYY-MM-DD HH:mm:ss")
          : "—"
    },
    { label: "操作", fixed: "right", width: 200, slot: "operation" }
  ];

  function accessLevelLabel(level: AttachmentAccessLevel | null) {
    return level ? ACCESS_LEVEL_LABEL[level] : "—";
  }
  function accessLevelTag(level: AttachmentAccessLevel | null) {
    return level ? ACCESS_LEVEL_TAG[level] : "info";
  }

  const typeConfigs = ref<AttachmentTypeConfig[]>([]);
  async function loadTypeConfigs() {
    try {
      const { code, data } = await getTypeConfigs({
        pageSize: 50,
        status: "ACTIVE"
      });
      if (code === 0) typeConfigs.value = data.items;
    } catch {
      // 类型配置仅用于填充上传对话框的下拉，取不到不影响列表主功能
    }
  }

  async function onSearch() {
    loading.value = true;
    try {
      const hasOwnerPair = filters.ownerType && filters.ownerId;
      const { code, data } = hasOwnerPair
        ? await getAttachmentsByOwner({
            ownerType: filters.ownerType,
            ownerId: filters.ownerId,
            page: pagination.currentPage,
            pageSize: pagination.pageSize
          })
        : await getAttachments({
            ownerType: filters.ownerType || undefined,
            ownerId: filters.ownerId || undefined,
            uploadedBy: filters.uploadedBy || undefined,
            mime: filters.mime || undefined,
            accessLevel: filters.accessLevel || undefined,
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
      message(bizErrorMessage(error, "加载附件列表失败"), {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  function onFilterChange() {
    pagination.currentPage = 1;
    onSearch();
  }
  function resetFilters() {
    filters.ownerType = "";
    filters.ownerId = "";
    filters.uploadedBy = "";
    filters.mime = "";
    filters.accessLevel = "";
    onFilterChange();
  }
  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }
  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  function canView(ownerType: string) {
    return checkAny(OWNER_TYPE_PERM[ownerType]?.view);
  }
  function canUpload(ownerType: string) {
    return checkAny(OWNER_TYPE_PERM[ownerType]?.upload);
  }
  function canUpdate(ownerType: string) {
    return checkAny(OWNER_TYPE_PERM[ownerType]?.update);
  }
  function canDelete(ownerType: string) {
    return checkAny(OWNER_TYPE_PERM[ownerType]?.delete);
  }

  /* -------------------- 上传：先填归属，再拖拽/选文件即传（镜像 content-media.vue 的 http-request 直传） -------------------- */
  const uploadVisible = ref(false);
  const uploading = ref(false);
  const uploadForm = reactive({ ownerType: "", ownerId: "" });

  function openUpload() {
    uploadForm.ownerType = "";
    uploadForm.ownerId = "";
    uploadVisible.value = true;
  }

  async function customUpload(opt: { file: File }) {
    if (!uploadForm.ownerType || !uploadForm.ownerId) {
      message("请先选择归属类型并填写归属对象 id", { type: "warning" });
      return;
    }
    uploading.value = true;
    try {
      await uploadAttachment(
        uploadForm.ownerType,
        uploadForm.ownerId,
        opt.file
      );
      message("上传成功", { type: "success" });
      pagination.currentPage = 1;
      await onSearch();
    } catch (error: any) {
      message(error?.response?.data?.message ?? error?.message ?? "上传失败", {
        type: "error"
      });
    } finally {
      uploading.value = false;
    }
  }

  /* -------------------- 编辑元数据 -------------------- */
  const editVisible = ref(false);
  const editSubmitting = ref(false);
  const editTarget = ref<Attachment | null>(null);
  const editForm = reactive<UpdateAttachmentBody & { tagsText: string }>({
    description: "",
    accessLevel: undefined,
    tagsText: "",
    expireAt: null
  });

  function openEdit(row: Attachment) {
    editTarget.value = row;
    editForm.description = row.description ?? "";
    editForm.accessLevel = row.accessLevel ?? undefined;
    editForm.tagsText = row.tags.join(",");
    editForm.expireAt = row.expireAt;
    editVisible.value = true;
  }

  async function submitEdit() {
    if (!editTarget.value) return;
    editSubmitting.value = true;
    try {
      const body: UpdateAttachmentBody = {
        description: editForm.description || null,
        tags: editForm.tagsText
          .split(",")
          .map(t => t.trim())
          .filter(Boolean),
        expireAt: editForm.expireAt || null
      };
      if (editForm.accessLevel) body.accessLevel = editForm.accessLevel;
      const { code } = await updateAttachment(editTarget.value.id, body);
      if (code === 0) {
        message("更新成功", { type: "success" });
        editVisible.value = false;
        await onSearch();
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "更新失败"), { type: "error" });
    } finally {
      editSubmitting.value = false;
    }
  }

  /* -------------------- 删除（物理删，不查跨表引用） -------------------- */
  async function handleDelete(row: Attachment) {
    try {
      await ElMessageBox.confirm(
        `即将物理删除「${row.originalName}」。此操作不检查其它记录（如内容封面）是否仍引用该附件，删除后无法恢复。确定继续？`,
        "删除确认",
        {
          type: "warning",
          confirmButtonText: "确定删除",
          confirmButtonClass: "el-button--danger"
        }
      );
    } catch {
      return;
    }
    try {
      const { code } = await deleteAttachment(row.id);
      if (code === 0) {
        message("删除成功", { type: "success" });
        await onSearch();
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "删除失败"), { type: "error" });
    }
  }

  return {
    filters,
    columns,
    dataList,
    loading,
    pagination,
    typeConfigs,
    loadTypeConfigs,
    accessLevelLabel,
    accessLevelTag,
    onSearch,
    onFilterChange,
    resetFilters,
    handleSizeChange,
    handleCurrentChange,
    canView,
    canUpload,
    canUpdate,
    canDelete,
    uploadVisible,
    uploading,
    uploadForm,
    openUpload,
    customUpload,
    editVisible,
    editSubmitting,
    editTarget,
    editForm,
    openEdit,
    submitEdit,
    handleDelete
  };
}
