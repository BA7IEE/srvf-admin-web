import { h, ref } from "vue";
import { message } from "@/utils/message";
import { hasPerms } from "@/utils/auth";
import { addDialog } from "@/components/ReDialog";
import ResetForm, { type ResetFormModel } from "../reset-form.vue";
import {
  getStorageSettings,
  updateStorageSettings,
  resetStorageCredentials,
  getSmsSettings,
  updateSmsSettings,
  resetSmsCredentials,
  getWechatSettings,
  updateWechatSettings,
  resetWechatCredentials,
  getRealnameSettings,
  updateRealnameSettings,
  resetRealnameCredentials,
  type StorageSettings,
  type SmsSettings,
  type WechatSettings,
  type RealnameSettings
} from "@/api/srvf-system-settings";

type StorageModel = {
  providerType: string;
  enabled: boolean;
  bucket: string;
  region: string;
  envPrefix: string;
  uploadUrlTtlSeconds: number;
  downloadUrlTtlSeconds: number;
  lifecycleDays: number;
  enableSignedUrl: boolean;
  enableVersioning: boolean;
  remarks: string;
};
type SmsModel = {
  providerType: string;
  enabled: boolean;
  sdkAppId: string;
  signName: string;
  region: string;
  templateIdVerifyCode: string;
  templateIdBirthday: string;
  remarks: string;
};
type WechatModel = {
  providerType: string;
  enabled: boolean;
  appId: string;
  remarks: string;
};
type RealnameModel = {
  providerType: string;
  enabled: boolean;
  region: string;
  remarks: string;
};

