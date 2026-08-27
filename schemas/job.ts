import { z } from "zod";

export const analyzeJobRequestSchema = z.object({
  jobDescription: z
    .string()
    .trim()
    .min(80, "职位描述至少需要 80 个字符")
    .max(20_000, "职位描述不能超过 20,000 个字符"),
  resumeText: z
    .string()
    .trim()
    .min(80, "简历内容至少需要 80 个字符")
    .max(30_000, "简历内容不能超过 30,000 个字符"),
});

const requirementSchema = z
  .object({
    skill: z.string(),
    importance: z.enum(["核心", "加分"]),
    evidence: z.string(),
    matched: z.boolean(),
  })
  .strict();

export const jobAnalysisSchema = z
  .object({
    roleTitle: z.string(),
    companyName: z.string().nullable(),
    matchScore: z.number().int().min(0).max(100),
    verdict: z.enum(["强烈推荐", "值得投递", "谨慎投递", "暂不推荐"]),
    summary: z.string(),
    requirements: z.array(requirementSchema),
    missingKeywords: z.array(z.string()),
    resumeSuggestions: z.array(z.string()),
    interviewQuestions: z.array(z.string()),
    nextAction: z.string(),
  })
  .strict();

export type AnalyzeJobRequest = z.infer<typeof analyzeJobRequestSchema>;
export type JobAnalysis = z.infer<typeof jobAnalysisSchema>;
