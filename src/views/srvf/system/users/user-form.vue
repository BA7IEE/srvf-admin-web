<script setup lang="ts">
import { ref, computed } from "vue";
import type { AccountRole } from "@/api/srvf-user";

/** 用户表单。create:username/password/email/nickname/role；edit:仅 email/nickname。 */
export type UserFormModel = {
  isEdit: boolean;
  username: string;
  password: string;
  email: string;
  nickname: string;
  role: AccountRole;
};

const props = withDefaults(defineProps<{ formInline?: UserFormModel }>(), {
  formInline: () => ({
    isEdit: false,
    username: "",
    password: "",
    email: "",
    nickname: "",
    role: "USER"
  })
});
const model = ref(props.formInline);
const formRef = ref();

const rules = computed(() =>
  model.value.isEdit
    ? {}
    : {
        username: [
          { required: true, message: "请填写用户名", trigger: "blur" }
        ],
        password: [
          { required: true, message: "请填写初始密码", trigger: "blur" }
        ]
      }
);

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="84px">
    <template v-if="!model.isEdit">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="model.username" maxlength="64" />
      </el-form-item>
      <el-form-item label="初始密码" prop="password">
        <el-input
          v-model="model.password"
          type="password"
          show-password
          autocomplete="new-password"
        />
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="model.role" class="w-full!">
          <el-option label="超级管理员" value="SUPER_ADMIN" />
          <el-option label="管理员" value="ADMIN" />
          <el-option label="普通用户" value="USER" />
        </el-select>
      </el-form-item>
    </template>
    <el-form-item v-else label="用户名">
      <span>{{ model.username }}</span>
    </el-form-item>
    <el-form-item label="邮箱">
      <el-input v-model="model.email" maxlength="120" />
    </el-form-item>
    <el-form-item label="昵称">
      <el-input v-model="model.nickname" maxlength="60" />
    </el-form-item>
  </el-form>
</template>
