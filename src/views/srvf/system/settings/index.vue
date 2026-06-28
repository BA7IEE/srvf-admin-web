<script setup lang="ts">
import { onMounted } from "vue";
import { useSystemSettings } from "./utils/hook";

defineOptions({
  name: "SrvfSystemSettings"
});

const {
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
} = useSystemSettings();

onMounted(() => {
  loadAll();
});

const anyRead =
  canReadStorage || canReadSms || canReadWechat || canReadRealname;
</script>

<template>
  <div class="main">
    <el-card v-if="anyRead" v-loading="loading" shadow="never">
      <el-tabs>
        <!-- 存储 -->
        <el-tab-pane v-if="canReadStorage" label="存储" name="storage">
          <el-form
            :model="storageModel"
            label-width="130px"
            class="settings-form"
          >
            <el-form-item label="Provider">
              <el-input v-model="storageModel.providerType" />
            </el-form-item>
            <el-form-item label="启用">
              <el-switch v-model="storageModel.enabled" />
            </el-form-item>
            <el-form-item label="Bucket">
              <el-input v-model="storageModel.bucket" />
            </el-form-item>
            <el-form-item label="Region">
              <el-input v-model="storageModel.region" />
            </el-form-item>
            <el-form-item label="环境前缀">
              <el-input v-model="storageModel.envPrefix" />
            </el-form-item>
            <el-form-item label="上传URL TTL(s)">
              <el-input-number
                v-model="storageModel.uploadUrlTtlSeconds"
                :min="0"
              />
            </el-form-item>
            <el-form-item label="下载URL TTL(s)">
              <el-input-number
                v-model="storageModel.downloadUrlTtlSeconds"
                :min="0"
              />
            </el-form-item>
            <el-form-item label="生命周期(天)">
              <el-input-number v-model="storageModel.lifecycleDays" :min="0" />
            </el-form-item>
            <el-form-item label="签名URL">
              <el-switch v-model="storageModel.enableSignedUrl" />
            </el-form-item>
            <el-form-item label="版本控制">
              <el-switch v-model="storageModel.enableVersioning" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input
                v-model="storageModel.remarks"
                type="textarea"
                :rows="2"
              />
            </el-form-item>
            <el-form-item label="凭证状态">
              <el-tag
                :type="storage?.credentialConfigured ? 'success' : 'info'"
              >
                {{ storage?.credentialStatus ?? "未配置" }}
              </el-tag>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveStorage">保存</el-button>
              <el-button v-if="canResetStorage" @click="openReset('storage')">
                重置凭证
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 短信 -->
        <el-tab-pane v-if="canReadSms" label="短信" name="sms">
          <el-form :model="smsModel" label-width="130px" class="settings-form">
            <el-form-item label="Provider">
              <el-input v-model="smsModel.providerType" />
            </el-form-item>
            <el-form-item label="启用">
              <el-switch v-model="smsModel.enabled" />
            </el-form-item>
            <el-form-item label="SdkAppId">
              <el-input v-model="smsModel.sdkAppId" />
            </el-form-item>
            <el-form-item label="签名">
              <el-input v-model="smsModel.signName" />
            </el-form-item>
            <el-form-item label="Region">
              <el-input v-model="smsModel.region" />
            </el-form-item>
            <el-form-item label="验证码模板ID">
              <el-input v-model="smsModel.templateIdVerifyCode" />
            </el-form-item>
            <el-form-item label="生日模板ID">
              <el-input v-model="smsModel.templateIdBirthday" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="smsModel.remarks" type="textarea" :rows="2" />
            </el-form-item>
            <el-form-item label="凭证状态">
              <el-tag :type="sms?.credentialConfigured ? 'success' : 'info'">
                {{ sms?.credentialStatus ?? "未配置" }}
              </el-tag>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveSms">保存</el-button>
              <el-button v-if="canResetSms" @click="openReset('sms')">
                重置凭证
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 微信 -->
        <el-tab-pane v-if="canReadWechat" label="微信" name="wechat">
          <el-form
            :model="wechatModel"
            label-width="130px"
            class="settings-form"
          >
            <el-form-item label="Provider">
              <el-input v-model="wechatModel.providerType" />
            </el-form-item>
            <el-form-item label="启用">
              <el-switch v-model="wechatModel.enabled" />
            </el-form-item>
            <el-form-item label="AppId">
              <el-input v-model="wechatModel.appId" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input
                v-model="wechatModel.remarks"
                type="textarea"
                :rows="2"
              />
            </el-form-item>
            <el-form-item label="凭证状态">
              <el-tag :type="wechat?.credentialConfigured ? 'success' : 'info'">
                {{ wechat?.credentialStatus ?? "未配置" }}
              </el-tag>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveWechat">保存</el-button>
              <el-button v-if="canResetWechat" @click="openReset('wechat')">
                重置凭证
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 实名核验 -->
        <el-tab-pane v-if="canReadRealname" label="实名核验" name="realname">
          <el-form
            :model="realnameModel"
            label-width="130px"
            class="settings-form"
          >
            <el-form-item label="Provider">
              <el-input v-model="realnameModel.providerType" />
            </el-form-item>
            <el-form-item label="启用">
              <el-switch v-model="realnameModel.enabled" />
            </el-form-item>
            <el-form-item label="Region">
              <el-input v-model="realnameModel.region" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input
                v-model="realnameModel.remarks"
                type="textarea"
                :rows="2"
              />
            </el-form-item>
            <el-form-item label="凭证状态">
              <el-tag
                :type="realname?.credentialConfigured ? 'success' : 'info'"
              >
                {{ realname?.credentialStatus ?? "未配置" }}
              </el-tag>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveRealname">保存</el-button>
              <el-button v-if="canResetRealname" @click="openReset('realname')">
                重置凭证
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    <el-empty v-else description="您没有查看系统设置的权限" />
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px 24px 0 !important;
}

.settings-form {
  max-width: 560px;
}
</style>
