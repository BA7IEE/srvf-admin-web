<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import type { FormRules } from "element-plus";
import { message } from "@/utils/message";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import {
  getCertificateStandardOptions,
  type CertificateStandardOption
} from "@/api/srvf-certificate";
import {
  getCertificateClaim,
  reviewCertificateClaim,
  certificateClaimBizErrorMessage,
  type RecruitmentCertificateClaim,
  type ReviewCertificateClaimBody
} from "@/api/srvf-recruitment";

/**
 * 证书申报审核抽屉（`addDrawer` 函数式范式：只写内容，`defineExpose({ save })` 供 beforeSure 调）。
 *
 * 核心纪律：**标准必须由审核员显式选定**。申请人填的证书名和「建议标准」都只是线索，
 * 后端也拒绝不带 `standardId` 的通过（28061）。所以这里只把建议**预填**，
 * 并明确标注它来自申请人；审核员改成别的、或干脆不通过，都是正常路径。
 */
const props = defineProps<{ claim: RecruitmentCertificateClaim }>();

const router = useRouter();
const dict = useSrvfDictStoreHook();

const formRef = ref();
/** 本地副本：CAS 冲突自动刷新后就地替换，不要求关掉重开 */
const claim = ref<RecruitmentCertificateClaim>(props.claim);

const form = ref({
  decision: "APPROVE" as "APPROVE" | "REJECT" | "NEEDS_INFO",
  standardId: "",
  recognitionIssuerId: "",
  issuingOrg: "",
  certNumber: "",
  issuedAt: "",
  expiredAt: "",
  note: ""
});

const standardOptions = ref<CertificateStandardOption[]>([]);
const selectedStandard = computed(() =>
  standardOptions.value.find(s => s.id === form.value.standardId)
);
/** 表单形态全由所选标准的生效认定规则决定，前端不另立规矩 */
const policy = computed(() => selectedStandard.value?.currentPolicy ?? null);

const isApprove = computed(() => form.value.decision === "APPROVE");
const noteRequired = computed(() => !isApprove.value);
const certNumberHidden = computed(
  () => policy.value?.certNumberMode === "NONE"
);
const certNumberRequired = computed(
  () => policy.value?.certNumberMode === "REQUIRED"
);
/** PERMANENT 与 FIXED_MONTHS 都**不得**传到期日（后端算或必须空） */
const expiryAuto = computed(
  () =>
    policy.value?.validityMode === "PERMANENT" ||
    policy.value?.validityMode === "FIXED_MONTHS"
);
const expiryRequired = computed(
  () => policy.value?.validityMode === "EXPLICIT_REQUIRED"
);
const expiryHint = computed(() => {
  if (policy.value?.validityMode === "PERMANENT")
    return "该标准为终身有效，无到期日";
  if (policy.value?.validityMode === "FIXED_MONTHS")
    return `该标准固定 ${policy.value.validityMonths ?? "—"} 个月有效，到期日由后端按发证日期自动算`;
  return "";
});

/** 申请人的建议（仅提示，不是结论） */
const suggested = computed(() => claim.value.suggestedStandard);
/** 建议标准是否在可选列表里（不在 = 它可能已停用或没有生效规则） */
const suggestionSelectable = computed(
  () =>
    !!suggested.value &&
    standardOptions.value.some(s => s.id === suggested.value!.id)
);

