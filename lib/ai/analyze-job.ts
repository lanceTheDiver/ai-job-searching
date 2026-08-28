import { z } from "zod";

import {
  jobAnalysisSchema,
  type AnalyzeJobRequest,
  type JobAnalysis,
} from "@/schemas/job";

const DEFAULT_OMNIROUTE_BASE_URL = "http://localhost:20128/v1";

type OmniRouteResponse = {
  error?: { message?: string };
  output?: Array<{
    content?: Array<{ type?: string; text?: string; refusal?: string }>;
  }>;
};

export class JobAnalysisError extends Error {
  constructor(
    message: string,
    public readonly code: "CONFIGURATION" | "PROVIDER" | "INVALID_OUTPUT",
  ) {
    super(message);
    this.name = "JobAnalysisError";
  }
}

function getOutputText(response: OmniRouteResponse) {
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "refusal") {
        throw new JobAnalysisError(
          content.refusal ?? "模型拒绝了本次分析",
          "PROVIDER",
        );
      }
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new JobAnalysisError("模型没有返回可解析的分析结果", "INVALID_OUTPUT");
}

export async function analyzeJob(
  input: AnalyzeJobRequest,
): Promise<JobAnalysis> {
  const apiKey = process.env.OMNIROUTE_API_KEY;
  if (!apiKey) {
    throw new JobAnalysisError(
      "缺少 OMNIROUTE_API_KEY，请先在 .env.local 中配置",
      "CONFIGURATION",
    );
  }

  const baseUrl = (
    process.env.OMNIROUTE_BASE_URL ?? DEFAULT_OMNIROUTE_BASE_URL
  ).replace(/\/+$/, "");

  const jsonSchema = z.toJSONSchema(jobAnalysisSchema, {
    target: "draft-7",
    reused: "inline",
  });
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OMNIROUTE_MODEL ?? "auto",
        store: false,
        instructions:
          "你是一名严谨的技术招聘顾问。比较职位描述和候选人简历，只依据输入中的事实判断匹配度。输出使用简体中文；证据不足时明确指出，不要虚构候选人经历或公司信息。requirements 保留最重要的 4 到 8 项，建议必须具体、可执行。",
        input: `职位描述：\n${input.jobDescription}\n\n候选人简历：\n${input.resumeText}`,
        text: {
          format: {
            type: "json_schema",
            name: "job_analysis",
            strict: true,
            schema: jsonSchema,
          },
        },
      }),
    });
  } catch {
    throw new JobAnalysisError(
      `无法连接 OmniRoute，请确认服务已启动：${baseUrl}`,
      "PROVIDER",
    );
  }

  const payload = (await response.json()) as OmniRouteResponse;
  if (!response.ok) {
    throw new JobAnalysisError(
      payload.error?.message ?? "OmniRoute 服务暂时不可用",
      "PROVIDER",
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(getOutputText(payload));
  } catch (error) {
    if (error instanceof JobAnalysisError) throw error;
    throw new JobAnalysisError("模型返回的内容不是有效 JSON", "INVALID_OUTPUT");
  }

  const validated = jobAnalysisSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new JobAnalysisError("模型结果未通过 Zod 校验", "INVALID_OUTPUT");
  }
  return validated.data;
}
