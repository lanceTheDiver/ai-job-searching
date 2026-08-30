import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const DEFAULT_RESUME_TEXT = `Lance｜Frontend Engineer

4 年 Web 开发经验，主要技术栈为 React、TypeScript、Next.js 与 Tailwind CSS。负责过两个 SaaS 产品的前端架构和性能优化，将首屏加载时间降低 35%。与产品、设计和后端团队协作完成需求拆解、开发与上线。

近期独立学习 LLM 应用工程，使用 Next.js Route Handler、OpenAI API 和 Zod 开发结构化内容分析工具。熟悉 Vitest 和 Playwright，能够阅读英文技术文档并参与英文会议。`;

type CandidateProfileState = {
  resumeText: string;
  resumeFileName: string;
  setResumeText: (resumeText: string) => void;
  setParsedResume: (resumeText: string, resumeFileName: string) => void;
  clearResume: () => void;
};

export const useCandidateProfileStore = create<CandidateProfileState>()(
  persist(
    (set) => ({
      resumeText: DEFAULT_RESUME_TEXT,
      resumeFileName: "",
      setResumeText: (resumeText) => set({ resumeText }),
      setParsedResume: (resumeText, resumeFileName) =>
        set({ resumeText, resumeFileName }),
      clearResume: () => set({ resumeText: "", resumeFileName: "" }),
    }),
    {
      name: "apply-pilot-candidate-profile",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ resumeText, resumeFileName }) => ({
        resumeText,
        resumeFileName,
      }),
    },
  ),
);
