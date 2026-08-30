import {
  OmniRouteError,
  requestOmniRouteStructuredOutput,
} from "@/lib/services/omniroute-service";
import {
  jobAnalysisSchema,
  type AnalyzeJobRequest,
  type JobAnalysis,
} from "@/schemas/job";

export { OmniRouteError as JobAnalysisError };

export async function analyzeJob(
  input: AnalyzeJobRequest,
): Promise<JobAnalysis> {
  return requestOmniRouteStructuredOutput({
    schema: jobAnalysisSchema,
    schemaName: "job_analysis",
    instructions:
      "你是一名严谨的技术招聘顾问。比较职位描述和候选人简历，只依据输入中的事实判断匹配度。输出使用简体中文；证据不足时明确指出，不要虚构候选人经历或公司信息。requirements 保留最重要的 4 到 8 项，建议必须具体、可执行。",
    input: `职位描述：\n${input.jobDescription}\n\n候选人简历：\n${input.resumeText}`,
    operationName: "分析",
    resultName: "模型结果",
  });
}
