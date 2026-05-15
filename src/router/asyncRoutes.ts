// @ts-nocheck
import { router } from "./index";
import { getConfig } from "@/config";
import { handleTree } from "@/utils/tree";
import { handleAsyncRoutes } from "./utils";
import { cloneDeep, storageLocal, cleanObject } from "@pureadmin/utils";

/**
 * 视频教程：前端处理动态路由格式.mov
 * 链接：https://www.alipan.com/s/VHTUkiQHyKR
 * 提取码: 3z0f
 */

/**
 * getMenuList 是菜单管理列表接口，实际开发中后端可以根据当前登录的用户角色新加一个接口如 getCurrentMenus（它就相当于平台用 mock 模拟的 getAsyncRoutes 动态路由）
 * 简单点说就是 getCurrentMenus 拷贝 getMenuList 的数据结构并在此基础上根据不同角色分配的不同菜单权限做处理返回对应用户角色的一维菜单列表
 * 后端只需返回一维的菜单列表，下面提供的 getStandardRouter 方法，可自动将一维菜单列表转换为符合平台路由规范的树形结构。无需手动处理菜单树的拼接逻辑
 */
import { getMenuList } from "@/api/system";

interface MenuData {
  id: number;
  parentId: number;
  /** 菜单类型（0代表菜单、1代表iframe、2代表外链、3代表按钮） */
  menuType: number;
  title: string;
  name: string;
  path: string;
  component: string;
  rank: number;
  redirect: string;
  icon: string;
  extraIcon: string;
  enterTransition: string;
  leaveTransition: string;
  activePath: string;
  auths: string[];
  frameSrc: string;
  frameLoading: boolean;
  keepAlive: boolean;
  hiddenTag: boolean;
  fixedTag: boolean;
  showLink: boolean;
  showParent: boolean;
  children?: MenuData[];
}

function menuToRoute(item: MenuData, isRoot = false): any {
  // 收集 menuType=3 的子节点 auths
  const mergedAuths: string[] = [];
  const filteredChildren: MenuData[] = [];

  if (item.children && item.children.length) {
    for (const child of item.children) {
      if (child.menuType === 3) {
        if (Array.isArray(child.auths)) {
          mergedAuths.push(...child.auths);
        } else if (child.auths) {
          mergedAuths.push(child.auths);
        }
      } else {
        filteredChildren.push(child);
      }
    }
  }

  // 构造 meta
  const meta: Record<string, any> = {
    title: item.title,
    icon: item.icon,
    ...(item.extraIcon ? { extraIcon: item.extraIcon } : {}),
    showLink: item.showLink,
    ...(item.showParent !== undefined ? { showParent: item.showParent } : {}),
    auths: [
      ...(Array.isArray(item.auths)
        ? item.auths
        : item.auths
          ? [item.auths]
          : []),
      ...mergedAuths
    ],
    keepAlive: item.keepAlive,
    frameSrc: item.frameSrc,
    frameLoading: item.frameLoading,
    transition: {
      name: item.enterTransition || "",
      enterTransition: item.enterTransition || "",
      leaveTransition: item.leaveTransition || ""
    },
    hiddenTag: item.hiddenTag,
    dynamicLevel: 0,
    activePath: item.activePath
  };

  // 只有顶级路由加rank
  if (isRoot) {
    meta.rank = item.rank ?? 0;
  }

  const route: any = {
    path: item.path,
    name: item.name,
    redirect: item.redirect || "",
    meta
  };

  if (filteredChildren.length) {
    route.children = filteredChildren.map(child => menuToRoute(child, false));
  } else if (item.component) {
    route.component = item.component;
  }

  return route;
}

function menuDataToRoutes(menuData: MenuData[]): any[] {
  const treeData = handleTree(menuData, "id", "parentId", "children");
  return treeData.map(item => menuToRoute(item, true));
}

/** 初始化路由（`new Promise` 写法防止在异步请求中造成无限循环）*/
export function initRouter() {
  function getStandardRouter(data) {
    return cleanObject(menuDataToRoutes(cloneDeep(data)), {
      stripKeysInObjects: {
        meta: [
          (k, v) => k === "dynamicLevel" && Number(v) === 0,
          (k, v) => k === "showParent" && v === false,
          (k, v) => k === "hiddenTag" && v === false,
          (k, v) => k === "frameLoading" && v === true,
          (k, v) => k === "rank" && Number(v) === 0 // 平台规定只有`home`路由的`rank`才能为`0`，所以后端在返回`rank`的时候需要从非`0`开始，菜单管理中菜单排序组件已经限制`rank`不能为`0`，这里再限制一下更保险
        ]
      }
    });
  }
  if (getConfig()?.CachingAsyncRoutes) {
    // 开启动态路由缓存本地localStorage
    const key = "async-routes";
    const asyncRouteList = storageLocal().getItem(key) as any;
    if (asyncRouteList && asyncRouteList?.length > 0) {
      return new Promise(resolve => {
        handleAsyncRoutes(asyncRouteList);
        resolve(router);
      });
    } else {
      return new Promise(resolve => {
        getMenuList().then(({ data }) => {
          handleAsyncRoutes(getStandardRouter(data));
          storageLocal().setItem(key, getStandardRouter(data));
          resolve(router);
        });
      });
    }
  } else {
    return new Promise(resolve => {
      getMenuList().then(({ data }) => {
        handleAsyncRoutes(getStandardRouter(data));
        resolve(router);
      });
    });
  }
}
