import { z } from "zod";

import {
  jobSearchCriteriaSchema,
  jobSearchNoticeSchema,
  jobSourceSchema,
  linkedInJobMatchSchema,
  workplaceSchema,
} from "@/schemas/job-search";

export const searchHistoryErrorSchema = z.object({
  source: jobSourceSchema,
  message: z.string(),
});

export const searchHistoryRecordSchema = z.object({
  id: z.uuid(),
  workplace: workplaceSchema,
  resumeFileName: z.string().nullable(),
  criteria: jobSearchCriteriaSchema.nullable(),
  jobs: linkedInJobMatchSchema.array(),
  notices: jobSearchNoticeSchema.array(),
  errors: searchHistoryErrorSchema.array(),
  completedSources: jobSourceSchema.array(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
});

export const createSearchHistoryRequestSchema = z
  .object({
    workplace: workplaceSchema,
    resumeFileName: z.string().trim().max(200).nullable(),
  })
  .strict();

export const updateSearchHistoryRequestSchema = z
  .object({
    source: jobSourceSchema,
    jobs: linkedInJobMatchSchema.array().max(20),
    notices: jobSearchNoticeSchema.array().max(4),
    criteria: jobSearchCriteriaSchema.optional(),
    error: z.string().max(500).nullable(),
  })
  .strict();

export type SearchHistoryRecord = z.infer<typeof searchHistoryRecordSchema>;
export type CreateSearchHistoryRequest = z.infer<
  typeof createSearchHistoryRequestSchema
>;
export type UpdateSearchHistoryRequest = z.infer<
  typeof updateSearchHistoryRequestSchema
>;
