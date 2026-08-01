<script setup lang="ts">
import { ref, computed, watch } from "vue";
import ReCol from "@/components/ReCol";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { FormRules } from "element-plus";
import type {
  IssuerPolicy,
  ValidityMode,
  CertNumberMode
} from "@/api/srvf-certificate-standard";

import Delete from "~icons/ep/delete";
import AddFill from "~icons/ri/add-circle-line";

/**
 * 认定规则表单模型（对齐后端 Create/UpdateCertificateRecognitionPolicyDto）。
 *
 * 三组配置各自决定「建证 / 审核时要填什么」，不是纯记录字段：
 * - `issuerPolicy` 决定机构字段形态（下拉 / 自由文本 / 隐藏）；
 * - `validityMode` 决定到期日必填性（或由后端算）；
 * - `certNumberMode` 决定编号必填性。
 *
 * ⚠️ 机构清单是**整组替换**语义（后端不做增量 merge），所以这里就按整块编辑。
 */
export type PolicyFormModel = {
  isEdit: boolean;
  issuerPolicy: IssuerPolicy;
  validityMode: ValidityMode;
  /** 仅 FIXED_MONTHS 有值（1-600） */
  validityMonths: number | null;
  certNumberMode: CertNumberMode;
  /** 认可机构名称清单（提交时转成 [{ name }]，id 由后端分配） */
  issuerNames: string[];
};

