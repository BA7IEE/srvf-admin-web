<script setup lang="ts">
import { bizErrorMessage } from "@/api/srvf-error";
import { ref, watch } from "vue";
import { ElMessageBox, type UploadRequestOptions } from "element-plus";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import {
  getContent,
  uploadContentAttachment,
  setContentCover,
  deleteContentAttachment,
  type ContentDetail,
  type ContentAttachment
} from "@/api/srvf-content";

/** 封面与附件管理 drawer。仅对已存在内容(有 id)开放;上传走 signed-URL 三步(需存储就绪)。 */
const props = defineProps<{ contentId: string; visible: boolean }>();
const emit = defineEmits<{ (e: "update:visible", v: boolean): void }>();

const canEdit = hasPerms("content.update.record");
const loading = ref(false);
const uploading = ref(false);
const detail = ref<ContentDetail | null>(null);

async function load() {
  if (!props.contentId) return;
  loading.value = true;
  try {
    const { code, data } = await getContent(props.contentId);
    if (code === 0) detail.value = data;
  } catch (error: any) {
    message(bizErrorMessage(error, "加载内容失败"), {
      type: "error"
    });
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.visible,
  v => {
    if (v) load();
  }
);

/** el-upload 自定义直传:走 uploadContentAttachment 三步,成功后重拉详情 */
async function customUpload(opt: UploadRequestOptions) {
  uploading.value = true;
  try {
    await uploadContentAttachment(props.contentId, opt.file);
    message("上传成功", { type: "success" });
    load();
  } catch (error: any) {
    message(error?.message ?? "上传失败", { type: "error" });
  } finally {
    uploading.value = false;
  }
}

async function onSetCover(a: ContentAttachment) {
  try {
    const { code, data } = await setContentCover(props.contentId, a.id);
    if (code === 0) {
      detail.value = data;
      message("已设为封面", { type: "success" });
    }
  } catch (error: any) {
    message(bizErrorMessage(error, "设置封面失败"), {
      type: "error"
    });
  }
}

function onDelete(a: ContentAttachment) {
  ElMessageBox.confirm(`确定删除附件「${a.originalName}」吗？`, "删除附件", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        await deleteContentAttachment(props.contentId, a.id);
        message("已删除", { type: "success" });
        load();
      } catch (error: any) {
        message(bizErrorMessage(error, "删除失败"), {
          type: "error"
        });
      }
    })
    .catch(() => {});
}

function onDrawerVisible(v: boolean) {
  emit("update:visible", v);
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    title="封面与附件"
    size="56%"
    destroy-on-close
    @update:model-value="onDrawerVisible"
  >
    <div v-loading="loading">
      <template v-if="detail">
        <div class="cm-cover">
          <span class="cm-label">当前封面：</span>
          <el-image
            v-if="detail.coverImageUrl"
            :src="detail.coverImageUrl"
            fit="cover"
            class="cm-cover-img"
          />
          <el-tag v-else type="info">未设置</el-tag>
        </div>

        <el-upload
          v-if="canEdit"
          class="cm-upload"
          :show-file-list="false"
          :http-request="customUpload"
          :disabled="uploading"
          drag
        >
          <div class="cm-upload-text">
            {{ uploading ? "上传中…" : "拖拽或点击上传图片 / 附件" }}
          </div>
        </el-upload>

        <div class="cm-attachments-title">
          附件（{{ detail.attachments.length }}）
        </div>
        <el-table :data="detail.attachments" border size="small" row-key="id">
          <el-table-column label="名称" prop="originalName" min-width="180" />
          <el-table-column label="类型" prop="kind" min-width="80" />
          <el-table-column label="大小(KB)" min-width="90">
            <template #default="{ row }">
              {{ Math.round(row.size / 1024) }}
            </template>
          </el-table-column>
          <el-table-column label="预览" min-width="80">
            <template #default="{ row }">
              <el-link
                v-if="row.url"
                :href="row.url"
                target="_blank"
                type="primary"
              >
                打开
              </el-link>
              <span v-else>—</span>
            </template>
          </el-table-column>
          <el-table-column v-if="canEdit" label="操作" width="160">
            <template #default="{ row }">
              <el-button
                v-if="row.kind === 'image'"
                link
                size="small"
                @click="onSetCover(row)"
              >
                设为封面
              </el-button>
              <el-button link type="danger" size="small" @click="onDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <el-empty v-else-if="!loading" description="无内容" />
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.cm-cover {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}

.cm-label {
  font-weight: 500;
}

.cm-cover-img {
  width: 120px;
  height: 72px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.cm-upload {
  margin-bottom: 16px;
}

.cm-upload-text {
  padding: 18px;
  color: var(--el-text-color-secondary);
}

.cm-attachments-title {
  margin: 8px 0;
  font-weight: 600;
}
</style>
