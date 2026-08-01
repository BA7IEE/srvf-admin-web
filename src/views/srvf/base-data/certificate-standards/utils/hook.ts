import { h, ref, computed, onMounted } from "vue";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { fetchAllPages } from "@/srvf-kit";
import { addDialog } from "@/components/ReDialog";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import StandardForm, { type StandardFormModel } from "../standard-form.vue";
import PolicyForm, { type PolicyFormModel } from "../policy-form.vue";
import {
  getCertificateStandards,
  createCertificateStandard,
  updateCertificateStandard,
  deleteCertificateStandard,
  updateCertificateStandardStatus,
  getRecognitionPolicies,
  createRecognitionPolicy,
  updateRecognitionPolicy,
  deleteRecognitionPolicy,
  activateRecognitionPolicy,
  certificateStandardBizErrorMessage,
  type CertificateStandard,
  type CertificateStandardStatus,
  type CertificateStandardKind,
  type CreateCertificateStandardBody,
  type UpdateCertificateStandardBody,
  type RecognitionPolicy,
  type CreateRecognitionPolicyBody
} from "@/api/srvf-certificate-standard";
import { getCertificateStandardOptions } from "@/api/srvf-certificate";

/** 后端分页硬上限 100；左侧标准导航一次性拉全量（不分页，改滚动，沿字典页先例） */
const STANDARD_FETCH_PAGE_SIZE = 100;
/** 防御性上限：即使标准数远超预期，循环也保证收敛，不做无界 while(true) */
const STANDARD_FETCH_MAX_PAGES = 50;
/** `certificate-standards/options` 的 limit 后端上限 200（该端点契约明写，与通用 options 的 100 不同） */
const OPTIONS_FETCH_LIMIT = 200;

/**
 * 左侧标准的**展示态**。前四个是后端 status 原值，`PENDING_RECOGNITION` 是前端派生的正常态：
 * 标准已 ACTIVE、但还没有一条 ACTIVE 认定规则 —— 术语叫「已收录待认定」。
 * 它不是错误：标准收录进库和「队里认定它按什么规则算数」本来就是两步。
 */
export type StandardDisplayStatus =
  | CertificateStandardStatus
  | "PENDING_RECOGNITION";

export const STANDARD_STATUS_LABEL: Record<string, string> = {
  DRAFT: "草稿",
  ACTIVE: "已启用",
  INACTIVE: "已停用",
  PENDING_RECOGNITION: "已收录待认定"
};

export const STANDARD_STATUS_TAG: Record<
  string,
  "success" | "info" | "warning" | "danger" | "primary"
> = {
  DRAFT: "info",
  ACTIVE: "success",
  INACTIVE: "info",
  PENDING_RECOGNITION: "warning"
};

export const POLICY_STATUS_LABEL: Record<string, string> = {
  DRAFT: "草稿",
  ACTIVE: "生效中",
  RETIRED: "已退役"
};

export const POLICY_STATUS_TAG: Record<
  string,
  "success" | "info" | "warning" | "danger" | "primary"
> = {
  DRAFT: "warning",
  ACTIVE: "success",
  RETIRED: "info"
};

const ISSUER_POLICY_LABEL: Record<string, string> = {
  FIXED: "固定一家",
  ALLOWLIST: "从名单里选",
  FREE_TEXT: "自由填写"
};

const CERT_NUMBER_MODE_LABEL: Record<string, string> = {
  REQUIRED: "必填",
  OPTIONAL: "可填可不填",
  NONE: "无编号"
};

/** 有效期模式 → 人话（FIXED_MONTHS 带上月数） */
export function validityText(policy: RecognitionPolicy): string {
  switch (policy.validityMode) {
    case "PERMANENT":
      return "终身有效";
    case "FIXED_MONTHS":
      return `固定 ${policy.validityMonths ?? "?"} 个月`;
    case "EXPLICIT_REQUIRED":
      return "建证时必填到期日";
    case "EXPLICIT_OPTIONAL":
      return "建证时可填到期日";
    default:
      return policy.validityMode;
  }
}

