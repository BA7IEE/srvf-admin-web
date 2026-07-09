/**
 * 枚举/状态 → 中文 + 语义色 常量的统一出口（barrel）。
 *
 * 本文件不定义任何常量，只 re-export 各 `src/api/srvf-*.ts` 里已有的
 * `*_LABEL` / `*_TAG` 常量，避免调用方各自记忆常量分散在哪个域文件。
 * 新增状态字典仍在对应域的 `src/api/srvf-*.ts` 里定义，然后来这里补一行 re-export。
 *
 * `VISIBILITY_LABEL` 在 srvf-content.ts / srvf-notification.ts 两处同名但值不同
 * （内容可见性含 public，通知可见性不含），此处按域改名导出以避免冲突；
 * 各自源文件内的原名不变。
 */

export {
  IMPORT_ROW_STATUS_LABEL,
  IMPORT_ROW_STATUS_TAG
} from "./srvf-announcement-import";

export { ACCESS_LEVEL_LABEL, ACCESS_LEVEL_TAG } from "./srvf-attachment";

export { AUTHZ_REASON_LABEL, RESOURCE_TYPE_LABEL } from "./srvf-authz";

export {
  CONTENT_STATUS_LABEL,
  CONTENT_STATUS_TAG,
  VISIBILITY_LABEL as CONTENT_VISIBILITY_LABEL
} from "./srvf-content";

export {
  MEMBERSHIP_TYPE_LABEL,
  MEMBERSHIP_STATUS_LABEL,
  MEMBERSHIP_STATUS_TAG,
  MEMBERSHIP_CONFLICT_TYPE_LABEL
} from "./srvf-membership";

export {
  NOTIFICATION_STATUS_LABEL,
  NOTIFICATION_STATUS_TAG,
  VISIBILITY_LABEL as NOTIFICATION_VISIBILITY_LABEL,
  CHANNEL_LABEL
} from "./srvf-notification";

export {
  ASSIGNMENT_STATUS_LABEL,
  ASSIGNMENT_STATUS_TAG
} from "./srvf-position-assignment";

export { POSITION_CATEGORY_LABEL } from "./srvf-position";

export {
  PROMOTE_SKIP_REASON_LABEL,
  EXPORT_FILTER_LABEL,
  CYCLE_STATUS_LABEL,
  APP_STATUS_LABEL,
  APP_STATUS_TAG,
  THRESHOLD_LABEL
} from "./srvf-recruitment";

export {
  PRINCIPAL_TYPE_LABEL,
  SCOPE_TYPE_LABEL,
  BINDING_STATUS_LABEL,
  BINDING_STATUS_TAG
} from "./srvf-role-binding";

export {
  SCOPE_MODE_LABEL,
  SUPERVISION_STATUS_LABEL,
  SUPERVISION_STATUS_TAG
} from "./srvf-supervision";

export {
  TJ_CYCLE_STATUS_LABEL,
  TJ_APP_STATUS_LABEL,
  TJ_APP_STATUS_TAG,
  GATE_LABEL
} from "./srvf-team-join";

/**
 * 按 code 查中文，未命中回退原值（保持现有各页 `MAP[v] ?? v` 的回退口径）。
 */
export function toLabel(
  dict: Record<string, string>,
  value?: string | null
): string {
  if (value == null) return "";
  return dict[value] ?? value;
}
