import { z } from "zod";

export const workplaceSchema = z.enum(["any", "remote", "hybrid", "onsite"]);
export type Workplace = z.infer<typeof workplaceSchema>;

export const linkedInJobSearchRequestSchema = z.object({
  resumeText: z
    .string()
    .trim()
    .min(80, "简历内容至少需要 80 个字符")
    .max(30_000, "简历内容不能超过 30,000 个字符"),
  workplace: workplaceSchema,
});

export const jobSearchCriteriaSchema = z
  .object({
    keywords: z.string().trim().min(2).max(100),
    location: z.string().trim().min(2).max(100).nullable(),
  })
  .strict();

export const linkedInJobMatchSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  postedAt: z.string().nullable(),
  url: z.url(),
  matchScore: z.number().int().min(0).max(100),
  summary: z.string(),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
});

export const jobRankingSchema = z
  .object({
    jobs: z.array(
      z
        .object({
          id: z.string(),
          matchScore: z.number().int().min(0).max(100),
          summary: z.string(),
          matchedSkills: z.array(z.string()),
          missingSkills: z.array(z.string()),
        })
        .strict(),
    ),
  })
  .strict();

export type LinkedInJobSearchRequest = z.infer<
  typeof linkedInJobSearchRequestSchema
>;
export type JobSearchCriteria = z.infer<typeof jobSearchCriteriaSchema>;
export type LinkedInJobMatch = z.infer<typeof linkedInJobMatchSchema>;
export type JobRanking = z.infer<typeof jobRankingSchema>;
