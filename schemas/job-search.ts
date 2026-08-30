import { z } from "zod";

export const workplaceSchema = z.enum(["any", "remote", "hybrid", "onsite"]);
export type Workplace = z.infer<typeof workplaceSchema>;

export const jobSourceSchema = z.enum(["linkedin", "boss"]);
export type JobSource = z.infer<typeof jobSourceSchema>;

export const jobSearchCriteriaRequestSchema = z.object({
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
    bossKeywords: z.string().trim().min(2).max(100),
    location: z.string().trim().min(2).max(100).nullable(),
    bossCity: z.string().trim().min(2).max(20),
  })
  .strict();

export const linkedInJobSearchRequestSchema =
  jobSearchCriteriaRequestSchema.extend({
    source: jobSourceSchema.optional(),
    criteria: jobSearchCriteriaSchema,
  });

export const linkedInJobMatchSchema = z.object({
  id: z.string(),
  source: jobSourceSchema,
  title: z.string(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  postedAt: z.string().nullable(),
  salary: z.string().nullable(),
  url: z.url(),
  matchScore: z.number().int().min(0).max(100),
  summary: z.string(),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
});

export const jobSearchNoticeSchema = z.object({
  source: jobSourceSchema,
  code: z.enum([
    "AUTH_REQUIRED",
    "BROWSER_UNAVAILABLE",
    "SOURCE_UNAVAILABLE",
    "EMPTY_RESULT",
  ]),
  message: z.string(),
  actionUrl: z.url().optional(),
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
export type JobSearchCriteriaRequest = z.infer<
  typeof jobSearchCriteriaRequestSchema
>;
export type JobSearchCriteria = z.infer<typeof jobSearchCriteriaSchema>;
export type JobMatch = z.infer<typeof linkedInJobMatchSchema>;
export type LinkedInJobMatch = JobMatch;
export type JobSearchNotice = z.infer<typeof jobSearchNoticeSchema>;
export type JobRanking = z.infer<typeof jobRankingSchema>;
