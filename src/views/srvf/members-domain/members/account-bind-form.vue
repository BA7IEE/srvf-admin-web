<script setup lang="ts">
import { ref } from "vue";
import { getUserOptions, type UserOptionItem } from "@/api/srvf-user";

/** 绑定既有账号表单（单选账号 id）。model 即注入的 formInline，父 beforeSure 直接读 formInline.userId。 */
export type AccountBindFormModel = { userId: string };

const props = withDefaults(
  defineProps<{ formInline?: AccountBindFormModel }>(),
  {
    formInline: () => ({ userId: "" })
  }
);
const model = ref(props.formInline);

const options = ref<UserOptionItem[]>([]);
const searching = ref(false);

/**
 * 远程搜索账号（跨 username+nickname+email+phone，契约字段）。
 * 后端未提供"仅悬空账号"过滤——已绑定他人的账号也可能出现在结果里，选中后提交会被后端拒绝并提示原因。
 */
async function handleSearch(q: string) {
  searching.value = true;
  try {
    const { code, data } = await getUserOptions({
      ...(q ? { q } : {}),
      limit: 20
    });
    if (code === 0) options.value = data.items;
  } catch {
    options.value = [];
  } finally {
    searching.value = false;
  }
}

handleSearch("");
</script>

<template>
  <el-select
    v-model="model.userId"
    filterable
    remote
    clearable
    reserve-keyword
    :remote-method="handleSearch"
    :loading="searching"
    placeholder="搜索用户名 / 昵称 / 邮箱 / 手机号"
    class="w-full"
  >
    <el-option
      v-for="opt in options"
      :key="opt.id"
      :label="
        opt.label === opt.username
          ? opt.label
          : `${opt.label}（${opt.username}）`
      "
      :value="opt.id"
    />
  </el-select>
  <p class="account-bind-hint">
    只能绑定尚未关联队员的账号；若选中的账号已被其他队员占用，提交时会被拒绝并提示原因。
  </p>
</template>

<style scoped lang="scss">
.account-bind-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
