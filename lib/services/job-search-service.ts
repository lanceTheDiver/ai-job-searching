import type {
  JobMatch,
  JobSearchCriteria,
  JobSearchCriteriaRequest,
  JobSource,
  JobSearchNotice,
  LinkedInJobSearchRequest,
} from "@/schemas/job-search";

type SearchJobsResponse = {
  data?: JobMatch[];
  notices?: JobSearchNotice[];
  criteria?: JobSearchCriteria;
  error?: string;
};

export async function requestJobSearchCriteria(
  input: JobSearchCriteriaRequest,
) {
  const response = await fetch("/api/jobs/search-criteria", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as {
    data?: JobSearchCriteria;
    error?: string;
  };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error ?? "无法生成岗位搜索条件");
  }
  return payload.data;
}

export async function requestJobSearch(
  input: Omit<LinkedInJobSearchRequest, "source">,
  source?: JobSource,
) {
  const response = await fetch("/api/jobs/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, source }),
  });
  const payload = (await response.json()) as SearchJobsResponse;
  if (!response.ok || !payload.data || !payload.criteria) {
    throw new Error(payload.error ?? "岗位搜索请求失败");
  }
  return {
    results: payload.data,
    notices: payload.notices ?? [],
    criteria: payload.criteria,
  };
}
