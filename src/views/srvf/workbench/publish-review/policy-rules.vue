<script setup lang="ts">
import { computed } from "vue";
import FrozenFacts from "./frozen-facts.vue";
import { timePolicyFacts, contributionPolicyFacts } from "./policy-rules";
defineOptions({ name: "SrvfReviewPolicyRules" });
/** Pure local display input, not the pending review-policy endpoint contract. */
const props = defineProps<{
  kind: "time" | "contribution";
  definition: unknown;
}>();
const presentation = computed(() => {
  try {
    return {
      facts:
        props.kind === "time"
          ? timePolicyFacts(props.definition)
          : contributionPolicyFacts(props.definition),
      error: ""
    };
  } catch (error: unknown) {
    return {
      facts: [],
      error: error instanceof Error ? error.message : "政策规则尚未完整支持。"
    };
  }
});
</script>

<template>
  <section class="policy-rules" :data-testid="`${kind}-policy-rules`">
    <h4>{{ kind === "time" ? "时长认定规则" : "贡献积分规则" }}</h4>
    <el-alert
      v-if="presentation.error"
      type="warning"
      title="政策规则未完整展示，不能据此通过审核"
      :description="presentation.error"
      :closable="false"
      show-icon
    />
    <FrozenFacts v-else :facts="presentation.facts" />
  </section>
</template>

<style scoped lang="scss">
.policy-rules {
  overflow-wrap: anywhere;
}
</style>
