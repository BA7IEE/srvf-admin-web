import { http } from "@/utils/http";

type Result = {
  code: number;
  message: string;
  data?: Array<any>;
};

type ResultTable = {
  code: number;
  message: string;
  data?: {
    /** 列表数据 */
    list: Array<any>;
    /** 总条目数 */
    total?: number;
    /** 每页显示条目个数 */
    pageSize?: number;
    /** 当前页数 */
    currentPage?: number;
  };
};

/** 字典管理-左侧树 */
export const getDictTree = () => {
  return http.request<Result>("get", "/dict-tree");
};

/** 字典管理-根据字典 dictId 查字典详情 */
export const getDictDetail = (data?: object) => {
  return http.request<ResultTable>("post", "/dict-detail", { data });
};

/** 获取租户管理-租户列表 */
export const getTenantList = (data?: object) => {
  return http.request<ResultTable>("post", "/tenant-list", { data });
};

/** 获取租户管理-租户套餐列表 */
export const getTenantPackage = (data?: object) => {
  return http.request<ResultTable>("post", "/tenant-package", { data });
};

/** 获取租户套餐-权限-菜单权限 */
export const getTenantPackageMenu = (data?: object) => {
  return http.request<Result>("post", "/tenant-package-menu", { data });
};

/** 获取租户套餐-权限-菜单权限-根据角色 id 查对应菜单 */
export const getTenantPackageMenuIds = (data?: object) => {
  return http.request<Result>("post", "/tenant-package-menu-ids", { data });
};

/** 获取租户套餐列表（用于下拉选择） */
export const getTenantPackageSimple = () => {
  return http.request<Result>("get", "/tenant-package-simple");
};
