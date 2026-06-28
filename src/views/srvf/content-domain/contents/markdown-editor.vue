<script setup lang="ts">
import "vditor/dist/index.css";
import Vditor from "vditor";
import { useDark } from "@pureadmin/utils";
import { onMounted, onUnmounted, shallowRef, ref, watch } from "vue";
import { message } from "@/utils/message";
import { uploadContentAttachment } from "@/api/srvf-content";

/**
 * 内容正文 Markdown 编辑器（Vditor 封装,镜像完整版 src/views/markdown/components/Vditor.vue）。
 * 正文插图走 uploadContentAttachment(signed-URL 三步);仅在已存在内容(传 uploadContentId)时可上传。
 */
const props = withDefaults(
  defineProps<{ modelValue?: string; uploadContentId?: string }>(),
  { modelValue: "", uploadContentId: "" }
);
const emit = defineEmits<{ (e: "update:modelValue", v: string): void }>();

const { isDark } = useDark();
// shallowRef:Vditor 实例不该被深度代理(否则其内部 this/DOM 操作可能异常)
const editor = shallowRef<Vditor | null>(null);
const elRef = ref<HTMLElement | null>(null);

onMounted(() => {
  editor.value = new Vditor(elRef.value as HTMLElement, {
    value: props.modelValue,
    minHeight: 360,
    mode: "ir",
    cache: { enable: false },
    theme: isDark.value ? "dark" : "classic",
    input(value: string) {
      emit("update:modelValue", value);
    },
    upload: {
      accept: "image/*",
      multiple: false,
      // 自定义上传:走内容附件 signed-URL 链路,成功后手动插入 markdown 图片
      handler: async (files: File[]) => {
        if (!props.uploadContentId) return "请先保存草稿,再插入图片";
        try {
          for (const f of files) {
            const att = await uploadContentAttachment(props.uploadContentId, f);
            editor.value?.insertValue(
              `\n![${att.originalName}](${att.accessUrl ?? ""})\n`
            );
          }
          return null;
        } catch (error: any) {
          message(error?.message ?? "图片上传失败", { type: "error" });
          return "图片上传失败";
        }
      }
    }
  });
});

watch(
  () => props.modelValue,
  v => {
    if (editor.value && v !== editor.value.getValue()) {
      editor.value.setValue(v ?? "");
    }
  }
);

onUnmounted(() => {
  try {
    editor.value?.destroy?.();
  } catch {
    /* 忽略销毁异常 */
  }
});
</script>

<template>
  <div ref="elRef" class="md-editor" />
</template>
