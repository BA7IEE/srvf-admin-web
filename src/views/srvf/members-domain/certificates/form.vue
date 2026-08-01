<script setup lang="ts">
import { ref, computed } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";
import type { CertificateStandardOption } from "@/api/srvf-certificate";

/**
 * 证书弹窗表单（证书标准库契约）。
 *
 * 这张表单的形态**不是前端定的**：选定证书标准后，机构怎么填、到期日要不要填、
 * 编号是否必填，全部由该标准当前生效的「认定规则」决定（`currentPolicy`）。
 * 前端只负责按规则渲染并提交对应字段——传错字段后端会直接拒。
 */
export type CertificateFormModel = {
  isEdit: boolean;
  /** 编辑态的原状态 code：非 pending 时后端不允许改标准（18033） */
  certStatusCode: string;
  /** 证书标准 id（分类 / 等级的唯一来源） */
  standardId: string;
  /** 认可机构 id（ALLOWLIST 规则用） */
  recognitionIssuerId: string;
  /** 自由机构名（FREE_TEXT 规则用） */
  issuingOrg: string;
  /** 证书编号（编辑态用 certNumberFull 回填；无敏感权限时为空且禁用） */
  certNumber: string;
  /** 颁发日期（纯日期 YYYY-MM-DD） */
  issuedAt: string;
  /** 最后有效日（纯日期 YYYY-MM-DD） */
  expiredAt: string;
};

