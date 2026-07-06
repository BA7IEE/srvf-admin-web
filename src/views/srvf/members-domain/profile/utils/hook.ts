import { bizErrorMessage } from "@/api/srvf-error";
import { ref, computed, h } from "vue";
import dayjs from "dayjs";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import ProfileForm, { type ProfileFormModel } from "../form.vue";
import {
  getMemberProfile,
  createMemberProfile,
  updateMemberProfile,
  type MemberProfileItem,
  type CreateMemberProfileBody
} from "@/api/srvf-member-profile";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

/**
 * 档案各字典字段 → 字典 typeCode 映射（与后端 `/api/docs-json` 字段描述逐项核对一致）。
 * 单选字段直接经 `dict.label` 翻中文；两个多选数组（exerciseMethods / firstAidSkills）
 * 的 typeCode 为单数 `exercise_method` / `first_aid_skill`（docs-json 字段描述明示）。
 * 这 14 个类型读 / 写共用：读 → label 回显；写 → 下拉 options（T2 表单）。
 */
export const PROFILE_DICT_TYPES = [
  "gender",
  "document_type",
  "join_source",
  "ethnicity",
  "political_status",
  "marital_status",
  "education",
  "work_nature",
  "blood_type",
  "exercise_frequency",
  "exercise_sport",
  "first_aid_knowledge",
  "exercise_method",
  "first_aid_skill"
] as const;

/** 档案只读展示行（label + 已解析中文 value；span 控制 el-descriptions 跨列） */
export type ProfileDisplayRow = { label: string; value: string; span?: number };

/**
 * 队员扩展档案（1:1 子资源：本轮 = 读 + 字典翻译展示；新建 / 编辑见 T2）。
 *
 * @param externalMemberId 档案隶属队员 id（必传，来自队员作战室路由参数）。
 *   作战室是唯一消费方（不开独立菜单页 / 不放队员下拉），故固定该队员、无页内下拉。
 *
 * 敏感字段（证件号 / 手机 / 身高体重等）按后端返回原样展示；可见级由后端 RBAC 裁决，
 * 前端不前端定义敏感字段可见级。无档案（`data: null`）→ 渲染空态（非「请先选择」）。
 */