export function useSystemSettings() {
  const formRef = ref();

  // 读权限(确认码:*-setting.read.singleton);重置凭证仅 SUPER_ADMIN(*-setting.reset.credentials,码不绑 ops-admin)
  const canReadStorage = hasPerms("storage-setting.read.singleton");
  const canReadSms = hasPerms("sms-setting.read.singleton");
  const canReadWechat = hasPerms("wechat-setting.read.singleton");
  const canReadRealname = hasPerms("realname-setting.read.singleton");
  const canResetStorage = hasPerms("storage-setting.reset.credentials");
  const canResetSms = hasPerms("sms-setting.reset.credentials");
  const canResetWechat = hasPerms("wechat-setting.reset.credentials");
  const canResetRealname = hasPerms("realname-setting.reset.credentials");

  const loading = ref(false);
  const storage = ref<StorageSettings | null>(null);
  const sms = ref<SmsSettings | null>(null);
  const wechat = ref<WechatSettings | null>(null);
  const realname = ref<RealnameSettings | null>(null);

  const storageModel = ref<StorageModel>({
    providerType: "",
    enabled: false,
    bucket: "",
    region: "",
    envPrefix: "",
    uploadUrlTtlSeconds: 0,
    downloadUrlTtlSeconds: 0,
    lifecycleDays: 0,
    enableSignedUrl: false,
    enableVersioning: false,
    remarks: ""
  });
  const smsModel = ref<SmsModel>({
    providerType: "",
    enabled: false,
    sdkAppId: "",
    signName: "",
    region: "",
    templateIdVerifyCode: "",
    templateIdBirthday: "",
    remarks: ""
  });
  const wechatModel = ref<WechatModel>({
    providerType: "",
    enabled: false,
    appId: "",
    remarks: ""
  });
  const realnameModel = ref<RealnameModel>({
    providerType: "",
    enabled: false,
    region: "",
    remarks: ""
  });

  async function loadAll() {
    loading.value = true;
    try {
      if (canReadStorage) {
        const { code, data } = await getStorageSettings();
        if (code === 0 && data) {
          storage.value = data;
          storageModel.value = {
            providerType: data.providerType,
            enabled: data.enabled,
            bucket: data.bucket ?? "",
            region: data.region ?? "",
            envPrefix: data.envPrefix ?? "",
            uploadUrlTtlSeconds: data.uploadUrlTtlSeconds,
            downloadUrlTtlSeconds: data.downloadUrlTtlSeconds,
            lifecycleDays: data.lifecycleDays,
            enableSignedUrl: data.enableSignedUrl,
            enableVersioning: data.enableVersioning,
            remarks: data.remarks ?? ""
          };
        }
      }
      if (canReadSms) {
        const { code, data } = await getSmsSettings();
        if (code === 0 && data) {
          sms.value = data;
          smsModel.value = {
            providerType: data.providerType,
            enabled: data.enabled,
            sdkAppId: data.sdkAppId ?? "",
            signName: data.signName ?? "",
            region: data.region ?? "",
            templateIdVerifyCode: data.templateIdVerifyCode ?? "",
            templateIdBirthday: data.templateIdBirthday ?? "",
            remarks: data.remarks ?? ""
          };
        }
      }
      if (canReadWechat) {
        const { code, data } = await getWechatSettings();
        if (code === 0 && data) {
          wechat.value = data;
          wechatModel.value = {
            providerType: data.providerType,
            enabled: data.enabled,
            appId: data.appId ?? "",
            remarks: data.remarks ?? ""
          };
        }
      }
      if (canReadRealname) {
        const { code, data } = await getRealnameSettings();
        if (code === 0 && data) {
          realname.value = data;
          realnameModel.value = {
            providerType: data.providerType,
            enabled: data.enabled,
            region: data.region ?? "",
            remarks: data.remarks ?? ""
          };
        }
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "加载系统设置失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  async function saveStorage() {
    try {
      const { code, data } = await updateStorageSettings(storageModel.value);
      if (code === 0) {
        storage.value = data;
        message("存储设置已保存", { type: "success" });
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "保存失败", { type: "error" });
    }
  }
  async function saveSms() {
    try {
      const { code, data } = await updateSmsSettings(smsModel.value);
      if (code === 0) {
        sms.value = data;
        message("短信设置已保存", { type: "success" });
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "保存失败", { type: "error" });
    }
  }
  async function saveWechat() {
    try {
      const { code, data } = await updateWechatSettings(wechatModel.value);
      if (code === 0) {
        wechat.value = data;
        message("微信设置已保存", { type: "success" });
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "保存失败", { type: "error" });
    }
  }
  async function saveRealname() {
    try {
      const { code, data } = await updateRealnameSettings(realnameModel.value);
      if (code === 0) {
        realname.value = data;
        message("实名核验设置已保存", { type: "success" });
      }
    } catch (error: any) {
      message(error?.response?.data?.message ?? "保存失败", { type: "error" });
    }
  }

  /** 重置凭证(仅 SUPER_ADMIN)；cloud=secretId/secretKey,wechat=appSecret */
  function openReset(kind: "storage" | "sms" | "wechat" | "realname") {
    const mode = kind === "wechat" ? "wechat" : "cloud";
    addDialog({
      title: `重置${{ storage: "存储", sms: "短信", wechat: "微信", realname: "实名核验" }[kind]}凭证`,
      width: "40%",
      draggable: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      props: {
        formInline: {
          secretId: "",
          secretKey: "",
          appSecret: ""
        } as ResetFormModel,
        mode
      },
      contentRenderer: () => h(ResetForm, { ref: formRef }),
      beforeSure: (done, { options, closeLoading }) => {
        const cur = options.props.formInline as ResetFormModel;
        formRef.value.getRef().validate(async (valid: boolean) => {
          if (!valid) {
            closeLoading();
            return;
          }
          try {
            if (kind === "wechat") {
              await resetWechatCredentials({ appSecret: cur.appSecret });
            } else {
              const body = { secretId: cur.secretId, secretKey: cur.secretKey };
              if (kind === "storage") await resetStorageCredentials(body);
              else if (kind === "sms") await resetSmsCredentials(body);
              else await resetRealnameCredentials(body);
            }
            message("凭证已重置", { type: "success" });
            done();
            loadAll();
          } catch (error: any) {
            message(error?.response?.data?.message ?? "重置失败", {
              type: "error"
            });
            closeLoading();
          }
        });
      }
    });
  }

  return {
    loading,
    canReadStorage,
    canReadSms,
    canReadWechat,
    canReadRealname,
    canResetStorage,
    canResetSms,
    canResetWechat,
    canResetRealname,
    storage,
    sms,
    wechat,
    realname,
    storageModel,
    smsModel,
    wechatModel,
    realnameModel,
    loadAll,
    saveStorage,
    saveSms,
    saveWechat,
    saveRealname,
    openReset
  };
}
