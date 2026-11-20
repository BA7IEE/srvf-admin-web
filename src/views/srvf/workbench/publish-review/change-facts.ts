import type {
  ActivityChangePatch,
  PublishReview
} from "@/api/srvf-activity-publish-review";
import { simpleChangeChildren } from "../../activities-domain/activities/simple/published-layout";
import { beijingInput } from "../../activities-domain/activities/simple/state";
import { canonical } from "./metrics";
import { objectValue, type FrozenFact } from "./snapshot";

const labels = {
  title: "活动标题",
  description: "活动说明",
  startAt: "开始时间",
  endAt: "结束时间",
  location: "地点文字",
  capacity: "人数上限",
  locationText: "地点文字",
  checkInOpenAt: "签到开放",
  checkInCloseAt: "签到截止",
  checkOutOpenAt: "签退开放",
  checkOutCloseAt: "签退截止",
  preparationStartAt: "准备开始"
};
const activityKeys = [
  "title",
  "description",
  "startAt",
  "endAt",
  "location",
  "capacity"
] as const;
const instant = (v: unknown): v is string =>
  typeof v === "string" &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString() === v;
const validCapacity = (v: unknown) =>
  v === null ||
  (Number.isInteger(v) && Number(v) > 0 && Number(v) <= 2147483647);
const onlyRecord = (items: unknown) =>
  Array.isArray(items) && items.length === 1 && objectValue(items[0])
    ? (items[0] as Record<string, unknown>)
    : null;
function shown(key: keyof typeof labels, v: unknown) {
  if (key === "capacity" && v === null) return "不限人数";
  if (v === null) return "未设置";
  if (v === "") return "空文本";
  if (key.endsWith("At") && instant(v))
    return (
      beijingInput(v)
        .replace("T", " ")
        .replace(/:00\.000$|\.000$/, "") + "（北京时间）"
    );
  return String(v);
}
// Rebuild only the supported Simple projections. Every other frozen field, including
// resolved policy sources and structured places, must match the original exactly.
export function changeFacts(review: PublishReview): FrozenFact[] | null {
  const s = review.snapshot;
  if (
    !objectValue(s.base) ||
    !objectValue(s.base.activity) ||
    !objectValue(s.activity) ||
    s.metricSelectionExplicit ||
    s.timePolicySelectionExplicit ||
    s.contributionPolicySelectionExplicit ||
    review.changeDiff?.kind !== "proposal-v" + s.schemaVersion
  )
    return null;
  const before = s.base.activity,
    after = s.activity;
  const keys = activityKeys.filter(key => before[key] !== after[key]);
  const reported = review.changeDiff.activityFields;
  if (
    !keys.length ||
    !Array.isArray(reported) ||
    canonical([...keys].sort()) !== canonical([...reported].sort())
  )
    return null;
  for (const a of [before, after]) {
    if (
      typeof a.title !== "string" ||
      !a.title.trim() ||
      !(a.description === null || typeof a.description === "string") ||
      !instant(a.startAt) ||
      !instant(a.endAt) ||
      Date.parse(a.startAt) >= Date.parse(a.endAt) ||
      typeof a.location !== "string" ||
      !a.location.trim() ||
      !validCapacity(a.capacity)
    )
      return null;
  }
  const expected = JSON.parse(JSON.stringify(s.base)) as Record<
    string,
    unknown
  >;
  const patch = Object.fromEntries(
    keys.map(k => [k, after[k]])
  ) as ActivityChangePatch;
  expected.activity = { ...before, ...patch };
  const facts: FrozenFact[] = [];
  function compare(
    label: string,
    key: keyof typeof labels,
    oldValue: unknown,
    newValue: unknown
  ) {
    facts.push(
      { label: "原" + label, value: shown(key, oldValue) },
      {
        label: key === "title" ? "申请的新标题" : "申请的新" + label,
        value: shown(key, newValue)
      }
    );
  }
  for (const k of keys) compare(labels[k], k, before[k], after[k]);
  if (keys.some(k => k !== "title" && k !== "description")) {
    const session = onlyRecord(expected.sessions),
      position = onlyRecord(session?.positions);
    const resolved = objectValue(expected.resolvedConfig)
      ? onlyRecord(expected.resolvedConfig.sessions)
      : null;
    if (
      !session ||
      !position ||
      !resolved ||
      typeof session.sessionId !== "string" ||
      resolved.sessionId !== session.sessionId ||
      session.statusCode !== "scheduled" ||
      position.cancelled !== false ||
      typeof position.positionId !== "string" ||
      !objectValue(resolved.resolution)
    )
      return null;
    const {
      startAt,
      endAt,
      checkInOpenAt,
      checkInCloseAt,
      checkOutOpenAt,
      checkOutCloseAt,
      preparationStartAt
    } = session;
    if (
      !instant(startAt) ||
      !instant(endAt) ||
      !instant(checkInOpenAt) ||
      !instant(checkInCloseAt) ||
      !instant(checkOutOpenAt) ||
      !instant(checkOutCloseAt) ||
      !(preparationStartAt === null || instant(preparationStartAt)) ||
      startAt !== before.startAt ||
      endAt !== before.endAt ||
      position.capacity !== before.capacity ||
      session.capacity !== before.capacity ||
      !(
        (position.startAt === null && position.endAt === null) ||
        (position.startAt === startAt && position.endAt === endAt)
      )
    )
      return null;
    const changes = simpleChangeChildren(
      patch,
      {
        startAt,
        endAt,
        checkInOpenAt,
        checkInCloseAt,
        checkOutOpenAt,
        checkOutCloseAt,
        preparationStartAt:
          typeof preparationStartAt === "string" ? preparationStartAt : null
      },
      {
        startAt: position.startAt === null ? null : startAt,
        endAt: position.endAt === null ? null : endAt
      }
    );
    for (const [field, value] of Object.entries(changes.session)) {
      const key = field as keyof typeof changes.session;
      if (session[key] !== value)
        compare("场次" + labels[key], key, session[key], value);
      if (
        [
          "checkInOpenAt",
          "checkInCloseAt",
          "checkOutOpenAt",
          "checkOutCloseAt"
        ].includes(key)
      ) {
        const rule = resolved.resolution[key];
        if (
          !objectValue(rule) ||
          resolved[key] !== session[key] ||
          rule.value !== session[key]
        )
          return null;
        resolved[key] = value;
        rule.value = value;
      }
      session[key] = value;
    }
    for (const [field, value] of Object.entries(changes.position)) {
      const key = field as keyof typeof changes.position;
      if (position[key] !== value)
        compare("岗位" + labels[key], key, position[key], value);
      position[key] = value;
    }
  }
  if (
    !Object.keys(expected).every(
      k => canonical(expected[k]) === canonical(s[k])
    )
  )
    return null;
  return facts;
}
