<script setup lang="ts">
import type { FrozenFact } from "./snapshot";
defineOptions({ name: "SrvfFrozenReviewFacts" });
defineProps<{ facts: FrozenFact[] }>();
</script>

<template>
  <dl class="frozen-facts">
    <div v-for="(fact, index) in facts" :key="index" class="frozen-fact">
      <dt>{{ fact.label }}</dt>
      <dd>
        <SrvfFrozenReviewFacts v-if="fact.children" :facts="fact.children" />
        <span v-else>{{ fact.value }}</span>
      </dd>
    </div>
  </dl>
</template>

<style scoped lang="scss">
.frozen-facts {
  margin: 0;
}

.frozen-fact {
  padding: 8px 0;
  overflow-wrap: anywhere;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

dt {
  font-weight: 600;
  color: var(--el-text-color-regular);
}

dd {
  margin: 4px 0 0 12px;
  white-space: pre-wrap;
}
</style>
