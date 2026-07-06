import { bizErrorMessage } from "@/api/srvf-error";
import { h, ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import DictTypeForm, { type DictTypeFormModel } from "../type-form.vue";
import DictItemForm, { type DictItemFormModel } from "../item-form.vue";
import {
  getDictTypes,
  createDictType,
  updateDictType,
  deleteDictType,
  updateDictTypeStatus,
  getDictItems,
  createDictItem,
  updateDictItem,
  deleteDictItem,
  updateDictItemStatus,
  type DictTypeItem,
  type DictItem
} from "@/api/srvf-dict";

export function useDictTypes() {
  /* -------------------------------- 权限 -------------------------------- */
  const canRead = hasPerms("dict.read.type");
  const canReadItem = hasPerms("dict.read.item");
  const canCreateType = hasPerms("dict.create.type");
  const canUpdateType = hasPerms("dict.update.type");
  const canDeleteType = hasPerms("dict.delete.type");
  const canCreateItem = hasPerms("dict.create.item");
  const canUpdateItem = hasPerms("dict.update.item");
  const canDeleteItem = hasPerms("dict.delete.item");

  /* ------------------------------ 左侧：类型 ----------------------------- */
  const dataList = ref<DictTypeItem[]>([]);
  const loading = ref(false);
  const selectedType = ref<DictTypeItem | null>(null);
  const formRef = ref();

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    { label: "类型 code", prop: "code", minWidth: 140 },
    { label: "显示名", prop: "label", minWidth: 130 },
    { label: "排序", prop: "sortOrder", minWidth: 70 },
    { label: "状态", prop: "status", minWidth: 90, slot: "status" },
    ...(canUpdateType || canDeleteType
      ? [
          {
            label: "操作",
            fixed: "right" as const,
            width: 200,
            slot: "operation"
          }
        ]
      : [])
  ];

  async function onSearch() {
    if (!canRead) return;
    loading.value = true;
    try {
      const { code, data } = await getDictTypes({
        page: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
        // 已选类型若已不在列表中则清空右侧
        if (
          selectedType.value &&
          !data.items.some(t => t.id === selectedType.value!.id)
        ) {
          selectedType.value = null;
          itemList.value = [];
        }
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "加载字典类型失败"), {
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

  function selectType(row: DictTypeItem) {
    selectedType.value = row;
    itemPagination.currentPage = 1;
    onSearchItems();
  }

  /** 左侧类型行样式：可点击 + 选中高亮（参 full-version table-select/radio 范式） */
  function rowStyle({ row }: { row: DictTypeItem }) {
    return {
      cursor: "pointer",
      background:
        selectedType.value?.id === row.id ? "var(--el-fill-color-light)" : ""
    };
  }

  function openTypeDialog(title: "新建" | "编辑", row?: DictTypeItem) {
    const isEdit = title === "编辑";
    addDialog({
      title: `${title}字典类型`,
      width: "36%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          code: row?.code ?? "",
          label: row?.label ?? "",
          sortOrder: row?.sortOrder ?? 0
        } as DictTypeFormModel
      },
      contentRenderer: () => h(DictTypeForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as DictTypeFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              await updateDictType(row.id, {
                label: curData.label,
                sortOrder: curData.sortOrder
              });
              message("修改成功", { type: "success" });
            } else {
              await createDictType({
                code: curData.code,
                label: curData.label,
                sortOrder: curData.sortOrder
              });
              message("新建成功", { type: "success" });
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

  function handleToggleTypeStatus(row: DictTypeItem) {
    const next = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const action = next === "ACTIVE" ? "启用" : "停用";
    ElMessageBox.confirm(
      `确定要${action}字典类型「${row.label}」吗？`,
      "系统提示",
      { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
    )
      .then(async () => {
        try {
          await updateDictTypeStatus(row.id, next);
          message(`${action}成功`, { type: "success" });
          onSearch();
        } catch (error: any) {
          message(bizErrorMessage(error, `${action}失败`), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  function handleDeleteType(row: DictTypeItem) {
    ElMessageBox.confirm(`确定要删除字典类型「${row.label}」吗？`, "系统提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        try {
          await deleteDictType(row.id);
          message("删除成功", { type: "success" });
          if (selectedType.value?.id === row.id) {
            selectedType.value = null;
            itemList.value = [];
          }
          onSearch();
        } catch (error: any) {
          message(bizErrorMessage(error, "删除失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /* ------------------------------ 右侧：条目 ----------------------------- */
  const itemList = ref<DictItem[]>([]);
  const itemLoading = ref(false);
  const itemPagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  function parentLabelOf(parentId: string) {
    return itemList.value.find(i => i.id === parentId)?.label ?? "子级";
  }

  const itemColumns: TableColumnList = [
    { label: "条目 code", prop: "code", minWidth: 140 },
    { label: "显示名", prop: "label", minWidth: 130 },
    {
      label: "父级",
      prop: "parentId",
      minWidth: 110,
      formatter: ({ parentId }) => (parentId ? parentLabelOf(parentId) : "顶级")
    },
    { label: "排序", prop: "sortOrder", minWidth: 70 },
    { label: "状态", prop: "status", minWidth: 90, slot: "itemStatus" },
    ...(canUpdateItem || canDeleteItem
      ? [
          {
            label: "操作",
            fixed: "right" as const,
            width: 200,
            slot: "itemOperation"
          }
        ]
      : [])
  ];

  async function onSearchItems() {
    if (!selectedType.value || !canReadItem) return;
    itemLoading.value = true;
    try {
      const { code, data } = await getDictItems({
        typeId: selectedType.value.id,
        page: itemPagination.currentPage,
        pageSize: itemPagination.pageSize
      });
      if (code === 0) {
        itemList.value = data.items;
        itemPagination.total = data.total;
        itemPagination.pageSize = data.pageSize;
        itemPagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "加载字典条目失败"), {
        type: "error"
      });
    } finally {
      itemLoading.value = false;
    }
  }

  function handleItemSizeChange(val: number) {
    itemPagination.pageSize = val;
    onSearchItems();
  }
  function handleItemCurrentChange(val: number) {
    itemPagination.currentPage = val;
    onSearchItems();
  }

  function openItemDialog(title: "新建" | "编辑", row?: DictItem) {
    if (!selectedType.value) return;
    const isEdit = title === "编辑";
    const typeId = selectedType.value.id;
    addDialog({
      title: `${title}字典条目`,
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          typeLabel: selectedType.value.label,
          code: row?.code ?? "",
          label: row?.label ?? "",
          parentId: row?.parentId ?? null,
          sortOrder: row?.sortOrder ?? 0
        } as DictItemFormModel,
        // 同类型其它条目作父级候选（编辑态排除自身，避免自环）
        parentOptions: itemList.value
          .filter(i => i.id !== row?.id)
          .map(i => ({ id: i.id, label: i.label }))
      },
      contentRenderer: () => h(DictItemForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as DictItemFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              // 后端 UpdateDictItemDto 白名单：仅 label / sortOrder
              await updateDictItem(row.id, {
                label: curData.label,
                sortOrder: curData.sortOrder
              });
              message("修改成功", { type: "success" });
            } else {
              await createDictItem({
                typeId,
                code: curData.code,
                label: curData.label,
                parentId: curData.parentId ?? undefined,
                sortOrder: curData.sortOrder
              });
              message("新建成功", { type: "success" });
            }
            done();
            onSearchItems();
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

  function handleToggleItemStatus(row: DictItem) {
    const next = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const action = next === "ACTIVE" ? "启用" : "停用";
    ElMessageBox.confirm(
      `确定要${action}条目「${row.label}」吗？`,
      "系统提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await updateDictItemStatus(row.id, next);
          message(`${action}成功`, { type: "success" });
          onSearchItems();
        } catch (error: any) {
          message(bizErrorMessage(error, `${action}失败`), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  function handleDeleteItem(row: DictItem) {
    ElMessageBox.confirm(`确定要删除条目「${row.label}」吗？`, "系统提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        try {
          await deleteDictItem(row.id);
          message("删除成功", { type: "success" });
          onSearchItems();
        } catch (error: any) {
          message(bizErrorMessage(error, "删除失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  return {
    // 权限
    canRead,
    canReadItem,
    canCreateType,
    canUpdateType,
    canDeleteType,
    canCreateItem,
    canUpdateItem,
    canDeleteItem,
    // 类型（左）
    loading,
    columns,
    dataList,
    pagination,
    selectedType,
    rowStyle,
    onSearch,
    selectType,
    openTypeDialog,
    handleDeleteType,
    handleToggleTypeStatus,
    handleSizeChange,
    handleCurrentChange,
    // 条目（右）
    itemLoading,
    itemColumns,
    itemList,
    itemPagination,
    onSearchItems,
    openItemDialog,
    handleDeleteItem,
    handleToggleItemStatus,
    handleItemSizeChange,
    handleItemCurrentChange
  };
}
