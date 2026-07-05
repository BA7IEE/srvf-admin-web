import { h, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import OrgForm, { type OrgFormModel } from "../form.vue";
import {
  getOrgTree,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  updateOrganizationStatus,
  type OrgTreeNode
} from "@/api/srvf-organization";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

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
    { label: "状态", prop: "status", minWidth: 90, slot: "status" },
    ...(canUpdate || canDelete || canCreate || canMembers
      ? [
          {
            label: "操作",
            fixed: "right" as const,
            width: 300,
            slot: "operation"
          }
        ]
      : [])
  ];

  async function onSearch() {
    if (!canRead) return;
    loading.value = true;
    try {
      const { code, data } = await getOrgTree();
      if (code === 0) {
        dataList.value = data;
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
  function openOrgDialog(params: {
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
        } as OrgFormModel
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
    loading,
    columns,
    dataList,
    onSearch,
    openCreateRoot,
    openCreateChild,
    openEdit,
    handleToggleStatus,
    handleDelete
  };
}
