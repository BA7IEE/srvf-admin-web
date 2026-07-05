import { h, ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import PositionForm, { type PositionFormModel } from "../form.vue";
import {
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
  POSITION_CATEGORY_LABEL,
  type PositionItem,
  type PositionCategory,
  type PolicyStatus
} from "@/api/srvf-position";

/**
 * 职务定义（全局复用配置,自 7.11.0 fork 移植并按三件套范式重排）。
 * code 创建后不可改（PATCH 白名单不含）;被职务规则引用时删除由后端拒绝(32003)。
 */
export function usePositions() {
  const canRead = hasPerms("position.read.definition");
  const canCreate = hasPerms("position.create.definition");
  const canUpdate = hasPerms("position.update.definition");
  const canDelete = hasPerms("position.delete.definition");

  const dataList = ref<PositionItem[]>([]);
  const loading = ref(false);
  const categoryFilter = ref<"" | PositionCategory>("");
  const statusFilter = ref<"" | PolicyStatus>("");
  const formRef = ref();
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const categoryOptions = [
    { value: "", label: "全部类别" },
    ...Object.keys(POSITION_CATEGORY_LABEL).map(code => ({
      value: code,
      label: POSITION_CATEGORY_LABEL[code]
    }))
  ];
  const statusOptions = [
    { value: "", label: "全部状态" },
    { value: "ACTIVE", label: "启用" },
    { value: "INACTIVE", label: "停用" }
  ];

  const columns: TableColumnList = [
    { label: "职务 code", prop: "code", minWidth: 140 },
    { label: "名称", prop: "name", minWidth: 120 },
    {
      label: "类别",
      prop: "categoryCode",
      minWidth: 90,
      formatter: ({ categoryCode }) =>
        POSITION_CATEGORY_LABEL[categoryCode] ?? categoryCode
    },
    { label: "层级权重", prop: "rank", minWidth: 90 },
    {
      label: "领导职务",
      prop: "isLeadership",
      minWidth: 90,
      slot: "isLeadership"
    },
    {
      label: "多人在任",
      prop: "allowMultiple",
      minWidth: 90,
      slot: "allowMultiple"
    },
    {
      label: "允许兼任",
      prop: "allowConcurrent",
      minWidth: 90,
      slot: "allowConcurrent"
    },
    { label: "排序", prop: "sortOrder", minWidth: 70 },
    { label: "状态", prop: "status", minWidth: 90, slot: "status" },
    {
      label: "备注",
      prop: "description",
      minWidth: 160,
      formatter: ({ description }) => description ?? "—"
    },
    { label: "操作", fixed: "right" as const, width: 220, slot: "operation" }
  ];

  async function onSearch() {
    if (!canRead) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getPositions({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        ...(categoryFilter.value ? { categoryCode: categoryFilter.value } : {}),
        ...(statusFilter.value ? { status: statusFilter.value } : {})
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载职务定义失败", {
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

  function openDialog(title: "新建" | "编辑", row?: PositionItem) {
    const isEdit = title === "编辑";
    const initial: PositionFormModel = {
      code: row?.code ?? "",
      name: row?.name ?? "",
      categoryCode: row?.categoryCode ?? "STAFF",
      rank: row?.rank ?? 0,
      isLeadership: row?.isLeadership ?? false,
      allowMultiple: row?.allowMultiple ?? true,
      allowConcurrent: row?.allowConcurrent ?? false,
      sortOrder: row?.sortOrder ?? 0,
      status: row?.status ?? "ACTIVE",
      description: row?.description ?? ""
    };
    addDialog({
      title: `${title}职务`,
      width: "46%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: { formInline: initial, isEdit },
      contentRenderer: () => h(PositionForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as PositionFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              // code 创建后不可改（PATCH 白名单不含）
              await updatePosition(row.id, {
                name: curData.name,
                categoryCode: curData.categoryCode,
                rank: curData.rank,
                isLeadership: curData.isLeadership,
                allowMultiple: curData.allowMultiple,
                allowConcurrent: curData.allowConcurrent,
                sortOrder: curData.sortOrder,
                status: curData.status,
                description:
                  curData.description === "" ? null : curData.description
              });
              message("修改成功", { type: "success" });
            } else {
              await createPosition({
                code: curData.code,
                name: curData.name,
                categoryCode: curData.categoryCode,
                rank: curData.rank,
                isLeadership: curData.isLeadership,
                allowMultiple: curData.allowMultiple,
                allowConcurrent: curData.allowConcurrent,
                sortOrder: curData.sortOrder,
                status: curData.status,
                ...(curData.description
                  ? { description: curData.description }
                  : {})
              });
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

  /** 启停（无专用 status 端点,走 PATCH 白名单字段 status） */
  function handleToggleStatus(row: PositionItem) {
    const next: PolicyStatus = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const action = next === "ACTIVE" ? "启用" : "停用";
    ElMessageBox.confirm(`确定${action}职务「${row.name}」吗？`, "系统提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        try {
          await updatePosition(row.id, { status: next });
          message(`${action}成功`, { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? `${action}失败`, {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 软删（被职务规则引用时后端拒绝 → 弹其 message） */
  function handleDelete(row: PositionItem) {
    ElMessageBox.confirm(
      `确定删除职务「${row.name}（${row.code}）」吗？被职务规则引用时将被后端拒绝。`,
      "删除职务",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await deletePosition(row.id);
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

  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    loading,
    categoryFilter,
    categoryOptions,
    statusFilter,
    statusOptions,
    columns,
    dataList,
    pagination,
    onSearch,
    onFilterChange,
    openDialog,
    handleToggleStatus,
    handleDelete,
    handleSizeChange,
    handleCurrentChange
  };
}
