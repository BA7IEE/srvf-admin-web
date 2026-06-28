import { h, ref, reactive } from "vue";
import dayjs from "dayjs";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { getMembers } from "@/api/srvf-member";
import PolicyForm, { type PolicyFormModel } from "../policy-form.vue";
import AddMemberForm, { type AddMemberFormModel } from "../add-member-form.vue";
import {
  getTeamInsurancePolicies,
  createTeamInsurancePolicy,
  updateTeamInsurancePolicy,
  deleteTeamInsurancePolicy,
  getCoverageMembers,
  addCoverageMember,
  addAllActiveCoverage,
  removeCoverageMember,
  type TeamInsurancePolicy,
  type CoverageMember
} from "@/api/srvf-team-insurance";

type MemberOption = { label: string; value: string };

export function useTeamInsurancePolicies() {
  const canRead = hasPerms("team-insurance-policy.read.record");
  const canCreate = hasPerms("team-insurance-policy.create.record");
  const canUpdate = hasPerms("team-insurance-policy.update.record");
  const canDelete = hasPerms("team-insurance-policy.delete.record");
  const canAddMember = hasPerms("team-insurance-policy.add.member");
  const canRemoveMember = hasPerms("team-insurance-policy.remove.member");

  const dataList = ref<TeamInsurancePolicy[]>([]);
  const loading = ref(false);
  const formRef = ref();
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  /* ----------------------------- 覆盖名单 drawer ----------------------------- */
  const coverageVisible = ref(false);
  const coveragePolicy = ref<TeamInsurancePolicy | null>(null);
  const coverageList = ref<CoverageMember[]>([]);
  const coverageLoading = ref(false);
  const coveragePagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });
  const memberOptions = ref<MemberOption[]>([]);
  let memberOptionsResolved = false;

  const columns: TableColumnList = [
    { label: "保险公司", prop: "insurerName", minWidth: 160 },
    { label: "保单号", prop: "policyNumber", minWidth: 160 },
    {
      label: "起保日",
      prop: "coverageStart",
      minWidth: 120,
      formatter: ({ coverageStart }) =>
        coverageStart ? dayjs(coverageStart).format("YYYY-MM-DD") : "—"
    },
    {
      label: "到期日",
      prop: "coverageEnd",
      minWidth: 120,
      formatter: ({ coverageEnd }) =>
        coverageEnd ? dayjs(coverageEnd).format("YYYY-MM-DD") : "—"
    },
    {
      label: "备注",
      prop: "note",
      minWidth: 160,
      formatter: ({ note }) => note ?? "—"
    },
    { label: "操作", fixed: "right" as const, width: 240, slot: "operation" }
  ];

  async function onSearch() {
    if (!canRead) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getTeamInsurancePolicies({
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
      message(error?.response?.data?.message ?? "加载队保单失败", {
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

  /** 新建 / 编辑队保单 */
  function openDialog(title: "新建" | "编辑", row?: TeamInsurancePolicy) {
    const isEdit = title === "编辑";
    addDialog({
      title: `${title}队保单`,
      width: "46%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          insurerName: row?.insurerName ?? "",
          policyNumber: row?.policyNumber ?? "",
          coverageStart: row?.coverageStart
            ? dayjs(row.coverageStart).format("YYYY-MM-DD")
            : "",
          coverageEnd: row?.coverageEnd
            ? dayjs(row.coverageEnd).format("YYYY-MM-DD")
            : "",
          note: row?.note ?? ""
        } as PolicyFormModel
      },
      contentRenderer: () => h(PolicyForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as PolicyFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          const payload = {
            insurerName: curData.insurerName,
            policyNumber: curData.policyNumber,
            coverageStart: curData.coverageStart,
            coverageEnd: curData.coverageEnd,
            note: curData.note
          };
          try {
            if (isEdit && row) {
              await updateTeamInsurancePolicy(row.id, payload);
              message("修改成功", { type: "success" });
            } else {
              await createTeamInsurancePolicy(payload);
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

  function handleDelete(row: TeamInsurancePolicy) {
    ElMessageBox.confirm(
      `确定删除队保单「${row.insurerName} · ${row.policyNumber}」吗？覆盖名单不级联删除。`,
      "删除队保单",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await deleteTeamInsurancePolicy(row.id);
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

  /* ----------------------------- 覆盖名单操作 ----------------------------- */

  async function coverageSearch() {
    const policy = coveragePolicy.value;
    if (!policy) return;
    coverageLoading.value = true;
    try {
      const { code, data } = await getCoverageMembers(policy.id, {
        page: coveragePagination.currentPage,
        pageSize: coveragePagination.pageSize
      });
      if (code === 0) {
        coverageList.value = data.items;
        coveragePagination.total = data.total;
        coveragePagination.pageSize = data.pageSize;
        coveragePagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载覆盖名单失败", {
        type: "error"
      });
    } finally {
      coverageLoading.value = false;
    }
  }

  function coverageSizeChange(val: number) {
    coveragePagination.pageSize = val;
    coverageSearch();
  }
  function coverageCurrentChange(val: number) {
    coveragePagination.currentPage = val;
    coverageSearch();
  }

  /** 打开某保单的覆盖名单 drawer */
  function openCoverage(row: TeamInsurancePolicy) {
    coveragePolicy.value = row;
    coverageVisible.value = true;
    coveragePagination.currentPage = 1;
    coverageList.value = [];
    coverageSearch();
  }

  /** 懒加载队员下拉(getMembers ACTIVE;空 → 退化) */
  async function ensureMemberOptions() {
    if (memberOptionsResolved) return;
    memberOptionsResolved = true;
    try {
      const { code, data } = await getMembers({
        status: "ACTIVE",
        pageSize: 100
      });
      if (code === 0) {
        memberOptions.value = data.items.map(m => ({
          label: `${m.displayName}（${m.memberNo}）`,
          value: m.id
        }));
      }
    } catch {
      // 无 member.read.record / 不可达 → 保持空
    }
  }

  /** 单加队员(弹队员选择) */
  async function handleAddMember() {
    const policy = coveragePolicy.value;
    if (!policy) return;
    await ensureMemberOptions();
    addDialog({
      title: "覆盖名单 · 单加队员",
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: { memberId: "" } as AddMemberFormModel,
        memberOptions: memberOptions.value
      },
      contentRenderer: () => h(AddMemberForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as AddMemberFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            await addCoverageMember(policy.id, curData.memberId);
            message("已加入名单", { type: "success" });
            done();
            coverageSearch();
          } catch (error: any) {
            message(error?.response?.data?.message ?? "加入失败", {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /** 全体在册一键加(仅 ACTIVE,幂等) */
  function handleAddAll() {
    const policy = coveragePolicy.value;
    if (!policy) return;
    ElMessageBox.confirm(
      `确定把全体在册(ACTIVE)队员一键加入「${policy.policyNumber}」覆盖名单吗？已在名单的跳过。`,
      "全体在册一键加",
      { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
    )
      .then(async () => {
        try {
          const { code, data } = await addAllActiveCoverage(policy.id);
          if (code === 0) {
            message(`已加入 ${data.addedCount} 人`, { type: "success" });
            coverageSearch();
          }
        } catch (error: any) {
          message(error?.response?.data?.message ?? "一键加入失败", {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 移除覆盖队员 */
  function handleRemoveMember(row: CoverageMember) {
    const policy = coveragePolicy.value;
    if (!policy) return;
    ElMessageBox.confirm(
      `确定从覆盖名单移除「${row.memberDisplayName}（${row.memberNo}）」吗？`,
      "移除覆盖",
      {
        confirmButtonText: "确定移除",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await removeCoverageMember(policy.id, row.memberId);
          message("已移除", { type: "success" });
          coverageSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? "移除失败", {
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
    canAddMember,
    canRemoveMember,
    loading,
    columns,
    dataList,
    pagination,
    onSearch,
    openDialog,
    handleDelete,
    openCoverage,
    handleSizeChange,
    handleCurrentChange,
    // 覆盖名单 drawer
    coverageVisible,
    coveragePolicy,
    coverageList,
    coverageLoading,
    coveragePagination,
    coverageSearch,
    coverageSizeChange,
    coverageCurrentChange,
    handleAddMember,
    handleAddAll,
    handleRemoveMember
  };
}
