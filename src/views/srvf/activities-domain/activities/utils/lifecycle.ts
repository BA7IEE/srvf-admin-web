import { h } from "vue";
import { ElMessageBox } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { addDialog } from "@/components/ReDialog";
import PublishConfirm, {
  type PublishConfirmModel
} from "../publish-confirm.vue";
import {
  publishActivity,
  completeActivity,
  activityBizErrorMessage
} from "@/api/srvf-activity";

/**
 * 活动生命周期动作的共享确认流程（P0-S1 / S2）。
 *
 * 发布与完结在**活动列表行**和**作战室头部**两处都要用，确认文案与契约要求
 * （publish 必须带人工勾选过的 `requiresInsuranceConfirmed`）必须一模一样，
 * 所以收在这里由两边共用，而不是各写一份、各自漂移。
 */

/** 发布/完结动作所需的最小活动信息（列表项与详情都满足这个形状） */
export type ActivityLifecycleTarget = {
  id: string;
  title: string;
  requiresInsurance: boolean;
};

/**
 * 打开「发布活动」确认弹窗（P0-S1）。
 *
 * 契约：`PATCH .../publish` body 必填 `{requiresInsuranceConfirmed:true}`。
 * 未勾选时**不发请求**——保险核对是后端要求的人工动作，前端不代劳。
 *
 * @param onDone 发布成功后的回调（一般是重拉列表 / 重拉详情）
 */
export function openPublishDialog(
  target: ActivityLifecycleTarget,
  onDone: () => void
) {
  addDialog({
    title: "发布活动",
    width: "38%",
    draggable: true,
    fullscreen: deviceDetection(),
    closeOnClickModal: false,
    sureBtnLoading: true,
    props: {
      formInline: {
        title: target.title,
        requiresInsurance: target.requiresInsurance,
        confirmed: false
      } as PublishConfirmModel
    },
    contentRenderer: () => h(PublishConfirm),
    beforeSure: async (done, { options, closeLoading }) => {
      const curData = options.props.formInline as PublishConfirmModel;
      if (!curData.confirmed) {
        message("请先勾选「我已核对本活动的保险要求」", { type: "warning" });
        closeLoading();
        return;
      }
      try {
        await publishActivity(target.id, { requiresInsuranceConfirmed: true });
        message("发布成功", { type: "success" });
        done();
        onDone();
      } catch (error: unknown) {
        message(activityBizErrorMessage(error, "发布失败"), { type: "error" });
        closeLoading();
      }
    }
  });
}

/**
 * 打开「完结活动」确认框（P0-S2）。
 *
 * 契约：`POST .../complete` **无 body**，published → completed，且是唯一完结通路
 * （考勤提交不再推进活动状态）。危险动作按 UX 十条第 4 条列清单：
 * 说清「将会发生什么」与「什么会保留」，不是一句「确定吗」。
 *
 * @param onDone 完结成功后的回调
 */
export function openCompleteDialog(
  target: Pick<ActivityLifecycleTarget, "id" | "title">,
  onDone: () => void
) {
  ElMessageBox.confirm(
    h("div", { class: "leading-6" }, [
      h("p", `确定要完结活动「${target.title}」吗？`),
      h("p", { class: "mt-2 font-medium" }, "完结后："),
      h("ul", { class: "mt-1 pl-4 list-disc text-xs" }, [
        h("li", "不能再新增报名，待审报名也不能再通过"),
        h("li", "参与核对、评价汇总等完结后才有的功能开始可用")
      ]),
      h("p", { class: "mt-2 font-medium" }, "会保留："),
      h("ul", { class: "mt-1 pl-4 list-disc text-xs" }, [
        h("li", "仍可继续补录和审核考勤"),
        h("li", "既有报名、考勤与贡献值记录原样保留")
      ])
    ]),
    "完结活动",
    {
      confirmButtonText: "确定完结",
      cancelButtonText: "再想想",
      type: "warning"
    }
  )
    .then(async () => {
      try {
        await completeActivity(target.id);
        message("活动已完结", { type: "success" });
        onDone();
      } catch (error: unknown) {
        // 按钮已按「published + 已结束」两条前置显隐，还撞上 20030 基本只剩
        // 「页面停留太久、状态被他人改过」这一种成因，所以文案直接指向刷新。
        message(
          activityBizErrorMessage(
            error,
            "完结失败：活动状态可能已被他人改动，请刷新后重试"
          ),
          { type: "error" }
        );
        onDone();
      }
    })
    .catch(() => {});
}
