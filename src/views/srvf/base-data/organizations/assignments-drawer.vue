<script setup lang="ts">
import { bizErrorMessage } from "@/api/srvf-error";
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import dayjs from "dayjs";
import { h, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import {
  getPositionOptions,
  type PositionOptionItem
} from "@/api/srvf-position";
import {
  getOrgPositionAssignments,
  createPositionAssignment,
  previewPositionAssignment,
  revokePositionAssignment,
  getPositionAssignmentHistory,
  getMemberOptions,
  ASSIGNMENT_STATUS_TAG,
  type PositionAssignmentItem,
  type MemberOptionItem
} from "@/api/srvf-position-assignment";
import { resolveLabels } from "@/api/srvf-meta";
import AssignPositionForm, {
  type AssignPositionFormModel
} from "./assign-position-form.vue";
import AssignmentHistory from "./assignment-history.vue";

defineOptions({
  name: "SrvfOrgAssignmentsDrawer"
});

/**
 * 在任职务面板（组织轴+队员轴双轴子资源;本面板走组织轴)。
 * 组织轴端点恒 status=ACTIVE(后端固定语义,无 status 参数);任命/撤销都发生在本轴,
 * 队员 360「任职」tab 走队员轴,只读全历史,不承载写操作(后端 handoff 原文)。
 */
const props = defineProps<{
  orgId: string;
  orgName: string;
}>();

const visible = defineModel<boolean>({ required: true });

const canRead = hasPerms("position-assignment.read.record");
const canCreate = hasPerms("position-assignment.create.record");
const canRevoke = hasPerms("position-assignment.revoke.record");
const canHistory = hasPerms("position-assignment.read.history");

const dataList = ref<PositionAssignmentItem[]>([]);
const loading = ref(false);
const formRef = ref();

/** 职务名(options 端点;limit 后端硬校验≤100) + 队员名(resolveLabels 批量解析) */
const positionOptions = ref<PositionOptionItem[]>([]);
const positionNameById = ref<Record<string, string>>({});
let positionsResolved = false;
const memberLabelById = ref<Record<string, string>>({});
/** 任命弹窗的队员候选(与展示解析分开缓存,避免把全库队员都拉进 memberLabelById) */
const memberOptions = ref<MemberOptionItem[]>([]);
let memberOptionsResolved = false;

async function ensurePositionOptions() {
  if (positionsResolved) return;
  positionsResolved = true;
  try {
    const { code, data } = await getPositionOptions({ limit: 100 });
    if (code === 0) {
      positionOptions.value = data.items;
      const map: Record<string, string> = {};
      for (const it of data.items) map[it.id] = it.label;
      positionNameById.value = map;
    }
  } catch {
    // 无职务读权限 → 职务列回落显示 id
  }
}

async function ensureMemberOptions() {
  if (memberOptionsResolved) return;
  memberOptionsResolved = true;
  try {
    const { code, data } = await getMemberOptions({ limit: 100 });
    if (code === 0) memberOptions.value = data.items;
  } catch {
    // 无队员读权限 → 任命弹窗队员下拉为空
  }
}

function positionLabel(id: string) {
  return positionNameById.value[id] ?? id;
}
function memberLabel(id: string) {
  return memberLabelById.value[id] ?? id;
}
function statusTag(status: string) {
  return ASSIGNMENT_STATUS_TAG[status] ?? ("info" as const);
}
function fmt(v: string | null) {
  return v ? dayjs(v).format("YYYY-MM-DD") : "—";
}

async function onSearch() {
  if (!canRead || !props.orgId) return;
  loading.value = true;
  try {
    await ensurePositionOptions();
    const { code, data } = await getOrgPositionAssignments(props.orgId);
    if (code === 0) {
      dataList.value = data;
      const memberIds = [...new Set(data.map(a => a.memberId))];
      if (memberIds.length) {
        try {
          const res = await resolveLabels({
            refs: memberIds.map(id => ({ type: "member" as const, id }))
          });
          if (res.code === 0) {
            const map: Record<string, string> = {};
            for (const id of memberIds) {
              const hit = res.data.member?.[id];
              if (hit) map[id] = hit.label;
            }
            memberLabelById.value = map;
          }
        } catch {
          // 解析失败不阻塞列表 → 回落显示原 id
        }
      }
    }
  } catch (error: any) {
    message(bizErrorMessage(error, "加载在任职务失败"), {
      type: "error"
    });
  } finally {
    loading.value = false;
  }
}

/** 任命：预检不通过时把 violations 写回同一份 options.props（与 dialog 同引用,响应式），不关闭弹窗。 */
async function openAssignDialog() {
  await Promise.all([ensurePositionOptions(), ensureMemberOptions()]);
  const initial: AssignPositionFormModel = {
    positionId: "",
    memberId: "",
    startedAt: dayjs().format("YYYY-MM-DD"),
    endedAt: "",
    isConcurrent: false,
    appointmentSource: "",
    note: ""
  };
  addDialog({
    title: `任命 · ${props.orgName}`,
    width: "52%",
    draggable: true,
    fullscreen: deviceDetection(),
    fullscreenIcon: true,
    closeOnClickModal: false,
    sureBtnLoading: true,
    props: {
      formInline: initial,
      positionOptions: positionOptions.value,
      memberOptions: memberOptions.value,
      violations: []
    },
    contentRenderer: () => h(AssignPositionForm, { ref: formRef }),
    beforeSure: (done, { options, closeLoading }) => {
      const curData = options.props.formInline as AssignPositionFormModel;
      formRef.value.getRef().validate(async (valid: boolean) => {
        if (!valid) {
          closeLoading();
          return;
        }
        const body = {
          positionId: curData.positionId,
          memberId: curData.memberId,
          startedAt: curData.startedAt,
          ...(curData.endedAt ? { endedAt: curData.endedAt } : {}),
          isConcurrent: curData.isConcurrent,
          ...(curData.appointmentSource
            ? { appointmentSource: curData.appointmentSource }
            : {}),
          ...(curData.note ? { note: curData.note } : {})
        };
        try {
          const preview = await previewPositionAssignment({
            organizationId: props.orgId,
            ...body
          });
          if (preview.code === 0 && !preview.data.valid) {
            // 预检不通过：violations 写回同一份 props（dialogStore 项本身是响应式对象）→ 弹窗内联展示,不关闭
            options.props.violations = preview.data.violations;
            closeLoading();
            return;
          }
        } catch (error: any) {
          message(bizErrorMessage(error, "预检失败"), {
            type: "error"
          });
          closeLoading();
          return;
        }
        try {
          await createPositionAssignment(props.orgId, body);
          message("任命成功", { type: "success" });
          done();
          onSearch();
        } catch (error: any) {
          message(bizErrorMessage(error, "任命失败"), {
            type: "error"
          });
          closeLoading();
        }
      });
    }
  });
}

/** 撤销（status → REVOKED，无请求体；后端拒绝弹其 message） */
function handleRevoke(row: PositionAssignmentItem) {
  ElMessageBox.confirm(
    `确定撤销「${memberLabel(row.memberId)}」的「${positionLabel(row.positionId)}」职务吗？`,
    "撤销任职",
    {
      confirmButtonText: "确定撤销",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(async () => {
      try {
        await revokePositionAssignment(row.id);
        message("撤销成功", { type: "success" });
        onSearch();
      } catch (error: any) {
        message(bizErrorMessage(error, "撤销失败"), {
          type: "error"
        });
      }
    })
    .catch(() => {});
}

/** 历史链（以该记录 id 锚定的人-组织-职务三元组全量历史） */
function openHistory(row: PositionAssignmentItem) {
  const historyItems = ref<PositionAssignmentItem[]>([]);
  const historyLoading = ref(true);
  addDialog({
    title: `任职历史 · ${memberLabel(row.memberId)} / ${positionLabel(row.positionId)}`,
    width: "44%",
    draggable: true,
    hideFooter: true,
    contentRenderer: () =>
      h(AssignmentHistory, {
        items: historyItems.value,
        loading: historyLoading.value
      })
  });
  getPositionAssignmentHistory(row.id)
    .then(({ code, data }) => {
      if (code === 0) historyItems.value = data;
    })
    .catch((error: any) => {
      message(bizErrorMessage(error, "加载历史失败"), {
        type: "error"
      });
    })
    .finally(() => {
      historyLoading.value = false;
    });
}

watch(visible, v => {
  if (v && props.orgId) onSearch();
});
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="`${props.orgName} · 在任职务`"
    size="58%"
    destroy-on-close
  >
    <div class="drawer-toolbar">
      <el-button v-if="canCreate" type="primary" @click="openAssignDialog">
        任命
      </el-button>
    </div>
    <pure-table
      v-if="canRead"
      row-key="id"
      align-whole="center"
      table-layout="auto"
      :loading="loading"
      :data="dataList"
      :columns="[
        {
          label: '职务',
          prop: 'positionId',
          minWidth: 110,
          formatter: ({ positionId }) => positionLabel(positionId)
        },
        {
          label: '队员',
          prop: 'memberId',
          minWidth: 130,
          formatter: ({ memberId }) => memberLabel(memberId)
        },
        {
          label: '兼任',
          prop: 'isConcurrent',
          minWidth: 70,
          slot: 'isConcurrent'
        },
        {
          label: '起始',
          prop: 'startedAt',
          minWidth: 110,
          formatter: ({ startedAt }) => fmt(startedAt)
        },
        {
          label: '来源',
          prop: 'appointmentSource',
          minWidth: 100,
          formatter: ({ appointmentSource }) => appointmentSource ?? '—'
        },
        { label: '操作', fixed: 'right', width: 140, slot: 'operation' }
      ]"
      :header-cell-style="{
        background: 'var(--el-fill-color-light)',
        color: 'var(--el-text-color-primary)'
      }"
    >
      <template #isConcurrent="{ row }">
        <el-tag :type="row.isConcurrent ? 'warning' : 'info'">
          {{ row.isConcurrent ? "是" : "否" }}
        </el-tag>
      </template>
      <template #operation="{ row }">
        <el-button
          v-if="canHistory"
          class="reset-margin"
          link
          type="primary"
          @click="openHistory(row)"
        >
          历史
        </el-button>
        <el-button
          v-if="canRevoke"
          class="reset-margin"
          link
          type="danger"
          @click="handleRevoke(row)"
        >
          撤销
        </el-button>
      </template>
    </pure-table>
    <SrvfPermEmpty
      v-else
      action="查看在任职务"
      code="position-assignment.read.record"
    />
  </el-drawer>
</template>

<style scoped lang="scss">
.drawer-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
</style>
