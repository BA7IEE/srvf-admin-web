import { ref, computed } from "vue";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import {
  previewAnnouncementImport,
  executeAnnouncementImport,
  type AnnouncementImportRequest,
  type AnnouncementImportResult
} from "@/api/srvf-announcement-import";

export const ANNOUNCEMENT_IMPORT_PLACEHOLDER = `{
  "organizations": [
    { "code": "org-xx-brigade", "parentCode": "org-hq", "name": "XX大队" }
  ],
  "positions": [
    {
      "memberNo": "T0001",
      "displayName": "张三",
      "orgCode": "org-xx-brigade",
      "positionCode": "captain",
      "startedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "supervisions": [
    {
      "supervisorMemberNo": "T0001",
      "displayName": "张三",
      "orgCode": "org-xx-brigade",
      "scopeMode": "TREE",
      "startedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}`;

/**
 * 公告导入一次性工具页 hook。preview 与 execute 必须作用于同一份 payload——
 * 文本框内容一旦在预览之后被修改，`canExecute` 立即失效，逼用户对当前内容重新预览。
 */
export function useAnnouncementImport() {
  const canPreview = hasPerms("announcement-import.preview.record");
  const canExecute = hasPerms("announcement-import.execute.record");

  const rawText = ref("");
  const parseError = ref("");
  const previewedText = ref<string | null>(null);
  const previewing = ref(false);
  const executing = ref(false);
  const result = ref<AnnouncementImportResult | null>(null);

  const readyToExecute = computed(
    () =>
      canExecute &&
      previewedText.value !== null &&
      previewedText.value === rawText.value.trim()
  );

  function parsePayload(): AnnouncementImportRequest | null {
    parseError.value = "";
    const text = rawText.value.trim();
    if (!text) {
      parseError.value =
        "请粘贴结构化 JSON（organizations / positions / supervisions）";
      return null;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (error: any) {
      parseError.value = `JSON 解析失败：${error?.message ?? "格式错误"}`;
      return null;
    }
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      parseError.value =
        "JSON 顶层必须是对象（{ organizations, positions, supervisions }）";
      return null;
    }
    return parsed as AnnouncementImportRequest;
  }

  async function runPreview() {
    const payload = parsePayload();
    if (!payload) return;
    previewing.value = true;
    try {
      const { code, data } = await previewAnnouncementImport(payload);
      if (code === 0) {
        result.value = data;
        previewedText.value = rawText.value.trim();
        message("预览完成，请核对逐行状态后再执行", { type: "success" });
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "预览失败", { type: "error" });
    } finally {
      previewing.value = false;
    }
  }

  async function runExecute() {
    if (!readyToExecute.value) return;
    const payload = parsePayload();
    if (!payload) return;
    executing.value = true;
    try {
      const { code, data } = await executeAnnouncementImport(payload);
      if (code === 0) {
        result.value = data;
        const { ok, alreadyExists, blocked, needsManual } = data.summary;
        message(
          `执行完成：成功 ${ok} · 已存在(跳过) ${alreadyExists} · 受阻 ${blocked} · 待人工 ${needsManual}`,
          { type: blocked || needsManual ? "warning" : "success" }
        );
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "执行失败", { type: "error" });
    } finally {
      executing.value = false;
    }
  }

  return {
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
  };
}
