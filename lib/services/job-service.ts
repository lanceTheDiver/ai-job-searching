import type { AnalyzeJobRequest, JobAnalysis } from "@/schemas/job";

type AnalyzeJobResponse = { data?: JobAnalysis; error?: string };

export async function requestJobAnalysis(
  input: AnalyzeJobRequest,
): Promise<JobAnalysis> {
  const response = await fetch("/api/jobs/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as AnalyzeJobResponse;
  if (!response.ok || !payload.data)
    throw new Error(payload.error ?? "分析请求失败");
  return payload.data;
}
