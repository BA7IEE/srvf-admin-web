import type { MembershipItem } from "@/api/srvf-membership";

/** 使用后端提供的统一队员标签；未展开队员时保留原有主键回退。 */
export function formatMembershipMember({ member, memberId }: MembershipItem) {
  return member?.label ?? memberId;
}
