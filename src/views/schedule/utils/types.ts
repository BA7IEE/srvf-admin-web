interface FormItemProps {
  /** 排班内容 */
  scheduling: string;
  /** 排班班次 */
  classes: string;
  /** 开始日期 */
  startDate: string;
  /** 结束日期 */
  endDate: string;
  /** 备注 */
  remark: string;
}
interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
