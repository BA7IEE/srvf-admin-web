const statuses: Record<string, string> = {
  draft: "草稿",
  submitted: "已送审",
  returned: "已退回",
  approved: "审核通过",
  voided: "已作废"
};

export const statusLabel = (status: string) => statuses[status] ?? status;
export const postingLabel = (status: string | null) =>
  status === "committed" ? "已正式入账" : "未正式入账";
