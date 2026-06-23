import { h, ref, computed } from "vue";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import DepartmentSetForm, { type DepartmentSetFormModel } from "../form.vue";
import {
  getMemberDepartment,
  setMemberDepartment,
  clearMemberDepartment,
  type MemberDepartmentItem
} from "@/api/srvf-member-department";
import { getOrgTree, type OrgTreeNode } from "@/api/srvf-organization";

/**
 * 队员部门归属（单值子资源：读 / 设 / 清）。
 *
 * @param externalMemberId 归属隶属队员 id（必传，来自队员作战室路由参数）。
 *   作战室是唯一消费方（不开独立菜单页 / 不放队员下拉），故固定该队员、无页内下拉。
 *
 * 部门响应只给 `organizationId`，组织名 + 选择器数据源都复用 `@/api/srvf-organization`
 * 的 `getOrgTree`（需 `org.read.node`；无此码 → 名称退化为 id，选择器退化为文本输入）。
 */
export function useMemberDepartment(externalMemberId: string) {
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染 */
  const canRead = hasPerms("member-department.read.current");
  /** 设置 / 清除权限（后端真实 RBAC 码）；按钮级显隐 */
  const canSet = hasPerms("member-department.set.current");
  const canClear = hasPerms("member-department.clear.current");
  /** 组织读权限：组织名解析 + 部门选择器都依赖它 */
  const canReadOrg = hasPerms("org.read.node");

  const memberId = ref<string>(externalMemberId);
  /** 当前归属（无归属 → null） */
  const department = ref<MemberDepartmentItem | null>(null);
  const loading = ref(false);
  /** 组织树（选择器数据源；懒加载一次） */
  const orgTree = ref<OrgTreeNode[]>([]);
  /** organizationId → 组织名（由 org 树拍平；查不到退化为原 id） */
  const orgNameMap = ref<Map<string, string>>(new Map());
  const formRef = ref();

  /** 当前归属组织名（解析失败 → 退化为 organizationId） */
  const currentOrgName = computed(() => {
    const oid = department.value?.organizationId;
    if (!oid) return "";
    return orgNameMap.value.get(oid) ?? oid;
  });

  /** 递归拍平 org 树 → 新 Map（整体重赋值以触发响应式） */
  function buildNameMap(nodes: OrgTreeNode[]): Map<string, string> {
    const map = new Map<string, string>();
    const walk = (ns: OrgTreeNode[]) => {
      for (const n of ns) {
        map.set(n.id, n.name);
        if (n.children?.length) walk(n.children);
      }
    };
    walk(nodes);
    return map;
  }

  /** 懒加载 org 树（一次）：组织名解析 + 选择器；无 org 读权限 / 不可达 → 静默退化 */
  async function ensureOrgTree() {
    if (!canReadOrg || orgTree.value.length) return;
    try {
      const { code, data } = await getOrgTree();
      if (code === 0) {
        orgTree.value = data;
        orgNameMap.value = buildNameMap(data);
      }
    } catch {
      // 无 org.read.node / 后端不可达 → 名称退化为 id，选择器退化为文本输入
    }
  }

  /** 读当前部门 + 预热 org 名解析（无 canRead / 无 memberId → 空，不请求） */
  async function onSearch() {
    if (!canRead || !memberId.value) {
      department.value = null;
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getMemberDepartment(memberId.value);
      if (code === 0) department.value = data;
      await ensureOrgTree();
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载部门归属失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  /** 设置 / 变更部门（org 树选择器弹窗 → PUT；幂等，同 org 后端直接返回） */
  async function handleSet() {
    if (!memberId.value) return;
    await ensureOrgTree();
    addDialog({
      title: department.value ? "变更部门" : "设置部门",
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          organizationId: department.value?.organizationId ?? ""
        } as DepartmentSetFormModel,
        orgTreeData: orgTree.value
      },
      contentRenderer: () => h(DepartmentSetForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const formComp = formRef.value;
        const curData = options.props.formInline as DepartmentSetFormModel;
        formComp.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            await setMemberDepartment(memberId.value, {
              organizationId: curData.organizationId
            });
            message("设置成功", { type: "success" });
            done();
            onSearch();
          } catch (error: any) {
            message(error?.response?.data?.message ?? "设置失败", {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /** 清除归属（仅已归属时调用；删前 confirm；后端软删中间表行） */
  function handleClear() {
    const subject = currentOrgName.value || "当前部门";
    ElMessageBox.confirm(
      `确定要解除该队员与「${subject}」的部门归属吗？`,
      "系统提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        if (!memberId.value) return;
        try {
          await clearMemberDepartment(memberId.value);
          message("已解除归属", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? "解除失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  return {
    canRead,
    canSet,
    canClear,
    canReadOrg,
    loading,
    department,
    currentOrgName,
    orgTree,
    onSearch,
    handleSet,
    handleClear
  };
}
