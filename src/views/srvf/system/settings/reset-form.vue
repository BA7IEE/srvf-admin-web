<script setup lang="ts">
import { ref, computed } from "vue";

/** 重置凭证表单。mode=cloud → secretId/secretKey(腾讯云);mode=wechat → appSecret。 */
export type ResetFormModel = {
  secretId: string;
  secretKey: string;
  appSecret: string;
};

const props = withDefaults(
  defineProps<{ formInline?: ResetFormModel; mode?: "cloud" | "wechat" }>(),
  {
    formInline: () => ({ secretId: "", secretKey: "", appSecret: "" }),
    mode: "cloud"
  }
);
const model = ref(props.formInline);
const formRef = ref();

const rules = computed(() =>
  props.mode === "wechat"
    ? {
        appSecret: [
          { required: true, message: "请填写 AppSecret", trigger: "blur" }
        ]
      }
    : {
        secretId: [
          { required: true, message: "请填写 SecretId", trigger: "blur" }
        ],
        secretKey: [
          { required: true, message: "请填写 SecretKey", trigger: "blur" }
        ]
      }
);

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="92px">
    <template v-if="mode === 'cloud'">
      <el-form-item label="SecretId" prop="secretId">
        <el-input v-model="model.secretId" autocomplete="off" />
      </el-form-item>
      <el-form-item label="SecretKey" prop="secretKey">
        <el-input
          v-model="model.secretKey"
          type="password"
          show-password
          autocomplete="off"
        />
      </el-form-item>
    </template>
    <el-form-item v-else label="AppSecret" prop="appSecret">
      <el-input
        v-model="model.appSecret"
        type="password"
        show-password
        autocomplete="off"
      />
    </el-form-item>
    <div class="reset-hint">
      凭证仅超级管理员可重置;AES 加密落库,提交后不回显。
    </div>
  </el-form>
</template>

<style scoped lang="scss">
.reset-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
