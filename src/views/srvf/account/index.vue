<script setup lang="ts">
import { bizErrorMessage } from "@/api/srvf-error";
import { ref, reactive } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { message } from "@/utils/message";
import { useUserStoreHook } from "@/store/modules/user";
import { changeMyPassword } from "@/api/srvf-account";

defineOptions({
  name: "SrvfAccount"
});

const user = useUserStoreHook();

/* ----------------------------- 改密表单 ----------------------------- */
const pwdRef = ref<FormInstance>();
const submitting = ref(false);
const pwdForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
});

const rules: FormRules = {
  oldPassword: [{ required: true, message: "请输入当前密码", trigger: "blur" }],
  newPassword: [{ required: true, message: "请输入新密码", trigger: "blur" }],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (_r, val, cb) => {
        if (val !== pwdForm.newPassword)
          cb(new Error("两次输入的新密码不一致"));
        else cb();
      },
      trigger: "blur"
    }
  ]
};

function onSubmit() {
  pwdRef.value?.validate(async valid => {
    if (!valid) return;
    submitting.value = true;
    try {
      await changeMyPassword({
        oldPassword: pwdForm.oldPassword,
        newPassword: pwdForm.newPassword
      });
      message("密码已修改", { type: "success" });
      pwdRef.value?.resetFields();
    } catch (error: any) {
      message(bizErrorMessage(error, "修改密码失败"), {
        type: "error"
      });
    } finally {
      submitting.value = false;
    }
  });
}
</script>

<template>
  <div class="main">
    <el-card shadow="never" class="mb-2">
      <template #header>账号信息</template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">
          {{ user.username || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="昵称">
          {{ user.nickname || "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="系统角色" :span="2">
          <el-tag
            v-for="r in user.roles"
            :key="r"
            class="mr-1"
            type="info"
            size="small"
          >
            {{ r }}
          </el-tag>
          <span v-if="!user.roles || user.roles.length === 0">—</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never">
      <template #header>修改密码</template>
      <el-form
        ref="pwdRef"
        :model="pwdForm"
        :rules="rules"
        label-width="96px"
        class="pwd-form"
      >
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input
            v-model="pwdForm.oldPassword"
            type="password"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="pwdForm.newPassword"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="pwdForm.confirmPassword"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="onSubmit">
            保存
          </el-button>
        </el-form-item>
      </el-form>
      <div class="pwd-hint">
        改密后会撤销全部「记住登录」凭证,当前会话不受影响。
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}

.pwd-form {
  max-width: 460px;
}

.pwd-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