const rules = computed<FormRules>(() => ({
  standardId: [
    {
      validator: (_r, v, cb) =>
        isApprove.value && !v
          ? cb(new Error("通过前必须选定一个具体的证书标准"))
          : cb(),
      trigger: "change"
    }
  ],
  issuedAt: [
    {
      validator: (_r, v, cb) =>
        isApprove.value && !v ? cb(new Error("请填写发证日期")) : cb(),
      trigger: "change"
    }
  ],
  recognitionIssuerId: [
    {
      validator: (_r, v, cb) =>
        isApprove.value && policy.value?.issuerPolicy === "ALLOWLIST" && !v
          ? cb(new Error("该标准要求从认可名单里选一家机构"))
          : cb(),
      trigger: "change"
    }
  ],
  issuingOrg: [
    {
      validator: (_r, v, cb) =>
        isApprove.value && policy.value?.issuerPolicy === "FREE_TEXT" && !v
          ? cb(new Error("该标准要求填写发证机构"))
          : cb(),
      trigger: "blur"
    }
  ],
  certNumber: [
    {
      validator: (_r, v, cb) =>
        isApprove.value && certNumberRequired.value && !v
          ? cb(new Error("该标准要求填写证书编号"))
          : cb(),
      trigger: "blur"
    }
  ],
  expiredAt: [
    {
      validator: (_r, v, cb) =>
        isApprove.value && expiryRequired.value && !v
          ? cb(new Error("该标准要求填写到期日"))
          : cb(),
      trigger: "change"
    }
  ],
  note: [
    {
      validator: (_r, v, cb) =>
        noteRequired.value && !String(v ?? "").trim()
          ? cb(new Error("拒绝与要求补材料都必须写明原因（申请人可见）"))
          : cb(),
      trigger: "blur"
    },
    { max: 500, message: "不能超过 500 字", trigger: "blur" }
  ]
}));

onMounted(async () => {
  dict.ensureType("cert_type");
  try {
    // 只要「有生效认定规则」的标准：没有规则的选了也必被 28062 拒
    const { code, data } = await getCertificateStandardOptions({
      recognizedOnly: true,
      limit: 200
    });
    if (code === 0) standardOptions.value = data.items;
  } catch {
    standardOptions.value = [];
  }
  // 预填申请人的建议（可选中才填，否则留空强制审核员自己选）
  if (suggestionSelectable.value) {
    form.value.standardId = suggested.value!.id;
  }
});

function goStandardLibrary() {
  router.push("/srvf/base-data/certificate-standards");
}

/** 按认定规则只发该发的字段——多发一个后端直接拒 */
function buildBody(): ReviewCertificateClaimBody {
  const f = form.value;
  const body: ReviewCertificateClaimBody = {
    decision: f.decision,
    version: claim.value.version
  };
  if (f.note.trim()) body.note = f.note.trim();
  if (!isApprove.value) return body;

  body.standardId = f.standardId;
  body.issuedAt = f.issuedAt;
  if (policy.value?.issuerPolicy === "ALLOWLIST")
    body.recognitionIssuerId = f.recognitionIssuerId;
  if (policy.value?.issuerPolicy === "FREE_TEXT")
    body.issuingOrg = f.issuingOrg.trim();
  if (!certNumberHidden.value && f.certNumber.trim())
    body.certNumber = f.certNumber.trim();
  if (!expiryAuto.value && f.expiredAt) body.expiredAt = f.expiredAt;
  return body;
}

/**
 * `beforeSure` 调这个。resolve = 关抽屉并刷新；reject = 保持打开待重试。
 *
 * **CAS 冲突（28058）沿保险面 26011 范式**：不静默重试覆盖，而是自动把最新版本
 * 取回来、就地更新 version，再让审核员基于新状态确认一次。
 */
async function save() {
  await formRef.value.validate();
  try {
    await reviewCertificateClaim(claim.value.id, buildBody());
    message("审核已提交", { type: "success" });
  } catch (error: any) {
    const code = Number(error?.response?.data?.code);
    if (code === 28058) {
      try {
        const { code: c, data } = await getCertificateClaim(claim.value.id);
        if (c === 0) claim.value = data;
      } catch {
        // 刷不到就保持原值，下面的提示照给
      }
      message(
        "这条申报刚被他人更新（可能申请人重传了材料）。已刷新到最新版本，请核对后重新提交",
        { type: "warning", duration: 6000 }
      );
      throw error;
    }
    message(certificateClaimBizErrorMessage(error, "审核提交失败"), {
      type: "error"
    });
    throw error;
  }
}

