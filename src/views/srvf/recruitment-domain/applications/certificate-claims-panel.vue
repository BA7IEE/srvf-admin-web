<script setup lang="ts">
import { h, ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import { addDrawer } from "@/components/ReDrawer";
import { SrvfStatusTag } from "@/srvf-kit";
import { useSrvfDictStoreHook } from "@/store/modules/srvfDict";
import ClaimImagesViewer from "./claim-images-viewer.vue";
import ClaimReviewDrawer from "./claim-review-drawer.vue";
import {
  getApplicationCertificateClaims,
  getCertificateClaimImageUrls,
  revokeCertificateClaimReview,
  certificateClaimBizErrorMessage,
  CLAIM_STATUS_LABEL,
  CLAIM_STATUS_TAG,
  type RecruitmentCertificateClaim,
  type CertificateClaimImageUrls
} from "@/api/srvf-recruitment";

/**
 * 报名详情里的「证书材料」面板（P7-4）。
 *
 * 数据源是 `certificate-claims`：**一证一行，同类可以多行**——申请人可能同时报
 * 两张急救证，各自独立审核，不是一个类别一个开关。
 *
 * 行按 `status` 分流，不给「点了必被拒」的按钮：
 * - `SUBMITTED` / `NEEDS_INFO` → 看图 + 审核
 * - `APPROVED` → 看图 + 撤回结论
 * - `REJECTED` → 看图 + 重审（后端允许再次 review）
 * - `WITHDRAWN` → 申请人自己撤回了，连图都不给看（终态，28057）
 * - `PROMOTED` → 已进证书档案，去 360 看（终态，28057）
 */
const props = defineProps<{
  applicationId: string | null;
  /** 队员档案跳转用（已发号的报名才有） */
  promotedMemberId?: string | null;
}>();

const router = useRouter();
const dict = useSrvfDictStoreHook();

/** 读申报与读报名同码；证据图另需敏感码；审核是独立码 */
const canRead = hasPerms("recruitment-application.read.record");
const canViewImages = hasPerms("recruitment-application.read.sensitive");
const canReview = hasPerms("recruitment-application.review.certificate");

const claims = ref<RecruitmentCertificateClaim[]>([]);
const loading = ref(false);

async function load() {
  if (!props.applicationId || !canRead) {
    claims.value = [];
    return;
  }
  loading.value = true;
  try {
    const { code, data } = await getApplicationCertificateClaims(
      props.applicationId
    );
    if (code === 0) claims.value = data.items;
  } catch (error: any) {
    message(certificateClaimBizErrorMessage(error, "加载证书材料失败"), {
      type: "error"
    });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  dict.ensureType("cert_type");
  load();
});
watch(() => props.applicationId, load);

function fmt(v?: string | null) {
  return v ? dayjs(v).format("YYYY-MM-DD") : "—";
}

/** 终态不给看图：后端也会以 28057 拒 */
function canSeeImages(row: RecruitmentCertificateClaim) {
  return canViewImages && row.imageCount > 0 && row.status !== "WITHDRAWN";
}

function canReviewRow(row: RecruitmentCertificateClaim) {
  return (
    canReview && ["SUBMITTED", "NEEDS_INFO", "REJECTED"].includes(row.status)
  );
}

function claimSubject(row: RecruitmentCertificateClaim) {
  return row.rawCertificateName || row.standard?.name || "这张证书";
}

/* ------------------------------- 证据图 ------------------------------- */
/** 点了才取（不预加载）；弹窗内看（不开新标签，signed-URL 不进浏览器历史） */
async function fetchImages(id: string) {
  try {
    const { code, data } = await getCertificateClaimImageUrls(id);
    return code === 0 ? data : null;
  } catch (error: any) {
    message(certificateClaimBizErrorMessage(error, "取证据图失败"), {
      type: "error"
    });
    return null;
  }
}

async function openImages(row: RecruitmentCertificateClaim) {
  const data: CertificateClaimImageUrls | null = await fetchImages(row.id);
  if (!data) return;
  addDialog({
    title: `证据图 · ${claimSubject(row)}`,
    width: "52%",
    draggable: true,
    hideFooter: true,
    destroyOnClose: true,
    contentRenderer: () =>
      h(ClaimImagesViewer, {
        data,
        subject: "申请人",
        onRefetch: () => fetchImages(row.id)
      })
  });
}

/* -------------------------------- 审核 -------------------------------- */
const reviewRef = ref();

function openReview(row: RecruitmentCertificateClaim) {
  addDrawer({
    title: `审核证书材料 · ${claimSubject(row)}`,
    size: "620px",
    sureBtnLoading: true,
    contentRenderer: () => h(ClaimReviewDrawer, { ref: reviewRef, claim: row }),
    beforeSure: (done, { closeLoading }) => {
      reviewRef.value
        .save()
        .then(() => {
          done();
          load();
        })
        .catch(() => closeLoading());
    }
  });
}

/** 撤回已通过的结论：必填原因 + 说清后果（会清空已锁定的标准/规则/机构） */
function handleRevoke(row: RecruitmentCertificateClaim) {
  ElMessageBox.prompt(
    "撤回后这条申报会退回「待审核」，之前锁定的证书标准、认定规则、发证机构与审核结论都会被清空，需要重新审一次。请填写撤回原因（会写进审计）。",
    `撤回审核结论 · ${claimSubject(row)}`,
    {
      confirmButtonText: "确定撤回",
      cancelButtonText: "取消",
      type: "warning",
      inputType: "textarea",
      inputPlaceholder: "撤回原因（必填；≤ 500）",
      inputValidator: (val: string) => {
        if (!val || !val.trim()) return "撤回原因为必填项";
        if (val.length > 500) return "撤回原因不能超过 500 字";
        return true;
      }
    }
  )
    .then(async ({ value }) => {
      try {
        await revokeCertificateClaimReview(row.id, {
          version: row.version,
          note: value
        });
        message("已撤回审核结论", { type: "success" });
        load();
      } catch (error: any) {
        message(certificateClaimBizErrorMessage(error, "撤回失败"), {
          type: "error"
        });
        load();
      }
    })
    .catch(() => {});
}

function goMemberCertificates() {
  if (!props.promotedMemberId) return;
  router.push({
    path: `/srvf/members-domain/members/${props.promotedMemberId}`,
    query: { tab: "certificates" }
  });
}
</script>

<template>
  <div class="claims">
    <div class="claims__title">
      证书材料
      <span class="claims__hint">
        一张证一行，同类可以有多张；急救资质与 BSAFE
        两个门槛由这里的审核结论自动得出。
      </span>
    </div>

    <el-empty
      v-if="!canRead"
      :image-size="60"
      description="没有查看报名记录的权限"
    />
    <div v-else v-loading="loading">
      <el-empty
        v-if="!claims.length"
        :image-size="60"
        description="这条报名没有提交证书材料"
      />
      <el-card
        v-for="row in claims"
        v-else
        :key="row.id"
        shadow="never"
        class="claim-card"
      >
        <div class="claim-card__head">
          <div class="claim-card__name">
            {{ row.rawCertificateName || "（未填证书名称）" }}
            <SrvfStatusTag
              :value="row.status"
              :label-dict="CLAIM_STATUS_LABEL"
              :tag-dict="CLAIM_STATUS_TAG"
            />
          </div>
          <div class="claim-card__actions">
            <el-button
              v-if="canSeeImages(row)"
              link
              type="primary"
              @click="openImages(row)"
            >
              查看证据（{{ row.imageCount }}）
            </el-button>
            <span v-else-if="row.status === 'WITHDRAWN'" class="claims__hint">
              申请人已撤回，材料不再可看
            </span>
            <span
              v-else-if="row.imageCount > 0 && !canViewImages"
              class="claims__hint"
            >
              需敏感权限查看证据
            </span>

            <el-button
              v-if="canReviewRow(row)"
              link
              type="primary"
              @click="openReview(row)"
            >
              {{ row.status === "REJECTED" ? "重新审核" : "审核" }}
            </el-button>
            <el-button
              v-if="canReview && row.status === 'APPROVED'"
              link
              type="warning"
              @click="handleRevoke(row)"
            >
              撤回结论
            </el-button>
            <el-button
              v-if="row.status === 'PROMOTED' && promotedMemberId"
              link
              type="primary"
              @click="goMemberCertificates"
            >
              去证书档案查看
            </el-button>
          </div>
        </div>

        <div class="claim-card__body">
          <span class="claim-card__field">
            申请人选的类别：{{ dict.label("cert_type", row.categoryHintCode) }}
          </span>
          <span v-if="row.suggestedStandard" class="claim-card__field">
            建议标准：{{ row.suggestedStandard.name }}
          </span>
          <span class="claim-card__field">
            审核锁定标准：{{ row.standard?.name ?? "尚未认定" }}
          </span>
          <template
            v-if="row.status === 'APPROVED' || row.status === 'PROMOTED'"
          >
            <span class="claim-card__field">
              发证机构：{{ row.issuingOrg ?? "—" }}
            </span>
            <span class="claim-card__field">
              编号：{{ row.certNumberMasked ?? "—" }}
            </span>
            <span class="claim-card__field">
              发证日：{{ fmt(row.issuedAt) }}
            </span>
            <span class="claim-card__field">
              到期日：{{ row.expiredAt ? fmt(row.expiredAt) : "终身有效" }}
            </span>
          </template>
          <span v-if="row.reviewNote" class="claim-card__field">
            审核说明：{{ row.reviewNote }}
          </span>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.claims {
  margin-top: 18px;
}

.claims__title {
  margin-bottom: 10px;
  font-weight: 600;
}

.claims__hint {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.claim-card {
  margin-bottom: 10px;

  :deep(.el-card__body) {
    padding: 12px 14px;
  }
}

.claim-card__head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.claim-card__name {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 500;
}

.claim-card__actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.claim-card__body {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
