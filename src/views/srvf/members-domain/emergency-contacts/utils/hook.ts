import { h, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import EmergencyContactForm, {
  type EmergencyContactFormModel
} from "../form.vue";
import {
  getMemberEmergencyContacts,
  createMemberEmergencyContact,
  updateMemberEmergencyContact,
  deleteMemberEmergencyContact,
  type EmergencyContactItem,
  type CreateEmergencyContactBody
} from "@/api/srvf-emergency-contact";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

/**
 * 队员紧急联系人 CRUD。
 *
 * @param externalMemberId 紧急联系人隶属队员 id（必传，来自队员作战室路由参数）。
 *   作战室是唯一消费方（不开独立菜单页 / 不放队员下拉），故固定该队员、无页内下拉。
 */
export function useEmergencyContacts(externalMemberId: string) {
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染 */
  const canRead = hasPerms("emergency-contact.read.record");
  /** 写权限（后端真实 RBAC 码）；按钮级显隐（新建在工具栏，编辑/删除在行内） */
  const canCreate = hasPerms("emergency-contact.create.record");
  const canUpdate = hasPerms("emergency-contact.update.record");
  const canDelete = hasPerms("emergency-contact.delete.record");
  const hasAnyRowAction = canUpdate || canDelete;
  /** 共享字典标签解析器：关系 code → 中文（emergency_relation 字典；查不到退化为原 code） */
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["emergency_relation"]);
  const dataList = ref<EmergencyContactItem[]>([]);
  const loading = ref(false);
  /** 隶属队员 id：由作战室经路由参数注入并固定。CRUD handler 走 memberId.value 不改。 */
  const memberId = ref<string>(externalMemberId);
  const formRef = ref();

  const columns: TableColumnList = [
    { label: "优先级", prop: "priority", minWidth: 90 },
    { label: "姓名", prop: "contactName", minWidth: 120 },
    {
      label: "关系",
      prop: "relationCode",
      minWidth: 120,
      formatter: ({ relationCode }) =>
        dict.label("emergency_relation", relationCode)
    },
    { label: "主电话", prop: "phonePrimary", minWidth: 140 },
    {
      label: "备用电话",
      prop: "phoneBackup",
      minWidth: 140,
      formatter: ({ phoneBackup }) => phoneBackup || "—"
    },
    {
      label: "地址",
      prop: "address",
      minWidth: 180,
      formatter: ({ address }) => address || "—"
    },
    ...(hasAnyRowAction
      ? [
          {
            label: "操作",
            fixed: "right" as const,
            width: 160,
            slot: "operation"
          }
        ]
      : [])
  ];

  /** 拉某队员紧急联系人（无 canRead / 无 memberId → 空表，不请求） */
  async function onSearch() {
    if (!canRead || !memberId.value) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getMemberEmergencyContacts(memberId.value);
      if (code === 0) dataList.value = data;
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载紧急联系人失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  /**
   * 懒加载关系字典下拉（emergency_relation）。
   * 无 dict 读权限 / 查不到 type / 后端不可达 → 静默保持空 → 表单退化为文本输入。
   */
  async function ensureFormOptions() {
    await dict.ensureType("emergency_relation");
  }

  /**
   * 由表单模型组装提交体：必填恒发；可选文本字段仅在有值时发
   * （编辑时避免把空值写回覆盖后端，与证书范式一致）；priority 为数值始终提交。
   */
  function buildBody(m: EmergencyContactFormModel): CreateEmergencyContactBody {
    return {
      contactName: m.contactName,
      relationCode: m.relationCode,
      phonePrimary: m.phonePrimary,
      priority: m.priority,
      ...(m.phoneBackup ? { phoneBackup: m.phoneBackup } : {}),
      ...(m.address ? { address: m.address } : {})
    };
  }

  /** 新建 / 编辑弹窗（memberId 由作战室固定；编辑按列表返回字段回填） */
  async function openDialog(
    title: "新建" | "编辑",
    row?: EmergencyContactItem
  ) {
    if (!memberId.value) return;
    await ensureFormOptions();
    const isEdit = title === "编辑";
    addDialog({
      title: `${title}紧急联系人`,
      width: "46%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          contactName: row?.contactName ?? "",
          relationCode: row?.relationCode ?? "",
          phonePrimary: row?.phonePrimary ?? "",
          phoneBackup: row?.phoneBackup ?? "",
          address: row?.address ?? "",
          priority: row?.priority ?? 0
        } as EmergencyContactFormModel,
        relationOptions: dict.options("emergency_relation")
      },
      contentRenderer: () => h(EmergencyContactForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const formComp = formRef.value;
        const curData = options.props.formInline as EmergencyContactFormModel;
        formComp.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              await updateMemberEmergencyContact(
                memberId.value,
                row.id,
                buildBody(curData)
              );
              message("修改成功", { type: "success" });
            } else {
              await createMemberEmergencyContact(
                memberId.value,
                buildBody(curData)
              );
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

  /** 行主语：姓名 · 关系中文（用于确认弹窗文案） */
  function contactSubject(row: EmergencyContactItem) {
    return `${row.contactName} · ${dict.label("emergency_relation", row.relationCode)}`;
  }

  /** 删除（删前 confirm；后端软删，写 deletedAt 不物理删除） */
  function handleDelete(row: EmergencyContactItem) {
    ElMessageBox.confirm(
      `确定要删除紧急联系人「${contactSubject(row)}」吗？`,
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
          await deleteMemberEmergencyContact(memberId.value, row.id);
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
    columns,
    dataList,
    dict,
    onSearch,
    openDialog,
    handleDelete
  };
}
