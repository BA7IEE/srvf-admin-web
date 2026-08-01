import { bizErrorMessage } from "@/api/srvf-error";
import dayjs from "dayjs";
import { h, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import { addDialog } from "@/components/ReDialog";
import { hasPerms } from "@/utils/auth";
import { useSrvfList } from "@/srvf-kit";
import ProfileForm, { type ProfileFormModel } from "../profile-form.vue";
import IdCardViewer from "../id-card-viewer.vue";
import {
  getRecruitmentApplications,
  getRecruitmentApplication,
  markThreshold,
  evaluateApplication,
  resolveApplication,
  updateRecruitmentApplication,
  promoteSingleApplication,
  recruitmentBizErrorMessage,
  getIdCardImageUrl,
  type IdCardImageUrl,
  type UpdateApplicationBody,
  APP_STATUS_LABEL,
  APP_STATUS_TAG,
  THRESHOLD_CODES,
  RISK_LEVEL_LABEL,
  RISK_LEVEL_TAG,
  MANUAL_REVIEW_REASON_LABEL,
  MANUAL_REVIEW_REASONS,
  type RecruitmentApplication,
  type MarkThresholdBody,
  type ApplicationListQuery,
  type RiskLevel
} from "@/api/srvf-recruitment";

/** 可标门槛态(后端:仅 verified/pending_evaluation) */
const THRESHOLD_EDITABLE_STATUS = ["verified", "pending_evaluation"];
/** 可综合评定态(后端:仅 pending_evaluation) */
const EVALUATE_STATUS = ["pending_evaluation"];
/** 可人工 resolve 态(后端:manual_review / pending_verification / mismatch 卡死态) */
const RESOLVE_STATUS = ["manual_review", "pending_verification", "mismatch"];
/**
 * 改资料禁入态：已发号 / 已拒 / 已撤销。
 * 后端对 promoted 与已脱敏行一律 28041（回写 PII 与留存 SOP「已清不再触」冲突），
 * rejected/withdrawn 是终态同理——这几类不给入口，免得点了才知道不行。
 */
const UPDATE_LOCKED_STATUS = ["promoted", "rejected", "withdrawn"];

/**
 * @param cycleId 招新轮次 id（来自招新作战室路由参数）。报名按 cycleId 过滤,无页内轮次下拉。
 */
export function useRecruitmentApplications(cycleId: string) {
  const router = useRouter();

  const canRead = hasPerms("recruitment-application.read.record");
  const canMarkThreshold = hasPerms("recruitment-application.mark.threshold");
  const canEvaluate = hasPerms("recruitment-application.evaluate.assessment");
  const canResolve = hasPerms("recruitment-application.resolve.manual");
  /** 改资料与单人建档各自独立码：能看能审 ≠ 能改资料 ≠ 能建档 */
  const canUpdate = hasPerms("recruitment-application.update.record");
  const canPromoteSingle = hasPerms("recruitment-application.promote.single");
  /**
   * 证件照是 L3 敏感材料，端点判的是**敏感码**（不是列表读码）。
   * 只有读码的人不该看到这个按钮——看到了点下去只会吃 403。
   */
  const canReadSensitive = hasPerms("recruitment-application.read.sensitive");
  /** 正在建档的那一行（按钮 loading 用） */
  const promotingId = ref("");

  /** statusCode 过滤（默认空 = 全部该轮报名） */
  const statusFilter = ref<string>("");
  /**
   * 人工队列三栏（默认空 = 不分栏、看全部）。
   * 后端 v0.31 起就支持按 `riskLevel` 过滤，这里才把它接上。
   */
  const riskFilter = ref<RiskLevel | "">("");
  /**
   * 人工原因分组筛（默认空 = 不筛）。
   * ⚠️ **后端列表端点没有 `manualReviewReason` 这个 query 参数**（实测 `/api/docs-json`
   * 只有 page/pageSize/cycleId/statusCode/riskLevel 五个），所以这一项只能**在当前页内
   * 前端过滤**。因此它筛的是「这一页里的」，不是全量——分页数字仍是后端的原始总数，
   * 不去改 pagination.total 假装筛过（那会让翻页彻底对不上）。
   */
  const reasonFilter = ref<string>("");

  const {
    dataList,
    loading,
    pagination,
    onSearch,
    onFilterChange,
    handleSizeChange,
    handleCurrentChange
  } = useSrvfList<RecruitmentApplication, ApplicationListQuery>({
    fetch: getRecruitmentApplications,
    buildParams: () => ({
      cycleId,
      ...(statusFilter.value ? { statusCode: statusFilter.value } : {}),
      ...(riskFilter.value ? { riskLevel: riskFilter.value } : {})
    }),
    errorMessage: "加载报名列表失败",
    canRead: canRead && Boolean(cycleId)
  });

  /** 页内再按人工原因过滤（见 `reasonFilter` 的说明：后端不支持该 query）。 */
  const visibleList = computed(() =>
    reasonFilter.value
      ? dataList.value.filter(
          (r: RecruitmentApplication) =>
            r.manualReviewReason === reasonFilter.value
        )
      : dataList.value
  );

  /** 三栏选项（含「全部」，作 segmented 用） */
  const riskOptions = [
    { value: "" as const, label: "全部" },
    ...(
      Object.keys(RISK_LEVEL_LABEL) as Array<keyof typeof RISK_LEVEL_LABEL>
    ).map(v => ({ value: v, label: RISK_LEVEL_LABEL[v] }))
  ];

  const reasonOptions = [
    { value: "", label: "全部人工原因" },
    ...MANUAL_REVIEW_REASONS.map(v => ({
      value: v as string,
      label: MANUAL_REVIEW_REASON_LABEL[v]
    }))
  ];

  /** 风险级展示元数据；null（未分级）走「—」不显示标签。 */
  function riskMeta(level: string | null) {
    if (!level) return null;
    return {
      text: RISK_LEVEL_LABEL[level as RiskLevel] ?? level,
      type: RISK_LEVEL_TAG[level as RiskLevel] ?? ("info" as const)
    };
  }

  /** 人工原因文案；未知值原样返回（后端加了新分类时不静默吞掉）。 */
  function reasonText(reason: string | null) {
    return reason ? (MANUAL_REVIEW_REASON_LABEL[reason] ?? reason) : "—";
  }

  function onRiskChange() {
    onFilterChange();
  }

  /** 详情 drawer（全 PII + 门槛开关）；详情走 getRecruitmentApplication(全显,读记审计) */
  const detailVisible = ref(false);
  const detailLoading = ref(false);
  const detailData = ref<RecruitmentApplication | null>(null);

  const statusOptions = computed(() => [
    { value: "", label: "全部状态" },
    ...Object.keys(APP_STATUS_LABEL).map(code => ({
      value: code,
      label: APP_STATUS_LABEL[code]
    }))
  ]);

  const columns: TableColumnList = [
    {
      label: "临时编号",
      prop: "tempNo",
      minWidth: 130,
      formatter: ({ tempNo }) => tempNo ?? "—"
    },
    {
      label: "姓名",
      prop: "realName",
      minWidth: 120,
      formatter: ({ realName }) => realName ?? "—"
    },
    {
      label: "非大陆证件",
      prop: "isNonMainlandDocument",
      minWidth: 110,
      formatter: ({ isNonMainlandDocument }) =>
        isNonMainlandDocument ? "是" : "否"
    },
    { label: "状态", prop: "statusCode", minWidth: 120, slot: "statusCode" },
    { label: "风险级", prop: "riskLevel", minWidth: 100, slot: "riskLevel" },
    {
      label: "人工原因",
      prop: "manualReviewReason",
      minWidth: 175,
      formatter: ({ manualReviewReason }) => reasonText(manualReviewReason)
    },
    {
      label: "门槛",
      prop: "thresholdsComplete",
      minWidth: 90,
      formatter: ({ thresholdMarks, thresholdsComplete }) => {
        const done = thresholdMarks
          ? Object.values(thresholdMarks).filter(Boolean).length
          : 0;
        return thresholdsComplete
          ? "已齐"
          : `${done}/${THRESHOLD_CODES.length}`;
      }
    },
    {
      label: "报名时间",
      prop: "createdAt",
      minWidth: 165,
      formatter: ({ createdAt }) =>
        createdAt ? dayjs(createdAt).format("YYYY-MM-DD HH:mm") : "—"
    },
    { label: "操作", fixed: "right" as const, width: 320, slot: "operation" }
  ];

  function statusMeta(code: string) {
    return {
      text: APP_STATUS_LABEL[code] ?? code,
      type: APP_STATUS_TAG[code] ?? ("info" as const)
    };
  }

  /** 行主语:姓名 → 临时编号 → id（列表姓名为掩码,够用于确认文案） */
  function rowSubject(row: RecruitmentApplication) {
    return row.realName ?? row.tempNo ?? row.id;
  }

  /** 行内动作可见性（状态门 + RBAC 码；状态机最终由后端裁决,非法转弹其 message） */
  function canDoThreshold(row: RecruitmentApplication) {
    return (
      canMarkThreshold && THRESHOLD_EDITABLE_STATUS.includes(row.statusCode)
    );
  }
  function canDoEvaluate(row: RecruitmentApplication) {
    return canEvaluate && EVALUATE_STATUS.includes(row.statusCode);
  }
  function canDoResolve(row: RecruitmentApplication) {
    return canResolve && RESOLVE_STATUS.includes(row.statusCode);
  }
  /**
   * 改资料可见性：终态（已发号 / 已拒 / 已撤销）不给入口——
   * 后端对这些行一律 28041，给了按钮只会白点一次。
   */
  function canDoUpdate(row: RecruitmentApplication) {
    return canUpdate && !UPDATE_LOCKED_STATUS.includes(row.statusCode);
  }
  /** 单人建档可见性：仅公示态可建（他态含已 promoted → 28041 幂等不重复建）。 */
  function canDoPromoteSingle(row: RecruitmentApplication) {
    return canPromoteSingle && row.statusCode === "publicity";
  }

  /** 身份组是否可改：仅人工复核态或非大陆证件记录（其余 → 28045）。 */
  function identityEditable(row: RecruitmentApplication) {
    return row.statusCode === "manual_review" || row.isNonMainlandDocument;
  }

  /**
   * 由表单模型拼出 PATCH body——**这是掩码/派生防回写的最后一道闸**：
   * - 身份组不可改时，四个身份字段一个都不发（发了就是 28045）；
   * - 大陆记录的 birthDate/genderCode 恒不发（发了是 40000，不是被忽略）；
   * - 值没变的字段不发（PATCH 三态：不传 = 保持原样）。
   */
  function buildProfilePatch(
    row: RecruitmentApplication,
    form: ProfileFormModel
  ): UpdateApplicationBody {
    const body: UpdateApplicationBody = {};
    const put = (k: keyof UpdateApplicationBody, next: string, prev: unknown) =>
      next !== (prev ?? "") && Object.assign(body, { [k]: next });

    if (identityEditable(row)) {
      put("realName", form.realName, row.realName);
      put("idCardNumber", form.idCardNumber, row.idCardNumber);
      // 仅非大陆记录能直改这两项；大陆记录恒由证件号派生
      if (row.isNonMainlandDocument) {
        put("birthDate", form.birthDate, "");
        put("genderCode", form.genderCode, row.genderCode);
      }
    }
    put("detailedAddress", form.detailedAddress, "");
    put("cityDistrict", form.cityDistrict, row.cityDistrict);
    put("sourceChannel", form.sourceChannel, "");
    return body;
  }

  /**
   * 打开改资料表单。
   *
   * 只收 id 不收行对象——发号预检与公示名单两张表的行是另一种形状（只有
   * `applicationId` + 姓名），它们也要能开这个表单。数据一律现拉详情端点：
   * 列表里的姓名/证件号是掩码，拿掩码回填再提交就是把 `***` 写回库里。
   */
  async function openProfileForm(applicationId: string) {
    let full: RecruitmentApplication;
    try {
      const { code, data } = await getRecruitmentApplication(applicationId);
      if (code !== 0) return;
      full = data;
    } catch (error: any) {
      message(recruitmentBizErrorMessage(error, "加载报名详情失败"), {
        type: "error"
      });
      return;
    }

    const model: ProfileFormModel = {
      identityEditable: identityEditable(full),
      isNonMainlandDocument: full.isNonMainlandDocument,
      realName: full.realName ?? "",
      idCardNumber: full.idCardNumber ?? "",
      birthDate: "",
      genderCode: full.genderCode ?? "",
      detailedAddress: "",
      cityDistrict: full.cityDistrict ?? "",
      sourceChannel: "",
      originalIdCardNumber: full.idCardNumber ?? ""
    };

    addDialog({
      title: `修改资料 · ${rowSubject(full)}`,
      width: "44%",
      draggable: true,
      closeOnClickModal: false,
      contentRenderer: () => h(ProfileForm, { formInline: model }),
      beforeSure: async (done: () => void) => {
        const body = buildProfilePatch(full, model);
        if (!Object.keys(body).length) {
          message("没有改动任何字段", { type: "info" });
          return;
        }
        try {
          const res = await updateRecruitmentApplication(full.id, body);
          if (res.code === 0) {
            message("已保存", { type: "success" });
            if (detailData.value?.id === full.id) detailData.value = res.data;
            onSearch();
            done();
          }
        } catch (error: any) {
          message(recruitmentBizErrorMessage(error, "保存失败"), {
            type: "error",
            duration: 8000
          });
        }
      }
    });
  }

  /**
   * 单人建档（批量发号跳过的行由此收尾）。
   *
   * 两条失败路径都要给出**下一步**，不能只报错：
   * - `28047` 资料不齐 → 直接把改资料表单开出来，别让人自己去找入口；
   * - `28046` 双缺双占 → 说清要申请人先自助换绑，后台这边建不了。
   */
  async function handlePromoteSingle(
    applicationId: string,
    subject: string,
    /** 建档成功后额外要刷的东西（发号预检 / 公示名单 / 轮次统计由调用方传入）。 */
    afterDone?: () => void
  ) {
    try {
      await ElMessageBox.confirm(
        h("div", { class: "leading-6" }, [
          h("p", `确定给「${subject}」单独建档吗？`),
          h("ul", { class: "mt-2 pl-4 list-disc text-xs" }, [
            h("li", "会发一个永久编号，与批量发号共用同一号段、连续不跳号"),
            h("li", "会建立队员档案与登录账号，并按既有规则派发通知"),
            h("li", "报名状态转为「已发号」，敏感信息随即清理")
          ]),
          h(
            "p",
            { class: "mt-2 text-xs" },
            "登录方式由系统择优决定：微信没被占用就用微信，否则用手机号。建完会告诉你用的哪个。"
          )
        ]),
        "单人建档",
        {
          confirmButtonText: "确定建档",
          cancelButtonText: "返回",
          type: "warning"
        }
      );
    } catch {
      return;
    }

    promotingId.value = applicationId;
    try {
      const { code, data } = await promoteSingleApplication(applicationId);
      if (code === 0) {
        ElMessageBox.alert(
          h("div", { class: "leading-6" }, [
            h("p", `已为「${data.realName ?? subject}」建档完成。`),
            h("ul", { class: "mt-2 pl-4 list-disc text-xs" }, [
              h("li", `永久编号：${data.memberNo}`),
              h(
                "li",
                `登录方式：${data.loginChannel === "wechat" ? "微信" : "手机号"}`
              )
            ]),
            data.loginChannel === "phone"
              ? h(
                  "p",
                  { class: "mt-2 text-xs" },
                  "这个人的微信没能用作登录锚点（未绑定或已被占用），所以用手机号开的号——请转告本人用手机验证码登录。"
                )
              : null
          ]),
          "建档结果",
          { confirmButtonText: "知道了", type: "success" }
        ).catch(() => {});
        onSearch();
        afterDone?.();
      }
    } catch (error: any) {
      const bizCode = Number(
        (error as { response?: { data?: { code?: unknown } } })?.response?.data
          ?.code
      );
      message(recruitmentBizErrorMessage(error, "建档失败"), {
        type: "error",
        duration: 8000
      });
      // 28047 = 资料不齐：直接把补录表单开出来，省得操作者自己找入口
      if (bizCode === 28047 && canUpdate) openProfileForm(applicationId);
    } finally {
      promotingId.value = "";
    }
  }

  /** 查看详情（drawer 内全 PII + 门槛开关）；走详情端点拿全显字段（读 PII 后端记审计） */
  async function openDetail(row: RecruitmentApplication) {
    detailVisible.value = true;
    detailLoading.value = true;
    detailData.value = null;
    try {
      const { code, data } = await getRecruitmentApplication(row.id);
      if (code === 0) detailData.value = data;
    } catch (error: any) {
      message(bizErrorMessage(error, "加载报名详情失败"), {
        type: "error"
      });
    } finally {
      detailLoading.value = false;
    }
  }

  /** 标/清门槛（操作当前 drawer 内报名；成功后重拉详情 + 刷新列表,反映自动推进） */
  async function handleMarkThreshold(
    code: MarkThresholdBody["thresholdCode"],
    completed: boolean
  ) {
    const app = detailData.value;
    if (!app) return;
    try {
      const res = await markThreshold(app.id, {
        thresholdCode: code,
        completed
      });
      if (res.code === 0) {
        detailData.value = res.data;
        message(completed ? "已标记完成" : "已清除", { type: "success" });
        onSearch();
      }
    } catch (error: any) {
      message(bizErrorMessage(error, "门槛标记失败"), {
        type: "error"
      });
    }
  }

  /** 综合评定（pending_evaluation；通过→公示 / 淘汰→未通过；note 淘汰必填） */
  function handleEvaluate(row: RecruitmentApplication, approved: boolean) {
    const title = approved ? "评定通过" : "评定淘汰";
    ElMessageBox.prompt(
      approved
        ? `确定评定通过「${rowSubject(row)}」吗？通过后进入公示。可填写评定备注（可空）。`
        : `确定淘汰「${rowSubject(row)}」吗？请填写淘汰理由（必填）。`,
      title,
      {
        confirmButtonText: `确定${title}`,
        cancelButtonText: "返回",
        type: approved ? "info" : "warning",
        inputType: "textarea",
        inputPlaceholder: approved
          ? "评定备注（可空；≤ 500）"
          : "淘汰理由（必填；≤ 500）",
        inputValidator: (val: string) => {
          if (!approved && (!val || !val.trim())) return "淘汰理由为必填项";
          if (val && val.length > 500) return "不能超过 500 字";
          return true;
        }
      }
    )
      .then(async ({ value }) => {
        try {
          await evaluateApplication(row.id, {
            approved,
            ...(value ? { note: value } : {})
          });
          message(approved ? "已评定通过" : "已淘汰", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(bizErrorMessage(error, `${title}失败`), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 人工 resolve（卡死态；approved→verified 发临时编号〔受容量限〕/ 驳回→未通过） */
  function handleResolve(row: RecruitmentApplication, approved: boolean) {
    const title = approved ? "通过(发临时编号)" : "驳回";
    ElMessageBox.prompt(
      approved
        ? `确定人工通过「${rowSubject(row)}」并发临时编号吗？受轮次容量限。可填写备注（可空）。`
        : `确定驳回「${rowSubject(row)}」吗？请填写理由（必填）。`,
      `人工${title}`,
      {
        confirmButtonText: "确定",
        cancelButtonText: "返回",
        type: approved ? "info" : "warning",
        inputType: "textarea",
        inputPlaceholder: approved
          ? "备注（可空；≤ 500）"
          : "驳回理由（必填；≤ 500）",
        inputValidator: (val: string) => {
          if (!approved && (!val || !val.trim())) return "驳回理由为必填项";
          if (val && val.length > 500) return "不能超过 500 字";
          return true;
        }
      }
    )
      .then(async ({ value }) => {
        try {
          await resolveApplication(row.id, {
            approved,
            ...(value ? { reviewNote: value } : {})
          });
          message("处理成功", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(bizErrorMessage(error, "处理失败"), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /**
   * 取证件照三图并在弹窗里看（原图 / 主体框 / 头像）。
   *
   * 改成弹窗而不是新标签：signed-URL 开在新标签会留在浏览器历史里，
   * 而这是 L3 敏感材料。弹窗关掉即弃，链接不落任何存储（读图后端记审计）。
   */
  async function openIdCardImage(row: RecruitmentApplication) {
    let urls: IdCardImageUrl;
    try {
      const { code, data } = await getIdCardImageUrl(row.id);
      if (code !== 0 || !data?.url) return;
      urls = data;
    } catch (error: any) {
      message(recruitmentBizErrorMessage(error, "取证件照失败"), {
        type: "error"
      });
      return;
    }

    addDialog({
      title: `证件照 · ${rowSubject(row)}`,
      width: "52%",
      draggable: true,
      hideFooter: true,
      destroyOnClose: true,
      contentRenderer: () => h(IdCardViewer, { urls, subject: rowSubject(row) })
    });
  }

  /** 已发号者 → 跳队员作战室查看建好的 Member */
  function goMember(row: RecruitmentApplication) {
    if (row.promotedMemberId) {
      router.push(`/srvf/members-domain/members/${row.promotedMemberId}`);
    }
  }

  return {
    canRead,
    canMarkThreshold,
    canEvaluate,
    canResolve,
    canUpdate,
    canPromoteSingle,
    canReadSensitive,
    loading,
    statusFilter,
    statusOptions,
    riskFilter,
    riskOptions,
    reasonFilter,
    reasonOptions,
    riskMeta,
    reasonText,
    onRiskChange,
    promotingId,
    columns,
    dataList: visibleList,
    pagination,
    statusMeta,
    detailVisible,
    detailLoading,
    detailData,
    onSearch,
    onFilterChange,
    canDoThreshold,
    canDoEvaluate,
    canDoResolve,
    canDoUpdate,
    canDoPromoteSingle,
    openProfileForm,
    handlePromoteSingle,
    openDetail,
    handleMarkThreshold,
    handleEvaluate,
    handleResolve,
    openIdCardImage,
    goMember,
    handleSizeChange,
    handleCurrentChange
  };
}
