import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { hasPerms } from "@/utils/auth";
import {
  getPendingPublishReviews,
  type PublishReview
} from "@/api/srvf-activity-publish-review";
import { decisionFailure, readPermission, reviewRecord } from "./state";

export function usePendingPublishReviews() {
  const canRead = computed(() => hasPerms(readPermission));
  const rows = ref<PublishReview[]>([]);
  const loading = ref(false);
  const error = ref("");
  const pagination = reactive({
    total: 0,
    pageSize: 20,
    currentPage: 1,
    background: true
  });
  let generation = 0;
  async function load(page = pagination.currentPage) {
    if (!canRead.value) return;
    const round = ++generation;
    loading.value = true;
    error.value = "";
    rows.value = [];
    try {
      const { code, data } = await getPendingPublishReviews(page);
      if (round !== generation) return;
      if (code !== 0 || !Array.isArray(data.items))
        throw Error("未取得有效待审列表，请重试。");
      rows.value = data.items.map(row => reviewRecord(row, row.id));
      pagination.total = data.total;
      pagination.currentPage = data.page;
    } catch (e: unknown) {
      if (round === generation) error.value = decisionFailure(e).message;
    } finally {
      if (round === generation) loading.value = false;
    }
  }
  onMounted(() => load());
  onBeforeUnmount(() => {
    generation++;
  });
  return { canRead, rows, loading, error, pagination, load };
}
