<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import dayjs from "dayjs";
import { message } from "@/utils/message";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import { getMember, type MemberItem } from "@/api/srvf-member";
import { useCertificates } from "../certificates/utils/hook";
import { useMemberInsurances } from "../insurances/utils/hook";
import { useEmergencyContacts } from "../emergency-contacts/utils/hook";
import { useMemberDepartment } from "../department/utils/hook";
import { useMemberMemberships } from "../memberships/utils/hook";
import { useMemberPositionAssignments } from "../position-assignments/utils/hook";
import { useMemberSupervisionScope } from "../supervision-scope/utils/hook";
import { useMemberProfile } from "../profile/utils/hook";
import {
  useMemberRegistrations,
  useMemberAttendanceRecords,
  useMemberContribution
} from "../participation/utils/hook";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SrvfMemberCockpit"
});

/** 实体 id 来自路由参数（该路由不入 keepAlive → 每次进来重新挂载，setup 取一次即可靠） */
const route = useRoute();
const memberId = route.params.id as string;

/** 共享字典：队员等级 member_grade code → 中文（证书 tab 的 cert_status 由 useCertificates 预热同一 store） */
const dict = useSrvfDictStoreHook();
dict.ensureTypes(["member_grade"]);

/**
 * 显式锚定默认激活 tab：EP el-tabs 无 v-model/default-value 时 currentName 默认 "0"，
 * 与所有具名 tab-pane 都不匹配 → 首屏所有 pane 被 v-show 隐藏，点一下才显示。
 * 本页 tab-pane 恒渲染（权限门在 pane 内部 template v-if 上，无权时退化为空态提示），
 * 故初始化为第一个 tab「证书」即可稳定落屏。
 */
const activeTab = ref<
  | "certificates"
  | "insurances"
  | "emergency-contacts"
  | "department"
  | "memberships"
  | "position-assignments"
  | "supervision-scope"
  | "profile"
  | "registrations-history"
  | "attendance-records"
  | "contribution"
>("certificates");

/* ----------------------------- 头部：队员基本信息 ----------------------------- */
const detail = ref<MemberItem | null>(null);
const detailLoading = ref(false);

/** 拉队员详情（GET /members/{id}，rbac member.read.record；404 / 无权 → 头部退化为空态提示） */
async function fetchDetail() {
  detailLoading.value = true;
  try {
    const { code, data } = await getMember(memberId);
    if (code === 0) detail.value = data;
  } catch (error: any) {
    message(error?.response?.data?.message ?? "加载队员详情失败", {
      type: "error"
    });
  } finally {
    detailLoading.value = false;
  }
}

/* --------------- Tab：证书（复用既有 hook，memberId 由路由参数注入；无队员下拉） --------------- */
const {
  canRead: certCanRead,
  canCreate: certCanCreate,
  canUpdate: certCanUpdate,
  canDelete: certCanDelete,
  canVerify: certCanVerify,
  canReject: certCanReject,
  loading: certLoading,
  columns: certColumns,
  dataList: certDataList,
  certStatusTagType,
  onSearch: certOnSearch,
  openDialog: certOpenDialog,
  handleDelete: certHandleDelete,
  handleVerify: certHandleVerify,
  handleReject: certHandleReject,
  qualCheckCertType,
  qualCheckLoading,
  qualCheckResult,
  checkQualification
} = useCertificates(memberId);

/* --------------- Tab：保险（只读，复用 hook，memberId 由路由参数注入；无队员下拉） --------------- */
const {
  canRead: insCanRead,
  loading: insLoading,
  columns: insColumns,
  dataList: insDataList,
  isActive: insIsActive,
  onSearch: insOnSearch
} = useMemberInsurances(memberId);

/* --------------- Tab：紧急联系人（CRUD，复用 hook，memberId 由路由参数注入；无队员下拉） --------------- */
const {
  canRead: ecCanRead,
  canCreate: ecCanCreate,
  canUpdate: ecCanUpdate,
  canDelete: ecCanDelete,
  loading: ecLoading,
  columns: ecColumns,
  dataList: ecDataList,
  onSearch: ecOnSearch,
  openDialog: ecOpenDialog,
  handleDelete: ecHandleDelete
} = useEmergencyContacts(memberId);

