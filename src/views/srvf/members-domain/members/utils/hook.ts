import { h, ref, reactive } from "vue";
import dayjs from "dayjs";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import MemberForm, {
  type MemberFormModel,
  type MemberGradeOption
} from "../form.vue";
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  updateMemberStatus,
  type MemberItem
} from "@/api/srvf-member";
import { getDictTypes, getDictItems } from "@/api/srvf-dict";

export function useMembers() {
  const dataList = ref<MemberItem[]>([]);
  const loading = ref(false);
  const formRef = ref();
  /** 等级下拉选项（来自 type=member_grade 字典；空数组 = 退化为文本输入） */
  const gradeOptions = ref<MemberGradeOption[]>([]);
  let gradeResolved = false;

  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染表格 */
  const canRead = hasPerms("member.read.record");
  /** 写权限（按钮级显隐；SUPER_ADMIN 拥有全部码故全部可见） */
  const canCreate = hasPerms("member.create.record");
  const canUpdate = hasPerms("member.update.record");
  const canDelete = hasPerms("member.delete.record");
  const canUpdateStatus = hasPerms("member.update.status");

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    { label: "队员编号", prop: "memberNo", minWidth: 150 },
    { label: "称呼", prop: "displayName", minWidth: 120 },
    {
      label: "等级",
      prop: "gradeCode",
      minWidth: 110,
      formatter: ({ gradeCode }) => gradeCode ?? "—"
    },
    { label: "状态", prop: "status", minWidth: 100, slot: "status" },
    {
      label: "创建时间",
      prop: "createdAt",
      minWidth: 170,
      formatter: ({ createdAt }) =>
        dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss")
    },
    ...(canUpdate || canUpdateStatus || canDelete
      ? [
          {
            label: "操作",
            fixed: "right" as const,
            width: 220,
            slot: "operation"
          }
        ]
      : [])
  ];

  async function onSearch() {
    if (!canRead) return;
    loading.value = true;
    try {
      const { code, data } = await getMembers({
        page: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载队员列表失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  /**
   * 懒加载 member_grade 字典做等级下拉。
   * 无 dict 读权限 / 查不到 type / 后端不可达 → 静默保持空 → 表单退化为文本输入。
   */
  async function ensureGradeOptions() {
    if (gradeResolved) return;
    gradeResolved = true;
    try {
      const { code, data } = await getDictTypes({
        status: "ACTIVE",
        pageSize: 100
      });
      if (code !== 0) return;
      const gradeType = data.items.find(t => t.code === "member_grade");
      if (!gradeType) return;
      const res = await getDictItems({
        typeId: gradeType.id,
        status: "ACTIVE",
        pageSize: 100
      });
      if (res.code === 0) {
        gradeOptions.value = res.data.items.map(i => ({
          label: i.label,
          value: i.code
        }));
      }
    } catch {
      // 无 dict 读权限 / 后端不可达 → 保持空 → 表单退化为文本输入
    }
  }

  /** 新建 / 编辑弹窗（编辑时 memberNo 置灰只读，仅提交后端白名单 displayName / gradeCode） */
  async function openDialog(title: "新建" | "编辑", row?: MemberItem) {
    await ensureGradeOptions();
    const isEdit = title === "编辑";
    addDialog({
      title: `${title}队员`,
      width: "42%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          memberNo: row?.memberNo ?? "",
          displayName: row?.displayName ?? "",
          gradeCode: row?.gradeCode ?? ""
        } as MemberFormModel,
        gradeOptions: gradeOptions.value
      },
      contentRenderer: () => h(MemberForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const formComp = formRef.value;
        const curData = options.props.formInline as MemberFormModel;
        formComp.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              // 后端 PATCH 白名单：仅 displayName / gradeCode（memberNo / status 禁改）
              await updateMember(row.id, {
                displayName: curData.displayName,
                ...(curData.gradeCode ? { gradeCode: curData.gradeCode } : {})
              });
              message("修改成功", { type: "success" });
            } else {
              await createMember({
                memberNo: curData.memberNo,
                displayName: curData.displayName,
                ...(curData.gradeCode ? { gradeCode: curData.gradeCode } : {})
              });
              message("新建成功", { type: "success" });
            }
            done();
            onSearch();
          } catch (error: any) {
            message(error?.response?.data?.message ?? "保存失败", {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /** 启用 / 停用（专用 status 端点 + member.update.status；ACTIVE↔INACTIVE） */
  function handleToggleStatus(row: MemberItem) {
    const next = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const action = next === "ACTIVE" ? "启用" : "停用";
    ElMessageBox.confirm(
      `确定要${action}队员「${row.displayName}（${row.memberNo}）」吗？`,
      "系统提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await updateMemberStatus(row.id, next);
          message(`${action}成功`, { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? `${action}失败`, {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 删除（删前 confirm；后端软删，有 active 部门 / 绑定 user 会拒绝并回传 message） */
  function handleDelete(row: MemberItem) {
    ElMessageBox.confirm(
      `确定要删除队员「${row.displayName}（${row.memberNo}）」吗？`,
      "系统提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await deleteMember(row.id);
          message("删除成功", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? "删除失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canUpdateStatus,
    loading,
    columns,
    dataList,
    pagination,
    onSearch,
    openDialog,
    handleDelete,
    handleToggleStatus,
    handleSizeChange,
    handleCurrentChange
  };
}
