import { bizErrorMessage } from "@/api/srvf-error";
import dayjs from "dayjs";
import { h, ref, watch, computed } from "vue";
import { ElButton, ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import CertificateForm, { type CertificateFormModel } from "../form.vue";
import EvidenceViewer from "../evidence-viewer.vue";
import {
  getMemberCertificates,
  getMemberCertificate,
  getCertificateEvidenceUrls,
  createMemberCertificate,
  updateMemberCertificate,
  deleteMemberCertificate,
  verifyMemberCertificate,
  rejectMemberCertificate,
  getQualificationFlag,
  getCertificateStandardOptions,
  qualificationErrorMessage,
  CERT_STATUS_TAG,
  type CertificateItem,
  type CreateCertificateBody,
  type UpdateCertificateBody,
  type CertificateStandardOption,
  type CertificateCriterionType
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
  /**
   * 证书编号 / 核验备注 / 核验人的明文权限。
   * 无此码时后端 `certNumberFull` 恒 null（只给 `certNumberMasked`），
   * 编辑表单据此禁用编号输入并不提交，避免掩码覆盖真实编号。
   */
  const canReadSensitive = hasPerms("certificate.read.sensitive");
  /**
   * 附件查看码。注意后端 summary 写的是「另需 attachment.view」，但**实际种子里没有裸
   * `attachment.view` 这个码**，只有按归属分的 `.certificate.self` / `.certificate.other`
   * （2026-08-02 对 live effective-permissions 实测）。所以这里按「持任一即放行」判，
   * 具体 self / other 的范围判定归后端——前端按钮只是提示，真正的闸在服务端。
   */
  const canViewCertAttachment =
    hasPerms("attachment.view.certificate.other") ||
    hasPerms("attachment.view.certificate.self");

  /**
   * 这一行的证据能不能看：端点统一要敏感码；ADMIN 来源的证据走标准附件解析，
   * 后端**另**校验附件查看码，故前端同门控，避免点了必 403。
   */
  function canViewEvidence(row: CertificateItem) {
    if (!canReadSensitive) return false;
    return row.sourceCode === "ADMIN" ? canViewCertAttachment : true;
  }

  /** 缺哪个码，按钮 title 里说清，别让人对着灰按钮猜 */
  function evidenceDenyHint(row: CertificateItem) {
    if (!canReadSensitive) return "需要证书敏感信息查看权限";
    return row.sourceCode === "ADMIN"
      ? "管理端录入的证据还需要附件查看权限"
      : "";
  }
  /** 共享字典标签解析器：核验状态 / 证书类别 code → 中文 */
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["cert_type", "cert_status"]);

  /**
   * 证书标准 id → 标准。证书行上**不再有类别 / 等级**，分类展示一律经标准换算，
   * 故列表渲染前先把标准表拉齐（一次拉全，后端 limit 上限 200）。
   * 这里不传 `recognizedOnly`：列表要显示的是历史证书引用的标准，
   * 其中可能有已停用 / 已失去生效规则的，只用于**显示名称**，不影响能不能建证。
   */
  const standardMap = ref<Map<string, CertificateStandardOption>>(new Map());
  /** 建证 / 编辑下拉专用：只要「有生效认定规则」的标准,否则建了必被拒 */
  const standardOptions = ref<CertificateStandardOption[]>([]);
  const dataList = ref<CertificateItem[]>([]);
  const loading = ref(false);
  /** 证书隶属队员 id：由作战室经路由参数注入并固定。保留 ref 形态，CRUD/核验 handler 仍走 memberId.value 不改。 */
  const memberId = ref<string>(externalMemberId);
  const formRef = ref();

  /**
   * 资质核验小组件状态（qualification-flag：只读判定,与 canRead 同码不单独开权限）。
   * 入参已换成「判据级别 + 判据 code」两段：按大类查，还是按具体标准查。
   */
  const qualCheckType = ref<CertificateCriterionType>("category");
  const qualCheckCode = ref("");
  const qualCheckLoading = ref(false);
  const qualCheckResult = ref<{
    criterionType: CertificateCriterionType;
    criterionCode: string;
    qualified: boolean;
    expiredAt: string | null;
  } | null>(null);
  /** 判据变了旧判定就不对应了,清空避免被误读成当前判据的结果 */
  watch([qualCheckType, qualCheckCode], () => {
    qualCheckResult.value = null;
  });

  /** 标准 id → 名称（标准表没拉到或该标准已被删时退化显示占位，不显示裸 id） */
  function standardName(standardId: string | null) {
    if (!standardId) return "—";
    return standardMap.value.get(standardId)?.name ?? "（标准已失效）";
  }
  /** 标准 id → 类别中文（类别只存在于标准上，证书行上已无 certTypeCode） */
  function standardCategory(standardId: string | null) {
    const s = standardId ? standardMap.value.get(standardId) : undefined;
    return s ? dict.label("cert_type", s.categoryCode) : "—";
  }

  const columns: TableColumnList = [
    {
      label: "证书标准",
      prop: "standardId",
      minWidth: 180,
      formatter: ({ standardId }) => standardName(standardId)
    },
    {
      label: "类别",
      prop: "categoryCode",
      minWidth: 120,
      formatter: ({ standardId }) => standardCategory(standardId)
    },
    { label: "发证机构", prop: "issuingOrg", minWidth: 160 },
    {
      // 只显示掩码。后端对全局工作台连掩码都不返,这里能显示掩码已是最大限度。
      label: "证书编号",
      prop: "certNumberMasked",
      minWidth: 130,
      formatter: ({ certNumberMasked }) => certNumberMasked || "—"
    },
    {
      label: "状态",
      prop: "certStatusCode",
      minWidth: 110,
      slot: "certStatusCode"
    },
    {
      // 证据图：只给「有没有」+ 按需取链接的入口，列表渲染时绝不预取 URL（纪律 1）
      label: "证据",
      prop: "evidenceAvailable",
      minWidth: 110,
      cellRenderer: ({ row }) => renderEvidenceCell(row as CertificateItem)
    },
    {
      // 核验信息：无敏感码时后端恒返 null，必须显示「需敏感权限查看」而不是当作「没填」
      label: "核验信息",
      minWidth: 150,
      cellRenderer: ({ row }) => renderVerifyCell(row as CertificateItem)
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
    return CERT_STATUS_TAG[code] ?? "info";
  }

  /* ------------------------------ 证据图单元格 ------------------------------ */
  /**
   * 证据列：`evidenceAvailable` 只是个布尔，真正的图要点了才取（纪律 1「不预加载」）。
   *
   * 按钮门控分两档，与后端一致：
   * - 端点本身要 `certificate.read.sensitive`；
   * - **`sourceCode=ADMIN` 的还另需附件查看码**（走 AttachmentsService 解析）。
   * 无权时按钮置灰并说明缺什么，而不是把「有证据」这件事一并藏掉——
   * 「有材料但你看不了」和「压根没材料」是两回事。
   */
  function renderEvidenceCell(row: CertificateItem) {
    if (!row.evidenceAvailable) {
      return h("span", { class: "opacity-50" }, "无");
    }
    const allowed = canViewEvidence(row);
    return h(
      ElButton,
      {
        link: true,
        type: allowed ? "primary" : undefined,
        disabled: !allowed,
        title: allowed ? "" : evidenceDenyHint(row),
        onClick: () => openEvidence(row)
      },
      () => (allowed ? "查看证据" : "有证据（无权查看）")
    );
  }

  /**
   * 核验信息列：`verifyNote` / `verifiedBy` 在无 `certificate.read.sensitive` 时
   * 后端**恒返 null**。这跟「核验人没写备注」长得一样但含义完全不同，
   * 所以无码时显式说「需敏感权限查看」，不能直接渲染成空。
   */
  function renderVerifyCell(row: CertificateItem) {
    // 还没核验过的，不存在核验信息，跟权限无关
    if (row.certStatusCode === "pending") {
      return h("span", { class: "opacity-50" }, "—");
    }
    if (!canReadSensitive) {
      return h("span", { class: "opacity-60" }, "需敏感权限查看");
    }
    const at = row.verifiedAt
      ? dayjs(row.verifiedAt).format("YYYY-MM-DD HH:mm")
      : "";
    return h("div", { class: "text-xs leading-5" }, [
      h("div", null, at || "—"),
      h("div", { class: "opacity-70" }, row.verifyNote || "（无备注）")
    ]);
  }

  /**
   * 拉证书标准表。列表要靠它把 `standardId` 换成名称与类别，
   * 所以它失败时列表仍渲染（标准列退化为占位），不阻塞证书本体。
   */
  async function loadStandards() {
    try {
      const { code, data } = await getCertificateStandardOptions({
        limit: 200
      });
      if (code === 0) {
        standardMap.value = new Map(data.items.map(s => [s.id, s]));
        standardOptions.value = data.items.filter(s => s.currentlyRecognized);
      }
    } catch {
      // 标准表拉不到不影响看证书本体：名称退化为占位，建证下拉为空时表单会拦住
    }
  }

  /**
   * 列表端点是**精简字段**（后端 summary 原话）：只返 10 个字段，
   * `certNumberMasked` / `certNumberFull` / `verifiedBy` / `verifiedAt` / `verifyNote` /
   * `evidenceAvailable` **一个都没有**（2026-08-02 对 live 实测确认）。
   * 详情端点才「含敏感字段」，且与列表同码 `certificate.read.record`。
   *
   * 所以逐行补一次详情再渲染。代价是 N+1，但这里 N 很小：证书列表按队员维度、
   * 后端明确无分页，一个人几张证而已。收益是三处都对：
   * ① 编号列不再恒为「—」；② 编辑态编号能用明文回填（否则提交时会把 `certNumber`
   * 当成「被清空」发出去——REQUIRED 规则下后端报 18016 让人改不动，
   * OPTIONAL 规则下会真的清掉编号）；③ 证据与核验信息列有数据可显示。
   *
   * 单行详情失败不拖垮整表：保留该行的精简数据，降级显示。
   */
  async function withDetails(rows: CertificateItem[]) {
    if (!memberId.value) return rows;
    return Promise.all(
      rows.map(async row => {
        try {
          const { code, data } = await getMemberCertificate(
            memberId.value,
            row.id
          );
          return code === 0 ? { ...row, ...data } : row;
        } catch {
          return row;
        }
      })
    );
  }

  async function onSearch() {
    if (!canRead || !memberId.value) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const [{ code, data }] = await Promise.all([
        getMemberCertificates(memberId.value),
        loadStandards()
      ]);
      if (code === 0) dataList.value = await withDetails(data);
    } catch (error: any) {
      message(bizErrorMessage(error, "加载证书失败"), {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  /** 新建提交体：机构三选一按认定规则只发该发的那一个，多发后端直接拒。 */
  function buildCreateBody(m: CertificateFormModel): CreateCertificateBody {
    const policy = standardMap.value.get(m.standardId)?.currentPolicy ?? null;
    const body: CreateCertificateBody = {
      standardId: m.standardId,
      issuedAt: m.issuedAt
    };
    if (policy?.issuerPolicy === "ALLOWLIST" && m.recognitionIssuerId)
      body.recognitionIssuerId = m.recognitionIssuerId;
    if (policy?.issuerPolicy === "FREE_TEXT" && m.issuingOrg)
      body.issuingOrg = m.issuingOrg;
    // FIXED：两个都不传，后端自己选唯一机构
    if (policy?.certNumberMode !== "NONE" && m.certNumber)
      body.certNumber = m.certNumber;
    // PERMANENT 必须空；FIXED_MONTHS 客户端不得传（后端按月算）
    const autoExpiry =
      policy?.validityMode === "PERMANENT" ||
      policy?.validityMode === "FIXED_MONTHS";
    if (!autoExpiry && m.expiredAt) body.expiredAt = m.expiredAt;
    return body;
  }

  /**
   * 编辑提交体：**只发真的被改过的字段**。
   *
   * 这是 PATCH 三态语义的要求——本 DTO 里「不传 = 保持原值，传 null = 真的清空」。
   * 所以不能像别处那样把整张表单原样提交：用户没碰过的机构 / 编号 / 到期日
   * 会被当成「显式清空」写成 null。逐字段与原值比对，一致就不发 key。
   *
   * 编号另有一层：无 `certificate.read.sensitive` 时表单里根本没有明文
   * （后端只给掩码），此时**恒不发** certNumber，避免把掩码写成真值。
   */
  function buildUpdateBody(
    m: CertificateFormModel,
    row: CertificateItem
  ): UpdateCertificateBody {
    const policy = standardMap.value.get(m.standardId)?.currentPolicy ?? null;
    const body: UpdateCertificateBody = {};

    if (m.standardId !== row.standardId) body.standardId = m.standardId;

    const dateOf = (v: string | null) =>
      v ? dayjs(v).format("YYYY-MM-DD") : "";
    if (m.issuedAt && m.issuedAt !== dateOf(row.issuedAt))
      body.issuedAt = m.issuedAt;

    if (policy?.issuerPolicy === "ALLOWLIST") {
      const next = m.recognitionIssuerId || null;
      if (next !== row.recognitionIssuerId) body.recognitionIssuerId = next;
    } else if (policy?.issuerPolicy === "FREE_TEXT") {
      const next = m.issuingOrg || null;
      if (next !== row.issuingOrg) body.issuingOrg = next;
    }

    if (policy?.certNumberMode !== "NONE" && canReadSensitive) {
      const next = m.certNumber || null;
      // 原值取明文（无敏感码时为 null，但此分支已被 canReadSensitive 挡掉）
      if (next !== row.certNumberFull) body.certNumber = next;
    }

    const autoExpiry =
      policy?.validityMode === "PERMANENT" ||
      policy?.validityMode === "FIXED_MONTHS";
    if (!autoExpiry) {
      // 两边都归一成「YYYY-MM-DD 或 null」再比，否则空值会被判成有变化而白发一次 null
      const cur = row.expiredAt
        ? dayjs(row.expiredAt).format("YYYY-MM-DD")
        : null;
      const next = m.expiredAt || null;
      if (next !== cur) body.expiredAt = next;
    }
    return body;
  }

  /**
   * 新建 / 编辑弹窗。
   * 编辑态编号用 `certNumberFull` 回填——**绝不用 `certNumberMasked`**，
   * 无敏感码时它为 null，表单会因此禁用该输入并不提交。
   */
  async function openDialog(title: "新建" | "编辑", row?: CertificateItem) {
    if (!memberId.value) {
      message("请先选择一名队员", { type: "warning" });
      return;
    }
    await Promise.all([dict.ensureTypes(["cert_type"]), loadStandards()]);
    const isEdit = title === "编辑";
    if (!isEdit && standardOptions.value.length === 0) {
      message(
        "还没有可用于建证的证书标准：标准需先配好生效的认定规则才能建证书，请先到证书标准库配置",
        { type: "warning", duration: 6000 }
      );
      return;
    }
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
          certStatusCode: row?.certStatusCode ?? "",
          standardId: row?.standardId ?? "",
          recognitionIssuerId: row?.recognitionIssuerId ?? "",
          issuingOrg: row?.issuingOrg ?? "",
          // 明文回填；无敏感码时后端给的是 null，留空 + 表单禁用 + 提交剔除
          certNumber: row?.certNumberFull ?? "",
          issuedAt: row?.issuedAt
            ? dayjs(row.issuedAt).format("YYYY-MM-DD")
            : "",
          expiredAt: row?.expiredAt
            ? dayjs(row.expiredAt).format("YYYY-MM-DD")
            : ""
        } as CertificateFormModel,
        // 编辑时也把当前证书引用的标准并进选项,否则该标准若已不可认定,下拉里选不中自己
        standardOptions: (() => {
          const opts = [...standardOptions.value];
          const cur = row?.standardId
            ? standardMap.value.get(row.standardId)
            : undefined;
          if (cur && !opts.some(o => o.id === cur.id)) opts.unshift(cur);
          return opts;
        })(),
        canReadSensitive
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
              const patch = buildUpdateBody(curData, row);
              if (Object.keys(patch).length === 0) {
                message("没有任何改动", { type: "info" });
                closeLoading();
                return;
              }
              await updateMemberCertificate(memberId.value, row.id, patch);
              message("修改成功", { type: "success" });
            } else {
              await createMemberCertificate(
                memberId.value,
                buildCreateBody(curData)
              );
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

  /** 行主语：证书标准名 · 颁发机构（用于确认 / 核验弹窗文案） */
  function certSubject(row: CertificateItem) {
    return `${standardName(row.standardId)} · ${row.issuingOrg}`;
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
          message(bizErrorMessage(error, "删除失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /**
   * 取一次证据 URL。失败弹后端 message 并返 null（重试由弹窗内的「重新获取」驱动）。
   * **不做任何缓存**：每次调用都重新申请，短 TTL 链接不留在内存以外的任何地方（纪律 3）。
   */
  async function fetchEvidence(row: CertificateItem) {
    if (!memberId.value) return null;
    try {
      const { code, data } = await getCertificateEvidenceUrls(
        memberId.value,
        row.id
      );
      return code === 0 ? data : null;
    } catch (error: any) {
      // 13010「附件归属类型不合法」= 这张证其实没有可解析的附件（2026-08-02 实测：
      // ADMIN 来源且无证据时后端返这个码）。按钮已按 evidenceAvailable 门控，
      // 正常点不到；能走到这里多半是刚被人删了证据，直出后端原文没人看得懂。
      const code = Number(error?.response?.data?.code);
      message(
        code === 13010
          ? "这张证书现在没有可查看的证据材料了（可能刚被删除）。刷新后再看看"
          : bizErrorMessage(error, "取证据图失败"),
        { type: "error" }
      );
      return null;
    }
  }

  /**
   * 点开才取 URL，然后在**弹窗内**看（纪律 1 + 不开新标签）。
   * signed-URL 开新标签会落进浏览器历史，而这是敏感材料，所以一律弹窗。
   * `destroyOnClose` 保证关闭即销毁组件 → 引用随之丢弃（纪律 2）。
   */
  async function openEvidence(row: CertificateItem) {
    const data = await fetchEvidence(row);
    if (!data) return;
    addDialog({
      title: `证书证据 · ${certSubject(row)}`,
      width: "56%",
      draggable: true,
      hideFooter: true,
      destroyOnClose: true,
      contentRenderer: () =>
        h(EvidenceViewer, {
          data,
          subject: certSubject(row),
          onRefetch: () => fetchEvidence(row)
        })
    });
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
          // 已过期的证书也允许核验通过，但结果落点是 expired 而不是 verified
          //（后端按到期日现算展示态）。文案必须说清，否则会被读成「核验没生效」。
          message(
            row.expiredAt && dayjs(row.expiredAt).isBefore(dayjs(), "day")
              ? "核验通过，但该证书已过期"
              : "已核验通过",
            { type: "success" }
          );
          onSearch();
        } catch (error: any) {
          message(bizErrorMessage(error, "核验通过失败"), {
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
          message(bizErrorMessage(error, "核验驳回失败"), {
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
    if (!memberId.value || !qualCheckCode.value) return;
    qualCheckLoading.value = true;
    qualCheckResult.value = null;
    try {
      const { code, data } = await getQualificationFlag(
        memberId.value,
        qualCheckType.value,
        qualCheckCode.value
      );
      if (code === 0) {
        qualCheckResult.value = {
          criterionType: data.criterionType,
          criterionCode: data.criterionCode,
          qualified: data.qualified,
          expiredAt: data.expiredAt
        };
      }
    } catch (error: any) {
      // 判据不存在(18010/18002)是配置问题,不能显示成「不具备资质」——文案在 api 层分开了
      message(qualificationErrorMessage(error, "资质核验查询失败"), {
        type: "error"
      });
    } finally {
      qualCheckLoading.value = false;
    }
  }

  /** 判据下拉:大类取 cert_type 字典;标准取标准表的稳定 code(不是 cuid) */
  const qualCriterionOptions = computed(() =>
    qualCheckType.value === "category"
      ? dict.options("cert_type")
      : [...standardMap.value.values()].map(s => ({
          label: s.name,
          value: s.code
        }))
  );

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
    qualCheckType,
    qualCheckCode,
    qualCriterionOptions,
    qualCheckLoading,
    qualCheckResult,
    checkQualification,
    standardName
  };
}
