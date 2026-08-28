import type { AnalyzeJobRequest, JobAnalysis } from "@/schemas/job";

type AnalyzeJobResponse = { data?: JobAnalysis; error?: string };
type ParseResumeResponse = {
  data?: { text: string; fileName: string; pageCount: number };
  error?: string;
};

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

export async function requestResumeParsing(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/resumes/parse", {
    method: "POST",
    body: formData,
  });
  const payload = (await response.json()) as ParseResumeResponse;
  if (!response.ok || !payload.data)
    throw new Error(payload.error ?? "PDF 简历解析失败");
  return payload.data;
}
