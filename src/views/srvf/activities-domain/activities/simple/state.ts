import type {
  AdminCreateSimpleActivityDto,
  AdminSaveSimpleActivityDto,
  AdminSimpleActivityPlaceDto,
  AdminSimpleDraftResponseDto
} from "@/api/srvf-simple-activity";

export const activityListPath = "/srvf/activities-domain/activities";
export const simpleDraftPath = (id: string) =>
  `${activityListPath}/${encodeURIComponent(id)}/simple-draft`;

export const visibilityOptions = [
  { value: "public", label: "公开可见" },
  { value: "accepted", label: "录取后可见" },
  { value: "staff", label: "工作人员可见" },
  { value: "command", label: "指挥人员可见" }
] as const;

export const roleLabels: Record<
  AdminSimpleActivityPlaceDto["roleCode"],
  string
> = {
  primary: "主地点",
  meeting: "集合地点",
  execution: "执行地点",
  evacuation: "撤离地点",
  parking: "停车地点",
  other: "其他地点"
};

export function statusLabel(code: string) {
  const labels: Record<string, string> = {
    draft: "草稿",
    published: "已发布",
    completed: "已完结",
    cancelled: "已取消",
    terminated: "已终止"
  };
  return labels[code] ?? code;
}

export function reviewLabel(review: AdminSimpleDraftResponseDto["review"]) {
  if (!review) return "尚未提交审核";
  const labels = {
    pending: "审核中",
    approved: "审核已通过",
    returned: "审核已退回",
    withdrawn: "审核已撤回",
    cancelled: "审核已取消"
  };
  return labels[review.status];
}

/** Inputs are explicit Beijing wall time; never interpret in the browser timezone. */
export function beijingInput(iso: string | null) {
  return iso
    ? new Date(Date.parse(iso) + 8 * 3600_000).toISOString().slice(0, 23)
    : "";
}
export function beijingIso(input: string) {
  return new Date(`${input}+08:00`).toISOString();
}
export function displayTime(iso: string | null) {
  return iso ? beijingInput(iso).slice(0, 16).replace("T", " ") : "未设置";
}

export function timeProblem(start: string, end: string, deadline = "") {
  if (!start || !end) return "请填写开始和结束时间";
  const a = Date.parse(`${start}+08:00`),
    b = Date.parse(`${end}+08:00`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return "请填写有效时间";
  if (b <= a) return "结束时间须晚于开始时间";
  if (start.slice(0, 10) !== end.slice(0, 10))
    return "常规单场次活动须在北京时间同一天开始和结束";
  if (
    deadline &&
    (!Number.isFinite(Date.parse(`${deadline}+08:00`)) ||
      Date.parse(`${deadline}+08:00`) > b)
  )
    return "报名截止时间不能晚于活动结束";
  return "";
}

export type DraftFields = {
  title: string;
  startAt: string;
  endAt: string;
  location: string;
  capacity: number | null;
  registrationDeadline: string;
  description: string;
  registrationNotes: string;
};

export function fieldsFromDraft(
  draft: AdminSimpleDraftResponseDto
): DraftFields {
  return {
    title: draft.title,
    startAt: beijingInput(draft.startAt),
    endAt: beijingInput(draft.endAt),
    location: draft.location,
    capacity: draft.instance.capacity,
    registrationDeadline: beijingInput(draft.instance.registrationDeadline),
    description: draft.instance.description ?? "",
    registrationNotes: draft.instance.registrationNotes ?? ""
  };
}

export function canEditTextPlace(draft: AdminSimpleDraftResponseDto) {
  const primary = draft.places.find(p => p.roleCode === "primary")?.inline;
  return (
    !!primary &&
    !primary.coordinate &&
    !primary.providerCode &&
    !primary.providerPlaceId
  );
}

/** Full snapshot: retain every place role, coordinates, policy facts and nulls. */
export function saveBody(
  draft: AdminSimpleDraftResponseDto,
  fields: DraftFields
): AdminSaveSimpleActivityDto {
  const places: AdminSimpleActivityPlaceDto[] = JSON.parse(
    JSON.stringify(draft.places)
  );
  const location = canEditTextPlace(draft)
    ? fields.location.trim()
    : draft.location;
  const primary = places.find(p => p.roleCode === "primary")?.inline;
  if (primary && location !== draft.location) {
    if (primary.name === primary.addressText) primary.name = location;
    primary.addressText = location;
  }
  return {
    title: fields.title.trim(),
    organizationId: draft.organizationId,
    startAt: beijingIso(fields.startAt),
    endAt: beijingIso(fields.endAt),
    location,
    expectedDraftHash: draft.draftHash,
    instance: {
      capacity: fields.capacity,
      registrationDeadline: fields.registrationDeadline
        ? beijingIso(fields.registrationDeadline)
        : null,
      description: fields.description || null,
      registrationNotes: fields.registrationNotes || null
    },
    places
  };
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

/** An uncertain PUT is reconciled by reading the entire target, never blindly retried. */
export function matchesTarget(
  draft: AdminSimpleDraftResponseDto,
  target: AdminSaveSimpleActivityDto
) {
  const { expectedDraftHash: _hash, ...desired } = target;
  const actual = {
    title: draft.title,
    organizationId: draft.organizationId,
    startAt: draft.startAt,
    endAt: draft.endAt,
    location: draft.location,
    instance: draft.instance,
    places: draft.places
  };
  const normalize = (body: typeof actual) => ({
    ...body,
    startAt: new Date(body.startAt).toISOString(),
    endAt: new Date(body.endAt).toISOString(),
    instance: {
      ...body.instance,
      registrationDeadline: body.instance.registrationDeadline
        ? new Date(body.instance.registrationDeadline).toISOString()
        : null
    },
    places: [...body.places].sort((a, b) =>
      a.roleCode.localeCompare(b.roleCode)
    )
  });
  return canonical(normalize(actual)) === canonical(normalize(desired));
}

export type PendingCreate = {
  body: AdminCreateSimpleActivityDto;
  activityId?: string;
};

/** Origin + API surface + stable userId partition. IDs only in durable local storage. */
export function recoveryStore(
  local: Storage,
  session: Storage,
  origin: string,
  userId: string
) {
  const prefix = `srvf:simple:v1:${encodeURIComponent(origin)}:admin-v1:${encodeURIComponent(userId)}:`;
  const pendingKey = `${prefix}pending`;
  return {
    recent(): string[] {
      const entries: [string, number][] = [];
      for (let i = 0; i < local.length; i++) {
        const key = local.key(i);
        if (key?.startsWith(`${prefix}activity:`))
          entries.push([
            key.slice(`${prefix}activity:`.length),
            Number(local.getItem(key))
          ]);
      }
      return entries.sort((a, b) => b[1] - a[1]).map(([id]) => id);
    },
    remember(id: string) {
      local.setItem(`${prefix}activity:${id}`, String(Date.now()));
    },
    forget(id: string) {
      local.removeItem(`${prefix}activity:${id}`);
    },
    pending(): PendingCreate | null {
      const raw = session.getItem(pendingKey);
      if (!raw) return null;
      const parsed: PendingCreate = JSON.parse(raw);
      if (!parsed?.body?.operationKey || !parsed.body.templateVersionId)
        throw new Error(
          "无法读取本标签页的待确认创建记录，请保留页面并联系管理员核实"
        );
      return parsed;
    },
    putPending(value: PendingCreate) {
      session.setItem(pendingKey, JSON.stringify(value));
    },
    clearPending() {
      session.removeItem(pendingKey);
    }
  };
}
