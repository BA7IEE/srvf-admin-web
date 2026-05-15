interface FormItemProps {
  /** 用于判断是`新增`还是`修改` */
  title: string;
  /** 租户名 */
  name: string;
  /** 租户套餐 */
  packageId: string;
  /** 联系人 */
  contactName: string;
  /** 联系电话 */
  contactMobile: string;
  /** 用户名称 */
  username: string;
  /** 用户密码 */
  password: string;
  /** 账号额度 */
  accountCount: number;
  /** 过期时间 */
  expireTime: string;
  /** 绑定域名 */
  website: string;
  /** 备注 */
  remark: string;
}
interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
