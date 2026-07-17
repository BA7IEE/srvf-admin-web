import { bizErrorMessage } from "@/api/srvf-error";
import { h, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { useSrvfList } from "@/srvf-kit";
import { getDictTypes, getDictItems } from "@/api/srvf-dict";
import PositionRuleForm, { type PositionRuleFormModel } from "../form.vue";
import {
  getPositionRules,
  createPositionRule,
  updatePositionRule,
  deletePositionRule,
  getPositionOptions,
  type PositionRuleItem,
  type PositionRuleListQuery,
  type PositionOptionItem,
  type PolicyStatus
} from "@/api/srvf-position";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

type Option = { label: string; value: string };

/**
 * 职务规则（某组织类别可设哪些职务;(nodeTypeCode, positionId) 唯一,创建后二键不可改）。
 * 自 7.11.0 fork 移植并按三件套范式重排;职务下拉改用 v0.36 options 端点。
 */
export function usePositionRules() {
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["node_type"]);

  const canRead = hasPerms("position-rule.read.record");
  const canCreate = hasPerms("position-rule.create.record");
  const canUpdate = hasPerms("position-rule.update.record");
  const canDelete = hasPerms("position-rule.delete.record");

  const nodeTypeFilter = ref<string>("");
  const positionFilter = ref<string>("");
  const statusFilter = ref<"" | PolicyStatus>("");
  const formRef = ref();

  const statusOptions = [
    { value: "", label: "全部状态" },
    { value: "ACTIVE", label: "启用" },
    { value: "INACTIVE", label: "停用" }
  ];

  /** node_type 字典项（过滤 + 表单;拉不到 → 表单退化 allow-create 手填 code） */
  const nodeTypeOptions = ref<Option[]>([]);
  let nodeTypeResolved = false;
  /** 职务下拉（options 端点;不限 status,便于历史规则里停用职务也可读名） */
  const positionOptions = ref<PositionOptionItem[]>([]);
  let positionsResolved = false;
  const positionNameById = ref<Record<string, string>>({});

  async function ensureNodeTypeOptions() {
    if (nodeTypeResolved) return;
    nodeTypeResolved = true;
    try {
      const { code, data } = await getDictTypes({
        status: "ACTIVE",
        pageSize: 100
      });
      if (code !== 0) return;
      const t = data.items.find(x => x.code === "node_type");
      if (!t) return;
      const res = await getDictItems({
        typeId: t.id,
        status: "ACTIVE",
        pageSize: 100
      });
      if (res.code === 0) {
        nodeTypeOptions.value = res.data.items.map(i => ({
          label: `${i.label}（${i.code}）`,
          value: i.code
        }));
      }
    } catch {
      // 无 dict 读权限 / 不可达 → 保持空 → 表单退化手填
    }
  }

  async function ensurePositionOptions() {
    if (positionsResolved) return;
    positionsResolved = true;
    try {
      const { code, data } = await getPositionOptions({ limit: 100 });
      if (code === 0) {
        positionOptions.value = data.items;
        const map: Record<string, string> = {};
        for (const it of data.items) map[it.id] = it.label;
        positionNameById.value = map;
      }
    } catch {
      // 无 position 读权限 → 职务列回落显示 id
    }
  }

  function positionLabel(id: string) {
    return positionNameById.value[id] ?? id;
  }

  const {
    dataList,
    loading,
    pagination,
    onSearch,
    onFilterChange,
    handleSizeChange,
    handleCurrentChange
  } = useSrvfList<PositionRuleItem, PositionRuleListQuery>({
    fetch: getPositionRules,
    beforeFetch: ensurePositionOptions,
    buildParams: () => ({
      ...(nodeTypeFilter.value ? { nodeTypeCode: nodeTypeFilter.value } : {}),
      ...(positionFilter.value ? { positionId: positionFilter.value } : {}),
      ...(statusFilter.value ? { status: statusFilter.value } : {})
    }),
    errorMessage: "加载职务规则失败",
    canRead
  });

  const columns: TableColumnList = [
    {
      label: "组织类别",
      prop: "nodeTypeCode",
      minWidth: 150,
      formatter: ({ nodeTypeCode }) =>
        `${dict.label("node_type", nodeTypeCode)}（${nodeTypeCode}）`
    },
    {
      label: "职务",
      prop: "positionId",
      minWidth: 130,
      formatter: ({ positionId }) => positionLabel(positionId)
    },
    { label: "必设", prop: "required", minWidth: 80, slot: "required" },
    {
      label: "人数下限",
      prop: "minCount",
      minWidth: 90,
      formatter: ({ minCount }) => minCount ?? "—"
    },
    {
      label: "人数上限",
      prop: "maxCount",
      minWidth: 90,
      formatter: ({ maxCount }) => maxCount ?? "—"
    },
    {
      label: "要求归属",
      prop: "requireMembership",
      minWidth: 90,
      slot: "requireMembership"
    },
    {
      label: "允许兼任",
      prop: "allowConcurrent",
      minWidth: 90,
      slot: "allowConcurrent"
    },
    { label: "状态", prop: "status", minWidth: 90, slot: "status" },
    { label: "操作", fixed: "right" as const, width: 220, slot: "operation" }
  ];

  async function openDialog(title: "新建" | "编辑", row?: PositionRuleItem) {
    await Promise.all([ensureNodeTypeOptions(), ensurePositionOptions()]);
    const isEdit = title === "编辑";
    const initial: PositionRuleFormModel = {
      nodeTypeCode: row?.nodeTypeCode ?? "",
      positionId: row?.positionId ?? "",
      required: row?.required ?? false,
      minCount: row?.minCount ?? null,
      maxCount: row?.maxCount ?? null,
      requireMembership: row?.requireMembership ?? true,
      allowConcurrent: row?.allowConcurrent ?? false,
      status: row?.status ?? "ACTIVE"
    };
    addDialog({
      title: `${title}职务规则`,
      width: "46%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: initial,
        isEdit,
        nodeTypeOptions: nodeTypeOptions.value,
        positionOptions: positionOptions.value
      },
      contentRenderer: () => h(PositionRuleForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as PositionRuleFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              // (nodeTypeCode, positionId) 唯一键创建后不可改（PATCH 白名单不含）
              await updatePositionRule(row.id, {
                required: curData.required,
                minCount: curData.minCount,
                maxCount: curData.maxCount,
                requireMembership: curData.requireMembership,
                allowConcurrent: curData.allowConcurrent,
                status: curData.status
              });
              message("修改成功", { type: "success" });
            } else {
              await createPositionRule({
                nodeTypeCode: curData.nodeTypeCode,
                positionId: curData.positionId,
                required: curData.required,
                minCount: curData.minCount,
                maxCount: curData.maxCount,
                requireMembership: curData.requireMembership,
                allowConcurrent: curData.allowConcurrent,
                status: curData.status
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

  function handleToggleStatus(row: PositionRuleItem) {
    const next: PolicyStatus = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const action = next === "ACTIVE" ? "启用" : "停用";
    ElMessageBox.confirm(
      `确定${action}「${dict.label("node_type", row.nodeTypeCode)} / ${positionLabel(row.positionId)}」规则吗？`,
      "系统提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await updatePositionRule(row.id, { status: next });
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

  function handleDelete(row: PositionRuleItem) {
    ElMessageBox.confirm(
      `确定删除「${dict.label("node_type", row.nodeTypeCode)} / ${positionLabel(row.positionId)}」规则吗？`,
      "删除职务规则",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await deletePositionRule(row.id);
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
    loading,
    nodeTypeFilter,
    nodeTypeOptions,
    positionFilter,
    positionOptions,
    statusFilter,
    statusOptions,
    columns,
    dataList,
    pagination,
    ensureNodeTypeOptions,
    ensurePositionOptions,
    onSearch,
    onFilterChange,
    openDialog,
    handleToggleStatus,
    handleDelete,
    handleSizeChange,
    handleCurrentChange
  };
}
