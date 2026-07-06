<script setup lang="ts">
import SrvfPermEmpty from "@/views/srvf/components/perm-empty.vue";
import { onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useAttachments, canViewAttachmentLibrary } from "./utils/hook";
import { ACCESS_LEVEL_LABEL } from "@/api/srvf-attachment";

defineOptions({
  name: "SrvfAttachments"
});

const canView = canViewAttachmentLibrary();

const {
  filters,
  columns,
  dataList,
  loading,
  pagination,
  typeConfigs,
  loadTypeConfigs,
  accessLevelLabel,
  accessLevelTag,
  onSearch,
  onFilterChange,
  resetFilters,
  handleSizeChange,
  handleCurrentChange,
  canUpload,
  canUpdate,
  canDelete,
  uploadVisible,
  uploading,
  uploadForm,
  openUpload,
  customUpload,
  editVisible,
  editSubmitting,
  editForm,
  openEdit,
  submitEdit,
  handleDelete
} = useAttachments();

const accessLevelOptions = Object.entries(ACCESS_LEVEL_LABEL).map(
  ([value, label]) => ({ value, label })
);

onMounted(() => {
  if (!canView) return;
  loadTypeConfigs();
  onSearch();
});
</script>

<template>
  <div class="main">
    <template v-if="canView">
      <PureTableBar title="附件库" :columns="columns" @refresh="onSearch">
        <template #buttons>
          <el-input
            v-model="filters.ownerType"
            class="w-32!"
            placeholder="归属类型"
            clearable
            @keyup.enter="onFilterChange"
          />
          <el-input
            v-model="filters.ownerId"
            class="w-44!"
            placeholder="归属对象 id"
            clearable
            @keyup.enter="onFilterChange"
          />
          <el-input
            v-model="filters.uploadedBy"
            class="w-40!"
            placeholder="上传人 id"
            clearable
            @keyup.enter="onFilterChange"
          />
          <el-input
            v-model="filters.mime"
            class="w-36!"
            placeholder="MIME"
            clearable
            @keyup.enter="onFilterChange"
          />
          <el-select
            v-model="filters.accessLevel"
            class="w-28!"
            placeholder="访问级别"
            clearable
          >
            <el-option
              v-for="opt in accessLevelOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-button type="primary" @click="onFilterChange">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="success" @click="openUpload">上传附件</el-button>
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            row-key="id"
            adaptive
            :adaptiveConfig="{ offsetBottom: 108 }"
            align-whole="center"
            table-layout="auto"
            :loading="loading"
            :size="size"
            :data="dataList"
            :columns="dynamicColumns"
            :pagination="pagination"
            :paginationSmall="size === 'small' ? true : false"
            :header-cell-style="{
              background: 'var(--el-fill-color-light)',
              color: 'var(--el-text-color-primary)'
            }"
            @page-size-change="handleSizeChange"
            @page-current-change="handleCurrentChange"
          >
            <template #accessLevel="{ row }">
              <el-tag :type="accessLevelTag(row.accessLevel)" size="small">
                {{ accessLevelLabel(row.accessLevel) }}
              </el-tag>
            </template>
            <template #operation="{ row }">
              <el-link
                v-if="row.accessUrl"
                :href="row.accessUrl"
                target="_blank"
                type="primary"
                class="mr-2"
              >
                预览
              </el-link>
              <el-button
                v-if="canUpdate(row.ownerType)"
                link
                type="primary"
                size="small"
                @click="openEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="canDelete(row.ownerType)"
                link
                type="danger"
                size="small"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </template>
    <SrvfPermEmpty v-else action="查看附件库" />

    <el-dialog
      v-model="uploadVisible"
      title="上传附件"
      width="480px"
      destroy-on-close
    >
      <el-form label-width="96px">
        <el-form-item label="归属类型" required>
          <el-select
            v-model="uploadForm.ownerType"
            placeholder="选择归属类型（走后端白名单）"
            class="w-full"
          >
            <el-option
              v-for="tc in typeConfigs"
              :key="tc.code"
              :label="`${tc.displayName}（${tc.code}）`"
              :value="tc.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="归属对象 id" required>
          <el-input v-model="uploadForm.ownerId" placeholder="归属对象 cuid" />
        </el-form-item>
        <el-form-item label="文件">
          <el-upload
            class="w-full"
            drag
            :show-file-list="false"
            :disabled="uploading"
            :http-request="customUpload"
          >
            <div class="upload-text">
              {{ uploading ? "上传中…" : "拖拽或点击选择文件" }}
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="editVisible"
      title="编辑附件元数据"
      width="480px"
      destroy-on-close
    >
      <el-form label-width="88px">
        <el-form-item label="备注">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="用户备注"
          />
        </el-form-item>
        <el-form-item label="访问级别">
          <el-select
            v-model="editForm.accessLevel"
            placeholder="不改则留空"
            clearable
            class="w-full"
          >
            <el-option
              v-for="opt in accessLevelOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input
            v-model="editForm.tagsText"
            placeholder="逗号分隔，如：身份证,正面"
          />
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker
            v-model="editForm.expireAt"
            type="datetime"
            placeholder="不设可留空"
            class="w-full"
            value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSubmitting" @click="submitEdit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}

.upload-text {
  padding: 18px;
  color: var(--el-text-color-secondary);
}
</style>
