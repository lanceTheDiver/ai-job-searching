import type { ApplicationRecord } from "@/schemas/application";

export const applicationStatusView: Record<
  ApplicationRecord["status"],
  { label: string; className: string }
> = {
  preparing: { label: "准备中", className: "bg-[#e8f0f8] text-[#35658d]" },
  awaiting_login: {
    label: "等待登录",
    className: "bg-[#fff3dc] text-[#9a611c]",
  },
  needs_attention: {
    label: "需要处理",
    className: "bg-[#fff3dc] text-[#9a611c]",
  },
  awaiting_confirmation: {
    label: "等待确认",
    className: "bg-[#e8f3ef] text-[#1f7565]",
  },
  submitted: { label: "已投递", className: "bg-[#e8f3ef] text-[#1f7565]" },
  failed: { label: "失败", className: "bg-[#f4ece9] text-[#9d5148]" },
  cancelled: {
    label: "已取消",
    className: "bg-[#eceeeb] text-[#172033]/50",
  },
};

export function formatApplicationDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
