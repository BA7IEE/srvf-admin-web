import { http } from "@/utils/http";

/** 后端统一成功信封（与 @/api/user 的 ApiEnvelope 同形；失败为 HTTP 4xx，axios reject） */
type Envelope<T> = { code: number; message: string; data: T };

/** 后端分页信封（PageResultDto） */
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type MemberStatus = "ACTIVE" | "INACTIVE";

/**
 * 队员（后端 `MemberResponseDto`）。字段以 `/api/docs-json` 为准，勿前端臆造。
 */
export type MemberItem = {
  id: string;
  /** 队员业务唯一编号 */
  memberNo: string;
  /** 称呼 / 显示名 */
  displayName: string;
  /** 等级字典 code（隐含 type code = member_grade），可空 */
  gradeCode: string | null;
  /** 在队 / 离队 */
  status: MemberStatus;
  createdAt: string;
  updatedAt: string;
};

export type MemberListQuery = {
  page?: number;
  pageSize?: number;
  memberNo?: string;
  gradeCode?: string;
  status?: MemberStatus;
};

export type MemberListResult = Envelope<PageResult<MemberItem>>;

/** 队员分页列表 `GET /api/admin/v1/members`（rbac: `member.read.record`） */
export const getMembers = (params?: MemberListQuery) => {
  return http.request<MemberListResult>("get", "/api/admin/v1/members", {
    params
  });
};
