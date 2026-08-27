import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApplyPilot — AI 求职助手",
  description: "用可验证的 AI 工作流分析职位、优化简历并自动推进求职流程",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
