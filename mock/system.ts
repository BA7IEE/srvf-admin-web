import { defineFakeRoute } from "vite-plugin-fake-server/client";

export default defineFakeRoute([
  // 字典管理-左侧树
  {
    url: "/dict-tree",
    method: "get",
    response: () => {
      return {
        code: 0,
        message: "操作成功",
        data: [
          {
            id: 100,
            createTime: 1605456000000,
            name: "通知类型",
            code: "notice_type",
            remark: "页面头部右上角小铃铛中的通知类型"
          },
          {
            id: 200,
            createTime: 1605456000000,
            name: "状态",
            code: "status",
            remark: null
          },
          {
            id: 300,
            createTime: 1605456000000,
            name: "性别",
            code: "gender",
            remark: null
          },
          {
            id: 400,
            createTime: 1605456000000,
            name: "文字超出测试文字超出测试",
            code: "test",
            remark: null
          }
        ]
      };
    }
  },
  // 字典管理-根据字典 dictId 查字典详情
  {
    url: "/dict-detail",
    method: "post",
    response: ({ body }) => {
      const list = [
        {
          id: 101,
          label: "通知",
          value: "1",
          color: "#FF0000",
          status: 1, // 状态 1 启用 0 停用
          sort: 1,
          remark: "平台通知",
          createTime: 1722441600000,
          dictId: 100
        },
        {
          id: 102,
          label: "消息",
          value: "2",
          color: "#007BFF",
          status: 1,
          sort: 2,
          remark: "平台消息",
          createTime: 1722441600000,
          dictId: 100
        },
        {
          id: 103,
          label: "代办",
          value: "3",
          color: "#FFA500",
          status: 1,
          sort: 3,
          remark: "平台代办",
          createTime: 1722441600000,
          dictId: 100
        },
        {
          id: 201,
          label: "已启用",
          value: "1",
          color: "#6abe39",
          status: 1,
          sort: 1,
          remark: "暂无",
          createTime: 1722441600000,
          dictId: 200
        },
        {
          id: 202,
          label: "已停用",
          value: "0",
          color: "#e84749",
          status: 1,
          sort: 2,
          remark: "暂无",
          createTime: 1722441600000,
          dictId: 200
        },
        {
          id: 301,
          label: "男",
          value: "0",
          color: "#9fceff",
          status: 1,
          sort: 1,
          remark: "男性",
          createTime: 1722441600000,
          dictId: 300
        },
        {
          id: 302,
          label: "女",
          value: "1",
          color: "#fab6b6",
          status: 1,
          sort: 2,
          remark: "女性",
          createTime: 1722441600000,
          dictId: 300
        }
      ];

      const filteredList =
        body.dictId && [100, 200, 300, 400].includes(body.dictId)
          ? list.filter(v => v.dictId === body.dictId)
          : [];

      return {
        code: 0,
        message: "操作成功",
        data: {
          list: filteredList,
          total: filteredList.length,
          pageSize: 10,
          currentPage: 1
        }
      };
    }
  },
  // 租户列表
  {
    url: "/tenant-list",
    method: "post",
    response: ({ body }) => {
      let list = [
        {
          id: 1,
          name: "pure-admin",
          packageId: 101, // 套餐编号
          packageName: "高级套餐", // 套餐名称
          contactName: "pureadmin",
          contactMobile: "18212349876",
          accountCount: 9999,
          expireTime: 2866329000000,
          website: "https://pure-admin.github.io/vue-pure-admin",
          status: 1, // 状态 1 启用 0 停用
          remark: "https://github.com/pure-admin/vue-pure-admin",
          createTime: 1635561000000
        },
        {
          id: 2,
          name: "boot-admin",
          packageId: 102,
          packageName: "普通套餐",
          contactName: "hb0730",
          contactMobile: "15888886789",
          accountCount: 100,
          expireTime: 1951093800000,
          website: "https://boot-admin.hb0730.com",
          status: 1,
          remark: "https://github.com/hb0730/boot-admin-ui",
          createTime: 1635561000000
        },
        {
          id: 3,
          name: "AgileBoot",
          packageId: 102,
          packageName: "普通套餐",
          contactName: "valarchie",
          contactMobile: "18233451123",
          accountCount: 100,
          expireTime: 1951093800000,
          website: "http://www.agileboot.cc",
          status: 1,
          remark: "https://github.com/valarchie/AgileBoot-Front-End",
          createTime: 1635561000000
        },
        {
          id: 4,
          name: "Halcyon-Admin",
          packageId: 102,
          packageName: "普通套餐",
          contactName: "hhfb8848",
          contactMobile: "15689765432",
          accountCount: 100,
          expireTime: 1951093800000,
          website: "http://36.111.172.53:8848",
          status: 1,
          remark: "https://github.com/hhfb8848/halcyon-admin-ui",
          createTime: 1635561000000
        },
        {
          id: 5,
          name: "go-admin",
          packageId: 102,
          packageName: "普通套餐",
          contactName: "anerg2046",
          contactMobile: "16012348765",
          accountCount: 100,
          expireTime: 1951093800000,
          website: "https://admin.fabraze.com",
          status: 1,
          remark: "https://github.com/anerg2046/go-admin-front",
          createTime: 1635561000000
        },
        {
          id: 6,
          name: "xadmin",
          packageId: 102,
          packageName: "普通套餐",
          contactName: "nineaiyu",
          contactMobile: "18098762345",
          accountCount: 100,
          expireTime: 1951093800000,
          website: "https://xadmin.dvcloud.xin",
          status: 1,
          remark: "https://github.com/nineaiyu/xadmin-client",
          createTime: 1635561000000
        },
        {
          id: 7,
          name: "PurestAdmin",
          packageId: 102,
          packageName: "普通套餐",
          contactName: "dymproject",
          contactMobile: "15487690123",
          accountCount: 100,
          expireTime: 1951093800000,
          website: "http://www.purestadmin.com",
          status: 1,
          remark:
            "https://gitee.com/dymproject/purest-admin/tree/main/client-vue",
          createTime: 1635561000000
        }
      ];
      list = list.filter(item => item.name.includes(body?.name));
      list = list.filter(item =>
        String(item.status).includes(String(body?.status))
      );
      if (body.contactName) {
        list = list.filter(item => item.contactName === body.contactName);
      }
      if (body.contactMobile) {
        list = list.filter(item => item.contactMobile === body.contactMobile);
      }
      return {
        code: 0,
        message: "操作成功",
        data: {
          list,
          total: list.length, // 总条目数
          pageSize: 10, // 每页显示条目个数
          currentPage: 1 // 当前页数
        }
      };
    }
  },
  // 租户套餐
  {
    url: "/tenant-package",
    method: "post",
    response: ({ body }) => {
      let list = [
        {
          createTime: 1635474600000, // 时间戳（毫秒ms）
          id: 101,
          name: "高级套餐",
          status: 1, // 状态 1 启用 0 停用
          remark: "拥有全部菜单权限"
        },
        {
          createTime: 1635474600000,
          id: 102,
          name: "普通套餐",
          status: 1,
          remark: "拥有部分菜单权限"
        }
      ];
      list = list.filter(item => item.name.includes(body?.name));
      list = list.filter(item =>
        String(item.status).includes(String(body?.status))
      );
      return {
        code: 0,
        message: "操作成功",
        data: {
          list,
          total: list.length, // 总条目数
          pageSize: 10, // 每页显示条目个数
          currentPage: 1 // 当前页数
        }
      };
    }
  },
  // 租户套餐-权限-菜单权限
  {
    url: "/tenant-package-menu",
    method: "post",
    response: () => {
      return {
        code: 0,
        message: "操作成功",
        data: [
          // 权限管理
          {
            parentId: 0,
            id: 200,
            menuType: 0,
            title: "权限管理"
          },
          {
            parentId: 200,
            id: 201,
            menuType: 0,
            title: "页面权限"
          },
          {
            parentId: 200,
            id: 202,
            menuType: 0,
            title: "按钮权限"
          },
          {
            parentId: 202,
            id: 203,
            menuType: 3,
            title: "添加"
          },
          {
            parentId: 202,
            id: 204,
            menuType: 3,
            title: "修改"
          },
          {
            parentId: 202,
            id: 205,
            menuType: 3,
            title: "删除"
          },
          // 字典管理
          {
            parentId: 0,
            id: 300,
            menuType: 0,
            title: "字典管理"
          }
        ]
      };
    }
  },
  // 租户套餐-权限-菜单权限-根据角色 id 查对应菜单
  {
    url: "/tenant-package-menu-ids",
    method: "post",
    response: ({ body }) => {
      if (body.id == 101) {
        return {
          code: 0,
          message: "操作成功",
          data: [200, 201, 202, 203, 204, 205, 300]
        };
      } else if (body.id == 102) {
        return {
          code: 0,
          message: "操作成功",
          data: []
        };
      }
    }
  },
  // 租户套餐列表（简易）
  {
    url: "/tenant-package-simple",
    method: "get",
    response: () => {
      return {
        code: 0,
        message: "操作成功",
        data: [
          {
            id: 101,
            name: "高级套餐"
          },
          {
            id: 102,
            name: "普通套餐"
          }
        ]
      };
    }
  }
]);
