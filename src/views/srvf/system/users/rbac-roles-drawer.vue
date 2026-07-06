<script setup lang="ts">
import { ref, watch } from "vue";
import dayjs from "dayjs";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import {
  getUserRbacRoles,
  assignUserRbacRole,
  revokeUserRbacRole,
  getRoleOptions,
  roleBizErrorMessage,
  type UserRoleItem,
  type RoleOptionItem
} from "@/api/srvf-role";
import type { UserAccountItem } from "@/api/srvf-user";

defineOptions({
  name: "SrvfUserRbacRolesDrawer"
});

/**
 * 用户 ↔ RBAC 角色 绑定抽屉（全局绑定，`users/{userId}/roles`）——
 * 与本页既有"改角色"（系统角色单值枚举 SUPER_ADMIN/ADMIN/USER）是两回事，
 * 也与「组织与人事 → 角色绑定」页（scoped，role-bindings）不是同一个入口，
 * 但落到同一张底表：GLOBAL 绑定互相可见（handoff §2.6）。
 */
const visible = defineModel<boolean>({ required: true });
const props = defineProps<{ user: UserAccountItem | null }>();

const canRead = hasPerms("rbac.user-role.read");
const canAssign = hasPerms("rbac.user-role.create");
const canRevoke = hasPerms("rbac.user-role.delete");

const loading = ref(false);
const assigning = ref(false);
const userRoles = ref<UserRoleItem[]>([]);
const roleOptions = ref<RoleOptionItem[]>([]);
const selectedRoleCode = ref("");

/** 设计上经"职务→角色 policy"自动推导、不建议在此手工绑给用户的角色（handoff §2.6）——
 *  技术上绑定不会报错，但只按 GLOBAL 语义生效，绕开职务/分管的推导设计。软提示不硬拦。 */
const SCOPED_DERIVED_ROLE_CODES = [
  "org-admin",
  "group-manager",
  "org-supervisor",
  "attendance-final-reviewer"
];

async function loadData() {
  if (!props.user) return;
  loading.value = true;
  try {
    const [rolesRes, optionsRes] = await Promise.all([
      getUserRbacRoles(props.user.id),
      getRoleOptions({ limit: 100 })
    ]);
    if (rolesRes.code === 0) userRoles.value = rolesRes.data;
    if (optionsRes.code === 0) roleOptions.value = optionsRes.data.items;
  } catch (error: any) {
    message(roleBizErrorMessage(error, "加载角色绑定数据失败"), {
      type: "error"
    });
  } finally {
    loading.value = false;
  }
}

function doAssign() {
  if (!props.user || !selectedRoleCode.value) return;
  const roleCode = selectedRoleCode.value;
  const proceed = async () => {
    assigning.value = true;
    try {
      await assignUserRbacRole(props.user!.id, roleCode);
      message("绑定成功；如需立即生效请到「角色权限」页点击「重载权限缓存」", {
        type: "success"
      });
      selectedRoleCode.value = "";
      await loadData();
    } catch (error: any) {
      message(roleBizErrorMessage(error, "绑定失败"), { type: "error" });
    } finally {
      assigning.value = false;
    }
  };
  if (SCOPED_DERIVED_ROLE_CODES.includes(roleCode)) {
    ElMessageBox.confirm(
      `「${roleCode}」设计上由职务/分管自动推导产生，不建议在此手工绑定——绑定本身不会报错，但只按全局语义生效，会绕开职务/分管的推导设计，实际业务含义可能与预期不符。确定仍要手工绑定吗？`,
      "该角色设计为自动派生",
      {
        confirmButtonText: "仍然绑定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(proceed)
      .catch(() => {});
  } else {
    proceed();
  }
}

function handleRevoke(row: UserRoleItem) {
  if (!props.user) return;
  ElMessageBox.confirm(
    `确定撤销用户「${props.user.username}」的「${row.roleDisplayName}」（${row.roleCode}）角色吗？`,
    "撤销角色绑定",
    { confirmButtonText: "确定撤销", cancelButtonText: "取消", type: "warning" }
  )
    .then(async () => {
      try {
        await revokeUserRbacRole(props.user!.id, row.roleId);
        message("撤销成功", { type: "success" });
        await loadData();
      } catch (error: any) {
        message(roleBizErrorMessage(error, "撤销失败"), { type: "error" });
      }
    })
    .catch(() => {});
}

watch(visible, open => {
  if (open) {
    userRoles.value = [];
    selectedRoleCode.value = "";
    loadData();
  }
});
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="`RBAC 角色绑定 — ${user?.username ?? ''}（全局）`"
    size="520px"
    destroy-on-close
  >
    <template v-if="canRead">
      <el-alert
        class="mb-3"
        type="info"
        show-icon
        :closable="false"
        title="这是全局角色绑定"
        description="与「组织与人事 → 角色绑定」页是两个入口、同一张底表；旧判权服务只读这里的 GLOBAL 绑定，覆盖几乎全部业务面，是让用户真正拿到某角色权限最直接的路径。"
      />

      <div v-if="canAssign" class="assign-row">
        <el-select
          v-model="selectedRoleCode"
          filterable
          clearable
          placeholder="选择要绑定的角色"
          class="flex-1"
        >
          <el-option
            v-for="opt in roleOptions"
            :key="opt.id"
            :label="`${opt.label} (${opt.code})`"
            :value="opt.code"
          />
        </el-select>
        <el-button
          type="primary"
          :loading="assigning"
          :disabled="!selectedRoleCode"
          @click="doAssign"
        >
          绑定
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="userRoles"
        border
        size="small"
        class="mt-3"
      >
        <el-table-column label="角色" min-width="120">
          <template #default="{ row }">
            {{ row.roleDisplayName }}
            <div class="role-code">{{ row.roleCode }}</div>
          </template>
        </el-table-column>
        <el-table-column label="绑定时间" min-width="150">
          <template #default="{ row }">
            {{ dayjs(row.createdAt).format("YYYY-MM-DD HH:mm:ss") }}
          </template>
        </el-table-column>
        <el-table-column v-if="canRevoke" label="操作" width="90">
          <template #default="{ row }">
            <el-button link type="danger" @click="handleRevoke(row)">
              撤销
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>
    <el-empty
      v-else
      description="您没有查看角色绑定的权限（rbac.user-role.read）"
    />
  </el-drawer>
</template>

<style scoped lang="scss">
.assign-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.role-code {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
