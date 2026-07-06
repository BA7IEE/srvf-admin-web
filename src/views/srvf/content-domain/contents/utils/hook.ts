import { bizErrorMessage } from "@/api/srvf-error";
import { h, ref, reactive } from "vue";
import dayjs from "dayjs";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { getDictTypes, getDictItems } from "@/api/srvf-dict";
import { getOrganizations } from "@/api/srvf-organization";
import ContentForm, { type ContentFormModel } from "../form.vue";
import {
  getContents,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  publishContent,
  unpublishContent,
  archiveContent,
  CONTENT_STATUS_LABEL,
  CONTENT_STATUS_TAG,
  VISIBILITY_LABEL,
  type ContentListItem
} from "@/api/srvf-content";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

type Option = { label: string; value: string };

export function useContents() {
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["content_type"]);

  const canRead = hasPerms("content.read.record");
  const canCreate = hasPerms("content.create.record");
  const canUpdate = hasPerms("content.update.record");
  const canDelete = hasPerms("content.delete.record");
  const canPublish = hasPerms("content.publish.record");

  const dataList = ref<ContentListItem[]>([]);
  const loading = ref(false);
  const statusFilter = ref<string>("");
  const keyword = ref<string>("");
  const formRef = ref();
  /** 封面/附件管理 drawer（仅对已存在内容开放） */
  const mediaVisible = ref(false);
  const mediaContentId = ref<string>("");
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  /** content_type 字典下拉 + 可见部门下拉(懒加载;空 → 退化) */
  const typeOptions = ref<Option[]>([]);
  const orgOptions = ref<Option[]>([]);
  let typeResolved = false;
  let orgResolved = false;

  const statusOptions = [
    { value: "", label: "全部状态" },
    ...Object.keys(CONTENT_STATUS_LABEL).map(code => ({
      value: code,
      label: CONTENT_STATUS_LABEL[code]
    }))
  ];

  const columns: TableColumnList = [
    { label: "标题", prop: "title", minWidth: 200 },
    {
      label: "类型",
      prop: "contentTypeCode",
      minWidth: 110,
      formatter: ({ contentTypeCode }) =>
        dict.label("content_type", contentTypeCode)
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
      label: "置顶",
      prop: "pinned",
      minWidth: 80,
      formatter: ({ pinned }) => (pinned ? "是" : "否")
    },
    { label: "浏览", prop: "viewCount", minWidth: 80 },
    {
      label: "更新时间",
      prop: "updatedAt",
      minWidth: 165,
      formatter: ({ updatedAt }) =>
        updatedAt ? dayjs(updatedAt).format("YYYY-MM-DD HH:mm") : "—"
    },
    { label: "操作", fixed: "right" as const, width: 320, slot: "operation" }
  ];

  function statusMeta(code: string) {
    return {
      text: CONTENT_STATUS_LABEL[code] ?? code,
      type: CONTENT_STATUS_TAG[code] ?? ("info" as const)
    };
  }

  async function onSearch() {
    if (!canRead) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getContents({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        ...(statusFilter.value ? { statusCode: statusFilter.value } : {}),
        ...(keyword.value ? { keyword: keyword.value } : {})
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "加载内容列表失败"), {
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
  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }
  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
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
      const t = data.items.find(x => x.code === "content_type");
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

  /** 新建 / 编辑（编辑先取详情拿 body + 可见部门；archived 冻结由后端拒绝 → 弹 message） */
  async function openDialog(title: "新建" | "编辑", row?: ContentListItem) {
    await Promise.all([ensureTypeOptions(), ensureOrgOptions()]);
    const isEdit = title === "编辑";
    let initial: ContentFormModel = {
      title: "",
      summary: "",
      body: "",
      contentTypeCode: "",
      visibilityCode: "member",
      visibleOrganizationIds: [],
      tags: [],
      pinned: false
    };
    if (isEdit && row) {
      try {
        const { code, data } = await getContent(row.id);
        if (code === 0) {
          initial = {
            title: data.title,
            summary: data.summary ?? "",
            body: data.body,
            contentTypeCode: data.contentTypeCode,
            visibilityCode:
              data.visibilityCode as ContentFormModel["visibilityCode"],
            visibleOrganizationIds: data.visibleOrganizationIds ?? [],
            tags: data.tags ?? [],
            pinned: data.pinned
          };
        }
      } catch (error: any) {
        message(bizErrorMessage(error, "加载内容详情失败"), {
          type: "error"
        });
        return;
      }
    }
    addDialog({
      title: `${title}内容`,
      width: "60%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: initial,
        typeOptions: typeOptions.value,
        orgOptions: orgOptions.value,
        contentId: isEdit && row ? row.id : ""
      },
      contentRenderer: () => h(ContentForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as ContentFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          // 非 department 可见性不提交可见部门
          const visOrgs =
            curData.visibilityCode === "department"
              ? curData.visibleOrganizationIds
              : [];
          const payload = {
            title: curData.title,
            summary: curData.summary,
            body: curData.body,
            contentTypeCode: curData.contentTypeCode,
            visibilityCode: curData.visibilityCode,
            visibleOrganizationIds: visOrgs,
            tags: curData.tags,
            pinned: curData.pinned
          };
          try {
            if (isEdit && row) {
              await updateContent(row.id, payload);
              message("修改成功", { type: "success" });
            } else {
              await createContent(payload);
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
    row: ContentListItem,
    action: "publish" | "unpublish" | "archive"
  ) {
    const meta = {
      publish: { label: "发布", fn: publishContent, tip: "草稿将发布上线。" },
      unpublish: {
        label: "撤回",
        fn: unpublishContent,
        tip: "已发布内容将撤回为草稿。"
      },
      archive: {
        label: "归档",
        fn: archiveContent,
        tip: "归档后为终态,不可逆。"
      }
    }[action];
    ElMessageBox.confirm(
      `确定${meta.label}「${row.title}」吗？${meta.tip}`,
      `${meta.label}内容`,
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

  function handleDelete(row: ContentListItem) {
    ElMessageBox.confirm(`确定删除内容「${row.title}」吗？`, "删除内容", {
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        try {
          await deleteContent(row.id);
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

  /** 打开某内容的封面/附件管理 drawer */
  function openMedia(row: ContentListItem) {
    mediaContentId.value = row.id;
    mediaVisible.value = true;
  }

  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canPublish,
    loading,
    statusFilter,
    statusOptions,
    keyword,
    columns,
    dataList,
    pagination,
    statusMeta,
    mediaVisible,
    mediaContentId,
    onSearch,
    onFilterChange,
    openDialog,
    runStateAction,
    handleDelete,
    openMedia,
    handleSizeChange,
    handleCurrentChange
  };
}
