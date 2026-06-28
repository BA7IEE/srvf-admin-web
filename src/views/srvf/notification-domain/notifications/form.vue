<script setup lang="ts">
import { ref, computed } from "vue";
import {
  VISIBILITY_OPTIONS,
  CHANNEL_OPTIONS,
  type NotificationVisibility,
  type NotificationChannel
} from "@/api/srvf-notification";

/** 通知撰写表单(镜像 CMS content)。可见性=department 时显示「可见部门」;正文为纯文本 textarea。 */
export type NotificationFormModel = {
  title: string;
  body: string;
  notificationTypeCode: string;
  visibilityCode: NotificationVisibility;
  visibleOrganizationIds: string[];
  channels: NotificationChannel[];
  pinned: boolean;
};
type Option = { label: string; value: string };

const props = withDefaults(
  defineProps<{
    formInline?: NotificationFormModel;
    typeOptions?: Option[];
    orgOptions?: Option[];
  }>(),
  {
    formInline: () => ({
      title: "",
      body: "",
      notificationTypeCode: "",
      visibilityCode: "member",
      visibleOrganizationIds: [],
      channels: ["in-app"],
      pinned: false
    }),
    typeOptions: () => [],
    orgOptions: () => []
  }
);
const model = ref(props.formInline);
const formRef = ref();

const isDept = computed(() => model.value.visibilityCode === "department");

const rules = {
  title: [{ required: true, message: "请填写标题", trigger: "blur" }],
  body: [{ required: true, message: "请填写正文", trigger: "blur" }],
  notificationTypeCode: [
    { required: true, message: "请选择通知类型", trigger: "change" }
  ],
  visibilityCode: [
    { required: true, message: "请选择可见性", trigger: "change" }
  ]
};

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="88px">
    <el-form-item label="标题" prop="title">
      <el-input v-model="model.title" maxlength="200" />
    </el-form-item>
    <el-form-item label="类型" prop="notificationTypeCode">
      <el-select
        v-model="model.notificationTypeCode"
        filterable
        allow-create
        default-first-option
        placeholder="notification_type 字典(查不到可手填码)"
        class="w-full!"
      >
        <el-option
          v-for="o in typeOptions"
          :key="o.value"
          :label="o.label"
          :value="o.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="可见性" prop="visibilityCode">
      <el-select v-model="model.visibilityCode" class="w-full!">
        <el-option
          v-for="o in VISIBILITY_OPTIONS"
          :key="o.value"
          :label="o.label"
          :value="o.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item v-if="isDept" label="可见部门">
      <el-select
        v-model="model.visibleOrganizationIds"
        multiple
        filterable
        placeholder="指定可见部门"
        class="w-full!"
      >
        <el-option
          v-for="o in orgOptions"
          :key="o.value"
          :label="o.label"
          :value="o.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="正文" prop="body">
      <el-input
        v-model="model.body"
        type="textarea"
        :rows="6"
        maxlength="2000"
        show-word-limit
      />
    </el-form-item>
    <el-form-item label="渠道">
      <el-select
        v-model="model.channels"
        multiple
        class="w-full!"
        placeholder="站内恒发;可加微信 / 短信"
      >
        <el-option
          v-for="o in CHANNEL_OPTIONS"
          :key="o.value"
          :label="o.label"
          :value="o.value"
        />
      </el-select>
      <div class="mt-1 text-xs text-gray-400">
        站内恒发(后端强制含 in-app)。勾「微信」→
        发布时向已订阅会员机会式推送;勾「短信」仅声明可兜底
        ——短信**永不随发布自动发**,需在列表「发送短信」显式发起并二次确认计费。
      </div>
    </el-form-item>
    <el-form-item label="置顶">
      <el-switch v-model="model.pinned" />
    </el-form-item>
  </el-form>
</template>
