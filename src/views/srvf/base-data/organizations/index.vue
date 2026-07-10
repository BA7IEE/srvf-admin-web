<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useOrganizations } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import MembersDrawer from "./members-drawer.vue";
import AssignmentsDrawer from "./assignments-drawer.vue";
import SupervisorsDrawer from "./supervisors-drawer.vue";
import type { OrgTreeNode } from "@/api/srvf-organization";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import AddFill from "~icons/ri/add-circle-line";
import More from "~icons/ep/more-filled";
import { SrvfPageIntro, SrvfPermEmpty } from "@/srvf-kit";
import GrantWizard from "@/views/srvf/components/grant-wizard.vue";
import { hasPerms } from "@/utils/auth";

defineOptions({
  name: "SrvfOrganizations"
});

/** 授权向导（行内「更多」进入,预填本组织;任一授权类写码即可见） */
const grantWizardVisible = ref(false);
const grantWizardOrgId = ref("");
const canOpenGrantWizard =
  hasPerms("position-assignment.create.record") ||
  hasPerms("role-binding.create.record") ||
  hasPerms("rbac.user-role.create");

function openGrantWizard(row: { id: string }) {
  grantWizardOrgId.value = row.id;
  grantWizardVisible.value = true;
}

/** 成员面板（组织轴 memberships drawer;默认仅在册,踩坑 #9 见 drawer 内注释） */
const membersVisible = ref(false);
const membersOrg = ref<{ id: string; name: string }>({ id: "", name: "" });
function openMembers(row: OrgTreeNode) {
  membersOrg.value = { id: row.id, name: row.name };
  membersVisible.value = true;
}

/** 在任职务面板（组织轴 position-assignments drawer） */
const assignmentsVisible = ref(false);
const assignmentsOrg = ref<{ id: string; name: string }>({ id: "", name: "" });
function openAssignments(row: OrgTreeNode) {
  assignmentsOrg.value = { id: row.id, name: row.name };
  assignmentsVisible.value = true;
}

/** 被谁分管面板（组织轴 supervision-assignments drawer,只读） */
const supervisorsVisible = ref(false);
const supervisorsOrg = ref<{ id: string; name: string }>({ id: "", name: "" });
function openSupervisors(row: OrgTreeNode) {
  supervisorsOrg.value = { id: row.id, name: row.name };
  supervisorsVisible.value = true;
}

const {
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  canMembers,
  canAssignments,
  canSupervisors,
  canMove,
  loading,
  columns,
  dataList,
  onSearch,
  openCreateRoot,
  openCreateChild,
  openEdit,
  handleToggleStatus,
  handleDelete,
  openMoveDialog
} = useOrganizations();

/** 低频行操作收进「更多」下拉（操作列只保留 成员 / 编辑 两个主操作） */
const canMoreOps =
  canAssignments ||
  canSupervisors ||
  canCreate ||
  canMove ||
  canUpdate ||
  canDelete;

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="main">
    <SrvfPageIntro
      class="mb-2"
      title="维护大队/中队/组的组织树：行内可查看成员、在任职务、被谁分管，并在「在任职务」里发起任命。"
    />
    <PureTableBar
      v-if="canRead"
      title="组织架构"
      :columns="columns"
      @refresh="onSearch"
    >
      <template #buttons>
        <el-button
          v-if="canCreate"
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openCreateRoot()"
        >
          新建根节点
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          row-key="id"
          adaptive
          default-expand-all
          showOverflowTooltip
          :adaptiveConfig="{ offsetBottom: 108 }"
          align-whole="center"
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="dataList"
          :columns="dynamicColumns"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
        >
          <template #status="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
              {{ row.status === "ACTIVE" ? "启用" : "停用" }}
            </el-tag>
          </template>
          <template #operation="{ row }">
            <el-button
              v-if="canMembers"
              class="reset-margin"
              link
              :size="size"
              @click="openMembers(row)"
            >
              成员
            </el-button>
            <el-button
              v-if="canUpdate"
              class="reset-margin"
              link
              :size="size"
              :icon="useRenderIcon(EditPen)"
              @click="openEdit(row)"
            >
              编辑
            </el-button>
            <el-dropdown v-if="canMoreOps" trigger="click">
              <el-button
                class="ml-3! mt-0.5!"
                link
                :size="size"
                :icon="useRenderIcon(More)"
              />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="canOpenGrantWizard">
                    <el-button
                      class="reset-margin!"
                      link
                      :size="size"
                      @click="openGrantWizard(row)"
                    >
                      授权向导
                    </el-button>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canAssignments">
                    <el-button
                      class="reset-margin!"
                      link
                      :size="size"
                      @click="openAssignments(row)"
                    >
                      在任职务
                    </el-button>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canSupervisors">
                    <el-button
                      class="reset-margin!"
                      link
                      :size="size"
                      @click="openSupervisors(row)"
                    >
                      被谁分管
                    </el-button>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canCreate">
                    <el-button
                      class="reset-margin!"
                      link
                      :size="size"
                      :icon="useRenderIcon(AddFill)"
                      @click="openCreateChild(row)"
                    >
                      新增子节点
                    </el-button>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canMove && row.parentId">
                    <el-button
                      class="reset-margin!"
                      link
                      type="warning"
                      :size="size"
                      @click="openMoveDialog(row)"
                    >
                      移动
                    </el-button>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canUpdate" divided>
                    <el-button
                      class="reset-margin!"
                      link
                      :type="row.status === 'ACTIVE' ? 'warning' : 'success'"
                      :size="size"
                      @click="handleToggleStatus(row)"
                    >
                      {{ row.status === "ACTIVE" ? "停用" : "启用" }}
                    </el-button>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canDelete">
                    <el-button
                      class="reset-margin!"
                      link
                      type="danger"
                      :size="size"
                      :icon="useRenderIcon(Delete)"
                      @click="handleDelete(row)"
                    >
                      删除
                    </el-button>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
    <SrvfPermEmpty v-else action="查看组织架构" code="org.read.node" />
    <MembersDrawer
      v-model="membersVisible"
      :org-id="membersOrg.id"
      :org-name="membersOrg.name"
    />
    <AssignmentsDrawer
      v-model="assignmentsVisible"
      :org-id="assignmentsOrg.id"
      :org-name="assignmentsOrg.name"
    />
    <SupervisorsDrawer
      v-model="supervisorsVisible"
      :org-id="supervisorsOrg.id"
      :org-name="supervisorsOrg.name"
    />
    <GrantWizard
      v-model="grantWizardVisible"
      :preset-org-id="grantWizardOrgId"
    />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}
</style>