export function useMemberProfile(externalMemberId: string) {
  /** 读 / 写权限（后端真实 RBAC 码）；canCreate / canUpdate 供作战室按钮门（按钮在 T2 接入） */
  const canRead = hasPerms("member-profile.read.record");
  const canCreate = hasPerms("member-profile.create.record");
  const canUpdate = hasPerms("member-profile.update.record");

  /** 共享字典：14 个档案字典类型预热（读回显 + T2 下拉共用；查不到 / 无权 → 退化原 code） */
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes([...PROFILE_DICT_TYPES]);

  /** 隶属队员 id：由作战室经路由参数注入并固定 */
  const memberId = ref<string>(externalMemberId);
  /** 当前档案（无档案 → null） */
  const profile = ref<MemberProfileItem | null>(null);
  const loading = ref(false);
  const formRef = ref();

  /* ----------------------------- 展示格式化助手 ----------------------------- */
  const txt = (v: string | null | undefined) => (v ? v : "—");
  const bool = (v: boolean | null | undefined) =>
    v === null || v === undefined ? "—" : v ? "是" : "否";
  const num = (v: number | null | undefined, unit: string) =>
    v === null || v === undefined ? "—" : `${v} ${unit}`;
  const date = (v: string | null | undefined) =>
    v ? dayjs(v).format("YYYY-MM-DD") : "—";
  const datetime = (v: string | null | undefined) =>
    v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "—";
  /** 单选字典 code → 中文（空 → 「—」；查不到 → 原 code） */
  const d = (type: string, code: string | null | undefined) =>
    dict.label(type, code);
  /** 多选字典 codes → 中文，顿号连接（空数组 → 「—」） */
  const dArr = (type: string, codes: string[] | null | undefined) => {
    const list = (codes ?? []).map(c => dict.label(type, c));
    return list.length ? list.join("、") : "—";
  };

  /**
   * 只读展示行（读响应式 `profile` + `dict.byType`，字典异步加载完成后自动重渲染）。
   * 顺序与 T2 表单分区一致：必填身份 → 个人 → 工作居住 → 联系 → 身体 → 车辆 → 运动急救 → 声明其它 → 元信息。
   * 不含 medicalNotes（本轮排除）。
   */
  const displayRows = computed<ProfileDisplayRow[]>(() => {
    const p = profile.value;
    if (!p) return [];
    return [
      // 必填身份
      { label: "真实姓名", value: txt(p.realName) },
      { label: "性别", value: d("gender", p.genderCode) },
      { label: "出生日期", value: date(p.birthDate) },
      { label: "证件类型", value: d("document_type", p.documentTypeCode) },
      { label: "证件号", value: txt(p.documentNumber) },
      { label: "本人手机", value: txt(p.mobile) },
      { label: "邮箱", value: txt(p.email) },
      { label: "加入日期", value: date(p.joinedDate) },
      { label: "加入来源", value: d("join_source", p.joinSourceCode) },
      { label: "隐私授权", value: bool(p.privacyConsentSigned) },
      // 个人
      { label: "民族", value: d("ethnicity", p.ethnicityCode) },
      {
        label: "政治面貌",
        value: d("political_status", p.politicalStatusCode)
      },
      { label: "退伍军人", value: bool(p.isVeteran) },
      { label: "婚姻状况", value: d("marital_status", p.maritalStatusCode) },
      { label: "学历", value: d("education", p.educationCode) },
      { label: "专业", value: txt(p.major) },
      // 工作 / 居住
      { label: "工作性质", value: d("work_nature", p.workNatureCode) },
      { label: "居住区", value: txt(p.residenceArea) },
      { label: "工作区", value: txt(p.workArea) },
      // 联系
      { label: "座机", value: txt(p.landline) },
      { label: "QQ", value: txt(p.qq) },
      { label: "微信", value: txt(p.wechat) },
      // 身体（高敏感医疗）
      { label: "身高", value: num(p.heightCm, "cm") },
      { label: "体重", value: num(p.weightKg, "kg") },
      { label: "血型", value: d("blood_type", p.bloodTypeCode) },
      { label: "视力", value: txt(p.eyesight) },
      // 车辆
      { label: "拥有车辆", value: bool(p.hasVehicle) },
      { label: "车辆类型", value: txt(p.vehicleType) },
      // 运动 / 急救
      {
        label: "运动频率",
        value: d("exercise_frequency", p.exerciseFrequencyCode)
      },
      { label: "主运动项目", value: d("exercise_sport", p.exerciseSportCode) },
      { label: "运动方式", value: dArr("exercise_method", p.exerciseMethods) },
      {
        label: "急救知识等级",
        value: d("first_aid_knowledge", p.firstAidKnowledgeCode)
      },
      { label: "急救技能", value: dArr("first_aid_skill", p.firstAidSkills) },
      { label: "其他特长", value: txt(p.otherSkills), span: 2 },
      // 声明 / 其它
      { label: "无犯罪声明", value: bool(p.noCriminalRecordSigned) },
      { label: "隐私授权时间", value: datetime(p.privacyConsentSignedAt) },
      { label: "义工号", value: txt(p.volunteerNo) },
      // 元信息
      { label: "建档时间", value: datetime(p.createdAt) },
      { label: "更新时间", value: datetime(p.updatedAt) }
    ];
  });

  /**
   * 由表单模型组装提交体：必填 10 项恒发；可选布尔（switch 恒有值）恒发；
   * 可选文本 / 字典 / 数字 / 多选数组仅在有值时发——避免编辑时把空值写回覆盖后端
   * （与活动 / 紧急联系人范式一致）。medicalNotes 本轮不组装、不提交。
   */
  function buildBody(m: ProfileFormModel): CreateMemberProfileBody {
    return {
      // 必填 10
      realName: m.realName,
      genderCode: m.genderCode,
      birthDate: m.birthDate,
      documentTypeCode: m.documentTypeCode,
      documentNumber: m.documentNumber,
      mobile: m.mobile,
      email: m.email,
      joinedDate: m.joinedDate,
      joinSourceCode: m.joinSourceCode,
      privacyConsentSigned: m.privacyConsentSigned,
      // 可选布尔（switch 恒有值，整表确认提交）
      isVeteran: m.isVeteran,
      hasVehicle: m.hasVehicle,
      noCriminalRecordSigned: m.noCriminalRecordSigned,
      // 可选数字（仅有值时发）
      ...(typeof m.heightCm === "number" ? { heightCm: m.heightCm } : {}),
      ...(typeof m.weightKg === "number" ? { weightKg: m.weightKg } : {}),
      // 可选多选数组（仅非空时发）
      ...(m.exerciseMethods.length
        ? { exerciseMethods: m.exerciseMethods }
        : {}),
      ...(m.firstAidSkills.length ? { firstAidSkills: m.firstAidSkills } : {}),
      // 可选文本 / 字典（仅非空时发）
      ...(m.ethnicityCode ? { ethnicityCode: m.ethnicityCode } : {}),
      ...(m.politicalStatusCode
        ? { politicalStatusCode: m.politicalStatusCode }
        : {}),
      ...(m.maritalStatusCode
        ? { maritalStatusCode: m.maritalStatusCode }
        : {}),
      ...(m.educationCode ? { educationCode: m.educationCode } : {}),
      ...(m.major ? { major: m.major } : {}),
      ...(m.workNatureCode ? { workNatureCode: m.workNatureCode } : {}),
      ...(m.residenceArea ? { residenceArea: m.residenceArea } : {}),
      ...(m.workArea ? { workArea: m.workArea } : {}),
      ...(m.landline ? { landline: m.landline } : {}),
      ...(m.qq ? { qq: m.qq } : {}),
      ...(m.wechat ? { wechat: m.wechat } : {}),
      ...(m.bloodTypeCode ? { bloodTypeCode: m.bloodTypeCode } : {}),
      ...(m.eyesight ? { eyesight: m.eyesight } : {}),
      ...(m.vehicleType ? { vehicleType: m.vehicleType } : {}),
      ...(m.exerciseFrequencyCode
        ? { exerciseFrequencyCode: m.exerciseFrequencyCode }
        : {}),
      ...(m.exerciseSportCode
        ? { exerciseSportCode: m.exerciseSportCode }
        : {}),
      ...(m.firstAidKnowledgeCode
        ? { firstAidKnowledgeCode: m.firstAidKnowledgeCode }
        : {}),
      ...(m.otherSkills ? { otherSkills: m.otherSkills } : {}),
      ...(m.privacyConsentSignedAt
        ? { privacyConsentSignedAt: m.privacyConsentSignedAt }
        : {}),
      ...(m.volunteerNo ? { volunteerNo: m.volunteerNo } : {})
    };
  }

  /**
   * 新建 / 编辑档案弹窗（memberId 由作战室固定；编辑按读响应字段回填，日期归一为选择器格式）。
   * 14 字典先 `ensureTypes` 确保下拉就绪后再开弹窗（查不到 → 单选退化文本 / 多选退化 allow-create）。
   */
  async function openDialog(
    title: "新建" | "编辑",
    current?: MemberProfileItem
  ) {
    if (!memberId.value) return;
    await dict.ensureTypes([...PROFILE_DICT_TYPES]);
    const dictOptions: Record<string, { label: string; value: string }[]> = {};
    for (const t of PROFILE_DICT_TYPES) dictOptions[t] = dict.options(t);
    const isEdit = title === "编辑";
    addDialog({
      title: `${title}队员档案`,
      width: "60%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          realName: current?.realName ?? "",
          genderCode: current?.genderCode ?? "",
          birthDate: current?.birthDate
            ? dayjs(current.birthDate).format("YYYY-MM-DD")
            : "",
          documentTypeCode: current?.documentTypeCode ?? "",
          documentNumber: current?.documentNumber ?? "",
          mobile: current?.mobile ?? "",
          email: current?.email ?? "",
          joinedDate: current?.joinedDate
            ? dayjs(current.joinedDate).format("YYYY-MM-DD")
            : "",
          joinSourceCode: current?.joinSourceCode ?? "",
          privacyConsentSigned: current?.privacyConsentSigned ?? false,
          ethnicityCode: current?.ethnicityCode ?? "",
          politicalStatusCode: current?.politicalStatusCode ?? "",
          isVeteran: current?.isVeteran ?? false,
          maritalStatusCode: current?.maritalStatusCode ?? "",
          educationCode: current?.educationCode ?? "",
          major: current?.major ?? "",
          workNatureCode: current?.workNatureCode ?? "",
          residenceArea: current?.residenceArea ?? "",
          workArea: current?.workArea ?? "",
          landline: current?.landline ?? "",
          qq: current?.qq ?? "",
          wechat: current?.wechat ?? "",
          heightCm: current?.heightCm ?? undefined,
          weightKg: current?.weightKg ?? undefined,
          bloodTypeCode: current?.bloodTypeCode ?? "",
          eyesight: current?.eyesight ?? "",
          hasVehicle: current?.hasVehicle ?? false,
          vehicleType: current?.vehicleType ?? "",
          exerciseFrequencyCode: current?.exerciseFrequencyCode ?? "",
          exerciseSportCode: current?.exerciseSportCode ?? "",
          exerciseMethods: current?.exerciseMethods ?? [],
          firstAidKnowledgeCode: current?.firstAidKnowledgeCode ?? "",
          firstAidSkills: current?.firstAidSkills ?? [],
          otherSkills: current?.otherSkills ?? "",
          noCriminalRecordSigned: current?.noCriminalRecordSigned ?? false,
          privacyConsentSignedAt: current?.privacyConsentSignedAt
            ? dayjs(current.privacyConsentSignedAt).format(
                "YYYY-MM-DDTHH:mm:ss"
              )
            : "",
          volunteerNo: current?.volunteerNo ?? ""
        } as ProfileFormModel,
        dictOptions
      },
      contentRenderer: () => h(ProfileForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const formComp = formRef.value;
        const curData = options.props.formInline as ProfileFormModel;
        formComp.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit) {
              await updateMemberProfile(memberId.value, buildBody(curData));
              message("修改成功", { type: "success" });
            } else {
              await createMemberProfile(memberId.value, buildBody(curData));
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

  /** 读当前档案（无 canRead / 无 memberId → 空，不请求；无档案 → data:null → 空态） */
  async function onSearch() {
    if (!canRead || !memberId.value) {
      profile.value = null;
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getMemberProfile(memberId.value);
      if (code === 0) profile.value = data;
    } catch (error: any) {
      message(bizErrorMessage(error, "加载队员档案失败"), {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  return {
    canRead,
    canCreate,
    canUpdate,
    loading,
    profile,
    displayRows,
    onSearch,
    openDialog
  };
}
