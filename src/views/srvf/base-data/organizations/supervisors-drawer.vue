<script setup lang="ts">
import { bizErrorMessage } from "@/api/srvf-error";
import dayjs from "dayjs";
import { ref, watch } from "vue";
import { message } from "@/utils/message";
import {
  getOrganizationSupervisors,
  SCOPE_MODE_LABEL,
  type OrganizationSupervisorItem
} from "@/api/srvf-supervision";
import { resolveLabels } from "@/api/srvf-meta";

defineOptions({
  name: "SrvfOrgSupervisorsDrawer"
});

/**
 * 被谁分管面板（组织轴,只读展示;coverage 区分「直接分管」与「祖先 TREE 继承」）。
 * 撤销/新建分管走「督导总表」页,本面板只陈列。
 */
const props = defineProps<{
  orgId: string;
  orgName: string;
}>();

const visible = defineModel<boolean>({ required: true });

const dataList = ref<OrganizationSupervisorItem[]>([]);
const loading = ref(false);
const supervisorLabelById = ref<Record<string, string>>({});

function scopeModeLabel(code: string) {
  return SCOPE_MODE_LABEL[code] ?? code;
}
function fmt(v: string | null) {
  return v ? dayjs(v).format("YYYY-MM-DD") : "—";
}
function supervisorLabel(item: OrganizationSupervisorItem) {
  const s = item.supervisionAssignment.supervisor;
  if (s) return `${s.displayName}（${s.memberNo}）`;
  return (
    supervisorLabelById.value[item.supervisionAssignment.supervisorMemberId] ??
    item.supervisionAssignment.supervisorMemberId
  );
}

async function onSearch() {
  if (!props.orgId) return;
  loading.value = true;
  try {
    const { code, data } = await getOrganizationSupervisors(props.orgId);
    if (code === 0) {
      dataList.value = data;
      const memberIds = [
        ...new Set(data.map(it => it.supervisionAssignment.supervisorMemberId))
      ];
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
            supervisorLabelById.value = map;
          }
        } catch {
          // 解析失败回落显示原 id
        }
      }
    }
  } catch (error: any) {
    message(bizErrorMessage(error, "加载被谁分管失败"), {
      type: "error"
    });
  } finally {
    loading.value = false;
  }
}

watch(visible, v => {
  if (v && props.orgId) onSearch();
});
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="`${props.orgName} · 被谁分管`"
    size="54%"
    destroy-on-close
  >
    <pure-table
      row-key="supervisionAssignment.id"
      align-whole="center"
      table-layout="auto"
      :loading="loading"
      :data="dataList"
      :columns="[
        {
          label: '分管人',
          prop: 'supervisor',
          minWidth: 150,
          formatter: row => supervisorLabel(row)
        },
        {
          label: '覆盖范围',
          prop: 'scopeMode',
          minWidth: 110,
          slot: 'scopeMode'
        },
        { label: '来源', prop: 'coverage', minWidth: 100, slot: 'coverage' },
        {
          label: '起始',
          prop: 'startedAt',
          minWidth: 110,
          formatter: row => fmt(row.supervisionAssignment.startedAt)
        }
      ]"
      :header-cell-style="{
        background: 'var(--el-fill-color-light)',
        color: 'var(--el-text-color-primary)'
      }"
    >
      <template #scopeMode="{ row }">
        <el-tag
          :type="
            row.supervisionAssignment.scopeMode === 'TREE' ? 'primary' : 'info'
          "
        >
          {{ scopeModeLabel(row.supervisionAssignment.scopeMode) }}
        </el-tag>
      </template>
      <template #coverage="{ row }">
        <el-tag :type="row.coverage === 'DIRECT' ? 'success' : 'warning'">
          {{ row.coverage === "DIRECT" ? "直接分管" : "继承自上级" }}
        </el-tag>
      </template>
    </pure-table>
  </el-drawer>
</template>
