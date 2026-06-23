import { http } from "@/utils/http";

/** 后端统一成功信封（失败为 HTTP 4xx，axios reject） */
type Envelope<T> = { code: number; message: string; data: T };

/**
 * 队员紧急联系人列表项（后端 `EmergencyContactResponseDto`）。字段以 live `/api/docs-json` 为准。
 * `relationCode` 是后端字典 `emergency_relation` 的 code（前端经 srvfDict 翻中文，不臆造枚举）。
 * `contactName` / `phonePrimary` 为高敏感字段，按后端返回原样展示。
 */
export type EmergencyContactItem = {
  /** 主键（cuid） */
  id: string;
  /** 关联队员外键（members.id；N:1） */
  memberId: string;
  /** 联系人姓名（高敏感） */
  contactName: string;
  /** 关系字典 code（字典 emergency_relation） */
  relationCode: string;
  /** 联系人主电话（高敏感） */
  phonePrimary: string;
  /** 联系人备用电话（可空） */
  phoneBackup: string | null;
  /** 联系人地址（可空） */
  address: string | null;
  /** 优先级（0 = 最高；允许并列） */
  priority: number;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
};

/**
 * 某队员的紧急联系人列表（**无分页**，按 priority ASC / createdAt ASC，软删过滤）。
 * `GET /api/admin/v1/members/{memberId}/emergency-contacts`
 * （rbac: `emergency-contact.read.record`）。
 */
export const getMemberEmergencyContacts = (memberId: string) =>
  http.request<Envelope<EmergencyContactItem[]>>(
    "get",
    `/api/admin/v1/members/${memberId}/emergency-contacts`
  );

/* ----------------------------- 紧急联系人 写操作 ----------------------------- */

/**
 * 新增紧急联系人入参（后端 `CreateEmergencyContactDto`；字段以 `/api/docs-json` 为准）。
 * 必填 `contactName`(≤64) / `relationCode`(≤64) / `phonePrimary`(≤32)；
 * 可选 `phoneBackup`(≤32) / `address`(≤256) / `priority`(number，默认 0)。
 */
export type CreateEmergencyContactBody = {
  /** 联系人姓名（必填；≤ 64） */
  contactName: string;
  /** 关系字典 code（必填；≤ 64；字典 emergency_relation） */
  relationCode: string;
  /** 联系人主电话（必填；≤ 32；高敏感，后端弱校验） */
  phonePrimary: string;
  /** 联系人备用电话（可选；≤ 32） */
  phoneBackup?: string;
  /** 联系人地址（可选；≤ 256） */
  address?: string;
  /** 优先级（可选；0 = 最高；默认 0） */
  priority?: number;
};

/**
 * 部分更新紧急联系人入参（后端 `UpdateEmergencyContactDto`；全字段 optional）。
 * 后端**禁止** memberId / id 入参，故前端只提交资料字段。
 */
export type UpdateEmergencyContactBody = Partial<CreateEmergencyContactBody>;

/** 写操作返回单条（200 body 契约按既有约定回 `EmergencyContactItem`，前端不消费返回值）。 */
export type EmergencyContactMutationResult = Envelope<EmergencyContactItem>;

/**
 * 新增紧急联系人 `POST /api/admin/v1/members/{memberId}/emergency-contacts`
 * （rbac: `emergency-contact.create.record`）。队员不存在 404 / 字典 code 非法等 → 弹其 message。
 */
export const createMemberEmergencyContact = (
  memberId: string,
  body: CreateEmergencyContactBody
) =>
  http.request<EmergencyContactMutationResult>(
    "post",
    `/api/admin/v1/members/${memberId}/emergency-contacts`,
    { data: body }
  );

/**
 * 部分更新紧急联系人 `PATCH .../emergency-contacts/{id}`
 * （rbac: `emergency-contact.update.record`）。仅资料字段（不含 memberId / id）；
 * 后端拒绝非法值时 → 弹其 message。
 */
export const updateMemberEmergencyContact = (
  memberId: string,
  id: string,
  body: UpdateEmergencyContactBody
) =>
  http.request<EmergencyContactMutationResult>(
    "patch",
    `/api/admin/v1/members/${memberId}/emergency-contacts/${id}`,
    { data: body }
  );

/**
 * 软删紧急联系人 `DELETE .../emergency-contacts/{id}`
 * （rbac: `emergency-contact.delete.record`）。写 deletedAt，不物理删除。
 */
export const deleteMemberEmergencyContact = (memberId: string, id: string) =>
  http.request<Envelope<EmergencyContactItem | null>>(
    "delete",
    `/api/admin/v1/members/${memberId}/emergency-contacts/${id}`
  );
