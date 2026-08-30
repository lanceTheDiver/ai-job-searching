import type { JobSource } from "@/schemas/job-search";

export type SearchableJob = {
  id: string;
  source: JobSource;
  title: string;
  company: string | null;
  location: string | null;
  postedAt: string | null;
  salary: string | null;
  url: string;
  description: string;
};
