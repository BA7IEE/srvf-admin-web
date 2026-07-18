<script setup lang="ts">
import { bizErrorMessage } from "@/api/srvf-error";
import dayjs from "dayjs";
import { h, ref, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { deviceDetection } from "@pureadmin/utils";
import { addDialog } from "@/components/ReDialog";
import AddMemberForm, { type AddMemberFormModel } from "./add-member-form.vue";
import {
  getOrganizationMemberships,
  createMemberMembership,
  membershipBizErrorMessage,
  MEMBERSHIP_TYPE_LABEL,
  MEMBERSHIP_STATUS_LABEL,
  MEMBERSHIP_STATUS_TAG,
  type MembershipItem
} from "@/api/srvf-membership";
import { getOrgScopedMemberOptions } from "@/api/srvf-organization";
import { SrvfStatusTag } from "@/srvf-kit";

defineOptions({
  name: "SrvfOrgMembersDrawer"
});

/**
 * 组织成员面板（组织轴 memberships）。
 * ⚠️ handoff 踩坑 #9：该端点 status 缺省三态混返（含 ENDED/SUSPENDED 全历史），
 * 默认视图必须显式传 status=ACTIVE；「含历史」开关关掉 ACTIVE 过滤。
 * 「添加成员」是组织轴入口，复用队员360「组织归属」tab 同一条
 * `createMemberMembership`，只是选人来源换成本组织的 members/options 投影。
 */
const props = defineProps<{
  orgId: string;
  orgName: string;
}>();

const visible = defineModel<boolean>({ required: true });
const router = useRouter();
const canAdd = hasPerms("membership.set.record");
const addFormRef = ref();
const memberOptionsCache = ref<{ label: string; value: string }[]>([]);
/** 抽屉是父页单实例、orgId 随行切换复用——缓存必须按 orgId 失效，不能只判空 */
let memberOptionsCacheOrgId: string | null = null;

const dataList = ref<MembershipItem[]>([]);
const loading = ref(false);
/** 默认只看在册（关 = 含 ENDED/SUSPENDED 历史） */
const activeOnly = ref(true);
/** 是否含全部后代组织（默认仅本节点直属） */
const includeDescendants = ref(false);
const keyword = ref("");
const pagination = reactive<PaginationProps>({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

function typeLabel(code: string) {
  return MEMBERSHIP_TYPE_LABEL[code] ?? code;
}

async function onSearch() {
  if (!props.orgId) return;
  loading.value = true;
  try {
    const { code, data } = await getOrganizationMemberships(props.orgId, {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      expand: "member",
      ...(activeOnly.value ? { status: "ACTIVE" } : {}),
      ...(includeDescendants.value ? { includeDescendants: true } : {}),
      ...(keyword.value.trim() ? { q: keyword.value.trim() } : {})
    });
    if (code === 0) {
      dataList.value = data.items;
      pagination.total = data.total;
      pagination.pageSize = data.pageSize;
      pagination.currentPage = data.page;
    }
  } catch (error: any) {
    message(bizErrorMessage(error, "加载组织成员失败"), {
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

function goMember(row: MembershipItem) {
  visible.value = false;
  router.push(`/srvf/members-domain/members/${row.memberId}`);
}

/** 添加成员（组织轴入口）：懒加载本组织队员下拉，按 orgId 缓存复用，弹窗提交后刷新列表 */
async function openAddMemberDialog() {
  if (!props.orgId) return;
  if (memberOptionsCacheOrgId !== props.orgId) {
    memberOptionsCacheOrgId = props.orgId;
    try {
      const { code, data } = await getOrgScopedMemberOptions(props.orgId, {
        limit: 100
      });
      if (code === 0) {
        memberOptionsCache.value = data.items.map(m => ({
          label: `${m.label}（${m.memberNo}）`,
          value: m.id
        }));
      }
    } catch {
      // 拉取失败时下拉为空，不阻塞弹窗打开
    }
  }
  addDialog({
    title: `添加成员 — ${props.orgName}`,
    width: "40%",
    draggable: true,
    fullscreen: deviceDetection(),
    closeOnClickModal: false,
    sureBtnLoading: true,
    props: {
      formInline: {
        memberId: "",
        membershipType: "PRIMARY",
        reason: ""
      } as AddMemberFormModel,
      memberOptions: memberOptionsCache.value
    },
    contentRenderer: () => h(AddMemberForm, { ref: addFormRef }),
    beforeSure: (done, { options, closeLoading }) => {
      const cur = options.props.formInline as AddMemberFormModel;
      addFormRef.value.getRef().validate(async (valid: boolean) => {
        if (!valid) {
          closeLoading();
          return;
        }
        try {
          await createMemberMembership(cur.memberId, {
            organizationId: props.orgId,
            membershipType: cur.membershipType,
            ...(cur.reason ? { reason: cur.reason } : {})
          });
          message("添加成功", { type: "success" });
          done();
          onSearch();
        } catch (error: any) {
          message(membershipBizErrorMessage(error, "添加失败"), {
            type: "error"
          });
          closeLoading();
        }
      });
    }
  });
}

/** 打开时按当前节点重置并加载 */
watch(visible, v => {
  if (v && props.orgId) {
    pagination.currentPage = 1;
    onSearch();
  }
});
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="`${props.orgName} · 成员`"
    size="62%"
    destroy-on-close
  >
    <div class="drawer-toolbar">
      <el-button
        v-if="canAdd"
        type="primary"
        size="small"
        @click="openAddMemberDialog"
      >
        添加成员
      </el-button>
      <el-input
        v-model="keyword"
        class="w-48!"
        placeholder="搜队员（回车）"
        clearable
        @keyup.enter="onFilterChange"
        @clear="onFilterChange"
      />
      <el-checkbox v-model="activeOnly" @change="onFilterChange">
        仅在册
      </el-checkbox>
      <el-checkbox v-model="includeDescendants" @change="onFilterChange">
        含下级组织
      </el-checkbox>
    </div>
    <pure-table
      row-key="id"
      align-whole="center"
      table-layout="auto"
      :loading="loading"
      :data="dataList"
      :columns="[
        {
          label: '队员',
          prop: 'member',
          minWidth: 160,
          formatter: ({ member, memberId }) =>
            member ? `${member.displayName}（${member.memberNo}）` : memberId
        },
        {
          label: '类型',
          prop: 'membershipType',
          minWidth: 90,
          slot: 'membershipType'
        },
        { label: '状态', prop: 'status', minWidth: 90, slot: 'status' },
        {
          label: '起始',
          prop: 'startedAt',
          minWidth: 110,
          formatter: ({ startedAt }) =>
            startedAt ? dayjs(startedAt).format('YYYY-MM-DD') : '—'
        },
        {
          label: '结束',
          prop: 'endedAt',
          minWidth: 110,
          formatter: ({ endedAt }) =>
            endedAt ? dayjs(endedAt).format('YYYY-MM-DD') : '—'
        },
        { label: '操作', fixed: 'right', width: 110, slot: 'operation' }
      ]"
      :pagination="pagination"
      :header-cell-style="{
        background: 'var(--el-fill-color-light)',
        color: 'var(--el-text-color-primary)'
      }"
      @page-size-change="handleSizeChange"
      @page-current-change="handleCurrentChange"
    >
      <template #membershipType="{ row }">
        <el-tag :type="row.membershipType === 'PRIMARY' ? 'primary' : 'info'">
          {{ typeLabel(row.membershipType) }}
        </el-tag>
      </template>
      <template #status="{ row }">
        <SrvfStatusTag
          :value="row.status"
          :label-dict="MEMBERSHIP_STATUS_LABEL"
          :tag-dict="MEMBERSHIP_STATUS_TAG"
        />
      </template>
      <template #operation="{ row }">
        <el-button link @click="goMember(row)"> 队员档案 </el-button>
      </template>
    </pure-table>
  </el-drawer>
</template>

<style scoped lang="scss">
.drawer-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}
</style>
