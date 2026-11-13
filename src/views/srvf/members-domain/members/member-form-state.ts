import type {
  CreateMemberBody,
  MemberItem,
  UpdateMemberBody
} from "@/api/srvf-member";

export type MemberFormModel = {
  isEdit: boolean;
  isSaving?: boolean;
  memberNo: string;
  realName: string;
  nickname: string;
  memberSinceDate: string;
  memberOriginCode: string;
  gradeCode: string;
};

type MemberField = Exclude<keyof MemberFormModel, "isEdit" | "isSaving">;

/** Shared by the visible field rules and the payload boundary. */
export function memberFieldError(
  field: MemberField,
  rawValue: unknown
): string {
  const value = typeof rawValue === "string" ? rawValue : "";
  if (field === "memberNo") {
    if (!value) return "请输入队员编号";
    return /^[A-Za-z0-9-]{1,32}$/.test(value)
      ? ""
      : "编号须为 1–32 位字母、数字或连字符";
  }
  if (field === "memberSinceDate") {
    if (!value) return "请选择发号日";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "请选择有效的发号日";
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
      ? ""
      : "请选择有效的发号日";
  }
  const label = {
    realName: "真实姓名",
    nickname: "昵称",
    memberOriginCode: "来源代码",
    gradeCode: "等级代码"
  }[field];
  if (!value.trim()) {
    if (field === "realName" || field === "memberOriginCode")
      return `请输入${label}`;
    return value ? `${label}不能只包含空白` : "";
  }
  return value.length <= 64 ? "" : `${label}不能超过 64 个字符`;
}

type Result<T> = { ok: true; body: T } | { ok: false; message: string };

export function createMemberPayload(
  form: MemberFormModel
): Result<CreateMemberBody> {
  for (const field of [
    "memberNo",
    "realName",
    "nickname",
    "memberSinceDate",
    "memberOriginCode",
    "gradeCode"
  ] as const) {
    const error = memberFieldError(field, form[field]);
    if (error) return { ok: false, message: error };
  }
  return {
    ok: true,
    body: {
      memberNo: form.memberNo,
      realName: form.realName,
      memberSinceDate: form.memberSinceDate,
      memberOriginCode: form.memberOriginCode,
      ...(form.nickname ? { nickname: form.nickname } : {}),
      ...(form.gradeCode ? { gradeCode: form.gradeCode } : {})
    }
  };
}

export function updateMemberPayload(
  form: MemberFormModel,
  original: MemberItem
): Result<UpdateMemberBody> {
  for (const field of ["realName", "nickname", "gradeCode"] as const) {
    const error = memberFieldError(field, form[field]);
    if (error) return { ok: false, message: error };
  }
  const nickname = typeof form.nickname === "string" ? form.nickname : "";
  const gradeCode = typeof form.gradeCode === "string" ? form.gradeCode : "";
  if (original.gradeCode && !gradeCode)
    return {
      ok: false,
      message: "当前接口不支持清空等级，请保留或选择其他等级"
    };
  return {
    ok: true,
    body: {
      realName: form.realName,
      ...(nickname !== (original.nickname ?? "")
        ? { nickname: nickname || null }
        : {}),
      ...(gradeCode && gradeCode !== original.gradeCode ? { gradeCode } : {})
    }
  };
}

/** A lost response can follow a committed write; do not tell the user it failed. */
export function memberSaveError(error: unknown, isEdit: boolean): string {
  const response = (
    error as { response?: { status?: number; data?: { message?: unknown } } }
  )?.response;
  const action = isEdit ? "修改" : "新建";
  const verify = isEdit ? "重新读取队员" : "先按编号查询";
  if (!response) return `${action}结果未确认：网络异常，请${verify}后再重试。`;
  if (response.status && response.status >= 500)
    return `${action}结果未确认：服务异常，请${verify}后再重试。`;
  if (response.status === 403) return `没有权限${action}队员，请联系管理员。`;
  const raw = response.data?.message;
  if (typeof raw === "string" && raw.trim()) return raw;
  if (Array.isArray(raw)) {
    const details = raw.filter(
      (item): item is string => typeof item === "string" && !!item.trim()
    );
    if (details.length) return details.join("；");
  }
  return `${action}未完成，请核对输入或联系管理员。`;
}

type MemberSaveResponse = {
  code: number;
  message: string;
  data?: { id?: string; memberNo?: string } | null;
};
type MemberSavePorts = {
  create: (body: CreateMemberBody) => Promise<MemberSaveResponse>;
  update: (id: string, body: UpdateMemberBody) => Promise<MemberSaveResponse>;
};

/** One dialog may validate or save only one submission at a time. */
export function createMemberSaveGate() {
  let inFlight = false;
  let confirmed = false;
  return async (
    work: (confirm: () => void) => Promise<void>
  ): Promise<boolean> => {
    if (inFlight || confirmed) return false;
    inFlight = true;
    try {
      await work(() => {
        confirmed = true;
      });
      return true;
    } finally {
      inFlight = false;
    }
  };
}

/** Validate before sending, perform one write, and trust only code 0 as success. */
export async function saveMemberForm(
  form: MemberFormModel,
  original: MemberItem | undefined,
  ports: MemberSavePorts
): Promise<{ ok: true } | { ok: false; message: string }> {
  let request: () => Promise<MemberSaveResponse>;
  const isEdit = form.isEdit;
  let expectedMemberNo: string | undefined;
  const expectedId = original?.id;
  if (isEdit) {
    if (!original)
      return { ok: false, message: "无法确定要编辑的队员，请重新打开。" };
    const payload = updateMemberPayload(form, original);
    if (!payload.ok) return payload;
    request = () => ports.update(original.id, payload.body);
  } else {
    const payload = createMemberPayload(form);
    if (!payload.ok) return payload;
    expectedMemberNo = payload.body.memberNo;
    request = () => ports.create(payload.body);
  }
  try {
    const result = await request();
    if (result?.code !== 0)
      return {
        ok: false,
        message: result?.message || "保存未获确认，请先查询后再重试。"
      };
    if (
      !result.data?.id ||
      (isEdit && result.data.id !== expectedId) ||
      (!isEdit && result.data.memberNo !== expectedMemberNo)
    )
      return {
        ok: false,
        message: isEdit
          ? "修改响应无法核对，请重新读取队员后再操作。"
          : "新建响应无法核对，请先按编号查询后再操作。"
      };
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, message: memberSaveError(error, isEdit) };
  }
}
