<script setup lang="ts">
import { ref, computed } from "vue";

/**
 * 改报名资料表单（R1 白名单）。
 *
 * 两组字段的可改条件由**后端契约**决定，前端只是把闸口画出来、别让人填了白填：
 * - **身份组**（姓名 / 证件号 / 生日 / 性别）：仅 `manual_review` 态**或**非大陆证件记录可改；
 *   已核验的大陆记录改了会被后端以 28045 拒。
 * - **大陆记录的生日与性别**恒由证件号派生，直接传后端返 40000——所以这两项对大陆记录
 *   一律禁用，而不是「留空就行」。
 *
 * 提交前由 hook 负责剔除禁用字段（见 `buildProfilePatch`），表单本身只管显隐与提示。
 */
export type ProfileFormModel = {
  /** 身份组是否可改（manual_review 或非大陆证件） */
  identityEditable: boolean;
  /** 是否非大陆证件（决定生日/性别能否直改） */
  isNonMainlandDocument: boolean;
  realName: string;
  idCardNumber: string;
  birthDate: string;
  genderCode: string;
  detailedAddress: string;
  cityDistrict: string;
  sourceChannel: string;
  /** 进表单时的证件号原值——用来判断「这次到底改没改号」 */
  originalIdCardNumber: string;
};

const props = withDefaults(defineProps<{ formInline?: ProfileFormModel }>(), {
  formInline: () => ({
    identityEditable: false,
    isNonMainlandDocument: false,
    realName: "",
    idCardNumber: "",
    birthDate: "",
    genderCode: "",
    detailedAddress: "",
    cityDistrict: "",
    sourceChannel: "",
    originalIdCardNumber: ""
  })
});
const model = ref(props.formInline);
const formRef = ref();

/** 大陆记录的生日/性别恒由证件号派生，禁改（传了是 40000 不是静默忽略）。 */
const derivedLocked = computed(() => !model.value.isNonMainlandDocument);

/** 改了证件号 → 提前告知会连带重新派生生日与性别，别让人以为只改了一个字段。 */
const idCardChanged = computed(
  () =>
    model.value.identityEditable &&
    model.value.idCardNumber !== model.value.originalIdCardNumber
);

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="model" label-width="104px">
    <el-alert
      v-if="!model.identityEditable"
      type="info"
      show-icon
      :closable="false"
      class="mb-3"
      title="这条记录已通过证件核验，身份信息不可修改"
      description="姓名、证件号、出生日期、性别只能在人工复核态或非大陆证件记录上修改。下面的住址等信息不受限制，随时可改。"
    />

    <el-divider content-position="left">身份信息</el-divider>

    <el-form-item label="真实姓名">
      <el-input
        v-model="model.realName"
        :disabled="!model.identityEditable"
        maxlength="50"
      />
    </el-form-item>

    <el-form-item label="证件号">
      <el-input
        v-model="model.idCardNumber"
        :disabled="!model.identityEditable"
        maxlength="30"
      />
      <div v-if="idCardChanged" class="form-hint form-hint-warn">
        改了证件号：保存后会重新校验并<b>自动重新派生出生日期与性别</b>，
        同时检查本轮是否已有人用这个号报过名。
      </div>
    </el-form-item>

    <el-form-item label="出生日期">
      <el-date-picker
        v-model="model.birthDate"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="YYYY-MM-DD"
        :disabled="!model.identityEditable || derivedLocked"
        class="w-full!"
      />
      <div v-if="derivedLocked" class="form-hint">
        大陆证件的出生日期由证件号自动算出，不能单独改；要改请改证件号。
      </div>
    </el-form-item>

    <el-form-item label="性别">
      <el-radio-group
        v-model="model.genderCode"
        :disabled="!model.identityEditable || derivedLocked"
      >
        <el-radio value="male">男</el-radio>
        <el-radio value="female">女</el-radio>
      </el-radio-group>
      <div v-if="derivedLocked" class="form-hint">
        大陆证件的性别由证件号自动算出，不能单独改；要改请改证件号。
      </div>
    </el-form-item>

    <el-divider content-position="left">联系与来源（随时可改）</el-divider>

    <el-form-item label="城市/区">
      <el-input v-model="model.cityDistrict" maxlength="100" />
    </el-form-item>
    <el-form-item label="详细住址">
      <el-input
        v-model="model.detailedAddress"
        type="textarea"
        :rows="2"
        maxlength="200"
      />
    </el-form-item>
    <el-form-item label="来源渠道">
      <el-input v-model="model.sourceChannel" maxlength="100" />
    </el-form-item>

    <el-alert
      type="info"
      show-icon
      :closable="false"
      title="手机号与微信不在这里改"
      description="换手机号或换微信要走申请人自助换绑（需双向验证码），后台直改会绕过验证、破坏本人身份锚点。"
    />
  </el-form>
</template>

<style scoped>
.form-hint {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.form-hint-warn {
  color: var(--el-color-warning);
}
</style>