defineExpose({ save });
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
    <!-- 申请人自报内容：只读，跟审核结论严格分开摆 -->
    <el-descriptions title="申请人提交的内容" :column="1" border size="small">
      <el-descriptions-item label="证书名称">
        {{ claim.rawCertificateName || "（未填）" }}
      </el-descriptions-item>
      <el-descriptions-item label="类别提示">
        {{ dict.label("cert_type", claim.categoryHintCode) }}
        <span class="hint">（申请人自选，不是审核结论）</span>
      </el-descriptions-item>
      <el-descriptions-item label="建议标准">
        <template v-if="suggested">
          {{ suggested.name }}（{{ suggested.code }}）
          <span class="hint">（仅供参考，可更正）</span>
        </template>
        <span v-else class="hint">申请人没选建议标准</span>
      </el-descriptions-item>
      <el-descriptions-item label="证据图">
        {{ claim.imageCount }} 张
      </el-descriptions-item>
    </el-descriptions>

    <el-form-item label="审核决定" class="mt-4">
      <el-radio-group v-model="form.decision">
        <el-radio value="APPROVE">通过</el-radio>
        <el-radio value="NEEDS_INFO">要求补充材料</el-radio>
        <el-radio value="REJECT">拒绝</el-radio>
      </el-radio-group>
    </el-form-item>

    <template v-if="isApprove">
      <el-alert
        v-if="suggested && !suggestionSelectable"
        class="mb-3"
        type="warning"
        show-icon
        :closable="false"
        title="申请人建议的标准现在选不了"
        description="它可能已停用，或还没有生效的认定规则。请另选一个，或先到证书标准库把它配好。"
      />

      <el-form-item label="证书标准" prop="standardId">
        <el-select
          v-model="form.standardId"
          filterable
          clearable
          class="w-full!"
          placeholder="必须由你选定，申请人的建议只是线索"
        >
          <el-option
            v-for="s in standardOptions"
            :key="s.id"
            :label="`${s.name}（${s.code}）`"
            :value="s.id"
          />
        </el-select>
        <div class="hint">
          找不到合适的标准？那就<b>先别通过</b>——改选「要求补充材料」问清楚，
          或先到
          <el-button link type="primary" @click="goStandardLibrary">
            证书标准库
          </el-button>
          把这个标准收录并配好认定规则。列表里只列「已有生效认定规则」的标准。
        </div>
      </el-form-item>

      <!-- 机构：形态由认定规则的 issuerPolicy 决定，三选一 -->
      <el-form-item
        v-if="policy?.issuerPolicy === 'ALLOWLIST'"
        label="发证机构"
        prop="recognitionIssuerId"
      >
        <el-select
          v-model="form.recognitionIssuerId"
          class="w-full!"
          placeholder="从该标准的认可名单里选"
        >
          <el-option
            v-for="iss in policy.issuers"
            :key="iss.id"
            :label="iss.name"
            :value="iss.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-else-if="policy?.issuerPolicy === 'FREE_TEXT'"
        label="发证机构"
        prop="issuingOrg"
      >
        <el-input
          v-model="form.issuingOrg"
          clearable
          placeholder="该标准允许自由填写发证机构"
        />
      </el-form-item>
      <el-form-item
        v-else-if="policy?.issuerPolicy === 'FIXED'"
        label="发证机构"
      >
        <span class="hint">
          {{ policy.issuers[0]?.name ?? "由该标准的认定规则固定" }}（无需选择）
        </span>
      </el-form-item>

      <el-form-item v-if="!certNumberHidden" label="证书编号" prop="certNumber">
        <el-input
          v-model="form.certNumber"
          clearable
          :placeholder="
            certNumberRequired ? '该标准要求填写证书编号' : '可填可不填'
          "
        />
      </el-form-item>

      <el-form-item label="发证日期" prop="issuedAt">
        <el-date-picker
          v-model="form.issuedAt"
          type="date"
          value-format="YYYY-MM-DD"
          class="w-full!"
          placeholder="不得晚于今天"
        />
      </el-form-item>

      <el-form-item v-if="!expiryAuto" label="到期日" prop="expiredAt">
        <el-date-picker
          v-model="form.expiredAt"
          type="date"
          value-format="YYYY-MM-DD"
          class="w-full!"
          :placeholder="expiryRequired ? '该标准要求填写' : '可空即终身有效'"
        />
      </el-form-item>
      <el-form-item v-else label="到期日">
        <span class="hint">{{ expiryHint }}</span>
      </el-form-item>
    </template>

    <el-form-item label="说明" prop="note">
      <el-input
        v-model="form.note"
        type="textarea"
        :rows="3"
        maxlength="500"
        show-word-limit
        :placeholder="
          noteRequired
            ? '必填：告诉申请人缺什么 / 为什么不通过（申请人可见）'
            : '可选：备注（申请人可见）'
        "
      />
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
.hint {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
</style>
