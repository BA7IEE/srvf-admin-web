<script setup lang="ts">
import {
  IMPORT_ROW_STATUS_LABEL,
  IMPORT_ROW_STATUS_TAG
} from "@/api/srvf-announcement-import";
import {
  useAnnouncementImport,
  ANNOUNCEMENT_IMPORT_PLACEHOLDER
} from "./utils/hook";

defineOptions({
  name: "SrvfAnnouncementImport"
});

const {
  canPreview,
  canExecute,
  rawText,
  parseError,
  previewing,
  executing,
  result,
  readyToExecute,
  runPreview,
  runExecute
} = useAnnouncementImport();

function issueText(reasons: { bizCode: number | null; message: string }[]) {
  if (!reasons.length) return "—";
  return reasons
    .map(r => (r.bizCode ? `${r.message}（${r.bizCode}）` : r.message))
    .join("；");
}
</script>

<template>
  <div class="announcement-import-page">
    <el-alert
      type="warning"
      :closable="false"
      show-icon
      title="一次性上线初始化 / 批量换届工具——不是日常管理页"
    >
      <p>
        正常运营下建组织 / 任命 /
        分管请到「组织与人事」各自常规页逐条操作。本页只在批量换届 /
        初始化场景使用，粘贴运营或 AI 已从《任命公告》整理好的结构化 JSON，
        <strong>先预览（零写入）核对逐行状态，再执行</strong>。执行阶段人只认
        <code>memberNo</code>、组织只认
        <code>code</code
        >，姓名（<code>displayName</code>）仅供预览辅助核对，绝不自动按姓名落库。
      </p>
      <p class="mt-2">
        若同一批次里任职 / 分管行引用了本批次新建的组织（<code>orgCode</code>
        指向 <code>organizations[]</code> 里的新
        <code>code</code
        >），预览阶段会显示「组织节点不存在」——这是预览零写入的正常限制（新组织还没真的落库，查不到），不代表执行会失败；执行时会先建组织再处理引用它的行，属预期行为。
      </p>
    </el-alert>

    <el-card class="mt-4" shadow="never">
      <template #header>
        <span>结构化 JSON</span>
      </template>
      <el-input
        v-model="rawText"
        type="textarea"
        :rows="16"
        class="json-input"
        :placeholder="ANNOUNCEMENT_IMPORT_PLACEHOLDER"
      />
      <el-alert
        v-if="parseError"
        class="mt-2"
        type="error"
        :closable="false"
        :title="parseError"
      />
      <div class="mt-3 action-bar">
        <el-button
          type="primary"
          :loading="previewing"
          :disabled="!canPreview"
          @click="runPreview"
        >
          预览
        </el-button>
        <el-button
          type="danger"
          :loading="executing"
          :disabled="!readyToExecute"
          @click="runExecute"
        >
          确认执行
        </el-button>
        <span v-if="!readyToExecute && canExecute" class="action-hint">
          请先对当前内容预览通过（内容变更后需重新预览）
        </span>
      </div>
    </el-card>

    <el-card v-if="result" class="mt-4" shadow="never">
      <template #header>
        <span>结果</span>
      </template>
      <div class="summary-row">
        <span>总行数 {{ result.summary.total }}</span>
        <span>可创建 {{ result.summary.ok }}</span>
        <span>已存在(跳过) {{ result.summary.alreadyExists }}</span>
        <span>受阻 {{ result.summary.blocked }}</span>
        <span>待人工确认 {{ result.summary.needsManual }}</span>
      </div>

      <template v-if="result.organizations.length">
        <h4>组织节点（{{ result.organizations.length }}）</h4>
        <el-table :data="result.organizations" size="small" border>
          <el-table-column prop="row.code" label="code" min-width="140" />
          <el-table-column
            prop="row.parentCode"
            label="parentCode"
            min-width="140"
          />
          <el-table-column prop="row.name" label="组名" min-width="120" />
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="IMPORT_ROW_STATUS_TAG[row.status]" size="small">
                {{ IMPORT_ROW_STATUS_LABEL[row.status] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="结果 id"
            min-width="160"
            prop="organizationId"
          />
          <el-table-column label="原因" min-width="220">
            <template #default="{ row }">{{ issueText(row.reasons) }}</template>
          </el-table-column>
        </el-table>
      </template>

      <template v-if="result.positions.length">
        <h4 class="mt-4">任职（{{ result.positions.length }}）</h4>
        <el-table :data="result.positions" size="small" border>
          <el-table-column
            prop="row.memberNo"
            label="memberNo"
            min-width="110"
          />
          <el-table-column prop="row.displayName" label="姓名" min-width="90" />
          <el-table-column prop="row.orgCode" label="orgCode" min-width="140" />
          <el-table-column
            prop="row.positionCode"
            label="positionCode"
            min-width="120"
          />
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="IMPORT_ROW_STATUS_TAG[row.status]" size="small">
                {{ IMPORT_ROW_STATUS_LABEL[row.status] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="建议 memberNo"
            min-width="130"
            prop="suggestedMemberNo"
          />
          <el-table-column
            label="结果 id"
            min-width="160"
            prop="positionAssignmentId"
          />
          <el-table-column label="原因" min-width="220">
            <template #default="{ row }">{{ issueText(row.reasons) }}</template>
          </el-table-column>
        </el-table>
      </template>

      <template v-if="result.supervisions.length">
        <h4 class="mt-4">分管（{{ result.supervisions.length }}）</h4>
        <el-table :data="result.supervisions" size="small" border>
          <el-table-column
            prop="row.supervisorMemberNo"
            label="supervisorMemberNo"
            min-width="140"
          />
          <el-table-column prop="row.displayName" label="姓名" min-width="90" />
          <el-table-column prop="row.orgCode" label="orgCode" min-width="140" />
          <el-table-column
            prop="row.scopeMode"
            label="scopeMode"
            min-width="90"
          />
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="IMPORT_ROW_STATUS_TAG[row.status]" size="small">
                {{ IMPORT_ROW_STATUS_LABEL[row.status] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="建议 memberNo"
            min-width="130"
            prop="suggestedMemberNo"
          />
          <el-table-column
            label="结果 id"
            min-width="160"
            prop="supervisionAssignmentId"
          />
          <el-table-column label="原因" min-width="220">
            <template #default="{ row }">{{ issueText(row.reasons) }}</template>
          </el-table-column>
        </el-table>
      </template>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.announcement-import-page {
  padding: 16px;

  p {
    margin: 0;
    line-height: 1.7;
  }
}

.json-input :deep(textarea) {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
}

.action-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

h4 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
}
</style>
