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
  handleReject: certHandleReject
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

onMounted(() => {
  fetchDetail();
  // onSearch 自带 canRead + memberId 守卫；memberId 已由路由注入，有读码即加载对应子资源
  certOnSearch();
  insOnSearch();
  ecOnSearch();
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
    <el-tabs class="cockpit-tabs">
      <el-tab-pane label="证书" name="certificates">
        <template v-if="certCanRead">
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
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
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
</style>