/* --------------- Tab：部门（单值子资源：读/设/清，memberId 由路由参数注入；无队员下拉） --------------- */
const {
  canRead: deptCanRead,
  canSet: deptCanSet,
  canClear: deptCanClear,
  loading: deptLoading,
  department: deptDepartment,
  currentOrgName: deptCurrentOrgName,
  onSearch: deptOnSearch,
  handleSet: deptHandleSet,
  handleClear: deptHandleClear
} = useMemberDepartment(memberId);

/* --------------- Tab：组织归属（memberships 多归属，含新增/编辑/结束/迁移写操作；旧「部门」tab 为 deprecated 单值端点） --------------- */
const {
  canRead: msCanRead,
  canSet: msCanSet,
  canEnd: msCanEnd,
  canTransfer: msCanTransfer,
  loading: msLoading,
  columns: msColumns,
  dataList: msDataList,
  orgLabel: msOrgLabel,
  typeLabel: msTypeLabel,
  statusMeta: msStatusMeta,
  onSearch: msOnSearch,
  openDialog: msOpenDialog,
  handleEnd: msHandleEnd,
  openTransferDialog: msOpenTransferDialog
} = useMemberMemberships(memberId);

/* --------------- Tab：任职（队员轴,双轴子资源只读端;任命/撤销在组织架构页「在任职务」面板） --------------- */
const {
  canRead: paCanRead,
  loading: paLoading,
  columns: paColumns,
  dataList: paDataList,
  positionLabel: paPositionLabel,
  orgLabel: paOrgLabel,
  statusMeta: paStatusMeta,
  onSearch: paOnSearch
} = useMemberPositionAssignments(memberId);

/* --------------- Tab：分管范围（该队员若是分管人,只读展示;新建/撤销在督导总表页） --------------- */
const {
  canRead: ssCanRead,
  loading: ssLoading,
  columns: ssColumns,
  dataList: ssDataList,
  scopeModeLabel: ssScopeModeLabel,
  expandedLabels: ssExpandedLabels,
  onSearch: ssOnSearch
} = useMemberSupervisionScope(memberId);

/* --------------- Tab：档案（1:1 子资源：读 + 新建/编辑，memberId 由路由参数注入；无队员下拉） --------------- */
const {
  canRead: profileCanRead,
  canCreate: profileCanCreate,
  canUpdate: profileCanUpdate,
  loading: profileLoading,
  profile: profileData,
  displayRows: profileDisplayRows,
  onSearch: profileOnSearch,
  openDialog: profileOpenDialog
} = useMemberProfile(memberId);

/* --------------- Tab：活动履历（队员跨活动报名,只读;沿队员轴下钻,memberId 由路由参数注入） --------------- */
const {
  canRead: regCanRead,
  loading: regLoading,
  statusFilter: regStatusFilter,
  statusOptions: regStatusOptions,
  columns: regColumns,
  dataList: regDataList,
  pagination: regPagination,
  statusMeta: regStatusMeta,
  onSearch: regOnSearch,
  onFilterChange: regOnFilterChange,
  handleSizeChange: regHandleSizeChange,
  handleCurrentChange: regHandleCurrentChange
} = useMemberRegistrations(memberId);

/* --------------- Tab：考勤记录（仅 approved sheet 内 records,只读） --------------- */
const {
  canRead: arecCanRead,
  loading: arecLoading,
  columns: arecColumns,
  dataList: arecDataList,
  pagination: arecPagination,
  onSearch: arecOnSearch,
  handleSizeChange: arecHandleSizeChange,
  handleCurrentChange: arecHandleCurrentChange
} = useMemberAttendanceRecords(memberId);

/* --------------- Tab：贡献值（生涯累计 capped 总分,只读单值;直接展示别再算） --------------- */
const {
  canRead: contribCanRead,
  loading: contribLoading,
  summary: contribSummary,
  onSearch: contribOnSearch
} = useMemberContribution(memberId);

