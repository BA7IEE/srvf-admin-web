import { http } from "@/utils/http";

/** 后端统一成功信封（失败为 HTTP 4xx，axios reject） */
type Envelope<T> = { code: number; message: string; data: T };

/**
 * 队员当前部门归属（后端 `MemberDepartmentResponseDto`）。字段以 live `/api/docs-json` 为准。
 * **单值子资源**：一名队员至多一条归属；无归属时 GET 返回 `data: null`。
 * 响应**只给 `organizationId`**（无组织名）——前端经 `@/api/srvf-organization` 读接口解析成组织名。
 */
export type MemberDepartmentItem = {
  /** 主键（cuid 代理键） */
  id: string;
  /** 队员外键（members.id） */
  memberId: string;
  /** 组织节点外键（organizations.id；需前端解析成组织名展示） */
  organizationId: string;
  /** 归属生效时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
};

/**
 * 查队员当前部门归属 `GET /api/admin/v1/members/{memberId}/department`
 * （rbac: `member-department.read.current`）。无归属 → `data: null`。
 */
export const getMemberDepartment = (memberId: string) =>
  http.request<Envelope<MemberDepartmentItem | null>>(
    "get",
    `/api/admin/v1/members/${memberId}/department`
  );

/**
 * 设置队员部门入参（后端 `SetMemberDepartmentDto`）。
 * 必填 `organizationId`（≤ 64；目标组织节点必须存在且 status=ACTIVE，由后端裁决）。
 */
export type SetMemberDepartmentBody = {
  /** 目标组织节点 id（必填；≤ 64；须存在且 ACTIVE） */
  organizationId: string;
};

/**
 * 幂等设置队员正式部门 `PUT /api/admin/v1/members/{memberId}/department`
 * （rbac: `member-department.set.current`）。已有归属 → 软删旧 + 建新；同 org 直接返回。
 * 目标节点不存在 / 非 ACTIVE / 不可归属等 → 后端 4xx（弹其 message，前端不复刻归属规则）。
 */
export const setMemberDepartment = (
  memberId: string,
  body: SetMemberDepartmentBody
) =>
  http.request<Envelope<MemberDepartmentItem>>(
    "put",
    `/api/admin/v1/members/${memberId}/department`,
    { data: body }
  );

/**
 * 解除当前部门归属 `DELETE /api/admin/v1/members/{memberId}/department`
 * （rbac: `member-department.clear.current`）。软删中间表行，不物理删除。
 */
export const clearMemberDepartment = (memberId: string) =>
  http.request<Envelope<MemberDepartmentItem | null>>(
    "delete",
    `/api/admin/v1/members/${memberId}/department`
  );
