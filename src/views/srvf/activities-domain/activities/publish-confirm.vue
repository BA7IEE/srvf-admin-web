<script setup lang="ts">
import { ref } from "vue";

/**
 * 发布活动确认弹窗内容（P0-S1）。
 *
 * 后端 v0.50 起 `PATCH .../publish` 的 body 必填 `{requiresInsuranceConfirmed:true}`，
 * 语义是「操作者已当面核对过本活动的保险要求」——所以这里必须**由人勾选**，
 * 不能在代码里写死 true 绕过核对（那样勾选框就成了摆设，等于把契约要求的人工确认伪造掉）。
 */

/** 发布确认模型；`confirmed` 由勾选框写回，调用侧在 beforeSure 里读它 */
export type PublishConfirmModel = {
  /** 活动标题（只读展示） */
  title: string;
  /** 本活动是否要求保险（后端 `requiresInsurance`，只读展示） */
  requiresInsurance: boolean;
  /** 操作者是否已勾选「我已核对」 */
  confirmed: boolean;
};

const props = withDefaults(
  defineProps<{
    formInline?: PublishConfirmModel;
  }>(),
  {
    formInline: () => ({
      title: "",
      requiresInsurance: false,
      confirmed: false
    })
  }
);

/**
 * 与仓内其它 addDialog 表单同一写法：持同一个对象引用，
 * 勾选写回的就是 `options.props.formInline`，调用侧 `beforeSure` 直接读得到。
 */
const newFormInline = ref(props.formInline);
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm/6">
      确定要发布活动「<span class="font-medium">{{ newFormInline.title }}</span
      >」吗？发布后将对符合条件的用户可见，并开始接受报名。
    </p>

    <el-alert
      :type="newFormInline.requiresInsurance ? 'warning' : 'info'"
      :closable="false"
      show-icon
    >
      <template #title>
        {{
          newFormInline.requiresInsurance
            ? "本活动要求保险"
            : "本活动不要求保险"
        }}
      </template>
      <template #default>
        <span class="text-xs/5">
          {{
            newFormInline.requiresInsurance
              ? "报名时会校验队员持有覆盖活动日期的有效保险，没有保险的队员将无法通过审批。"
              : "报名时不校验保险。如果这次活动其实需要保险，请先返回编辑活动、打开「要求保险」再发布。"
          }}
        </span>
      </template>
    </el-alert>

    <el-checkbox v-model="newFormInline.confirmed">
      我已核对本活动的保险要求
    </el-checkbox>
  </div>
</template>