onMounted(() => {
  fetchDetail();
  // onSearch 自带 canRead + memberId 守卫；memberId 已由路由注入，有读码即加载对应子资源
  certOnSearch();
  insOnSearch();
  ecOnSearch();
  deptOnSearch();
  msOnSearch();
  paOnSearch();
  ssOnSearch();
  profileOnSearch();
  regOnSearch();
  arecOnSearch();
  contribOnSearch();
});
</script>

<template>
  <div class="main">
    <!-- 头部：队员基本信息 -->
    <el-card v-loading="detailLoading" shadow="never" class="mb-2">
      <template v-if="detail">
        <div class="cockpit-header">
          <div class="cockpit-header__title">
            <span class="cockpit-header__name">{{ detail.displayName }}</span>
            <el-tag :type="detail.status === 'ACTIVE' ? 'success' : 'info'">
              {{ detail.status === "ACTIVE" ? "在队" : "离队" }}
            </el-tag>
          </div>
        </div>
        <el-descriptions :column="3" border class="mt-3">
          <el-descriptions-item label="队员编号">
            {{ detail.memberNo }}
          </el-descriptions-item>
          <el-descriptions-item label="等级">
            {{ dict.label("member_grade", detail.gradeCode) }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{
              detail.createdAt
                ? dayjs(detail.createdAt).format("YYYY-MM-DD HH:mm")
                : "—"
            }}
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <el-empty
        v-else-if="!detailLoading"
        description="未找到该队员或无权查看"
      />
    </el-card>

    <!-- Tab：证书（复用证书 list hook，无需再选队员） -->
    <el-tabs v-model="activeTab" class="cockpit-tabs">
      <el-tab-pane label="证书" name="certificates">
        <template v-if="certCanRead">
          <el-card shadow="never" class="mb-4">
            <template #header>资质核验</template>
            <div class="qual-check-row">
              <el-select
                v-model="qualCheckCertType"
                filterable
                clearable
                placeholder="选择证书大类"
                class="w-64!"
              >
                <el-option
                  v-for="opt in dict.options('cert_type')"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <el-button
                type="primary"
                :loading="qualCheckLoading"
                :disabled="!qualCheckCertType"
                @click="checkQualification"
              >
                核验
              </el-button>
              <template v-if="qualCheckResult">
                <el-tag
                  :type="qualCheckResult.qualified ? 'success' : 'danger'"
                  size="large"
                >
                  {{
                    dict.label("cert_type", qualCheckResult.certTypeCode)
                  }}：{{
                    qualCheckResult.qualified ? "具备资质" : "不具备资质"
                  }}
                </el-tag>
              </template>
            </div>
            <div class="qual-check-hint">
              判定 = 已核验 + 未过期 +
              未软删；只返回布尔结果，不代表队员没有该类型的其他证书记录（如待核验/已驳回）。
            </div>
          </el-card>
          <PureTableBar
            title="队员证书"
            :columns="certColumns"
            @refresh="certOnSearch"
          >
            <template #buttons>
              <el-button
                v-if="certCanCreate"
                type="primary"
                :icon="useRenderIcon(AddFill)"
                @click="certOpenDialog('新建')"
              >
                新建
              </el-button>
            </template>
            <template v-slot="{ size, dynamicColumns }">
              <pure-table
                row-key="id"
                adaptive
                :adaptiveConfig="{ offsetBottom: 108 }"
                align-whole="center"
                table-layout="auto"
                :loading="certLoading"
                :size="size"
                :data="certDataList"
                :columns="dynamicColumns"
                :header-cell-style="{
                  background: 'var(--el-fill-color-light)',
                  color: 'var(--el-text-color-primary)'
                }"
              >
                <template #certStatusCode="{ row }">
                  <el-tag :type="certStatusTagType(row.certStatusCode)">
                    {{ dict.label("cert_status", row.certStatusCode) }}
                  </el-tag>
                </template>
                <template #isInternal="{ row }">
                  <el-tag :type="row.isInternal ? 'warning' : 'info'">
                    {{ row.isInternal ? "内部" : "外部" }}
                  </el-tag>
                </template>
                <template #operation="{ row }">
                  <el-button
                    v-if="certCanUpdate"
                    class="reset-margin"
                    link
                    type="primary"
                    :size="size"
                    :icon="useRenderIcon(EditPen)"
                    @click="certOpenDialog('编辑', row)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    v-if="certCanVerify && row.certStatusCode === 'pending'"
                    class="reset-margin"
                    link
                    type="success"
                    :size="size"
                    @click="certHandleVerify(row)"
                  >
                    核验通过
                  </el-button>
                  <el-button
                    v-if="certCanReject && row.certStatusCode === 'pending'"
                    class="reset-margin"
                    link
                    type="warning"
                    :size="size"
                    @click="certHandleReject(row)"
                  >
                    核验驳回
                  </el-button>
                  <el-button
                    v-if="certCanDelete"
                    class="reset-margin"
                    link
                    type="danger"
                    :size="size"
                    :icon="useRenderIcon(Delete)"
                    @click="certHandleDelete(row)"
                  >
                    删除
                  </el-button>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </template>
        <el-empty
          v-else
          description="您没有查看证书的权限（certificate.read.record）"
        />
      </el-tab-pane>

      <!-- Tab：保险（只读；admin 侧契约仅 GET，无写操作） -->
      <el-tab-pane label="保险" name="insurances">
        <template v-if="insCanRead">
          <PureTableBar
            title="队员保险"
            :columns="insColumns"
            @refresh="insOnSearch"
          >
            <template v-slot="{ size, dynamicColumns }">
              <pure-table
                row-key="id"
                adaptive
                :adaptiveConfig="{ offsetBottom: 108 }"
                align-whole="center"
                table-layout="auto"
                :loading="insLoading"
                :size="size"
                :data="insDataList"
                :columns="dynamicColumns"
                :header-cell-style="{
                  background: 'var(--el-fill-color-light)',
                  color: 'var(--el-text-color-primary)'
                }"
              >
                <template #validity="{ row }">
                  <el-tag :type="insIsActive(row) ? 'success' : 'info'">
                    {{ insIsActive(row) ? "有效" : "已过期" }}
                  </el-tag>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </template>
        <el-empty
          v-else
          description="您没有查看保险的权限（member-insurance.read.other）"
        />
      </el-tab-pane>

      <!-- Tab：紧急联系人（CRUD，复用 list hook，无需再选队员） -->
      <el-tab-pane label="紧急联系人" name="emergency-contacts">
        <template v-if="ecCanRead">
          <PureTableBar
            title="紧急联系人"
            :columns="ecColumns"
            @refresh="ecOnSearch"
          >
            <template #buttons>
              <el-button
                v-if="ecCanCreate"
                type="primary"
                :icon="useRenderIcon(AddFill)"
                @click="ecOpenDialog('新建')"
              >
                新建
              </el-button>
            </template>
            <template v-slot="{ size, dynamicColumns }">
              <pure-table
                row-key="id"
                adaptive
                :adaptiveConfig="{ offsetBottom: 108 }"
                align-whole="center"
                table-layout="auto"
                :loading="ecLoading"
                :size="size"
                :data="ecDataList"
                :columns="dynamicColumns"
                :header-cell-style="{
                  background: 'var(--el-fill-color-light)',
                  color: 'var(--el-text-color-primary)'
                }"
              >
                <template #operation="{ row }">
                  <el-button
                    v-if="ecCanUpdate"
                    class="reset-margin"
                    link
                    type="primary"
                    :size="size"
                    :icon="useRenderIcon(EditPen)"
                    @click="ecOpenDialog('编辑', row)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    v-if="ecCanDelete"
                    class="reset-margin"
                    link
                    type="danger"
                    :size="size"
                    :icon="useRenderIcon(Delete)"
                    @click="ecHandleDelete(row)"
                  >
                    删除
                  </el-button>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </template>
        <el-empty
          v-else
          description="您没有查看紧急联系人的权限（emergency-contact.read.record）"
        />
      </el-tab-pane>

      <!-- Tab：部门（单值子资源：读 + 设/清；组织名 + 选择器复用 srvf-organization） -->
      <el-tab-pane label="部门" name="department">
        <template v-if="deptCanRead">
          <el-card v-loading="deptLoading" shadow="never">
            <div class="dept-pane">
              <div class="dept-pane__current">
                <span class="dept-pane__label">当前归属部门：</span>
                <el-tag v-if="deptDepartment" type="success">
                  {{ deptCurrentOrgName }}
                </el-tag>
                <el-tag v-else type="info">未归属部门</el-tag>
              </div>
              <div
                v-if="deptCanSet || (deptCanClear && deptDepartment)"
                class="dept-pane__actions"
              >
                <el-button
                  v-if="deptCanSet"
                  type="primary"
                  :icon="useRenderIcon(EditPen)"
                  @click="deptHandleSet"
                >
                  {{ deptDepartment ? "变更部门" : "设置部门" }}
                </el-button>
                <el-button
                  v-if="deptCanClear && deptDepartment"
                  type="danger"
                  :icon="useRenderIcon(Delete)"
                  @click="deptHandleClear"
                >
                  清除归属
                </el-button>
              </div>
            </div>
          </el-card>
        </template>
        <el-empty
          v-else
          description="您没有查看部门归属的权限（member-department.read.current）"
        />
      </el-tab-pane>

      <!-- Tab：组织归属（memberships 多归属;组织名经 resolveLabels 解析；新增/编辑/结束/迁移写操作） -->
      <el-tab-pane label="组织归属" name="memberships">
        <template v-if="msCanRead">
          <PureTableBar
            title="组织归属（多归属）"
            :columns="msColumns"
            @refresh="msOnSearch"
          >
            <template #buttons>
              <el-button
                v-if="msCanSet"
                type="primary"
                :icon="useRenderIcon(AddFill)"
                @click="msOpenDialog('新增')"
              >
                新增归属
              </el-button>
            </template>
            <template v-slot="{ size, dynamicColumns }">
              <pure-table
                row-key="id"
                adaptive
                :adaptiveConfig="{ offsetBottom: 108 }"
                align-whole="center"
                table-layout="auto"
                :loading="msLoading"
                :size="size"
                :data="msDataList"
                :columns="dynamicColumns"
                :header-cell-style="{
                  background: 'var(--el-fill-color-light)',
                  color: 'var(--el-text-color-primary)'
                }"
              >
                <template #organization="{ row }">
                  {{ msOrgLabel(row.organizationId) }}
                </template>
                <template #membershipType="{ row }">
                  <el-tag
                    :type="
                      row.membershipType === 'PRIMARY' ? 'primary' : 'info'
                    "
                  >
                    {{ msTypeLabel(row.membershipType) }}
                  </el-tag>
                </template>
                <template #status="{ row }">
                  <el-tag :type="msStatusMeta(row.status).type">
                    {{ msStatusMeta(row.status).text }}
                  </el-tag>
                </template>
                <template #operation="{ row }">
                  <el-button
                    v-if="msCanSet"
                    class="reset-margin"
                    link
                    type="primary"
                    :size="size"
                    :icon="useRenderIcon(EditPen)"
                    @click="msOpenDialog('编辑', row)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    v-if="msCanTransfer && row.status === 'ACTIVE'"
                    class="reset-margin"
                    link
                    type="warning"
                    :size="size"
                    @click="msOpenTransferDialog(row)"
                  >
                    迁移
                  </el-button>
                  <el-button
                    v-if="msCanEnd && row.status === 'ACTIVE'"
                    class="reset-margin"
                    link
                    type="danger"
                    :size="size"
                    @click="msHandleEnd(row)"
                  >
                    结束
                  </el-button>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </template>
        <el-empty
          v-else
          description="您没有查看组织归属的权限（membership.list.record）"
        />
      </el-tab-pane>

      <!-- Tab：任职（队员轴,只读全历史;任命/撤销在组织架构页「在任职务」面板） -->
      <el-tab-pane label="任职" name="position-assignments">
        <template v-if="paCanRead">
          <PureTableBar
            title="任职历史（ACTIVE/ENDED/REVOKED 全量）"
            :columns="paColumns"
            @refresh="paOnSearch"
          >
            <template v-slot="{ size, dynamicColumns }">
              <pure-table
                row-key="id"
                adaptive
                :adaptiveConfig="{ offsetBottom: 108 }"
                align-whole="center"
                table-layout="auto"
                :loading="paLoading"
                :size="size"
                :data="paDataList"
                :columns="dynamicColumns"
                :header-cell-style="{
                  background: 'var(--el-fill-color-light)',
                  color: 'var(--el-text-color-primary)'
                }"
              >
                <template #position="{ row }">
                  {{ paPositionLabel(row.positionId) }}
                </template>
                <template #organization="{ row }">
                  {{ paOrgLabel(row.organizationId) }}
                </template>
                <template #status="{ row }">
                  <el-tag :type="paStatusMeta(row.status).type">
                    {{ paStatusMeta(row.status).text }}
                  </el-tag>
                </template>
                <template #isConcurrent="{ row }">
                  <el-tag :type="row.isConcurrent ? 'warning' : 'info'">
                    {{ row.isConcurrent ? "是" : "否" }}
                  </el-tag>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </template>
        <el-empty
          v-else
          description="您没有查看任职的权限（position-assignment.read.record）"
        />
      </el-tab-pane>

      <!-- Tab：分管范围（该队员若是分管人,只读;新建/撤销在督导总表页） -->
      <el-tab-pane label="分管范围" name="supervision-scope">
        <template v-if="ssCanRead">
          <PureTableBar
            title="分管范围（若无记录,说明该队员当前无分管职责）"
            :columns="ssColumns"
            @refresh="ssOnSearch"
          >
            <template v-slot="{ size, dynamicColumns }">
              <pure-table
                row-key="supervisionAssignmentId"
                adaptive
                :adaptiveConfig="{ offsetBottom: 108 }"
                align-whole="center"
                table-layout="auto"
                :loading="ssLoading"
                :size="size"
                :data="ssDataList"
                :columns="dynamicColumns"
                :header-cell-style="{
                  background: 'var(--el-fill-color-light)',
                  color: 'var(--el-text-color-primary)'
                }"
              >
                <template #scopeMode="{ row }">
                  <el-tag :type="row.scopeMode === 'TREE' ? 'primary' : 'info'">
                    {{ ssScopeModeLabel(row.scopeMode) }}
                  </el-tag>
                </template>
              </pure-table>
              <p v-if="ssDataList.length" class="ss-expanded-hint">
                <template
                  v-for="(row, i) in ssDataList"
                  :key="row.supervisionAssignmentId"
                >
                  展开覆盖：{{ ssExpandedLabels(row)
                  }}<template v-if="i < ssDataList.length - 1"><br /></template>
                </template>
              </p>
            </template>
          </PureTableBar>
        </template>
        <el-empty
          v-else
          description="您没有查看分管范围的权限（supervision-assignment.read.record）"
        />
      </el-tab-pane>

      <!-- Tab：档案（1:1 扩展档案，读 + 新建/编辑；字典字段已翻中文；无档案 → 空态 + 新建） -->
      <el-tab-pane label="档案" name="profile">
        <template v-if="profileCanRead">
          <el-card v-loading="profileLoading" shadow="never">
            <template v-if="profileData">
              <div v-if="profileCanUpdate" class="profile-pane__actions">
                <el-button
                  type="primary"
                  :icon="useRenderIcon(EditPen)"
                  @click="profileOpenDialog('编辑', profileData)"
                >
                  编辑档案
                </el-button>
              </div>
              <el-descriptions :column="2" border>
                <el-descriptions-item
                  v-for="row in profileDisplayRows"
                  :key="row.label"
                  :label="row.label"
                  :span="row.span ?? 1"
                >
                  {{ row.value }}
                </el-descriptions-item>
              </el-descriptions>
            </template>
            <el-empty
              v-else-if="!profileLoading"
              description="该队员暂无扩展档案"
            >
              <el-button
                v-if="profileCanCreate"
                type="primary"
                :icon="useRenderIcon(AddFill)"
                @click="profileOpenDialog('新建')"
              >
                新建档案
              </el-button>
            </el-empty>
          </el-card>
        </template>
        <el-empty
          v-else
          description="您没有查看队员档案的权限（member-profile.read.record）"
        />
      </el-tab-pane>

      <!-- Tab：活动履历（队员跨活动报名,只读;状态可过滤） -->
      <el-tab-pane label="活动履历" name="registrations-history">
        <template v-if="regCanRead">
          <PureTableBar
            title="活动履历"
            :columns="regColumns"
            @refresh="regOnSearch"
          >
            <template #buttons>
              <el-select
                v-model="regStatusFilter"
                class="w-40!"
                placeholder="按状态过滤"
                @change="regOnFilterChange"
              >
                <el-option
                  v-for="opt in regStatusOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </template>
            <template v-slot="{ size, dynamicColumns }">
              <pure-table
                row-key="id"
                adaptive
                :adaptiveConfig="{ offsetBottom: 108 }"
                align-whole="center"
                table-layout="auto"
                :loading="regLoading"
                :size="size"
                :data="regDataList"
                :columns="dynamicColumns"
                :pagination="regPagination"
                :paginationSmall="size === 'small' ? true : false"
                :header-cell-style="{
                  background: 'var(--el-fill-color-light)',
                  color: 'var(--el-text-color-primary)'
                }"
                @page-size-change="regHandleSizeChange"
                @page-current-change="regHandleCurrentChange"
              >
                <template #statusCode="{ row }">
                  <el-tag :type="regStatusMeta(row.statusCode).type">
                    {{ regStatusMeta(row.statusCode).text }}
                  </el-tag>
                </template>
              </pure-table>
            </template>
          </PureTableBar>
        </template>
        <el-empty
          v-else
          description="您没有查看活动履历的权限（activity-registration.read.record）"
        />
      </el-tab-pane>

      <!-- Tab：考勤记录（仅 approved sheet 内已生效 records,只读） -->
      <el-tab-pane label="考勤记录" name="attendance-records">
        <template v-if="arecCanRead">
          <PureTableBar
            title="考勤记录（仅已生效）"
            :columns="arecColumns"
            @refresh="arecOnSearch"
          >
            <template v-slot="{ size, dynamicColumns }">
              <pure-table
                row-key="id"
                adaptive
                :adaptiveConfig="{ offsetBottom: 108 }"
                align-whole="center"
                table-layout="auto"
                :loading="arecLoading"
                :size="size"
                :data="arecDataList"
                :columns="dynamicColumns"
                :pagination="arecPagination"
                :paginationSmall="size === 'small' ? true : false"
                :header-cell-style="{
                  background: 'var(--el-fill-color-light)',
                  color: 'var(--el-text-color-primary)'
                }"
                @page-size-change="arecHandleSizeChange"
                @page-current-change="arecHandleCurrentChange"
              />
            </template>
          </PureTableBar>
        </template>
        <el-empty
          v-else
          description="您没有查看考勤记录的权限（attendance.read.sheet）"
        />
      </el-tab-pane>

      <!-- Tab：贡献值（生涯累计 capped 总分,后端实时算,直接展示别再加） -->
      <el-tab-pane label="贡献值" name="contribution">
        <template v-if="contribCanRead">
          <el-card v-loading="contribLoading" shadow="never">
            <el-statistic
              title="生涯累计贡献值"
              :value="
                contribSummary ? Number(contribSummary.contributionPoints) : 0
              "
              :precision="2"
            />
            <div class="contribution-hint">
              后端实时算 capped 总分（approved 考勤 + 北京日封顶
              1.5）,前端直接展示。
            </div>
          </el-card>
        </template>
        <el-empty
          v-else
          description="您没有查看贡献值的权限（attendance.read.sheet）"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}

.qual-check-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.qual-check-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.cockpit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  &__title {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  &__name {
    font-size: 18px;
    font-weight: 600;
  }
}

.profile-pane__actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.contribution-hint {
  margin-top: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.dept-pane {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;

  &__current {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  &__label {
    font-weight: 500;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
}
</style>
