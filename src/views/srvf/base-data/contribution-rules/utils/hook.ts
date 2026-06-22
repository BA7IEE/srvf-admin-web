import { h, ref, reactive } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import ContributionRuleForm, {
  type ContributionRuleFormModel
} from "../form.vue";
import {
  getContributionRules,
  createContributionRule,
  updateContributionRule,
  deleteContributionRule,
  type ContributionRuleItem
} from "@/api/srvf-contribution-rule";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";

export function useContributionRules() {
  /** 共享字典标签解析器：活动类型 / 考勤角色 code → 中文 */
  const dict = useSrvfDictStoreHook();
  dict.ensureTypes(["activity_type", "attendance_role"]);

  const dataList = ref<ContributionRuleItem[]>([]);
  const loading = ref(false);
  const formRef = ref();
  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染表格 */
  const canRead = hasPerms("contribution.read.rule");
  /** 写权限（按钮级显隐；SUPER_ADMIN 拥有全部码故全部可见） */
  const canCreate = hasPerms("contribution.create.rule");
  const canUpdate = hasPerms("contribution.update.rule");
  const canDelete = hasPerms("contribution.delete.rule");

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    {
      label: "活动类型",
      prop: "activityTypeCode",
      minWidth: 140,
      formatter: ({ activityTypeCode }) =>
        dict.label("activity_type", activityTypeCode)
    },
    {
      label: "考勤角色",
      prop: "attendanceRoleCode",
      minWidth: 130,
      formatter: ({ attendanceRoleCode }) =>
        dict.label("attendance_role", attendanceRoleCode)
    },
    {
      label: "时长阈值",
      prop: "durationThreshold",
      minWidth: 110,
      formatter: ({ durationThreshold }) => durationThreshold ?? "—"
    },
    { label: "阈下分", prop: "pointsBelow", minWidth: 90 },
    {
      label: "阈上分",
      prop: "pointsAbove",
      minWidth: 90,
      formatter: ({ pointsAbove }) => pointsAbove ?? "—"
    },
    { label: "状态", prop: "status", minWidth: 100, slot: "status" },
    ...(canUpdate || canDelete
      ? [
          {
            label: "操作",
            fixed: "right" as const,
            width: 210,
            slot: "operation"
          }
        ]
      : [])
  ];

  async function onSearch() {
    if (!canRead) return;
    loading.value = true;
    try {
      const { code, data } = await getContributionRules({
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
      message(error?.response?.data?.message ?? "加载贡献值规则失败", {
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

  /** 新建 / 编辑弹窗（编辑时仅提交后端白名单字段） */
  function openDialog(title: "新建" | "编辑", row?: ContributionRuleItem) {
    const isEdit = title === "编辑";
    addDialog({
      title: `${title}贡献值规则`,
      width: "42%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          activityTypeCode: row?.activityTypeCode ?? "",
          attendanceRoleCode: row?.attendanceRoleCode ?? "",
          durationThreshold: row?.durationThreshold ?? null,
          pointsBelow: row?.pointsBelow ?? 0,
          pointsAbove: row?.pointsAbove ?? null,
          dailyCap: row?.dailyCap ?? null,
          status: row?.status ?? "ACTIVE",
          remark: row?.remark ?? ""
        } as ContributionRuleFormModel
      },
      contentRenderer: () => h(ContributionRuleForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const formComp = formRef.value;
        const curData = options.props.formInline as ContributionRuleFormModel;
        formComp.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              // 后端 PATCH 白名单：仅 pointsBelow / pointsAbove / dailyCap / status / remark
              await updateContributionRule(row.id, {
                pointsBelow: curData.pointsBelow ?? 0,
                pointsAbove: curData.pointsAbove,
                dailyCap: curData.dailyCap,
                status: curData.status,
                remark: curData.remark === "" ? null : curData.remark
              });
              message("修改成功", { type: "success" });
            } else {
              await createContributionRule({
                activityTypeCode: curData.activityTypeCode,
                attendanceRoleCode: curData.attendanceRoleCode,
                durationThreshold: curData.durationThreshold,
                pointsBelow: curData.pointsBelow ?? 0,
                pointsAbove: curData.pointsAbove,
                dailyCap: curData.dailyCap,
                status: curData.status,
                remark: curData.remark === "" ? undefined : curData.remark
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

  /** 启停（无专用 status 端点 → 走 PATCH update + contribution.update.rule） */
  function handleToggleStatus(row: ContributionRuleItem) {
    const next = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const action = next === "ACTIVE" ? "启用" : "停用";
    ElMessageBox.confirm(`确定要${action}该贡献值规则吗？`, "系统提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        try {
          await updateContributionRule(row.id, { status: next });
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

  function handleDelete(row: ContributionRuleItem) {
    ElMessageBox.confirm(
      `确定要删除该贡献值规则吗？（活动类型 ${row.activityTypeCode} / 考勤角色 ${row.attendanceRoleCode}）`,
      "系统提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await deleteContributionRule(row.id);
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
