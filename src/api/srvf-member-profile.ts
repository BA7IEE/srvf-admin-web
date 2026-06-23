import { http } from "@/utils/http";

/** 后端统一成功信封（失败为 HTTP 4xx，axios reject） */
type Envelope<T> = { code: number; message: string; data: T };

/**
 * 过往病史元素（后端 `MedicalNoteItemDto` = `{ categoryCode, note? }`，高敏感医疗）。
 * **本轮（3b）不放进表单 / 不提交**——仅在读响应类型里保留，留作后续迭代；列表展示也暂不渲染。
 */
export type MedicalNoteItem = {
  /** 病史分类字典 code（必填） */
  categoryCode: string;
  /** 备注（可空） */
  note?: string | null;
};

/**
 * 队员扩展档案（后端 `MemberProfileResponseDto`；**1:1 子资源**，无则 GET 返 `data: null`）。
 * 字段以 live `/api/docs-json` 为准，勿前端臆造。可选字段后端以 `null` 表「未填」。
 * 多处字段为高敏感（证件号 / 手机 / 医疗身高体重病史）——前端按后端返回原样展示，
 * 可见级由后端 RBAC 裁决（前端不前端定义敏感字段可见级）。
 */
export type MemberProfileItem = {
  /** 主键（cuid） */
  id: string;
  /** 关联队员外键（members.id；1:1） */
  memberId: string;
  /* ---- 必填身份（CreateMemberProfileDto 必填 10 项的对应回显） ---- */
  /** 真实姓名（高敏感） */
  realName: string;
  /** 性别字典 code（字典 gender） */
  genderCode: string;
  /** 出生日期（ISO 8601） */
  birthDate: string;
  /** 证件类型字典 code（字典 document_type） */
  documentTypeCode: string;
  /** 证件号（高敏感） */
  documentNumber: string;
  /** 本人手机（高敏感） */
  mobile: string;
  /** 邮箱 */
  email: string;
  /** 加入日期（ISO 8601） */
  joinedDate: string;
  /** 加入来源字典 code（字典 join_source） */
  joinSourceCode: string;
  /** 是否授权个人信息使用 */
  privacyConsentSigned: boolean;
  /* ---- 可选个人 ---- */
  /** 民族字典 code（字典 ethnicity；可空） */
  ethnicityCode: string | null;
  /** 政治面貌字典 code（字典 political_status；可空） */
  politicalStatusCode: string | null;
  /** 是否退伍军人（可空） */
  isVeteran: boolean | null;
  /** 婚姻状况字典 code（字典 marital_status；可空） */
  maritalStatusCode: string | null;
  /** 学历字典 code（字典 education；可空） */
  educationCode: string | null;
  /** 所学专业（自由文本；可空） */
  major: string | null;
  /** 工作性质字典 code（字典 work_nature；只存性质不存单位；可空） */
  workNatureCode: string | null;
  /** 居住区行政区粒度（可空） */
  residenceArea: string | null;
  /** 工作区行政区粒度（可空） */
  workArea: string | null;
  /* ---- 可选联系 ---- */
  /** 座机（可空） */
  landline: string | null;
  /** QQ（可空） */
  qq: string | null;
  /** 微信（可空） */
  wechat: string | null;
  /* ---- 可选身体（高敏感医疗） ---- */
  /** 身高 cm（可空） */
  heightCm: number | null;
  /** 体重 kg（可空） */
  weightKg: number | null;
  /** 血型字典 code（字典 blood_type；可空） */
  bloodTypeCode: string | null;
  /** 视力（自由文本；可空） */
  eyesight: string | null;
  /** 过往病史（高敏感医疗；本轮不编辑，仅类型保留） */
  medicalNotes: MedicalNoteItem[] | null;
  /* ---- 可选车辆 ---- */
  /** 是否拥有车辆（可空） */
  hasVehicle: boolean | null;
  /** 车辆类型（hasVehicle=true 时填；可空） */
  vehicleType: string | null;
  /* ---- 可选运动 / 急救 ---- */
  /** 运动频率字典 code（字典 exercise_frequency；可空） */
  exerciseFrequencyCode: string | null;
  /** 主运动项目字典 code（字典 exercise_sport；可空） */
  exerciseSportCode: string | null;
  /** 运动方式 codes（字典 exercise_method；多选；后端恒返数组，可空数组） */
  exerciseMethods: string[];
  /** 急救知识等级字典 code（字典 first_aid_knowledge；可空） */
  firstAidKnowledgeCode: string | null;
  /** 急救技能 codes（字典 first_aid_skill；多选；后端恒返数组，可空数组） */
  firstAidSkills: string[];
  /** 其他特长（长文本；可空） */
  otherSkills: string | null;
  /* ---- 可选声明 / 其它 ---- */
  /** 是否签署无违法犯罪声明（可空） */
  noCriminalRecordSigned: boolean | null;
  /** 隐私授权时间（ISO 8601；可空） */
  privacyConsentSignedAt: string | null;
  /** 义工号（不参与登录 / 权限 / 身份识别；可空） */
  volunteerNo: string | null;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
};

/**
 * 查队员扩展档案 `GET /api/admin/v1/members/{memberId}/profile`
 * （rbac: `member-profile.read.record`）。**无档案 → `data: null`**（前端据此渲染空态）。
 */
export const getMemberProfile = (memberId: string) =>
  http.request<Envelope<MemberProfileItem | null>>(
    "get",
    `/api/admin/v1/members/${memberId}/profile`
  );

/* ----------------------------- 档案 写操作 ----------------------------- */

