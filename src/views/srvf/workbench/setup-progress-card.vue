<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { hasPerms } from "@/utils/auth";
import { getDictTypes } from "@/api/srvf-dict";
import { getOrgOptions } from "@/api/srvf-organization";
import { getPositionOptions, getPositionRules } from "@/api/srvf-position";
import { getContributionRules } from "@/api/srvf-contribution-rule";

defineOptions({
  name: "SrvfSetupProgressCard"
});

/**
 * 启用进度卡（UX 升级蓝图 §4.7,W6 冷启动诊断的解法）：逐项探测五类基础数据
 * 是否已配置,未配置项一键直达「队务设置」。探测只用各列表/选择器端点取
 * 「有没有第一条」,零新端点、零聚合拼凑;每项按其真实读码门控,无读码不探测
 * 不展示;全部就绪(或全部无权看)时整卡隐藏——老团队零打扰。
 */
const router = useRouter();

type SetupItem = {
  key: string;
  label: string;
  desc: string;
  perm: string;
  /** 探测:返回 true=已配置 */
  probe: () => Promise<boolean>;
  configured: boolean | null;
};

const items = ref<SetupItem[]>(
  [
    {
      key: "dict",
      label: "字典",
      desc: "活动类型、证件类型等下拉选项的数据源",
      perm: "dict.read.type",
      probe: async () => {
        const { code, data } = await getDictTypes({ page: 1, pageSize: 1 });
        return code === 0 && data.total > 0;
      }
    },
    {
      key: "org",
      label: "组织架构",
      desc: "大队/中队/组的组织树",
      perm: "org.read.node",
      probe: async () => {
        const { code, data } = await getOrgOptions({ limit: 1 });
        return code === 0 && data.items.length > 0;
      }
    },
    {
      key: "position",
      label: "职务定义",
      desc: "中队长、组长等职务,任命的前提",
      perm: "position.read.definition",
      probe: async () => {
        const { code, data } = await getPositionOptions({ limit: 1 });
        return code === 0 && data.items.length > 0;
      }
    },
    {
      key: "position-rule",
      label: "职务规则",
      desc: "每类组织可设哪些职务、人数上下限",
      perm: "position-rule.read.record",
      probe: async () => {
        const { code, data } = await getPositionRules({
          page: 1,
          pageSize: 1
        });
        return code === 0 && data.total > 0;
      }
    },
    {
      key: "contribution-rule",
      label: "贡献值规则",
      desc: "各类活动按服务时长的记分规则",
      perm: "contribution.read.rule",
      probe: async () => {
        const { code, data } = await getContributionRules({
          page: 1,
          pageSize: 1
        });
        return code === 0 && data.total > 0;
      }
    }
  ]
    .filter(item => hasPerms(item.perm))
    .map(item => ({ ...item, configured: null }))
);

const loaded = ref(false);

const missing = computed(() => items.value.filter(i => i.configured === false));

/** 有可见项、探测完成、且存在未配置项时才显示;否则整卡隐身 */
const show = computed(() => loaded.value && missing.value.length > 0);

async function probeAll() {
  await Promise.all(
    items.value.map(async item => {
      try {
        item.configured = await item.probe();
      } catch {
        // 探测失败按「未知」处理:不误报未配置,该项不显示
        item.configured = true;
      }
    })
  );
  loaded.value = true;
}

function goSettings() {
  router.push("/srvf/settings-center");
}

onMounted(() => {
  if (items.value.length) probeAll();
  else loaded.value = true;
});
</script>

<template>
  <el-card v-if="show" shadow="never" class="setup-card">
    <template #header>
      <div class="setup-card__header">
        <span class="setup-card__title">系统启用进度</span>
        <span class="setup-card__subtitle">
          以下基础数据还没配置，配好后业务页的对应下拉才有选项
        </span>
      </div>
    </template>
    <div class="setup-card__list">
      <div v-for="item in missing" :key="item.key" class="setup-card__item">
        <div>
          <span class="setup-card__label">{{ item.label }}</span>
          <span class="setup-card__desc">{{ item.desc }}</span>
        </div>
        <el-button type="primary" link size="small" @click="goSettings">
          去配置
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.setup-card {
  margin-bottom: 16px;
  border-left: 3px solid var(--el-color-warning);
}

.setup-card__header {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  align-items: baseline;
}

.setup-card__title {
  font-size: 15px;
  font-weight: 600;
}

.setup-card__subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.setup-card__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;

  & + .setup-card__item {
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.setup-card__label {
  font-size: 13px;
  font-weight: 600;
}

.setup-card__desc {
  margin-left: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
