<script setup lang="ts">
import { ref } from "vue";

/** 批量开号表单行（memberId 提交用；memberNo/displayName 仅展示，phone 待填） */
export type BulkGrantFormRow = {
  memberId: string;
  memberNo: string;
  displayName: string;
  phone: string;
};
export type BulkGrantFormModel = { rows: BulkGrantFormRow[] };

const props = withDefaults(defineProps<{ formInline?: BulkGrantFormModel }>(), {
  formInline: () => ({ rows: [] })
});
const model = ref(props.formInline);
</script>

<template>
  <p class="bulk-grant-hint">
    为以下 {{ model.rows.length }}
    名队员逐一填写手机号后开通登录账号（手机验证码登录，不设密码）；某一行失败不影响其余行。
  </p>
  <el-table :data="model.rows" max-height="360" size="small" border>
    <el-table-column label="队员编号" prop="memberNo" width="120" />
    <el-table-column label="称呼" prop="displayName" min-width="120" />
    <el-table-column label="手机号" min-width="160">
      <template #default="{ row }">
        <el-input
          v-model="row.phone"
          placeholder="如 13800001234"
          maxlength="11"
        />
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped lang="scss">
.bulk-grant-hint {
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