const props = withDefaults(defineProps<{ formInline?: PolicyFormModel }>(), {
  formInline: () => ({
    isEdit: false,
    issuerPolicy: "ALLOWLIST" as IssuerPolicy,
    validityMode: "PERMANENT" as ValidityMode,
    validityMonths: null,
    certNumberMode: "OPTIONAL" as CertNumberMode,
    issuerNames: [""]
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

const isFreeText = computed(
  () => newFormInline.value.issuerPolicy === "FREE_TEXT"
);
const isFixedIssuer = computed(
  () => newFormInline.value.issuerPolicy === "FIXED"
);
const isFixedMonths = computed(
  () => newFormInline.value.validityMode === "FIXED_MONTHS"
);

/**
 * 机构清单行数随策略自动对齐后端硬约束（FIXED 恰好 1 / ALLOWLIST ≥1 / FREE_TEXT 必须空），
 * 免得用户填完才被 18013 打回来。
 */
watch(
  () => newFormInline.value.issuerPolicy,
  policy => {
    const names = newFormInline.value.issuerNames;
    if (policy === "FREE_TEXT") {
      newFormInline.value.issuerNames = [];
    } else if (policy === "FIXED") {
      newFormInline.value.issuerNames = [names[0] ?? ""];
    } else if (!names.length) {
      newFormInline.value.issuerNames = [""];
    }
  }
);

/** 只有 FIXED_MONTHS 能带月数，其余模式传值即 18015 → 切走就清掉 */
watch(
  () => newFormInline.value.validityMode,
  mode => {
    if (mode !== "FIXED_MONTHS") newFormInline.value.validityMonths = null;
    else if (newFormInline.value.validityMonths == null)
      newFormInline.value.validityMonths = 24;
  }
);

function addIssuer() {
  newFormInline.value.issuerNames.push("");
}

function removeIssuer(index: number) {
  newFormInline.value.issuerNames.splice(index, 1);
}

const rules: FormRules = {
  validityMonths: [
    {
      validator: (_rule, value, callback) => {
        if (!isFixedMonths.value) return callback();
        if (value == null || value === "")
          return callback(new Error("固定月数模式下必须填写有效月数"));
        if (value < 1 || value > 600)
          return callback(new Error("有效月数须在 1 ~ 600 之间"));
        callback();
      },
      trigger: "blur"
    }
  ],
  issuerNames: [
    {
      validator: (_rule, _value, callback) => {
        const names = newFormInline.value.issuerNames
          .map(n => n.trim())
          .filter(Boolean);
        const policy = newFormInline.value.issuerPolicy;
        if (policy === "FREE_TEXT") return callback();
        if (policy === "FIXED" && names.length !== 1)
          return callback(new Error("固定机构模式下必须且只能填 1 个机构"));
        if (policy === "ALLOWLIST" && names.length < 1)
          return callback(new Error("名单模式下至少要填 1 个机构"));
        if (new Set(names).size !== names.length)
          return callback(new Error("机构名不能重复"));
        if (names.some(n => n.length > 128))
          return callback(new Error("机构名不能超过 128 个字符"));
        callback();
      },
      trigger: "blur"
    }
  ]
};

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
    label-width="120px"
  >
    <el-alert
      class="mb-4"
      type="info"
      show-icon
      :closable="false"
      title="这三组配置决定「以后建证 / 审核时要填什么」"
      description="不是记录用的备注：机构策略决定机构字段长什么样，有效期模式决定到期日是必填还是后端算，编号规则决定证书编号必不必填。"
    />

    <el-row :gutter="30">
      <re-col>
        <el-form-item label="机构策略">
          <el-radio-group v-model="newFormInline.issuerPolicy">
            <el-radio value="ALLOWLIST">从名单里选</el-radio>
            <el-radio value="FIXED">固定一家</el-radio>
            <el-radio value="FREE_TEXT">自由填写</el-radio>
          </el-radio-group>
          <div class="form-hint">
            <template v-if="isFreeText">
              建证时由录入人手填机构名称，本规则不维护机构清单。
            </template>
            <template v-else-if="isFixedIssuer">
              只认这一家机构，建证时不用选，后端自动带上。
            </template>
            <template v-else> 建证时必须从下面这份名单里选一家。 </template>
          </div>
        </el-form-item>
      </re-col>

      <re-col v-if="!isFreeText">
        <el-form-item label="认可机构" prop="issuerNames">
          <div class="w-full">
            <el-alert
              v-if="newFormInline.isEdit"
              class="mb-2"
              type="warning"
              show-icon
              :closable="false"
              title="保存时整份名单会被替换"
              description="后端不做逐条合并——这里最终留下的几行就是保存后的完整名单。"
            />
            <div
              v-for="(_, index) in newFormInline.issuerNames"
              :key="index"
              class="issuer-row"
            >
              <el-input
                v-model="newFormInline.issuerNames[index]"
                clearable
                placeholder="机构名称，如 深圳市红十字会"
              />
              <el-button
                v-if="!isFixedIssuer"
                link
                type="danger"
                :icon="useRenderIcon(Delete)"
                :disabled="newFormInline.issuerNames.length <= 1"
                @click="removeIssuer(index)"
              />
            </div>
            <el-button
              v-if="!isFixedIssuer"
              link
              type="primary"
              :icon="useRenderIcon(AddFill)"
              @click="addIssuer"
            >
              添加机构
            </el-button>
            <div class="form-hint">
              这份名单是「<b>这一个标准</b>认可哪些机构签发」，不是「这个大类下所有可能的发证机构」。
              不同机构发的如果是两种不同的证书（培训内容、有效期不一样），应该建成两个标准、共用一个大类。
            </div>
          </div>
        </el-form-item>
      </re-col>

      <re-col>
        <el-form-item label="有效期模式">
          <el-radio-group v-model="newFormInline.validityMode">
            <el-radio value="PERMANENT">终身有效</el-radio>
            <el-radio value="FIXED_MONTHS">固定月数</el-radio>
            <el-radio value="EXPLICIT_REQUIRED">建证时必填到期日</el-radio>
            <el-radio value="EXPLICIT_OPTIONAL">建证时可填到期日</el-radio>
          </el-radio-group>
          <div class="form-hint">
            「固定月数」由后端按自然月从发证日算出到期日，录入人不用也不能自己填。
          </div>
        </el-form-item>
      </re-col>

      <re-col v-if="isFixedMonths">
        <el-form-item label="有效月数" prop="validityMonths">
          <el-input-number
            v-model="newFormInline.validityMonths"
            :min="1"
            :max="600"
            class="w-full!"
            controls-position="right"
            placeholder="1 ~ 600"
          />
          <div class="form-hint">例如两年填 24、三年填 36。</div>
        </el-form-item>
      </re-col>

      <re-col>
        <el-form-item label="编号规则">
          <el-radio-group v-model="newFormInline.certNumberMode">
            <el-radio value="REQUIRED">必填</el-radio>
            <el-radio value="OPTIONAL">可填可不填</el-radio>
            <el-radio value="NONE">这类证书没有编号</el-radio>
          </el-radio-group>
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>

<style scoped lang="scss">
.form-hint {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.issuer-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
</style>
