import { z } from "zod";

import { jobSourceSchema } from "@/schemas/job-search";

export const applicationStatusSchema = z.enum([
  "preparing",
  "awaiting_login",
  "needs_attention",
  "awaiting_confirmation",
  "submitted",
  "failed",
  "cancelled",
]);

export const applicationRecordSchema = z.object({
  id: z.uuid(),
  jobId: z.string(),
  source: jobSourceSchema,
  jobTitle: z.string(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  postedAt: z.string().nullable(),
  salary: z.string().nullable(),
  jobUrl: z.url(),
  matchScore: z.number().int().min(0).max(100),
  resumeFileId: z.uuid(),
  resumeFileName: z.string(),
  status: applicationStatusSchema,
  statusMessage: z.string(),
  startedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  submittedAt: z.iso.datetime().nullable(),
});

export const prepareApplicationRequestSchema = z
  .object({
    job: z.object({
      id: z.string(),
      source: jobSourceSchema,
      title: z.string(),
      company: z.string().nullable(),
      location: z.string().nullable(),
      postedAt: z.string().nullable(),
      salary: z.string().nullable(),
      url: z.url(),
      matchScore: z.number().int().min(0).max(100),
    }),
    resumeFileId: z.uuid("请先上传并保留 PDF 简历"),
    resumeFileName: z.string().min(1),
    resumeText: z.string().max(30_000),
  })
  .strict()
  .refine(
    ({ job }) => {
      const hostname = new URL(job.url).hostname;
      const domain = job.source === "boss" ? "zhipin.com" : "linkedin.com";
      return hostname === domain || hostname.endsWith(`.${domain}`);
    },
    { message: "岗位链接与来源不匹配", path: ["job", "url"] },
  );

export const applicationActionRequestSchema = z
  .object({
    id: z.uuid(),
    action: z.enum(["continue", "confirm", "cancel"]),
  })
  .strict();

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type ApplicationRecord = z.infer<typeof applicationRecordSchema>;
export type PrepareApplicationRequest = z.infer<
  typeof prepareApplicationRequestSchema
>;
export type ApplicationActionRequest = z.infer<
  typeof applicationActionRequestSchema
>;