export function useCertificateStandards() {
  /* -------------------------------- 权限 -------------------------------- */
  const canRead = hasPerms("certificate-standard.read.record");
  const canCreate = hasPerms("certificate-standard.create.record");
  const canUpdate = hasPerms("certificate-standard.update.record");
  const canDelete = hasPerms("certificate-standard.delete.record");
  const canReadPolicy = hasPerms("certificate-recognition-policy.read.record");
  const canCreatePolicy = hasPerms(
    "certificate-recognition-policy.create.record"
  );
  const canUpdatePolicy = hasPerms(
    "certificate-recognition-policy.update.record"
  );
  const canDeletePolicy = hasPerms(
    "certificate-recognition-policy.delete.record"
  );

  const dict = useSrvfDictStoreHook();
  const formRef = ref();

  /* ------------------------------ 左：标准列表 ----------------------------- */
  const standardList = ref<CertificateStandard[]>([]);
  const standardLoading = ref(false);
  const selectedStandard = ref<CertificateStandard | null>(null);
  /** 全部 FAMILY 标准（父级下拉候选，不随左侧筛选变化） */
  const familyList = ref<CertificateStandard[]>([]);
  /** 有 ACTIVE 认定规则的标准 id 集合（来自 options 的 currentlyRecognized） */
  const recognizedIds = ref<Set<string>>(new Set());

  /** 左侧筛选（全部走服务端，不做前端过滤——标准数可能上百） */
  const filters = ref<{
    q: string;
    kind: CertificateStandardKind | "";
    categoryCode: string;
    levelCode: string;
    status: CertificateStandardStatus | "";
  }>({ q: "", kind: "", categoryCode: "", levelCode: "", status: "" });

  const categoryOptions = computed(() => dict.options("cert_type"));
  const levelOptions = computed(() => dict.options("cert_sub_type"));

  function categoryLabel(code?: string | null) {
    return dict.label("cert_type", code);
  }

  function levelLabel(code?: string | null) {
    return dict.label("cert_sub_type", code);
  }

  /**
   * 标准的展示态：ACTIVE 的 CREDENTIAL 若没有生效认定规则 → 「已收录待认定」。
   * FAMILY 不参与认定（它本来就不能持有证书），所以永不落这个派生态。
   */
  function displayStatus(row: CertificateStandard): StandardDisplayStatus {
    if (
      row.status === "ACTIVE" &&
      row.kind === "CREDENTIAL" &&
      !recognizedIds.value.has(row.id)
    ) {
      return "PENDING_RECOGNITION";
    }
    return row.status;
  }

  /** 选中标准是否处于「已收录待认定」——右侧据此给「去建认定规则」CTA */
  const selectedPendingRecognition = computed(
    () =>
      !!selectedStandard.value &&
      displayStatus(selectedStandard.value) === "PENDING_RECOGNITION"
  );

  /** 身份字段是否还能改：DRAFT 且从未启用过（启用过一次就永久锁死，18033） */
  function canEditIdentity(row: CertificateStandard) {
    return row.status === "DRAFT" && row.activatedAt === null;
  }

  /**
   * 拉「哪些标准当前可被认定」。这是 `已收录待认定` 派生态的唯一数据来源
   * （标准列表端点本身不返规则信息）。无权 / 失败 → 静默留空集，
   * 页面退化成只显示后端 status，不报错也不假装「都已认定」。
   */
  async function fetchRecognized() {
    try {
      const { code, data } = await getCertificateStandardOptions({
        limit: OPTIONS_FETCH_LIMIT
      });
      if (code === 0) {
        recognizedIds.value = new Set(
          data.items.filter(i => i.currentlyRecognized).map(i => i.id)
        );
      }
    } catch {
      // 无 options 读权限或后端不可达：派生态退化，不影响主列表
      recognizedIds.value = new Set();
    }
  }

  /** 父级候选：全部 FAMILY 标准（与左侧筛选无关，否则筛完就选不到父级了） */
  async function fetchFamilies() {
    try {
      const { items } = await fetchAllPages(
        (page, pageSize) =>
          getCertificateStandards({ page, pageSize, kind: "FAMILY" }),
        {
          pageSize: STANDARD_FETCH_PAGE_SIZE,
          maxPages: STANDARD_FETCH_MAX_PAGES
        }
      );
      familyList.value = items;
    } catch {
      familyList.value = [];
    }
  }

  async function fetchStandards() {
    if (!canRead) return;
    standardLoading.value = true;
    try {
      const f = filters.value;
      const { items } = await fetchAllPages(
        (page, pageSize) =>
          getCertificateStandards({
            page,
            pageSize,
            q: f.q.trim() || undefined,
            kind: f.kind || undefined,
            categoryCode: f.categoryCode || undefined,
            levelCode: f.levelCode || undefined,
            status: f.status || undefined
          }),
        {
          pageSize: STANDARD_FETCH_PAGE_SIZE,
          maxPages: STANDARD_FETCH_MAX_PAGES
        }
      );
      standardList.value = items;
      if (selectedStandard.value) {
        const fresh = items.find(s => s.id === selectedStandard.value!.id);
        if (fresh) {
          // 标准可能被并发编辑（名称/状态），指回最新对象，避免右侧标题显示过期
          selectedStandard.value = fresh;
        } else {
          // 已选标准被筛掉或被删 → 清空右侧
          selectedStandard.value = null;
          policyList.value = [];
        }
      }
    } catch (error: any) {
      message(certificateStandardBizErrorMessage(error, "加载证书标准失败"), {
        type: "error"
      });
    } finally {
      standardLoading.value = false;
    }
  }

  /** 列表 + 派生态数据源一起刷（两者必须同步，否则状态列会短暂说谎） */
  async function refreshAll() {
    await Promise.all([fetchStandards(), fetchRecognized(), fetchFamilies()]);
  }

  function resetFilters() {
    filters.value = {
      q: "",
      kind: "",
      categoryCode: "",
      levelCode: "",
      status: ""
    };
    fetchStandards();
  }

  function selectStandard(row: CertificateStandard) {
    if (selectedStandard.value?.id === row.id) return;
    selectedStandard.value = row;
    fetchPolicies();
  }

  /* ---------------------------- 建标准：code 重输确认 ---------------------------- */

  /**
   * 建标准前的二次确认：要求把 code **原样重输一遍**（GitHub 删库式）。
   *
   * 为什么值得这么重：`code` 是全库唯一一个不可挽回的字段——创建后不可改，
   * 且 unique 含软删行（软删不释放 code）。打错一个字，那个 code 就永远用不了了。
   * 建标准是低频动作，多敲一次远比烧掉一个 code 划算。
   */
  function confirmStandardCode(code: string): Promise<boolean> {
    return ElMessageBox.prompt(
      h("div", { class: "leading-6" }, [
        h("p", null, ["即将创建证书标准，code 为 ", h("b", null, code), "。"]),
        h(
          "p",
          { style: "margin-top:8px" },
          "这个 code 创建后永久占用：不能修改，软删也不会释放它。岗位要求、活动门槛、外部系统都可能引用它。"
        ),
        h(
          "p",
          { style: "margin-top:8px" },
          "请把它原样重新输入一遍，确认没有打错字："
        )
      ]) as unknown as string,
      "确认创建证书标准",
      {
        confirmButtonText: "确认创建",
        cancelButtonText: "返回修改",
        type: "warning",
        inputPlaceholder: "在此重新输入 code",
        inputValidator: (val: string) =>
          val === code ? true : "与上面的 code 不一致，请原样重输"
      }
    )
      .then(() => true)
      .catch(() => false);
  }

  /* ------------------------------ 标准 CRUD ------------------------------ */

  function openStandardDialog(
    title: "新建" | "编辑",
    row?: CertificateStandard
  ) {
    const isEdit = title === "编辑";
    const editable = isEdit && row ? canEditIdentity(row) : true;
    addDialog({
      title: `${title}证书标准`,
      width: "46%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          canEditIdentity: editable,
          code: row?.code ?? "",
          name: row?.name ?? "",
          kind: row?.kind ?? "CREDENTIAL",
          categoryCode: row?.categoryCode ?? "",
          levelCode: row?.levelCode ?? "",
          parentId: row?.parentId ?? "",
          isInternal: row?.isInternal ?? false,
          description: row?.description ?? "",
          sortOrder: row?.sortOrder ?? 0,
          excludeId: row?.id ?? ""
        } as StandardFormModel,
        categoryOptions: categoryOptions.value,
        levelOptions: levelOptions.value,
        familyOptions: familyList.value
      },
      contentRenderer: () => h(StandardForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as StandardFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          if (!isEdit) {
            const confirmed = await confirmStandardCode(curData.code.trim());
            if (!confirmed) {
              closeLoading();
              return;
            }
          }
          try {
            if (isEdit && row) {
              // 文案组任何状态可改；身份组仅 DRAFT 且从未启用过时才发（否则 18033）
              const body: UpdateCertificateStandardBody = {
                name: curData.name.trim(),
                description: curData.description.trim() || null,
                sortOrder: curData.sortOrder
              };
              if (editable) {
                body.kind = curData.kind;
                body.categoryCode = curData.categoryCode;
                body.levelCode = curData.levelCode || null;
                body.parentId = curData.parentId || null;
                body.isInternal = curData.isInternal;
              }
              await updateCertificateStandard(row.id, body);
              message("修改成功", { type: "success" });
            } else {
              // ⚠️ 建标准时可选字段只有「给真值」和「整条不传」两种，传显式 null 会被契约层拒成 400
              const body: CreateCertificateStandardBody = {
                code: curData.code.trim(),
                name: curData.name.trim(),
                kind: curData.kind,
                categoryCode: curData.categoryCode,
                isInternal: curData.isInternal,
                sortOrder: curData.sortOrder
              };
              const description = curData.description.trim();
              if (description) body.description = description;
              if (curData.levelCode) body.levelCode = curData.levelCode;
              if (curData.parentId) body.parentId = curData.parentId;
              await createCertificateStandard(body);
              message("已创建为草稿，启用后才能用于建证", { type: "success" });
            }
            done();
            refreshAll();
          } catch (error: any) {
            message(certificateStandardBizErrorMessage(error, "保存失败"), {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /** 状态流转：DRAFT→启用 / 启用→停用 / 停用→启用（后端不接受回退到草稿） */
  function handleToggleStandardStatus(row: CertificateStandard) {
    const next = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const action = next === "ACTIVE" ? "启用" : "停用";
    const detail =
      next === "ACTIVE"
        ? row.status === "DRAFT"
          ? "启用后这个标准就能用于建证与审核了。注意：启用之后，它的类型 / 大类 / 等级 / 父级 / 是否本会颁发将永久不可修改。"
          : "重新启用后，这个标准会重新出现在建证与审核的选项里。"
        : "停用后它不会再出现在新建证书的选项里；已经建好的证书不受影响，仍然有效。";
    ElMessageBox.confirm(detail, `${action}证书标准「${row.name}」`, {
      confirmButtonText: `确定${action}`,
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        try {
          await updateCertificateStandardStatus(row.id, next);
          message(`${action}成功`, { type: "success" });
          refreshAll();
        } catch (error: any) {
          message(certificateStandardBizErrorMessage(error, `${action}失败`), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  function handleDeleteStandard(row: CertificateStandard) {
    ElMessageBox.confirm(
      `删除后它不再出现在任何列表里；但它的 code「${row.code}」仍被永久占用，不能再被新标准使用。\n若它下面还挂着子标准、认定规则、证书申报或已建的证书，后端会拒绝删除——那种情况请改用「停用」。`,
      `删除证书标准「${row.name}」`,
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await deleteCertificateStandard(row.id);
          message("删除成功", { type: "success" });
          if (selectedStandard.value?.id === row.id) {
            selectedStandard.value = null;
            policyList.value = [];
          }
          refreshAll();
        } catch (error: any) {
          message(certificateStandardBizErrorMessage(error, "删除失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /* ------------------------------ 右：认定规则 ----------------------------- */
  const policyList = ref<RecognitionPolicy[]>([]);
  const policyLoading = ref(false);

  // 主从布局下右侧可用宽度有限（左侧导航固定占位），列宽按「够读就行」压到最小，
  // 避免整表被撑出横向滚动、再被 fixed 操作列长期盖住内容。
  const policyColumns: TableColumnList = [
    { label: "版本", prop: "version", minWidth: 60, slot: "policyVersion" },
    { label: "状态", prop: "status", minWidth: 80, slot: "policyStatus" },
    {
      label: "机构策略",
      minWidth: 90,
      formatter: ({ issuerPolicy }: RecognitionPolicy) =>
        ISSUER_POLICY_LABEL[issuerPolicy] ?? issuerPolicy
    },
    {
      label: "认可机构",
      minWidth: 120,
      formatter: (row: RecognitionPolicy) =>
        row.issuerPolicy === "FREE_TEXT"
          ? "—（自由填写）"
          : row.issuers.map(i => i.name).join("、") || "—"
    },
    {
      label: "有效期",
      minWidth: 110,
      formatter: (row: RecognitionPolicy) => validityText(row)
    },
    {
      label: "编号规则",
      minWidth: 90,
      formatter: ({ certNumberMode }: RecognitionPolicy) =>
        CERT_NUMBER_MODE_LABEL[certNumberMode] ?? certNumberMode
    },
    ...(canUpdatePolicy || canDeletePolicy
      ? [
          {
            label: "操作",
            fixed: "right" as const,
            width: 150,
            slot: "policyOperation"
          }
        ]
      : [])
  ];

  async function fetchPolicies() {
    if (!selectedStandard.value || !canReadPolicy) {
      policyList.value = [];
      return;
    }
    policyLoading.value = true;
    try {
      const { code, data } = await getRecognitionPolicies(
        selectedStandard.value.id
      );
      if (code === 0) policyList.value = data.items;
    } catch (error: any) {
      message(certificateStandardBizErrorMessage(error, "加载认定规则失败"), {
        type: "error"
      });
    } finally {
      policyLoading.value = false;
    }
  }

  function openPolicyDialog(title: "新建" | "编辑", row?: RecognitionPolicy) {
    if (!selectedStandard.value) return;
    const isEdit = title === "编辑";
    const standardId = selectedStandard.value.id;
    addDialog({
      title: isEdit ? `编辑认定规则 v${row?.version}` : "新建认定规则版本",
      width: "50%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          issuerPolicy: row?.issuerPolicy ?? "ALLOWLIST",
          validityMode: row?.validityMode ?? "PERMANENT",
          validityMonths: row?.validityMonths ?? null,
          certNumberMode: row?.certNumberMode ?? "OPTIONAL",
          issuerNames: row ? row.issuers.map(i => i.name) : [""]
        } as PolicyFormModel
      },
      contentRenderer: () => h(PolicyForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as PolicyFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            const body: CreateRecognitionPolicyBody = {
              issuerPolicy: curData.issuerPolicy,
              validityMode: curData.validityMode,
              certNumberMode: curData.certNumberMode,
              // FREE_TEXT 必须空数组；其余按填写顺序给 sortOrder
              issuers:
                curData.issuerPolicy === "FREE_TEXT"
                  ? []
                  : curData.issuerNames
                      .map(n => n.trim())
                      .filter(Boolean)
                      .map((name, index) => ({ name, sortOrder: index }))
            };
            // validityMonths 只有 FIXED_MONTHS 能带，其余模式传值即 18015
            if (
              curData.validityMode === "FIXED_MONTHS" &&
              curData.validityMonths != null
            ) {
              body.validityMonths = curData.validityMonths;
            }
            if (isEdit && row) {
              await updateRecognitionPolicy(row.id, body);
              message("修改成功", { type: "success" });
            } else {
              await createRecognitionPolicy(standardId, body);
              message("已创建草稿版本，激活后才会生效", { type: "success" });
            }
            done();
            fetchPolicies();
            fetchRecognized();
          } catch (error: any) {
            message(certificateStandardBizErrorMessage(error, "保存失败"), {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /**
   * 激活某个 DRAFT 版本。后端会**原子退役**该标准当前的生效版本——
   * 确认弹窗逐条写清「将会发生什么 / 什么会保留」，不是一句「确定吗」。
   */
  function handleActivatePolicy(row: RecognitionPolicy) {
    const current = policyList.value.find(p => p.status === "ACTIVE");
    const lines = [
      `· 版本 v${row.version} 将成为这个标准唯一生效的认定规则。`,
      current
        ? `· 当前生效的 v${current.version} 会在同一个事务里被退役。`
        : "· 这个标准目前还没有生效规则，激活后即可用于建证与审核。",
      "· 已经按旧版本认定过的历史证书不受影响——审核当时锁定的规则就是它终身的依据。",
      "· 激活后本版本变为只读，不能再修改；要改认可范围请另建新版本。"
    ];
    ElMessageBox.confirm(
      h(
        "div",
        { class: "leading-6" },
        lines.map(t => h("div", null, t))
      ) as unknown as string,
      `激活认定规则 v${row.version}`,
      {
        confirmButtonText: "确定激活",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await activateRecognitionPolicy(row.id);
          message("已激活", { type: "success" });
          fetchPolicies();
          fetchRecognized();
        } catch (error: any) {
          message(certificateStandardBizErrorMessage(error, "激活失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  function handleDeletePolicy(row: RecognitionPolicy) {
    ElMessageBox.confirm(
      `确定要删除草稿版本 v${row.version} 吗？只有草稿能删，删除后不影响任何已生效或已退役的版本。`,
      "删除认定规则",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await deleteRecognitionPolicy(row.id);
          message("删除成功", { type: "success" });
          fetchPolicies();
          fetchRecognized();
        } catch (error: any) {
          message(certificateStandardBizErrorMessage(error, "删除失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  onMounted(async () => {
    // 大类 / 等级字典供筛选与表单下拉用；标准列表本身不依赖它，先并发预热
    dict.ensureTypes(["cert_type", "cert_sub_type"]);
    await refreshAll();
  });

  return {
    // 权限
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canReadPolicy,
    canCreatePolicy,
    canUpdatePolicy,
    canDeletePolicy,
    // 左：标准
    standardLoading,
    standardList,
    selectedStandard,
    filters,
    categoryOptions,
    levelOptions,
    categoryLabel,
    levelLabel,
    displayStatus,
    canEditIdentity,
    selectedPendingRecognition,
    fetchStandards,
    resetFilters,
    selectStandard,
    openStandardDialog,
    handleToggleStandardStatus,
    handleDeleteStandard,
    // 右：认定规则
    policyLoading,
    policyList,
    policyColumns,
    fetchPolicies,
    openPolicyDialog,
    handleActivatePolicy,
    handleDeletePolicy
  };
}
