import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const DEFAULT_RESUME_TEXT = `Lance｜Frontend Engineer

4 年 Web 开发经验，主要技术栈为 React、TypeScript、Next.js 与 Tailwind CSS。负责过两个 SaaS 产品的前端架构和性能优化，将首屏加载时间降低 35%。与产品、设计和后端团队协作完成需求拆解、开发与上线。

近期独立学习 LLM 应用工程，使用 Next.js Route Handler、OpenAI API 和 Zod 开发结构化内容分析工具。熟悉 Vitest 和 Playwright，能够阅读英文技术文档并参与英文会议。`;

type CandidateProfileState = {
  resumeText: string;
  resumeFileName: string;
  resumeFileId: string;
  resumeFileSize: number;
  resumeUploadedAt: string;
  setResumeText: (resumeText: string) => void;
  setParsedResume: (
    resumeText: string,
    file: {
      id: string;
      name: string;
      size: number;
      uploadedAt: string;
    },
  ) => void;
  clearResume: () => void;
};

export const useCandidateProfileStore = create<CandidateProfileState>()(
  persist(
    (set) => ({
      resumeText: DEFAULT_RESUME_TEXT,
      resumeFileName: "",
      resumeFileId: "",
      resumeFileSize: 0,
      resumeUploadedAt: "",
      setResumeText: (resumeText) => set({ resumeText }),
      setParsedResume: (resumeText, file) =>
        set({
          resumeText,
          resumeFileName: file.name,
          resumeFileId: file.id,
          resumeFileSize: file.size,
          resumeUploadedAt: file.uploadedAt,
        }),
      clearResume: () =>
        set({
          resumeText: "",
          resumeFileName: "",
          resumeFileId: "",
          resumeFileSize: 0,
          resumeUploadedAt: "",
        }),
    }),
    {
      name: "apply-pilot-candidate-profile",
      storage: createJSONStorage(() => localStorage),
      partialize: ({
        resumeText,
        resumeFileName,
        resumeFileId,
        resumeFileSize,
        resumeUploadedAt,
      }) => ({
        resumeText,
        resumeFileName,
        resumeFileId,
        resumeFileSize,
        resumeUploadedAt,
      }),
    },
  ),
);
