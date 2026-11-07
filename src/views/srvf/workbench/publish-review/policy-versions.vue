<script setup lang="ts">
import type { PolicyCoverage } from "./policy-binding";
import PolicyRules from "./policy-rules.vue";
defineOptions({ name: "SrvfReviewReferencedPolicyVersions" });
defineProps<{ coverage: PolicyCoverage }>();
function when(value: string | null) {
  return value === null
    ? "无结束限制"
    : new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        dateStyle: "medium",
        timeStyle: "short",
        hour12: false
      }).format(new Date(value)) + "（北京时间）";
}
</script>

<template>
  <section
    data-testid="referenced-policy-versions"
    class="referenced-policy-versions"
  >
    <h3>这份冻结申请引用的完整政策</h3>
    <p>
      只读取本申请 base 与 target
      实际引用的精确版本。历史版本可以读取，不代表当前允许批准；审批仍会复核引用。
    </p>
    <el-card
      v-for="version in coverage.versions"
      :key="version.kind + version.versionId"
      shadow="never"
      class="policy-version"
    >
      <h4>
        {{ version.kind === "time" ? "时长政策" : "贡献政策" }} · 版本
        {{ version.version }}
      </h4>
      <p>
        政策标识：{{ version.policyId }}；版本标识：{{ version.versionId }}。
      </p>
      <p>
        定义格式 {{ version.schemaVersion }}；解释器
        {{ version.evaluatorVersion }}。版本生效：{{
          when(version.effectiveFrom)
        }}
        至 {{ when(version.effectiveUntil) }}。
      </p>
      <details>
        <summary>冻结引用与校验值</summary>
        <p>定义校验值：{{ version.definitionHash }}</p>
        <ul>
          <li v-for="use in version.uses" :key="use">{{ use }}</li>
        </ul>
      </details>
      <PolicyRules :kind="version.kind" :definition="version.definition" />
    </el-card>
  </section>
</template>

<style scoped lang="scss">
.referenced-policy-versions {
  margin-top: 16px;
  overflow-wrap: anywhere;
}

.policy-version {
  margin-top: 12px;
}
</style>
