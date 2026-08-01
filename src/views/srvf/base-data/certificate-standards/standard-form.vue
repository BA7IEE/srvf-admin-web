<script setup lang="ts">
import { ref, computed, watch } from "vue";
import ReCol from "@/components/ReCol";
import type { FormRules } from "element-plus";
import type {
  CertificateStandard,
  CertificateStandardKind
} from "@/api/srvf-certificate-standard";

/** 字典下拉项（value = 后端 code） */
type DictOption = { label: string; value: string };

/**
 * 证书标准表单模型。
 *
 * 字段分三组，可改性完全不同（见 `@/api/srvf-certificate-standard` 的 Update DTO 注释）：
 * - `code`：**永不可改**，编辑时置灰；
 * - 身份组（kind / categoryCode / levelCode / parentId / isInternal）：仅 DRAFT 且从未启用过时可改；
 * - 文案组（name / description / sortOrder）：任何状态都可改。
 */
export type StandardFormModel = {
  isEdit: boolean;
  /** 身份组是否可改 = DRAFT 且 activatedAt 为 null（启用过一次就永久锁死） */
  canEditIdentity: boolean;
  code: string;
  name: string;
  kind: CertificateStandardKind;
  categoryCode: string;
  /** "" = 不设等级 */
  levelCode: string;
  /** "" = 不挂树（根节点） */
  parentId: string;
  isInternal: boolean;
  /** "" = 无说明 */
  description: string;
  sortOrder: number;
  /** 编辑时排除自身，避免把自己选成自己的父级 */
  excludeId: string;
};

const props = withDefaults(
  defineProps<{
    formInline?: StandardFormModel;
    /** 证书大类字典（cert_type）选项 */
    categoryOptions?: DictOption[];
    /** 证书等级字典（cert_sub_type）选项 */
    levelOptions?: DictOption[];
    /** 可作父级的 FAMILY 标准（按 categoryCode 现场过滤） */
    familyOptions?: CertificateStandard[];
  }>(),
  {
    formInline: () => ({
      isEdit: false,
      canEditIdentity: true,
      code: "",
      name: "",
      kind: "CREDENTIAL" as CertificateStandardKind,
      categoryCode: "",
      levelCode: "",
      parentId: "",
      isInternal: false,
      description: "",
      sortOrder: 0,
      excludeId: ""
    }),
    categoryOptions: () => [],
    levelOptions: () => [],
    familyOptions: () => []
  }
);

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

/** 身份组是否置灰：编辑态且已启用过 */
const identityLocked = computed(
  () => newFormInline.value.isEdit && !newFormInline.value.canEditIdentity
);

/**
 * 父级候选 = 同类别的 FAMILY 标准，且不能是自己。
 * 后端约束：父级必为 FAMILY 且 categoryCode 与子节点一致，否则 18019。
 */
const parentCandidates = computed(() =>
  props.familyOptions.filter(
    f =>
      f.categoryCode === newFormInline.value.categoryCode &&
      f.id !== newFormInline.value.excludeId
  )
);

/** 换了类别，原来选的父级可能已不同类 → 就地清掉，别把注定 18019 的组合提交上去 */
watch(
  () => newFormInline.value.categoryCode,
  () => {
    if (
      newFormInline.value.parentId &&
      !parentCandidates.value.some(f => f.id === newFormInline.value.parentId)
    ) {
      newFormInline.value.parentId = "";
    }
  }
);

const rules: FormRules = {
  code: [
    { required: true, message: "请输入标准 code", trigger: "blur" },
    {
      pattern: /^[a-z0-9][a-z0-9_-]*$/,
      message: "只能用小写字母、数字、下划线、中横线",
      trigger: "blur"
    },
    { max: 64, message: "不能超过 64 个字符", trigger: "blur" }
  ],
  name: [
    { required: true, message: "请输入标准名称", trigger: "blur" },
    { max: 128, message: "不能超过 128 个字符", trigger: "blur" }
  ],
  categoryCode: [
    { required: true, message: "请选择证书大类", trigger: "change" }
  ],
  description: [{ max: 500, message: "不能超过 500 个字符", trigger: "blur" }]
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
    label-width="110px"
  >
    <el-alert
      v-if="!newFormInline.isEdit"
      class="mb-4"
      type="warning"
      show-icon
      :closable="false"
      title="标准 code 创建后永久占用"
      description="code 是长期稳定标识，岗位要求、活动门槛、外部系统都可能引用它。创建后不可修改，而且软删也不会释放——请逐字念一遍再提交。"
    />
    <el-alert
      v-else-if="identityLocked"
      class="mb-4"
      type="info"
      show-icon
      :closable="false"
      title="这个标准已经启用过，身份信息不能再改"
      description="类型 / 大类 / 等级 / 父级 / 是否本会颁发在首次启用后永久锁定（即使现在是停用态）。这里只能修正名称、说明和排序。"
    />

    <el-row :gutter="30">
      <re-col>
        <el-form-item label="标准 code" prop="code">
          <el-input
            v-model="newFormInline.code"
            :disabled="newFormInline.isEdit"
            clearable
            placeholder="如 red_cross_first_aid（小写字母 / 数字 / 下划线 / 中横线）"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="标准名称" prop="name">
          <el-input
            v-model="newFormInline.name"
            clearable
            placeholder="如 红十字救护员证"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="类型">
          <el-radio-group
            v-model="newFormInline.kind"
            :disabled="identityLocked"
          >
            <el-radio value="CREDENTIAL">具体证书（可持有）</el-radio>
            <el-radio value="FAMILY">目录节点（仅分组）</el-radio>
          </el-radio-group>
          <div class="form-hint">
            目录节点只用来给证书分组，本身不能被认定、也不能建证。
          </div>
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="证书大类" prop="categoryCode">
          <el-select
            v-model="newFormInline.categoryCode"
            :disabled="identityLocked"
            class="w-full!"
            placeholder="请选择证书大类"
          >
            <el-option
              v-for="opt in categoryOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <div v-if="!categoryOptions.length" class="form-hint">
            没有可选大类：请先到 设置中心 → 字典管理
            的「证书大类」（cert_type）里维护条目。
          </div>
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="证书等级">
          <el-select
            v-model="newFormInline.levelCode"
            :disabled="identityLocked"
            class="w-full!"
            clearable
            placeholder="可不设（留空即不分等级）"
          >
            <el-option
              v-for="opt in levelOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="挂在哪个目录">
          <el-select
            v-model="newFormInline.parentId"
            :disabled="identityLocked"
            class="w-full!"
            clearable
            placeholder="可不挂（留空即放在根上）"
          >
            <el-option
              v-for="f in parentCandidates"
              :key="f.id"
              :label="`${f.name}（${f.code}）`"
              :value="f.id"
            />
          </el-select>
          <div class="form-hint">
            只能挂到同一大类的目录节点下；换大类会清空这里的选择。
          </div>
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="本会颁发">
          <div class="w-full">
            <el-switch
              v-model="newFormInline.isInternal"
              :disabled="identityLocked"
              active-text="是"
              inactive-text="否"
            />
            <div class="form-hint">这张证书是不是由本队自己签发的。</div>
          </div>
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="说明" prop="description">
          <el-input
            v-model="newFormInline.description"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="这个标准认的是什么证书、给谁用（可空）"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item label="排序">
          <el-input-number
            v-model="newFormInline.sortOrder"
            :min="0"
            class="w-full!"
            controls-position="right"
            placeholder="排序权重（越小越前，默认 0）"
          />
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
</style>