const props = withDefaults(
  defineProps<{
    formInline?: CertificateFormModel;
    /** 可选证书标准（已按 recognizedOnly=true 取，均有生效认定规则） */
    standardOptions?: CertificateStandardOption[];
    /**
     * 是否持 `certificate.read.sensitive`。无此码时后端不返编号明文，
     * 编辑态必须禁用编号输入且不提交——绝不能把掩码串写回去。
     * 默认 true：新建态不误禁（新建是用户自己录入真实编号）。
     */
    canReadSensitive?: boolean;
  }>(),
  {
    canReadSensitive: true,
    formInline: () => ({
      isEdit: false,
      certStatusCode: "",
      standardId: "",
      recognitionIssuerId: "",
      issuingOrg: "",
      certNumber: "",
      issuedAt: "",
      expiredAt: ""
    }),
    standardOptions: () => []
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

/** 当前选中的标准；未选时为 undefined，此时机构 / 到期日 / 编号一律不渲染 */
const selectedStandard = computed(() =>
  props.standardOptions.find(o => o.id === newFormInline.value.standardId)
);
/** 该标准当前生效的认定规则——表单形态的唯一依据 */
const policy = computed(() => selectedStandard.value?.currentPolicy ?? null);

/** 标准只有 pending 态可改（非 pending 后端返 18033） */
const standardLocked = computed(
  () =>
    newFormInline.value.isEdit &&
    newFormInline.value.certStatusCode !== "pending"
);

/** 编号明文不可见时锁定编号输入（编辑态且无敏感码） */
const certNumberLocked = computed(
  () => newFormInline.value.isEdit && !props.canReadSensitive
);

/** 编号是否完全不适用（NONE 规则下后端不接受编号） */
const certNumberHidden = computed(
  () => policy.value?.certNumberMode === "NONE"
);
const certNumberRequired = computed(
  () => policy.value?.certNumberMode === "REQUIRED" && !certNumberLocked.value
);

/** 到期日：PERMANENT 必须空、FIXED_MONTHS 由后端算——两者都不给输入 */
const expiredAtHidden = computed(
  () =>
    policy.value?.validityMode === "PERMANENT" ||
    policy.value?.validityMode === "FIXED_MONTHS"
);
const expiredAtRequired = computed(
  () => policy.value?.validityMode === "EXPLICIT_REQUIRED"
);
/** 到期日不给输入时的说明文案（说清是谁决定的，别让人以为是漏了） */
const expiredAtHint = computed(() => {
  if (policy.value?.validityMode === "PERMANENT")
    return "该标准为终身有效，无到期日";
  if (policy.value?.validityMode === "FIXED_MONTHS")
    return `该标准固定 ${policy.value.validityMonths ?? "—"} 个月有效，到期日由系统按颁发日期自动计算`;
  return "";
});

const rules = computed<FormRules>(() => ({
  standardId: [
    { required: true, message: "请选择证书标准", trigger: "change" }
  ],
  issuedAt: [{ required: true, message: "请选择颁发日期", trigger: "change" }],
  recognitionIssuerId: [
    {
      required: policy.value?.issuerPolicy === "ALLOWLIST",
      message: "请选择颁发机构",
      trigger: "change"
    }
  ],
  issuingOrg: [
    {
      required: policy.value?.issuerPolicy === "FREE_TEXT",
      message: "请输入颁发机构",
      trigger: "blur"
    }
  ],
  certNumber: [
    {
      required: certNumberRequired.value,
      message: "该标准要求填写证书编号",
      trigger: "blur"
    }
  ],
  expiredAt: [
    {
      required: expiredAtRequired.value,
      message: "该标准要求填写最后有效日",
      trigger: "change"
    }
  ]
}));

/** 换标准就清掉上一条规则残留的机构 / 编号 / 到期日，避免把 A 标准的值提交给 B 标准 */
function onStandardChange() {
  newFormInline.value.recognitionIssuerId = "";
  newFormInline.value.issuingOrg = "";
  if (certNumberHidden.value) newFormInline.value.certNumber = "";
  if (expiredAtHidden.value) newFormInline.value.expiredAt = "";
}

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="rules"
    label-width="102px"
  >
    <!-- v0.45：改动关键信息会让已核验/已拒绝的证书自动退回待核验 -->
    <el-alert
      v-if="newFormInline.isEdit"
      class="mb-4"
      type="info"
      :closable="false"
      show-icon
      title="改动关键信息会退回待核验"
    >
      <span class="text-xs/5">
        证书标准、颁发机构、证书编号、颁发日期、到期日中任一项<strong>实际发生变化</strong>时，已核验
        /
        已拒绝的证书会自动退回「待核验」，原有核验人、核验时间与核验备注一并清空，需要重新复核。只改其它内容或原样保存不会退回。
      </span>
    </el-alert>

    <el-row :gutter="30">
      <re-col>
        <el-form-item label="证书标准" prop="standardId">
          <el-select
            v-model="newFormInline.standardId"
            :disabled="standardLocked"
            class="w-full!"
            clearable
            filterable
            placeholder="选择证书标准（决定分类、机构与有效期规则）"
            @change="onStandardChange"
          >
            <el-option
              v-for="opt in standardOptions"
              :key="opt.id"
              :label="opt.name"
              :value="opt.id"
            />
          </el-select>
          <div v-if="standardLocked" class="cert-field-hint">
            证书已核验或已拒绝，标准不可再改；如需更正请先让它回到「待核验」
          </div>
        </el-form-item>
      </re-col>

      <!-- 机构：形态由认定规则的 issuerPolicy 决定，三选一 -->
      <re-col v-if="policy?.issuerPolicy === 'ALLOWLIST'">
        <el-form-item label="颁发机构" prop="recognitionIssuerId">
          <el-select
            v-model="newFormInline.recognitionIssuerId"
            class="w-full!"
            clearable
            filterable
            placeholder="从该标准认可的机构中选择"
          >
            <el-option
              v-for="iss in policy.issuers"
              :key="iss.id"
              :label="iss.name"
              :value="iss.id"
            />
          </el-select>
        </el-form-item>
      </re-col>

      <re-col v-else-if="policy?.issuerPolicy === 'FREE_TEXT'">
        <el-form-item label="颁发机构" prop="issuingOrg">
          <el-input
            v-model="newFormInline.issuingOrg"
            clearable
            maxlength="128"
            placeholder="该标准允许自由填写颁发机构"
          />
        </el-form-item>
      </re-col>

      <re-col v-else-if="policy?.issuerPolicy === 'FIXED'">
        <el-form-item label="颁发机构">
          <span class="cert-field-static">
            {{ policy.issuers[0]?.name ?? "由该标准的认定规则固定" }}
          </span>
          <div class="cert-field-hint">
            该标准只认一家机构，无需选择，由系统自动填入
          </div>
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="颁发日期" prop="issuedAt">
          <el-date-picker
            v-model="newFormInline.issuedAt"
            class="w-full!"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择颁发日期（不得晚于今天）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12">
        <el-form-item label="有效期至" prop="expiredAt">
          <el-date-picker
            v-if="!expiredAtHidden"
            v-model="newFormInline.expiredAt"
            class="w-full!"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="
              expiredAtRequired ? '该标准要求填写' : '留空 = 终身有效'
            "
          />
          <span v-else class="cert-field-static">—</span>
          <div v-if="expiredAtHint" class="cert-field-hint">
            {{ expiredAtHint }}
          </div>
        </el-form-item>
      </re-col>

      <re-col v-if="!certNumberHidden">
        <el-form-item label="证书编号" prop="certNumber">
          <el-input
            v-model="newFormInline.certNumber"
            :disabled="certNumberLocked"
            clearable
            maxlength="128"
            :placeholder="
              certNumberLocked
                ? '需「证书敏感信息查看」权限方可编辑'
                : certNumberRequired
                  ? '该标准要求填写证书编号'
                  : '证书编号（可空）'
            "
          />
          <div v-if="certNumberLocked" class="cert-field-hint">
            列表只显示编号掩码，这里看不到明文，因此不允许编辑；保存不会覆盖后端真实编号
          </div>
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>

<style scoped>
.cert-field-hint {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-color-info);
}

.cert-field-static {
  color: var(--el-text-color-regular);
}
</style>
