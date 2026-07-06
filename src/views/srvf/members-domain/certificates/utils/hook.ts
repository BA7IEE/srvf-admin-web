import dayjs from "dayjs";
import { h, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import CertificateForm, { type CertificateFormModel } from "../form.vue";
import {
  getMemberCertificates,
  createMemberCertificate,
  updateMemberCertificate,
  deleteMemberCertificate,
  verifyMemberCertificate,
  rejectMemberCertificate,
  getQualificationFlag,
  type CertificateItem,
  type CreateCertificateBody
} from "@/api/srvf-certificate";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

/**
 * @param externalMemberId 证书隶属队员 id（必传，来自队员作战室路由参数）。
 *   作战室是唯一消费方（独立证书菜单页已退役），故固定该队员、无页内队员下拉。
 */
export function useCertificates(externalMemberId: string) {
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染 */
  const canRead = hasPerms("certificate.read.record");
  /**
   * 写权限（后端真实 RBAC 码）；按钮级显隐（SUPER_ADMIN 拥有全部码故全部可见）。
   * 新建在工具栏（需先选队员）；编辑在行内。
   */
  const canCreate = hasPerms("certificate.create.record");
  const canUpdate = hasPerms("certificate.update.record");
  const canDelete = hasPerms("certificate.delete.record");
  const canVerify = hasPerms("certificate.verify.record");
  const canReject = hasPerms("certificate.reject.record");
  const hasAnyRowAction = canUpdate || canVerify || canReject || canDelete;
  /** 共享字典标签解析器：证书类型 / 核验状态 code → 中文（cert_type / cert_status 字典） */
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["cert_type", "cert_status"]);
  const dataList = ref<CertificateItem[]>([]);
  const loading = ref(false);
  /** 证书隶属队员 id：由作战室经路由参数注入并固定。保留 ref 形态，CRUD/核验 handler 仍走 memberId.value 不改。 */
  const memberId = ref<string>(externalMemberId);
  const formRef = ref();

  /** 资质核验小组件状态（qualification-flag：只读判定,与 canRead 同码不单独开权限） */
  const qualCheckCertType = ref("");
  const qualCheckLoading = ref(false);
  const qualCheckResult = ref<{
    certTypeCode: string;
    qualified: boolean;
  } | null>(null);

  const columns: TableColumnList = [
    {
      label: "证书类型",
      prop: "certTypeCode",
      minWidth: 140,
      formatter: ({ certTypeCode }) => dict.label("cert_type", certTypeCode)
    },
    { label: "发证机构", prop: "issuingOrg", minWidth: 160 },
    {
      label: "状态",
      prop: "certStatusCode",
      minWidth: 110,
      slot: "certStatusCode"
    },
    {
      label: "发证日期",
      prop: "issuedAt",
      minWidth: 130,
      formatter: ({ issuedAt }) =>
        issuedAt ? dayjs(issuedAt).format("YYYY-MM-DD") : "—"
    },
    {
      label: "有效期至",
      prop: "expiredAt",
      minWidth: 130,
      formatter: ({ expiredAt }) =>
        expiredAt ? dayjs(expiredAt).format("YYYY-MM-DD") : "—"
    },
    {
      label: "内部/外部",
      prop: "isInternal",
      minWidth: 100,
      slot: "isInternal"
    },
    ...(hasAnyRowAction
      ? [
          {
            label: "操作",
            fixed: "right" as const,
            width: 260,
            slot: "operation"
          }
        ]
      : [])
  ];

  /** 证书状态 code → tag 颜色（仅展示色；状态码来自后端字典，前端不臆造） */
  function certStatusTagType(
    code: string
  ): "success" | "warning" | "danger" | "info" {
    const map: Record<string, "success" | "warning" | "danger" | "info"> = {
      verified: "success",
      pending: "warning",
      rejected: "danger",
      expired: "info"
    };
    return map[code] ?? "info";
  }

  async function onSearch() {
    if (!canRead || !memberId.value) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getMemberCertificates(memberId.value);
      if (code === 0) dataList.value = data;
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载证书失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  /**
   * 懒加载证书类型字典下拉（cert_type / cert_sub_type）。
   * cert_type 页初已预热；无 dict 读权限 / 查不到 type / 后端不可达 → 静默保持空 → 表单退化为文本输入。
   */
  async function ensureFormOptions() {
    await dict.ensureTypes(["cert_type", "cert_sub_type"]);
  }

  /**
   * 由表单模型组装提交体：必填恒发；可选字段仅在有值时发
   * （编辑时避免把空值写回覆盖后端，且 certNumber 列表不返回故未填即不提交）。
   */
  function buildBody(m: CertificateFormModel): CreateCertificateBody {
    return {
      certTypeCode: m.certTypeCode,
      issuingOrg: m.issuingOrg,
      issuedAt: m.issuedAt,
      ...(m.certSubTypeCode ? { certSubTypeCode: m.certSubTypeCode } : {}),
      ...(m.certNumber ? { certNumber: m.certNumber } : {}),
      ...(m.expiredAt ? { expiredAt: m.expiredAt } : {})
    };
  }

  /** 新建 / 编辑弹窗（需先选队员；编辑按列表返回字段回填，certNumber 列表不返回故留空，不填则不提交） */
  async function openDialog(title: "新建" | "编辑", row?: CertificateItem) {
    if (!memberId.value) {
      message("请先选择一名队员", { type: "warning" });
      return;
    }
    await ensureFormOptions();
    const isEdit = title === "编辑";
    addDialog({
      title: `${title}证书`,
      width: "46%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          certTypeCode: row?.certTypeCode ?? "",
          certSubTypeCode: row?.certSubTypeCode ?? "",
          issuingOrg: row?.issuingOrg ?? "",
          certNumber: "",
          issuedAt: row?.issuedAt
            ? dayjs(row.issuedAt).format("YYYY-MM-DD")
            : "",
          expiredAt: row?.expiredAt
            ? dayjs(row.expiredAt).format("YYYY-MM-DD")
            : ""
        } as CertificateFormModel,
        certTypeOptions: dict.options("cert_type"),
        certSubTypeOptions: dict.options("cert_sub_type")
      },
      contentRenderer: () => h(CertificateForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const formComp = formRef.value;
        const curData = options.props.formInline as CertificateFormModel;
        formComp.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              await updateMemberCertificate(
                memberId.value,
                row.id,
                buildBody(curData)
              );
              message("修改成功", { type: "success" });
            } else {
              await createMemberCertificate(memberId.value, buildBody(curData));
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

  /** 行主语：证书类型中文 · 颁发机构（用于确认 / 核验弹窗文案） */
  function certSubject(row: CertificateItem) {
    return `${dict.label("cert_type", row.certTypeCode)} · ${row.issuingOrg}`;
  }

  /** 删除（删前 confirm；后端软删，写 deletedAt 不物理删除） */
  function handleDelete(row: CertificateItem) {
    ElMessageBox.confirm(
      `确定要删除证书「${certSubject(row)}」吗？`,
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
          await deleteMemberCertificate(memberId.value, row.id);
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

  /** 核验通过（pending → verified；verifyNote 可选；后端拒绝非法流转弹其 message） */
  function handleVerify(row: CertificateItem) {
    ElMessageBox.prompt(
      `确定核验通过证书「${certSubject(row)}」吗？可填写核验备注（可空）。`,
      "核验通过",
      {
        confirmButtonText: "确定通过",
        cancelButtonText: "返回",
        type: "info",
        inputType: "textarea",
        inputPlaceholder: "核验备注（可空；≤ 500）",
        inputValidator: (val: string) => {
          if (val && val.length > 500) return "核验备注不能超过 500 字";
          return true;
        }
      }
    )
      .then(async ({ value }) => {
        if (!memberId.value) return;
        try {
          await verifyMemberCertificate(
            memberId.value,
            row.id,
            value ? { verifyNote: value } : {}
          );
          message("已核验通过", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? "核验通过失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 核验驳回（pending → rejected；verifyNote 必填 → 弹必填输入框；后端拒绝弹其 message） */
  function handleReject(row: CertificateItem) {
    ElMessageBox.prompt(
      `确定驳回证书「${certSubject(row)}」吗？请填写驳回原因（必填）。`,
      "核验驳回",
      {
        confirmButtonText: "确定驳回",
        cancelButtonText: "返回",
        type: "warning",
        inputType: "textarea",
        inputPlaceholder: "驳回原因（必填；≤ 500）",
        inputValidator: (val: string) => {
          if (!val || !val.trim()) return "驳回原因为必填项";
          if (val.length > 500) return "驳回原因不能超过 500 字";
          return true;
        }
      }
    )
      .then(async ({ value }) => {
        if (!memberId.value) return;
        try {
          await rejectMemberCertificate(memberId.value, row.id, {
            verifyNote: value
          });
          message("已驳回", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? "核验驳回失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /**
   * 资质核验：查该队员在选定证书大类下是否 qualified（已核验+未过期+未软删）。
   * 只返布尔判定，不返回具体证书记录——不是"查证书"，是"查资格"。
   */
  async function checkQualification() {
    if (!memberId.value || !qualCheckCertType.value) return;
    qualCheckLoading.value = true;
    qualCheckResult.value = null;
    try {
      const { code, data } = await getQualificationFlag(
        memberId.value,
        qualCheckCertType.value
      );
      if (code === 0) {
        qualCheckResult.value = {
          certTypeCode: data.certTypeCode,
          qualified: data.qualified
        };
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "资质核验查询失败", {
        type: "error"
      });
    } finally {
      qualCheckLoading.value = false;
    }
  }

  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canVerify,
    canReject,
    loading,
    columns,
    dataList,
    certStatusTagType,
    dict,
    onSearch,
    openDialog,
    handleDelete,
    handleVerify,
    handleReject,
    qualCheckCertType,
    qualCheckLoading,
    qualCheckResult,
    checkQualification
  };
}
