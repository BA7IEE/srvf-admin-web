import type { MembershipItem } from "@/api/srvf-membership";

/** 优先使用后端标签；空值或缺少展开时退回已知身份，不显示 undefined。 */
export function formatMembershipMember({ member, memberId }: MembershipItem) {
  return (
    member?.label?.trim() ||
    member?.realName?.trim() ||
    member?.memberNo?.trim() ||
    memberId ||
    "未知队员"
  );
}
