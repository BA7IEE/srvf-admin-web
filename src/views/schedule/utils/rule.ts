import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验 */
export const formRules = reactive(<FormRules>{
  scheduling: [
    { required: true, message: "排班内容为必填项", trigger: "blur" }
  ],
  startDate: [{ required: true, message: "开始日期为必选项", trigger: "blur" }],
  endDate: [{ required: true, message: "结束日期为必选项", trigger: "blur" }]
});
