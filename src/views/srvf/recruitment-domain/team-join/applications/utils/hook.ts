import dayjs from "dayjs";
import { h, ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { getOrganizations } from "@/api/srvf-organization";
import {
  getTeamJoinApplications,
  getTeamJoinApplication,
  markGate,
  evaluateTeamJoinApplication,
  joinTeam,
  TJ_APP_STATUS_LABEL,
  TJ_APP_STATUS_TAG,
  type TeamJoinApplication
} from "@/api/srvf-team-join";
import GateForm, { type GateFormModel } from "../gate-form.vue";
import JoinForm, { type JoinFormModel } from "../join-form.vue";

/** 可标 gate 态(后端:joining/pending_evaluation) */
const GATE_EDITABLE_STATUS = ["joining", "pending_evaluation"];
/** 可综合评估态(后端:pending_evaluation) */
const EVALUATE_STATUS = ["pending_evaluation"];
/** 可一键入队态(后端:approved=综合评估通过待入队) */
const JOIN_STATUS = ["approved"];

/**
 * @param cycleId 入队轮 id（来自入队作战室路由参数）。申请按 cycleId 过滤,无页内轮次下拉。
 */
export function useTeamJoinApplications(cycleId: string) {
  const router = useRouter();

  const canRead = hasPerms("team-join-application.read.record");
  const canMarkGate = hasPerms("team-join-application.mark.gate");
  const canEvaluate = hasPerms("team-join-application.evaluate.assessment");
  const canJoin = hasPerms("team-join-application.join.member");

  const dataList = ref<TeamJoinApplication[]>([]);
  const loading = ref(false);
  const statusFilter = ref<string>("");
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const detailVisible = ref(false);
  const detailLoading = ref(false);
  const detailData = ref<TeamJoinApplication | null>(null);

  const gateFormRef = ref();
  const joinFormRef = ref();

  const statusOptions = computed(() => [
    { value: "", label: "全部状态" },
    ...Object.keys(TJ_APP_STATUS_LABEL).map(code => ({
      value: code,
      label: TJ_APP_STATUS_LABEL[code]
    }))
  ]);

  const columns: TableColumnList = [
    {
      label: "队员",
      prop: "memberDisplayName",
      minWidth: 140,
      formatter: ({ memberDisplayName, memberNo, memberId }) =>
        memberDisplayName ?? memberNo ?? memberId
    },
    {
      label: "队员编号",
      prop: "memberNo",
      minWidth: 130,
      formatter: ({ memberNo }) => memberNo ?? "—"
    },
    { label: "状态", prop: "statusCode", minWidth: 130, slot: "statusCode" },
    {
      label: "通用门槛",
      prop: "generalGatesSatisfied",
      minWidth: 100,
      formatter: ({ generalGatesSatisfied }) =>
        generalGatesSatisfied ? "已满足" : "未满足"
    },
    {
      label: "贡献值",
      prop: "contributionPoints",
      minWidth: 100,
      formatter: ({ contributionPoints }) => contributionPoints ?? "—"
    },
    {
      label: "申请时间",
      prop: "createdAt",
      minWidth: 165,
      formatter: ({ createdAt }) =>
        createdAt ? dayjs(createdAt).format("YYYY-MM-DD HH:mm") : "—"
    },
    { label: "操作", fixed: "right" as const, width: 300, slot: "operation" }
  ];

  function statusMeta(code: string) {
    return {
      text: TJ_APP_STATUS_LABEL[code] ?? code,
      type: TJ_APP_STATUS_TAG[code] ?? ("info" as const)
    };
  }

  function rowSubject(row: TeamJoinApplication) {
    return row.memberDisplayName ?? row.memberNo ?? row.memberId;
  }

  function canDoGate(row: TeamJoinApplication) {
    return canMarkGate && GATE_EDITABLE_STATUS.includes(row.statusCode);
  }
  function canDoEvaluate(row: TeamJoinApplication) {
    return canEvaluate && EVALUATE_STATUS.includes(row.statusCode);
  }
  function canDoJoin(row: TeamJoinApplication) {
    return canJoin && JOIN_STATUS.includes(row.statusCode);
  }

  async function onSearch() {
    if (!canRead || !cycleId) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getTeamJoinApplications({
        cycleId,
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        ...(statusFilter.value ? { statusCode: statusFilter.value } : {})
      });
      if (code === 0) {
        dataList.value = data.items;
        pagination.total = data.total;
        pagination.pageSize = data.pageSize;
        pagination.currentPage = data.page;
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载入队申请失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  function onFilterChange() {
    pagination.currentPage = 1;
    onSearch();
  }
  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }
  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  /** 查看详情（drawer 内 gates 实况 + 贡献值 + 候选/选定部门） */
  async function openDetail(row: TeamJoinApplication) {
    detailVisible.value = true;
    detailLoading.value = true;
    detailData.value = null;
    try {
      const { code, data } = await getTeamJoinApplication(row.id);
      if (code === 0) detailData.value = data;
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载申请详情失败", {
        type: "error"
      });
    } finally {
      detailLoading.value = false;
    }
  }

  /** 标 gate（dialog 选考核项 + 结果 + 完成日；幂等；末次 8 通用全过 + 贡献值≥5 自动推进） */
  function openGateDialog(row: TeamJoinApplication) {
    addDialog({
      title: `标记考核 · ${rowSubject(row)}`,
      width: "42%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          gateCode: "",
          passed: true,
          completionDate: "",
          extendedUntil: ""
        } as GateFormModel
      },
      contentRenderer: () => h(GateForm, { ref: gateFormRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as GateFormModel;
        gateFormRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            await markGate(row.id, {
              gateCode: curData.gateCode,
              passed: curData.passed,
              completionDate: curData.completionDate,
              ...(curData.extendedUntil
                ? { extendedUntil: curData.extendedUntil }
                : {})
            });
            message("已标记", { type: "success" });
            done();
            onSearch();
          } catch (error: any) {
            message(error?.response?.data?.message ?? "标记失败", {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /** 综合评估（pending_evaluation；通过→待入队 / 淘汰→未通过；note 淘汰必填） */
  function handleEvaluate(row: TeamJoinApplication, approved: boolean) {
    const title = approved ? "评估通过" : "评估淘汰";
    ElMessageBox.prompt(
      approved
        ? `确定评估通过「${rowSubject(row)}」吗？通过后待入队。可填写备注（可空）。`
        : `确定淘汰「${rowSubject(row)}」吗？请填写淘汰理由（必填）。`,
      title,
      {
        confirmButtonText: `确定${title}`,
        cancelButtonText: "返回",
        type: approved ? "info" : "warning",
        inputType: "textarea",
        inputPlaceholder: approved
          ? "评估备注（可空；≤ 500）"
          : "淘汰理由（必填；≤ 500）",
        inputValidator: (val: string) => {
          if (!approved && (!val || !val.trim())) return "淘汰理由为必填项";
          if (val && val.length > 500) return "不能超过 500 字";
          return true;
        }
      }
    )
      .then(async ({ value }) => {
        try {
          await evaluateTeamJoinApplication(row.id, {
            approved,
            ...(value ? { note: value } : {})
          });
          message(approved ? "已评估通过" : "已淘汰", { type: "success" });
          onSearch();
        } catch (error: any) {
          message(error?.response?.data?.message ?? `${title}失败`, {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 一键入队（approved；从候选部门选定单一 org → 设部门 + level-1 → joined） */
  async function openJoinDialog(row: TeamJoinApplication) {
    // 候选部门 id → 名称（解析失败退化为 id）
    let orgOptions = row.targetOrganizationIds.map(id => ({
      label: id,
      value: id
    }));
    try {
      const { code, data } = await getOrganizations({
        status: "ACTIVE",
        pageSize: 100
      });
      if (code === 0) {
        const nameMap = new Map(data.items.map(o => [o.id, o.name]));
        orgOptions = row.targetOrganizationIds.map(id => ({
          label: nameMap.get(id) ?? id,
          value: id
        }));
      }
    } catch {
      // 无 org 读权限 / 不可达 → 保持 id 退化展示
    }
    addDialog({
      title: `一键入队 · ${rowSubject(row)}`,
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          organizationId: row.selectedOrganizationId ?? ""
        } as JoinFormModel,
        orgOptions
      },
      contentRenderer: () => h(JoinForm, { ref: joinFormRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as JoinFormModel;
        joinFormRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            await joinTeam(row.id, { organizationId: curData.organizationId });
            message("入队成功", { type: "success" });
            done();
            onSearch();
          } catch (error: any) {
            message(error?.response?.data?.message ?? "入队失败", {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /** 已入队 → 跳队员作战室查看该 Member */
  function goMember(row: TeamJoinApplication) {
    if (row.memberId) {
      router.push(`/srvf/members-domain/members/${row.memberId}`);
    }
  }

  return {
    canRead,
    loading,
    statusFilter,
    statusOptions,
    columns,
    dataList,
    pagination,
    statusMeta,
    detailVisible,
    detailLoading,
    detailData,
    onSearch,
    onFilterChange,
    canDoGate,
    canDoEvaluate,
    canDoJoin,
    openDetail,
    openGateDialog,
    handleEvaluate,
    openJoinDialog,
    goMember,
    handleSizeChange,
    handleCurrentChange
  };
}