/**
 * 新建队员档案入参（后端 `CreateMemberProfileDto`；字段以 `/api/docs-json` 为准）。
 * **本轮（3b）= Create DTO 全字段减 medicalNotes**（共 37：必填 10 + 可选 27）。
 * medicalNotes（高敏感医疗嵌套数组）本轮不提交，故此处不含——PATCH 不发 = 后端保留原值。
 * 字典 code 字段非法 / 校验失败由后端裁决并回 message，前端不复刻校验。
 */
export type CreateMemberProfileBody = {
  /* 必填 10 */
  /** 真实姓名（必填；≤ 64） */
  realName: string;
  /** 性别字典 code（必填；字典 gender） */
  genderCode: string;
  /** 出生日期（必填；ISO 8601） */
  birthDate: string;
  /** 证件类型字典 code（必填；字典 document_type） */
  documentTypeCode: string;
  /** 证件号（必填；≤ 64；高敏感） */
  documentNumber: string;
  /** 本人手机（必填；≤ 32；高敏感） */
  mobile: string;
  /** 邮箱（必填；≤ 256） */
  email: string;
  /** 加入日期（必填；ISO 8601） */
  joinedDate: string;
  /** 加入来源字典 code（必填；字典 join_source） */
  joinSourceCode: string;
  /** 是否授权个人信息使用（必填） */
  privacyConsentSigned: boolean;
  /* 可选 27（medicalNotes 除外） */
  /** 民族字典 code（字典 ethnicity；≤ 64） */
  ethnicityCode?: string;
  /** 政治面貌字典 code（字典 political_status；≤ 64） */
  politicalStatusCode?: string;
  /** 是否退伍军人 */
  isVeteran?: boolean;
  /** 婚姻状况字典 code（字典 marital_status；≤ 64） */
  maritalStatusCode?: string;
  /** 学历字典 code（字典 education；≤ 64） */
  educationCode?: string;
  /** 所学专业（自由文本；≤ 128） */
  major?: string;
  /** 工作性质字典 code（字典 work_nature；≤ 64） */
  workNatureCode?: string;
  /** 居住区行政区粒度（≤ 64） */
  residenceArea?: string;
  /** 工作区行政区粒度（≤ 64） */
  workArea?: string;
  /** 座机（≤ 32） */
  landline?: string;
  /** QQ（≤ 32） */
  qq?: string;
  /** 微信（≤ 64） */
  wechat?: string;
  /** 身高 cm（高敏感医疗） */
  heightCm?: number;
  /** 体重 kg（高敏感医疗） */
  weightKg?: number;
  /** 血型字典 code（字典 blood_type；≤ 64） */
  bloodTypeCode?: string;
  /** 视力（自由文本；≤ 32） */
  eyesight?: string;
  /** 是否拥有车辆 */
  hasVehicle?: boolean;
  /** 车辆类型（hasVehicle=true 时填；≤ 64） */
  vehicleType?: string;
  /** 运动频率字典 code（字典 exercise_frequency；≤ 64） */
  exerciseFrequencyCode?: string;
  /** 主运动项目字典 code（字典 exercise_sport；≤ 64） */
  exerciseSportCode?: string;
  /** 运动方式 codes（字典 exercise_method；每元素 1-64；数组上限 20） */
  exerciseMethods?: string[];
  /** 急救知识等级字典 code（字典 first_aid_knowledge；≤ 64） */
  firstAidKnowledgeCode?: string;
  /** 急救技能 codes（字典 first_aid_skill） */
  firstAidSkills?: string[];
  /** 其他特长（长文本；≤ 2000） */
  otherSkills?: string;
  /** 是否签署无违法犯罪声明 */
  noCriminalRecordSigned?: boolean;
  /** 隐私授权时间（ISO 8601） */
  privacyConsentSignedAt?: string;
  /** 义工号（不参与登录 / 权限 / 身份识别；≤ 32） */
  volunteerNo?: string;
};

/**
 * 部分更新队员档案入参（后端 `UpdateMemberProfileDto`；全字段 optional）。
 * 后端**禁止** id / memberId / 系统字段入参；本轮同样不提交 medicalNotes。
 */
export type UpdateMemberProfileBody = Partial<CreateMemberProfileBody>;

/** 写操作返回单条档案（前端不消费返回值，统一回读 onSearch 刷新）。 */
export type MemberProfileMutationResult = Envelope<MemberProfileItem>;

/**
 * 新建队员档案 `POST /api/admin/v1/members/{memberId}/profile`
 * （rbac: `member-profile.create.record`）。1:1——**重复创建 → MEMBER_PROFILE_ALREADY_EXISTS**
 * （前端弹其 message）；字典 code 非法 / 必填缺失等 → 同样弹后端 message。
 */
export const createMemberProfile = (
  memberId: string,
  body: CreateMemberProfileBody
) =>
  http.request<MemberProfileMutationResult>(
    "post",
    `/api/admin/v1/members/${memberId}/profile`,
    { data: body }
  );

/**
 * 部分更新队员档案 `PATCH /api/admin/v1/members/{memberId}/profile`
 * （rbac: `member-profile.update.record`）。仅资料字段（不含 id / memberId / 系统字段 / medicalNotes）；
 * 后端拒绝非法值时 → 弹其 message（前端不复刻校验）。
 */
export const updateMemberProfile = (
  memberId: string,
  body: UpdateMemberProfileBody
) =>
  http.request<MemberProfileMutationResult>(
    "patch",
    `/api/admin/v1/members/${memberId}/profile`,
    { data: body }
  );
