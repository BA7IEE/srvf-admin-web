import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验 */
export const formRules = reactive(<FormRules>{
  name: [{ required: true, message: "租户名为必填项", trigger: "blur" }],
  packageId: [{ required: true, message: "租户套餐为必选项", trigger: "blur" }],
  contactName: [{ required: true, message: "联系人为必填项", trigger: "blur" }],
  contactMobile: [
    { required: true, message: "联系电话为必填项", trigger: "blur" }
  ],
  accountCount: [
    { required: true, message: "账号额度为必填项", trigger: "blur" }
  ],
  expireTime: [
    { required: true, message: "过期时间为必选项", trigger: "blur" }
  ],
  website: [{ required: true, message: "绑定域名为必填项", trigger: "blur" }]
});
