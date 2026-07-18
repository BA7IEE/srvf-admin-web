<script setup lang="ts">
import { bizErrorMessage } from "@/api/srvf-error";
import { ref, onMounted } from "vue";
import dayjs from "dayjs";
import { message } from "@/utils/message";
import { getAuditLogDetail, type AuditLogDetail } from "@/api/srvf-audit-log";

defineOptions({
  name: "SrvfAuditLogDetailDrawer"
});

const props = defineProps<{ id: string }>();

const loading = ref(false);
const detail = ref<AuditLogDetail | null>(null);

/** 打码后的 before/after 快照与 extra 元数据都是任意结构，统一走 JSON 缩进展示，不臆造字段级 diff。 */
function pretty(obj: Record<string, unknown> | null | undefined) {
  if (!obj) return null;
  return JSON.stringify(obj, null, 2);
}

async function load() {
  if (!props.id) return;
  loading.value = true;
  detail.value = null;
  try {
    const { code, data } = await getAuditLogDetail(props.id);
    if (code === 0) detail.value = data;
  } catch (error: any) {
    message(bizErrorMessage(error, "查看审计记录详情失败"), {
      type: "error"
    });
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div v-loading="loading">
    <template v-if="detail">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="时间">
          {{ dayjs(detail.createdAt).format("YYYY-MM-DD HH:mm:ss") }}
        </el-descriptions-item>
        <el-descriptions-item label="事件">
          {{ detail.event }}
        </el-descriptions-item>
        <el-descriptions-item label="资源">
          {{ detail.resourceType }} / {{ detail.resourceId ?? "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="操作者角色快照">
          {{ detail.actorRoleSnap ?? "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="结果">
          <el-tag :type="detail.success ? 'success' : 'danger'">
            {{ detail.success ? "成功" : "失败" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="requestId">
          {{ detail.context.requestId }}
        </el-descriptions-item>
        <el-descriptions-item label="来源 IP">
          {{ detail.context.ip ?? "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="User-Agent">
          {{ detail.context.ua ?? "—" }}
        </el-descriptions-item>
      </el-descriptions>

      <template v-if="pretty(detail.context.before)">
        <div class="section-title">操作前快照（打码后）</div>
        <pre class="json-block">{{ pretty(detail.context.before) }}</pre>
      </template>
      <template v-if="pretty(detail.context.after)">
        <div class="section-title">操作后快照（打码后）</div>
        <pre class="json-block">{{ pretty(detail.context.after) }}</pre>
      </template>
      <template v-if="pretty(detail.context.extra)">
        <div class="section-title">附加元数据</div>
        <pre class="json-block">{{ pretty(detail.context.extra) }}</pre>
      </template>
    </template>
    <el-empty v-else-if="!loading" description="暂无数据" />
  </div>
</template>

<style scoped lang="scss">
.section-title {
  margin: 16px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.json-block {
  max-height: 240px;
  padding: 12px;
  overflow: auto;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
  white-space: pre-wrap;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}
</style>
