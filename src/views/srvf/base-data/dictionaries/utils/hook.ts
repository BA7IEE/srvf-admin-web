import { bizErrorMessage } from "@/api/srvf-error";
import { h, ref, computed } from "vue";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { fetchAllPages } from "@/srvf-kit";
import { addDialog } from "@/components/ReDialog";
import DictTypeForm, { type DictTypeFormModel } from "../type-form.vue";
import DictItemForm, { type DictItemFormModel } from "../item-form.vue";
import {
  getDictTypes,
  createDictType,
  updateDictType,
  deleteDictType,
  updateDictTypeStatus,
  getDictItemTree,
  createDictItem,
  updateDictItem,
  deleteDictItem,
  updateDictItemStatus,
  type DictTypeItem,
  type DictItem,
  type DictItemTreeNode
} from "@/api/srvf-dict";

// 后端分页硬上限 100（PaginationQueryDto），左侧类型导航一次性拉全量（不分页，改滚动）。
const TYPE_FETCH_PAGE_SIZE = 100;
// 防御性上限：即使类型数远超「几十个」的预期，循环也保证收敛，不做无界 while(true)。
const TYPE_FETCH_MAX_PAGES = 50;

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
  const typeList = ref<DictTypeItem[]>([]);
  const typeLoading = ref(false);
  const typeKeyword = ref("");
  const selectedType = ref<DictTypeItem | null>(null);
  const formRef = ref();

  /** 搜索（label / code 子串，忽略大小写）；类型数量小，纯前端过滤，无需防抖 */
  const filteredTypeList = computed(() => {
    const kw = typeKeyword.value.trim().toLowerCase();
    if (!kw) return typeList.value;
    return typeList.value.filter(
      t =>
        t.label.toLowerCase().includes(kw) || t.code.toLowerCase().includes(kw)
    );
  });

  /** 循环拉全量类型（后端 pageSize 上限 100）；导航列表不分页，改滚动展示 */
  async function fetchAllTypes(): Promise<DictTypeItem[]> {
    const { items } = await fetchAllPages(
      (page, pageSize) => getDictTypes({ page, pageSize }),
      { pageSize: TYPE_FETCH_PAGE_SIZE, maxPages: TYPE_FETCH_MAX_PAGES }
    );
    return items;
  }

  async function fetchTypes() {
    if (!canRead) return;
    typeLoading.value = true;
    try {
      const all = await fetchAllTypes();
      typeList.value = all;
      if (selectedType.value) {
        const fresh = all.find(t => t.id === selectedType.value!.id);
        if (fresh) {
          // 类型可能被并发编辑（label/status），指回最新对象，避免右侧标题/状态显示过期
          selectedType.value = fresh;
        } else {
          // 已选类型不在最新列表中（被删除等）→ 清空右侧
          selectedType.value = null;
          itemTree.value = [];
        }
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "加载字典类型失败"), {
        type: "error"
      });
    } finally {
      typeLoading.value = false;
    }
  }

  function selectType(row: DictTypeItem) {
    if (selectedType.value?.id === row.id) return;
    selectedType.value = row;
    fetchItems();
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
            fetchTypes();
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
          fetchTypes();
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
            itemTree.value = [];
          }
          fetchTypes();
        } catch (error: any) {
          message(bizErrorMessage(error, "删除失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /* ------------------------------ 右侧：条目 ----------------------------- */
  /** 树形表格数据；`el-table` 依 `row-key` + 每行的 `children` 自动渲染为树 */
  const itemTree = ref<DictItemTreeNode[]>([]);
  const itemLoading = ref(false);

  const itemColumns: TableColumnList = [
    // 显示名放第一列以承载树形缩进 + 展开图标，比 code 更适合表达层级；
    // 必须左对齐——align-whole="center" 会跟树形缩进打架，同深度文字对不齐左边线，层级看着乱
    { label: "显示名", prop: "label", minWidth: 160, align: "left" },
    { label: "条目 code", prop: "code", minWidth: 140 },
    { label: "排序", prop: "sortOrder", minWidth: 70 },
    { label: "状态", prop: "status", minWidth: 90, slot: "itemStatus" },
    ...(canUpdateItem || canDeleteItem
      ? [
          {
            label: "操作",
            fixed: "right" as const,
            width: 190,
            slot: "itemOperation"
          }
        ]
      : [])
  ];

  async function fetchItems() {
    if (!selectedType.value || !canReadItem) {
      itemTree.value = [];
      return;
    }
    itemLoading.value = true;
    try {
      const { code, data } = await getDictItemTree({
        typeId: selectedType.value.id
      });
      if (code === 0) itemTree.value = data;
    } catch (error: any) {
      message(bizErrorMessage(error, "加载字典条目失败"), {
        type: "error"
      });
    } finally {
      itemLoading.value = false;
    }
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
        // 父级候选 = 当前类型完整条目树（非当前页/非当前展开状态截取），任意已有条目均可选
        parentTreeData: itemTree.value
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
            fetchItems();
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
          fetchItems();
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
          fetchItems();
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
    typeLoading,
    typeKeyword,
    filteredTypeList,
    selectedType,
    fetchTypes,
    selectType,
    openTypeDialog,
    handleDeleteType,
    handleToggleTypeStatus,
    // 条目（右）
    itemLoading,
    itemColumns,
    itemTree,
    fetchItems,
    openItemDialog,
    handleDeleteItem,
    handleToggleItemStatus
  };
}
