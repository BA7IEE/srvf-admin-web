import type { EditorAppointment } from "@/api/srvf-role-binding";

export type SubmittedAppointment = {
  activity: string;
  previous: string | null;
  confirmed: boolean;
  returnedId: string | null;
};

export function appointmentFeedback(
  intent: SubmittedAppointment,
  current: EditorAppointment["binding"]
): string {
  if (intent.previous) {
    if (current?.id === intent.previous) return "原任命仍在，请核对后再办理。";
    if (current) return "当前任命已变更，请核对后再办理。";
    return intent.confirmed
      ? "已结束该活动的编辑任命。"
      : "未收到结束确认，已核对当前没有编辑任命。";
  }
  if (!current) return "已核对当前没有编辑任命，请核对后再办理。";
  return intent.confirmed && current.id === intent.returnedId
    ? "已开始该活动的编辑任命。"
    : "已核对到当前任命，请按当前状态办理。";
}
