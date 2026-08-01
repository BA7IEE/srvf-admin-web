<script setup lang="ts">
import { SrvfPermEmpty, SrvfPageIntro, SrvfStatusTag } from "@/srvf-kit";
import { deviceDetection } from "@pureadmin/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import {
  useCertificateStandards,
  STANDARD_STATUS_LABEL,
  STANDARD_STATUS_TAG,
  POLICY_STATUS_LABEL,
  POLICY_STATUS_TAG
} from "./utils/hook";

import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import More from "~icons/ep/more-filled";
import Search from "~icons/ri/search-line";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SrvfCertificateStandards"
});

const {
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  canReadPolicy,
  canCreatePolicy,
  canUpdatePolicy,
  canDeletePolicy,
  standardLoading,
  standardList,
  selectedStandard,
  filters,
  categoryOptions,
  levelOptions,
  categoryLabel,
  levelLabel,
  displayStatus,
  selectedPendingRecognition,
  fetchStandards,
  resetFilters,
  selectStandard,
  openStandardDialog,
  handleToggleStandardStatus,
  handleDeleteStandard,
  policyLoading,
  policyList,
  policyColumns,
  fetchPolicies,
  openPolicyDialog,
  handleActivatePolicy,
  handleDeletePolicy
} = useCertificateStandards();
</script>

