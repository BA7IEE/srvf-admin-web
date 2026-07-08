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

/* ----------------------------- 字典类型 写操作 ----------------------------- */

/** 创建字典类型入参（后端 `CreateDictTypeDto`） */
export type CreateDictTypeBody = {
  /** 全局唯一；小写字母 / 数字 / 下划线，字母开头 */
  code: string;
  /** 显示名（≤ 255） */
  label: string;
  /** 排序权重（默认 0） */
  sortOrder?: number;
};
/** 更新字典类型入参（后端 `UpdateDictTypeDto`；仅 label / sortOrder，code 不可改） */
export type UpdateDictTypeBody = {
  label?: string;
  sortOrder?: number;
};
export type DictTypeMutationResult = Envelope<DictTypeItem>;

/** 创建字典类型 `POST /api/system/v1/dict-types`（rbac: `dict.create.type`） */
export const createDictType = (body: CreateDictTypeBody) =>
  http.request<DictTypeMutationResult>("post", "/api/system/v1/dict-types", {
    data: body
  });

/** 更新字典类型 `PATCH /api/system/v1/dict-types/{id}`（rbac: `dict.update.type`） */
export const updateDictType = (id: string, body: UpdateDictTypeBody) =>
  http.request<DictTypeMutationResult>(
    "patch",
    `/api/system/v1/dict-types/${id}`,
    { data: body }
  );

/** 删除字典类型 `DELETE /api/system/v1/dict-types/{id}`（rbac: `dict.delete.type`） */
export const deleteDictType = (id: string) =>
  http.request<Envelope<DictTypeItem | null>>(
    "delete",
    `/api/system/v1/dict-types/${id}`
  );

/** 启停字典类型 `PATCH /api/system/v1/dict-types/{id}/status`（rbac: `dict.update.type`） */
export const updateDictTypeStatus = (id: string, status: DictTypeStatus) =>
  http.request<DictTypeMutationResult>(
    "patch",
    `/api/system/v1/dict-types/${id}/status`,
    { data: { status } }
  );

/* ------------------------------- 字典条目 ------------------------------- */

/** 字典条目（后端 `DictItemResponseDto`；字段以 `/api/docs-json` 为准） */
export type DictItem = {
  id: string;
  typeId: string;
  code: string;
  label: string;
  /** 父级条目 id（同 typeId 下；可空） */
  parentId: string | null;
  sortOrder: number;
  status: DictTypeStatus;
  createdAt: string;
  updatedAt: string;
};

/** 字典条目分页查询（后端 `typeId` 必填） */
export type DictItemListQuery = {
  typeId: string;
  page?: number;
  pageSize?: number;
  parentId?: string;
  status?: DictTypeStatus;
};
export type DictItemListResult = Envelope<PageResult<DictItem>>;

/** 字典条目分页列表 `GET /api/system/v1/dict-items`（rbac: `dict.read.item`；typeId 必填） */
export const getDictItems = (params: DictItemListQuery) =>
  http.request<DictItemListResult>("get", "/api/system/v1/dict-items", {
    params
  });

/** 字典条目树节点（`DictItem` + 嵌套 `children`；叶子节点 `children` 为空数组，深度不限） */
export type DictItemTreeNode = DictItem & { children: DictItemTreeNode[] };

export type DictItemTreeQuery = {
  typeId: string;
  status?: DictTypeStatus;
};
export type DictItemTreeResult = Envelope<DictItemTreeNode[]>;

/**
 * 字典条目树形 `GET /api/system/v1/dict-items/tree`（rbac: `dict.read.item`；typeId 必填）。
 * 一次性返回该类型下完整条目树（不分页），供树形表格展示 + 新建条目时的完整父级候选使用。
 */
export const getDictItemTree = (params: DictItemTreeQuery) =>
  http.request<DictItemTreeResult>("get", "/api/system/v1/dict-items/tree", {
    params
  });

/** 创建字典条目入参（后端 `CreateDictItemDto`） */
export type CreateDictItemBody = {
  /** 所属类型 id（必须存在） */
  typeId: string;
  /** 同 typeId 下唯一；小写字母 / 数字 / 下划线 / 中横线，字母或数字开头 */
  code: string;
  /** 显示名（≤ 255） */
  label: string;
  /** 父级 id（可选；必须与本 item 同 typeId，且不能形成自环） */
  parentId?: string;
  /** 排序权重（默认 0） */
  sortOrder?: number;
};
/** 更新字典条目入参（后端 `UpdateDictItemDto`；仅 label / sortOrder，code / typeId / parentId 不可改） */
export type UpdateDictItemBody = {
  label?: string;
  sortOrder?: number;
};
export type DictItemMutationResult = Envelope<DictItem>;

/** 创建字典条目 `POST /api/system/v1/dict-items`（rbac: `dict.create.item`） */
export const createDictItem = (body: CreateDictItemBody) =>
  http.request<DictItemMutationResult>("post", "/api/system/v1/dict-items", {
    data: body
  });

/** 更新字典条目 `PATCH /api/system/v1/dict-items/{id}`（rbac: `dict.update.item`） */
export const updateDictItem = (id: string, body: UpdateDictItemBody) =>
  http.request<DictItemMutationResult>(
    "patch",
    `/api/system/v1/dict-items/${id}`,
    { data: body }
  );

/** 删除字典条目 `DELETE /api/system/v1/dict-items/{id}`（rbac: `dict.delete.item`） */
export const deleteDictItem = (id: string) =>
  http.request<Envelope<DictItem | null>>(
    "delete",
    `/api/system/v1/dict-items/${id}`
  );

/** 启停字典条目 `PATCH /api/system/v1/dict-items/{id}/status`（rbac: `dict.update.item`） */
export const updateDictItemStatus = (id: string, status: DictTypeStatus) =>
  http.request<DictItemMutationResult>(
    "patch",
    `/api/system/v1/dict-items/${id}/status`,
    { data: { status } }
  );
