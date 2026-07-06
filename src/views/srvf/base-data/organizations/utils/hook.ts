import { h, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import OrgForm, { type OrgFormModel } from "../form.vue";
import MoveForm, { type MoveFormModel } from "../move-form.vue";
import {
  getOrgTree,
  getOrgTreeWithSummary,
  getOrgTreeOptions,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  updateOrganizationStatus,
  moveOrganization,
  type OrgTreeNode,
  type OrgTreeSummaryNode,
  type OrgTreeOptionItem
} from "@/api/srvf-organization";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

/** 递归拍平 tree-with-summary 结果为 id → 计数 的映射，供合并进主树展示。 */
function flattenSummaryCounts(
  nodes: OrgTreeSummaryNode[],
  out: Map<string, { direct: number; subtree: number }>
) {
  for (const n of nodes) {
    out.set(n.id, {
      direct: n.directMembershipCount,
      subtree: n.subtreeMembershipCount
    });
    if (n.children?.length) flattenSummaryCounts(n.children, out);
  }
}
/** 递归把计数映射按 id 回填进主树节点（原地修改，不改变树形状）。 */
function applySummaryCounts(
  nodes: OrgTreeNode[],
  counts: Map<string, { direct: number; subtree: number }>
) {
  for (const n of nodes) {
    const hit = counts.get(n.id);
    if (hit) {
      n.directMembershipCount = hit.direct;
      n.subtreeMembershipCount = hit.subtree;
    }
    if (n.children?.length) applySummaryCounts(n.children, counts);
  }
}

export function useOrganizations() {
  /** 共享字典标签解析器：节点类别 code → 中文（node_type 字典） */
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["node_type"]);

  const dataList = ref<OrgTreeNode[]>([]);
  const loading = ref(false);
  const formRef = ref();
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染表格 */
  const canRead = hasPerms("org.read.node");
  /** 写权限（按钮级显隐；启停亦走 org.update.node） */
  const canCreate = hasPerms("org.create.node");
  const canUpdate = hasPerms("org.update.node");
  const canDelete = hasPerms("org.delete.node");
  /** 成员面板读权限（组织轴 memberships;仅决定「成员」按钮显隐） */
  const canMembers = hasPerms("membership.list.record");
  /** 在任职务面板读权限（组织轴 position-assignments;仅决定「在任职务」按钮显隐） */
  const canAssignments = hasPerms("position-assignment.read.record");
  /** 被谁分管面板读权限（组织轴 supervision-assignments;仅决定「被谁分管」按钮显隐） */
  const canSupervisors = hasPerms("supervision-assignment.read.record");
  /** 移动（重挂父级）写权限 */
  const canMove = hasPerms("org.move.node");
  /** 移动弹窗的目标父级下拉（getOrgTreeOptions；懒加载一次,同页内复用缓存） */
  const treeOptionsCache = ref<OrgTreeOptionItem[]>([]);
  const moveFormRef = ref();

  const columns: TableColumnList = [
    { label: "节点名", prop: "name", align: "left", minWidth: 200 },
    {
      label: "缩写",
      prop: "code",
      minWidth: 110,
      formatter: ({ code }) => code ?? "—"
    },
    {
      label: "节点类别",
      prop: "nodeTypeCode",
      minWidth: 130,
      formatter: ({ nodeTypeCode }) => dict.label("node_type", nodeTypeCode)
    },
    { label: "排序", prop: "sortOrder", minWidth: 70 },
    {
      label: "直属人数",
      prop: "directMembershipCount",
      minWidth: 90,
      formatter: ({ directMembershipCount }) => directMembershipCount ?? "—"
    },
    {
      label: "含下级人数",
      prop: "subtreeMembershipCount",
      minWidth: 100,
      formatter: ({ subtreeMembershipCount }) => subtreeMembershipCount ?? "—"
    },
    { label: "状态", prop: "status", minWidth: 90, slot: "status" },
    ...(canUpdate ||
    canDelete ||
    canCreate ||
    canMembers ||
    canAssignments ||
    canSupervisors ||
    canMove
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
      // 两个端点互相独立(计数是纯展示态叠加)，并发拉取而非串行等待。
      const [treeRes, summaryRes] = await Promise.allSettled([
        getOrgTree(),
        getOrgTreeWithSummary()
      ]);
      if (treeRes.status === "rejected") throw treeRes.reason;
      const { code, data } = treeRes.value;
      if (code === 0) {
        dataList.value = data;
        // 归属计数是独立端点（tree-with-summary，DTO 与 tree 不同不能直接换）；
        // 失败不阻塞主树展示，计数列退化显示"—"。
        if (summaryRes.status === "fulfilled" && summaryRes.value.code === 0) {
          const counts = new Map<string, { direct: number; subtree: number }>();
          flattenSummaryCounts(summaryRes.value.data, counts);
          applySummaryCounts(dataList.value, counts);
        }
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载组织树失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  /**
   * 新建 / 编辑弹窗。
   * - 新建根节点：parentId = null（不传 parentId，后端单根上限由后端强制）；
   * - 新增子节点：parentId = 该行 id；
   * - 编辑：仅提交 name / code / sortOrder / nodeTypeCode（parentId 后端禁改，前端不暴露）。
   */
  async function openOrgDialog(params: {
    isEdit: boolean;
    row?: OrgTreeNode;
    parentId: string | null;
  }) {
    const { isEdit, row, parentId } = params;
    const title = isEdit
      ? "编辑组织节点"
      : parentId
        ? "新增子节点"
        : "新建根节点";
    // 节点类别下拉数据源（node_type 字典;不可用时表单侧禁用选择器而非放开手填 code）
    await dict.ensureType("node_type");
    addDialog({
      title,
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          name: row?.name ?? "",
          code: row?.code ?? "",
          nodeTypeCode: row?.nodeTypeCode ?? "",
          sortOrder: row?.sortOrder ?? 0
        } as OrgFormModel,
        nodeTypeOptions: dict.options("node_type")
      },
      contentRenderer: () => h(OrgForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as OrgFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              await updateOrganization(row.id, {
                name: curData.name,
                code: curData.code === "" ? undefined : curData.code,
                nodeTypeCode: curData.nodeTypeCode,
                sortOrder: curData.sortOrder
              });
              message("修改成功", { type: "success" });
            } else {
              await createOrganization({
                name: curData.name,
                code: curData.code === "" ? undefined : curData.code,
                nodeTypeCode: curData.nodeTypeCode,
                sortOrder: curData.sortOrder,
                // 不传 parentId = 根节点
                parentId: parentId ?? undefined
              });
              message("新建成功", { type: "success" });
            }
            done();
            // 树结构/节点名变了，「移动」弹窗的目标父级下拉缓存需失效重拉
            treeOptionsCache.value = [];
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

  function openCreateRoot() {
    openOrgDialog({ isEdit: false, parentId: null });
  }
  function openCreateChild(row: OrgTreeNode) {
    openOrgDialog({ isEdit: false, parentId: row.id });
  }
  function openEdit(row: OrgTreeNode) {
    openOrgDialog({ isEdit: true, row, parentId: row.parentId });
  }

  /** 懒加载移动弹窗的目标父级树（首次打开时拉一次，同页内复用缓存） */
  async function ensureTreeOptions() {
    if (treeOptionsCache.value.length) return;
    try {
      const { code, data } = await getOrgTreeOptions();
      if (code === 0) treeOptionsCache.value = data;
    } catch {
      // 拉取失败时移动弹窗的下拉为空，不阻塞弹窗本身打开
    }
  }

  /**
   * 移动（重挂父级）。目标父级=自身或自身后代会成环，后端拒绝弹其 message
   * （不前端预判——组织树可能很深，前端复刻环检测意义不大，交后端裁决）。
   */
  async function openMoveDialog(row: OrgTreeNode) {
    await ensureTreeOptions();
    addDialog({
      title: `移动组织节点 — ${row.name}`,
      width: "38%",
      draggable: true,
      fullscreen: deviceDetection(),
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          currentLabel: `${row.name}${row.code ? `（${row.code}）` : ""}`,
          parentId: ""
        } as MoveFormModel,
        treeOptions: treeOptionsCache.value
      },
      contentRenderer: () => h(MoveForm, { ref: moveFormRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const cur = options.props.formInline as MoveFormModel;
        moveFormRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            await moveOrganization(row.id, { parentId: cur.parentId });
            message("移动成功", { type: "success" });
            done();
            treeOptionsCache.value = [];
            onSearch();
          } catch (error: any) {
            message(error?.response?.data?.message ?? "移动失败", {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /** 启停（专用 status 端点；后端拒绝停用唯一活跃根 → LAST_ROOT_PROTECTED，前端只弹后端 message） */
  function handleToggleStatus(row: OrgTreeNode) {
    const next = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const action = next === "ACTIVE" ? "启用" : "停用";
    ElMessageBox.confirm(`确定要${action}节点「${row.name}」吗？`, "系统提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        try {
          await updateOrganizationStatus(row.id, next);
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

  /** 软删（后端约束：有子节点 / 成员 / 唯一活跃根则拒删，前端只发请求 + 弹后端 message） */
  function handleDelete(row: OrgTreeNode) {
    ElMessageBox.confirm(`确定要删除节点「${row.name}」吗？`, "系统提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        try {
          await deleteOrganization(row.id);
          message("删除成功", { type: "success" });
          treeOptionsCache.value = [];
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
    canMembers,
    canAssignments,
    canSupervisors,
    canMove,
    loading,
    columns,
    dataList,
    onSearch,
    openCreateRoot,
    openCreateChild,
    openEdit,
    handleToggleStatus,
    handleDelete,
    openMoveDialog
  };
}
