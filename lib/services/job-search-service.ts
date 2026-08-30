import type {
  LinkedInJobMatch,
  LinkedInJobSearchRequest,
} from "@/schemas/job-search";

type SearchJobsResponse = {
  data?: LinkedInJobMatch[];
  error?: string;
};

export async function requestLinkedInJobSearch(
  input: LinkedInJobSearchRequest,
) {
  const response = await fetch("/api/jobs/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as SearchJobsResponse;
  if (!response.ok || !payload.data) {
    throw new Error(payload.error ?? "岗位搜索请求失败");
  }
  return payload.data;
}
