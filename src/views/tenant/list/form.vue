<script setup lang="ts">
import { ref, onMounted } from "vue";
import { formRules } from "./utils/rule";
import { FormProps } from "./utils/types";
import { getTenantPackageSimple } from "@/api/system";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    title: "新增",
    name: "",
    packageId: "",
    contactName: "",
    contactMobile: "",
    username: "",
    password: "",
    accountCount: 0,
    expireTime: "",
    website: "",
    remark: ""
  })
});

const options = ref([]);
const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

function getRef() {
  return ruleFormRef.value;
}

onMounted(async () => {
  options.value = (await getTenantPackageSimple()).data ?? [];
});

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="82px"
  >
    <el-form-item label="租户名" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        placeholder="请输入租户名"
      />
    </el-form-item>

    <el-form-item label="租户套餐" prop="packageId">
      <el-select
        v-model="newFormInline.packageId"
        placeholder="请选择租户套餐"
        clearable
        class="w-full!"
      >
        <el-option
          v-for="(option, index) in options"
          :key="index"
          :label="option.name"
          :value="option.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="联系人" prop="contactName">
      <el-input
        v-model="newFormInline.contactName"
        clearable
        placeholder="请输入联系人"
      />
    </el-form-item>

    <el-form-item label="联系电话" prop="contactMobile">
      <el-input
        v-model="newFormInline.contactMobile"
        clearable
        placeholder="请输入联系电话"
      />
    </el-form-item>

    <el-form-item v-if="newFormInline.title === '新增'" label="用户名称">
      <el-input
        v-model="newFormInline.username"
        clearable
        placeholder="请输入用户名称"
      />
    </el-form-item>

    <el-form-item v-if="newFormInline.title === '新增'" label="用户密码">
      <el-input
        v-model="newFormInline.password"
        clearable
        type="password"
        show-password
        placeholder="请输入用户密码"
      />
    </el-form-item>

    <el-form-item label="账号额度" prop="accountCount">
      <el-input-number
        v-model="newFormInline.accountCount"
        class="w-full!"
        :min="0"
        :max="9999"
        controls-position="right"
      />
    </el-form-item>

    <el-form-item label="过期时间" prop="expireTime">
      <el-date-picker
        v-model="newFormInline.expireTime"
        type="datetime"
        class="w-full!"
        placeholder="请选择过期时间"
        format="YYYY-MM-DD HH:mm:ss"
        value-format="x"
      />
    </el-form-item>

    <el-form-item label="绑定域名" prop="website">
      <el-input
        v-model="newFormInline.website"
        clearable
        placeholder="请输入绑定域名"
      />
    </el-form-item>

    <el-form-item label="备注">
      <el-input
        v-model="newFormInline.remark"
        placeholder="请输入备注信息"
        type="textarea"
      />
    </el-form-item>
  </el-form>
</template>
