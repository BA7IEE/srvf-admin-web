import { bizErrorMessage } from "@/api/srvf-error";
import { h, ref } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { useSrvfList } from "@/srvf-kit";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import TjCycleForm, { type TjCycleFormModel } from "../form.vue";
import {
  getTeamJoinCycles,
  createTeamJoinCycle,
  updateTeamJoinCycle,
  TJ_CYCLE_STATUS_LABEL,
  type TeamJoinCycle
} from "@/api/srvf-team-join";

export function useTeamJoinCycles() {
  const router = useRouter();

  const canRead = hasPerms("team-join-cycle.read.record");
  const canCreate = hasPerms("team-join-cycle.create.record");
  const canUpdate = hasPerms("team-join-cycle.update.record");

  const formRef = ref();
  const {
    dataList,
    loading,
    pagination,
    onSearch,
    handleSizeChange,
    handleCurrentChange
  } = useSrvfList<TeamJoinCycle>({
    fetch: getTeamJoinCycles,
    buildParams: () => ({}),
    errorMessage: "加载入队轮失败",
    canRead
  });

  const columns: TableColumnList = [
    { label: "年度", prop: "year", minWidth: 90 },
    { label: "轮次名称", prop: "name", minWidth: 200 },
    { label: "状态", prop: "statusCode", minWidth: 100, slot: "statusCode" },
    {
      label: "创建时间",
      prop: "createdAt",
      minWidth: 165,
      formatter: ({ createdAt }) =>
        createdAt ? dayjs(createdAt).format("YYYY-MM-DD HH:mm") : "—"
    },
    { label: "操作", fixed: "right" as const, width: 220, slot: "operation" }
  ];

  function statusMeta(code: string) {
    return {
      text: TJ_CYCLE_STATUS_LABEL[code] ?? code,
      type: code === "open" ? ("success" as const) : ("info" as const)
    };
  }

  /** 新建 / 编辑（create:year/name；edit:name） */
  function openDialog(title: "新建" | "编辑", row?: TeamJoinCycle) {
    const isEdit = title === "编辑";
    addDialog({
      title: `${title}入队轮`,
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          isEdit,
          year: row?.year ?? new Date().getFullYear(),
          name: row?.name ?? ""
        } as TjCycleFormModel
      },
      contentRenderer: () => h(TjCycleForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const curData = options.props.formInline as TjCycleFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (isEdit && row) {
              await updateTeamJoinCycle(row.id, { name: curData.name });
              message("修改成功", { type: "success" });
            } else {
              await createTeamJoinCycle({
                year: curData.year as number,
                name: curData.name
              });
              message("新建成功", { type: "success" });
            }
            done();
            onSearch();
          } catch (error: any) {
            message(bizErrorMessage(error, "保存失败"), {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  /** 开启 / 关闭本轮（开 open 要求当前无其它 open 轮,后端裁决） */
  function handleToggleStatus(row: TeamJoinCycle) {
    const next = row.statusCode === "open" ? "closed" : "open";
    const action = next === "open" ? "开启" : "关闭";
    ElMessageBox.confirm(
      `确定要${action}入队轮「${row.year} · ${row.name}」吗？`,
      `${action}本轮`,
      { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
    )
      .then(async () => {
        try {
          await updateTeamJoinCycle(row.id, { statusCode: next });
          message(`${action}成功`, { type: "success" });
          onSearch();
        } catch (error: any) {
          message(bizErrorMessage(error, `${action}失败`), {
            type: "error"
          });
        }
      })
      .catch(() => {});
  }

  /** 进入入队作战室（cycle 详情页：入队申请审核 tab）；页签标题带轮次名 */
  function openCockpit(row: TeamJoinCycle) {
    useMultiTagsStoreHook().handleTags("push", {
      path: "/srvf/recruitment-domain/team-join/:id",
      name: "SrvfTeamJoinCycleCockpit",
      params: { id: row.id },
      meta: { title: `入队 · ${row.name}` }
    });
    router.push(`/srvf/recruitment-domain/team-join/${row.id}`);
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
