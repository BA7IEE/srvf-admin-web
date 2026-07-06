import { h, ref, reactive } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import CycleForm, { type CycleFormModel } from "../form.vue";
import {
  getRecruitmentCycles,
  createRecruitmentCycle,
  updateRecruitmentCycle,
  CYCLE_STATUS_LABEL,
  type RecruitmentCycle
} from "@/api/srvf-recruitment";

export function useRecruitmentCycles() {
  const router = useRouter();

  /** 读权限（后端真实 RBAC 码）；无权限不请求、不渲染 */
  const canRead = hasPerms("recruitment-cycle.read.record");
  const canCreate = hasPerms("recruitment-cycle.create.record");
  const canUpdate = hasPerms("recruitment-cycle.update.record");

  const dataList = ref<RecruitmentCycle[]>([]);
  const loading = ref(false);
  const formRef = ref();
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    { label: "年度", prop: "year", minWidth: 90 },
    { label: "轮次名称", prop: "name", minWidth: 180 },
    { label: "状态", prop: "statusCode", minWidth: 100, slot: "statusCode" },
    {
      label: "容量",
      prop: "capacity",
      minWidth: 90,
      formatter: ({ capacity }) => capacity ?? "不限"
    },
    { label: "已发号", prop: "issuedCount", minWidth: 90 },
    {
      label: "创建时间",
      prop: "createdAt",
      minWidth: 165,
      formatter: ({ createdAt }) =>
        createdAt ? dayjs(createdAt).format("YYYY-MM-DD HH:mm") : "—"
    },
    { label: "操作", fixed: "right" as const, width: 240, slot: "operation" }
  ];

  function statusMeta(code: string) {
    return {
      text: CYCLE_STATUS_LABEL[code] ?? code,
      type: code === "open" ? ("success" as const) : ("info" as const)
    };
  }

  async function onSearch() {
    if (!canRead) {
      dataList.value = [];
      return;
    }
    loading.value = true;
    try {
      const { code, data } = await getRecruitmentCycles({
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
      message(error?.response?.data?.message ?? "加载招新轮次失败", {
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

  /** 新建 / 编辑（create:year/name/capacity；edit:capacity/meetingInfo/qqGroup,白名单提交） */
  function openDialog(title: "新建" | "编辑", row?: RecruitmentCycle) {
    const isEdit = title === "编辑";
    addDialog({
      title: `${title}招新轮次`,
      width: "42%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          year: row?.year ?? new Date().getFullYear(),
          name: row?.name ?? "",
          capacity: row?.capacity ?? undefined,
          meetingInfo: row?.meetingInfo ?? "",
          qqGroup: row?.qqGroup ?? ""
        } as CycleFormModel
      },
      contentRenderer: () => h(CycleForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const formComp = formRef.value;
        const curData = options.props.formInline as CycleFormModel;
        formComp.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              await updateRecruitmentCycle(row.id, {
                ...(curData.capacity != null
                  ? { capacity: curData.capacity }
                  : {}),
                meetingInfo: curData.meetingInfo,
                qqGroup: curData.qqGroup
              });
              message("修改成功", { type: "success" });
            } else {
              await createRecruitmentCycle({
                year: curData.year as number,
                name: curData.name,
                ...(curData.capacity != null
                  ? { capacity: curData.capacity }
                  : {})
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

  /** 开启 / 关闭本轮（PATCH statusCode；开 open 要求当前无其它 open 轮,后端裁决 → 弹其 message） */
  function handleToggleStatus(row: RecruitmentCycle) {
    const next = row.statusCode === "open" ? "closed" : "open";
    const action = next === "open" ? "开启" : "关闭";
    ElMessageBox.confirm(
      `确定要${action}招新轮次「${row.year} · ${row.name}」吗？`,
      `${action}本轮`,
      { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
    )
      .then(async () => {
        try {
          await updateRecruitmentCycle(row.id, { statusCode: next });
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

  /** 进入招新作战室（cycle 详情页：报名审核 tab）；页签标题带轮次名 */
  function openCockpit(row: RecruitmentCycle) {
    useMultiTagsStoreHook().handleTags("push", {
      path: "/srvf/recruitment-domain/cycles/:id",
      name: "SrvfRecruitmentCycleCockpit",
      params: { id: row.id },
      meta: { title: `招新 · ${row.name}` }
    });
    router.push(`/srvf/recruitment-domain/cycles/${row.id}`);
  }

  return {
    canRead,
    canCreate,
    canUpdate,
    loading,
    columns,
    dataList,
    pagination,
    statusMeta,
    onSearch,
    openDialog,
    handleToggleStatus,
    openCockpit,
    handleSizeChange,
    handleCurrentChange
  };
}
