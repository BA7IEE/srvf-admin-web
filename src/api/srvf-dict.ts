import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };
type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type DictTypeStatus = "ACTIVE" | "INACTIVE";

/** 字典类型（后端 DictTypeResponseDto；字段以 /api/docs-json 为准） */
export type DictTypeItem = {
  id: string;
  code: string;
  label: string;
  status: DictTypeStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type DictTypeListQuery = {
  page?: number;
  pageSize?: number;
  status?: DictTypeStatus;
};
export type DictTypeListResult = Envelope<PageResult<DictTypeItem>>;

/** 字典类型分页列表 `GET /api/system/v1/dict-types`（rbac: `dict.read.type`） */
export const getDictTypes = (params?: DictTypeListQuery) =>
  http.request<DictTypeListResult>("get", "/api/system/v1/dict-types", {
    params
  });