<template>
  <div v-if="canRead" class="main">
    <SrvfPageIntro
      class="mb-2"
      title="证书标准库：先收录「队里认哪些证书」，再给每个标准配一条「按什么规则认定」。两步都齐了，才能用它建证与审核招新申报。"
      description="左边选一个标准，右边维护它的认定规则版本。标准显示「已收录待认定」是正常中间态，不是出错。"
    />

    <div :class="['flex', deviceDetection() && 'flex-wrap']">
      <!-- 左：标准导航（筛选 + 滚动列表，不分页） -->
      <div
        :class="[
          'mr-2',
          'mt-2',
          'shrink-0',
          deviceDetection() ? 'w-full' : 'w-96'
        ]"
      >
        <el-card shadow="never" :body-style="{ padding: 0 }">
          <template #header>
            <div class="flex-bc">
              <span class="font-bold">证书标准</span>
              <el-button
                v-if="canCreate"
                type="primary"
                size="small"
                :icon="useRenderIcon(AddFill)"
                @click="openStandardDialog('新建')"
              >
                新建标准
              </el-button>
            </div>
          </template>

          <div class="standard-filters">
            <el-input
              v-model="filters.q"
              clearable
              placeholder="搜索名称 / code"
              :prefix-icon="useRenderIcon(Search)"
              @keyup.enter="fetchStandards"
              @clear="fetchStandards"
            />
            <div class="standard-filters__row">
              <el-select
                v-model="filters.kind"
                clearable
                placeholder="类型"
                @change="fetchStandards"
              >
                <el-option label="具体证书" value="CREDENTIAL" />
                <el-option label="目录节点" value="FAMILY" />
              </el-select>
              <el-select
                v-model="filters.status"
                clearable
                placeholder="状态"
                @change="fetchStandards"
              >
                <el-option label="草稿" value="DRAFT" />
                <el-option label="已启用" value="ACTIVE" />
                <el-option label="已停用" value="INACTIVE" />
              </el-select>
            </div>
            <div class="standard-filters__row">
              <el-select
                v-model="filters.categoryCode"
                clearable
                placeholder="证书大类"
                @change="fetchStandards"
              >
                <el-option
                  v-for="opt in categoryOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <el-select
                v-model="filters.levelCode"
                clearable
                placeholder="证书等级"
                @change="fetchStandards"
              >
                <el-option
                  v-for="opt in levelOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </div>
            <div class="flex-bc">
              <el-button
                link
                type="primary"
                :icon="useRenderIcon(Search)"
                @click="fetchStandards"
              >
                查询
              </el-button>
              <el-button
                link
                :icon="useRenderIcon(Refresh)"
                @click="resetFilters"
              >
                重置
              </el-button>
            </div>
          </div>

          <el-scrollbar
            v-loading="standardLoading"
            height="calc(100vh - 420px)"
            class="standard-scroll"
          >
            <div
              v-for="item in standardList"
              :key="item.id"
              :class="[
                'standard-item',
                selectedStandard?.id === item.id ? 'is-selected' : ''
              ]"
              @click="selectStandard(item)"
            >
              <div class="standard-item__main">
                <div class="standard-item__label">
                  {{ item.name }}
                  <el-tag
                    v-if="item.kind === 'FAMILY'"
                    size="small"
                    type="info"
                    class="ml-1"
                  >
                    目录
                  </el-tag>
                </div>
                <div class="standard-item__meta">
                  {{ item.code }} · {{ categoryLabel(item.categoryCode)
                  }}<template v-if="item.levelCode">
                    / {{ levelLabel(item.levelCode) }}</template
                  >
                </div>
              </div>
              <div class="standard-item__actions" @click.stop>
                <SrvfStatusTag
                  :value="displayStatus(item)"
                  :label-dict="STANDARD_STATUS_LABEL"
                  :tag-dict="STANDARD_STATUS_TAG"
                />
                <el-dropdown v-if="canUpdate || canDelete" trigger="click">
                  <el-button link :icon="useRenderIcon(More)" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-if="canUpdate">
                        <el-button
                          class="reset-margin!"
                          link
                          :icon="useRenderIcon(EditPen)"
                          @click="openStandardDialog('编辑', item)"
                        >
                          编辑
                        </el-button>
                      </el-dropdown-item>
                      <el-dropdown-item v-if="canUpdate">
                        <el-button
                          class="reset-margin!"
                          link
                          :type="
                            item.status === 'ACTIVE' ? 'warning' : 'success'
                          "
                          @click="handleToggleStandardStatus(item)"
                        >
                          {{ item.status === "ACTIVE" ? "停用" : "启用" }}
                        </el-button>
                      </el-dropdown-item>
                      <el-dropdown-item v-if="canDelete" divided>
                        <el-button
                          class="reset-margin!"
                          link
                          type="danger"
                          :icon="useRenderIcon(Delete)"
                          @click="handleDeleteStandard(item)"
                        >
                          删除
                        </el-button>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            <el-empty
              v-if="!standardList.length"
              :description="
                standardLoading
                  ? '加载中'
                  : '还没有证书标准。点右上角「新建标准」开始收录'
              "
              :image-size="64"
            />
          </el-scrollbar>
        </el-card>
      </div>

      <!-- 右：选中标准的认定规则版本 -->
      <div :class="[deviceDetection() ? 'w-full' : 'flex-1', 'min-w-0']">
        <PureTableBar
          :title="
            selectedStandard
              ? `认定规则 · ${selectedStandard.name}`
              : '认定规则'
          "
          :columns="policyColumns"
          @refresh="fetchPolicies"
        >
          <template #buttons>
            <el-button
              v-if="canCreatePolicy"
              type="primary"
              :disabled="
                !selectedStandard || selectedStandard.kind === 'FAMILY'
              "
              :icon="useRenderIcon(AddFill)"
              @click="openPolicyDialog('新建')"
            >
              新建版本
            </el-button>
          </template>
          <template v-slot="{ size, dynamicColumns }">
            <SrvfPermEmpty
              v-if="!canReadPolicy"
              action="查看认定规则"
              code="certificate-recognition-policy.read.record"
            />
            <el-empty
              v-else-if="!selectedStandard"
              description="请选择左侧证书标准，查看它的认定规则版本"
            />
            <el-empty
              v-else-if="selectedStandard.kind === 'FAMILY'"
              description="这是目录节点，只用来给证书分组，本身不需要认定规则"
            />
            <template v-else>
              <el-alert
                v-if="selectedPendingRecognition"
                class="mb-3"
                type="warning"
                show-icon
                :closable="false"
                title="这个标准「已收录待认定」"
              >
                <div class="leading-6">
                  标准本身已经启用，但还没有一条生效的认定规则，所以暂时还不能用它建证或通过招新申报。
                  <el-button
                    v-if="canCreatePolicy"
                    link
                    type="primary"
                    @click="openPolicyDialog('新建')"
                  >
                    去建认定规则
                  </el-button>
                </div>
              </el-alert>
              <pure-table
                row-key="id"
                adaptive
                show-overflow-tooltip
                :adaptiveConfig="{ offsetBottom: 108 }"
                align-whole="center"
                table-layout="auto"
                :loading="policyLoading"
                :size="size"
                :data="policyList"
                :columns="dynamicColumns"
                :header-cell-style="{
                  background: 'var(--el-fill-color-light)',
                  color: 'var(--el-text-color-primary)'
                }"
              >
                <template #policyVersion="{ row }">
                  v{{ row.version }}
                </template>
                <template #policyStatus="{ row }">
                  <SrvfStatusTag
                    :value="row.status"
                    :label-dict="POLICY_STATUS_LABEL"
                    :tag-dict="POLICY_STATUS_TAG"
                  />
                </template>
                <template #policyOperation="{ row }">
                  <el-button
                    v-if="canUpdatePolicy && row.status === 'DRAFT'"
                    class="reset-margin"
                    link
                    type="primary"
                    :size="size"
                    @click="handleActivatePolicy(row)"
                  >
                    激活
                  </el-button>
                  <el-button
                    v-if="canUpdatePolicy && row.status === 'DRAFT'"
                    class="reset-margin"
                    link
                    :size="size"
                    :icon="useRenderIcon(EditPen)"
                    @click="openPolicyDialog('编辑', row)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    v-if="canDeletePolicy && row.status === 'DRAFT'"
                    class="reset-margin"
                    link
                    type="danger"
                    :size="size"
                    :icon="useRenderIcon(Delete)"
                    @click="handleDeletePolicy(row)"
                  >
                    删除
                  </el-button>
                  <span
                    v-if="row.status !== 'DRAFT'"
                    class="text-(--el-text-color-secondary)"
                  >
                    {{ row.status === "ACTIVE" ? "生效中，只读" : "已退役" }}
                  </span>
                </template>
              </pure-table>
            </template>
          </template>
        </PureTableBar>
      </div>
    </div>
  </div>
  <div v-else class="main">
    <SrvfPermEmpty
      action="查看证书标准库"
      code="certificate-standard.read.record"
    />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}

.standard-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 12px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &__row {
    display: flex;
    gap: 8px;

    :deep(.el-select) {
      flex: 1;
      min-width: 0;
    }
  }
}

.standard-scroll {
  padding-bottom: 8px;
}

.standard-item {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &.is-selected {
    background-color: var(--el-color-primary-light-9);

    .standard-item__label {
      font-weight: 600;
      color: var(--el-color-primary);
    }
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__label {
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
    white-space: nowrap;
  }

  &__meta {
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    flex-shrink: 0;
    gap: 6px;
    align-items: center;
  }
}
</style>
