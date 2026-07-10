<script setup lang="ts">
import { bizErrorMessage } from "@/api/srvf-error";
import { SrvfPermEmpty } from "@/srvf-kit";
import { computed, ref, watch } from "vue";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { getPermissions, type PermissionItem } from "@/api/srvf-permission";
import {
  getRole,
  assignRolePermissions,
  revokeRolePermission,
  roleBizErrorMessage,
  type RoleItem
} from "@/api/srvf-role";

defineOptions({
  name: "SrvfRolePermissionsDrawer"
});

/**
 * 角色 ↔ 权限点 绑定抽屉：el-transfer 双栏选人范式复用到"选权限点"。
 * 分配走批量 `permissionCodes[]`；撤销只能逐条 `DELETE .../{permissionId}`——
 * 保存时把 targetKeys 差集拆成"批量分配新增的" + "逐条撤销减少的"两路调用。
 */
const visible = defineModel<boolean>({ required: true });
const props = defineProps<{ role: RoleItem | null }>();
const emit = defineEmits<{ saved: [] }>();

const canAssign = hasPerms("rbac.role-permission.create");
const canRevoke = hasPerms("rbac.role-permission.delete");
const canManage = canAssign || canRevoke;

const loading = ref(false);
const saving = ref(false);
const allPermissions = ref<PermissionItem[]>([]);
const targetKeys = ref<string[]>([]);
const originalKeys = ref<string[]>([]);

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

/** 拉全量权限点目录（分页硬上限 100，循环拼总量约 195 条；仅供本抽屉选择器渲染） */
async function fetchAllPermissions() {
  const items: PermissionItem[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { code, data } = await getPermissions({ page, pageSize: PAGE_SIZE });
    if (code !== 0) break;
    items.push(...data.items);
    if (data.items.length < PAGE_SIZE || items.length >= data.total) break;
  }
  return items;
}

async function loadData() {
  if (!props.role) return;
  loading.value = true;
  try {
    const [permsRes, roleRes] = await Promise.all([
      fetchAllPermissions(),
      getRole(props.role.id)
    ]);
    allPermissions.value = permsRes;
    if (roleRes.code === 0) {
      const keys = roleRes.data.permissions.map(p => p.id);
      targetKeys.value = keys;
      originalKeys.value = keys;
    }
  } catch (error: any) {
    message(bizErrorMessage(error, "加载权限点数据失败"), {
      type: "error"
    });
  } finally {
    loading.value = false;
  }
}

/**
 * 已分配一侧（targetKeys 内）只能撤销、未分配一侧只能新增——按 canAssign/canRevoke
 * 分别禁用对应方向,而不是等保存时才静默丢弃对应半边改动。
 */
const transferData = computed(() =>
  allPermissions.value.map(p => ({
    key: p.id,
    label: p.code,
    disabled: targetKeys.value.includes(p.id) ? !canRevoke : !canAssign
  }))
);

/** `permissionCodes[]` 后端硬上限 100 项/次（同 DTO `maxItems`），批量分配需按此分片 */
const ASSIGN_CHUNK_SIZE = 100;
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function handleSave() {
  if (!props.role) return;
  const added = targetKeys.value.filter(k => !originalKeys.value.includes(k));
  const removed = originalKeys.value.filter(k => !targetKeys.value.includes(k));
  if (added.length === 0 && removed.length === 0) {
    visible.value = false;
    return;
  }
  saving.value = true;
  let revokeFailures = 0;
  try {
    const byId = new Map(allPermissions.value.map(p => [p.id, p.code]));
    if (added.length > 0 && canAssign) {
      const codes = added.map(id => byId.get(id)).filter(Boolean) as string[];
      for (const batch of chunk(codes, ASSIGN_CHUNK_SIZE)) {
        await assignRolePermissions(props.role.id, batch);
      }
    }
    if (removed.length > 0 && canRevoke) {
      // allSettled：单条撤销失败(如并发编辑导致关系已不存在)不应吞掉其余已成功的撤销
      const results = await Promise.allSettled(
        removed.map(id => revokeRolePermission(props.role!.id, id))
      );
      revokeFailures = results.filter(r => r.status === "rejected").length;
    }
    if (revokeFailures > 0) {
      message(
        `已保存，但 ${revokeFailures}/${removed.length} 个权限点撤销失败，请重新打开核对`,
        { type: "warning" }
      );
    } else {
      message("权限点已更新；如需立即生效，请回列表页点「使权限立即生效」", {
        type: "success"
      });
    }
    emit("saved");
    visible.value = false;
  } catch (error: any) {
    message(roleBizErrorMessage(error, "保存权限点失败"), { type: "error" });
  } finally {
    saving.value = false;
  }
}

watch(visible, open => {
  if (open) loadData();
});
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="`权限点分配 — ${role?.displayName ?? ''} (${role?.code ?? ''})`"
    size="640px"
    destroy-on-close
  >
    <template v-if="canManage">
      <el-alert
        class="mb-3"
        type="info"
        show-icon
        :closable="false"
        description="左侧为未分配的权限点，右侧为已分配。保存后即写入该角色；勾选较多时保存需要几秒钟，请等待完成提示。"
      />
      <el-transfer
        v-model="targetKeys"
        v-loading="loading"
        :data="transferData"
        :titles="['未分配', '已分配']"
        filterable
        filter-placeholder="搜索权限标识"
        :props="{ key: 'key', label: 'label' }"
      />
      <div class="drawer-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          保存
        </el-button>
      </div>
    </template>
    <SrvfPermEmpty
      v-else
      action="分配权限点"
      code="rbac.role-permission.create / .delete"
    />
  </el-drawer>
</template>

<style scoped lang="scss">
.drawer-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
