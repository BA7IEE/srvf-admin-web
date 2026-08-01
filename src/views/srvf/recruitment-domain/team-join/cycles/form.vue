<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { message } from "@/utils/message";
import { bizErrorMessage } from "@/api/srvf-error";
import { getOrgOptions, type OrgOptionItem } from "@/api/srvf-organization";
import {
  TJ_MAX_OPEN_ORGS,
  TJ_MAX_TARGET_ORGS_RANGE
} from "@/api/srvf-team-join";

/**
 * 入队轮表单。
 * create：year/name + 本轮配置；edit：name + 本轮配置（year 只读，更新契约不含 year）。
 */
export type TjCycleFormModel = {
  isEdit: boolean;
  year: number | undefined;
  name: string;
  /** 本轮开放候选部门；**空 = 全部 ACTIVE 部门**（不是一个都不开放） */
  openOrganizationIds: string[];
  /** 每人可报部门数上限（1~2，默认 2） */
  maxTargetOrgs: number;
  /** 最终入队是否校验保险（依赖后端保险总闸才真正生效） */
  requiresInsurance: boolean;
};

const props = withDefaults(defineProps<{ formInline?: TjCycleFormModel }>(), {
  formInline: () => ({
    isEdit: false,
    year: undefined,
    name: "",
    openOrganizationIds: [],
    maxTargetOrgs: TJ_MAX_TARGET_ORGS_RANGE.default,
    requiresInsurance: false
  })
});
const model = ref(props.formInline);
const formRef = ref();

const rules = {
  year: [{ required: true, message: "请填写年度", trigger: "blur" }],
  name: [{ required: true, message: "请填写轮次名称", trigger: "blur" }]
};

/* --------------------------- 开放部门选项（部门轴） --------------------------- */
const orgOptions = ref<OrgOptionItem[]>([]);
const orgLoading = ref(false);

async function loadOrgs(q?: string) {
  orgLoading.value = true;
  try {
    // limit 上限 100（后端硬校验，超出 400）
    const { code, data } = await getOrgOptions({
      status: "ACTIVE",
      limit: 100,
      ...(q ? { q } : {})
    });
    if (code === 0) orgOptions.value = data.items;
  } catch (error: any) {
    message(bizErrorMessage(error, "加载部门选项失败"), { type: "error" });
  } finally {
    orgLoading.value = false;
  }
}

onMounted(() => loadOrgs());

/** 选空 = 全部开放，这条语义反直觉，要一直显式写在界面上 */
const openAll = computed(() => model.value.openOrganizationIds.length === 0);

function getRef() {
  return formRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="120px">
    <el-form-item v-if="model.isEdit" label="年度">
      <span>{{ model.year }}</span>
    </el-form-item>
    <el-form-item v-else label="年度" prop="year">
      <el-input-number v-model="model.year" :min="2000" :max="2100" />
    </el-form-item>

    <el-form-item label="轮次名称" prop="name">
      <el-input
        v-model="model.name"
        maxlength="100"
        placeholder="如:2026 年入队考核"
      />
    </el-form-item>

    <el-divider content-position="left">本轮报名规则</el-divider>

    <el-form-item label="开放部门">
      <el-select
        v-model="model.openOrganizationIds"
        multiple
        filterable
        remote
        clearable
        collapse-tags
        collapse-tags-tooltip
        :remote-method="loadOrgs"
        :loading="orgLoading"
        :multiple-limit="TJ_MAX_OPEN_ORGS"
        class="w-full!"
        placeholder="不选 = 全部部门都开放"
      >
        <el-option
          v-for="o in orgOptions"
          :key="o.id"
          :label="o.label"
          :value="o.id"
        />
      </el-select>
      <div class="form-hint">
        <template v-if="openAll">
          <b>当前不限：全部在用部门都可以报。</b>
          只有需要限定范围时才逐个选——留空不是「一个都不开放」。
        </template>
        <template v-else>
          已限定 {{ model.openOrganizationIds.length }} 个部门，申请人只能从这些
          里面选（最多可设 {{ TJ_MAX_OPEN_ORGS }} 个）。
        </template>
      </div>
    </el-form-item>

    <el-form-item label="每人可报部门数">
      <el-input-number
        v-model="model.maxTargetOrgs"
        :min="TJ_MAX_TARGET_ORGS_RANGE.min"
        :max="TJ_MAX_TARGET_ORGS_RANGE.max"
      />
      <div class="form-hint">
        每个申请人最多能填几个志愿部门（默认
        {{ TJ_MAX_TARGET_ORGS_RANGE.default }} 个）。最终入队时仍然只定一个。
      </div>
    </el-form-item>

    <el-form-item label="入队校验保险">
      <el-switch v-model="model.requiresInsurance" />
      <div class="form-hint">
        开启后，最终入队时会校验这个人在<b>入队当天</b>有有效保险（本人自购且已核
        验，或已被队内统一保单覆盖）。
      </div>
      <div class="form-hint form-hint-warn">
        注意：这一项要后台的保险总开关也开着才真正拦人；总开关没开时，它只是把设
        置记下来，不会实际校验。
      </div>
    </el-form-item>
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
